/**
 * Maps a ScrapedWebsite to a ProjectData object for generateNextJsProject().
 * Uses real scraped content where available; falls back to sector-template defaults.
 */

import { getTemplateConfig } from "./templates.js";
import type { ProjectData } from "./generate-project.js";
import type { ScrapedWebsite, ScrapedPage } from "./website-scraper.js";

// ─── Sector hero images (Unsplash IDs) — kept in sync with generate-project ──
const SECTOR_HERO: Record<string, string> = {
  restaurant: "photo-1414235077428-338989a2e8c0",
  dental: "photo-1629909615957-be38d48fbbe4",
  beauty: "photo-1560066984-138daaa95dc0",
  fitness: "photo-1534438327276-14e5300c3a48",
  hotel: "photo-1542314831-068cd1dbfeeb",
  legal: "photo-1589829545856-d10d557cf95f",
  medical: "photo-1576091160550-2173dba999ef",
  ecommerce: "photo-1556742049-0cfed4f6a45d",
  realestate: "photo-1560518883-ce09059eeffa",
  professional: "photo-1497366216548-37526070297c",
};

const SECTOR_GALLERY: Record<string, string[]> = {
  restaurant: [
    "photo-1546069901-ba9599a7e63c", "photo-1414235077428-338989a2e8c0",
    "photo-1504674900247-0877df9cc836", "photo-1559339352-11d035aa65de",
  ],
  dental: [
    "photo-1629909615957-be38d48fbbe4", "photo-1588776814546-1ffb57a61b11",
    "photo-1606811971618-4486d14f3f99", "photo-1612349317150-e413f6a5b16d",
  ],
  beauty: [
    "photo-1560066984-138daaa95dc0", "photo-1522337360788-8b13dee7a37e",
    "photo-1487412720507-e7ab37603c6f", "photo-1516975080664-ed2fc6a32937",
  ],
  fitness: [
    "photo-1534438327276-14e5300c3a48", "photo-1571019613454-1cb2f99b2d8b",
    "photo-1517836357463-d25dfeac3438", "photo-1583454110551-21f2fa2afe61",
  ],
  hotel: [
    "photo-1542314831-068cd1dbfeeb", "photo-1631049307264-da0ec9d70304",
    "photo-1566073771259-6a8506099945", "photo-1551882547-ff40c63fe2fa",
  ],
  professional: [
    "photo-1497366216548-37526070297c", "photo-1497366811353-6870744d04b2",
    "photo-1454165804606-c3d57bc86b40", "photo-1521737604893-d14cc237f11d",
  ],
};

// ─── Helper utilities ─────────────────────────────────────────────────────────

function pickBestHeading(pages: ScrapedPage[], level = 1): string | null {
  // Prefer homepage, then other pages
  const ordered = [
    pages.find(p => p.isHomepage),
    ...pages.filter(p => !p.isHomepage),
  ].filter(Boolean) as ScrapedPage[];

  for (const page of ordered) {
    const h = page.headings.find(hd => hd.level === level);
    if (h?.text && h.text.length > 2 && h.text.length < 120) return h.text;
  }
  return null;
}

function pickBestParagraph(pages: ScrapedPage[], minLength = 80): string | null {
  const ordered = [
    pages.find(p => p.isHomepage),
    pages.find(p => /about|chi-siamo|ueber-uns|sobre/i.test(p.url)),
    ...pages,
  ].filter(Boolean) as ScrapedPage[];

  for (const page of ordered) {
    const p = page.paragraphs.find(t => t.length >= minLength);
    if (p) return p;
  }
  return null;
}

function collectAllImages(scraped: ScrapedWebsite): Array<{ url: string; alt: string }> {
  const seen = new Set<string>();
  const all: Array<{ url: string; alt: string }> = [];

  // Homepage first, then other pages
  const ordered = [
    scraped.pages.find(p => p.isHomepage),
    ...scraped.pages.filter(p => !p.isHomepage),
  ].filter(Boolean) as ScrapedPage[];

  for (const page of ordered) {
    for (const img of page.images) {
      if (!seen.has(img.url)) {
        seen.add(img.url);
        all.push({ url: img.url, alt: img.alt });
      }
    }
  }
  return all;
}

function collectAllHeadings(scraped: ScrapedWebsite): string[] {
  const texts: string[] = [];
  for (const page of scraped.pages) {
    for (const h of page.headings) {
      if (h.text && !texts.includes(h.text)) texts.push(h.text);
    }
  }
  return texts;
}

function inferBusinessName(scraped: ScrapedWebsite): string {
  // Try homepage title → strip common suffixes
  const homepage = scraped.pages.find(p => p.isHomepage);
  if (homepage?.title) {
    return homepage.title
      .split(/[-|–—|\/]/)[0]
      ?.trim()
      .replace(/\s+homepage|\s+home$/i, "")
      .trim() ?? scraped.domain;
  }
  // Fallback: prettify domain name
  return scraped.domain.split(".")[0]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Business";
}

function inferTagline(scraped: ScrapedWebsite, cfg: ReturnType<typeof getTemplateConfig>): string {
  // Try the h2 right after h1 on homepage
  const homepage = scraped.pages.find(p => p.isHomepage);
  if (homepage) {
    const h2 = homepage.headings.find(h => h.level === 2);
    if (h2?.text && h2.text.length < 100) return h2.text;
    // Or a short h1 sub-text
    const shortP = homepage.paragraphs.find(p => p.length < 120 && p.length > 20);
    if (shortP) return shortP;
  }
  return cfg.ctaLabel;
}

/** Convert scraped color palette to ProjectData ColorPalette */
function resolveColors(
  scraped: ScrapedWebsite,
  cfg: ReturnType<typeof getTemplateConfig>
): { primary: string; accent: string; background: string; text: string } {
  if (scraped.colors) return scraped.colors;
  return {
    primary: cfg.colors.primary,
    accent: cfg.colors.accent,
    background: cfg.colors.background,
    text: cfg.colors.text,
  };
}

/** Pick up to N gallery images: prefer real scraped ones, fall back to Unsplash */
function resolveGalleryImages(
  scraped: ScrapedWebsite,
  sector: string,
  businessName: string,
  count = 8
): Array<{ url: string; alt: string }> {
  const real = collectAllImages(scraped)
    // Filter out likely logos/icons (very small or SVG without size info)
    .filter(img => !img.url.endsWith(".svg") && !img.url.includes("logo") && !img.url.includes("icon"));

  if (real.length >= 3) {
    // We have real images — use up to `count` of them
    return real.slice(0, count);
  }

  // Fallback to Unsplash placeholders
  const ids = SECTOR_GALLERY[sector] ?? SECTOR_GALLERY["professional"]!;
  return ids.map(id => ({
    url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`,
    alt: businessName,
  }));
}

function resolveHeroImage(scraped: ScrapedWebsite, sector: string): string {
  // Try to find a wide hero-ish image from the homepage
  const homepage = scraped.pages.find(p => p.isHomepage);
  const heroImg = homepage?.images.find(img =>
    img.url.match(/hero|banner|slider|cover|header|bg/i) ||
    (img.width && img.height && img.width / img.height > 1.5 && img.width > 600)
  );
  if (heroImg) return heroImg.url;

  // Use the first large image from the homepage
  const largeImg = homepage?.images.find(img => !img.url.includes("logo") && !img.url.includes("icon"));
  if (largeImg) return largeImg.url;

  // Unsplash fallback
  const id = SECTOR_HERO[sector] ?? SECTOR_HERO["professional"]!;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function buildProjectFromContent(
  scraped: ScrapedWebsite,
  sector: string
): ProjectData {
  const cfg = getTemplateConfig(sector);

  // ── Business name ──────────────────────────────────────────────────────────
  const businessName = inferBusinessName(scraped);

  // ── Hero content ───────────────────────────────────────────────────────────
  const heroTitle = pickBestHeading(scraped.pages, 1) ?? businessName;
  const tagline = inferTagline(scraped, cfg);
  const heroImage = resolveHeroImage(scraped, sector);

  // ── Description / about ───────────────────────────────────────────────────
  const description =
    scraped.pages.find(p => p.isHomepage)?.metaDescription ??
    pickBestParagraph(scraped.pages) ??
    cfg.aboutText.replace(/\{name\}/g, businessName).replace(/\{city\}/g, "");

  const aboutText =
    pickBestParagraph(scraped.pages, 120) ??
    cfg.aboutText.replace(/\{name\}/g, businessName).replace(/\{city\}/g, "");

  // ── Contact ────────────────────────────────────────────────────────────────
  const phone = scraped.contact.phone ?? "";
  const email = scraped.contact.email ?? "";
  const address = scraped.contact.address ?? "";
  const whatsapp = scraped.contact.whatsapp ?? phone.replace(/\D/g, "");

  // ── SEO ────────────────────────────────────────────────────────────────────
  const homepage = scraped.pages.find(p => p.isHomepage);
  const metaTitle = homepage?.title ?? businessName;
  const metaDescription = homepage?.metaDescription ?? description.slice(0, 160);

  // ── Images ────────────────────────────────────────────────────────────────
  const galleryImages = resolveGalleryImages(scraped, sector, businessName);
  const colors = resolveColors(scraped, cfg);

  // ── Fonts ─────────────────────────────────────────────────────────────────
  // We inject scraped fonts into the template but keep the template's Google
  // Fonts URL — scraped font names are informational only and may not load.
  // (Actual font rendering uses the template's curated pair.)

  // ── Services (derived from headings + paragraphs if no structured data) ──
  // Build a simple services array from h2/h3 headings that look like service names
  const serviceHeadings = collectAllHeadings(scraped).filter(
    t =>
      t.length > 3 &&
      t.length < 80 &&
      !/privacy|cookie|home|about|chi siamo|contact|contatt|kontakt/i.test(t)
  );

  const menuItems =
    serviceHeadings.length > 0
      ? [
          {
            category: "Servizi",
            items: serviceHeadings.slice(0, 6).map(name => ({
              name,
              description: "",
              price: "",
            })),
          },
        ]
      : undefined;

  // ── Social links ──────────────────────────────────────────────────────────
  const socialLinks: { facebook?: string; instagram?: string; tripadvisor?: string } = {};
  if (scraped.socialLinks.facebook) socialLinks.facebook = scraped.socialLinks.facebook;
  if (scraped.socialLinks.instagram) socialLinks.instagram = scraped.socialLinks.instagram;

  return {
    businessName,
    tagline,
    description,
    aboutText,
    heroTitle,
    heroSubtitle: tagline,
    heroImage,
    cta: cfg.ctaLabel,
    metaTitle,
    metaDescription,
    address,
    phone,
    email,
    website: scraped.url,
    sector,
    language: "it",
    colors,
    galleryImages,
    menuItems,
    logoUrl: scraped.logo ?? undefined,
    whatsapp: whatsapp || undefined,
    googleMapsEmbedUrl: scraped.googleMapsEmbed ?? undefined,
    socialLinks,
    city: undefined, // domain-level data doesn't reliably give us city
  };
}
