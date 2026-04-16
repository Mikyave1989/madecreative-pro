/**
 * Extract and normalize scraped website content into typed structures.
 * Input: prospect.scrapedContent (raw JSON from scraper)
 * Output: clean typed data ready for template injection
 */

/** Internal shape of a single scraped page as stored in prospect.scrapedContent.pages[] */
interface ParsedScrapedPage {
  url: string;
  title?: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  images: Array<{ url: string; alt?: string }>;
  videos: Array<{ url: string; type?: string }>;
}

export interface ExtractedContent {
  // Real headings from the site (h1-h3, deduplicated)
  headings: string[];
  // Real paragraphs (deduplicated, sorted by length desc)
  paragraphs: string[];
  // All images from all pages
  images: Array<{ url: string; alt?: string }>;
  // Videos (YouTube, Vimeo, mp4)
  videos: Array<{ url: string; type?: string }>;
  // Contact info
  contact: { phone?: string; email?: string; address?: string };
  // Logo URL
  logo?: string;
  // Social links
  socialLinks: Record<string, string>;
  // Page titles (for navigation structure)
  pageTitles: string[];
  // Opening hours if found
  openingHours?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parsePages(raw: unknown): ParsedScrapedPage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => p !== null && typeof p === "object")
    .map((p) => ({
      url: isNonEmpty(p["url"]) ? (p["url"] as string) : "",
      title: isNonEmpty(p["title"]) ? (p["title"] as string) : undefined,
      headings: parseHeadings(p["headings"]),
      paragraphs: parseStringArray(p["paragraphs"]),
      images: parseImages(p["images"]),
      videos: parseVideos(p["videos"]),
    }));
}

function parseHeadings(raw: unknown): Array<{ level: number; text: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h): h is Record<string, unknown> => h !== null && typeof h === "object")
    .map((h) => ({
      level: typeof h["level"] === "number" ? h["level"] : 2,
      text: isNonEmpty(h["text"]) ? (h["text"] as string).trim() : "",
    }))
    .filter((h) => h.text.length > 0);
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}

function parseImages(raw: unknown): Array<{ url: string; alt?: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, unknown> => i !== null && typeof i === "object")
    .map((i) => ({
      url: isNonEmpty(i["url"]) ? (i["url"] as string) : "",
      alt: isNonEmpty(i["alt"]) ? (i["alt"] as string) : undefined,
    }))
    .filter((i) => i.url.length > 0);
}

function parseVideos(raw: unknown): Array<{ url: string; type?: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => v !== null && typeof v === "object")
    .map((v) => ({
      url: isNonEmpty(v["url"]) ? (v["url"] as string) : "",
      type: isNonEmpty(v["type"]) ? (v["type"] as string) : undefined,
    }))
    .filter((v) => v.url.length > 0);
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Noise phrases that appear in nav/footers — skip them as "real" headings
const NOISE_HEADING_PATTERNS = [
  /^home$/i,
  /^contact(i|s|o)?$/i,
  /^men[uù]$/i,
  /^footer$/i,
  /^navigation$/i,
  /^skip to/i,
  /^privacy/i,
  /^cookie/i,
  /^404/i,
];

function isUsefulHeading(text: string): boolean {
  return (
    text.length >= 3 &&
    text.length <= 250 &&
    !NOISE_HEADING_PATTERNS.some((re) => re.test(text))
  );
}

// Noise paragraph patterns — cookie notices, legal boilerplate, etc.
const NOISE_PARA_PATTERNS = [
  /cookie/i,
  /gdpr/i,
  /privacy policy/i,
  /all rights reserved/i,
  /\u00a9\s*\d{4}/,
  /^\s*©/,
];

function isUsefulParagraph(text: string): boolean {
  return (
    text.length >= 40 &&
    text.length <= 2000 &&
    !NOISE_PARA_PATTERNS.some((re) => re.test(text))
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse raw scrapedContent (as stored in prospect.scrapedContent) and
 * return a clean, deduplicated ExtractedContent object, or null if the
 * input is empty / not parseable.
 */
export function extractScrapedContent(raw: unknown): ExtractedContent | null {
  if (raw === null || raw === undefined) return null;

  // Accept either a raw JSON string or a plain object
  let obj: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return null;
  }

  const pages = parsePages(obj["pages"]);
  if (pages.length === 0) return null;

  // ── Headings (h1-h3 only, deduplicated, noise-filtered) ──
  const rawHeadings: string[] = [];
  for (const page of pages) {
    for (const h of page.headings) {
      if (h.level <= 3) rawHeadings.push(h.text);
    }
  }
  const headings = dedupe(
    rawHeadings.filter(isUsefulHeading),
    (h) => h.toLowerCase()
  ).slice(0, 20);

  // ── Paragraphs (deduplicated, noise-filtered, sorted longest first) ──
  const rawParagraphs: string[] = [];
  for (const page of pages) {
    for (const p of page.paragraphs) {
      rawParagraphs.push(p);
    }
  }
  const paragraphs = dedupe(
    rawParagraphs.filter(isUsefulParagraph),
    (p) => p.slice(0, 80).toLowerCase()
  )
    .sort((a, b) => b.length - a.length)
    .slice(0, 30);

  // ── Images (all pages, deduplicated by URL) ──
  const rawImages: Array<{ url: string; alt?: string }> = [];
  for (const page of pages) {
    for (const img of page.images) {
      rawImages.push(img);
    }
  }
  const images = dedupe(rawImages, (i) => i.url).slice(0, 50);

  // ── Videos (all pages, deduplicated) ──
  const rawVideos: Array<{ url: string; type?: string }> = [];
  for (const page of pages) {
    for (const v of page.videos) {
      rawVideos.push(v);
    }
  }
  const videos = dedupe(rawVideos, (v) => v.url).slice(0, 10);

  // ── Contact info (from top-level or first page that has it) ──
  const rawContact = obj["contact"] as Record<string, unknown> | undefined;
  const contact: { phone?: string; email?: string; address?: string } = {};
  if (rawContact) {
    if (isNonEmpty(rawContact["phone"])) contact.phone = (rawContact["phone"] as string).trim();
    if (isNonEmpty(rawContact["email"])) contact.email = (rawContact["email"] as string).trim();
    if (isNonEmpty(rawContact["address"])) contact.address = (rawContact["address"] as string).trim();
  }
  // Fallback: scan pages for contact data stored inline
  if (!contact.phone || !contact.email) {
    for (const page of pages) {
      const p = page as unknown as Record<string, unknown>;
      if (!contact.phone && isNonEmpty(p["phone"])) contact.phone = (p["phone"] as string).trim();
      if (!contact.email && isNonEmpty(p["email"])) contact.email = (p["email"] as string).trim();
    }
  }

  // ── Logo ──
  const logo = isNonEmpty(obj["logo"]) ? (obj["logo"] as string) : undefined;

  // ── Social links ──
  const rawSocial = obj["socialLinks"] as Record<string, unknown> | undefined;
  const socialLinks: Record<string, string> = {};
  if (rawSocial && typeof rawSocial === "object") {
    for (const [k, v] of Object.entries(rawSocial)) {
      if (isNonEmpty(v)) socialLinks[k] = v as string;
    }
  }

  // ── Page titles ──
  const pageTitles = pages
    .map((p) => p.title ?? "")
    .filter((t) => t.length > 0)
    .slice(0, 10);

  // ── Opening hours (scan paragraphs for time patterns) ──
  const hourPattern = /\b\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2}\b/;
  const openingHours = paragraphs.find((p) => hourPattern.test(p));

  return {
    headings,
    paragraphs,
    images,
    videos,
    contact,
    logo,
    socialLinks,
    pageTitles,
    openingHours,
  };
}
