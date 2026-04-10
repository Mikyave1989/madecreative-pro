"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Translations } from "@/lib/i18n";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface DemoSectionProps {
  t: Translations;
  locale: string;
}

type DemoState = "idle" | "loading" | "success";

/* ── Sector configuration ──────────────────────────────────────────────── */

interface SectorConfig {
  tagline: string;
  heroImage: string;
  accent: string;
  services: Array<{ icon: string; name: string; desc: string }>;
  phone: string;
}

const SECTOR_CONFIG: Record<string, SectorConfig> = {
  restaurant: {
    tagline: "Cucina autentica dal 1985",
    heroImage: "photo-1517248135467-4c7edcad34c4",
    accent: "#e85d04",
    services: [
      { icon: "🍽️", name: "Menu del giorno", desc: "Piatti freschi ogni giorno con ingredienti locali selezionati" },
      { icon: "📅", name: "Prenotazioni online", desc: "Prenota il tuo tavolo in pochi secondi, disponibile 24/7" },
      { icon: "🛵", name: "Consegna a domicilio", desc: "I nostri sapori direttamente a casa tua, veloci e caldi" },
      { icon: "🎉", name: "Eventi privati", desc: "Organizza compleanni, matrimoni e cene aziendali con noi" },
    ],
    phone: "+39 02 1234 5678",
  },
  dental: {
    tagline: "Il tuo sorriso perfetto",
    heroImage: "photo-1629909613654-28e377c37b09",
    accent: "#0ea5e9",
    services: [
      { icon: "✨", name: "Igiene dentale", desc: "Pulizia professionale per mantenere i denti sani e bianchi" },
      { icon: "😁", name: "Ortodonzia", desc: "Allineatori invisibili e apparecchi per un sorriso perfetto" },
      { icon: "🦷", name: "Implantologia", desc: "Impianti di ultima generazione, duraturi e naturali" },
      { icon: "💎", name: "Sbiancamento", desc: "Trattamento professionale per un sorriso luminoso" },
    ],
    phone: "+39 02 9876 5432",
  },
  beauty: {
    tagline: "Bellezza e benessere",
    heroImage: "photo-1560066984-138dadb4c035",
    accent: "#ec4899",
    services: [
      { icon: "✂️", name: "Taglio e piega", desc: "Stilisti esperti per ogni tipo di capello e stile" },
      { icon: "🌿", name: "Trattamenti viso", desc: "Rituali di bellezza naturali per una pelle radiosa" },
      { icon: "💅", name: "Manicure & nail art", desc: "Unghie perfette con prodotti premium e design esclusivi" },
      { icon: "🧖", name: "Massaggi", desc: "Relax totale con i nostri massaggi professionali" },
    ],
    phone: "+39 02 5555 1234",
  },
  fitness: {
    tagline: "Il tuo percorso fitness",
    heroImage: "photo-1534438327276-14e5300c3a48",
    accent: "#22c55e",
    services: [
      { icon: "🏋️", name: "Personal training", desc: "Programmi su misura con trainer certificati" },
      { icon: "🤸", name: "Corsi di gruppo", desc: "Yoga, pilates, zumba e molto altro ogni giorno" },
      { icon: "🥗", name: "Piani nutrizionali", desc: "Dieta bilanciata abbinata al tuo allenamento" },
      { icon: "♾️", name: "Abbonamenti flessibili", desc: "Mensile, trimestrale o annuale — scegli tu" },
    ],
    phone: "+39 02 3333 4444",
  },
  hotel: {
    tagline: "La tua casa lontano da casa",
    heroImage: "photo-1566073771259-6a8506099945",
    accent: "#a855f7",
    services: [
      { icon: "🛏️", name: "Camere superior", desc: "Ambienti eleganti con vista panoramica e dotazioni complete" },
      { icon: "🍷", name: "Ristorante & bar", desc: "Cucina gourmet e cocktail bar aperto fino a tarda notte" },
      { icon: "💆", name: "Spa & wellness", desc: "Piscina, sauna, hammam e trattamenti esclusivi" },
      { icon: "💼", name: "Sale meeting", desc: "Spazi modulari attrezzati per eventi e conferenze" },
    ],
    phone: "+39 02 7777 8888",
  },
  legal: {
    tagline: "Al tuo fianco, sempre",
    heroImage: "photo-1589829545856-d10d557cf95f",
    accent: "#64748b",
    services: [
      { icon: "⚖️", name: "Diritto civile", desc: "Tutela dei tuoi diritti in ogni controversia civile" },
      { icon: "🔒", name: "Diritto penale", desc: "Difesa professionale e discreta in ogni procedimento" },
      { icon: "🏢", name: "Consulenza aziendale", desc: "Contratti, società e corporate governance" },
      { icon: "🤝", name: "Mediazione", desc: "Risoluzione alternativa delle controversie rapida ed efficace" },
    ],
    phone: "+39 02 2222 3333",
  },
  professional: {
    tagline: "Soluzioni professionali",
    heroImage: "photo-1497366216548-37526070297c",
    accent: "#6366f1",
    services: [
      { icon: "💡", name: "Consulenza strategica", desc: "Analisi del mercato e pianificazione per far crescere il business" },
      { icon: "📊", name: "Business strategy", desc: "KPI, roadmap e obiettivi misurabili per ogni fase" },
      { icon: "⚙️", name: "Implementazione", desc: "Esecuzione operativa con team dedicati e metodologie agili" },
      { icon: "🛡️", name: "Supporto continuativo", desc: "Assistenza post-progetto per garantire i risultati" },
    ],
    phone: "+39 02 4444 5555",
  },
  ecommerce: {
    tagline: "Il tuo shop online",
    heroImage: "photo-1556742049-0cfed4f6a45d",
    accent: "#f59e0b",
    services: [
      { icon: "🛍️", name: "Catalogo prodotti", desc: "Gestisci migliaia di prodotti con varianti e prezzi dinamici" },
      { icon: "💳", name: "Pagamenti sicuri", desc: "Carta, PayPal, Apple Pay — tutte le opzioni integrate" },
      { icon: "📦", name: "Spedizioni", desc: "Tracking in tempo reale e integrazioni con i principali corrieri" },
      { icon: "📈", name: "Analytics vendite", desc: "Dashboard con metriche di conversione e revenue in tempo reale" },
    ],
    phone: "+39 02 6666 7777",
  },
  realestate: {
    tagline: "La casa dei tuoi sogni",
    heroImage: "photo-1560518883-ce09059eeffa",
    accent: "#14b8a6",
    services: [
      { icon: "🏠", name: "Compravendita", desc: "Compra e vendi immobili con la nostra rete di professionisti" },
      { icon: "🔑", name: "Affitti", desc: "Gestione completa degli affitti residenziali e commerciali" },
      { icon: "📐", name: "Valutazioni", desc: "Perizie precise e stime di mercato aggiornate in tempo reale" },
      { icon: "🏗️", name: "Nuove costruzioni", desc: "Prima casa, investimenti e ristrutturazioni chiavi in mano" },
    ],
    phone: "+39 02 8888 9999",
  },
  medical: {
    tagline: "La tua salute, la nostra missione",
    heroImage: "photo-1576091160550-2173dba999ef",
    accent: "#ef4444",
    services: [
      { icon: "🩺", name: "Visite specialistiche", desc: "Specialisti in cardiologia, ortopedia, neurologia e altro" },
      { icon: "🔬", name: "Diagnostica", desc: "Analisi del sangue, ecografie e radiologie di ultima generazione" },
      { icon: "💊", name: "Medicina preventiva", desc: "Check-up completi e piani di prevenzione personalizzati" },
      { icon: "🏃", name: "Riabilitazione", desc: "Fisioterapia e percorsi di recupero per tornare in forma" },
    ],
    phone: "+39 02 1111 2222",
  },
};

const DEFAULT_SECTOR: SectorConfig = SECTOR_CONFIG["professional"]!;

const SECTORS = [
  { value: "restaurant", label: "Ristorante / Bar" },
  { value: "dental", label: "Studio dentistico" },
  { value: "beauty", label: "Salone di bellezza" },
  { value: "fitness", label: "Palestra / Fitness" },
  { value: "hotel", label: "Hotel / B&B" },
  { value: "legal", label: "Studio legale" },
  { value: "medical", label: "Studio medico" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "realestate", label: "Agenzia immobiliare" },
  { value: "professional", label: "Servizi professionali" },
];

/* ── Build steps ───────────────────────────────────────────────────────── */

const BUILD_STEPS = [
  { text: (s: string) => `Analisi settore: ${s}`, color: "#22d3ee", delay: 0 },
  { text: () => "Generazione contenuti AI...", color: "#a78bfa", delay: 600 },
  { text: () => "Creazione layout responsive...", color: "#818cf8", delay: 1200 },
  { text: () => "Ottimizzazione SEO...", color: "#34d399", delay: 1800 },
  { text: () => "Sito pronto!", color: "#f472b6", delay: 2400 },
];

/* ── HTML generator ────────────────────────────────────────────────────── */

function generateSiteHtml(name: string, sector: string, city: string): string {
  const cfg = SECTOR_CONFIG[sector] ?? DEFAULT_SECTOR;
  const slug = name.toLowerCase().replace(/\s+/g, "");
  const heroUrl = `https://images.unsplash.com/${cfg.heroImage}?auto=format&fit=crop&w=1200&q=80`;
  const accentHex = cfg.accent;

  const servicesHtml = cfg.services
    .map(
      (s) => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;transition:transform 0.2s;">
        <div style="font-size:32px;margin-bottom:12px;">${s.icon}</div>
        <div style="font-size:16px;font-weight:700;color:#f8fafc;margin-bottom:8px;">${s.name}</div>
        <div style="font-size:13px;color:rgba(248,250,252,0.55);line-height:1.6;">${s.desc}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — ${city}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:#05070f;color:#f8fafc;}
  a{text-decoration:none;}
  img{max-width:100%;}
</style>
</head>
<body>

<!-- NAV -->
<nav style="position:sticky;top:0;z-index:100;background:rgba(5,7,15,0.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.06);padding:0 32px;">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border-radius:8px;background:${accentHex};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;">${name[0]?.toUpperCase() ?? "M"}</div>
      <span style="font-weight:700;font-size:17px;color:#f8fafc;">${name}</span>
    </div>
    <div style="display:flex;gap:28px;align-items:center;">
      <a href="#servizi" style="color:rgba(248,250,252,0.6);font-size:14px;font-weight:500;">Servizi</a>
      <a href="#contatti" style="color:rgba(248,250,252,0.6);font-size:14px;font-weight:500;">Contatti</a>
      <a href="#contatti" style="background:${accentHex};color:#fff;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;">Contattaci</a>
    </div>
  </div>
</nav>

<!-- HERO -->
<section style="position:relative;min-height:520px;display:flex;align-items:center;overflow:hidden;">
  <div style="position:absolute;inset:0;">
    <img src="${heroUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;filter:brightness(0.3);">
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(5,7,15,0.7) 0%,rgba(5,7,15,0.3) 100%);"></div>
  </div>
  <div style="position:relative;max-width:1100px;margin:0 auto;padding:80px 32px;">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:100px;padding:6px 16px;margin-bottom:24px;">
      <div style="width:7px;height:7px;border-radius:50%;background:${accentHex};"></div>
      <span style="font-size:12px;font-weight:600;color:rgba(248,250,252,0.8);letter-spacing:0.05em;text-transform:uppercase;">${city}</span>
    </div>
    <h1 style="font-size:clamp(36px,5vw,64px);font-weight:900;line-height:1.08;letter-spacing:-0.03em;margin-bottom:20px;">
      <span style="color:#f8fafc;">${name}</span><br>
      <span style="color:${accentHex};">${cfg.tagline}</span>
    </h1>
    <p style="font-size:18px;color:rgba(248,250,252,0.6);max-width:520px;line-height:1.6;margin-bottom:36px;">Benvenuto da ${name} — il punto di riferimento per ${cfg.tagline.toLowerCase()} a ${city}. Qualità, professionalità e passione in ogni dettaglio.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;">
      <a href="#contatti" style="background:${accentHex};color:#fff;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;">Scopri di più</a>
      <a href="#servizi" style="background:rgba(255,255,255,0.08);color:#f8fafc;border:1px solid rgba(255,255,255,0.12);padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;display:inline-block;">I nostri servizi</a>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section id="servizi" style="padding:80px 32px;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:56px;">
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:100px;padding:5px 14px;margin-bottom:16px;">
        <span style="font-size:11px;font-weight:600;color:${accentHex};letter-spacing:0.08em;text-transform:uppercase;">Cosa offriamo</span>
      </div>
      <h2 style="font-size:40px;font-weight:800;color:#f8fafc;margin-bottom:12px;letter-spacing:-0.02em;">I nostri servizi</h2>
      <p style="font-size:16px;color:rgba(248,250,252,0.5);max-width:480px;margin:0 auto;">Tutto quello di cui hai bisogno, in un unico posto.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
      ${servicesHtml}
    </div>
  </div>
</section>

<!-- WHY US -->
<section style="padding:64px 32px;background:linear-gradient(135deg,rgba(255,255,255,0.02) 0%,transparent 100%);border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;text-align:center;">
    <div>
      <div style="font-size:42px;font-weight:900;color:${accentHex};margin-bottom:6px;">+500</div>
      <div style="font-size:14px;color:rgba(248,250,252,0.5);">Clienti soddisfatti</div>
    </div>
    <div>
      <div style="font-size:42px;font-weight:900;color:${accentHex};margin-bottom:6px;">15+</div>
      <div style="font-size:14px;color:rgba(248,250,252,0.5);">Anni di esperienza</div>
    </div>
    <div>
      <div style="font-size:42px;font-weight:900;color:${accentHex};margin-bottom:6px;">4.9★</div>
      <div style="font-size:14px;color:rgba(248,250,252,0.5);">Rating medio</div>
    </div>
    <div>
      <div style="font-size:42px;font-weight:900;color:${accentHex};margin-bottom:6px;">100%</div>
      <div style="font-size:14px;color:rgba(248,250,252,0.5);">Soddisfazione garantita</div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contatti" style="padding:80px 32px;">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
    <div>
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:100px;padding:5px 14px;margin-bottom:16px;">
        <span style="font-size:11px;font-weight:600;color:${accentHex};letter-spacing:0.08em;text-transform:uppercase;">Contatti</span>
      </div>
      <h2 style="font-size:36px;font-weight:800;color:#f8fafc;margin-bottom:16px;letter-spacing:-0.02em;">Siamo a ${city}</h2>
      <p style="font-size:16px;color:rgba(248,250,252,0.55);line-height:1.7;margin-bottom:32px;">Vieni a trovarci o contattaci per qualsiasi informazione. Siamo sempre felici di rispondere.</p>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">📍</div>
          <div>
            <div style="font-size:12px;color:rgba(248,250,252,0.4);margin-bottom:2px;">Indirizzo</div>
            <div style="font-size:14px;font-weight:600;color:#f8fafc;">Via Roma 1, ${city}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">📞</div>
          <div>
            <div style="font-size:12px;color:rgba(248,250,252,0.4);margin-bottom:2px;">Telefono</div>
            <div style="font-size:14px;font-weight:600;color:#f8fafc;">${cfg.phone}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">✉️</div>
          <div>
            <div style="font-size:12px;color:rgba(248,250,252,0.4);margin-bottom:2px;">Email</div>
            <div style="font-size:14px;font-weight:600;color:#f8fafc;">info@${slug}.it</div>
          </div>
        </div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
      <h3 style="font-size:20px;font-weight:700;color:#f8fafc;margin-bottom:24px;">Scrivici un messaggio</h3>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 16px;font-size:14px;color:rgba(248,250,252,0.3);">Il tuo nome</div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 16px;font-size:14px;color:rgba(248,250,252,0.3);">La tua email</div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 16px;font-size:14px;color:rgba(248,250,252,0.3);height:90px;">Il tuo messaggio...</div>
        <div style="background:${accentHex};color:#fff;padding:14px;border-radius:10px;font-weight:700;font-size:14px;text-align:center;cursor:pointer;">Invia messaggio</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer style="border-top:1px solid rgba(255,255,255,0.06);padding:32px;background:rgba(0,0,0,0.3);">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;border-radius:7px;background:${accentHex};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;">${name[0]?.toUpperCase() ?? "M"}</div>
      <span style="font-weight:700;font-size:15px;color:rgba(248,250,252,0.7);">${name}</span>
    </div>
    <div style="font-size:12px;color:rgba(248,250,252,0.25);">© ${new Date().getFullYear()} ${name} · ${city} · P.IVA 12345678901</div>
    <div style="display:flex;gap:20px;">
      <a href="#" style="font-size:12px;color:rgba(248,250,252,0.35);">Privacy</a>
      <a href="#" style="font-size:12px;color:rgba(248,250,252,0.35);">Cookie</a>
      <a href="#" style="font-size:12px;color:rgba(248,250,252,0.35);">Termini</a>
    </div>
  </div>
  <div style="max-width:1100px;margin:16px auto 0;text-align:center;">
    <span style="font-size:11px;color:rgba(248,250,252,0.15);">Sito generato con MadeCreative AI · madecreative.pro</span>
  </div>
</footer>

</body>
</html>`;
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function BuildStep({
  text,
  visible,
  done,
  color,
}: {
  text: string;
  visible: boolean;
  done: boolean;
  color: string;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <span style={{ color }} className="font-mono text-xs leading-relaxed">
        {text}
      </span>
      {done ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{ color: "#34d399" }}
          className="text-xs font-bold"
        >
          ✓
        </motion.span>
      ) : (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{ color: "rgba(248,250,252,0.35)" }}
          className="text-xs font-mono"
        >
          _
        </motion.span>
      )}
    </motion.div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */

export function DemoSection({ t, locale }: DemoSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");

  const reset = useCallback(() => {
    setDemoState("idle");
    setVisibleSteps(0);
    setGeneratedHtml("");
    setName("");
    setSector("");
    setCity("");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sector.trim() || !city.trim()) return;

    setDemoState("loading");
    setVisibleSteps(0);

    // Reveal build steps one by one
    for (let i = 0; i < BUILD_STEPS.length; i++) {
      await new Promise<void>((resolve) => {
        const step = BUILD_STEPS[i];
        if (!step) { resolve(); return; }
        setTimeout(() => {
          setVisibleSteps(i + 1);
          resolve();
        }, step.delay);
      });
    }

    // Small pause after last step so "Sito pronto!" is visible
    await new Promise((r) => setTimeout(r, 500));

    const html = generateSiteHtml(name, sector, city);
    setGeneratedHtml(html);
    setDemoState("success");
  }

  const inputBase =
    "w-full px-4 py-3 sm:py-3.5 rounded-xl text-sm outline-none transition-all placeholder:text-[rgba(248,250,252,0.25)] focus:ring-2 focus:ring-indigo-500/30";
  const inputStyle: React.CSSProperties = {
    background: "#0d1117",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f8fafc",
  };

  const sectorLabel = SECTORS.find((s) => s.value === sector)?.label ?? sector;

  const urlSlug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <section
      ref={ref}
      id="demo"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22d3ee",
            }}
          >
            {t.demo.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold text-center mb-4"
          style={{ color: "#f8fafc" }}
        >
          {t.demo.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-center max-w-xl mx-auto mb-12"
          style={{ color: "rgba(248,250,252,0.5)" }}
        >
          {t.demo.subtitle}
        </motion.p>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#161b27",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <AnimatePresence mode="wait">
            {/* ── State 1: Form ─────────────────────────────────────────── */}
            {demoState === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-10"
              >
                <div className="max-w-lg mx-auto">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Company name */}
                    <div>
                      <label
                        htmlFor="demo-name"
                        className="block text-sm font-semibold mb-2"
                        style={{ color: "rgba(248,250,252,0.7)" }}
                      >
                        Nome azienda
                      </label>
                      <input
                        id="demo-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.demo.namePlaceholder}
                        className={inputBase}
                        style={inputStyle}
                        required
                        autoComplete="organization"
                      />
                    </div>

                    {/* Sector + City */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="demo-sector"
                          className="block text-sm font-semibold mb-2"
                          style={{ color: "rgba(248,250,252,0.7)" }}
                        >
                          Settore
                        </label>
                        <select
                          id="demo-sector"
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          className={inputBase}
                          style={{
                            ...inputStyle,
                            appearance: "none",
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='rgba(248,250,252,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 12px center",
                            backgroundSize: "18px",
                            paddingRight: "40px",
                          }}
                          required
                        >
                          <option value="" disabled>
                            {t.demo.sectorPlaceholder}
                          </option>
                          {SECTORS.map((s) => (
                            <option
                              key={s.value}
                              value={s.value}
                              style={{ background: "#0d1117" }}
                            >
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="demo-city"
                          className="block text-sm font-semibold mb-2"
                          style={{ color: "rgba(248,250,252,0.7)" }}
                        >
                          Città
                        </label>
                        <input
                          id="demo-city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={t.demo.cityPlaceholder}
                          className={inputBase}
                          style={inputStyle}
                          required
                          autoComplete="address-level2"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!name.trim() || !sector.trim() || !city.trim()}
                      className="w-full gradient-indigo text-white py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed glow-indigo"
                    >
                      Genera il tuo sito gratis
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── State 2: Building ──────────────────────────────────────── */}
            {demoState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[340px]"
              >
                <div
                  className="w-full max-w-md font-mono text-sm rounded-2xl p-6 space-y-3"
                  style={{
                    background: "#05070f",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="text-xs font-semibold mb-4 pb-3"
                    style={{
                      color: "rgba(248,250,252,0.2)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    madecreative_builder v2.1 — generazione in corso
                  </div>

                  <BuildStep
                    text={`> Analisi settore: ${sectorLabel}...`}
                    visible={visibleSteps >= 1}
                    done={visibleSteps >= 2}
                    color="#22d3ee"
                  />
                  <BuildStep
                    text="> Generazione contenuti AI..."
                    visible={visibleSteps >= 2}
                    done={visibleSteps >= 3}
                    color="#a78bfa"
                  />
                  <BuildStep
                    text="> Creazione layout responsive..."
                    visible={visibleSteps >= 3}
                    done={visibleSteps >= 4}
                    color="#818cf8"
                  />
                  <BuildStep
                    text="> Ottimizzazione SEO..."
                    visible={visibleSteps >= 4}
                    done={visibleSteps >= 5}
                    color="#34d399"
                  />
                  <BuildStep
                    text="> Sito pronto!"
                    visible={visibleSteps >= 5}
                    done={visibleSteps >= 5}
                    color="#f472b6"
                  />
                </div>

                <p
                  className="text-sm mt-5 animate-pulse"
                  style={{ color: "rgba(248,250,252,0.35)" }}
                >
                  Costruendo il sito per {name}...
                </p>
              </motion.div>
            )}

            {/* ── State 3: Preview ───────────────────────────────────────── */}
            {demoState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-8"
              >
                {/* Browser chrome + iframe */}
                <div
                  className="rounded-2xl overflow-hidden mb-6"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {/* macOS-style title bar */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{
                      background: "#0d1117",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Traffic lights */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#ff5f57" }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#febc2e" }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#28c840" }}
                      />
                    </div>

                    {/* URL bar */}
                    <div
                      className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                      style={{
                        background: "#161b27",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(248,250,252,0.4)",
                        maxWidth: "420px",
                        margin: "0 auto",
                      }}
                    >
                      <svg
                        className="w-3 h-3 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: "#28c840" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span className="truncate">
                        {urlSlug}.madecreative.pro
                      </span>
                    </div>

                    {/* Spacer matching traffic-light width */}
                    <div className="w-12 flex-shrink-0" />
                  </div>

                  {/* Generated website iframe */}
                  <iframe
                    srcDoc={generatedHtml}
                    title={`Preview sito ${name}`}
                    className="w-full"
                    style={{
                      height: "500px",
                      border: "none",
                      display: "block",
                    }}
                    sandbox="allow-same-origin"
                    loading="lazy"
                  />
                </div>

                {/* Stats bar */}
                <div
                  className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4 py-3 rounded-xl mb-6 text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(248,250,252,0.5)",
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: "#34d399" }}>⚡</span>
                    Tempo di generazione: 3.2s
                  </span>
                  <span
                    className="hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.1)" }}
                  >
                    •
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: "#22d3ee" }}>📈</span>
                    SEO Score: 95/100
                  </span>
                  <span
                    className="hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.1)" }}
                  >
                    •
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: "#a78bfa" }}>📱</span>
                    Mobile ready ✓
                  </span>
                </div>

                {/* CTAs */}
                <div className="text-center space-y-3">
                  <a
                    href="#pricing"
                    className="gradient-indigo text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 glow-indigo inline-block w-full sm:w-auto"
                  >
                    Vuoi questo sito? Inizia da €25/mese
                  </a>

                  <div>
                    <span
                      className="text-sm"
                      style={{ color: "rgba(248,250,252,0.4)" }}
                    >
                      Oppure{" "}
                    </span>
                    <button
                      onClick={reset}
                      className="text-sm font-medium underline underline-offset-2 transition-colors hover:opacity-80"
                      style={{ color: "#818cf8" }}
                    >
                      prova con un altro settore
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
