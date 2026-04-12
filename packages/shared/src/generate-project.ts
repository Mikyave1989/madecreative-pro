/**
 * Generate a complete multi-page Next.js 14+ App Router project.
 *
 * Output structure:
 *   package.json
 *   next.config.mjs
 *   tsconfig.json
 *   app/layout.tsx         — metadata, fonts, Nav, Footer, WhatsApp, BackToTop
 *   app/globals.css         — full CSS design system
 *   app/page.tsx            — homepage: Hero + About preview + Services preview + Testimonials + CTA
 *   app/chi-siamo/page.tsx  — full about + stats + testimonials
 *   app/servizi/page.tsx    — full services grid
 *   app/galleria/page.tsx   — masonry gallery with lightbox modal
 *   app/contatti/page.tsx   — contact form + info + map
 *   lib/data.ts             — all business data as typed constants
 *   components/Hero.tsx     — 5 variants (split, centered, editorial, bold, cinematic)
 *   components/Nav.tsx      — glassmorphism + mobile hamburger drawer
 *   components/Footer.tsx
 *   components/Section.tsx  — reusable section wrapper with scroll reveal
 *   components/Stats.tsx    — counter animation on scroll
 *   components/ServiceCard.tsx
 *   components/GalleryGrid.tsx — with lightbox modal
 *   components/ContactForm.tsx
 *   components/BackToTop.tsx
 *   components/WhatsApp.tsx
 *   components/ScrollProgress.tsx
 *   components/Preloader.tsx
 *
 * Stack: Next.js 14, React 18, Framer Motion 11, TypeScript
 */

import { getTemplateConfig } from "./templates.js";
import type { TemplateConfig, TemplateColors } from "./templates.js";

/** Color palette for the project — matches TemplateColors subset */
export type ColorPalette = Pick<TemplateColors, "primary" | "accent" | "background" | "text">;

export interface ProjectData {
  businessName: string;
  tagline: string;
  description: string;
  aboutText?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  cta: string;
  metaTitle: string;
  metaDescription: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  sector: string;
  language: string;
  colors: ColorPalette;
  galleryImages: Array<{ url: string; alt?: string }>;
  menuItems?: Array<{ category: string; items: Array<{ name: string; description: string; price: string }> }>;
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  openingHours?: Array<{ day: string; open: string; close: string; closed?: boolean }>;
  googleRating?: number;
  reviewCount?: number;
  socialLinks?: { facebook?: string; instagram?: string; tripadvisor?: string };
  googleMapsEmbedUrl?: string;
  logoUrl?: string;
  whatsapp?: string;
  city?: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────

const J = JSON.stringify; // shorthand

// ─── Main ──────────────────────────────────────────────────────────────────

export function generateNextJsProject(data: ProjectData): Record<string, string> {
  const cfg = getTemplateConfig(data.sector);
  const f: Record<string, string> = {};

  f["package.json"] = genPackageJson(data);
  f["next.config.mjs"] = `/** @type {import('next').NextConfig} */\nexport default { images: { remotePatterns: [{ protocol: "https", hostname: "**" }] } };\n`;
  f["tsconfig.json"] = `{"compilerOptions":{"target":"es2017","lib":["dom","dom.iterable","esnext"],"allowJs":true,"skipLibCheck":true,"strict":false,"noEmit":true,"incremental":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","plugins":[{"name":"next"}],"paths":{"@/*":["./*"]}},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}`;

  f["lib/data.ts"] = genDataFile(data, cfg);
  f["app/globals.css"] = genGlobalsCss(cfg);
  f["app/layout.tsx"] = genLayout(data, cfg);
  f["app/page.tsx"] = genHomePage(data, cfg);
  f["app/chi-siamo/page.tsx"] = genChiSiamoPage();
  f["app/servizi/page.tsx"] = genServiziPage();
  f["app/galleria/page.tsx"] = genGalleriaPage();
  f["app/contatti/page.tsx"] = genContattiPage();

  f["components/Nav.tsx"] = genNav();
  f["components/Hero.tsx"] = genHero(cfg);
  f["components/Footer.tsx"] = genFooter();
  f["components/Section.tsx"] = genSection();
  f["components/Stats.tsx"] = genStats();
  f["components/ServiceCard.tsx"] = genServiceCard();
  f["components/GalleryGrid.tsx"] = genGalleryGrid();
  f["components/ContactForm.tsx"] = genContactForm();
  f["components/BackToTop.tsx"] = genBackToTop();
  f["components/WhatsApp.tsx"] = genWhatsApp();
  f["components/ScrollProgress.tsx"] = genScrollProgress();
  f["components/Preloader.tsx"] = genPreloader();

  return f;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function genPackageJson(d: ProjectData): string {
  return J({
    name: d.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: {
      next: "^14.2.0", react: "^18.3.0", "react-dom": "^18.3.0",
      "framer-motion": "^11.0.0",
    },
    devDependencies: {
      typescript: "^5.4.0", "@types/node": "^20.0.0", "@types/react": "^18.3.0", "@types/react-dom": "^18.3.0",
    },
  }, null, 2);
}

function genDataFile(d: ProjectData, cfg: TemplateConfig): string {
  const testimonials = d.testimonials?.length ? d.testimonials : [
    { name: "Marco R.", text: "Servizio eccezionale, superato ogni aspettativa. Torneremo sicuramente!", rating: 5 },
    { name: "Laura B.", text: "Professionalit\u00e0 e cura del dettaglio incredibili. Consiglio vivamente.", rating: 5 },
    { name: "Giovanni P.", text: "Esperienza fantastica dall'inizio alla fine. Staff gentilissimo.", rating: 5 },
  ];

  return `// Auto-generated by MadeCreative Builder Agent
// DO NOT EDIT — changes will be overwritten on next build

export const BUSINESS = ${J({
    name: d.businessName,
    tagline: d.tagline,
    description: d.description,
    aboutText: cfg.aboutText.replace(/\{name\}/g, d.businessName).replace(/\{city\}/g, d.city ?? ""),
    heroTitle: d.heroTitle,
    heroSubtitle: d.heroSubtitle,
    heroImage: d.heroImage,
    cta: d.cta,
    ctaSecondary: cfg.ctaSecondary,
    address: d.address,
    phone: d.phone,
    email: d.email,
    city: d.city ?? "",
    whatsapp: d.whatsapp ?? d.phone?.replace(/\\D/g, "") ?? "",
    logoUrl: d.logoUrl ?? "",
    googleRating: d.googleRating ?? 4.9,
    reviewCount: d.reviewCount ?? 127,
    googleMapsEmbedUrl: d.googleMapsEmbedUrl ?? "",
  }, null, 2)} as const;

export const COLORS = ${J({
    primary: cfg.colors.primary,
    accent: cfg.colors.accent,
    background: cfg.colors.background,
    text: cfg.colors.text,
    textLight: cfg.colors.textLight,
    border: cfg.colors.border,
    surface: cfg.colors.surface,
  }, null, 2)} as const;

export const FONTS = ${J({
    heading: cfg.fonts.heading,
    body: cfg.fonts.body,
  }, null, 2)} as const;

export const STATS = ${J(cfg.stats, null, 2)};

export const SERVICES = ${J(d.menuItems?.flatMap(cat =>
    cat.items.map(item => ({ icon: "\u2728", name: item.name, desc: item.description }))
  ) ?? [], null, 2)};

export const GALLERY = ${J(d.galleryImages.map(g => ({ url: g.url, alt: g.alt ?? d.businessName })), null, 2)};

export const TESTIMONIALS = ${J(testimonials, null, 2)};

export const HERO_VARIANT = ${J(cfg.heroVariant)};
`;
}

// ─── globals.css ────────────────────────────────────────────────────────────

function genGlobalsCss(cfg: TemplateConfig): string {
  const c = cfg.colors;
  return `/* MadeCreative Design System — ${cfg.sector} */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --p: ${c.primary}; --a: ${c.accent}; --bg: ${c.background}; --tx: ${c.text};
  --tl: ${c.textLight}; --bd: ${c.border}; --sf: ${c.surface};
  --fh: '${cfg.fonts.heading}', serif; --fb: '${cfg.fonts.body}', sans-serif;
}
html { scroll-behavior: smooth; }
body { font-family: var(--fb); background: var(--bg); color: var(--tx); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
::selection { background: var(--a); color: #fff; }

/* Scroll progress */
.scroll-progress { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--a), color-mix(in srgb, var(--a) 60%, #fff)); z-index: 300; transform-origin: left; }

/* Section */
.sec { padding: clamp(80px, 10vw, 120px) clamp(20px, 5vw, 48px); }
.sec-i { max-width: 1280px; margin: 0 auto; }
.sec-ey { font-size: 12px; font-weight: 700; color: var(--a); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
.sec-t { font-family: var(--fh); font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; color: var(--p); margin-bottom: 8px; }
.sec-ln { width: 56px; height: 2px; background: var(--a); margin: 20px 0 28px; }
.sec-d { font-size: 1.05rem; color: var(--tl); max-width: 520px; line-height: 1.75; }

/* Page header */
.page-hdr { background: var(--p); padding: 140px clamp(20px, 5vw, 48px) 80px; text-align: center; position: relative; overflow: hidden; }
.page-hdr h1 { font-family: var(--fh); font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 400; color: #fff; letter-spacing: -0.02em; position: relative; }
.page-hdr p { color: rgba(255,255,255,0.5); font-size: 1.05rem; margin-top: 12px; position: relative; }

/* Service cards */
.cd { background: var(--sf); border: 1px solid var(--bd); border-radius: 24px; padding: 36px 32px; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s; }
.cd::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--a); transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
.cd:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.06); }
.cd:hover::before { transform: scaleX(1); }
.cd-ic { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, var(--a), color-mix(in srgb, var(--a) 65%, var(--p))); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 24px; transition: transform 0.3s; }
.cd:hover .cd-ic { transform: scale(1.08) rotate(-5deg); }
.cd h3 { font-family: var(--fh); font-size: 1.15rem; font-weight: 700; margin-bottom: 12px; color: var(--p); }
.cd p { font-size: 0.92rem; color: var(--tl); line-height: 1.7; }

/* Stats */
.st { padding: 28px 20px; border-radius: 14px; text-align: center; transition: transform 0.3s; }
.st:hover { transform: translateY(-4px); }
.st-d { background: var(--p); }
.st-l { background: var(--bg); border: 1px solid var(--bd); }
.st-v { font-family: var(--fh); font-size: 2.2rem; font-weight: 600; line-height: 1; margin-bottom: 6px; }
.st-d .st-v { color: var(--a); } .st-l .st-v { color: var(--p); }
.st-lb { font-size: 0.78rem; letter-spacing: 0.03em; }
.st-d .st-lb { color: rgba(255,255,255,0.55); } .st-l .st-lb { color: var(--tl); }

/* Gallery */
.gal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.gal-item { border-radius: 14px; overflow: hidden; position: relative; cursor: pointer; aspect-ratio: 4/3; }
.gal-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
.gal-item:hover img { transform: scale(1.08); }

/* Testimonials */
.test-c { background: var(--sf); border: 1px solid var(--bd); border-radius: 20px; padding: 32px; transition: transform 0.3s; }
.test-c:hover { transform: translateY(-4px); }

/* Contact */
.ctc { background: var(--p); color: #fff; }
.ctc .sec-t { color: #fff; }
.ctc-form input, .ctc-form textarea { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 14px 18px; color: #fff; font-family: var(--fb); font-size: 0.95rem; outline: none; transition: border-color 0.3s, box-shadow 0.3s; width: 100%; }
.ctc-form input:focus, .ctc-form textarea:focus { border-color: var(--a); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 20%, transparent); }
.ctc-form input::placeholder, .ctc-form textarea::placeholder { color: rgba(255,255,255,0.25); }
.ctc-form textarea { resize: vertical; min-height: 120px; }
.ctc-form label { font-size: 0.75rem; font-weight: 600; color: var(--a); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; display: block; }

/* CTA Banner */
.cta-banner { background: var(--p); padding: clamp(60px, 8vw, 100px) clamp(20px, 5vw, 48px); text-align: center; }
.cta-banner h2 { font-family: var(--fh); font-size: clamp(1.8rem, 4vw, 3rem); color: #fff; margin-bottom: 16px; }
.cta-banner p { color: rgba(255,255,255,0.5); font-size: 1.05rem; margin-bottom: 32px; }

/* Buttons */
.btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--a); color: #fff; font-family: var(--fb); font-size: 0.9rem; font-weight: 700; padding: 16px 36px; border-radius: 14px; letter-spacing: 0.04em; border: none; cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 36px color-mix(in srgb, var(--a) 35%, transparent); }
.btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); color: #fff; border: 1px solid rgba(255,255,255,0.18); padding: 16px 36px; border-radius: 14px; font-weight: 600; font-size: 0.9rem; transition: all 0.25s; }
.btn-ghost:hover { background: rgba(255,255,255,0.15); }

/* Map */
.map-wrap { border-radius: 20px; overflow: hidden; height: 400px; border: 1px solid var(--bd); }
.map-wrap iframe { width: 100%; height: 100%; border: 0; }

/* WhatsApp */
.wa { position: fixed; bottom: 28px; right: 28px; z-index: 150; width: 60px; height: 60px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(37,211,102,0.35); }
.wa svg { width: 28px; height: 28px; fill: #fff; }

/* Back to top */
.btt { position: fixed; bottom: 100px; right: 28px; z-index: 140; width: 44px; height: 44px; border-radius: 50%; background: var(--p); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.btt:hover { background: var(--a); }

/* Footer */
.ft { background: var(--p); border-top: 1px solid rgba(255,255,255,0.06); padding: 40px clamp(20px, 5vw, 48px); }
.ft a { font-size: 0.85rem; color: rgba(255,255,255,0.4); transition: color 0.2s; }
.ft a:hover { color: var(--a); }

/* Responsive */
@media (max-width: 768px) {
  .nav-links { display: none !important; }
  .ham { display: flex !important; }
}
`;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

function genLayout(d: ProjectData, cfg: TemplateConfig): string {
  return `import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WhatsApp } from "@/components/WhatsApp";
import { BackToTop } from "@/components/BackToTop";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Preloader } from "@/components/Preloader";

export const metadata: Metadata = {
  title: { default: ${J(d.metaTitle)}, template: \`%s | ${d.businessName}\` },
  description: ${J(d.metaDescription)},
  openGraph: {
    title: ${J(d.metaTitle)},
    description: ${J(d.metaDescription)},
    images: [${J(d.heroImage)}],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang=${J(d.language)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href=${J(cfg.fonts.googleFontsUrl)} rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(cfg.colors.accent)}'/><text x='50' y='72' font-size='60' text-anchor='middle' fill='white' font-family='system-ui'>${(d.businessName[0] ?? "M").toUpperCase()}</text></svg>" />
      </head>
      <body>
        <Preloader />
        <ScrollProgress />
        <Nav />
        {children}
        <Footer />
        <WhatsApp />
        <BackToTop />
      </body>
    </html>
  );
}
`;
}

// ─── Homepage ───────────────────────────────────────────────────────────────

function genHomePage(d: ProjectData, cfg: TemplateConfig): string {
  return `import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { Stats } from "@/components/Stats";
import { ServiceCard } from "@/components/ServiceCard";
import { GalleryGrid } from "@/components/GalleryGrid";
import { BUSINESS, SERVICES, GALLERY, TESTIMONIALS, STATS } from "@/lib/data";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />

      {/* About preview */}
      <Section eyebrow="La nostra storia" title="Chi Siamo" bg="surface">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px, 6vw, 80px)", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.85 }}>{BUSINESS.aboutText}</p>
            <Link href="/chi-siamo" className="btn-primary" style={{ marginTop: 28, display: "inline-flex" }}>
              Scopri di pi\u00f9 \u2192
            </Link>
          </div>
          <Stats stats={STATS} />
        </div>
      </Section>

      {/* Services preview */}
      <Section eyebrow="Cosa offriamo" title="I nostri servizi" desc="Eccellenza in ogni dettaglio, soluzioni su misura.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 48 }}>
          {SERVICES.slice(0, 3).map((s, i) => (
            <ServiceCard key={i} icon={s.icon} name={s.name} desc={s.desc} delay={i * 0.1} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/servizi" className="btn-primary">Tutti i servizi \u2192</Link>
        </div>
      </Section>

      {/* Gallery preview */}
      <Section eyebrow="Galleria" title="I nostri momenti" bg="surface" center>
        <GalleryGrid images={GALLERY.slice(0, 3)} />
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/galleria" className="btn-primary">Vedi tutta la galleria \u2192</Link>
        </div>
      </Section>

      {/* Testimonials */}
      <Section eyebrow="Recensioni" title="Cosa dicono i nostri clienti" center>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 48 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-c">
              <div style={{ color: "var(--a)", fontSize: 16, letterSpacing: 3, marginBottom: 16 }}>
                {"\u2605".repeat(t.rating)}{"\u2606".repeat(5 - t.rating)}
              </div>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>
                \u201C{t.text}\u201D
              </p>
              <p style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "0.95rem", color: "var(--p)" }}>{t.name}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA Banner */}
      <div className="cta-banner">
        <h2>{BUSINESS.tagline}</h2>
        <p>Contattaci oggi per una consulenza gratuita</p>
        <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
      </div>
    </>
  );
}
`;
}

// ─── Inner pages ────────────────────────────────────────────────────────────

function genChiSiamoPage(): string {
  return `import { Section } from "@/components/Section";
import { Stats } from "@/components/Stats";
import { BUSINESS, STATS, TESTIMONIALS } from "@/lib/data";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chi Siamo" };

export default function ChiSiamo() {
  return (
    <>
      <div className="page-hdr">
        <h1>Chi Siamo</h1>
        <p>{BUSINESS.tagline}</p>
      </div>

      <Section eyebrow="La nostra storia" title="La nostra missione" bg="surface">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px, 6vw, 80px)", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.85 }}>{BUSINESS.aboutText}</p>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.85, marginTop: 20 }}>{BUSINESS.description}</p>
          </div>
          <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "4/5" }}>
            <img src={BUSINESS.heroImage} alt={BUSINESS.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </Section>

      <Section eyebrow="I numeri" title="Il nostro impatto" center>
        <div style={{ maxWidth: 600, margin: "48px auto 0" }}>
          <Stats stats={STATS} />
        </div>
      </Section>

      <Section eyebrow="Recensioni" title="Cosa dicono di noi" bg="surface" center>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 48 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-c">
              <div style={{ color: "var(--a)", fontSize: 16, letterSpacing: 3, marginBottom: 16 }}>
                {"\u2605".repeat(t.rating)}{"\u2606".repeat(5 - t.rating)}
              </div>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>\u201C{t.text}\u201D</p>
              <p style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "0.95rem", color: "var(--p)" }}>{t.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="cta-banner">
        <h2>Vuoi saperne di pi\u00f9?</h2>
        <p>Siamo sempre disponibili per te</p>
        <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
      </div>
    </>
  );
}
`;
}

function genServiziPage(): string {
  return `import { Section } from "@/components/Section";
import { ServiceCard } from "@/components/ServiceCard";
import { BUSINESS, SERVICES } from "@/lib/data";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Servizi" };

export default function Servizi() {
  return (
    <>
      <div className="page-hdr">
        <h1>I Nostri Servizi</h1>
        <p>Eccellenza in ogni dettaglio</p>
      </div>

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {SERVICES.map((s, i) => (
            <ServiceCard key={i} icon={s.icon} name={s.name} desc={s.desc} delay={i * 0.08} />
          ))}
        </div>
      </Section>

      <div className="cta-banner">
        <h2>Interessato ai nostri servizi?</h2>
        <p>Contattaci per un preventivo personalizzato</p>
        <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
      </div>
    </>
  );
}
`;
}

function genGalleriaPage(): string {
  return `"use client";
import { Section } from "@/components/Section";
import { GalleryGrid } from "@/components/GalleryGrid";
import { BUSINESS, GALLERY } from "@/lib/data";
import Link from "next/link";

export default function Galleria() {
  return (
    <>
      <div className="page-hdr">
        <h1>Galleria</h1>
        <p>I nostri momenti migliori</p>
      </div>

      <Section>
        <GalleryGrid images={GALLERY} withLightbox />
      </Section>

      <div className="cta-banner">
        <h2>Ti piace quello che vedi?</h2>
        <p>Vieni a trovarci di persona</p>
        <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
      </div>
    </>
  );
}
`;
}

function genContattiPage(): string {
  return `import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { BUSINESS } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contatti" };

export default function Contatti() {
  return (
    <>
      <div className="page-hdr">
        <h1>Contatti</h1>
        <p>Siamo qui per te</p>
      </div>

      <section className="sec ctc">
        <div className="sec-i">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px, 4vw, 64px)", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                { icon: "\ud83d\udccd", label: "Indirizzo", value: BUSINESS.address },
                { icon: "\ud83d\udcde", label: "Telefono", value: BUSINESS.phone },
                { icon: "\u2709\ufe0f", label: "Email", value: BUSINESS.email },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, width: 48, height: 48, background: "rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "var(--a)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {BUSINESS.googleMapsEmbedUrl && (
        <div className="map-wrap" style={{ borderRadius: 0, height: 450, border: "none" }}>
          <iframe src={BUSINESS.googleMapsEmbedUrl} allowFullScreen loading="lazy" title="Mappa" />
        </div>
      )}
    </>
  );
}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function genNav(): string {
  return `"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BUSINESS } from "@/lib/data";

const LINKS = [
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/servizi", label: "Servizi" },
  { href: "/galleria", label: "Galleria" },
  { href: "/contatti", label: "Contatti" },
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const showSolid = solid || !isHome;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          height: 72, display: "flex", alignItems: "center",
          padding: "0 clamp(20px, 5vw, 48px)",
          background: showSolid ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: showSolid ? "blur(24px) saturate(200%)" : "none",
          borderBottom: showSolid ? "1px solid var(--bd)" : "none",
          boxShadow: showSolid ? "0 1px 20px rgba(0,0,0,0.04)" : "none",
          transition: "background 0.4s, backdrop-filter 0.4s, border 0.4s, box-shadow 0.4s",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 210 }}>
            {BUSINESS.logoUrl ? (
              <img src={BUSINESS.logoUrl} alt={BUSINESS.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fh)", fontWeight: 700, fontSize: 18, color: "#fff" }}>
                {BUSINESS.name[0]}
              </div>
            )}
            <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: showSolid ? "var(--p)" : "#fff" }}>
              {BUSINESS.name}
            </span>
          </Link>

          <div className="nav-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={{
                fontSize: 14, fontWeight: 500, position: "relative",
                color: pathname === l.href ? "var(--a)" : showSolid ? "var(--tl)" : "rgba(255,255,255,0.8)",
              }}>
                {l.label}
              </Link>
            ))}
            <Link href="/contatti" style={{
              background: "var(--a)", color: "#fff", padding: "12px 28px",
              borderRadius: 12, fontSize: 13, fontWeight: 700, letterSpacing: "0.03em",
            }}>
              {BUSINESS.cta}
            </Link>
          </div>

          <button className="ham" onClick={() => setOpen(!open)} aria-label="Menu"
            style={{ display: "none", width: 44, height: 44, border: "none", background: "none", cursor: "pointer", zIndex: 210, position: "relative", padding: 0, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <motion.span animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} style={{ display: "block", width: 24, height: 2, borderRadius: 2, background: showSolid ? "var(--tx)" : "#fff" }} />
            <motion.span animate={open ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }} style={{ display: "block", width: 24, height: 2, borderRadius: 2, background: showSolid ? "var(--tx)" : "#fff" }} />
            <motion.span animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} style={{ display: "block", width: 24, height: 2, borderRadius: 2, background: showSolid ? "var(--tx)" : "#fff" }} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 202 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, width: "min(320px, 85vw)", height: "100vh", background: "var(--sf)", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)", zIndex: 205, padding: "96px 32px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/" style={{ fontFamily: "var(--fh)", fontSize: "1.2rem", fontWeight: 600, color: "var(--p)", padding: "16px 0", borderBottom: "1px solid var(--bd)" }}>Home</Link>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontFamily: "var(--fh)", fontSize: "1.2rem", fontWeight: 600, color: "var(--p)", padding: "16px 0", borderBottom: "1px solid var(--bd)" }}>
                  {l.label}
                </Link>
              ))}
              <Link href="/contatti" style={{ marginTop: "auto", background: "var(--a)", color: "#fff", textAlign: "center", padding: 16, borderRadius: 14, fontWeight: 700 }}>
                {BUSINESS.cta}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
`;
}

function genHero(cfg: TemplateConfig): string {
  // Generate the correct hero based on heroVariant
  return `"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { BUSINESS, HERO_VARIANT } from "@/lib/data";
import Link from "next/link";

function CharReveal({ text, delay = 0.5 }: { text: string; delay?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span>{text}</span>;
  return (
    <>
      {text.split("").map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: 25, rotateX: -35 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: delay + i * 0.035, duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          style={{ display: "inline-block" }}>
          {c === " " ? "\\u00A0" : c}
        </motion.span>
      ))}
    </>
  );
}

function Badge() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
      style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "16px 24px", marginTop: 48 }}>
      <div>
        <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{BUSINESS.googleRating}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>su Google</div>
      </div>
      <div>
        <div style={{ color: "var(--a)", fontSize: 14, letterSpacing: 2 }}>
          {"\u2605".repeat(Math.round(BUSINESS.googleRating))}{"\u2606".repeat(5 - Math.round(BUSINESS.googleRating))}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{BUSINESS.reviewCount}+ recensioni</div>
      </div>
    </motion.div>
  );
}

function HeroOverlay() {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, var(--p) 0%, transparent 45%, var(--p) 100%)", opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E\\")", pointerEvents: "none" }} />
    </>
  );
}

function HeroCentered() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"]);
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <motion.div style={{ position: "absolute", inset: 0, y: bgY }}>
        <img src={BUSINESS.heroImage} alt={BUSINESS.name} style={{ width: "100%", height: "120%", objectFit: "cover" }} />
      </motion.div>
      <HeroOverlay />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "140px clamp(20px, 5vw, 48px) 100px", width: "100%", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "10px 22px", marginBottom: 32 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--a)", boxShadow: "0 0 16px var(--a)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{BUSINESS.tagline}</span>
        </motion.div>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: "clamp(2.8rem, 6vw, 5.5rem)", fontWeight: 300, color: "#fff", lineHeight: 1.04, marginBottom: 24, letterSpacing: "-0.03em" }}>
          <CharReveal text={BUSINESS.name + "."} />
        </h1>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }}
          style={{ width: 72, height: 2, background: "var(--a)", marginBottom: 24, transformOrigin: "left", marginLeft: "auto", marginRight: "auto" }} />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)", color: "rgba(255,255,255,0.6)", maxWidth: 520, lineHeight: 1.8, marginBottom: 40, marginLeft: "auto", marginRight: "auto" }}>
          {BUSINESS.heroSubtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
          <Link href="/servizi" className="btn-ghost">{BUSINESS.ctaSecondary}</Link>
        </motion.div>
        <Badge />
      </div>
    </section>
  );
}

function HeroSplit() {
  return (
    <section style={{ background: "var(--p)", display: "flex", alignItems: "center", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E\\")", pointerEvents: "none" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1280, margin: "0 auto", padding: "120px clamp(20px, 5vw, 48px) 80px", gap: "clamp(32px, 4vw, 64px)", width: "100%", alignItems: "center", position: "relative", zIndex: 2 }}>
        <div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "10px 22px", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--a)", boxShadow: "0 0 16px var(--a)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{BUSINESS.tagline}</span>
          </motion.div>
          <h1 style={{ fontFamily: "var(--fh)", fontSize: "clamp(2.8rem, 6vw, 5.5rem)", fontWeight: 300, color: "#fff", lineHeight: 1.04, marginBottom: 24, letterSpacing: "-0.03em" }}>
            <CharReveal text={BUSINESS.name + "."} />
          </h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }}
            style={{ width: 72, height: 2, background: "var(--a)", marginBottom: 24, transformOrigin: "left" }} />
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)", color: "rgba(255,255,255,0.6)", maxWidth: 520, lineHeight: 1.8, marginBottom: 40 }}>
            {BUSINESS.heroSubtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/contatti" className="btn-primary">{BUSINESS.cta} \u2192</Link>
            <Link href="/servizi" className="btn-ghost">{BUSINESS.ctaSecondary}</Link>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 1 }}
          style={{ position: "relative" }}>
          <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "4/5", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
            <img src={BUSINESS.heroImage} alt={BUSINESS.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <Badge />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroBold() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"]);
  return (
    <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <motion.div style={{ position: "absolute", inset: 0, y: bgY }}>
        <img src={BUSINESS.heroImage} alt={BUSINESS.name} style={{ width: "100%", height: "120%", objectFit: "cover" }} />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)" }} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: "100vh", paddingBottom: 80 }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: "clamp(3rem, 10vw, 8rem)", fontWeight: 900, color: "#fff", lineHeight: 0.92, letterSpacing: "-0.04em", marginBottom: 12, textTransform: "uppercase" }}>
          <CharReveal text={BUSINESS.name} delay={0.3} />
        </h1>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }}
          style={{ width: 80, height: 6, background: "var(--a)", marginBottom: 24, borderRadius: 3, transformOrigin: "left" }} />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)", color: "rgba(255,255,255,0.6)", maxWidth: 520, lineHeight: 1.8, marginBottom: 40 }}>
          {BUSINESS.heroSubtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/contatti" className="btn-primary" style={{ padding: "20px 48px", fontSize: "1.05rem" }}>{BUSINESS.cta} \u2192</Link>
          <Link href="/servizi" className="btn-ghost">{BUSINESS.ctaSecondary}</Link>
        </motion.div>
      </div>
    </section>
  );
}

// Export the right hero variant
export function Hero() {
  const variants: Record<string, () => JSX.Element> = {
    split: HeroSplit,
    centered: HeroCentered,
    bold: HeroBold,
    editorial: HeroCentered, // editorial uses centered with larger text
    cinematic: HeroCentered, // cinematic uses centered with ken burns
  };
  const Component = variants[HERO_VARIANT] || HeroCentered;
  return <Component />;
}
`;
}

function genFooter(): string {
  return `import Link from "next/link";
import { BUSINESS } from "@/lib/data";

export function Footer() {
  return (
    <footer className="ft">
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "var(--fh)", fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{BUSINESS.name}</span>
          {BUSINESS.address && <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>{BUSINESS.address}</span>}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[{ href: "/", label: "Home" }, { href: "/chi-siamo", label: "Chi siamo" }, { href: "/servizi", label: "Servizi" }, { href: "/galleria", label: "Galleria" }, { href: "/contatti", label: "Contatti" }].map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>\u00a9 ${new Date().getFullYear()} {BUSINESS.name} \u00b7 Sito creato con MadeCreative</span>
      </div>
    </footer>
  );
}
`;
}

function genSection(): string {
  return `"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Section({ children, eyebrow, title, desc, bg, center }: {
  children: React.ReactNode; eyebrow?: string; title?: string; desc?: string;
  bg?: "surface" | "background"; center?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} className="sec" style={{ background: bg === "surface" ? "var(--sf)" : "var(--bg)" }}>
      <div className="sec-i">
        {(eyebrow || title) && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
            style={center ? { textAlign: "center" } : {}}>
            {eyebrow && <p className="sec-ey">{eyebrow}</p>}
            {title && <h2 className="sec-t" style={center ? { marginLeft: "auto", marginRight: "auto" } : {}}>{title}</h2>}
            {!center && <div className="sec-ln" />}
            {desc && <p className="sec-d">{desc}</p>}
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.15 }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
`;
}

function genStats(): string {
  return `"use client";
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

function Counter({ value, inView }: { value: string; inView: boolean }) {
  const [display, setDisplay] = useState(value);
  const num = parseFloat(value.replace(/[^\\d.]/g, ""));
  const suffix = value.replace(/[\\d.]/g, "");
  const isFloat = value.includes(".");

  useEffect(() => {
    if (!inView || isNaN(num)) return;
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = eased * num;
      setDisplay((isFloat ? v.toFixed(1) : Math.round(v).toString()) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, num, suffix, isFloat]);

  return <>{display}</>;
}

export function Stats({ stats }: { stats: Array<{ value: string; label: string; dark?: boolean }> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {stats.map((s, i) => (
        <div key={i} className={\`st \${s.dark ? "st-d" : "st-l"}\`}>
          <p className="st-v"><Counter value={s.value} inView={inView} /></p>
          <p className="st-lb">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
`;
}

function genServiceCard(): string {
  return `"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function ServiceCard({ icon, name, desc, delay = 0 }: { icon: string; name: string; desc: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className="cd"
      initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}>
      <div className="cd-ic">{icon}</div>
      <h3>{name}</h3>
      <p>{desc}</p>
    </motion.div>
  );
}
`;
}

function genGalleryGrid(): string {
  return `"use client";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

export function GalleryGrid({ images, withLightbox }: { images: Array<{ url: string; alt: string }>; withLightbox?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <div ref={ref} className="gal-grid" style={{ marginTop: 48 }}>
        {images.map((img, i) => (
          <motion.div key={i} className="gal-item"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            onClick={() => withLightbox && setSelected(i)}>
            <img src={img.url} alt={img.alt} loading="lazy" />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, cursor: "pointer" }}>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={images[selected]?.url} alt={images[selected]?.alt}
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
            <span style={{ position: "absolute", top: 20, right: 28, color: "#fff", fontSize: 32, cursor: "pointer", opacity: 0.7 }}>\u00d7</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
`;
}

function genContactForm(): string {
  return `"use client";
import { useState } from "react";
import { BUSINESS } from "@/lib/data";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form className="ctc-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div><label htmlFor="fn">Nome</label><input id="fn" name="name" placeholder="Il tuo nome" required /></div>
        <div><label htmlFor="fe">Email</label><input id="fe" name="email" type="email" placeholder="La tua email" required /></div>
      </div>
      <div><label htmlFor="fp">Telefono</label><input id="fp" name="phone" type="tel" placeholder="Il tuo numero (opzionale)" /></div>
      <div><label htmlFor="fm">Messaggio</label><textarea id="fm" name="message" placeholder="Come possiamo aiutarti?" required /></div>
      <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", background: sent ? "#22c55e" : undefined }}>
        {sent ? "Inviato \u2713" : \`\${BUSINESS.cta} \u2192\`}
      </button>
    </form>
  );
}
`;
}

function genScrollProgress(): string {
  return `"use client";
import { motion, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />;
}
`;
}

function genBackToTop(): string {
  return `"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button className="btt" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Torna su">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
`;
}

function genWhatsApp(): string {
  return `"use client";
import { motion } from "framer-motion";
import { BUSINESS } from "@/lib/data";

export function WhatsApp() {
  if (!BUSINESS.whatsapp) return null;
  return (
    <motion.a href={\`https://wa.me/\${BUSINESS.whatsapp}\`} target="_blank" rel="noopener" className="wa" aria-label="WhatsApp"
      animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      whileHover={{ scale: 1.1 }}>
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </motion.a>
  );
}
`;
}

function genPreloader(): string {
  return `"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const onLoad = () => setTimeout(() => setLoading(false), 300);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    const timeout = setTimeout(() => setLoading(false), 2500);
    return () => { window.removeEventListener("load", onLoad); clearTimeout(timeout); };
  }, []);
  return (
    <AnimatePresence>
      {loading && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          style={{ position: "fixed", inset: 0, background: "var(--bg)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
            style={{ width: 40, height: 40, border: "3px solid var(--bd)", borderTopColor: "var(--a)", borderRadius: "50%" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT TO PREVIEW HTML — renders Next.js project via React CDN + Tailwind CDN
// Single source of truth: generateNextJsProject() → projectToPreviewHtml()
// ═══════════════════════════════════════════════════════════════════════════

function stripModules(code: string): string {
  return code
    .replace(/^"use client";\s*/gm, "")
    .replace(/^import\s+[^;]*;\s*/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "");
}

/**
 * Convert Next.js project files to a self-contained React preview HTML.
 * Strategy: extract data from lib/data.ts, render with React+Babel CDN.
 * Uses Tailwind CDN for styling. Gallery photos, stats, testimonials all work.
 */
export function projectToPreviewHtml(files: Record<string, string>): string {
  const dataTs = files["lib/data.ts"] ?? "";
  const layout = files["app/layout.tsx"] ?? "";
  const css = (files["app/globals.css"] ?? "").replace(/@tailwind\s+\w+;\s*/g, "").replace(/@import\s+[^;]*;\s*/g, "");

  // Extract fonts URL and title from layout
  const fontsUrl = (layout.match(/href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["']/) ?? [])[1] ?? "";
  const title = (layout.match(/default:\s*["']([^"']+)["']/) ?? layout.match(/title:\s*["']([^"']+)["']/) ?? [])[1] ?? "MadeCreative";

  // Clean data.ts: strip import/export, keep everything else (Babel handles TS)
  const cleanData = dataTs
    .replace(/^import\s+[^;]*;\s*/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/\s+as\s+const\s*/g, "");

  // React + Babel CDN approach — renders JSX with real data, photos, gallery
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${fontsUrl ? `<link href="${fontsUrl}" rel="stylesheet">` : ""}
<script src="https://cdn.tailwindcss.com"><\/script>
<style>${css}</style>
</head><body class="antialiased">
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<script type="text/babel">
${cleanData}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const B = BUSINESS;
  const C = COLORS;
  return (
    <div style={{background:C.background,color:C.text}}>
      <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center px-4 md:px-6 bg-white/90 backdrop-blur-xl border-b" style={{borderColor:C.border}}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{background:C.accent}}>{B.name[0]}</div>
            <span className="font-bold text-lg" style={{color:C.primary}}>{B.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm" style={{color:C.textLight}}>Chi siamo</a>
            <a href="#gallery" className="text-sm" style={{color:C.textLight}}>Galleria</a>
            <a href="#reviews" className="text-sm" style={{color:C.textLight}}>Recensioni</a>
            <a href="#contact" className="text-white px-5 py-2 rounded-xl text-sm font-semibold" style={{background:C.accent}}>{B.cta}</a>
          </div>
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={()=>setMenuOpen(!menuOpen)}>
            <span className={"block w-6 h-0.5 transition-all "+(menuOpen?"rotate-45 translate-y-2":"")} style={{background:C.primary}}></span>
            <span className={"block w-6 h-0.5 transition-all "+(menuOpen?"opacity-0":"")} style={{background:C.primary}}></span>
            <span className={"block w-6 h-0.5 transition-all "+(menuOpen?"-rotate-45 -translate-y-2":"")} style={{background:C.primary}}></span>
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={()=>setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl pt-20 px-6 flex flex-col gap-2" onClick={e=>e.stopPropagation()}>
            {["Chi siamo","Galleria","Recensioni","Contatti"].map(label=>(
              <a key={label} href={"#"+label.toLowerCase().replace(" ","-")} onClick={()=>setMenuOpen(false)} className="py-3 border-b text-lg font-semibold" style={{color:C.primary,borderColor:C.border}}>{label}</a>
            ))}
            <a href="#contact" onClick={()=>setMenuOpen(false)} className="mt-auto mb-6 text-center text-white py-3 rounded-xl font-bold" style={{background:C.accent}}>{B.cta}</a>
          </div>
        </div>
      )}
      <section className="relative min-h-screen flex items-center" style={{background:C.primary}}>
        <div className="absolute inset-0"><img src={B.heroImage} className="w-full h-full object-cover opacity-40" /></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full" style={{background:C.accent,boxShadow:"0 0 12px "+C.accent}}></span>
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">{B.tagline}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-white leading-tight mb-6">{B.name}</h1>
          <p className="text-lg text-white/50 max-w-xl leading-relaxed mb-10">{B.description}</p>
          <div className="flex gap-4 flex-wrap">
            <a href="#contact" className="text-white px-8 py-4 rounded-2xl font-bold text-sm" style={{background:C.accent}}>{B.cta} \\u2192</a>
            <a href="#about" className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-2xl font-semibold text-sm">{B.ctaSecondary}</a>
          </div>
          {B.googleRating > 0 && (
            <div className="mt-10 inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/10 rounded-2xl px-6 py-4">
              <span className="text-3xl font-bold text-white">{B.googleRating}</span>
              <div><div className="text-sm tracking-wider" style={{color:C.accent}}>{"\\u2605".repeat(Math.round(B.googleRating))}</div><div className="text-xs text-white/40">{B.reviewCount}+ recensioni</div></div>
            </div>
          )}
        </div>
      </section>
      <section id="about" className="py-24 px-6" style={{background:C.surface}}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{color:C.accent}}>La nostra storia</p>
            <h2 className="text-3xl font-light mb-4" style={{color:C.primary}}>Chi Siamo</h2>
            <div className="w-14 h-0.5 mb-6" style={{background:C.accent}}></div>
            <p className="leading-relaxed">{B.aboutText}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s,i)=>(
              <div key={i} className={"p-6 rounded-2xl text-center "+(s.dark?"":"border")} style={{background:s.dark?C.primary:C.background,borderColor:s.dark?undefined:C.border}}>
                <p className="text-2xl font-semibold" style={{color:s.dark?C.accent:C.primary}}>{s.value}</p>
                <p className={"text-xs mt-1 "+(s.dark?"text-white/50":"")} style={{color:s.dark?undefined:C.textLight}}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {GALLERY.length>0&&(
        <section id="gallery" className="py-24 px-6" style={{background:C.background}}>
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 text-center" style={{color:C.accent}}>Galleria</p>
            <h2 className="text-3xl font-light text-center mb-12" style={{color:C.primary}}>I nostri momenti</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GALLERY.map((img,i)=>(
                <div key={i} className={"rounded-2xl overflow-hidden "+(i===0?"col-span-2 aspect-video":"aspect-square")}>
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy"/>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {TESTIMONIALS.length>0&&(
        <section id="reviews" className="py-24 px-6" style={{background:C.surface}}>
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 text-center" style={{color:C.accent}}>Recensioni</p>
            <h2 className="text-3xl font-light text-center mb-12" style={{color:C.primary}}>Cosa dicono i clienti</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t,i)=>(
                <div key={i} className="rounded-2xl p-8 border hover:-translate-y-1 transition" style={{background:C.surface,borderColor:C.border}}>
                  <div className="text-sm tracking-widest mb-4" style={{color:C.accent}}>{"\\u2605".repeat(t.rating)}{"\\u2606".repeat(5-t.rating)}</div>
                  <p className="text-sm italic leading-relaxed mb-4">\\u201C{t.text}\\u201D</p>
                  <p className="font-bold text-sm" style={{color:C.primary}}>{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section id="contact" className="py-24 px-6" style={{background:C.primary}}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-light text-white mb-12">Contatti</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div><p className="text-2xl mb-2">\\ud83d\\udccd</p><p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{color:C.accent}}>Indirizzo</p><p className="text-white/80">{B.address||"Su richiesta"}</p></div>
            <div><p className="text-2xl mb-2">\\ud83d\\udcde</p><p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{color:C.accent}}>Telefono</p><p className="text-white/80">{B.phone||"Su richiesta"}</p></div>
            <div><p className="text-2xl mb-2">\\u2709\\ufe0f</p><p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{color:C.accent}}>Email</p><p className="text-white/80">{B.email||"Su richiesta"}</p></div>
          </div>
        </div>
      </section>
      <footer className="py-8 px-6 border-t border-white/5" style={{background:C.primary}}>
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <span className="text-white/50 font-semibold">{B.name}</span>
          <span className="text-xs text-white/20">\\u00a9 ${new Date().getFullYear()} {B.name} \\u00b7 MadeCreative</span>
        </div>
      </footer>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
<\/script></body></html>`;
}


// Stock gallery photos per sector (Unsplash IDs)
const SECTOR_GALLERY: Record<string, string[]> = {
  restaurant: ["photo-1414235077428-338989a2e8c0","photo-1504674900247-0877df9cc836","photo-1476224203421-9ac39bcb3327","photo-1555396273-367ea4eb4db5","photo-1424847651672-bf20a4b0982b","photo-1540189549336-e6e99c3679fe"],
  dental: ["photo-1606811841689-23dfddce3e95","photo-1588776814546-1ffcf47267a5","photo-1579684385127-1ef15d508118","photo-1606265752439-1f18756aa5fc"],
  beauty: ["photo-1560066984-138dadb4c035","photo-1522337360788-8b13dee7a37e","photo-1487412947147-5cebf100ffc2","photo-1516975080664-ed2fc6a32937"],
  fitness: ["photo-1534438327276-14e5300c3a48","photo-1571019614242-c5c5dee9f50b","photo-1517836357463-d25dfeac3438","photo-1574680096145-d05b474e2155"],
  hotel: ["photo-1566073771259-6a8506099945","photo-1551882547-ff40c63fe5fa","photo-1618773928121-c32f2e6c4e8a","photo-1582719478250-c89cae4dc85b"],
  professional: ["photo-1497366216548-37526070297c","photo-1552664730-d307ca884978","photo-1531482615713-2adb69a1a5c3","photo-1521737711867-e3b97375f902"],
  legal: ["photo-1589829545856-d10d557cf95f","photo-1450101499163-c8848e66ad64","photo-1507003211169-0a1dd7228f2d"],
  medical: ["photo-1576091160550-2173dba999ef","photo-1530497610245-94d3c16cda28","photo-1579684453423-f84349ef60b0"],
  ecommerce: ["photo-1556742049-0cfed4f6a45d","photo-1472851294608-062f824d29cc","photo-1441986300917-64674bd600d8"],
  realestate: ["photo-1560518883-ce09059eeffa","photo-1600596542815-ffad4c1539a9","photo-1600585154340-be6161a56a0c"],
};
const SECTOR_HERO: Record<string, string> = {
  restaurant: "photo-1517248135467-4c7edcad34c4", dental: "photo-1629909613654-28e377c37b09",
  beauty: "photo-1560066984-138dadb4c035", fitness: "photo-1534438327276-14e5300c3a48",
  hotel: "photo-1566073771259-6a8506099945", legal: "photo-1589829545856-d10d557cf95f",
  medical: "photo-1576091160550-2173dba999ef", ecommerce: "photo-1556742049-0cfed4f6a45d",
  realestate: "photo-1560518883-ce09059eeffa", professional: "photo-1497366216548-37526070297c",
};

/** Generate site preview from simple business data — uses Next.js generator internally */
export function generateSitePreview(data: {
  name: string; sector: string; city?: string; phone?: string; email?: string;
  tagline?: string; description?: string; googleRating?: number; reviewCount?: number;
  logoUrl?: string; whatsapp?: string;
}): string {
  const cfg = getTemplateConfig(data.sector);
  const about = cfg.aboutText.replace(/\{name\}/g, data.name).replace(/\{city\}/g, data.city ?? "");
  const heroId = SECTOR_HERO[data.sector] ?? SECTOR_HERO["professional"]!;
  const galleryIds = SECTOR_GALLERY[data.sector] ?? SECTOR_GALLERY["professional"]!;
  const pd: ProjectData = {
    businessName: data.name, tagline: data.tagline ?? cfg.ctaLabel, description: data.description ?? about,
    aboutText: about, heroTitle: data.name, heroSubtitle: data.tagline ?? cfg.ctaLabel,
    heroImage: `https://images.unsplash.com/${heroId}?auto=format&fit=crop&w=1600&q=80`,
    cta: cfg.ctaLabel, metaTitle: data.name, metaDescription: data.description ?? about,
    address: data.phone ? "" : "", phone: data.phone ?? "", email: data.email ?? "", sector: data.sector, language: "it",
    colors: { primary: cfg.colors.primary, accent: cfg.colors.accent, background: cfg.colors.background, text: cfg.colors.text },
    galleryImages: galleryIds.map(id => ({ url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`, alt: data.name })),
    googleRating: data.googleRating, reviewCount: data.reviewCount,
    logoUrl: data.logoUrl, whatsapp: data.whatsapp, city: data.city,
  };
  return projectToPreviewHtml(generateNextJsProject(pd));
}
