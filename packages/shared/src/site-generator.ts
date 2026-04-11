/**
 * Universal Premium Site Generator
 *
 * Generates a complete, self-contained HTML page with:
 * - Premium typography per sector (Google Fonts)
 * - CSS animations (scroll reveal, character reveal, parallax, hover effects)
 * - IntersectionObserver for scroll triggers
 * - Responsive design (mobile-first)
 * - Zero external JS dependencies (vanilla JS only)
 *
 * Output: a single HTML string that works in:
 * - iframe srcDoc (landing page demo, hero analyzer)
 * - Sandpack (portal editor — via /App.js export)
 * - Static deploy (Vercel, outreach previews)
 */

import { getTemplateConfig } from "./templates.js";

export interface SiteData {
  name: string;
  sector: string;
  tagline?: string;
  description?: string;
  heroImage?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  googleRating?: number;
  reviewCount?: number;
  services?: Array<{ icon: string; name: string; desc: string }>;
  galleryImages?: Array<{ url: string; alt?: string }>;
  testimonials?: Array<{ name: string; text: string; rating: number }>;
}

// ── Sector stock images ──────────────────────────────────────────────────────

const SECTOR_HERO_IMAGES: Record<string, string> = {
  restaurant: "photo-1517248135467-4c7edcad34c4",
  dental: "photo-1629909613654-28e377c37b09",
  beauty: "photo-1560066984-138dadb4c035",
  fitness: "photo-1534438327276-14e5300c3a48",
  hotel: "photo-1566073771259-6a8506099945",
  legal: "photo-1589829545856-d10d557cf95f",
  medical: "photo-1576091160550-2173dba999ef",
  ecommerce: "photo-1556742049-0cfed4f6a45d",
  realestate: "photo-1560518883-ce09059eeffa",
  professional: "photo-1497366216548-37526070297c",
};

const SECTOR_SERVICES: Record<string, Array<{ icon: string; name: string; desc: string }>> = {
  restaurant: [
    { icon: "\u{1F37D}\uFE0F", name: "Menu del giorno", desc: "Piatti freschi ogni giorno con ingredienti locali" },
    { icon: "\u{1F4C5}", name: "Prenotazioni", desc: "Prenota il tuo tavolo in pochi secondi, 24/7" },
    { icon: "\u{1F6F5}", name: "Delivery", desc: "I nostri sapori direttamente a casa tua" },
    { icon: "\u{1F389}", name: "Eventi", desc: "Compleanni, matrimoni e cene aziendali" },
  ],
  dental: [
    { icon: "\u2728", name: "Igiene dentale", desc: "Pulizia professionale per denti sani e bianchi" },
    { icon: "\u{1F601}", name: "Ortodonzia", desc: "Allineatori invisibili per un sorriso perfetto" },
    { icon: "\u{1F9B7}", name: "Implantologia", desc: "Impianti di ultima generazione" },
    { icon: "\u{1F48E}", name: "Sbiancamento", desc: "Trattamento professionale per un sorriso luminoso" },
  ],
  beauty: [
    { icon: "\u2702\uFE0F", name: "Taglio e piega", desc: "Stilisti esperti per ogni tipo di capello" },
    { icon: "\u{1F33F}", name: "Trattamenti viso", desc: "Rituali di bellezza per una pelle radiosa" },
    { icon: "\u{1F485}", name: "Manicure", desc: "Unghie perfette con prodotti premium" },
    { icon: "\u{1F9D6}", name: "Massaggi", desc: "Relax totale con massaggi professionali" },
  ],
  fitness: [
    { icon: "\u{1F3CB}\uFE0F", name: "Personal training", desc: "Programmi su misura con trainer certificati" },
    { icon: "\u{1F938}", name: "Corsi di gruppo", desc: "Yoga, pilates, zumba e molto altro" },
    { icon: "\u{1F957}", name: "Nutrizione", desc: "Piani nutrizionali personalizzati" },
    { icon: "\u267E\uFE0F", name: "Abbonamenti", desc: "Mensile, trimestrale o annuale" },
  ],
  hotel: [
    { icon: "\u{1F6CF}\uFE0F", name: "Camere superior", desc: "Ambienti eleganti con vista panoramica" },
    { icon: "\u{1F377}", name: "Ristorante & bar", desc: "Cucina gourmet e cocktail bar" },
    { icon: "\u{1F486}", name: "Spa & wellness", desc: "Piscina, sauna e trattamenti esclusivi" },
    { icon: "\u{1F4BC}", name: "Sale meeting", desc: "Spazi modulari per eventi" },
  ],
  legal: [
    { icon: "\u2696\uFE0F", name: "Diritto civile", desc: "Tutela dei tuoi diritti" },
    { icon: "\u{1F512}", name: "Diritto penale", desc: "Difesa professionale e discreta" },
    { icon: "\u{1F3E2}", name: "Consulenza", desc: "Contratti e corporate governance" },
    { icon: "\u{1F91D}", name: "Mediazione", desc: "Risoluzione alternativa delle controversie" },
  ],
  medical: [
    { icon: "\u{1FA7A}", name: "Visite", desc: "Specialisti in cardiologia, ortopedia e altro" },
    { icon: "\u{1F52C}", name: "Diagnostica", desc: "Analisi di ultima generazione" },
    { icon: "\u{1F48A}", name: "Prevenzione", desc: "Check-up completi personalizzati" },
    { icon: "\u{1F3C3}", name: "Riabilitazione", desc: "Fisioterapia e percorsi di recupero" },
  ],
  professional: [
    { icon: "\u{1F4A1}", name: "Consulenza", desc: "Analisi e strategie personalizzate" },
    { icon: "\u2699\uFE0F", name: "Implementazione", desc: "Esecuzione professionale e puntuale" },
    { icon: "\u{1F4CA}", name: "Analytics", desc: "Monitoraggio risultati in tempo reale" },
    { icon: "\u{1F6E1}\uFE0F", name: "Supporto", desc: "Assistenza dedicata sempre disponibile" },
  ],
  ecommerce: [
    { icon: "\u{1F6CD}\uFE0F", name: "Catalogo", desc: "Migliaia di prodotti con varianti" },
    { icon: "\u{1F4B3}", name: "Pagamenti", desc: "Carta, PayPal, Apple Pay integrati" },
    { icon: "\u{1F4E6}", name: "Spedizioni", desc: "Tracking in tempo reale" },
    { icon: "\u{1F4C8}", name: "Analytics", desc: "Dashboard con metriche di conversione" },
  ],
  realestate: [
    { icon: "\u{1F3E0}", name: "Compravendita", desc: "Compra e vendi con la nostra rete" },
    { icon: "\u{1F511}", name: "Affitti", desc: "Gestione completa residenziale" },
    { icon: "\u{1F4D0}", name: "Valutazioni", desc: "Perizie e stime di mercato" },
    { icon: "\u{1F3D7}\uFE0F", name: "Nuove costruzioni", desc: "Ristrutturazioni chiavi in mano" },
  ],
};

const SECTOR_GALLERY: Record<string, string[]> = {
  restaurant: ["photo-1414235077428-338989a2e8c0", "photo-1504674900247-0877df9cc836", "photo-1476224203421-9ac39bcb3327"],
  dental: ["photo-1606811841689-23dfddce3e95", "photo-1588776814546-1ffcf47267a5", "photo-1579684385127-1ef15d508118"],
  beauty: ["photo-1560066984-138dadb4c035", "photo-1522337360788-8b13dee7a37e", "photo-1487412947147-5cebf100ffc2"],
  fitness: ["photo-1534438327276-14e5300c3a48", "photo-1571019614242-c5c5dee9f50b", "photo-1517836357463-d25dfeac3438"],
  hotel: ["photo-1566073771259-6a8506099945", "photo-1551882547-ff40c63fe5fa", "photo-1618773928121-c32f2e6c4e8a"],
  professional: ["photo-1497366216548-37526070297c", "photo-1552664730-d307ca884978", "photo-1531482615713-2adb69a1a5c3"],
  legal: ["photo-1589829545856-d10d557cf95f", "photo-1450101499163-c8848e66ad64", "photo-1507003211169-0a1dd7228f2d"],
  medical: ["photo-1576091160550-2173dba999ef", "photo-1530497610245-94d3c16cda28", "photo-1579684453423-f84349ef60b0"],
  ecommerce: ["photo-1556742049-0cfed4f6a45d", "photo-1472851294608-062f824d29cc", "photo-1441986300917-64674bd600d8"],
  realestate: ["photo-1560518883-ce09059eeffa", "photo-1600596542815-ffad4c1539a9", "photo-1600585154340-be6161a56a0c"],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function unsplash(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

// ── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate a complete premium HTML page.
 * Works in: iframe srcDoc, Sandpack, static deploy.
 */
export function generatePremiumSite(data: SiteData): string {
  const cfg = getTemplateConfig(data.sector);
  const c = cfg.colors;
  const fh = cfg.fonts.heading;
  const fb = cfg.fonts.body;
  const name = data.name;
  const initial = (name[0] ?? "M").toUpperCase();
  const tagline = data.tagline ?? sectorTagline(data.sector);
  const description = data.description ?? `Benvenuto da ${name} — qualità, professionalità e passione autentica.`;
  const heroImg = data.heroImage ?? unsplash(SECTOR_HERO_IMAGES[data.sector] ?? SECTOR_HERO_IMAGES["professional"]!, 1400);
  const services = data.services ?? SECTOR_SERVICES[data.sector] ?? SECTOR_SERVICES["professional"]!;
  const gallery = data.galleryImages?.map(g => g.url) ?? (SECTOR_GALLERY[data.sector] ?? SECTOR_GALLERY["professional"]!).map(id => unsplash(id, 800));
  const city = data.city ?? "";

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)}${city ? ` — ${esc(city)}` : ""}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${cfg.fonts.googleFontsUrl}" rel="stylesheet">
<style>
/* ── Reset + Custom Props ─────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:${c.primary};--accent:${c.accent};--bg:${c.background};
  --text:${c.text};--text-light:${c.textLight};--border:${c.border};
  --surface:${c.surface};--fh:'${fh}',serif;--fb:'${fb}',sans-serif;
}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none;transition:opacity .2s}

/* ── Animations ───────────────────────────────────────── */
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes slideRight{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes charReveal{from{opacity:0;transform:translateY(20px) rotateX(-30deg)}to{opacity:1;transform:translateY(0) rotateX(0)}}
@keyframes heroZoom{from{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes navSlide{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 ${c.accent}40}50%{box-shadow:0 0 0 8px ${c.accent}00}}

.reveal{opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:.1s}
.reveal-delay-2{transition-delay:.2s}
.reveal-delay-3{transition-delay:.3s}

/* ── Nav ──────────────────────────────────────────────── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:68px;display:flex;align-items:center;padding:0 clamp(16px,4vw,48px);transition:background .4s,backdrop-filter .4s,border .4s,box-shadow .4s;animation:navSlide .6s ease}
.nav.transparent{background:transparent}
.nav.solid{background:rgba(255,255,255,.95);backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--border);box-shadow:0 1px 12px rgba(0,0,0,.04)}
.nav-inner{max-width:1200px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:36px;height:36px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-weight:700;font-size:16px;color:#fff}
.nav-name{font-family:var(--fh);font-weight:700;font-size:18px;letter-spacing:-.01em}
.nav.transparent .nav-name{color:#fff}
.nav.solid .nav-name{color:var(--primary)}
.nav-links{display:flex;gap:28px;align-items:center}
.nav-link{font-size:13px;font-weight:500;transition:color .2s}
.nav.transparent .nav-link{color:rgba(255,255,255,.8)}
.nav.solid .nav-link{color:var(--text-light)}
.nav-link:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#fff;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:600;transition:transform .2s,box-shadow .2s}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.12)}

/* ── Hero ─────────────────────────────────────────────── */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;animation:heroZoom 1.8s ease-out forwards}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(160deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,.15) 50%,rgba(0,0,0,.5) 100%)}
.hero-grain{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");opacity:.5}
.hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:120px clamp(16px,4vw,48px) 80px;width:100%}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);border-radius:100px;padding:8px 18px;margin-bottom:28px;animation:fadeUp .6s ease .3s both}
.hero-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2s ease infinite}
.hero-eyebrow span{font-size:11px;font-weight:600;color:rgba(255,255,255,.9);letter-spacing:.08em;text-transform:uppercase}
.hero h1{font-family:var(--fh);font-size:clamp(2.5rem,5.5vw,5rem);font-weight:300;color:#fff;line-height:1.06;margin-bottom:1.5rem;max-width:720px;letter-spacing:-.02em}
.hero h1 .char{display:inline-block;animation:charReveal .5s ease both}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero-line{width:60px;height:2px;background:var(--accent);margin-bottom:1.5rem;transform-origin:left;animation:slideRight .8s ease 1.2s both}
.hero p{font-size:clamp(1rem,1.5vw,1.15rem);color:rgba(255,255,255,.65);max-width:500px;line-height:1.75;margin-bottom:2.5rem;animation:fadeUp .7s ease 1.4s both}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap;animation:fadeUp .5s ease 1.7s both}
.btn-primary{display:inline-block;background:var(--accent);color:var(--primary);font-family:var(--fb);font-size:.88rem;font-weight:700;padding:1rem 2.5rem;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;transition:transform .2s,box-shadow .2s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.25);opacity:1}
.btn-secondary{display:inline-block;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.2);padding:1rem 2.5rem;border-radius:6px;font-weight:600;font-size:.88rem;transition:all .2s}
.btn-secondary:hover{background:rgba(255,255,255,.18);opacity:1}

/* ── Section common ───────────────────────────────────── */
.section{padding:100px clamp(16px,4vw,48px)}
.section-inner{max-width:1200px;margin:0 auto}
.section-eyebrow{font-size:12px;font-weight:600;color:var(--accent);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
.section-title{font-family:var(--fh);font-size:clamp(28px,3.5vw,44px);font-weight:400;letter-spacing:-.02em;margin-bottom:8px;line-height:1.1;color:var(--primary)}
.section-line{width:50px;height:1px;background:var(--accent);margin:16px 0 24px}
.section-desc{font-size:16px;color:var(--text-light);max-width:480px;line-height:1.7;margin-bottom:56px}

/* ── About ────────────────────────────────────────────── */
.about{background:var(--surface)}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
.about-text{font-size:1rem;line-height:1.85;color:var(--text)}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stat{padding:1.5rem;border-radius:6px;text-align:center}
.stat-dark{background:var(--primary)}
.stat-light{background:var(--bg);border:1px solid var(--border)}
.stat-value{font-family:var(--fh);font-size:2rem;font-weight:500;line-height:1;margin-bottom:.25rem}
.stat-dark .stat-value{color:var(--accent)}
.stat-light .stat-value{color:var(--primary)}
.stat-label{font-size:.75rem}
.stat-dark .stat-label{color:rgba(255,255,255,.6)}
.stat-light .stat-label{color:var(--text-light)}

/* ── Services ─────────────────────────────────────────── */
.services{background:var(--bg)}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;transition:transform .3s,box-shadow .3s}
.card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.06)}
.card-icon{width:52px;height:52px;border-radius:14px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px}
.card h3{font-family:var(--fh);font-size:18px;font-weight:700;margin-bottom:10px;color:var(--primary)}
.card p{font-size:14px;color:var(--text-light);line-height:1.65}

/* ── Gallery ──────────────────────────────────────────── */
.gallery{background:var(--surface)}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.gallery-item{border-radius:10px;overflow:hidden;aspect-ratio:4/3}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.gallery-item:hover img{transform:scale(1.06)}

/* ── Contact ──────────────────────────────────────────── */
.contact{background:var(--primary);color:#fff}
.contact .section-title{color:#fff}
.contact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5rem}
.contact-icon{font-size:28px;margin-bottom:8px}
.contact-label{font-size:.72rem;color:var(--accent);letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px}
.contact-value{font-size:1rem;color:rgba(255,255,255,.8);font-weight:500}

/* ── Footer ───────────────────────────────────────────── */
.footer{background:var(--primary);border-top:1px solid rgba(255,255,255,.06);padding:24px clamp(16px,4vw,48px)}
.footer-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.footer-brand{font-family:var(--fh);font-size:1rem;color:rgba(255,255,255,.7)}
.footer-copy{font-size:.78rem;color:rgba(255,255,255,.25)}

/* ── Scroll Progress ──────────────────────────────────── */
.scroll-progress{position:fixed;top:0;left:0;height:2px;background:var(--accent);z-index:200;transform-origin:left;transform:scaleX(0);transition:transform .1s}

/* ── Responsive ───────────────────────────────────────── */
@media(max-width:768px){
  .nav-links{display:none}
  .about-grid{grid-template-columns:1fr;gap:2.5rem}
  .contact-grid{grid-template-columns:1fr;gap:1.5rem}
  .hero h1{font-size:2.2rem}
}
</style>
</head>
<body>

<!-- Scroll Progress Bar -->
<div class="scroll-progress" id="scrollProgress"></div>

<!-- Nav -->
<nav class="nav transparent" id="mainNav">
<div class="nav-inner">
  <div class="nav-brand">
    <div class="nav-logo">${initial}</div>
    <span class="nav-name">${esc(name)}</span>
  </div>
  <div class="nav-links">
    <a href="#chi-siamo" class="nav-link">Chi siamo</a>
    <a href="#servizi" class="nav-link">Servizi</a>
    <a href="#galleria" class="nav-link">Galleria</a>
    <a href="#contatti" class="nav-link">Contatti</a>
    <a href="#contatti" class="nav-cta">Contattaci</a>
  </div>
</div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="hero-bg"><img src="${esc(heroImg)}" alt="${esc(name)}" loading="eager"></div>
  <div class="hero-overlay"></div>
  <div class="hero-grain"></div>
  <div class="hero-content">
    <div class="hero-eyebrow">
      <span class="hero-dot"></span>
      <span>${esc(tagline)}</span>
    </div>
    <h1 id="heroTitle">${esc(name)}.<br><em>${esc(tagline)}.</em></h1>
    <div class="hero-line"></div>
    <p>${esc(description)}</p>
    <div class="hero-ctas">
      <a href="#contatti" class="btn-primary">Scopri di più →</a>
      <a href="#servizi" class="btn-secondary">I nostri servizi</a>
    </div>
  </div>
</section>

<!-- About -->
<section class="section about" id="chi-siamo">
<div class="section-inner">
  <div class="about-grid">
    <div class="reveal">
      <p class="section-eyebrow">La nostra storia</p>
      <h2 class="section-title">Chi Siamo</h2>
      <div class="section-line"></div>
      <p class="about-text">${esc(description)}</p>
    </div>
    <div class="stats-grid reveal reveal-delay-2">
      <div class="stat stat-dark"><p class="stat-value">15+</p><p class="stat-label">Anni di esperienza</p></div>
      <div class="stat stat-light"><p class="stat-value">${data.googleRating ?? "4.9"}</p><p class="stat-label">Rating Google</p></div>
      <div class="stat stat-light"><p class="stat-value">${data.reviewCount ?? "200"}+</p><p class="stat-label">Recensioni</p></div>
      <div class="stat stat-dark"><p class="stat-value">100%</p><p class="stat-label">Soddisfazione</p></div>
    </div>
  </div>
</div>
</section>

<!-- Services -->
<section class="section services" id="servizi">
<div class="section-inner">
  <div class="reveal">
    <p class="section-eyebrow">Cosa offriamo</p>
    <h2 class="section-title">I nostri servizi</h2>
    <div class="section-line"></div>
    <p class="section-desc">Tutto quello di cui hai bisogno, curato nei minimi dettagli.</p>
  </div>
  <div class="card-grid">
    ${services.map((s, i) => `<div class="card reveal reveal-delay-${Math.min(i + 1, 3)}"><div class="card-icon">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<!-- Gallery -->
<section class="section gallery" id="galleria">
<div class="section-inner">
  <div class="reveal" style="text-align:center;margin-bottom:3rem">
    <p class="section-eyebrow">Galleria</p>
    <h2 class="section-title">I nostri momenti</h2>
  </div>
  <div class="gallery-grid">
    ${gallery.map((url, i) => `<div class="gallery-item reveal reveal-delay-${Math.min(i + 1, 3)}"><img src="${esc(url)}" alt="${esc(name)}" loading="lazy"></div>`).join("\n    ")}
  </div>
</div>
</section>

<!-- Contact -->
<section class="section contact" id="contatti">
<div class="section-inner">
  <div class="reveal">
    <p class="section-eyebrow">Contatti</p>
    <h2 class="section-title">Vieni a trovarci</h2>
    <div class="section-line" style="background:rgba(255,255,255,.2)"></div>
  </div>
  <div class="contact-grid reveal reveal-delay-1">
    <div><p class="contact-icon">\u{1F4CD}</p><p class="contact-label">Indirizzo</p><p class="contact-value">${esc(data.address ?? "Su richiesta")}</p></div>
    <div><p class="contact-icon">\u{1F4DE}</p><p class="contact-label">Telefono</p><p class="contact-value">${esc(data.phone ?? "Su richiesta")}</p></div>
    <div><p class="contact-icon">\u2709\uFE0F</p><p class="contact-label">Email</p><p class="contact-value">${esc(data.email ?? "info@" + name.toLowerCase().replace(/\\s+/g, "") + ".it")}</p></div>
  </div>
</div>
</section>

<!-- Footer -->
<footer class="footer">
<div class="footer-inner">
  <span class="footer-brand">${esc(name)}</span>
  <span class="footer-copy">&copy; ${new Date().getFullYear()} ${esc(name)} &middot; Generato con MadeCreative AI</span>
</div>
</footer>

<!-- JS: Nav transition + Scroll reveals + Progress bar + Character reveal -->
<script>
(function(){
  // Nav scroll
  var nav=document.getElementById("mainNav");
  window.addEventListener("scroll",function(){
    nav.classList.toggle("solid",window.scrollY>60);
    nav.classList.toggle("transparent",window.scrollY<=60);
    // Scroll progress
    var h=document.documentElement;
    var p=h.scrollHeight>h.clientHeight?(h.scrollTop/(h.scrollHeight-h.clientHeight))*100:0;
    document.getElementById("scrollProgress").style.transform="scaleX("+p/100+")";
  },{passive:true});

  // Scroll reveal
  var els=document.querySelectorAll(".reveal");
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}});
  },{threshold:0.15,rootMargin:"-40px"});
  els.forEach(function(el){observer.observe(el)});

  // Character reveal on hero title
  var title=document.getElementById("heroTitle");
  if(title){
    var html=title.innerHTML;
    var result="";
    var charIndex=0;
    var inTag=false;
    for(var i=0;i<html.length;i++){
      if(html[i]==="<")inTag=true;
      if(inTag){result+=html[i];if(html[i]===">")inTag=false;continue}
      if(html[i]===" "){result+=" ";continue}
      result+='<span class="char" style="animation-delay:'+(0.5+charIndex*0.04)+'s">'+html[i]+"</span>";
      charIndex++;
    }
    title.innerHTML=result;
  }
})();
</script>
</body>
</html>`;
}

function sectorTagline(sector: string): string {
  const map: Record<string, string> = {
    restaurant: "Cucina autentica",
    dental: "Il tuo sorriso perfetto",
    beauty: "Bellezza e benessere",
    fitness: "Il tuo percorso fitness",
    hotel: "La tua casa lontano da casa",
    legal: "Al tuo fianco, sempre",
    medical: "La tua salute",
    ecommerce: "Il tuo shop online",
    realestate: "La casa dei tuoi sogni",
    professional: "Soluzioni professionali",
  };
  return map[sector] ?? "Soluzioni professionali";
}

/**
 * Generate Sandpack-compatible files (App.js + styles.css).
 * Uses React via CDN in the HTML, but for Sandpack we output a React component.
 */
export function generateSandpackFiles(data: SiteData): Record<string, string> {
  const html = generatePremiumSite(data);
  // For Sandpack, we wrap the HTML in a React component that renders via dangerouslySetInnerHTML
  return {
    "/App.js": `import React from "react";
import "./styles.css";

const siteHtml = ${JSON.stringify(html)};

// Extract body content and styles from full HTML
function extractContent(html) {
  var bodyMatch = html.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
  var styleMatch = html.match(/<style>([\\s\\S]*?)<\\/style>/g);
  var scriptMatch = html.match(/<script>([\\s\\S]*?)<\\/script>/g);
  return {
    body: bodyMatch ? bodyMatch[1] : html,
    styles: styleMatch ? styleMatch.join("\\n") : "",
    scripts: scriptMatch ? scriptMatch.map(function(s){return s.replace(/<\\/?script>/g,"")}).join(";") : "",
  };
}

export default function App() {
  var ref = React.useRef(null);

  React.useEffect(function() {
    if (!ref.current) return;
    var content = extractContent(siteHtml);
    // Inject styles
    var styleEl = document.createElement("style");
    styleEl.textContent = content.styles.replace(/<\\/?style>/g, "");
    document.head.appendChild(styleEl);
    // Inject fonts
    var link = document.createElement("link");
    link.rel = "stylesheet";
    var fontMatch = siteHtml.match(/href="(https:\\/\\/fonts\\.googleapis\\.com[^"]+)"/);
    if (fontMatch) { link.href = fontMatch[1]; document.head.appendChild(link); }
    // Run scripts after DOM update
    setTimeout(function() {
      try { new Function(content.scripts)(); } catch(e) { console.warn("Script error:", e); }
    }, 100);
    return function() { document.head.removeChild(styleEl); };
  }, []);

  var content = extractContent(siteHtml);
  return React.createElement("div", {
    ref: ref,
    dangerouslySetInnerHTML: { __html: content.body },
    style: { minHeight: "100vh" }
  });
}
`,
    "/styles.css": `/* Reset for Sandpack */
html, body { margin: 0; padding: 0; }
`,
  };
}
