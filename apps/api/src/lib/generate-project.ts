/**
 * generate-project.ts
 * Converts website content JSON into a complete Next.js 14 project file map.
 * The generated project is deployable to Vercel with framework: "nextjs".
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ProjectFilesBundle {
  version: 1;
  framework: "nextjs";
  generatedAt: string;
  files: Record<string, string>; // filepath -> file content
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function jsesc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

// Pick display font based on sector keyword
function getSectorFont(sector: string): { googleParam: string; family: string } {
  const map: Record<string, { googleParam: string; family: string }> = {
    restaurant: { googleParam: "Playfair+Display:wght@400;600;700", family: "Playfair Display" },
    food:       { googleParam: "Playfair+Display:wght@400;600;700", family: "Playfair Display" },
    beauty:     { googleParam: "Cormorant+Garamond:wght@400;600;700", family: "Cormorant Garamond" },
    wellness:   { googleParam: "Cormorant+Garamond:wght@400;600;700", family: "Cormorant Garamond" },
    retail:     { googleParam: "Raleway:wght@400;600;700", family: "Raleway" },
    fashion:    { googleParam: "Raleway:wght@400;600;700", family: "Raleway" },
    tech:       { googleParam: "Space+Grotesk:wght@400;600;700", family: "Space Grotesk" },
  };
  const key = Object.keys(map).find((k) => sector.toLowerCase().includes(k)) ?? "default";
  return map[key] ?? { googleParam: "Lora:wght@400;600;700", family: "Lora" };
}

// ─── File generators ──────────────────────────────────────────────────────────

function makePackageJson(): string {
  return JSON.stringify(
    {
      name: "mc-site",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "14.2.5",
        react: "18.3.1",
        "react-dom": "18.3.1",
      },
    },
    null,
    2
  );
}

function makeNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
module.exports = { images: { unoptimized: true } }
`;
}

function makeTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
}

function makeLayout(companyName: string, heroDescription: string, font: { googleParam: string; family: string }): string {
  const safeName = jsesc(companyName);
  const safeDesc = jsesc(heroDescription);
  const googleUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=${font.googleParam}&display=swap`;

  return `import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: \`${safeName}\`,
  description: \`${safeDesc}\`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="${googleUrl}" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
}

function makeGlobalCss(primaryColor: string, displayFont: string): string {
  // We need to escape double quotes in CSS since this is a string
  return `/* ── Reset & base ─────────────────────────────────────────────────────── */
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

/* ── CSS variables ────────────────────────────────────────────────────── */
:root {
  --primary: ${primaryColor};
  --primary-dark: color-mix(in srgb, ${primaryColor} 80%, black);
  --off-white: #f8f7f5;
  --border: #e8e6e1;
  --text-muted: #6b6b6b;
  --radius: 16px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,.06);
  --shadow-md: 0 8px 32px rgba(0,0,0,.10);
  --shadow-lg: 0 24px 64px rgba(0,0,0,.14);
  --transition: .3s cubic-bezier(.4,0,.2,1);
  --display-font: '${displayFont}', serif;
}

/* ── Utilities ────────────────────────────────────────────────────────── */
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
  font-family: var(--display-font);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #111;
  line-height: 1.2;
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 100px;
  font-weight: 600;
  font-size: .95rem;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition);
  border: none;
}
.btn:hover { transform: translateY(-2px); }
.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
}
.btn-primary:hover { box-shadow: 0 8px 28px rgba(0,0,0,.24); }
.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
}
.btn-outline:hover { background: var(--primary); color: #fff; }

/* ── Grid helpers ─────────────────────────────────────────────────────── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
@media(max-width:900px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; }
}
@media(max-width:600px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}

/* ── Card ─────────────────────────────────────────────────────────────── */
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
  background: var(--primary); color: #fff;
}
.card-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 10px; color: #111; }
.card-desc { font-size: .88rem; color: var(--text-muted); line-height: 1.7; }
.card-price { margin-top: 18px; font-size: 1.1rem; font-weight: 700; color: var(--primary); }

/* ── NAV ──────────────────────────────────────────────────────────────── */
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
  font-family: var(--display-font);
  font-size: 1.15rem; font-weight: 700; color: #111; flex-shrink: 0;
}
.nav-links { display: flex; align-items: center; gap: 32px; }
.nav-link { font-size: .85rem; font-weight: 500; color: var(--text-muted); transition: color var(--transition); }
.nav-link:hover { color: #111; }
.nav-cta {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 18px; border-radius: 100px;
  background: #25D366; color: #fff;
  font-size: .8rem; font-weight: 600;
  transition: opacity var(--transition); flex-shrink: 0;
}
.nav-cta:hover { opacity: .88; }

/* ── HERO ─────────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 92vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(0,0,0,.68) 0%, rgba(0,0,0,.42) 50%, rgba(0,0,0,.62) 100%);
}
.hero-content {
  position: relative; z-index: 2; text-align: center;
  padding: 96px 24px; max-width: 800px; margin: 0 auto;
}
.hero-eyebrow {
  font-size: .7rem; font-weight: 700; letter-spacing: .2em;
  text-transform: uppercase; color: rgba(255,255,255,.6); margin-bottom: 20px;
}
.hero-title {
  font-family: var(--display-font);
  font-size: clamp(2.4rem, 7vw, 5rem);
  font-weight: 700; color: #fff; line-height: 1.1;
  margin-bottom: 24px; text-shadow: 0 2px 20px rgba(0,0,0,.3);
}
.hero-desc {
  font-size: clamp(1rem, 2.2vw, 1.25rem);
  color: rgba(255,255,255,.82); line-height: 1.65;
  margin-bottom: 40px; max-width: 580px; margin-left: auto; margin-right: auto;
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
  z-index: 2; animation: bounce 2s infinite; color: rgba(255,255,255,.5);
}
@keyframes bounce {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(8px); }
}

/* ── ABOUT ────────────────────────────────────────────────────────────── */
.about-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
}
.about-text .section-tag { display: block; }
.about-text .section-title { text-align: left; margin-bottom: 24px; }
.about-body { font-size: .97rem; color: var(--text-muted); line-height: 1.85; }
.about-image-wrap {
  border-radius: var(--radius); overflow: hidden;
  box-shadow: var(--shadow-lg); aspect-ratio: 4/3;
}
.about-img { width: 100%; height: 100%; object-fit: cover; }
@media(max-width:768px) { .about-grid { grid-template-columns: 1fr; gap: 40px; } }

/* ── SERVICES (cards grid) ────────────────────────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* ── MENU ─────────────────────────────────────────────────────────────── */
.menu-category { margin-bottom: 56px; }
.menu-cat-title {
  font-family: var(--display-font);
  font-size: 1.3rem; font-weight: 700; color: #111;
  padding-bottom: 16px; margin-bottom: 24px;
  border-bottom: 2px solid var(--border);
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.menu-item {
  display: flex;
  background: #fff; border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), transform var(--transition);
}
.menu-item:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.menu-item-img { width: 88px; height: 88px; object-fit: cover; flex-shrink: 0; }
.menu-item-body { flex: 1; padding: 14px 16px; min-width: 0; }
.menu-item-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.menu-item-name { font-size: .9rem; font-weight: 600; color: #111; line-height: 1.3; }
.menu-item-price { font-size: .9rem; font-weight: 700; color: var(--primary); flex-shrink: 0; }
.menu-item-desc {
  font-size: .78rem; color: var(--text-muted); margin-top: 6px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── GALLERY ──────────────────────────────────────────────────────────── */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.gallery-item {
  position: relative; border-radius: var(--radius);
  overflow: hidden; aspect-ratio: 1; box-shadow: var(--shadow-sm);
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

/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.testimonial-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 28px;
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; gap: 14px;
}
.testimonial-stars { font-size: 1rem; line-height: 1; }
.testimonial-text { font-size: .9rem; color: #444; line-height: 1.75; font-style: italic; flex: 1; }
.testimonial-author {
  display: flex; align-items: center; gap: 12px;
  padding-top: 14px; border-top: 1px solid var(--border);
}
.testimonial-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .95rem; font-weight: 700; flex-shrink: 0;
}
.testimonial-name { font-size: .85rem; font-weight: 600; color: #111; }

/* ── CONTACT ──────────────────────────────────────────────────────────── */
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.contact-box {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius); padding: 28px;
}
.contact-box-title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: .95rem; color: #111; margin-bottom: 20px;
}
.hours-list { display: flex; flex-direction: column; gap: 0; }
.hours-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--border); font-size: .88rem;
}
.hours-row:last-child { border-bottom: none; }
.hours-day { font-weight: 500; color: #333; }
.hours-time { font-weight: 600; color: #111; }
.hours-closed {
  font-size: .75rem; font-weight: 700; color: #ef4444;
  background: #fef2f2; padding: 2px 10px; border-radius: 100px;
}
.contact-items { display: flex; flex-direction: column; gap: 14px; }
.contact-item {
  display: flex; align-items: center; gap: 14px;
  font-size: .9rem; color: #333; transition: color var(--transition);
}
.contact-item:hover { color: var(--primary); }
.contact-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.contact-whatsapp {
  display: flex; align-items: center; gap: 10px;
  background: #25D366; color: #fff;
  padding: 12px 18px; border-radius: 12px;
  font-size: .9rem; font-weight: 600; margin-top: 8px;
  transition: opacity var(--transition);
}
.contact-whatsapp:hover { opacity: .88; }

/* ── FOOTER ───────────────────────────────────────────────────────────── */
.footer { background: #111; color: #aaa; padding: 64px 0 32px; }
.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 48px; margin-bottom: 48px;
}
.footer-brand-name {
  font-family: var(--display-font);
  font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 12px;
}
.footer-brand-desc { font-size: .82rem; color: #666; line-height: 1.7; }
.footer-heading {
  font-size: .7rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #555; margin-bottom: 16px;
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
  border-top: 1px solid #1f1f1f; padding-top: 28px;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; font-size: .78rem; color: #444;
}
.footer-badge span { color: #666; font-weight: 500; }

/* ── WhatsApp float ───────────────────────────────────────────────────── */
.wa-float {
  position: fixed; bottom: 28px; right: 28px; z-index: 999;
  width: 56px; height: 56px; border-radius: 50%;
  background: #25D366;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 24px rgba(37,211,102,.45);
  transition: transform var(--transition), box-shadow var(--transition);
}
.wa-float:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(37,211,102,.55); }

/* ── Animations ───────────────────────────────────────────────────────── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: none; } }

/* ── Responsive ───────────────────────────────────────────────────────── */
@media(max-width:768px) {
  .nav-links { display: none; }
  .section { padding: 64px 0; }
}
@media(max-width:640px) {
  .hero { min-height: 80vh; }
  .cards-grid { grid-template-columns: 1fr; }
  .gallery-grid { grid-template-columns: 1fr 1fr; }
}
`;
}

function makePageTsx(params: {
  companyName: string;
  sector: string;
  content: Record<string, unknown>;
  subdomain: string;
  displayFont: string;
}): string {
  const { companyName, content, displayFont } = params;

  // Safely serialize content for embedding in TSX
  const contentJson = JSON.stringify(content, null, 2)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  const safeName = jsesc(companyName);

  return `// This file is AUTO-GENERATED by MadeCreative. Do not edit manually.
// Regenerate by triggering a new deploy from the MadeCreative editor.

/* ── Types ───────────────────────────────────────────────────────────── */
interface MenuItem { name: string; description: string; price: string; category: string; imageUrl?: string | null }
interface GalleryImage { url: string; caption?: string }
interface Testimonial { name: string; text: string; rating: number }
interface ServiceItem { name: string; description: string; icon?: string; price?: string }
interface HourEntry { open: string; close: string; closed: boolean }

interface SiteContent {
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
}

/* ── Content data ────────────────────────────────────────────────────── */
const CONTENT: SiteContent = JSON.parse(\`${contentJson}\`);
const COMPANY = \`${safeName}\`;
const DISPLAY_FONT = \`${jsesc(displayFont)}\`;

/* ── Helpers ─────────────────────────────────────────────────────────── */
const DAY_LABELS: Record<string, string> = {
  monday: "Lunedì", tuesday: "Martedì", wednesday: "Mercoledì",
  thursday: "Giovedì", friday: "Venerdì", saturday: "Sabato", sunday: "Domenica",
  lun: "Lunedì", mar: "Martedì", mer: "Mercoledì",
  gio: "Giovedì", ven: "Venerdì", sab: "Sabato", dom: "Domenica",
};
function dayLabel(k: string): string {
  return DAY_LABELS[k.toLowerCase()] ?? (k.charAt(0).toUpperCase() + k.slice(1));
}
function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ color: n <= rating ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────────── */
function Nav() {
  const c = CONTENT;
  const waNumber = c.whatsappNumber?.replace(/\\D/g, "");
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#" className="nav-brand" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>{COMPANY}</a>
        <div className="nav-links">
          {c.aboutText && <a href="#about" className="nav-link">Chi siamo</a>}
          {(c.services?.length || c.menuItems?.length) ? <a href="#services" className="nav-link">Servizi</a> : null}
          {c.menuItems?.length ? <a href="#menu" className="nav-link">Menu</a> : null}
          {c.gallery?.length ? <a href="#gallery" className="nav-link">Galleria</a> : null}
          {(c.phone || c.email || c.address || c.hours) ? <a href="#contact" className="nav-link">Contatti</a> : null}
        </div>
        {waNumber && (
          <a href={\`https://wa.me/\${waNumber}\`} className="nav-cta" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        )}
      </div>
    </nav>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function Hero() {
  const c = CONTENT;
  const heroImg = c.heroImage ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80";
  const heroTitle = c.heroText ?? COMPANY;
  const waNumber = c.whatsappNumber?.replace(/\\D/g, "");
  const ctaHref = waNumber ? \`https://wa.me/\${waNumber}\` : "#contact";
  return (
    <section className="hero">
      <div className="hero-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt={heroTitle} loading="eager" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-eyebrow">Benvenuti</p>
        <h1 className="hero-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>{heroTitle}</h1>
        {c.heroDescription && <p className="hero-desc">{c.heroDescription}</p>}
        <a href={ctaHref} className="hero-cta" target={waNumber ? "_blank" : undefined} rel={waNumber ? "noopener" : undefined}>
          {c.heroCtaText ?? "Scopri di più"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12,5 19,12 12,19"/>
          </svg>
        </a>
      </div>
      <div className="hero-scroll" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </section>
  );
}

/* ── About ────────────────────────────────────────────────────────────── */
function About() {
  const c = CONTENT;
  if (!c.aboutText) return null;
  const aboutImg = c.aboutImage ?? "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80";
  return (
    <section id="about" className="section bg-off-white">
      <div className="container">
        <div className="about-grid">
          <div className="about-text">
            <p className="section-tag">Chi siamo</p>
            <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>La nostra storia</h2>
            <div className="about-body">
              {c.aboutText.split("\\n").map((line, i) => <p key={i} style={{ marginBottom: "1em" }}>{line}</p>)}
            </div>
          </div>
          <div className="about-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aboutImg} alt={\`Chi siamo — \${COMPANY}\`} loading="lazy" className="about-img" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Services ─────────────────────────────────────────────────────────── */
function Services() {
  const c = CONTENT;
  if (!c.services?.length) return null;
  return (
    <section id="services" className="section bg-white">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">Cosa offriamo</p>
          <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>I nostri servizi</h2>
        </div>
        <div className="cards-grid">
          {c.services.map((svc, i) => (
            <div key={i} className="card">
              {svc.icon && <div className="card-icon">{svc.icon}</div>}
              <h3 className="card-title">{svc.name}</h3>
              <p className="card-desc">{svc.description}</p>
              {svc.price && <p className="card-price">{svc.price}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Menu ─────────────────────────────────────────────────────────────── */
function Menu() {
  const c = CONTENT;
  if (!c.menuItems?.length) return null;
  const byCategory: Record<string, MenuItem[]> = {};
  for (const item of c.menuItems) {
    const cat = item.category || "Altri";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat]!.push(item);
  }
  return (
    <section id="menu" className="section bg-off-white">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">La nostra proposta</p>
          <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>Il Menu</h2>
        </div>
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} className="menu-category">
            <h3 className="menu-cat-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>{cat}</h3>
            <div className="menu-grid">
              {items.map((item, i) => (
                <div key={i} className="menu-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl ?? "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=60"}
                    alt={item.name}
                    loading="lazy"
                    className="menu-item-img"
                  />
                  <div className="menu-item-body">
                    <div className="menu-item-row">
                      <span className="menu-item-name">{item.name}</span>
                      <span className="menu-item-price">{item.price}</span>
                    </div>
                    {item.description && <p className="menu-item-desc">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Gallery ──────────────────────────────────────────────────────────── */
function Gallery() {
  const c = CONTENT;
  if (!c.gallery?.length) return null;
  return (
    <section id="gallery" className="section bg-white">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">I nostri momenti</p>
          <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>Galleria</h2>
        </div>
        <div className="gallery-grid">
          {c.gallery.map((img, i) => (
            <div key={i} className="gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? "Gallery"} loading="lazy" className="gallery-img" />
              {img.caption && <div className="gallery-caption">{img.caption}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────── */
function Testimonials() {
  const c = CONTENT;
  if (!c.testimonials?.length) return null;
  return (
    <section className="section bg-off-white">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">Cosa dicono di noi</p>
          <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>Recensioni</h2>
        </div>
        <div className="testimonials-grid">
          {c.testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars"><Stars rating={t.rating} /></div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name.charAt(0).toUpperCase()}</div>
                <span className="testimonial-name">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contact ──────────────────────────────────────────────────────────── */
function Contact() {
  const c = CONTENT;
  if (!c.hours && !c.phone && !c.email && !c.address) return null;
  const waNumber = c.whatsappNumber?.replace(/\\D/g, "");
  return (
    <section id="contact" className="section bg-white">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">Vieni a trovarci</p>
          <h2 className="section-title" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>Orari e Contatti</h2>
        </div>
        <div className="contact-grid">
          {c.hours && (
            <div className="contact-box">
              <h3 className="contact-box-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
                Orari di apertura
              </h3>
              <div className="hours-list">
                {Object.entries(c.hours).map(([day, h]) => (
                  <div key={day} className="hours-row">
                    <span className="hours-day">{dayLabel(day)}</span>
                    {h.closed
                      ? <span className="hours-closed">Chiuso</span>
                      : <span className="hours-time">{h.open} – {h.close}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="contact-box">
            <h3 className="contact-box-title">Contattaci</h3>
            <div className="contact-items">
              {c.phone && (
                <a href={\`tel:\${c.phone}\`} className="contact-item">
                  <div className="contact-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h0z"/>
                    </svg>
                  </div>
                  {c.phone}
                </a>
              )}
              {c.email && (
                <a href={\`mailto:\${c.email}\`} className="contact-item">
                  <div className="contact-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  {c.email}
                </a>
              )}
              {c.address && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  {c.address}
                </div>
              )}
              {waNumber && (
                <a href={\`https://wa.me/\${waNumber}\`} className="contact-whatsapp" target="_blank" rel="noopener">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Scrivici su WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  const c = CONTENT;
  const year = new Date().getFullYear();
  const heroTitle = c.heroText ?? COMPANY;
  const shortDesc = c.heroDescription
    ? (c.heroDescription.length > 120 ? c.heroDescription.slice(0, 120) + "…" : c.heroDescription)
    : undefined;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-brand-name" style={{ fontFamily: \`'\${DISPLAY_FONT}', serif\` }}>{heroTitle}</p>
            {shortDesc && <p className="footer-brand-desc">{shortDesc}</p>}
            <div className="social-links">
              {c.instagramUrl && (
                <a href={c.instagramUrl} className="social-link" aria-label="Instagram" target="_blank" rel="noopener">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              )}
              {c.facebookUrl && (
                <a href={c.facebookUrl} className="social-link" aria-label="Facebook" target="_blank" rel="noopener">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="footer-heading">Link rapidi</p>
            <div className="footer-links">
              {c.aboutText && <a href="#about" className="footer-link">Chi siamo</a>}
              {c.services?.length ? <a href="#services" className="footer-link">Servizi</a> : null}
              {c.menuItems?.length ? <a href="#menu" className="footer-link">Menu</a> : null}
              {c.gallery?.length ? <a href="#gallery" className="footer-link">Galleria</a> : null}
              <a href="#contact" className="footer-link">Contatti</a>
            </div>
          </div>
          <div>
            <p className="footer-heading">Contatti</p>
            <div className="footer-contact-list">
              {c.phone && (
                <div className="footer-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14h0z"/>
                  </svg>
                  {c.phone}
                </div>
              )}
              {c.email && (
                <div className="footer-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {c.email}
                </div>
              )}
              {c.address && (
                <div className="footer-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {c.address}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {year} {heroTitle}. Tutti i diritti riservati.</p>
          <p className="footer-badge">Powered by <span>MadeCreative</span></p>
        </div>
      </div>
    </footer>
  );
}

/* ── WhatsApp float ───────────────────────────────────────────────────── */
function WaFloat() {
  const waNumber = CONTENT.whatsappNumber?.replace(/\\D/g, "");
  if (!waNumber) return null;
  return (
    <a href={\`https://wa.me/\${waNumber}\`} className="wa-float" target="_blank" rel="noopener" aria-label="Contattaci su WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <About />
      <Services />
      <Menu />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
      <WaFloat />
    </>
  );
}
`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateProjectFiles(params: {
  companyName: string;
  sector: string;
  content: Record<string, unknown>;
  subdomain: string;
  primaryColor?: string;
}): ProjectFilesBundle {
  const { companyName, sector, content, primaryColor } = params;

  const primary = primaryColor ?? (content.primaryColor as string | undefined) ?? "#4f46e5";
  const font = getSectorFont(sector);
  const heroDescription = (content.heroDescription as string | undefined) ?? `Il sito ufficiale di ${companyName}`;

  const files: Record<string, string> = {
    "package.json": makePackageJson(),
    "next.config.js": makeNextConfig(),
    "tsconfig.json": makeTsConfig(),
    "app/layout.tsx": makeLayout(companyName, heroDescription, font),
    "app/globals.css": makeGlobalCss(primary, font.family),
    "app/page.tsx": makePageTsx({
      companyName,
      sector,
      content,
      subdomain: params.subdomain,
      displayFont: font.family,
    }),
  };

  return {
    version: 1,
    framework: "nextjs",
    generatedAt: new Date().toISOString(),
    files,
  };
}
