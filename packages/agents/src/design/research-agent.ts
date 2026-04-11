// ─── Site Research Agent ──────────────────────────────────────────────────────
// Specialized agent that scrapes the original business website to extract
// ALL original content: logo, photos, text, colors, fonts, contact info, etc.
// Only falls back to stock photos when originals are missing or low quality.
//
// NOTE: page.evaluate() callbacks run in the browser context (Playwright).
// We use explicit return types to keep TS happy without adding "dom" to lib.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScrapedContent, BrandAsset, ColorSystem } from "./types.js";

// ─── Browser-evaluated script strings ─────────────────────────────────────────
// These strings are injected into the Playwright browser context at runtime.
// They are NOT compiled by TypeScript, so DOM globals are safe to use here.

const EXTRACT_IMAGES_SCRIPT = `() => {
  const imgs = [];
  document.querySelectorAll("img").forEach(img => {
    const src = img.src || img.dataset["src"] || img.getAttribute("data-lazy-src") || "";
    if (src && !src.startsWith("data:") && !src.includes("pixel") && !src.includes("tracking")) {
      const rect = img.getBoundingClientRect();
      imgs.push({
        src: src,
        alt: img.alt || "",
        width: rect.width || img.naturalWidth,
        height: rect.height || img.naturalHeight,
        context: (img.closest("section") || {}).className || (img.parentElement || {}).className || "",
      });
    }
  });
  document.querySelectorAll("[style*='background']").forEach(el => {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    const match = bgImage.match(/url\\(["']?([^"')]+)["']?\\)/);
    if (match && match[1] && !match[1].includes("gradient") && !match[1].startsWith("data:")) {
      const rect = el.getBoundingClientRect();
      imgs.push({
        src: match[1],
        alt: "",
        width: rect.width,
        height: rect.height,
        context: el.className || "",
      });
    }
  });
  return imgs;
}`;

const EXTRACT_TEXT_SCRIPT = `() => {
  const headings = [];
  const bodyTexts = [];
  let businessName = "";
  let tagline = "";
  const h1 = document.querySelector("h1");
  if (h1 && h1.textContent && h1.textContent.trim()) {
    businessName = h1.textContent.trim();
  }
  document.querySelectorAll("h1, h2, h3, h4").forEach(h => {
    const text = h.textContent ? h.textContent.trim() : "";
    if (text && text.length > 2 && text.length < 200) headings.push(text);
  });
  const taglineEl = document.querySelector(".tagline, .slogan, .subtitle, h1 + p, .hero p");
  if (taglineEl && taglineEl.textContent && taglineEl.textContent.trim()) {
    tagline = taglineEl.textContent.trim();
  }
  document.querySelectorAll("p").forEach(p => {
    const text = p.textContent ? p.textContent.trim() : "";
    if (text && text.length > 30 && text.length < 2000) bodyTexts.push(text);
  });
  return { headings, bodyTexts, businessName, tagline };
}`;

const EXTRACT_CONTACT_SCRIPT = `() => {
  const text = document.body.innerText || "";
  const phones = text.match(/(?:\\+\\d{1,3}[\\s.-]?)?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}/g) || [];
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g) || [];
  let address = "";
  const addressEl = document.querySelector("[itemprop='address'], .address, address");
  if (addressEl && addressEl.textContent && addressEl.textContent.trim()) {
    address = addressEl.textContent.trim().replace(/\\s+/g, " ");
  }
  const socialLinks = {};
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.href;
    if (href.includes("facebook.com")) socialLinks["facebook"] = href;
    if (href.includes("instagram.com")) socialLinks["instagram"] = href;
    if (href.includes("twitter.com") || href.includes("x.com")) socialLinks["twitter"] = href;
    if (href.includes("linkedin.com")) socialLinks["linkedin"] = href;
    if (href.includes("youtube.com")) socialLinks["youtube"] = href;
    if (href.includes("tripadvisor")) socialLinks["tripadvisor"] = href;
  });
  const businessHours = {};
  const hoursEl = document.querySelector("[itemprop='openingHours'], .hours, .orari, .opening-hours");
  if (hoursEl && hoursEl.textContent) {
    const lines = hoursEl.textContent.split("\\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const dayMatch = line.match(/^(lun|mar|mer|gio|ven|sab|dom|mon|tue|wed|thu|fri|sat|sun)/i);
      if (dayMatch) businessHours[dayMatch[1].toLowerCase()] = line;
    }
  }
  return {
    phones: [...new Set(phones)],
    emails: [...new Set(emails)],
    address: address,
    socialLinks: socialLinks,
    businessHours: businessHours,
  };
}`;

const EXTRACT_CSS_SCRIPT = `() => {
  const allCss = [];
  document.querySelectorAll("[style]").forEach(el => {
    allCss.push(el.getAttribute("style") || "");
  });
  for (const sheet of document.styleSheets) {
    try { for (const rule of sheet.cssRules) allCss.push(rule.cssText); }
    catch(e) { /* cross-origin */ }
  }
  return allCss.join("\\n");
}`;

const EXTRACT_STRUCTURED_SCRIPT = `() => {
  const services = [];
  const menuItems = [];
  const testimonials = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const data = JSON.parse(script.textContent || "");
      if (data["@type"] === "Review" || data.review) {
        const reviews = Array.isArray(data.review) ? data.review : [data.review];
        for (const review of reviews) {
          if (review && review.reviewBody) {
            testimonials.push({
              text: review.reviewBody,
              author: review.author ? review.author.name : undefined,
              rating: review.reviewRating ? review.reviewRating.ratingValue : undefined,
            });
          }
        }
      }
    } catch(e) { /* Invalid JSON-LD */ }
  });
  document.querySelectorAll(".service, .servizio, [class*='service'], .menu-item, [class*='menu-item']").forEach(el => {
    const nameEl = el.querySelector("h3, h4, .title, .name");
    const descEl = el.querySelector("p, .description, .desc");
    const priceEl = el.querySelector(".price, .prezzo, [class*='price']");
    const name = nameEl ? nameEl.textContent.trim() : "";
    const desc = descEl ? descEl.textContent.trim() : undefined;
    const price = priceEl ? priceEl.textContent.trim() : undefined;
    if (name) {
      if (el.classList.toString().includes("menu")) {
        const catEl = el.closest("[class*='category'], [class*='section']");
        const cat = catEl ? (catEl.querySelector("h2, h3") || {}).textContent : undefined;
        menuItems.push({ name, description: desc, price, category: cat ? cat.trim() : undefined });
      } else {
        services.push({ name, description: desc, price });
      }
    }
  });
  document.querySelectorAll(".testimonial, .review, [class*='testimonial'], [class*='review']").forEach(el => {
    const textEl = el.querySelector("p, .text, .quote, blockquote");
    const authorEl = el.querySelector(".author, .name, cite");
    const text = textEl ? textEl.textContent.trim() : "";
    const author = authorEl ? authorEl.textContent.trim() : undefined;
    if (text && text.length > 20) testimonials.push({ text, author });
  });
  return { services, menuItems, testimonials };
}`;

// ─── Evaluate result types ────────────────────────────────────────────────────

interface ImageResult {
  src: string;
  alt: string;
  width: number;
  height: number;
  context: string;
}

interface TextResult {
  headings: string[];
  bodyTexts: string[];
  businessName: string;
  tagline: string;
}

interface ContactResult {
  phones: string[];
  emails: string[];
  address: string;
  socialLinks: Record<string, string>;
  businessHours: Record<string, string>;
}

interface StructuredResult {
  services: Array<{ name: string; description?: string; price?: string }>;
  menuItems: Array<{ name: string; description?: string; price?: string; category?: string }>;
  testimonials: Array<{ text: string; author?: string; rating?: number }>;
}

// ─── CSS Color Extraction ─────────────────────────────────────────────────────

function extractColorsFromCss(css: string): string[] {
  const colors = new Set<string>();

  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  for (const match of css.matchAll(hexRegex)) {
    const hex = match[0].toLowerCase();
    if (hex !== "#fff" && hex !== "#ffffff" && hex !== "#000" && hex !== "#000000") {
      colors.add(hex);
    }
  }

  const rgbRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)/g;
  for (const match of css.matchAll(rgbRegex)) {
    const r = parseInt(match[1]!);
    const g = parseInt(match[2]!);
    const b = parseInt(match[3]!);
    if (r + g + b > 20 && r + g + b < 740) {
      colors.add(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
    }
  }

  return [...colors].slice(0, 20);
}

// ─── Font Detection ───────────────────────────────────────────────────────────

function extractFontsFromCss(css: string): string[] {
  const fonts = new Set<string>();
  const fontFamilyRegex = /font-family\s*:\s*([^;}"]+)/gi;

  for (const match of css.matchAll(fontFamilyRegex)) {
    const families = match[1]!.split(",").map((f) =>
      f.trim().replace(/['"]/g, "").trim()
    );
    for (const font of families) {
      if (
        font &&
        !["sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "inherit"].includes(font.toLowerCase())
      ) {
        fonts.add(font);
      }
    }
  }

  return [...fonts].slice(0, 10);
}

// ─── Image Classification ─────────────────────────────────────────────────────

function classifyImage(src: string, alt: string, context: string): BrandAsset["type"] {
  const combined = `${src} ${alt} ${context}`.toLowerCase();

  if (combined.includes("logo") || combined.includes("brand")) return "logo";
  if (combined.includes("hero") || combined.includes("banner") || combined.includes("slider")) return "hero";
  if (combined.includes("team") || combined.includes("staff") || combined.includes("chef")) return "team";
  if (combined.includes("food") || combined.includes("menu") || combined.includes("dish") || combined.includes("piatt")) return "food";
  if (combined.includes("interior") || combined.includes("sala") || combined.includes("ambiente")) return "interior";
  if (combined.includes("exterior") || combined.includes("facciata") || combined.includes("esterno")) return "exterior";
  if (combined.includes("product") || combined.includes("prodott")) return "product";
  if (combined.includes("gallery") || combined.includes("galleria")) return "gallery";
  return "other";
}

// ─── Research Agent ───────────────────────────────────────────────────────────

export class SiteResearchAgent {
  private logEntries: Array<{ level: string; message: string }> = [];

  private log(level: string, message: string): void {
    this.logEntries.push({ level, message });
    console.log(`[SiteResearch] ${message}`);
  }

  /**
   * Scrape a business website and extract all reusable content.
   * Uses Playwright for full JS rendering.
   */
  async scrapeOriginalSite(websiteUrl: string): Promise<ScrapedContent> {
    const result: ScrapedContent = {
      sourceUrl: websiteUrl,
      photos: [],
      headings: [],
      bodyTexts: [],
      extractedColors: [],
      detectedFonts: [],
      phones: [],
      emails: [],
      socialLinks: {},
      businessHours: {},
      menuItems: [],
      services: [],
      testimonials: [],
    };

    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });

      // Block heavy resources we don't need
      await page.route("**/*.{mp4,webm,ogg,wav,mp3}", (route) => route.abort());

      this.log("info", `Navigating to ${websiteUrl}`);
      await page.goto(websiteUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      // ─── Extract images ──────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const images = await page.evaluate(EXTRACT_IMAGES_SCRIPT) as ImageResult[];

      for (const img of images) {
        if (img.width < 80 || img.height < 80) continue;

        const type = classifyImage(img.src, img.alt, img.context);
        const asset: BrandAsset = {
          url: img.src.startsWith("http") ? img.src : new URL(img.src, websiteUrl).href,
          source: "original_site",
          type,
          width: Math.round(img.width),
          height: Math.round(img.height),
          alt: img.alt || undefined,
        };

        if (type === "logo" && !result.logo) {
          result.logo = asset;
        } else {
          result.photos.push(asset);
        }
      }

      // ─── Extract text content ────────────────────────────────────────
      const textData = await page.evaluate(EXTRACT_TEXT_SCRIPT) as TextResult;

      result.headings = textData.headings;
      result.bodyTexts = textData.bodyTexts;
      result.businessName = textData.businessName || undefined;
      result.tagline = textData.tagline || undefined;

      // ─── Extract contact info ────────────────────────────────────────
      const contactData = await page.evaluate(EXTRACT_CONTACT_SCRIPT) as ContactResult;

      result.phones = contactData.phones.slice(0, 5);
      result.emails = contactData.emails.slice(0, 5);
      result.address = contactData.address || undefined;
      result.socialLinks = contactData.socialLinks;
      result.businessHours = contactData.businessHours;

      // ─── Extract CSS colors and fonts ────────────────────────────────
      const cssData = await page.evaluate(EXTRACT_CSS_SCRIPT) as string;

      result.extractedColors = extractColorsFromCss(cssData);
      result.detectedFonts = extractFontsFromCss(cssData);

      // ─── Extract services/menu items ─────────────────────────────────
      const structuredData = await page.evaluate(EXTRACT_STRUCTURED_SCRIPT) as StructuredResult;

      result.services = structuredData.services;
      result.menuItems = structuredData.menuItems;
      result.testimonials = structuredData.testimonials;

      await browser.close();
      this.log("info", `Scraping complete: ${result.photos.length} photos, ${result.headings.length} headings, ${result.extractedColors.length} colors`);

    } catch (err) {
      this.log("error", `Scraping failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    return result;
  }

  /**
   * Build a color system from scraped data, falling back to sector defaults.
   */
  buildColorSystemFromScrape(
    scrapedColors: string[],
    sectorDefaults: ColorSystem,
  ): ColorSystem {
    if (scrapedColors.length < 2) return sectorDefaults;

    const withLuminance = scrapedColors.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return { hex, luminance };
    });

    withLuminance.sort((a, b) => a.luminance - b.luminance);

    const primary = withLuminance[0]?.hex ?? sectorDefaults.primary;
    const lightest = withLuminance[withLuminance.length - 1]?.hex ?? sectorDefaults.background;

    const withSaturation = scrapedColors.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      return { hex, saturation };
    });
    withSaturation.sort((a, b) => b.saturation - a.saturation);
    const accent = withSaturation[0]?.hex ?? sectorDefaults.accent;

    return {
      primary,
      secondary: withLuminance[1]?.hex ?? sectorDefaults.secondary,
      accent,
      background: lightest,
      surface: sectorDefaults.surface,
      text: primary,
      textMuted: sectorDefaults.textMuted,
      border: sectorDefaults.border,
      success: sectorDefaults.success,
      error: sectorDefaults.error,
      extractedFrom: "original_site",
    };
  }

  /**
   * Score and filter photos by quality.
   */
  async filterPhotosByQuality(
    photos: BrandAsset[],
    minScore: number = 6,
  ): Promise<BrandAsset[]> {
    const scored = photos.map((photo) => {
      let score = 5;

      if ((photo.width ?? 0) >= 1200) score += 2;
      else if ((photo.width ?? 0) >= 800) score += 1;

      if (photo.type === "hero" || photo.type === "interior" || photo.type === "food") score += 1;
      if (photo.type === "logo") score += 2;
      if (photo.source === "original_site") score += 1;
      if ((photo.width ?? 0) < 400 || (photo.height ?? 0) < 300) score -= 2;

      return { ...photo, qualityScore: Math.min(10, Math.max(0, score)) };
    });

    return scored
      .filter((p) => (p.qualityScore ?? 0) >= minScore)
      .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
      .slice(0, 15);
  }

  /**
   * Fetch stock photos for a sector + city when originals are insufficient.
   */
  async fetchStockPhotos(
    sector: string,
    city: string,
    count: number = 5,
  ): Promise<BrandAsset[]> {
    const results: BrandAsset[] = [];
    const query = `${sector} ${city} professional`;

    const unsplashKey = process.env["UNSPLASH_ACCESS_KEY"];
    if (unsplashKey) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            results: Array<{ urls: { regular: string }; width: number; height: number; alt_description: string }>;
          };
          for (const img of data.results) {
            results.push({
              url: img.urls.regular,
              source: "unsplash",
              type: "gallery",
              width: img.width,
              height: img.height,
              alt: img.alt_description,
            });
          }
        }
      } catch { /* fallthrough to Pexels */ }
    }

    if (results.length < count) {
      const pexelsKey = process.env["PEXELS_API_KEY"];
      if (pexelsKey) {
        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count - results.length}&orientation=landscape`,
            { headers: { Authorization: pexelsKey } },
          );
          if (res.ok) {
            const data = (await res.json()) as {
              photos: Array<{ src: { large2x: string }; width: number; height: number; alt: string }>;
            };
            for (const img of data.photos) {
              results.push({
                url: img.src.large2x,
                source: "pexels",
                type: "gallery",
                width: img.width,
                height: img.height,
                alt: img.alt,
              });
            }
          }
        } catch { /* silently fail */ }
      }
    }

    return results;
  }
}
