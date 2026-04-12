import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { analyzerTools } from "./tools.js";
import { ANALYZER_SYSTEM_PROMPT, buildAnalyzerUserPrompt } from "./prompt.js";
import { AnalyzerInputSchema } from "./types.js";
import type {
  WebsiteAnalysis,
  WebsiteTech,
  SocialAnalysis,
} from "./types.js";

// ─── Website Analysis Implementation ─────────────────────────────────────────

async function performWebsiteAnalysis(url: string): Promise<WebsiteAnalysis> {
  // Dynamic import so Playwright browser only loads when needed
  const { chromium } = await import("playwright");

  const defaultResult: WebsiteAnalysis = {
    reachable: false,
    url,
    score: 0,
    hasSSL: url.startsWith("https://"),
    performance: { lcp: null, fcp: null, tti: null },
    seo: {
      hasTitle: false,
      hasDescription: false,
      hasH1: false,
      hasSitemap: false,
      titleLength: null,
      descriptionLength: null,
    },
    mobile: { hasViewportMeta: false, hasResponsiveCSS: false },
    hasContactForm: false,
    hasCTA: false,
    imageCount: 0,
    textQualityScore: 0,
    breakdown: {},
  };

  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (compatible; MadeCreativeBot/1.0; +https://madecreative.io)",
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Collect performance timing via CDP
    const navigationStart = Date.now();
    const perfEntries: Array<{ name: string; startTime: number; duration: number }> = [];

    page.on("console", () => {
      // consume console to avoid noise
    });

    // Navigate with timeout
    const response = await page
      .goto(url, { timeout: 15000, waitUntil: "domcontentloaded" })
      .catch(() => null);

    if (!response || !response.ok()) {
      return defaultResult;
    }

    // Measure rough LCP / FCP via performance API
    // We use `unknown` casts because TypeScript's lib.dom EntryType is
    // stricter than what Playwright exposes in the browser context.
    const perfData = await page
      .evaluate(() => {
        const perf = performance as unknown as {
          getEntriesByType: (type: string) => Array<{
            name: string;
            startTime: number;
            domInteractive?: number;
          }>;
        };

        const entries = perf.getEntriesByType("navigation");
        const paintEntries = perf.getEntriesByType("paint");
        const lcpEntries = perf.getEntriesByType("largest-contentful-paint");

        const nav = entries[0];
        const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
        const lcp = lcpEntries[lcpEntries.length - 1];

        return {
          domInteractive: nav?.domInteractive ?? null,
          fcp: fcp ? fcp.startTime : null,
          lcp: lcp ? lcp.startTime : null,
        };
      })
      .catch(() => ({ domInteractive: null, fcp: null, lcp: null }));

    void navigationStart;
    void perfEntries;

    // Extract HTML for analysis via cheerio
    const html = await page.content();

    // Dynamic import cheerio
    const { load } = await import("cheerio");
    const $ = load(html);

    // SEO signals
    const title = $("title").first().text().trim();
    const metaDesc = $('meta[name="description"]').attr("content") ?? "";
    const h1Text = $("h1").first().text().trim();
    const hasSitemap = await fetch(new URL("/sitemap.xml", url).toString(), {
      signal: AbortSignal.timeout(5000),
    })
      .then((r) => r.ok)
      .catch(() => false);

    // Mobile signals
    const viewportMeta = $('meta[name="viewport"]').attr("content") ?? "";
    const hasViewportMeta = viewportMeta.toLowerCase().includes("width=device-width");
    const inlineStyles = $("style").text();
    const hasLinkedStylesheets = $("link[rel=stylesheet]").length > 0;
    const styleContent = inlineStyles + (hasLinkedStylesheets ? " linked" : "");
    const hasResponsiveCSS =
      styleContent.includes("@media") ||
      html.toLowerCase().includes("@media") ||
      html.toLowerCase().includes("bootstrap") ||
      html.toLowerCase().includes("tailwind");

    // Contact / CTA signals
    const hasContactForm =
      $("form").length > 0 ||
      html.toLowerCase().includes("contact") ||
      html.toLowerCase().includes("contatto") ||
      html.toLowerCase().includes("kontakt");

    const ctaKeywords = ["prenota", "book", "reserve", "signup", "register", "contattaci", "contact us", "get started", "inizia"];
    const bodyText = $("body").text().toLowerCase();
    const hasCTA = ctaKeywords.some((kw) => bodyText.includes(kw));

    // Image count
    const imageCount = $("img").length;

    // Text quality: word count on visible text
    const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 2).length;
    const textQualityScore = Math.min(100, Math.round((wordCount / 300) * 100));

    // Score calculation
    const breakdown: Record<string, number> = {
      ssl: url.startsWith("https://") ? 10 : 0,
      title: title.length > 10 ? 10 : title.length > 0 ? 5 : 0,
      description: metaDesc.length > 30 ? 10 : metaDesc.length > 0 ? 5 : 0,
      h1: h1Text.length > 0 ? 8 : 0,
      sitemap: hasSitemap ? 5 : 0,
      mobile: hasViewportMeta ? 12 : 0,
      responsiveCss: hasResponsiveCSS ? 8 : 0,
      contactForm: hasContactForm ? 10 : 0,
      cta: hasCTA ? 8 : 0,
      images: Math.min(9, imageCount),
      textQuality: Math.round(textQualityScore * 0.1),
      fcp:
        perfData.fcp != null
          ? perfData.fcp < 1800
            ? 10
            : perfData.fcp < 3000
              ? 5
              : 0
          : 5,
    };

    const score = Math.min(
      100,
      Object.values(breakdown).reduce((a, b) => a + b, 0)
    );

    return {
      reachable: true,
      url,
      score,
      hasSSL: url.startsWith("https://"),
      performance: {
        lcp: perfData.lcp,
        fcp: perfData.fcp,
        tti: perfData.domInteractive,
      },
      seo: {
        hasTitle: title.length > 0,
        hasDescription: metaDesc.length > 0,
        hasH1: h1Text.length > 0,
        hasSitemap,
        titleLength: title.length || null,
        descriptionLength: metaDesc.length || null,
      },
      mobile: { hasViewportMeta, hasResponsiveCSS },
      hasContactForm,
      hasCTA,
      imageCount,
      textQualityScore,
      breakdown,
    };
  } catch {
    return defaultResult;
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

// ─── Tech Detection Implementation ────────────────────────────────────────────

async function performTechCheck(url: string): Promise<WebsiteTech> {
  const defaultResult: WebsiteTech = {
    cms: "unknown",
    hasSSL: url.startsWith("https://"),
    hasAnalytics: false,
    analyticsType: null,
    copyrightYear: null,
    estimatedAge: null,
    siteLanguage: null,
    metaGenerator: null,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MadeCreativeBot/1.0)" },
    });
    clearTimeout(timer);

    if (!response.ok) return defaultResult;

    const html = await response.text();
    const { load } = await import("cheerio");
    const $ = load(html);

    // CMS detection
    let cms: WebsiteTech["cms"] = "custom";
    if (html.includes("wp-content") || html.includes("wp-includes")) {
      cms = "wordpress";
    } else if (html.includes("wix.com") || html.includes("wixsite.com")) {
      cms = "wix";
    } else if (html.includes("squarespace.com") || html.includes("squarespace-cdn")) {
      cms = "squarespace";
    } else if (html.includes("jimdo.com") || html.includes("jimdosite")) {
      cms = "jimdo";
    } else if (html.includes("shopify") || html.includes("myshopify.com")) {
      cms = "shopify";
    } else if (html.includes("webflow.com") || html.includes("webflow.io")) {
      cms = "webflow";
    }

    // Analytics
    const hasGA =
      html.includes("google-analytics.com") ||
      html.includes("gtag(") ||
      html.includes("ga(");
    const hasGTM = html.includes("googletagmanager.com");
    const hasAnalytics = hasGA || hasGTM;
    const analyticsType = hasGTM ? "GTM" : hasGA ? "GA" : null;

    // Meta generator
    const metaGenerator = $('meta[name="generator"]').attr("content") ?? null;

    // Site language
    const siteLanguage =
      $("html").attr("lang") ??
      $("html").attr("xml:lang") ??
      null;

    // Copyright year
    const bodyText = $("body").text();
    const copyrightMatch = bodyText.match(/©\s*(\d{4})|copyright\s+(\d{4})/i);
    const copyrightYear =
      copyrightMatch
        ? parseInt(copyrightMatch[1] ?? copyrightMatch[2] ?? "0", 10)
        : null;

    const currentYear = new Date().getFullYear();
    const estimatedAge =
      copyrightYear && copyrightYear > 1990
        ? currentYear - copyrightYear
        : null;

    return {
      cms,
      hasSSL: url.startsWith("https://"),
      hasAnalytics,
      analyticsType,
      copyrightYear,
      estimatedAge,
      siteLanguage,
      metaGenerator,
    };
  } catch {
    return defaultResult;
  }
}

// ─── Social Analysis Implementation ──────────────────────────────────────────

async function performSocialAnalysis(
  businessName: string,
  website: string | undefined,
  country: string
): Promise<SocialAnalysis> {
  void country; // used for context but not needed for HTTP scraping

  const defaultResult: SocialAnalysis = {
    score: 0,
    hasFacebook: false,
    facebookUrl: null,
    hasInstagram: false,
    instagramUrl: null,
    hasGoogleMyBusiness: false,
    gmbComplete: false,
    breakdown: {},
  };

  let html = "";

  if (website) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(website, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MadeCreativeBot/1.0)" },
      });
      clearTimeout(timer);
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // website unreachable — no social links to parse
    }
  }

  const { load } = await import("cheerio");
  const $ = load(html);

  // Find all links
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href) links.push(href);
  });

  // Facebook
  const fbLink = links.find(
    (l) => l.includes("facebook.com/") && !l.includes("sharer") && !l.includes("share")
  );
  const hasFacebook = !!fbLink;

  // Instagram
  const igLink = links.find(
    (l) => l.includes("instagram.com/") && !l.includes("sharer")
  );
  const hasInstagram = !!igLink;

  // Google My Business signal: look for maps.google or g.page links
  const gmbLink = links.find(
    (l) => l.includes("maps.google") || l.includes("g.page") || l.includes("goo.gl/maps")
  );
  const hasGoogleMyBusiness = !!gmbLink;
  // GMB completeness heuristic: has name in GMB + rating available → assume complete
  const gmbComplete = hasGoogleMyBusiness && businessName.length > 0;

  // Score calculation
  const breakdown: Record<string, number> = {
    facebook: hasFacebook ? 30 : 0,
    instagram: hasInstagram ? 30 : 0,
    gmb: hasGoogleMyBusiness ? 25 : 0,
    gmbComplete: gmbComplete ? 15 : 0,
  };

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0)
  );

  return {
    score,
    hasFacebook,
    facebookUrl: fbLink ?? null,
    hasInstagram,
    instagramUrl: igLink ?? null,
    hasGoogleMyBusiness,
    gmbComplete,
    breakdown,
  };
}

// ─── Analyzer Agent ──────────────────────────────────────────────────────────

export class AnalyzerAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return analyzerTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      // ── 1. Analyze Website ──────────────────────────────────────────────────
      case "analyze_website": {
        const url = toolInput["url"] as string;
        this.log("info", `Running website analysis for: ${url}`);
        const result = await performWebsiteAnalysis(url);
        this.log("info", `Website analysis complete — score: ${result.score}`);
        return result;
      }

      // ── 2. Analyze Social ───────────────────────────────────────────────────
      case "analyze_social": {
        const businessName = toolInput["businessName"] as string;
        const website = toolInput["website"] as string | undefined;
        const country = toolInput["country"] as string;
        this.log("info", `Running social analysis for: ${businessName}`);
        const result = await performSocialAnalysis(businessName, website, country);
        this.log("info", `Social analysis complete — score: ${result.score}`);
        return result;
      }

      // ── 3. Check Website Tech ───────────────────────────────────────────────
      case "check_website_tech": {
        const url = toolInput["url"] as string;
        this.log("info", `Running tech check for: ${url}`);
        const result = await performTechCheck(url);
        this.log("info", `Tech check complete — CMS: ${result.cms}`);
        return result;
      }

      // ── 4. Score Lead (Claude sub-call) ─────────────────────────────────────
      case "score_lead": {
        const businessName = toolInput["businessName"] as string;
        const sector = toolInput["sector"] as string;
        const country = toolInput["country"] as string;
        const websiteScore = (toolInput["websiteScore"] as number) ?? 0;
        const socialScore = (toolInput["socialScore"] as number) ?? 0;
        const techData = (toolInput["techData"] as Record<string, unknown>) ?? {};
        const googleRating = toolInput["googleRating"] as number | null | undefined;
        const reviewCount = toolInput["reviewCount"] as number | null | undefined;
        const hasWebsite = (toolInput["hasWebsite"] as boolean) ?? false;

        this.log("info", `Scoring lead: ${businessName} (${sector}, ${country})`);

        const scoringPrompt = buildScoringSubPrompt({
          businessName,
          sector,
          country,
          websiteScore,
          socialScore,
          techData,
          googleRating: googleRating ?? null,
          reviewCount: reviewCount ?? null,
          hasWebsite,
        });

        const scoreResult = await this.client.callWithText(
          [{ role: "user", content: scoringPrompt }],
          { system: SCORING_SYSTEM_PROMPT, maxTokens: 1024 }
        );

        // Parse JSON from response
        let parsed: {
          score: number;
          painPoints: string[];
          suggestedServices: string[];
          summary: string;
        };

        try {
          // Extract JSON block from the response
          const jsonMatch = scoreResult.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in scoring response");
          }
          parsed = JSON.parse(jsonMatch[0]) as typeof parsed;
        } catch (err) {
          this.log("warn", `Failed to parse scoring JSON: ${err instanceof Error ? err.message : String(err)}`);
          parsed = {
            score: 40,
            painPoints: ["Analisi non disponibile"],
            suggestedServices: ["website_rebuild"],
            summary: "Analisi automatica non riuscita. Revisione manuale consigliata.",
          };
        }

        this.log("info", `Lead score calculated: ${parsed.score}`);
        return parsed;
      }

      // ── 4b. Evaluate Photo Quality ─────────────────────────────────────────
      case "evaluate_photos": {
        const prospectId = toolInput["prospectId"] as string;
        this.log("info", `Evaluating photo quality for prospect ${prospectId}`);

        const p = await prisma.prospect.findUnique({
          where: { id: prospectId },
          select: { photoUrls: true, logoUrl: true },
        });

        const urls = (Array.isArray(p?.photoUrls) ? p.photoUrls : []) as string[];
        if (urls.length === 0) {
          return { photoQuality: 0, photoCount: 0, hasLogo: Boolean(p?.logoUrl), recommendation: "NO_PHOTOS" };
        }

        // Check image accessibility and size via HEAD requests
        let totalScore = 0;
        let reachable = 0;
        for (const url of urls.slice(0, 6)) {
          try {
            const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              reachable++;
              const contentLength = parseInt(res.headers.get("content-length") ?? "0");
              const contentType = res.headers.get("content-type") ?? "";
              // > 50KB = likely decent quality, > 200KB = good quality
              if (contentType.startsWith("image/")) {
                if (contentLength > 200_000) totalScore += 90;
                else if (contentLength > 50_000) totalScore += 60;
                else if (contentLength > 10_000) totalScore += 30;
                else totalScore += 10; // tiny image, probably low quality
              }
            }
          } catch {
            // unreachable, score stays 0 for this image
          }
        }

        const photoQuality = reachable > 0 ? Math.round(totalScore / reachable) : 0;
        const recommendation = photoQuality >= 60 ? "USE_ORIGINALS" : photoQuality >= 30 ? "MIX_WITH_STOCK" : "REPLACE_WITH_STOCK";

        // Persist quality score
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { photoQuality },
        });

        this.log("info", `Photo quality: ${photoQuality}/100, ${reachable}/${urls.length} reachable → ${recommendation}`);
        return { photoQuality, photoCount: reachable, totalPhotos: urls.length, hasLogo: Boolean(p?.logoUrl), recommendation };
      }

      // ── 5. Update Prospect Status ───────────────────────────────────────────
      case "update_prospect_status": {
        const {
          prospectId,
          status,
          leadScore,
          websiteQuality,
          socialPresence,
          painPoints,
          suggestedServices,
          summary,
        } = toolInput as {
          prospectId: string;
          status: "QUALIFIED" | "ANALYZED";
          leadScore: number;
          websiteQuality?: number;
          socialPresence?: number;
          painPoints: string[];
          suggestedServices: string[];
          summary: string;
        };

        this.log("info", `Persisting analysis for prospect ${prospectId} — status: ${status}`);

        // Transform string arrays into the legacy JSON structure expected by the DB
        const painPointsJson = painPoints.map((description, idx) => ({
          category: `pain_point_${idx + 1}`,
          description,
          severity: idx === 0 ? "HIGH" : idx === 1 ? "MEDIUM" : "LOW",
        }));

        const suggestedServicesJson = suggestedServices.map((serviceType, idx) => ({
          serviceType,
          priority: idx + 1,
          rationale: summary.slice(0, 120),
          estimatedValue: 0,
        }));

        await prisma.prospect.update({
          where: { id: prospectId },
          data: {
            leadScore: Math.round(leadScore),
            websiteQuality: websiteQuality ?? null,
            socialPresence: socialPresence ?? null,
            painPoints: painPointsJson,
            suggestedServices: suggestedServicesJson,
            aiAnalysis: summary,
            status,
            updatedAt: new Date(),
          },
        });

        return { saved: true, prospectId, status, leadScore };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // ─── Public entry point ─────────────────────────────────────────────────────

  async analyzeProspect(prospectId: string): Promise<AgentResult> {
    return this.run({ prospectId });
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = AnalyzerInputSchema.safeParse(input);
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

    const startTime = Date.now();

    try {
      await this.markJobStarted();
      this.log("info", "Analyzer agent starting", {
        prospectId: parsed.data.prospectId,
      });
      await this.updateProgress(5);

      const prospect = await prisma.prospect.findUnique({
        where: { id: parsed.data.prospectId },
        select: {
          id: true,
          companyName: true,
          website: true,
          googleRating: true,
          reviewCount: true,
          sector: true,
          country: true,
          employeeEstimate: true,
          photoUrls: true,
          logoUrl: true,
          status: true,
        },
      });

      if (!prospect) {
        const error = `Prospect ${parsed.data.prospectId} not found`;
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

      // Skip if already analyzed (unless forced)
      if (
        (prospect.status === "ANALYZED" || prospect.status === "QUALIFIED") &&
        !parsed.data.forceReanalyze
      ) {
        this.log("info", "Prospect already analyzed, skipping");
        await this.markJobCompleted({ skipped: true, reason: "Already analyzed" });
        return {
          success: true,
          data: { skipped: true },
          apiCost: 0,
          tokensUsed: 0,
          durationMs: Date.now() - startTime,
          toolCalls: [],
        };
      }

      await this.updateProgress(10);

      const userPrompt = buildAnalyzerUserPrompt({
        prospectId: prospect.id,
        companyName: prospect.companyName,
        website: prospect.website,
        sector: prospect.sector,
        country: prospect.country,
        googleRating: prospect.googleRating,
        reviewCount: prospect.reviewCount,
        employeeEstimate: prospect.employeeEstimate,
      });

      await this.updateProgress(20);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        ANALYZER_SYSTEM_PROMPT,
        { maxTokens: 4096 }
      );

      await this.updateProgress(95);

      const output: Record<string, unknown> = {
        prospectId: prospect.id,
        apiCost: this.totalCost,
        ...(result.data as Record<string, unknown>),
      };

      await this.markJobCompleted(output);
      this.log("info", "Analyzer agent completed successfully");

      return {
        ...result,
        data: output,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Analyzer agent failed: ${error}`);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: Date.now() - startTime,
        toolCalls: this.toolCalls,
      };
    }
  }
}

// ─── Scoring sub-prompt helpers ──────────────────────────────────────────────

const SCORING_SYSTEM_PROMPT = `You are a lead scoring engine for MadeCreative digital agency.
Output ONLY valid JSON. No explanation before or after.
JSON structure:
{
  "score": <integer 0-100>,
  "painPoints": ["string", ...],
  "suggestedServices": ["website_rebuild"|"chatbot"|"lead_gen"|"social_management"|"seo_optimization", ...],
  "summary": "<string max 200 words>"
}`;

function buildScoringSubPrompt(params: {
  businessName: string;
  sector: string;
  country: string;
  websiteScore: number;
  socialScore: number;
  techData: Record<string, unknown>;
  googleRating: number | null;
  reviewCount: number | null;
  hasWebsite: boolean;
}): string {
  const techSummary = params.hasWebsite
    ? [
        `CMS: ${(params.techData["cms"] as string) ?? "unknown"}`,
        `SSL: ${(params.techData["hasSSL"] as boolean) ?? false}`,
        `Analytics: ${(params.techData["hasAnalytics"] as boolean) ?? false}`,
        `Site age estimate: ${(params.techData["estimatedAge"] as number) ?? "unknown"} years`,
      ].join(", ")
    : "No website detected";

  return `Score this business prospect:

Business: ${params.businessName}
Sector: ${params.sector}
Country: ${params.country}
Has website: ${params.hasWebsite}
Website quality score: ${params.websiteScore}/100
Social presence score: ${params.socialScore}/100
Tech details: ${techSummary}
Google rating: ${params.googleRating ?? "N/A"}
Review count: ${params.reviewCount ?? "N/A"}

Apply sector-specific scoring rules. Businesses with many digital gaps score higher (more opportunity for us).
Return JSON only.`;
}
