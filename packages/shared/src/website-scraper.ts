/**
 * Website Scraper — server-side only, uses fetch() for Vercel serverless compatibility.
 * Crawls up to MAX_PAGES pages from a given URL and extracts structured content.
 */

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string | null;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  images: Array<{ url: string; alt: string; width?: number; height?: number }>;
  videos: Array<{ url: string; type: string }>;
  isHomepage: boolean;
}

export interface ScrapedWebsite {
  url: string;
  domain: string;
  pages: ScrapedPage[];
  logo: string | null;
  favicon: string | null;
  navigation: Array<{ label: string; url: string }>;
  colors: { primary: string; accent: string; background: string; text: string } | null;
  fonts: { heading: string; body: string } | null;
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
    whatsapp: string | null;
    openingHours: string | null;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  googleMapsEmbed: string | null;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PAGES = 50; // Scrape up to 50 pages — no important content should be missed
const PAGE_TIMEOUT_MS = 8_000;
const TOTAL_TIMEOUT_MS = 30_000;
const USER_AGENT = "MadeCreative-Analyzer/2.0 (+https://madecreative.pro)";

// Paths that are definitely boilerplate — skip crawling them
const SKIP_PATH_RE =
  /\/(privacy|cookie|terms|impressum|datenschutz|legal|sitemap|feed|rss|login|logout|register|cart|checkout|wp-admin|wp-login|xmlrpc|\.php$)/i;

// CSS color names → skip; only hex/rgb
const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function resolveUrl(base: string, href: string): string | null {
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
    return null;
  }
  try {
    return new URL(href, base).href.split("#")[0] ?? null;
  } catch {
    return null;
  }
}

function isSameDomain(base: string, candidate: string): boolean {
  try {
    const bh = new URL(base).hostname.toLowerCase();
    const ch = new URL(candidate).hostname.toLowerCase();
    return ch === bh || ch.endsWith(`.${bh}`) || bh.endsWith(`.${ch}`);
  } catch {
    return false;
  }
}

/** Strip HTML tags and normalise whitespace */
function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extract the inner text of a tag match (handles nested tags in the content) */
function innerText(tagHtml: string): string {
  return stripTags(tagHtml).trim();
}

/** Fetch with timeout and follow redirects */
async function fetchPage(url: string, timeoutMs = PAGE_TIMEOUT_MS): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── Per-page extractors ──────────────────────────────────────────────────────

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1] ?? "").trim() : "";
}

function extractMetaDescription(html: string): string | null {
  const m =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)[^>]+name=["']description["']/i) ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i);
  const val = m?.[1]?.trim();
  return val && val.length > 5 ? val : null;
}

function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const results: Array<{ level: number; text: string }> = [];
  const re = /<(h[1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const level = parseInt((m[1] ?? "h1").slice(1), 10);
    const text = innerText(m[2] ?? "");
    if (text.length > 1 && text.length < 200) {
      results.push({ level, text });
    }
  }
  return results;
}

function extractParagraphs(html: string): string[] {
  // Remove nav, header, footer, cookie banners, scripts, styles first
  const cleaned = html
    .replace(/<(nav|header|footer|aside|script|style|noscript|iframe)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const text = innerText(m[1] ?? "").trim();
    if (
      text.length > 40 &&              // skip tiny snippets
      text.length < 1500 &&           // skip monster blobs
      !/privacy|cookie|copyright|all rights reserved/i.test(text)
    ) {
      paragraphs.push(text);
    }
  }
  // Also grab text from divs with meaningful classes (hero, about, description, content)
  const divRe = /<div[^>]*class=["'][^"']*(?:about|description|intro|content|hero-text|lead)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  while ((m = divRe.exec(cleaned)) !== null) {
    const text = innerText(m[1] ?? "").trim();
    if (text.length > 60 && text.length < 1500 && !paragraphs.includes(text)) {
      paragraphs.push(text);
    }
  }
  return [...new Set(paragraphs)]; // No limit — preserve ALL text content
}

function extractImages(html: string, base: string): Array<{ url: string; alt: string; width?: number; height?: number }> {
  const seen = new Set<string>();
  const images: Array<{ url: string; alt: string; width?: number; height?: number }> = [];

  const re = /<img[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0] ?? "";

    const srcM = tag.match(/\bsrc=["']([^"']+)["']/i) ?? tag.match(/\bdata-src=["']([^"']+)["']/i);
    if (!srcM?.[1]) continue;
    const rawSrc = srcM[1].trim();
    if (!rawSrc || rawSrc.startsWith("data:")) continue;

    const resolved = resolveUrl(base, rawSrc);
    if (!resolved || seen.has(resolved)) continue;

    const altM = tag.match(/\balt=["']([^"']*)["']/i);
    const alt = altM?.[1]?.trim() ?? "";

    const wM = tag.match(/\bwidth=["']?(\d+)/i);
    const hM = tag.match(/\bheight=["']?(\d+)/i);
    const w = wM ? parseInt(wM[1] ?? "0", 10) : undefined;
    const h = hM ? parseInt(hM[1] ?? "0", 10) : undefined;

    // Filter icons / tiny images (min 100px to exclude decorations)
    if ((w !== undefined && w < 100) || (h !== undefined && h < 80)) continue;

    // Filter known junk patterns: plugin assets, dummy, icons, sprites, tracking pixels
    if (/icon|sprite|pixel|tracking|beacon|dummy|placeholder|widget|emoji|badge|spinner|loader|admin\/assets/i.test(resolved)) continue;
    // Filter SVGs (almost always icons/decorations, not photos)
    if (/\.svg(\?|$)/i.test(resolved)) continue;

    seen.add(resolved);

    // Score images: .jpg/.webp with alt text are likely real photos; small .png without alt are decorations
    const isJpg = /\.(jpg|jpeg|webp)/i.test(resolved);
    const hasAlt = alt.length > 2;
    const score = (isJpg ? 10 : 0) + (hasAlt ? 5 : 0) + (w && w > 400 ? 5 : 0);

    images.push({ url: resolved, alt, ...(w !== undefined && { width: w }), ...(h !== undefined && { height: h }), score });
  }

  // Also grab og:image
  const ogM = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
  if (ogM?.[1]) {
    const ogUrl = resolveUrl(base, ogM[1].trim());
    if (ogUrl && !seen.has(ogUrl)) {
      seen.add(ogUrl);
      images.unshift({ url: ogUrl, alt: "og:image", score: 20 });
    }
  }

  // Also grab background-image URLs from inline styles
  const bgRe = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  let bgM: RegExpExecArray | null;
  while ((bgM = bgRe.exec(html)) !== null) {
    const rawUrl = bgM[1]?.trim();
    if (!rawUrl || rawUrl.startsWith("data:")) continue;
    const resolved = resolveUrl(base, rawUrl);
    if (!resolved || seen.has(resolved)) continue;
    if (/\.(jpg|jpeg|png|webp)/i.test(resolved) && !/icon|sprite|pixel|dummy/i.test(resolved)) {
      seen.add(resolved);
      images.push({ url: resolved, alt: "background-image", score: 8 });
    }
  }

  // Sort by score (real photos first) — NO LIMIT, return ALL images
  images.sort((a, b) => ((b as any).score ?? 0) - ((a as any).score ?? 0));
  return images;
}

function extractVideos(html: string, base: string): Array<{ url: string; type: string }> {
  const videos: Array<{ url: string; type: string }> = [];

  // YouTube iframes
  const ytRe = /src=["']([^"']*(?:youtube\.com\/embed|youtu\.be)[^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = ytRe.exec(html)) !== null) {
    const url = m[1];
    if (url) videos.push({ url, type: "youtube" });
  }

  // Vimeo iframes
  const vmRe = /src=["']([^"']*vimeo\.com\/video\/[^"']*)["']/gi;
  while ((m = vmRe.exec(html)) !== null) {
    const url = m[1];
    if (url) videos.push({ url, type: "vimeo" });
  }

  // <video src>
  const vsRe = /<video[^>]*\bsrc=["']([^"']+)["']/gi;
  while ((m = vsRe.exec(html)) !== null) {
    const raw = m[1];
    if (raw) {
      const resolved = resolveUrl(base, raw);
      if (resolved) videos.push({ url: resolved, type: "video" });
    }
  }

  // <source src> inside <video> tags
  const srcRe = /<source[^>]*\bsrc=["']([^"']+)["'][^>]*\btype=["']([^"']*)["']/gi;
  while ((m = srcRe.exec(html)) !== null) {
    const raw = m[1];
    const mimeType = m[2] ?? "";
    if (raw && /video/i.test(mimeType)) {
      const resolved = resolveUrl(base, raw);
      if (resolved) videos.push({ url: resolved, type: mimeType.replace("video/", "") || "video" });
    }
  }

  // Direct .mp4/.webm links in href attributes
  const mp4Re = /href=["']([^"']+\.(?:mp4|webm|mov|avi))["']/gi;
  while ((m = mp4Re.exec(html)) !== null) {
    const raw = m[1];
    if (raw) {
      const resolved = resolveUrl(base, raw);
      if (resolved) videos.push({ url: resolved, type: "video" });
    }
  }

  // Deduplicate videos
  const seenVids = new Set<string>();
  return videos.filter(v => {
    if (seenVids.has(v.url)) return false;
    seenVids.add(v.url);
    return true;
  });
}

function extractContactFromHtml(html: string): {
  phone: string | null;
  email: string | null;
  address: string | null;
  whatsapp: string | null;
  openingHours: string | null;
} {
  // Phone — match tel: links first, then common patterns
  let phone: string | null = null;
  const telLink = html.match(/href=["']tel:([+\d\s\-().]+)["']/i);
  if (telLink?.[1]) {
    phone = telLink[1].trim();
  } else {
    const phoneRe = /(?:\+39|0039)?[\s.-]?(?:\d[\s.-]?){9,12}/g;
    const phoneM = html.match(phoneRe);
    if (phoneM) {
      const candidates = phoneM.filter(p => p.replace(/\D/g, "").length >= 9 && p.replace(/\D/g, "").length <= 13);
      if (candidates.length) phone = (candidates[0] ?? "").trim();
    }
  }

  // Email
  let email: string | null = null;
  const emailLink = html.match(/href=["']mailto:([^"'?]+)/i);
  if (emailLink?.[1]) {
    email = emailLink[1].trim();
  } else {
    const emailRe = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/;
    const emailM = html.match(emailRe);
    if (emailM?.[0] && !/@example|@domain|@email|@test/i.test(emailM[0])) {
      email = emailM[0];
    }
  }

  // Address — look for schema.org or common patterns
  let address: string | null = null;
  // Schema.org streetAddress or class="street-address"
  const addrSchema = html.match(/(?:itemprop=["']streetAddress["']|class=["'][^"']*(?:street-address|address)[^"']*["'])[^>]*>([\s\S]*?)<\//i);
  if (addrSchema?.[1]) {
    address = stripTags(addrSchema[1]).trim();
  }
  if (!address) {
    // Look for address-like text: Via/Viale/Piazza/Corso/Straße etc + word + number
    const addrRe = /\b(Via|Viale|Piazza|Corso|Stra(?:sse|ße|da)|Rue|Calle|Avenue|Street|Platz|Weg)\s+[^<\n]{5,80}/i;
    const addrM = html.match(addrRe);
    if (addrM?.[0]) address = stripTags(addrM[0]).trim().replace(/\s+/g, " ");
  }

  // WhatsApp
  let whatsapp: string | null = null;
  const waLink = html.match(/href=["'][^"']*(?:wa\.me|whatsapp\.com\/send)[?/](?:phone=)?(\+?[\d]+)/i);
  if (waLink?.[1]) {
    whatsapp = waLink[1].trim();
  }

  // Opening hours — look for schema.org openingHours or keywords
  let openingHours: string | null = null;
  const ohSchema = html.match(/itemprop=["']openingHours["'][^>]*content=["']([^"']+)/i);
  if (ohSchema?.[1]) {
    openingHours = ohSchema[1].trim();
  } else {
    // Text heuristic: "Lun-Ven 9:00-18:00" or "Mon-Fri"
    const ohRe =
      /(?:Lun|Mar|Mer|Gio|Ven|Sab|Dom|Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^<\n]{5,60}(?:\d{1,2}[:h]\d{2})[^<\n]{0,40}/i;
    const ohM = html.match(ohRe);
    if (ohM?.[0]) openingHours = stripTags(ohM[0]).trim();
  }

  return { phone, email, address, whatsapp, openingHours };
}

function extractSocialLinks(html: string): {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
} {
  const links: Record<string, string> = {};
  const re = /href=["']([^"']*(?:facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com)[^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = m[1] ?? "";
    if (/facebook\.com/.test(url) && !links["facebook"]) links["facebook"] = url;
    else if (/instagram\.com/.test(url) && !links["instagram"]) links["instagram"] = url;
    else if (/(?:twitter|x)\.com/.test(url) && !links["twitter"]) links["twitter"] = url;
    else if (/linkedin\.com/.test(url) && !links["linkedin"]) links["linkedin"] = url;
  }
  return links;
}

function extractNavigation(html: string, base: string): Array<{ label: string; url: string }> {
  // Look inside <nav> tag first
  const navBlock = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  const source = navBlock || html;

  const re = /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const nav: Array<{ label: string; url: string }> = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = re.exec(source)) !== null) {
    const href = m[1] ?? "";
    const label = innerText(m[2] ?? "").trim();

    if (!label || label.length > 40 || label.length < 2) continue;
    if (/privacy|cookie|terms|legal|login|register|cart/i.test(label)) continue;

    const resolved = resolveUrl(base, href);
    if (!resolved || !isSameDomain(base, resolved)) continue;
    if (seen.has(resolved)) continue;

    seen.add(resolved);
    nav.push({ label, url: resolved });
  }

  return nav; // No limit — preserve ALL navigation links
}

// ─── Site-wide extractors ─────────────────────────────────────────────────────

function extractLogo(html: string, base: string): string | null {
  // Common patterns: logo in header/nav, img with class/id containing "logo"
  const patterns = [
    /<(?:header|nav)[^>]*>[\s\S]*?<img[^>]+(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]+(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/i,
    /<a[^>]*href=["'][/]["'][^>]*>[\s\S]{0,200}?<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const resolved = resolveUrl(base, m[1].trim());
      if (resolved) return resolved;
    }
  }

  // og:image might be the logo on simple sites (not ideal but fallback)
  return null;
}

function extractFavicon(html: string, base: string): string | null {
  const patterns = [
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*apple-touch-icon[^"']*["']/i,
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const resolved = resolveUrl(base, m[1].trim());
      if (resolved) return resolved;
    }
  }
  // Default favicon path
  try {
    return new URL("/favicon.ico", base).href;
  } catch {
    return null;
  }
}

function extractColorsFromCss(html: string): {
  primary: string;
  accent: string;
  background: string;
  text: string;
} | null {
  // Extract inline <style> blocks and style attributes
  const styleBlocks: string[] = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(html)) !== null) {
    styleBlocks.push(m[1] ?? "");
  }
  const cssText = styleBlocks.join("\n");
  if (!cssText) return null;

  // Collect all hex colors
  const hexColors: string[] = [];
  let hm: RegExpExecArray | null;
  const hexReCopy = new RegExp(HEX_RE.source, "gi");
  while ((hm = hexReCopy.exec(cssText)) !== null) {
    const hex = hm[0].toLowerCase();
    if (!hexColors.includes(hex)) hexColors.push(hex);
  }

  if (hexColors.length < 2) return null;

  // Heuristic: primary = most common non-white/black/grey; background from body/html rules
  const bgCandidates = [...(cssText.match(/body[\s\S]{0,100}background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/gi) ?? [])];
  const bgM = bgCandidates[0]?.match(/#[0-9a-fA-F]{3,6}/i);
  const background = bgM?.[0]?.toLowerCase() ?? "#ffffff";

  // Filter: remove near-white and near-black for primary
  const colorful = hexColors.filter(h => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const lum = (r + g + b) / 3;
    return lum > 30 && lum < 220; // not black, not white
  });

  const primary = colorful[0] ?? hexColors[0] ?? "#1a1a1a";
  const accent = colorful[1] ?? colorful[0] ?? "#0066cc";
  const text = hexColors.find(h => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return (r + g + b) / 3 < 80;
  }) ?? "#1a1a1a";

  return { primary, accent, background, text };
}

function extractFontsFromCss(html: string): { heading: string; body: string } | null {
  // Look for Google Fonts imports
  const gfRe = /fonts\.googleapis\.com\/css[^"']*family=([^"'&]+)/gi;
  const fontFamilies: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = gfRe.exec(html)) !== null) {
    const fam = decodeURIComponent(m[1] ?? "")
      .split("|")
      .map(f => f.split(":")[0]?.replace(/\+/g, " ").trim() ?? "")
      .filter(Boolean);
    fontFamilies.push(...fam);
  }

  // Also extract from CSS font-family declarations
  const ffRe = /font-family:\s*["']?([a-zA-Z\s]+?)["']?(?:\s*,|\s*;)/g;
  while ((m = ffRe.exec(html)) !== null) {
    const fam = (m[1] ?? "").trim().replace(/['"]/g, "");
    if (fam && !["serif", "sans-serif", "monospace", "inherit", "initial"].includes(fam.toLowerCase())) {
      if (!fontFamilies.includes(fam)) fontFamilies.push(fam);
    }
  }

  if (fontFamilies.length === 0) return null;

  return {
    heading: fontFamilies[0] ?? "Georgia",
    body: fontFamilies[1] ?? fontFamilies[0] ?? "system-ui",
  };
}

function extractGoogleMapsEmbed(html: string): string | null {
  const iframeRe = /<iframe[^>]+src=["']([^"']*(?:google\.com\/maps|maps\.google\.com)[^"']*)["']/gi;
  const m = iframeRe.exec(html);
  return m?.[1] ?? null;
}

// ─── Link crawler ─────────────────────────────────────────────────────────────

function extractInternalLinks(html: string, base: string): string[] {
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  const links: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const href = m[1] ?? "";
    const resolved = resolveUrl(base, href);
    if (!resolved) continue;
    if (!isSameDomain(base, resolved)) continue;
    if (seen.has(resolved)) continue;
    if (SKIP_PATH_RE.test(new URL(resolved).pathname)) continue;
    // Skip non-HTML resources
    if (/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|zip|xml|json|woff|woff2|ttf|eot)(\?|$)/i.test(resolved)) continue;
    seen.add(resolved);
    links.push(resolved);
  }

  return links;
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

export async function scrapeWebsite(inputUrl: string): Promise<ScrapedWebsite> {
  // Normalize URL
  let baseUrl = inputUrl.trim();
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  // Remove trailing slash from origin for consistency
  try {
    const u = new URL(baseUrl);
    baseUrl = u.origin + u.pathname.replace(/\/$/, "") + (u.search || "");
  } catch {
    // keep as-is
  }

  const domain = parseDomain(baseUrl);
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  // ── Step 1: Fetch homepage ─────────────────────────────────────────────────
  const homepageHtml = await fetchPage(baseUrl);

  if (!homepageHtml) {
    return emptyResult(baseUrl, domain);
  }

  // ── Step 2: Discover internal links ───────────────────────────────────────
  const allLinks = extractInternalLinks(homepageHtml, baseUrl);
  // Homepage is always first; then unique internal pages
  const urlsToFetch = [baseUrl, ...allLinks.filter(l => l !== baseUrl)].slice(0, MAX_PAGES);

  // ── Step 3: Fetch all pages in parallel (bounded) ─────────────────────────
  const CONCURRENCY = 5;
  const htmlMap = new Map<string, string>();
  htmlMap.set(baseUrl, homepageHtml);

  const remaining = urlsToFetch.slice(1); // homepage already fetched
  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    if (Date.now() >= deadline) break;
    const batch = remaining.slice(i, i + CONCURRENCY);
    const timeLeft = deadline - Date.now();
    const results = await Promise.all(
      batch.map(url => fetchPage(url, Math.min(PAGE_TIMEOUT_MS, timeLeft)).then(html => ({ url, html })))
    );
    for (const { url, html } of results) {
      if (html) htmlMap.set(url, html);
    }
  }

  // ── Step 4: Parse each page ────────────────────────────────────────────────
  const pages: ScrapedPage[] = [];
  for (const [pageUrl, html] of htmlMap) {
    pages.push({
      url: pageUrl,
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
      headings: extractHeadings(html),
      paragraphs: extractParagraphs(html),
      images: extractImages(html, pageUrl),
      videos: extractVideos(html, pageUrl),
      isHomepage: pageUrl === baseUrl,
    });
  }

  // ── Step 5: Site-wide data (from homepage HTML) ────────────────────────────
  const hp = homepageHtml;

  const logo = extractLogo(hp, baseUrl);
  const favicon = extractFavicon(hp, baseUrl);
  const navigation = extractNavigation(hp, baseUrl);
  const colors = extractColorsFromCss(hp);
  const fonts = extractFontsFromCss(hp);
  const googleMapsEmbed = extractGoogleMapsEmbed(hp);

  // Merge contact info across all pages (priority to homepage and contact page)
  const contactPage =
    pages.find(p => /contact|contatt|kontakt|contact-us/i.test(p.url)) ?? pages[0];
  const contactHtml = htmlMap.get(contactPage?.url ?? "") ?? hp;
  const contact = extractContactFromHtml(contactHtml + hp);

  // WhatsApp: prefer wa.me link from any page
  let whatsapp = contact.whatsapp;
  if (!whatsapp) {
    for (const html of htmlMap.values()) {
      const wm = html.match(/href=["'][^"']*wa\.me\/(\+?[\d]+)/i);
      if (wm?.[1]) { whatsapp = wm[1]; break; }
    }
  }

  const socialLinks = extractSocialLinks(hp);

  return {
    url: baseUrl,
    domain,
    pages,
    logo,
    favicon,
    navigation,
    colors,
    fonts,
    contact: { ...contact, whatsapp },
    socialLinks,
    googleMapsEmbed,
    totalPages: pages.length,
  };
}

function emptyResult(url: string, domain: string): ScrapedWebsite {
  return {
    url,
    domain,
    pages: [],
    logo: null,
    favicon: null,
    navigation: [],
    colors: null,
    fonts: null,
    contact: { phone: null, email: null, address: null, whatsapp: null, openingHours: null },
    socialLinks: {},
    googleMapsEmbed: null,
    totalPages: 0,
  };
}
