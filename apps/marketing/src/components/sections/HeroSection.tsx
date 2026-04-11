"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";
import { generatePremiumSite } from "@madecreative/shared";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

interface AnalysisResult {
  url: string;
  title: string | null;
  description: string | null;
  platform: string;
  score: number;
  issues: string[];
  mobile: boolean;
  https: boolean;
  seo: boolean;
}

interface HeroSectionProps {
  t: Translations;
  locale: string;
}

/* ── Sector detection from URL/title ──────────────────────────────────── */

function detectSector(title: string, url: string): string {
  const text = `${title} ${url}`.toLowerCase();
  if (/ristorante|restaurant|pizz|trattoria|bar|cafe|bistro|cucina|food|sushi/i.test(text)) return "restaurant";
  if (/dent|odont|smile|sorriso/i.test(text)) return "dental";
  if (/bellezza|beauty|salone|salon|hair|estet|nail|spa|wellness|benessere/i.test(text)) return "beauty";
  if (/fitness|palestra|gym|sport|yoga|pilates/i.test(text)) return "fitness";
  if (/hotel|b&b|albergo|resort|hostel/i.test(text)) return "hotel";
  if (/legale|avvocato|lawyer|legal|studio legale/i.test(text)) return "legal";
  if (/medic|doctor|clinic|salute|health|farmacia/i.test(text)) return "medical";
  if (/shop|store|ecommerce|negozio|boutique/i.test(text)) return "ecommerce";
  if (/immobil|real estate|casa|house|apartment/i.test(text)) return "realestate";
  return "professional";
}

/* ── Mini site preview generator ──────────────────────────────────────── */

const SECTOR_PREVIEWS: Record<string, { heroImg: string; accent: string; tagline: string }> = {
  restaurant: { heroImg: "photo-1517248135467-4c7edcad34c4", accent: "#e85d04", tagline: "Cucina autentica" },
  dental: { heroImg: "photo-1629909613654-28e377c37b09", accent: "#0ea5e9", tagline: "Il tuo sorriso perfetto" },
  beauty: { heroImg: "photo-1560066984-138dadb4c035", accent: "#ec4899", tagline: "Bellezza e benessere" },
  fitness: { heroImg: "photo-1534438327276-14e5300c3a48", accent: "#22c55e", tagline: "Il tuo percorso fitness" },
  hotel: { heroImg: "photo-1566073771259-6a8506099945", accent: "#a855f7", tagline: "La tua casa lontano da casa" },
  legal: { heroImg: "photo-1589829545856-d10d557cf95f", accent: "#64748b", tagline: "Al tuo fianco, sempre" },
  medical: { heroImg: "photo-1576091160550-2173dba999ef", accent: "#ef4444", tagline: "La tua salute" },
  ecommerce: { heroImg: "photo-1556742049-0cfed4f6a45d", accent: "#f59e0b", tagline: "Il tuo shop online" },
  realestate: { heroImg: "photo-1560518883-ce09059eeffa", accent: "#14b8a6", tagline: "La casa dei tuoi sogni" },
  professional: { heroImg: "photo-1497366216548-37526070297c", accent: "#6366f1", tagline: "Soluzioni professionali" },
};

/* ── Sector services for preview ──────────────────────────────────── */

const SECTOR_SERVICES: Record<string, Array<{ icon: string; name: string; desc: string }>> = {
  restaurant: [
    { icon: "🍽️", name: "Menu del giorno", desc: "Piatti freschi ogni giorno con ingredienti locali selezionati" },
    { icon: "📅", name: "Prenotazioni", desc: "Prenota il tuo tavolo in pochi secondi, disponibile 24/7" },
    { icon: "🛵", name: "Delivery", desc: "I nostri sapori direttamente a casa tua" },
    { icon: "🎉", name: "Eventi", desc: "Organizza compleanni, matrimoni e cene aziendali" },
  ],
  dental: [
    { icon: "✨", name: "Igiene dentale", desc: "Pulizia professionale per denti sani e bianchi" },
    { icon: "😁", name: "Ortodonzia", desc: "Allineatori invisibili per un sorriso perfetto" },
    { icon: "🦷", name: "Implantologia", desc: "Impianti di ultima generazione, duraturi e naturali" },
    { icon: "💎", name: "Sbiancamento", desc: "Trattamento professionale per un sorriso luminoso" },
  ],
  beauty: [
    { icon: "✂️", name: "Taglio e piega", desc: "Stilisti esperti per ogni tipo di capello" },
    { icon: "🌿", name: "Trattamenti viso", desc: "Rituali di bellezza per una pelle radiosa" },
    { icon: "💅", name: "Manicure", desc: "Unghie perfette con prodotti premium" },
    { icon: "🧖", name: "Massaggi", desc: "Relax totale con massaggi professionali" },
  ],
  fitness: [
    { icon: "🏋️", name: "Personal training", desc: "Programmi su misura con trainer certificati" },
    { icon: "🤸", name: "Corsi di gruppo", desc: "Yoga, pilates, zumba e molto altro" },
    { icon: "🥗", name: "Nutrizione", desc: "Piani nutrizionali abbinati all'allenamento" },
    { icon: "♾️", name: "Abbonamenti", desc: "Mensile, trimestrale o annuale — scegli tu" },
  ],
  hotel: [
    { icon: "🛏️", name: "Camere superior", desc: "Ambienti eleganti con vista panoramica" },
    { icon: "🍷", name: "Ristorante & bar", desc: "Cucina gourmet e cocktail bar" },
    { icon: "💆", name: "Spa & wellness", desc: "Piscina, sauna e trattamenti esclusivi" },
    { icon: "💼", name: "Sale meeting", desc: "Spazi modulari per eventi e conferenze" },
  ],
  professional: [
    { icon: "💡", name: "Consulenza", desc: "Analisi e strategie personalizzate per il tuo business" },
    { icon: "⚙️", name: "Implementazione", desc: "Esecuzione professionale e puntuale" },
    { icon: "📊", name: "Analytics", desc: "Monitoraggio risultati in tempo reale" },
    { icon: "🛡️", name: "Supporto", desc: "Assistenza dedicata sempre disponibile" },
  ],
  legal: [
    { icon: "⚖️", name: "Diritto civile", desc: "Tutela dei tuoi diritti in ogni controversia" },
    { icon: "🔒", name: "Diritto penale", desc: "Difesa professionale e discreta" },
    { icon: "🏢", name: "Consulenza", desc: "Contratti, società e corporate governance" },
    { icon: "🤝", name: "Mediazione", desc: "Risoluzione alternativa delle controversie" },
  ],
  medical: [
    { icon: "🩺", name: "Visite", desc: "Specialisti in cardiologia, ortopedia e altro" },
    { icon: "🔬", name: "Diagnostica", desc: "Analisi e radiologie di ultima generazione" },
    { icon: "💊", name: "Prevenzione", desc: "Check-up completi personalizzati" },
    { icon: "🏃", name: "Riabilitazione", desc: "Fisioterapia e percorsi di recupero" },
  ],
  ecommerce: [
    { icon: "🛍️", name: "Catalogo", desc: "Migliaia di prodotti con varianti e prezzi" },
    { icon: "💳", name: "Pagamenti", desc: "Carta, PayPal, Apple Pay integrati" },
    { icon: "📦", name: "Spedizioni", desc: "Tracking in tempo reale" },
    { icon: "📈", name: "Analytics", desc: "Dashboard con metriche di conversione" },
  ],
  realestate: [
    { icon: "🏠", name: "Compravendita", desc: "Compra e vendi con la nostra rete" },
    { icon: "🔑", name: "Affitti", desc: "Gestione completa residenziale e commerciale" },
    { icon: "📐", name: "Valutazioni", desc: "Perizie e stime di mercato aggiornate" },
    { icon: "🏗️", name: "Nuove costruzioni", desc: "Prima casa e ristrutturazioni chiavi in mano" },
  ],
};

/* ── Premium font mapping (from BuilderAgent) ─────────────────────── */
const SECTOR_FONTS: Record<string, { heading: string; body: string; googleQuery: string }> = {
  restaurant: { heading: "Cormorant Garamond", body: "DM Sans", googleQuery: "Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600" },
  dental: { heading: "Outfit", body: "Source Sans 3", googleQuery: "Outfit:wght@400;600;700;800&family=Source+Sans+3:wght@400;500;600" },
  beauty: { heading: "Tenor Sans", body: "Questrial", googleQuery: "Tenor+Sans&family=Questrial" },
  fitness: { heading: "Bebas Neue", body: "Barlow", googleQuery: "Bebas+Neue&family=Barlow:wght@400;500;600;700" },
  hotel: { heading: "Italiana", body: "Crimson Text", googleQuery: "Italiana&family=Crimson+Text:wght@400;600;700" },
  legal: { heading: "Libre Baskerville", body: "Karla", googleQuery: "Libre+Baskerville:wght@400;700&family=Karla:wght@400;500;600" },
  medical: { heading: "Playfair Display", body: "Nunito", googleQuery: "Playfair+Display:wght@400;600;700;800&family=Nunito:wght@400;500;600" },
  ecommerce: { heading: "Playfair Display", body: "Nunito", googleQuery: "Playfair+Display:wght@400;600;700;800&family=Nunito:wght@400;500;600" },
  realestate: { heading: "Playfair Display", body: "Nunito", googleQuery: "Playfair+Display:wght@400;600;700;800&family=Nunito:wght@400;500;600" },
  professional: { heading: "Playfair Display", body: "Nunito", googleQuery: "Playfair+Display:wght@400;600;700;800&family=Nunito:wght@400;500;600" },
};

function generateMiniPreview(name: string, sector: string): string {
  const cfg = SECTOR_PREVIEWS[sector] ?? SECTOR_PREVIEWS["professional"]!;
  const fonts = SECTOR_FONTS[sector] ?? SECTOR_FONTS["professional"]!;
  const heroUrl = `https://images.unsplash.com/${cfg.heroImg}?auto=format&fit=crop&w=1400&q=85`;
  const a = cfg.accent;
  const initial = (name[0] ?? "M").toUpperCase();

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title>
<link href="https://fonts.googleapis.com/css2?family=${fonts.googleQuery}&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:${a};--heading:'${fonts.heading}',serif;--body:'${fonts.body}',sans-serif;--bg:#fafaf9;--text:#1a1a1a;--muted:#6b7280;--surface:#fff;--border:rgba(0,0,0,0.06)}
body{font-family:var(--body);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}
img{max-width:100%;display:block}

/* NAV */
.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--border);height:64px;display:flex;align-items:center;padding:0 clamp(16px,4vw,48px)}
.nav-inner{max-width:1200px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:36px;height:36px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--heading);font-weight:700;font-size:16px;color:#fff;letter-spacing:-0.02em}
.nav-name{font-family:var(--heading);font-weight:700;font-size:18px;letter-spacing:-0.01em}
.nav-links{display:flex;gap:32px;align-items:center}
.nav-link{font-size:14px;font-weight:500;color:var(--muted);transition:color 0.2s}
.nav-link:hover{color:var(--text)}
.nav-cta{background:var(--accent);color:#fff;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:0.01em;transition:transform 0.2s,box-shadow 0.2s}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.12)}

/* HERO */
.hero{position:relative;min-height:85vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover}
.hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(160deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.2) 50%,rgba(0,0,0,0.45) 100%)}
.hero-content{position:relative;max-width:1200px;margin:0 auto;padding:80px clamp(16px,4vw,48px)}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.18);border-radius:100px;padding:8px 18px;margin-bottom:28px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.9);letter-spacing:0.08em;text-transform:uppercase}
.hero-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent)}
.hero h1{font-family:var(--heading);font-size:clamp(36px,5.5vw,72px);font-weight:700;line-height:1.05;letter-spacing:-0.03em;color:#fff;margin-bottom:20px}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p{font-size:clamp(16px,1.8vw,20px);color:rgba(255,255,255,0.65);max-width:520px;line-height:1.7;margin-bottom:40px}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#fff;padding:16px 36px;border-radius:14px;font-weight:700;font-size:15px;transition:transform 0.2s,box-shadow 0.2s;letter-spacing:0.01em}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,0.25)}
.btn-secondary{background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:16px 36px;border-radius:14px;font-weight:600;font-size:15px;transition:all 0.2s}
.btn-secondary:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.35)}

/* SERVICES */
.services{padding:100px clamp(16px,4vw,48px)}
.services-inner{max-width:1200px;margin:0 auto}
.section-eyebrow{font-size:12px;font-weight:600;color:var(--accent);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px}
.section-title{font-family:var(--heading);font-size:clamp(28px,3.5vw,44px);font-weight:700;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1}
.section-desc{font-size:16px;color:var(--muted);max-width:480px;line-height:1.7;margin-bottom:56px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;transition:transform 0.3s,box-shadow 0.3s}
.card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.06)}
.card-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 70%,#000));display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px;color:#fff}
.card h3{font-family:var(--heading);font-size:18px;font-weight:700;margin-bottom:10px;letter-spacing:-0.01em}
.card p{font-size:14px;color:var(--muted);line-height:1.65}

/* FOOTER */
.footer{border-top:1px solid var(--border);padding:32px clamp(16px,4vw,48px);text-align:center}
.footer-text{font-size:12px;color:var(--muted)}

@media(max-width:640px){.nav-links{display:none}.hero h1{font-size:32px}.card-grid{grid-template-columns:1fr}}
</style></head><body>

<nav class="nav"><div class="nav-inner">
<div class="nav-brand"><div class="nav-logo">${initial}</div><span class="nav-name">${name}</span></div>
<div class="nav-links">
<a href="#servizi" class="nav-link">Servizi</a><a href="#contatti" class="nav-link">Contatti</a>
<a href="#contatti" class="nav-cta">Prenota ora</a>
</div></div></nav>

<section class="hero"><div class="hero-bg"><img src="${heroUrl}" alt="${name}" loading="eager"></div>
<div class="hero-content">
<div class="hero-eyebrow"><span class="hero-dot"></span>${cfg.tagline}</div>
<h1>${name}.<br><em>${cfg.tagline}.</em></h1>
<p>Benvenuto — il punto di riferimento per eccellenza. Qualità artigianale, attenzione al dettaglio e passione autentica dal primo giorno.</p>
<div class="hero-ctas">
<a href="#contatti" class="btn-primary">Scopri di più →</a>
<a href="#servizi" class="btn-secondary">I nostri servizi</a>
</div></div></section>

<section id="servizi" class="services"><div class="services-inner">
<div class="section-eyebrow">Cosa offriamo</div>
<div class="section-title">I nostri servizi</div>
<div class="section-desc">Tutto quello di cui hai bisogno, curato nei minimi dettagli.</div>
<div class="card-grid">
${(SECTOR_SERVICES[sector] ?? SECTOR_SERVICES["professional"]!).map((s: { icon: string; name: string; desc: string }) => `<div class="card"><div class="card-icon">${s.icon}</div><h3>${s.name}</h3><p>${s.desc}</p></div>`).join("")}
</div></div></section>

<footer class="footer"><p class="footer-text">© ${new Date().getFullYear()} ${name} · Generato con MadeCreative AI</p></footer>
</body></html>`;
}

const SOCIAL_PROOF: Record<string, Array<{ value: string; label: string }>> = {
  de: [
    { value: "60s", label: "Website generiert" },
    { value: "€25", label: "ab / Monat" },
  ],
  it: [
    { value: "60s", label: "per generare il sito" },
    { value: "€25", label: "a partire da / mese" },
  ],
  en: [
    { value: "60s", label: "to generate your site" },
    { value: "€25", label: "starting from / month" },
  ],
  es: [
    { value: "60s", label: "para generar tu web" },
    { value: "€25", label: "desde / mes" },
  ],
  fr: [
    { value: "60s", label: "pour générer votre site" },
    { value: "€25", label: "à partir de / mois" },
  ],
  nl: [
    { value: "60s", label: "om je site te genereren" },
    { value: "€25", label: "vanaf / maand" },
  ],
  pt: [
    { value: "60s", label: "para gerar seu site" },
    { value: "€25", label: "a partir de / mês" },
  ],
};

export function HeroSection({ t, locale }: HeroSectionProps) {
  const proof = SOCIAL_PROOF[locale] ?? SOCIAL_PROOF["en"]!;
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || analyzing) return;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/public/signup/analyze-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = (await res.json()) as { success: boolean; data?: AnalysisResult; error?: string };
      if (json.success && json.data) {
        setResult(json.data);
        // Generate preview site based on detected sector
        const siteName = json.data.title?.split(/[|–—·]/).shift()?.trim() || url.replace(/https?:\/\//, "").split("/")[0]?.replace("www.", "") || "Il tuo sito";
        const sector = detectSector(json.data.title ?? "", url);
        const html = generatePremiumSite({ name: siteName, sector });
        setPreviewHtml(html);
        setShowPreview(false);
      } else {
        setError(json.error ?? "Errore nell'analisi");
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#05070f" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        <div
          className="orb-float hidden sm:block absolute top-[18%] left-1/2 w-[760px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 68%)" }}
        />
        <div
          className="orb-float-slow absolute top-[35%] left-[58%] w-[480px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.10) 0%, transparent 65%)", animationDelay: "2.5s" }}
        />
        <div
          className="orb-float absolute bottom-[12%] left-[8%] w-[360px] h-[280px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)", animationDelay: "4.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-20">
        {/* Badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#818cf8",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t.hero.badge}
        </div>

        {/* Title */}
        <h1 className="animate-fade-up delay-100 text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight mb-6">
          <span style={{ color: "#f8fafc" }}>{t.hero.title}</span>
          <br />
          <span className="text-gradient">{t.hero.titleHighlight}</span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-up delay-200 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(248,250,252,0.55)" }}
        >
          {t.hero.subtitle}
        </p>

        {/* URL input bar */}
        <form
          onSubmit={handleAnalyze}
          className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center items-center max-w-2xl mx-auto mb-6"
        >
          <div className="relative flex-1 w-full">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "rgba(248,250,252,0.35)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.hero.urlPlaceholder}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#f8fafc",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={analyzing}
            className="glow-indigo inline-flex items-center gap-2 gradient-indigo text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Analisi...
              </>
            ) : (
              <>
                {t.hero.urlCta}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Analysis result + Preview */}
        {result && (
          <div className="animate-fade-up max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="p-5">
              {/* Score bar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-white">{result.title || result.url}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(248,250,252,0.4)" }}>{result.platform} • {result.url}</p>
                </div>
                <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${result.score >= 70 ? "text-emerald-400 bg-emerald-500/10" : result.score >= 40 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"}`}>
                  {result.score}/100
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(248,250,252,0.5)" }}>
                      <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      {issue}
                    </div>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${result.mobile ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {result.mobile ? "✓" : "✗"} Mobile
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${result.https ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {result.https ? "✓" : "✗"} HTTPS
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${result.seo ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {result.seo ? "✓" : "✗"} SEO
                </span>
              </div>

              {/* Preview toggle */}
              {!showPreview ? (
                <button
                  onClick={() => setShowPreview(true)}
                  className="block w-full text-center gradient-indigo text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
                >
                  Guarda come rifacciamo il tuo sito — gratis
                </button>
              ) : (
                <>
                  {/* Browser chrome + iframe preview */}
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="px-4 py-2.5 flex items-center gap-3" style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                      </div>
                      <div className="flex-1 flex items-center gap-2 rounded-md px-3 py-1 text-xs" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(248,250,252,0.4)", maxWidth: "320px", margin: "0 auto" }}>
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#28c840" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span className="truncate">tuosito.madecreative.pro</span>
                      </div>
                    </div>
                    <iframe
                      srcDoc={previewHtml}
                      title="Preview sito rifatto"
                      className="w-full"
                      style={{ height: "420px", border: "none", display: "block" }}
                      sandbox="allow-same-origin"
                      loading="lazy"
                    />
                  </div>

                  {/* CTA */}
                  <a
                    href={`/${locale}#pricing`}
                    className="block w-full text-center gradient-indigo text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
                  >
                    Vuoi questo sito? Attivalo da €25/mese
                  </a>
                </>
              )}
              <p className="text-center mt-2.5" style={{ color: "rgba(248,250,252,0.3)", fontSize: "11px" }}>
                Preview gratuita • Il sito diventa tuo e lo modifichi con l&apos;AI
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}

        {/* Secondary CTA */}
        <div className="animate-fade-up delay-300 flex justify-center items-center mb-10">
          <a
            href={`/${locale}#how-it-works`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {t.hero.ctaSecondary}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </a>
        </div>

        {/* Trust note */}
        <p className="animate-fade-up delay-400 text-xs" style={{ color: "rgba(248,250,252,0.3)" }}>
          {t.hero.trustNote}
        </p>

        {/* Hero video */}
        <div className="animate-fade-up delay-400 mt-12 max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(99,102,241,0.15)" }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          >
            <source src="/videos/hero-demo.webm" type="video/webm" />
          </video>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400 mt-14 grid grid-cols-2 gap-4 sm:gap-8 max-w-md mx-auto">
          {proof.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: "#818cf8" }}>
                {item.value}
              </div>
              <div className="text-xs mt-1.5" style={{ color: "rgba(248,250,252,0.35)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "white" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
