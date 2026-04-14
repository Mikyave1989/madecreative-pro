/**
 * ScraperAgent — Google Maps scraper with Playwright stealth, Bright Data proxy rotation,
 * Fuse.js deduplication, and BullMQ-backed persistence.
 *
 * The browser is NOT started at module load time.  It is created lazily on the first
 * scraping tool call and torn down after the agent run completes.
 */
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { normalizePhone } from "@madecreative/shared";
import { scraperTools } from "./tools.js";
import { SCRAPER_SYSTEM_PROMPT, buildScraperUserPrompt } from "./prompt.js";
import {
  ScraperInputSchema,
  BusinessDataSchema,
  CheckDuplicateInputSchema,
  SearchGoogleMapsInputSchema,
  ExtractBusinessDetailsInputSchema,
  type BusinessData,
  type ProxySession,
} from "./types.js";

// ---------------------------------------------------------------------------
// Lazy-loaded heavy dependencies — never imported at the module top level so
// that the agents package does not require Playwright at boot time.
// ---------------------------------------------------------------------------

type BrowserType = import("playwright").BrowserType;
type Browser = import("playwright").Browser;
type BrowserContext = import("playwright").BrowserContext;
type Page = import("playwright").Page;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DELAY_MIN_MS = 3_000;
const DELAY_MAX_MS = 8_000;
const MAX_SCROLL_ATTEMPTS = 15;
const PROXY_REQUEST_LIMIT = 100;

// Google Maps selectors — multiple fallbacks per data point for resilience
// against UI changes.
const SELECTORS = {
  resultItem: [
    'a[href*="/maps/place/"]',
    '[role="article"] a',
    ".hfpxzc",
  ],
  businessName: [
    'h1[data-attrid="title"]',
    "h1.DUwDvf",
    "h1.fontHeadlineLarge",
    'h1[data-value="title"]',
    "h1",
  ],
  address: [
    'button[data-item-id="address"] .Io6YTe',
    '[data-tooltip="Copy address"] .Io6YTe',
    ".rogA2c .Io6YTe",
  ],
  phone: [
    'button[data-item-id^="phone:tel"] .Io6YTe',
    '[data-tooltip="Copy phone number"] .Io6YTe',
    'a[href^="tel:"]',
  ],
  website: [
    'a[data-item-id="authority"]',
    'a[href*="http"][aria-label*="website" i]',
    'a[data-tooltip="Open website"]',
  ],
  rating: ["span.MW4etd", "span.ceNzKf", '[aria-label*="stars"] span'],
  reviewCount: ["span.UY7F9", "span[aria-label*='reviews']"],
  category: ["button.DkEaL", "span.DkEaL"],
  photos: [
    'button[aria-label*="Photo"] img',
    '.ZKCDEc img',
    'div[role="img"] img',
  ],
  openingHours: [
    'div[aria-label*="hours" i] .t39EBf',
    ".o0Svhf",
    "[data-hide-tooltip-on-mouse-leave] span",
  ],
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomDelay(): Promise<void> {
  const ms =
    DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildProxyUrl(sessionId: string): string {
  const zone = process.env["BRIGHTDATA_ZONE"] ?? "residential";
  // BRIGHTDATA_PASSWORD is the proxy auth password (from Bright Data dashboard → Residential → Auth).
  // Fall back to BRIGHTDATA_API_KEY in case the same credential is reused.
  const password = process.env["BRIGHTDATA_PASSWORD"] ?? process.env["BRIGHTDATA_API_KEY"] ?? "";
  return `http://brd-customer-${zone}-zone-residential-session-${sessionId}:${password}@brd.superproxy.io:22225`;
}

function hasProxyCredentials(): boolean {
  return !!(process.env["BRIGHTDATA_PASSWORD"] ?? process.env["BRIGHTDATA_API_KEY"]);
}

function generateSessionId(): string {
  return `mc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// ScraperAgent
// ---------------------------------------------------------------------------

export class ScraperAgent extends BaseAgent {
  private browser: Browser | null = null;
  private browserContext: BrowserContext | null = null;
  private proxySession: ProxySession | null = null;

  /** Resolved country code for this run (first entry of countries array) */
  private currentCountry = "DE";

  constructor(context: AgentContext) {
    super(context);
  }

  // ── Tool declarations ───────────────────────────────────────────────────

  protected getTools(): Tool[] {
    return scraperTools;
  }

  // ── Tool dispatch ───────────────────────────────────────────────────────

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "search_google_maps":
        return this.toolSearchGoogleMaps(toolInput);
      case "extract_business_details":
        return this.toolExtractBusinessDetails(toolInput);
      case "check_duplicate":
        return this.toolCheckDuplicate(toolInput);
      case "save_prospect":
        return this.toolSaveProspect(toolInput);
      case "rotate_proxy_session":
        return this.toolRotateProxySession();
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // ── Browser lifecycle ───────────────────────────────────────────────────

  private async setupBrowser(): Promise<Page> {
    if (this.browser && this.browserContext) {
      return this.browserContext.newPage();
    }

    this.log("info", "Launching Playwright browser");

    // Dynamic imports — only loaded when a scraping job actually runs.
    const { chromium } = await import("playwright");

    // Try to use playwright-extra + stealth plugin for better anti-bot bypass.
    // playwright-extra can be exported as { chromium } directly (ESM) or under .default (CJS),
    // and the stealth plugin can also have different shapes — wrap everything in try/catch
    // and fall back to vanilla playwright if anything fails.
    let launcher: BrowserType = chromium;
    try {
      const pwExtraRaw = await import("playwright-extra");
      // Handle both ESM ({ chromium }) and CJS ({ default: { chromium } }) exports
      const pwExtra = (pwExtraRaw as unknown as { chromium?: { use?: (p: unknown) => unknown } }).chromium
        ?? ((pwExtraRaw as unknown as { default?: { chromium?: { use?: (p: unknown) => unknown } } }).default?.chromium);

      if (pwExtra && typeof pwExtra.use === "function") {
        const stealthRaw = await import("puppeteer-extra-plugin-stealth");
        const stealthFn = (stealthRaw as unknown as { default?: () => unknown }).default
          ?? (stealthRaw as unknown as (() => unknown));
        if (typeof stealthFn === "function") {
          pwExtra.use(stealthFn());
          launcher = pwExtra as unknown as BrowserType;
          this.log("info", "Stealth plugin loaded");
        }
      } else {
        this.log("warn", "playwright-extra.chromium.use not available — using vanilla playwright");
      }
    } catch (stealthErr) {
      this.log("warn", `Stealth plugin load failed (${(stealthErr as Error).message}) — using vanilla playwright`);
    }

    const launchOptions: Parameters<BrowserType["launch"]>[0] = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    };

    this.browser = await launcher.launch(launchOptions);

    // Bright Data rotating proxy — only when credentials are configured.
    // Without BRIGHTDATA_PASSWORD/BRIGHTDATA_API_KEY the proxy URL has an empty
    // password and auth fails silently, returning 0 results on every search.
    // In that case we skip the proxy and scrape directly (works fine for dev/test;
    // set BRIGHTDATA_PASSWORD in production for IP rotation + anti-bot bypass).
    const useProxy = hasProxyCredentials();
    if (!useProxy) {
      this.log("warn", "No Bright Data credentials — scraping WITHOUT proxy (direct connection)");
    }

    const session = this.getOrCreateProxySession();
    const contextOptions: Parameters<typeof this.browser.newContext>[0] = {
      viewport: { width: 1920, height: 1080 },
      locale: "de-DE",
      timezoneId: "Europe/Berlin",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36",
      extraHTTPHeaders: {
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    };

    if (useProxy) {
      const proxyUrl = buildProxyUrl(session.sessionId);
      const parsedProxy = new URL(proxyUrl);
      contextOptions.proxy = {
        server: `${parsedProxy.protocol}//${parsedProxy.host}`,
        username: parsedProxy.username,
        password: decodeURIComponent(parsedProxy.password),
      };
      this.log("info", `Using Bright Data proxy session: ${session.sessionId}`);
    }

    this.browserContext = await this.browser.newContext(contextOptions);

    // Block unnecessary resources to speed up scraping
    await this.browserContext.route(
      "**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,otf}",
      (route) => route.abort()
    );
    await this.browserContext.route("**/*analytics*", (route) => route.abort());
    await this.browserContext.route("**/*doubleclick*", (route) =>
      route.abort()
    );

    return this.browserContext.newPage();
  }

  private async closeBrowser(): Promise<void> {
    if (this.browserContext) {
      await this.browserContext.close().catch(() => undefined);
      this.browserContext = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = null;
    }
  }

  // ── Proxy session management ────────────────────────────────────────────

  private getOrCreateProxySession(): ProxySession {
    if (
      !this.proxySession ||
      this.proxySession.requestCount >= PROXY_REQUEST_LIMIT
    ) {
      this.proxySession = {
        sessionId: generateSessionId(),
        proxyUrl: "",
        requestCount: 0,
        createdAt: new Date(),
      };
      this.log("info", `New proxy session: ${this.proxySession.sessionId}`);
    }
    return this.proxySession;
  }

  private incrementProxyRequest(): void {
    if (this.proxySession) {
      this.proxySession.requestCount += 1;
    }
  }

  // ── Tool implementations ────────────────────────────────────────────────

  private async toolSearchGoogleMaps(
    rawInput: Record<string, unknown>
  ): Promise<unknown> {
    const parsed = SearchGoogleMapsInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}`, results: [] };
    }

    const { query, city, country } = parsed.data;
    this.currentCountry = country;

    this.log("info", `Searching Google Maps: "${query}" in ${city}`);

    let page: Page | null = null;
    try {
      page = await this.setupBrowser();

      const encodedQuery = encodeURIComponent(query);
      const mapsUrl = `https://www.google.com/maps/search/${encodedQuery}/@48.1351,11.5820,13z?hl=de`;

      await page.goto(mapsUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });

      // Wait for result list to populate
      await page
        .waitForSelector('[role="feed"], .section-result, .hfpxzc', {
          timeout: 15_000,
        })
        .catch(() => undefined);

      // Scroll the sidebar to load more results
      const businessUrls = await this.scrollAndCollectUrls(page);
      this.incrementProxyRequest();

      this.log("info", `Found ${businessUrls.length} business URLs for "${query}"`);

      return {
        query,
        city,
        country,
        results: businessUrls.map((url) => ({ businessUrl: url })),
        count: businessUrls.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log("warn", `search_google_maps error: ${message}`);
      return { error: message, results: [], count: 0 };
    } finally {
      if (page) await page.close().catch(() => undefined);
    }
  }

  private async scrollAndCollectUrls(page: Page): Promise<string[]> {
    const collected = new Set<string>();

    // Collect URLs from the current viewport first
    await this.collectVisibleUrls(page, collected);

    // Scroll the results panel to load more
    for (let i = 0; i < MAX_SCROLL_ATTEMPTS; i++) {
      const prevSize = collected.size;

      // Try to find and scroll the results sidebar.
      // The callback runs in the browser page context — use a string expression
      // to avoid TypeScript DOM-lib errors in the Node environment.
      await page
        .evaluate(
          // eslint-disable-next-line @typescript-eslint/no-implied-eval
          new Function(`
            var feed = document.querySelector('[role="feed"]') || document.querySelector(".m6QErb");
            if (feed && feed.scrollBy) { feed.scrollBy(0, 800); }
            else if (window.scrollBy) { window.scrollBy(0, 800); }
          `) as () => void
        )
        .catch(() => undefined);

      await page.waitForTimeout(1_200);
      await this.collectVisibleUrls(page, collected);

      // Check for end-of-list sentinel
      const endText = await page
        .textContent(".HlvSq, .section-no-result")
        .catch(() => "");
      if (endText && endText.length > 0) break;

      // No new results loaded — stop scrolling
      if (collected.size === prevSize && i > 2) break;
    }

    return Array.from(collected);
  }

  private async collectVisibleUrls(
    page: Page,
    collected: Set<string>
  ): Promise<void> {
    for (const selector of SELECTORS.resultItem) {
      const links = await page
        .$$eval(selector, (els) =>
          els
            .map((el) => ((el as unknown as { href?: string }).href ?? ""))
            .filter((h) => h.includes("/maps/place/"))
        )
        .catch(() => [] as string[]);

      for (const url of links) {
        // Normalise URL — strip tracking params
        try {
          const u = new URL(url);
          // Keep only the path which contains the place identifier
          const cleanUrl = `https://www.google.com${u.pathname}`;
          collected.add(cleanUrl);
        } catch {
          collected.add(url);
        }
      }

      if (links.length > 0) break;
    }
  }

  private async toolExtractBusinessDetails(
    rawInput: Record<string, unknown>
  ): Promise<unknown> {
    const parsed = ExtractBusinessDetailsInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
    }

    const { businessUrl } = parsed.data;

    // Enforce random delay to avoid detection
    await randomDelay();

    let page: Page | null = null;
    try {
      page = await this.setupBrowser();
      await page.goto(businessUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      // Wait for primary content
      await page
        .waitForSelector("h1, .DUwDvf", { timeout: 12_000 })
        .catch(() => undefined);

      this.incrementProxyRequest();

      const data = await this.extractFromPage(page, businessUrl);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log("warn", `extract_business_details error for ${businessUrl}: ${message}`);
      return { error: message };
    } finally {
      if (page) await page.close().catch(() => undefined);
    }
  }

  private async extractFromPage(
    page: Page,
    mapsUrl: string
  ): Promise<Partial<BusinessData>> {
    async function trySelectors(
      selectors: readonly string[],
      attr?: string
    ): Promise<string | null> {
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (!el) continue;
          const text = attr
            ? await el.getAttribute(attr)
            : await el.innerText();
          if (text && text.trim()) return text.trim();
        } catch {
          // try next
        }
      }
      return null;
    }

    const companyName =
      (await trySelectors(SELECTORS.businessName)) ?? "Unknown";
    const address = await trySelectors(SELECTORS.address);
    const phone = await trySelectors(SELECTORS.phone);
    const websiteEl = await page.$(SELECTORS.website[0]).catch(() => null);
    const website = websiteEl
      ? await websiteEl
          .getAttribute("href")
          .catch(() => null)
      : null;
    const ratingText = await trySelectors(SELECTORS.rating);
    const reviewText = await trySelectors(SELECTORS.reviewCount);
    const category = await trySelectors(SELECTORS.category);
    const openingHours = await trySelectors(SELECTORS.openingHours);

    // Phone from tel: link as fallback
    const telHref = await page
      .$eval('a[href^="tel:"]', (el) => (el as unknown as { href: string }).href)
      .catch(() => null);
    const resolvedPhone = phone ?? (telHref ? telHref.replace("tel:", "") : null);

    // Extract up to 3 photo URLs
    const photoUrls: string[] = [];
    for (const sel of SELECTORS.photos) {
      if (photoUrls.length >= 3) break;
      const imgs = await page
        .$$eval(sel, (els) =>
          els
            .map((el) => ((el as unknown as { src?: string }).src ?? ""))
            .filter((s) => s.startsWith("http"))
            .slice(0, 10) // Google Maps shows limited photos
        )
        .catch(() => [] as string[]);
      photoUrls.push(...imgs);
    }

    // Parse Google rating
    let googleRating: number | undefined;
    if (ratingText) {
      const num = parseFloat(ratingText.replace(",", "."));
      if (!isNaN(num) && num >= 0 && num <= 5) googleRating = num;
    }

    // Parse review count
    let reviewCount: number | undefined;
    if (reviewText) {
      const digits = reviewText.replace(/\D/g, "");
      if (digits) reviewCount = parseInt(digits, 10);
    }

    // Parse city from address
    let city: string | undefined;
    if (address) {
      // German/European addresses typically end with "PostCode City"
      const parts = address.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const last = parts[parts.length - 1] ?? "";
        // Strip postal code prefix
        city = last.replace(/^\d{4,6}\s*/, "").trim() || last;
      }
    }

    // Extract logo + extra photos + full content from the business website
    let logoUrl: string | undefined;
    let scrapedContent: Record<string, unknown> | null = null;
    if (website) {
      try {
        await page.goto(website, { waitUntil: "domcontentloaded", timeout: 10_000 });
        // Try multiple logo sources in priority order
        logoUrl = await page.evaluate(() => {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const icons: any[] = Array.from(document.querySelectorAll(
            'link[rel="apple-touch-icon"], link[rel="icon"][sizes], link[rel="shortcut icon"]'
          ));
          const best = icons
            .filter((l: any) => l.href && l.href.startsWith("http"))
            .sort((a: any, b: any) => {
              const sA = parseInt(a.sizes?.toString()?.split("x")[0] ?? "0");
              const sB = parseInt(b.sizes?.toString()?.split("x")[0] ?? "0");
              return sB - sA;
            })[0];
          if (best?.href) return best.href as string;
          const og: any = document.querySelector('meta[property="og:image"]');
          if (og?.content?.startsWith("http")) return og.content as string;
          const headerImgs: any[] = Array.from(document.querySelectorAll("header img, nav img, .logo img, img.logo, [class*='logo'] img, img[alt*='logo' i], img[src*='logo' i]"));
          const logoImg = headerImgs.find((i: any) => i.src?.startsWith("http") && i.naturalWidth > 30);
          if (logoImg) return logoImg.src as string;
          return null;
        }) ?? undefined;

        // Extract additional photos from the website (up to 15 total)
        if (photoUrls.length < 15) {
          const sitePhotos = await page.evaluate((existingCount: number) => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const imgs: any[] = Array.from(document.querySelectorAll("img"));
            return imgs
              .filter((i: any) => i.src?.startsWith("http") && i.naturalWidth >= 200 && i.naturalHeight >= 150)
              .filter((i: any) => !/logo|icon|avatar|sprite|badge|banner-ad|tracking|pixel/i.test(i.src + (i.alt ?? "") + (i.className ?? "")))
              .map((i: any) => i.src as string); // No limit — save ALL photos
          }, photoUrls.length).catch(() => [] as string[]);
          photoUrls.push(...sitePhotos);
        }

        // ── Scrape FULL website content: headings, paragraphs, colors, fonts ──
        scrapedContent = await page.evaluate(() => {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((h: any) => ({
            tag: h.tagName.toLowerCase(),
            text: h.textContent?.trim().slice(0, 300) || "",
          })).filter((h) => h.text.length > 2).slice(0, 30);

          const paragraphs = Array.from(document.querySelectorAll("p, li, .text, [class*='desc'], [class*='content']"))
            .map((p: any) => p.textContent?.trim() || "")
            .filter((t) => t.length > 30)
            .slice(0, 40);

          // Extract all images with alt text
          const images = Array.from(document.querySelectorAll("img"))
            .filter((i: any) => i.src?.startsWith("http") && i.naturalWidth >= 100)
            .map((i: any) => ({ url: i.src, alt: i.alt || "", width: i.naturalWidth, height: i.naturalHeight }))
            .slice(0, 20);

          // Extract colors from computed styles
          const sampleEls = [document.body, ...Array.from(document.querySelectorAll("header, nav, main, footer, h1, h2, a, button")).slice(0, 10)];
          const colorSet = new Set<string>();
          for (const el of sampleEls) {
            if (!el) continue;
            const s = getComputedStyle(el);
            [s.color, s.backgroundColor, s.borderColor].forEach((c) => {
              if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") colorSet.add(c);
            });
          }

          // Extract font families
          const fontSet = new Set<string>();
          for (const el of sampleEls) {
            if (!el) continue;
            const ff = getComputedStyle(el).fontFamily;
            if (ff) fontSet.add(ff.split(",")[0]?.trim().replace(/['"]/g, "") || "");
          }

          // Extract navigation links
          const navigation = Array.from(document.querySelectorAll("nav a, header a, .menu a"))
            .map((a: any) => ({ text: a.textContent?.trim() || "", href: a.href || "" }))
            .filter((n) => n.text.length > 0 && n.text.length < 50)
            .slice(0, 30); // keep reasonable nav limit

          return {
            headings,
            paragraphs,
            images,
            colors: Array.from(colorSet).slice(0, 30),
            fonts: Array.from(fontSet).filter(Boolean).slice(0, 10),
            navigation,
            title: document.title || "",
            metaDescription: (document.querySelector('meta[name="description"]') as any)?.content || "",
          };
        }).catch(() => null);
      } catch {
        // Non-fatal — website might be slow or down
      }
    }

    return {
      companyName,
      address: address ?? undefined,
      contactPhone: resolvedPhone
        ? normalizePhone(resolvedPhone, this.currentCountry)
        : undefined,
      website: website ?? undefined,
      googleMapsUrl: mapsUrl,
      googleRating,
      reviewCount,
      sector: category ?? "other",
      hasWebsite: Boolean(website),
      city,
      country: this.currentCountry,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      logoUrl,
      openingHours: openingHours ?? undefined,
      scrapedContent: scrapedContent ?? undefined,
    };
  }

  private async toolCheckDuplicate(
    rawInput: Record<string, unknown>
  ): Promise<unknown> {
    const parsed = CheckDuplicateInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        isDuplicate: false,
        error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}`,
      };
    }

    const { name, city, phone, email } = parsed.data;

    return this.deduplicateProspect({ name, city, phone, email });
  }

  private async deduplicateProspect(params: {
    name: string;
    city?: string;
    phone?: string;
    email?: string;
  }): Promise<{ isDuplicate: boolean; matchedId?: string; matchReason?: string }> {
    const { name, city, phone, email } = params;

    // 1. Exact phone match
    if (phone) {
      const normalised = normalizePhone(phone, this.currentCountry);
      if (normalised) {
        const existing = await prisma.prospect.findFirst({
          where: { contactPhone: normalised },
          select: { id: true },
        });
        if (existing) {
          return {
            isDuplicate: true,
            matchedId: existing.id,
            matchReason: "phone_exact",
          };
        }
        // Also check in clients
        const existingClient = await prisma.client.findFirst({
          where: { phone: normalised },
          select: { id: true },
        });
        if (existingClient) {
          return {
            isDuplicate: true,
            matchedId: existingClient.id,
            matchReason: "client_phone_exact",
          };
        }
      }
    }

    // 2. Exact email match
    if (email) {
      const emailLower = email.toLowerCase();
      const existingByEmail = await prisma.prospect.findFirst({
        where: { contactEmail: { equals: emailLower, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingByEmail) {
        return {
          isDuplicate: true,
          matchedId: existingByEmail.id,
          matchReason: "email_exact",
        };
      }
      const existingClientByEmail = await prisma.client.findFirst({
        where: { email: { equals: emailLower, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingClientByEmail) {
        return {
          isDuplicate: true,
          matchedId: existingClientByEmail.id,
          matchReason: "client_email_exact",
        };
      }
    }

    // 3. Fuzzy name + city match using Fuse.js
    const candidates = await prisma.prospect.findMany({
      where: city
        ? { city: { contains: city, mode: "insensitive" } }
        : {},
      select: { id: true, companyName: true, city: true },
      take: 500,
    });

    if (candidates.length > 0) {
      const { default: Fuse } = await import("fuse.js");
      const fuse = new Fuse(candidates, {
        keys: ["companyName"],
        threshold: 0.2, // strict match
        includeScore: true,
      });

      const results = fuse.search(name);
      const topResult = results[0];
      if (topResult?.item) {
        const matchedItem = topResult.item as { id: string; companyName: string };
        return {
          isDuplicate: true,
          matchedId: matchedItem.id,
          matchReason: `fuzzy_name (score: ${topResult.score?.toFixed(3) ?? "?"})`,
        };
      }
    }

    return { isDuplicate: false };
  }

  private async toolSaveProspect(
    rawInput: Record<string, unknown>
  ): Promise<unknown> {
    const parsed = BusinessDataSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid prospect data: ${JSON.stringify(parsed.error.flatten())}`,
      };
    }

    return this.saveToDB(parsed.data, undefined);
  }

  private async saveToDB(
    data: BusinessData,
    scrapeConfigId: string | undefined
  ): Promise<unknown> {
    try {
      const prospect = await prisma.prospect.create({
        data: {
          companyName: data.companyName,
          contactName: data.contactName ?? null,
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone
            ? normalizePhone(data.contactPhone, data.country)
            : null,
          website: data.website ?? null,
          googleMapsUrl: data.googleMapsUrl,
          googleRating: data.googleRating ?? null,
          reviewCount: data.reviewCount ?? null,
          country: data.country,
          city: data.city ?? null,
          region: data.region ?? null,
          sector: data.sector,
          employeeEstimate: data.employeeEstimate ?? null,
          hasWebsite: data.hasWebsite,
          photoUrls: data.photoUrls ?? [],
          logoUrl: data.logoUrl ?? null,
          photoQuality: (data.photoUrls?.length ?? 0) > 0 ? 70 : 0,
          scrapedContent: (data as Record<string, unknown>).scrapedContent ?? null,
          status: "SCRAPED",
          source: "GOOGLE_MAPS",
          scrapeJobId: this.jobId,
        },
      });

      // Update ScrapeConfig counters if we know the config id
      if (scrapeConfigId) {
        await prisma.scrapeConfig
          .update({
            where: { id: scrapeConfigId },
            data: {
              totalFound: { increment: 1 },
              lastRunAt: new Date(),
            },
          })
          .catch(() => undefined); // non-fatal
      }

      this.log("info", `Saved prospect: ${data.companyName} (${data.city})`);
      return { success: true, prospectId: prospect.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log("error", `Failed to save prospect ${data.companyName}: ${message}`);
      return { success: false, error: message };
    }
  }

  private async toolRotateProxySession(): Promise<unknown> {
    // Close existing browser so the next setupBrowser() call creates a fresh
    // context with a new proxy session ID.
    await this.closeBrowser();

    // Force new session
    this.proxySession = null;
    const session = this.getOrCreateProxySession();

    this.log("info", `Rotated proxy session → ${session.sessionId}`);
    return { success: true, newSessionId: session.sessionId };
  }

  // ── Main entry point ────────────────────────────────────────────────────

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = ScraperInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: 0,
        tokensUsed: 0,
        durationMs: 0,
        toolCalls: [],
      };
    }

    const { sector, countries, cities, keywords, maxResults, minRating } =
      parsed.data;

    // Resolve country list — support both new and legacy field names
    const resolvedCountries: string[] =
      countries?.length
        ? countries
        : parsed.data.country
        ? [parsed.data.country]
        : ["DE"];

    // Resolve config id — support both field names
    const configId =
      parsed.data.scrapeConfigId ?? parsed.data.configId;

    this.currentCountry = resolvedCountries[0] ?? "DE";

    try {
      await this.markJobStarted();
      this.log("info", "Scraper agent starting", {
        sector,
        countries: resolvedCountries,
        cities,
        keywords,
        maxResults,
      });
      await this.updateProgress(5);

      const userPrompt = buildScraperUserPrompt({
        sector,
        countries: resolvedCountries,
        cities,
        keywords,
        maxResults,
        minRating,
      });

      await this.updateProgress(10);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        SCRAPER_SYSTEM_PROMPT,
        { maxTokens: 4096 }
      );

      await this.updateProgress(90);

      // Update ScrapeConfig.lastRunAt
      if (configId) {
        await prisma.scrapeConfig
          .update({
            where: { id: configId },
            data: { lastRunAt: new Date() },
          })
          .catch(() => undefined);
      }

      const output: Record<string, unknown> = {
        ...((result.data as Record<string, unknown>) ?? {}),
        toolCallCount: this.toolCalls.length,
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      this.log("info", "Scraper agent completed successfully");

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Scraper agent failed: ${error}`);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: 0,
        toolCalls: this.toolCalls,
      };
    } finally {
      await this.closeBrowser();
    }
  }
}
