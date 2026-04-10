/**
 * deploy-site.ts
 * Generates a complete single-page HTML website from content JSON
 * and deploys it to Vercel, then sets a custom subdomain alias.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl?: string | null;
}

interface HourEntry {
  open: string;
  close: string;
  closed: boolean;
}

interface GalleryImage {
  url: string;
  caption?: string;
}

interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

interface ServiceItem {
  name: string;
  description: string;
  icon?: string;
  price?: string;
}

export interface WebsiteContent {
  heroText?: string;
  heroDescription?: string;
  heroImage?: string;
  heroCtaText?: string;
  aboutText?: string;
  aboutImage?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappNumber?: string;
  menuItems?: MenuItem[];
  hours?: Record<string, HourEntry>;
  gallery?: GalleryImage[];
  testimonials?: Testimonial[];
  services?: ServiceItem[];
  primaryColor?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  [key: string]: unknown;
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

// ─── HTML generator ───────────────────────────────────────────────────────────

function stars(rating: number): string {
  return [1, 2, 3, 4, 5]
    .map((n) =>
      n <= rating
        ? `<span style="color:#f59e0b">&#9733;</span>`
        : `<span style="color:#d1d5db">&#9733;</span>`
    )
    .join("");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lunedì", tuesday: "Martedì", wednesday: "Mercoledì",
  thursday: "Giovedì", friday: "Venerdì", saturday: "Sabato", sunday: "Domenica",
  lun: "Lunedì", mar: "Martedì", mer: "Mercoledì",
  gio: "Giovedì", ven: "Venerdì", sab: "Sabato", dom: "Domenica",
};

function dayLabel(key: string): string {
  return DAY_LABELS[key.toLowerCase()] ?? (key.charAt(0).toUpperCase() + key.slice(1));
}

export function generateHTML(params: {
  companyName: string;
  sector: string;
  subdomain: string;
  content: WebsiteContent;
}): string {
  const { companyName, sector, subdomain, content } = params;

  const primary = content.primaryColor ?? "#4f46e5";
  const siteTitle = content.heroText ?? companyName;
  const siteDesc = content.heroDescription ?? `Il sito ufficiale di ${companyName}`;
  const heroImg = content.heroImage ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80";
  const aboutImg = content.aboutImage ?? "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80";
  const waNumber = content.whatsappNumber ? content.whatsappNumber.replace(/\D/g, "") : null;
  const canonicalUrl = `https://${subdomain}.madecreative.pro`;

  // Group menu items by category
  const menuByCategory: Record<string, MenuItem[]> = {};
  if (content.menuItems && content.menuItems.length > 0) {
    for (const item of content.menuItems) {
      const cat = item.category || "Altri";
      if (!menuByCategory[cat]) menuByCategory[cat] = [];
      menuByCategory[cat].push(item);
    }
  }

  // Pick display font based on sector
  const sectorFonts: Record<string, string> = {
    restaurant: "Playfair+Display",
    food: "Playfair+Display",
    beauty: "Cormorant+Garamond",
    wellness: "Cormorant+Garamond",
    retail: "Raleway",
    fashion: "Raleway",
    tech: "Space+Grotesk",
    default: "Lora",
  };
  const sectorKey = Object.keys(sectorFonts).find((k) =>
    sector.toLowerCase().includes(k)
  ) ?? "default";
  const displayFont = sectorFonts[sectorKey]!;
  const displayFontFamily = displayFont.replace(/\+/g, " ");

  // ── Sections ────────────────────────────────────────────────────────────────

  const aboutSection = content.aboutText
    ? `
  <!-- ABOUT -->
  <section id="about" class="section bg-off-white" data-animate>
    <div class="container">
      <div class="about-grid">
        <div class="about-text">
          <p class="section-tag">Chi siamo</p>
          <h2 class="section-title">La nostra storia</h2>
          <div class="about-body">${esc(content.aboutText).replace(/\n/g, "<br>")}</div>
        </div>
        <div class="about-image-wrap">
          <img src="${esc(aboutImg)}" alt="Chi siamo — ${esc(companyName)}" loading="lazy" class="about-img">
        </div>
      </div>
    </div>
  </section>`
    : "";

  const servicesSection =
    content.services && content.services.length > 0
      ? `
  <!-- SERVICES -->
  <section id="services" class="section bg-white" data-animate>
    <div class="container">
      <div class="section-header">
        <p class="section-tag">Cosa offriamo</p>
        <h2 class="section-title">I nostri servizi</h2>
      </div>
      <div class="cards-grid">
        ${content.services
          .map(
            (svc) => `
        <div class="card">
          ${svc.icon ? `<div class="card-icon" style="background:${esc(primary)}">${esc(svc.icon)}</div>` : ""}
          <h3 class="card-title">${esc(svc.name)}</h3>
          <p class="card-desc">${esc(svc.description)}</p>
          ${svc.price ? `<p class="card-price" style="color:${esc(primary)}">${esc(svc.price)}</p>` : ""}
        </div>`
          )
          .join("\n")}
      </div>
    </div>
  </section>`
      : "";

  const menuSection =
    content.menuItems && content.menuItems.length > 0
      ? `
  <!-- MENU -->
  <section id="menu" class="section bg-off-white" data-animate>
    <div class="container">
      <div class="section-header">
        <p class="section-tag">La nostra proposta</p>
        <h2 class="section-title">Il Menu</h2>
      </div>
      ${Object.entries(menuByCategory)
        .map(
          ([cat, items]) => `
      <div class="menu-category">
        <h3 class="menu-cat-title">${esc(cat)}</h3>
        <div class="menu-grid">
          ${items
            .map(
              (item) => `
          <div class="menu-item">
            <img src="${esc(item.imageUrl ?? "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=60")}" alt="${esc(item.name)}" loading="lazy" class="menu-item-img">
            <div class="menu-item-body">
              <div class="menu-item-row">
                <span class="menu-item-name">${esc(item.name)}</span>
                <span class="menu-item-price" style="color:${esc(primary)}">${esc(item.price)}</span>
              </div>
              ${item.description ? `<p class="menu-item-desc">${esc(item.description)}</p>` : ""}
            </div>
          </div>`
            )
            .join("\n")}
        </div>
      </div>`
        )
        .join("\n")}
    </div>
  </section>`
      : "";

  const gallerySection =
    content.gallery && content.gallery.length > 0
      ? `
  <!-- GALLERY -->
  <section id="gallery" class="section bg-white" data-animate>
    <div class="container">
      <div class="section-header">
        <p class="section-tag">I nostri momenti</p>
        <h2 class="section-title">Galleria</h2>
      </div>
      <div class="gallery-grid">
        ${content.gallery
          .map(
            (img) => `
        <div class="gallery-item">
          <img src="${esc(img.url)}" alt="${esc(img.caption ?? "Gallery")}" loading="lazy" class="gallery-img">
          ${img.caption ? `<div class="gallery-caption">${esc(img.caption)}</div>` : ""}
        </div>`
          )
          .join("\n")}
      </div>
    </div>
  </section>`
      : "";

  const testimonialsSection =
    content.testimonials && content.testimonials.length > 0
      ? `
  <!-- TESTIMONIALS -->
  <section class="section bg-off-white" data-animate>
    <div class="container">
      <div class="section-header">
        <p class="section-tag">Cosa dicono di noi</p>
        <h2 class="section-title">Recensioni</h2>
      </div>
      <div class="testimonials-grid">
        ${content.testimonials
          .map(
            (t) => `
        <div class="testimonial-card">
          <div class="testimonial-stars">${stars(t.rating)}</div>
          <p class="testimonial-text">"${esc(t.text)}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${esc(t.name.charAt(0).toUpperCase())}</div>
            <span class="testimonial-name">${esc(t.name)}</span>
          </div>
        </div>`
          )
          .join("\n")}
      </div>
    </div>
  </section>`
      : "";

  const hoursRows = content.hours
    ? Object.entries(content.hours)
        .map(
          ([day, h]) => `
            <div class="hours-row">
              <span class="hours-day">${esc(dayLabel(day))}</span>
              ${
                h.closed
                  ? `<span class="hours-closed">Chiuso</span>`
                  : `<span class="hours-time">${esc(h.open)} – ${esc(h.close)}</span>`
              }
            </div>`
        )
        .join("\n")
    : "";

  const contactSection =
    content.hours || content.phone || content.email || content.address
      ? `
  <!-- CONTACT -->
  <section id="contact" class="section bg-white" data-animate>
    <div class="container">
      <div class="section-header">
        <p class="section-tag">Vieni a trovarci</p>
        <h2 class="section-title">Orari e Contatti</h2>
      </div>
      <div class="contact-grid">
        ${
          content.hours
            ? `
        <div class="contact-box">
          <h3 class="contact-box-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${esc(primary)}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            Orari di apertura
          </h3>
          <div class="hours-list">
            ${hoursRows}
          </div>
        </div>`
            : ""
        }
        <div class="contact-box">
          <h3 class="contact-box-title">Contattaci</h3>
          <div class="contact-items">
            ${
              content.phone
                ? `<a href="tel:${esc(content.phone)}" class="contact-item">
                <div class="contact-icon" style="background:${esc(primary)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h0z"/></svg>
                </div>
                ${esc(content.phone)}
              </a>`
                : ""
            }
            ${
              content.email
                ? `<a href="mailto:${esc(content.email)}" class="contact-item">
                <div class="contact-icon" style="background:${esc(primary)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                ${esc(content.email)}
              </a>`
                : ""
            }
            ${
              content.address
                ? `<div class="contact-item">
                <div class="contact-icon" style="background:${esc(primary)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                ${esc(content.address)}
              </div>`
                : ""
            }
            ${
              waNumber
                ? `<a href="https://wa.me/${waNumber}" class="contact-whatsapp" target="_blank" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Scrivici su WhatsApp
              </a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  </section>`
      : "";

  const navLinks = [
    content.aboutText ? `<a href="#about" class="nav-link">Chi siamo</a>` : "",
    (content.services?.length || content.menuItems?.length) ? `<a href="#services" class="nav-link">Servizi</a>` : "",
    content.menuItems?.length ? `<a href="#menu" class="nav-link">Menu</a>` : "",
    content.gallery?.length ? `<a href="#gallery" class="nav-link">Galleria</a>` : "",
    (content.phone || content.email || content.address || content.hours) ? `<a href="#contact" class="nav-link">Contatti</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const socialLinks = [
    content.instagramUrl
      ? `<a href="${esc(content.instagramUrl)}" class="social-link" aria-label="Instagram" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </a>`
      : "",
    content.facebookUrl
      ? `<a href="${esc(content.facebookUrl)}" class="social-link" aria-label="Facebook" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
        </a>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(siteTitle)}</title>
  <meta name="description" content="${esc(siteDesc)}">
  <meta property="og:title" content="${esc(siteTitle)}">
  <meta property="og:description" content="${esc(siteDesc)}">
  <meta property="og:image" content="${esc(heroImg)}">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=${displayFont}:wght@400;600;700&display=swap" rel="stylesheet">

  <style>
    /* ── Reset & base ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 16px; }
    body {
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    img { display: block; max-width: 100%; }
    a { text-decoration: none; color: inherit; }

    /* ── Custom props ─────────────────────────────────── */
    :root {
      --primary: ${primary};
      --primary-dark: color-mix(in srgb, ${primary} 80%, black);
      --off-white: #f8f7f5;
      --border: #e8e6e1;
      --text-muted: #6b6b6b;
      --radius: 16px;
      --shadow-sm: 0 2px 8px rgba(0,0,0,.06);
      --shadow-md: 0 8px 32px rgba(0,0,0,.10);
      --shadow-lg: 0 24px 64px rgba(0,0,0,.14);
      --transition: .3s cubic-bezier(.4,0,.2,1);
    }

    /* ── Utility ──────────────────────────────────────── */
    .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .section { padding: 96px 0; }
    .bg-white { background: #fff; }
    .bg-off-white { background: var(--off-white); }
    .section-header { text-align: center; margin-bottom: 64px; }
    .section-tag {
      display: inline-block;
      font-size: .7rem;
      font-weight: 700;
      letter-spacing: .15em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 12px;
    }
    .section-title {
      font-family: '${displayFontFamily}', serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      color: #111;
      line-height: 1.2;
    }

    /* ── Scroll animation ─────────────────────────────── */
    [data-animate] { opacity: 0; transform: translateY(32px); transition: opacity .7s ease, transform .7s ease; }
    [data-animate].visible { opacity: 1; transform: none; }

    /* ── NAV ──────────────────────────────────────────── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,.97);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .nav-brand {
      font-family: '${displayFontFamily}', serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #111;
      flex-shrink: 0;
    }
    .nav-links { display: flex; align-items: center; gap: 32px; }
    .nav-link {
      font-size: .85rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: color var(--transition);
    }
    .nav-link:hover { color: #111; }
    .nav-cta {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 18px; border-radius: 100px;
      background: #25D366; color: #fff;
      font-size: .8rem; font-weight: 600;
      transition: opacity var(--transition);
      flex-shrink: 0;
    }
    .nav-cta:hover { opacity: .88; }
    .nav-hamburger { display: none; cursor: pointer; padding: 6px; background: none; border: none; }
    .nav-hamburger span {
      display: block; width: 22px; height: 2px;
      background: #333; margin: 5px 0;
      transition: var(--transition);
    }
    @media(max-width:768px) {
      .nav-links { display: none; }
      .nav-hamburger { display: block; }
      .nav-links.open {
        display: flex; flex-direction: column; gap: 16px;
        position: absolute; top: 64px; left: 0; right: 0;
        background: #fff; padding: 24px;
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-md);
      }
    }

    /* ── HERO ─────────────────────────────────────────── */
    .hero {
      position: relative;
      min-height: 92vh;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
    }
    .hero-bg img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, rgba(0,0,0,.68) 0%, rgba(0,0,0,.42) 50%, rgba(0,0,0,.62) 100%);
    }
    .hero-content {
      position: relative; z-index: 2;
      text-align: center;
      padding: 96px 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    .hero-eyebrow {
      font-size: .7rem; font-weight: 700;
      letter-spacing: .2em; text-transform: uppercase;
      color: rgba(255,255,255,.6);
      margin-bottom: 20px;
    }
    .hero-title {
      font-family: '${displayFontFamily}', serif;
      font-size: clamp(2.4rem, 7vw, 5rem);
      font-weight: 700;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 24px;
      text-shadow: 0 2px 20px rgba(0,0,0,.3);
    }
    .hero-desc {
      font-size: clamp(1rem, 2.2vw, 1.25rem);
      color: rgba(255,255,255,.82);
      line-height: 1.65;
      margin-bottom: 40px;
      max-width: 580px;
      margin-left: auto; margin-right: auto;
    }
    .hero-cta {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 36px; border-radius: 100px;
      background: var(--primary); color: #fff;
      font-weight: 600; font-size: 1rem;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.30); }
    .hero-scroll {
      position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
      z-index: 2; animation: bounce 2s infinite;
      color: rgba(255,255,255,.5);
    }
    @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }

    /* ── ABOUT ────────────────────────────────────────── */
    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }
    .about-text .section-tag { display: block; }
    .about-text .section-title { text-align: left; margin-bottom: 24px; }
    .about-body { font-size: .97rem; color: var(--text-muted); line-height: 1.85; }
    .about-image-wrap {
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      aspect-ratio: 4/3;
    }
    .about-img { width: 100%; height: 100%; object-fit: cover; }
    @media(max-width:768px) {
      .about-grid { grid-template-columns: 1fr; gap: 40px; }
    }

    /* ── CARDS (services) ─────────────────────────────── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    .card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .card-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; margin-bottom: 20px;
    }
    .card-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 10px; color: #111; }
    .card-desc { font-size: .88rem; color: var(--text-muted); line-height: 1.7; }
    .card-price { margin-top: 18px; font-size: 1.1rem; font-weight: 700; }

    /* ── MENU ─────────────────────────────────────────── */
    .menu-category { margin-bottom: 56px; }
    .menu-cat-title {
      font-family: '${displayFontFamily}', serif;
      font-size: 1.3rem; font-weight: 700;
      color: #111;
      padding-bottom: 16px;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
    }
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .menu-item {
      display: flex; gap: 0;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition), transform var(--transition);
    }
    .menu-item:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .menu-item-img { width: 88px; height: 88px; object-fit: cover; flex-shrink: 0; }
    .menu-item-body { flex: 1; padding: 14px 16px; min-width: 0; }
    .menu-item-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .menu-item-name { font-size: .9rem; font-weight: 600; color: #111; line-height: 1.3; }
    .menu-item-price { font-size: .9rem; font-weight: 700; flex-shrink: 0; }
    .menu-item-desc { font-size: .78rem; color: var(--text-muted); margin-top: 6px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* ── GALLERY ──────────────────────────────────────── */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .gallery-item {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      aspect-ratio: 1;
      box-shadow: var(--shadow-sm);
    }
    .gallery-img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
    .gallery-item:hover .gallery-img { transform: scale(1.06); }
    .gallery-caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,.65));
      color: #fff; font-size: .8rem; font-weight: 500;
      padding: 32px 16px 14px;
      opacity: 0; transition: opacity var(--transition);
    }
    .gallery-item:hover .gallery-caption { opacity: 1; }

    /* ── TESTIMONIALS ─────────────────────────────────── */
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    .testimonial-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
      box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column; gap: 14px;
    }
    .testimonial-stars { font-size: 1rem; line-height: 1; }
    .testimonial-text { font-size: .9rem; color: #444; line-height: 1.75; font-style: italic; flex: 1; }
    .testimonial-author { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border); }
    .testimonial-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: .95rem; font-weight: 700; flex-shrink: 0;
    }
    .testimonial-name { font-size: .85rem; font-weight: 600; color: #111; }

    /* ── CONTACT ──────────────────────────────────────── */
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    .contact-box {
      background: var(--off-white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
    }
    .contact-box-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: .95rem; color: #111;
      margin-bottom: 20px;
    }
    .hours-list { display: flex; flex-direction: column; gap: 0; }
    .hours-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      font-size: .88rem;
    }
    .hours-row:last-child { border-bottom: none; }
    .hours-day { font-weight: 500; color: #333; }
    .hours-time { font-weight: 600; color: #111; }
    .hours-closed { font-size: .75rem; font-weight: 700; color: #ef4444; background: #fef2f2; padding: 2px 10px; border-radius: 100px; }
    .contact-items { display: flex; flex-direction: column; gap: 14px; }
    .contact-item {
      display: flex; align-items: center; gap: 14px;
      font-size: .9rem; color: #333;
      transition: color var(--transition);
    }
    .contact-item:hover { color: var(--primary); }
    .contact-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .contact-whatsapp {
      display: flex; align-items: center; gap: 10px;
      background: #25D366; color: #fff;
      padding: 12px 18px; border-radius: 12px;
      font-size: .9rem; font-weight: 600;
      margin-top: 8px;
      transition: opacity var(--transition);
    }
    .contact-whatsapp:hover { opacity: .88; }

    /* ── FOOTER ───────────────────────────────────────── */
    .footer {
      background: #111;
      color: #aaa;
      padding: 64px 0 32px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 48px;
      margin-bottom: 48px;
    }
    .footer-brand-name {
      font-family: '${displayFontFamily}', serif;
      font-size: 1.2rem; font-weight: 700; color: #fff;
      margin-bottom: 12px;
    }
    .footer-brand-desc { font-size: .82rem; color: #666; line-height: 1.7; }
    .footer-heading {
      font-size: .7rem; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: #555;
      margin-bottom: 16px;
    }
    .footer-links { display: flex; flex-direction: column; gap: 10px; }
    .footer-link { font-size: .85rem; color: #777; transition: color var(--transition); }
    .footer-link:hover { color: #fff; }
    .footer-contact-list { display: flex; flex-direction: column; gap: 8px; }
    .footer-contact-item { display: flex; align-items: center; gap: 8px; font-size: .83rem; color: #666; }
    .social-links { display: flex; gap: 12px; margin-top: 16px; }
    .social-link {
      width: 36px; height: 36px; border-radius: 50%;
      background: #222; color: #888;
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition), color var(--transition);
    }
    .social-link:hover { background: var(--primary); color: #fff; }
    .footer-bottom {
      border-top: 1px solid #1f1f1f;
      padding-top: 28px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 8px;
      font-size: .78rem; color: #444;
    }
    .footer-badge { color: #555; }
    .footer-badge span { color: #666; font-weight: 500; }

    /* ── WhatsApp float ───────────────────────────────── */
    .wa-float {
      position: fixed; bottom: 28px; right: 28px; z-index: 999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #25D366;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 24px rgba(37,211,102,.45);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .wa-float:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(37,211,102,.55); }
    .wa-float svg { display: block; }

    /* ── Responsive ───────────────────────────────────── */
    @media(max-width:640px) {
      .section { padding: 64px 0; }
      .hero { min-height: 80vh; }
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav class="nav">
    <div class="container nav-inner">
      <a href="#" class="nav-brand">${esc(siteTitle)}</a>
      <div class="nav-links" id="nav-links">
        ${navLinks}
      </div>
      ${
        waNumber
          ? `<a href="https://wa.me/${waNumber}" class="nav-cta" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>`
          : ""
      }
      <button class="nav-hamburger" id="nav-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg">
      <img src="${esc(heroImg)}" alt="${esc(siteTitle)}" loading="eager" fetchpriority="high">
    </div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <p class="hero-eyebrow">Benvenuti</p>
      <h1 class="hero-title">${esc(siteTitle)}</h1>
      ${content.heroDescription ? `<p class="hero-desc">${esc(content.heroDescription)}</p>` : ""}
      <a href="#contact" class="hero-cta">
        ${esc(content.heroCtaText ?? "Scopri di più")}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
      </a>
    </div>
    <div class="hero-scroll" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
    </div>
  </section>

  ${aboutSection}
  ${servicesSection}
  ${menuSection}
  ${gallerySection}
  ${testimonialsSection}
  ${contactSection}

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <p class="footer-brand-name">${esc(siteTitle)}</p>
          ${content.heroDescription ? `<p class="footer-brand-desc">${esc(content.heroDescription.slice(0, 120))}${content.heroDescription.length > 120 ? "…" : ""}</p>` : ""}
          ${socialLinks ? `<div class="social-links">${socialLinks}</div>` : ""}
        </div>
        <div>
          <p class="footer-heading">Link rapidi</p>
          <div class="footer-links">
            ${content.aboutText ? `<a href="#about" class="footer-link">Chi siamo</a>` : ""}
            ${content.services?.length ? `<a href="#services" class="footer-link">Servizi</a>` : ""}
            ${content.menuItems?.length ? `<a href="#menu" class="footer-link">Menu</a>` : ""}
            ${content.gallery?.length ? `<a href="#gallery" class="footer-link">Galleria</a>` : ""}
            <a href="#contact" class="footer-link">Contatti</a>
          </div>
        </div>
        <div>
          <p class="footer-heading">Contatti</p>
          <div class="footer-contact-list">
            ${content.phone ? `<div class="footer-contact-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14h0z"/></svg>${esc(content.phone)}</div>` : ""}
            ${content.email ? `<div class="footer-contact-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${esc(content.email)}</div>` : ""}
            ${content.address ? `<div class="footer-contact-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${esc(content.address)}</div>` : ""}
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${esc(siteTitle)}. Tutti i diritti riservati.</p>
        <p class="footer-badge">Powered by <span>MadeCreative</span></p>
      </div>
    </div>
  </footer>

  ${
    waNumber
      ? `<!-- WhatsApp float -->
  <a href="https://wa.me/${waNumber}" class="wa-float" target="_blank" rel="noopener" aria-label="Contattaci su WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>`
      : ""
  }

  <script>
    // ── Hamburger toggle ───────────────────────────────
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('open');
      });
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
      });
    }

    // ── Scroll animation via IntersectionObserver ──────
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));
  </script>
</body>
</html>`;
}

// ─── Vercel deploy ────────────────────────────────────────────────────────────

interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState?: string;
}

interface VercelDomainResponse {
  name?: string;
  error?: { code: string; message: string };
}

export async function deploySite(params: {
  clientId: string;
  companyName: string;
  sector: string;
  content: Record<string, unknown>;
  subdomain: string;
}): Promise<{ deployUrl: string; vercelProjectId: string }> {
  const { companyName, sector, content, subdomain } = params;

  const VERCEL_TOKEN = process.env["VERCEL_TOKEN"];
  const VERCEL_TEAM_ID = process.env["VERCEL_TEAM_ID"];

  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  const projectName = `mc-${subdomain}`;

  // Generate HTML
  const htmlContent = generateHTML({
    companyName,
    sector,
    subdomain,
    content: content as WebsiteContent,
  });

  const vercelJson = JSON.stringify({ cleanUrls: true, trailingSlash: false });

  // Build URL with optional team ID
  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
  const teamQueryAmp = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";

  // ── Step 1: Create deployment ──────────────────────────────────────────────
  const deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      target: "production",
      files: [
        {
          file: "index.html",
          data: Buffer.from(htmlContent).toString("base64"),
          encoding: "base64",
        },
        {
          file: "vercel.json",
          data: Buffer.from(vercelJson).toString("base64"),
          encoding: "base64",
        },
      ],
      projectSettings: {
        framework: null,
      },
    }),
  });

  if (!deployRes.ok) {
    const errBody = await deployRes.text().catch(() => "");
    throw new Error(`Vercel deploy failed (${deployRes.status}): ${errBody.slice(0, 400)}`);
  }

  const deployment = (await deployRes.json()) as VercelDeploymentResponse;
  const vercelProjectId = deployment.name ?? projectName;

  // ── Step 2: Set custom domain alias ───────────────────────────────────────
  const customDomain = `${subdomain}.madecreative.pro`;

  try {
    const domainRes = await fetch(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/domains?upsert=true${teamQueryAmp}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: customDomain }),
      }
    );

    if (!domainRes.ok) {
      const domainBody = (await domainRes.json().catch(() => ({}))) as VercelDomainResponse;
      // Log but do not throw — deployment succeeded, domain is cosmetic
      console.warn(
        `[deploySite] Domain alias warning (${domainRes.status}):`,
        domainBody?.error?.message ?? JSON.stringify(domainBody).slice(0, 200)
      );
    }
  } catch (domainErr) {
    // Non-fatal: log and continue
    console.warn("[deploySite] Domain alias error (non-fatal):", domainErr);
  }

  // Disable Vercel deployment protection so site is publicly accessible
  try {
    await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}${teamQueryAmp ? `?${teamQueryAmp.slice(1)}` : ""}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ vercelAuthentication: { deploymentType: "none" } }),
      }
    );
  } catch {
    // Non-fatal
  }

  // Use Vercel deployment URL (custom domain needs DNS wildcard setup)
  const vercelUrl = deployment.url ? `https://${deployment.url}` : `https://${customDomain}`;
  const deployUrl = vercelUrl;

  return { deployUrl, vercelProjectId };
}
