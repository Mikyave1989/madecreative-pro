// ─── Site Research Agent ──────────────────────────────────────────────────────
// Specialized agent that scrapes the original business website to extract
// ALL original content: logo, photos, text, colors, fonts, contact info, etc.
// Only falls back to stock photos when originals are missing or low quality.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScrapedContent, BrandAsset, ColorSystem } from "./types.js";

// ─── CSS Color Extraction ─────────────────────────────────────────────────────

function extractColorsFromCss(css: string): string[] {
  const colors = new Set<string>();

  // Hex colors
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  for (const match of css.matchAll(hexRegex)) {
    const hex = match[0].toLowerCase();
    if (hex !== "#fff" && hex !== "#ffffff" && hex !== "#000" && hex !== "#000000") {
      colors.add(hex);
    }
  }

  // RGB/RGBA colors
  const rgbRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)/g;
  for (const match of css.matchAll(rgbRegex)) {
    const r = parseInt(match[1]!);
    const g = parseInt(match[2]!);
    const b = parseInt(match[3]!);
    if (r + g + b > 20 && r + g + b < 740) { // Skip near-black and near-white
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
      await page.waitForTimeout(2000); // Allow lazy-loaded content

      // ─── Extract images ──────────────────────────────────────────────
      const images = await page.evaluate(() => {
        const imgs: Array<{
          src: string;
          alt: string;
          width: number;
          height: number;
          context: string;
        }> = [];

        // Standard img tags
        document.querySelectorAll("img").forEach((img) => {
          const src = img.src || img.dataset["src"] || img.getAttribute("data-lazy-src") || "";
          if (src && !src.startsWith("data:") && !src.includes("pixel") && !src.includes("tracking")) {
            const rect = img.getBoundingClientRect();
            imgs.push({
              src,
              alt: img.alt || "",
              width: rect.width || img.naturalWidth,
              height: rect.height || img.naturalHeight,
              context: img.closest("section")?.className || img.parentElement?.className || "",
            });
          }
        });

        // Background images from CSS
        document.querySelectorAll("[style*='background']").forEach((el) => {
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;
          const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match?.[1] && !match[1].includes("gradient") && !match[1].startsWith("data:")) {
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
      });

      // Filter and classify images
      for (const img of images) {
        if (img.width < 80 || img.height < 80) continue; // Skip tiny images/icons

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
      const textData = await page.evaluate(() => {
        const headings: string[] = [];
        const bodyTexts: string[] = [];
        let businessName = "";
        let tagline = "";

        // Business name: usually in h1 or the logo text
        const h1 = document.querySelector("h1");
        if (h1?.textContent?.trim()) {
          businessName = h1.textContent.trim();
        }

        // Headings
        document.querySelectorAll("h1, h2, h3, h4").forEach((h) => {
          const text = h.textContent?.trim();
          if (text && text.length > 2 && text.length < 200) {
            headings.push(text);
          }
        });

        // Tagline: often in a p right after h1, or in .tagline/.slogan
        const taglineEl = document.querySelector(".tagline, .slogan, .subtitle, h1 + p, .hero p");
        if (taglineEl?.textContent?.trim()) {
          tagline = taglineEl.textContent.trim();
        }

        // Body text from paragraphs
        document.querySelectorAll("p").forEach((p) => {
          const text = p.textContent?.trim();
          if (text && text.length > 30 && text.length < 2000) {
            bodyTexts.push(text);
          }
        });

        return { headings, bodyTexts, businessName, tagline };
      });

      result.headings = textData.headings;
      result.bodyTexts = textData.bodyTexts;
      result.businessName = textData.businessName || undefined;
      result.tagline = textData.tagline || undefined;

      // ─── Extract contact info ────────────────────────────────────────
      const contactData = await page.evaluate(() => {
        const text = document.body.innerText || "";

        // Phone numbers (international formats)
        const phones = text.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) ?? [];

        // Emails
        const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];

        // Address (look for common patterns)
        let address = "";
        const addressEl = document.querySelector("[itemprop='address'], .address, address");
        if (addressEl?.textContent?.trim()) {
          address = addressEl.textContent.trim().replace(/\s+/g, " ");
        }

        // Social links
        const socialLinks: Record<string, string> = {};
        document.querySelectorAll("a[href]").forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          if (href.includes("facebook.com")) socialLinks["facebook"] = href;
          if (href.includes("instagram.com")) socialLinks["instagram"] = href;
          if (href.includes("twitter.com") || href.includes("x.com")) socialLinks["twitter"] = href;
          if (href.includes("linkedin.com")) socialLinks["linkedin"] = href;
          if (href.includes("youtube.com")) socialLinks["youtube"] = href;
          if (href.includes("tripadvisor")) socialLinks["tripadvisor"] = href;
        });

        // Business hours
        const businessHours: Record<string, string> = {};
        const hoursEl = document.querySelector("[itemprop='openingHours'], .hours, .orari, .opening-hours");
        if (hoursEl?.textContent) {
          const lines = hoursEl.textContent.split("\n").map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const dayMatch = line.match(/^(lun|mar|mer|gio|ven|sab|dom|mon|tue|wed|thu|fri|sat|sun)/i);
            if (dayMatch) {
              businessHours[dayMatch[1]!.toLowerCase()] = line;
            }
          }
        }

        return { phones: [...new Set(phones)], emails: [...new Set(emails)], address, socialLinks, businessHours };
      });

      result.phones = contactData.phones.slice(0, 5);
      result.emails = contactData.emails.slice(0, 5);
      result.address = contactData.address || undefined;
      result.socialLinks = contactData.socialLinks;
      result.businessHours = contactData.businessHours;

      // ─── Extract CSS colors and fonts ────────────────────────────────
      const cssData = await page.evaluate(() => {
        const allCss: string[] = [];

        // Inline styles
        document.querySelectorAll("[style]").forEach((el) => {
          allCss.push(el.getAttribute("style") ?? "");
        });

        // Stylesheet content
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              allCss.push(rule.cssText);
            }
          } catch {
            // Cross-origin stylesheets are not accessible
          }
        }

        return allCss.join("\n");
      });

      result.extractedColors = extractColorsFromCss(cssData);
      result.detectedFonts = extractFontsFromCss(cssData);

      // ─── Extract services/menu items ─────────────────────────────────
      const structuredData = await page.evaluate(() => {
        const services: Array<{ name: string; description?: string; price?: string }> = [];
        const menuItems: Array<{ name: string; description?: string; price?: string; category?: string }> = [];
        const testimonials: Array<{ text: string; author?: string; rating?: number }> = [];

        // JSON-LD structured data
        document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
          try {
            const data = JSON.parse(script.textContent ?? "");
            if (data["@type"] === "Restaurant" && data.hasMenu) {
              // Extract menu from structured data
            }
            if (data["@type"] === "Review" || data.review) {
              const reviews = Array.isArray(data.review) ? data.review : [data.review];
              for (const review of reviews) {
                if (review?.reviewBody) {
                  testimonials.push({
                    text: review.reviewBody,
                    author: review.author?.name,
                    rating: review.reviewRating?.ratingValue,
                  });
                }
              }
            }
          } catch {
            // Invalid JSON-LD
          }
        });

        // Service cards / menu items from common patterns
        document.querySelectorAll(".service, .servizio, [class*='service'], .menu-item, [class*='menu-item']").forEach((el) => {
          const name = el.querySelector("h3, h4, .title, .name")?.textContent?.trim();
          const desc = el.querySelector("p, .description, .desc")?.textContent?.trim();
          const price = el.querySelector(".price, .prezzo, [class*='price']")?.textContent?.trim();

          if (name) {
            if (el.classList.toString().includes("menu")) {
              const cat = el.closest("[class*='category'], [class*='section']")?.querySelector("h2, h3")?.textContent?.trim();
              menuItems.push({ name, description: desc, price, category: cat });
            } else {
              services.push({ name, description: desc, price });
            }
          }
        });

        // Testimonials
        document.querySelectorAll(".testimonial, .review, [class*='testimonial'], [class*='review']").forEach((el) => {
          const text = el.querySelector("p, .text, .quote, blockquote")?.textContent?.trim();
          const author = el.querySelector(".author, .name, cite")?.textContent?.trim();
          if (text && text.length > 20) {
            testimonials.push({ text, author });
          }
        });

        return { services, menuItems, testimonials };
      });

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

    // Sort colors by luminance (dark to light)
    const withLuminance = scrapedColors.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return { hex, luminance };
    });

    withLuminance.sort((a, b) => a.luminance - b.luminance);

    // Darkest as primary, most vibrant as accent
    const primary = withLuminance[0]?.hex ?? sectorDefaults.primary;
    const lightest = withLuminance[withLuminance.length - 1]?.hex ?? sectorDefaults.background;

    // Find most saturated color for accent
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
   * Uses image dimensions + heuristics. Falls back to stock if needed.
   */
  async filterPhotosByQuality(
    photos: BrandAsset[],
    minScore: number = 6,
  ): Promise<BrandAsset[]> {
    const scored = photos.map((photo) => {
      let score = 5; // Base score

      // Size bonuses
      if ((photo.width ?? 0) >= 1200) score += 2;
      else if ((photo.width ?? 0) >= 800) score += 1;

      // Type bonuses
      if (photo.type === "hero" || photo.type === "interior" || photo.type === "food") score += 1;
      if (photo.type === "logo") score += 2;

      // Source bonuses - original content is always preferred
      if (photo.source === "original_site") score += 1;

      // Penalize tiny images
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

    // Try Unsplash
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

    // Fill remaining with Pexels
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
