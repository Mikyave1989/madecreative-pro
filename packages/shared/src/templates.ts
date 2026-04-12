/**
 * Premium template configurations per sector.
 * Source of truth for: colors, fonts, hero variant, stats, about text
 * Used by: site-generator.ts, BuilderAgent, portal editor fallback
 */

export interface TemplateColors {
  primary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
  border: string;
  surface: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
  googleFontsUrl: string;
}

export interface SectorStat {
  value: string;
  label: string;
  dark?: boolean; // true = dark background card
}

export interface TemplateConfig {
  sector: string;
  fonts: TemplateFonts;
  colors: TemplateColors;
  heroVariant: "split" | "centered" | "editorial" | "bold" | "cinematic";
  animationPreset: string;
  stats: [SectorStat, SectorStat, SectorStat, SectorStat];
  aboutText: string; // unique sector description (uses {name} and {city} placeholders)
  ctaLabel: string;  // primary CTA text
  ctaSecondary: string; // secondary CTA text
}

/* ── CONFIGS ───────────────────────────────────────────────────────────── */

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  restaurant: {
    sector: "restaurant",
    fonts: {
      heading: "Cormorant Garamond",
      body: "DM Sans",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap",
    },
    colors: { primary: "#1a1208", accent: "#c9a84c", background: "#faf8f4", text: "#2d2419", textLight: "#6b5c42", border: "#e8e0d0", surface: "#ffffff" },
    heroVariant: "split",
    animationPreset: "elegant_fade",
    stats: [
      { value: "15+", label: "Anni di tradizione", dark: true },
      { value: "4.8", label: "Rating Google" },
      { value: "200+", label: "Piatti in menu" },
      { value: "100%", label: "Ingredienti freschi", dark: true },
    ],
    aboutText: "Da {name}, ogni piatto racconta una storia di passione e tradizione. I nostri ingredienti arrivano ogni mattina dai migliori produttori locali, selezionati dal nostro chef per garantire freschezza e autenticità in ogni boccone. Che si tratti di un pranzo veloce o di una cena romantica, il nostro team vi accoglierà come in famiglia.",
    ctaLabel: "Prenota un tavolo",
    ctaSecondary: "Scopri il menu",
  },
  dental: {
    sector: "dental",
    fonts: {
      heading: "Outfit",
      body: "Source Sans 3",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap",
    },
    colors: { primary: "#0a2540", accent: "#00b4d8", background: "#f0f8ff", text: "#1a3050", textLight: "#4a6285", border: "#d0e8f5", surface: "#ffffff" },
    heroVariant: "centered",
    animationPreset: "clean_rise",
    stats: [
      { value: "20+", label: "Anni di esperienza", dark: true },
      { value: "15k+", label: "Pazienti soddisfatti" },
      { value: "98%", label: "Tasso di successo" },
      { value: "5", label: "Specialisti nel team", dark: true },
    ],
    aboutText: "Lo {name} unisce competenza medica e tecnologia di ultima generazione per offrire cure dentali di eccellenza. Il nostro team di specialisti utilizza scanner 3D, laser a diodo e protocolli mini-invasivi per garantire trattamenti indolore e risultati duraturi. La vostra salute orale è la nostra priorità — dalla prima visita al follow-up.",
    ctaLabel: "Prenota una visita",
    ctaSecondary: "I nostri trattamenti",
  },
  beauty: {
    sector: "beauty",
    fonts: {
      heading: "Tenor Sans",
      body: "Questrial",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tenor+Sans&family=Questrial&display=swap",
    },
    colors: { primary: "#2a1f1a", accent: "#c9967a", background: "#fdf8f5", text: "#3d2e26", textLight: "#8a7068", border: "#ead8cc", surface: "#ffffff" },
    heroVariant: "editorial",
    animationPreset: "soft_reveal",
    stats: [
      { value: "10+", label: "Anni nel settore", dark: true },
      { value: "50+", label: "Trattamenti disponibili" },
      { value: "8", label: "Stilisti premiati" },
      { value: "100%", label: "Prodotti bio & cruelty-free", dark: true },
    ],
    aboutText: "In {name} crediamo che la bellezza sia un'arte e ogni cliente sia una tela unica. I nostri stilisti e beauty expert, formati nelle migliori accademie internazionali, utilizzano esclusivamente prodotti premium e biologici. Dal taglio sartoriale ai trattamenti viso anti-age, ogni servizio è un'esperienza sensoriale pensata per esaltare la vostra unicità.",
    ctaLabel: "Prenota il tuo trattamento",
    ctaSecondary: "Esplora i servizi",
  },
  fitness: {
    sector: "fitness",
    fonts: {
      heading: "Bebas Neue",
      body: "Barlow",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#0f0f0f", accent: "#ff3b30", background: "#f5f5f5", text: "#1a1a1a", textLight: "#6b6b6b", border: "#e0e0e0", surface: "#ffffff" },
    heroVariant: "bold",
    animationPreset: "punch_in",
    stats: [
      { value: "2000", label: "Metri quadri", dark: true },
      { value: "30+", label: "Corsi settimanali" },
      { value: "12", label: "Trainer certificati" },
      { value: "500+", label: "Membri attivi", dark: true },
    ],
    aboutText: "{name} non è solo una palestra — è una community. I nostri trainer certificati internazionali creano programmi personalizzati che combinano forza, mobilità e nutrizione. Con attrezzature Technogym di ultima generazione su 2000mq e oltre 30 corsi settimanali, qui troverai tutto ciò che serve per superare i tuoi limiti.",
    ctaLabel: "Prova gratuita",
    ctaSecondary: "Vedi i corsi",
  },
  hotel: {
    sector: "hotel",
    fonts: {
      heading: "Italiana",
      body: "Crimson Text",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Italiana&family=Crimson+Text:wght@400;600;700&display=swap",
    },
    colors: { primary: "#1a1520", accent: "#b8860b", background: "#f9f6f0", text: "#2a2530", textLight: "#6a6070", border: "#e0d8cc", surface: "#ffffff" },
    heroVariant: "cinematic",
    animationPreset: "luxury_reveal",
    stats: [
      { value: "5★", label: "Classificazione", dark: true },
      { value: "48", label: "Suite & camere" },
      { value: "4.9", label: "Rating ospiti" },
      { value: "1920", label: "Fondato nel", dark: true },
    ],
    aboutText: "{name} è una dimora storica dove il lusso incontra l'autenticità. Ogni suite è un'opera d'arte unica con arredi d'epoca, tessuti pregiati e vista mozzafiato. Il nostro ristorante stellato, la SPA con piscina infinity e il servizio di concierge 24/7 rendono ogni soggiorno un'esperienza indimenticabile nel cuore di {city}.",
    ctaLabel: "Prenota il soggiorno",
    ctaSecondary: "Le nostre suite",
  },
  legal: {
    sector: "legal",
    fonts: {
      heading: "Libre Baskerville",
      body: "Karla",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a2332", accent: "#2c5282", background: "#f7f9fc", text: "#2d3748", textLight: "#718096", border: "#e2e8f0", surface: "#ffffff" },
    heroVariant: "split",
    animationPreset: "professional_fade",
    stats: [
      { value: "25+", label: "Anni di attività", dark: true },
      { value: "3000+", label: "Casi gestiti" },
      { value: "95%", label: "Cause vinte" },
      { value: "8", label: "Avvocati specializzati", dark: true },
    ],
    aboutText: "Lo {name} è un punto di riferimento per la consulenza legale di eccellenza. I nostri avvocati, con specializzazioni in diritto civile, societario e internazionale, offrono un approccio strategico e personalizzato ad ogni caso. Riservatezza, competenza e dedizione: i valori che ci guidano dal primo colloquio alla risoluzione.",
    ctaLabel: "Richiedi consulenza",
    ctaSecondary: "Le nostre competenze",
  },
  medical: {
    sector: "medical",
    fonts: {
      heading: "Playfair Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a3a4a", accent: "#38a169", background: "#f0faf5", text: "#2d4a3e", textLight: "#68907e", border: "#c6e8d8", surface: "#ffffff" },
    heroVariant: "centered",
    animationPreset: "gentle_rise",
    stats: [
      { value: "30+", label: "Specialisti", dark: true },
      { value: "50k+", label: "Pazienti trattati" },
      { value: "15", label: "Reparti attivi" },
      { value: "24/7", label: "Assistenza continua", dark: true },
    ],
    aboutText: "Il {name} è un centro medico polispecialistico dove innovazione e umanità si incontrano. Dotato di apparecchiature diagnostiche di ultima generazione — risonanza magnetica 3T, ecografo 4D, laboratorio analisi in sede — il nostro team di oltre 30 specialisti garantisce diagnosi precise e percorsi terapeutici personalizzati.",
    ctaLabel: "Prenota una visita",
    ctaSecondary: "Le nostre specialità",
  },
  professional: {
    sector: "professional",
    fonts: {
      heading: "Syne",
      body: "Inter",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a1a2e", accent: "#6366f1", background: "#f8f9fc", text: "#2d2d44", textLight: "#6b6b85", border: "#e2e4ea", surface: "#ffffff" },
    heroVariant: "split",
    animationPreset: "clean_slide",
    stats: [
      { value: "200+", label: "Progetti completati", dark: true },
      { value: "50+", label: "Clienti attivi" },
      { value: "12", label: "Esperti nel team" },
      { value: "98%", label: "Clienti soddisfatti", dark: true },
    ],
    aboutText: "{name} è il partner strategico per aziende che vogliono crescere. Dal business development alla trasformazione digitale, il nostro team di consulenti senior combina analisi dati, design thinking e metodologie agili per trasformare le sfide in opportunità concrete e misurabili.",
    ctaLabel: "Richiedi un preventivo",
    ctaSecondary: "I nostri servizi",
  },
  ecommerce: {
    sector: "ecommerce",
    fonts: {
      heading: "Space Grotesk",
      body: "Inter",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a1a1a", accent: "#f59e0b", background: "#fffbeb", text: "#292524", textLight: "#78716c", border: "#e7e5e4", surface: "#ffffff" },
    heroVariant: "bold",
    animationPreset: "snap_in",
    stats: [
      { value: "10k+", label: "Prodotti disponibili", dark: true },
      { value: "24h", label: "Spedizione express" },
      { value: "4.7", label: "Rating clienti" },
      { value: "30gg", label: "Reso gratuito", dark: true },
    ],
    aboutText: "{name} ridefinisce lo shopping online con un'esperienza curata nei minimi dettagli. Dalla selezione dei prodotti al packaging sostenibile, dalla spedizione express al servizio clienti dedicato — ogni acquisto è pensato per superare le aspettative. Qualità, convenienza e stile: tutto in un click.",
    ctaLabel: "Esplora lo shop",
    ctaSecondary: "Offerte del momento",
  },
  realestate: {
    sector: "realestate",
    fonts: {
      heading: "DM Serif Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a2e35", accent: "#14b8a6", background: "#f0fdfa", text: "#2d4a50", textLight: "#5f8a8e", border: "#ccece6", surface: "#ffffff" },
    heroVariant: "editorial",
    animationPreset: "panoramic_reveal",
    stats: [
      { value: "500+", label: "Immobili venduti", dark: true },
      { value: "€2M+", label: "Valore medio gestito" },
      { value: "18", label: "Agenti sul territorio" },
      { value: "15gg", label: "Tempo medio vendita", dark: true },
    ],
    aboutText: "{name} è leader nel mercato immobiliare di {city} e dintorni. Il nostro team di agenti certificati offre una consulenza completa — dalla valutazione alla vendita, dalla ricerca dell'immobile ideale alla gestione burocratica. Con un portfolio esclusivo e una rete di contatti consolidata, trasformiamo il vostro progetto immobiliare in realtà.",
    ctaLabel: "Cerca il tuo immobile",
    ctaSecondary: "Valutazione gratuita",
  },
};

export function getTemplateConfig(sector: string): TemplateConfig {
  return TEMPLATE_CONFIGS[sector.toLowerCase()] ?? TEMPLATE_CONFIGS["professional"]!;
}
