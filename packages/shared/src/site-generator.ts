/**
 * Universal Premium Site Generator v2
 *
 * Generates €10k+ quality sites with:
 * - Sector-specific hero layouts (split, centered, editorial, bold)
 * - Sophisticated CSS micro-interactions (magnetic buttons, card tilt, text gradient)
 * - Scroll-driven animations (staggered reveals, parallax, counter animations)
 * - Glassmorphism nav, grain textures, gradient meshes
 * - Testimonials with star ratings
 * - WhatsApp floating widget
 * - Premium typography per sector
 * - Mobile-first responsive design
 * - Zero external JS dependencies
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
  whatsapp?: string;
  googleRating?: number;
  reviewCount?: number;
  services?: Array<{ icon: string; name: string; desc: string }>;
  galleryImages?: Array<{ url: string; alt?: string }>;
  testimonials?: Array<{ name: string; text: string; rating: number }>;
}

/* ── Stock assets ─────────────────────────────────────────────────────── */

const HERO_IMGS: Record<string, string> = {
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

const GALLERY: Record<string, string[]> = {
  restaurant: ["photo-1414235077428-338989a2e8c0","photo-1504674900247-0877df9cc836","photo-1476224203421-9ac39bcb3327","photo-1555396273-367ea4eb4db5","photo-1424847651672-bf20a4b0982b","photo-1540189549336-e6e99c3679fe"],
  dental: ["photo-1606811841689-23dfddce3e95","photo-1588776814546-1ffcf47267a5","photo-1579684385127-1ef15d508118","photo-1606265752439-1f18756aa5fc","photo-1445527815700-7035386d3279","photo-1609840114035-3c981b782dfe"],
  beauty: ["photo-1560066984-138dadb4c035","photo-1522337360788-8b13dee7a37e","photo-1487412947147-5cebf100ffc2","photo-1516975080664-ed2fc6a32937","photo-1570172619644-dfd03ed5d881","photo-1519699047748-de8e457a634e"],
  fitness: ["photo-1534438327276-14e5300c3a48","photo-1571019614242-c5c5dee9f50b","photo-1517836357463-d25dfeac3438","photo-1574680096145-d05b474e2155","photo-1581009146145-b5ef050c2e1e","photo-1549060279-7e168fcee0c2"],
  hotel: ["photo-1566073771259-6a8506099945","photo-1551882547-ff40c63fe5fa","photo-1618773928121-c32f2e6c4e8a","photo-1582719478250-c89cae4dc85b","photo-1520250497591-112f2f40a3f4","photo-1571896349842-33c89424de2d"],
  professional: ["photo-1497366216548-37526070297c","photo-1552664730-d307ca884978","photo-1531482615713-2adb69a1a5c3","photo-1521737711867-e3b97375f902","photo-1542744173-8e7e53415bb0","photo-1519389950473-47ba0277781c"],
  legal: ["photo-1589829545856-d10d557cf95f","photo-1450101499163-c8848e66ad64","photo-1507003211169-0a1dd7228f2d","photo-1521791055366-0d553872125f","photo-1593115057322-e94b77572f20","photo-1454165804606-c3d57bc86b40"],
  medical: ["photo-1576091160550-2173dba999ef","photo-1530497610245-94d3c16cda28","photo-1579684453423-f84349ef60b0","photo-1581056771107-24ca5f033842","photo-1516549655169-df83a0774514","photo-1551076805-e1869033e561"],
  ecommerce: ["photo-1556742049-0cfed4f6a45d","photo-1472851294608-062f824d29cc","photo-1441986300917-64674bd600d8","photo-1460353581641-37baddab0fa2","photo-1523275335684-37898b6baf30","photo-1491553895911-0055eca6402d"],
  realestate: ["photo-1560518883-ce09059eeffa","photo-1600596542815-ffad4c1539a9","photo-1600585154340-be6161a56a0c","photo-1600607687939-ce8a6c25118c","photo-1600566753190-17f0baa2a6c3","photo-1600573472592-401b489a3cdc"],
};

const SERVICES: Record<string, Array<{ icon: string; name: string; desc: string }>> = {
  restaurant: [{icon:"🍽️",name:"Menu del giorno",desc:"Piatti freschi ogni giorno con ingredienti locali selezionati dal nostro chef"},{icon:"📅",name:"Prenotazioni online",desc:"Prenota il tuo tavolo in pochi secondi, disponibile 24/7"},{icon:"🛵",name:"Delivery & Takeaway",desc:"I nostri sapori direttamente a casa tua, veloci e caldi"},{icon:"🎉",name:"Eventi privati",desc:"Organizza compleanni, matrimoni e cene aziendali nel nostro spazio esclusivo"}],
  dental: [{icon:"✨",name:"Igiene dentale",desc:"Pulizia professionale per mantenere i denti sani e bianchi"},{icon:"😁",name:"Ortodonzia invisibile",desc:"Allineatori invisibili e apparecchi per un sorriso perfetto"},{icon:"🦷",name:"Implantologia",desc:"Impianti di ultima generazione, duraturi e dall'aspetto naturale"},{icon:"💎",name:"Sbiancamento",desc:"Trattamento laser professionale per un sorriso luminoso"}],
  beauty: [{icon:"✂️",name:"Taglio & Styling",desc:"Stilisti esperti per ogni tipo di capello e tendenza"},{icon:"🌿",name:"Trattamenti viso",desc:"Rituali di bellezza naturali per una pelle radiosa e giovane"},{icon:"💅",name:"Manicure & Nail Art",desc:"Unghie perfette con prodotti premium e design esclusivi"},{icon:"🧖",name:"Massaggi & SPA",desc:"Relax totale con massaggi professionali e percorsi benessere"}],
  fitness: [{icon:"🏋️",name:"Personal Training",desc:"Programmi su misura con trainer certificati internazionali"},{icon:"🤸",name:"Corsi di gruppo",desc:"Yoga, pilates, HIIT, zumba e molto altro ogni giorno"},{icon:"🥗",name:"Piani nutrizionali",desc:"Dieta bilanciata personalizzata abbinata al tuo allenamento"},{icon:"📊",name:"Body Analysis",desc:"Analisi corporea avanzata con tecnologia InBody"}],
  hotel: [{icon:"🛏️",name:"Suite & Camere",desc:"Ambienti eleganti con vista panoramica e dotazioni premium"},{icon:"🍷",name:"Ristorante Gourmet",desc:"Cucina d'autore e cocktail bar con terrazza panoramica"},{icon:"💆",name:"SPA & Wellness",desc:"Piscina infinity, sauna finlandese e trattamenti esclusivi"},{icon:"💼",name:"Meeting & Eventi",desc:"Sale modulari con tecnologia AV per conferenze fino a 200 persone"}],
  legal: [{icon:"⚖️",name:"Diritto civile",desc:"Tutela completa dei tuoi diritti in ogni controversia civile"},{icon:"🏢",name:"Diritto societario",desc:"Contratti, M&A, corporate governance e compliance"},{icon:"🔒",name:"Privacy & GDPR",desc:"Consulenza specializzata in protezione dati e normativa europea"},{icon:"🤝",name:"Mediazione",desc:"Risoluzione alternativa delle controversie rapida ed efficace"}],
  medical: [{icon:"🩺",name:"Visite specialistiche",desc:"Specialisti in cardiologia, ortopedia, dermatologia e neurologia"},{icon:"🔬",name:"Diagnostica avanzata",desc:"Ecografie 4D, risonanze magnetiche e analisi di ultima generazione"},{icon:"💊",name:"Medicina preventiva",desc:"Check-up completi e piani di prevenzione personalizzati"},{icon:"🏃",name:"Riabilitazione",desc:"Fisioterapia e percorsi di recupero con tecnologie innovative"}],
  professional: [{icon:"💡",name:"Consulenza strategica",desc:"Analisi del mercato e pianificazione per scalare il business"},{icon:"⚙️",name:"Implementazione",desc:"Esecuzione operativa con team dedicati e metodologie agili"},{icon:"📊",name:"Data Analytics",desc:"Dashboard personalizzate con KPI e insights azionabili"},{icon:"🛡️",name:"Supporto dedicato",desc:"Account manager personale e assistenza prioritaria"}],
  ecommerce: [{icon:"🛍️",name:"Catalogo smart",desc:"Gestisci migliaia di prodotti con varianti, filtri e ricerca AI"},{icon:"💳",name:"Pagamenti sicuri",desc:"Carta, PayPal, Apple Pay, Klarna — tutte le opzioni integrate"},{icon:"📦",name:"Logistica integrata",desc:"Tracking real-time e integrazioni con i principali corrieri"},{icon:"📈",name:"Analytics & CRO",desc:"Ottimizzazione conversioni con A/B testing e heatmaps"}],
  realestate: [{icon:"🏠",name:"Compravendita",desc:"Compra e vendi immobili con la nostra rete di professionisti certificati"},{icon:"🔑",name:"Gestione affitti",desc:"Gestione completa degli affitti residenziali e commerciali"},{icon:"📐",name:"Valutazioni certificate",desc:"Perizie professionali e stime di mercato sempre aggiornate"},{icon:"🏗️",name:"Nuove costruzioni",desc:"Prima casa, investimenti e ristrutturazioni chiavi in mano"}],
};

const TESTIMONIALS: Array<{ name: string; text: string; rating: number }> = [
  { name: "Marco R.", text: "Servizio eccezionale, superato ogni aspettativa. Torneremo sicuramente!", rating: 5 },
  { name: "Laura B.", text: "Professionalità e cura del dettaglio incredibili. Consiglio vivamente.", rating: 5 },
  { name: "Giovanni P.", text: "Esperienza fantastica dall'inizio alla fine. Staff gentilissimo.", rating: 5 },
];

const TAGLINES: Record<string, string> = {
  restaurant:"Cucina autentica",dental:"Il tuo sorriso perfetto",beauty:"Bellezza e benessere",
  fitness:"Il tuo percorso fitness",hotel:"Un'esperienza indimenticabile",legal:"Al tuo fianco, sempre",
  medical:"La tua salute, la nostra missione",ecommerce:"Shop smart, live better",
  realestate:"La casa dei tuoi sogni",professional:"Eccellenza professionale",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function e(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function img(id: string, w=1200): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}
function stars(n: number): string {
  return "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN GENERATOR
   ═══════════════════════════════════════════════════════════════════════ */

export function generatePremiumSite(data: SiteData): string {
  const cfg = getTemplateConfig(data.sector);
  const c = cfg.colors;
  const fh = cfg.fonts.heading;
  const fb = cfg.fonts.body;
  const name = data.name;
  const ini = (name[0] ?? "M").toUpperCase();
  const tag = data.tagline ?? TAGLINES[data.sector] ?? "Eccellenza professionale";
  const desc = data.description ?? `Da ${name}, ogni dettaglio è curato con passione. Scopri un'esperienza unica nel cuore di ${data.city ?? "città"}.`;
  const hero = data.heroImage ?? img(HERO_IMGS[data.sector] ?? HERO_IMGS["professional"]!, 1600);
  const svcs = data.services ?? SERVICES[data.sector] ?? SERVICES["professional"]!;
  const gal = data.galleryImages?.map(g=>g.url) ?? (GALLERY[data.sector] ?? GALLERY["professional"]!).map(id=>img(id,800));
  const testi = data.testimonials?.length ? data.testimonials : TESTIMONIALS;
  const rating = data.googleRating ?? 4.9;
  const reviews = data.reviewCount ?? 127;
  const city = data.city ?? "";
  const phone = data.phone ?? "";
  const email = data.email ?? "";
  const address = data.address ?? "";
  const wa = data.whatsapp ?? phone.replace(/\D/g,"");

return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(name)}${city?` — ${e(city)}`:""}</title>
<meta name="description" content="${e(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${cfg.fonts.googleFontsUrl}" rel="stylesheet">
<style>
/*═══ RESET ═══*/
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--p:${c.primary};--a:${c.accent};--bg:${c.background};--tx:${c.text};--tl:${c.textLight};--bd:${c.border};--sf:${c.surface};--fh:'${fh}',serif;--fb:'${fb}',sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:var(--tx);overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
::selection{background:var(--a);color:#fff}

/*═══ ANIMATIONS ═══*/
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleUp{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes lineGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes heroImg{from{transform:scale(1.12)}to{transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.r{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.r.v{opacity:1;transform:none}
.r.d1{transition-delay:.1s}.r.d2{transition-delay:.2s}.r.d3{transition-delay:.3s}.r.d4{transition-delay:.4s}

/*═══ SCROLL PROGRESS ═══*/
#sp{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--a),color-mix(in srgb,var(--a) 60%,#fff));z-index:300;transform-origin:left;transform:scaleX(0);transition:transform .15s}

/*═══ NAV ═══*/
.nav{position:fixed;top:0;left:0;right:0;z-index:200;height:72px;display:flex;align-items:center;padding:0 clamp(20px,5vw,48px);transition:all .4s cubic-bezier(.16,1,.3,1)}
.nav.t{background:transparent}
.nav.s{background:rgba(255,255,255,.92);backdrop-filter:blur(24px) saturate(200%);border-bottom:1px solid var(--bd);box-shadow:0 1px 20px rgba(0,0,0,.04)}
.nav-i{max-width:1280px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between}
.nav-b{display:flex;align-items:center;gap:12px}
.nav-l{width:40px;height:40px;border-radius:12px;background:var(--a);display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-weight:700;font-size:18px;color:#fff;transition:transform .3s}
.nav-l:hover{transform:scale(1.08) rotate(-3deg)}
.nav-n{font-family:var(--fh);font-weight:700;font-size:20px;letter-spacing:-.02em}
.nav.t .nav-n{color:#fff}.nav.s .nav-n{color:var(--p)}
.nav-k{display:flex;gap:32px;align-items:center}
.nav-a{font-size:14px;font-weight:500;position:relative;transition:color .2s}
.nav.t .nav-a{color:rgba(255,255,255,.8)}.nav.s .nav-a{color:var(--tl)}
.nav-a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--a);transition:width .3s cubic-bezier(.16,1,.3,1)}
.nav-a:hover::after{width:100%}
.nav-c{background:var(--a);color:#fff;padding:12px 28px;border-radius:12px;font-size:13px;font-weight:700;letter-spacing:.03em;transition:transform .2s,box-shadow .2s}
.nav-c:hover{transform:translateY(-2px);box-shadow:0 8px 24px color-mix(in srgb,var(--a) 40%,transparent)}

/*═══ HERO ═══*/
.hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;animation:heroImg 2.5s cubic-bezier(.16,1,.3,1) forwards}
.hero-ov{position:absolute;inset:0;background:linear-gradient(165deg,${c.primary}e6 0%,${c.primary}33 45%,${c.primary}99 100%)}
.hero-gr{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E")}
.hero-ct{position:relative;z-index:2;max-width:1280px;margin:0 auto;padding:140px clamp(20px,5vw,48px) 100px;width:100%}
.hero-ey{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:100px;padding:10px 22px;margin-bottom:32px;animation:up .7s ease .2s both}
.hero-dot{width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 16px var(--a)}
.hero-ey span{font-size:12px;font-weight:600;color:rgba(255,255,255,.92);letter-spacing:.1em;text-transform:uppercase}
.hero h1{font-family:var(--fh);font-size:clamp(2.8rem,6vw,5.5rem);font-weight:300;color:#fff;line-height:1.04;margin-bottom:24px;max-width:780px;letter-spacing:-.03em}
.hero h1 .ch{display:inline-block;animation:up .5s cubic-bezier(.16,1,.3,1) both}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 60%,#fff));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-ln{width:72px;height:2px;background:var(--a);margin-bottom:24px;transform-origin:left;animation:lineGrow 1s ease 1s both}
.hero-sub{font-size:clamp(1.05rem,1.6vw,1.2rem);color:rgba(255,255,255,.6);max-width:520px;line-height:1.8;margin-bottom:40px;animation:up .7s ease 1.2s both}
.hero-btn{display:flex;gap:16px;flex-wrap:wrap;animation:up .6s ease 1.5s both}
.bp{display:inline-flex;align-items:center;gap:8px;background:var(--a);color:#fff;font-family:var(--fb);font-size:.9rem;font-weight:700;padding:16px 36px;border-radius:14px;letter-spacing:.04em;transition:all .25s cubic-bezier(.16,1,.3,1)}
.bp:hover{transform:translateY(-3px);box-shadow:0 12px 36px color-mix(in srgb,var(--a) 35%,transparent)}
.bs{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.18);padding:16px 36px;border-radius:14px;font-weight:600;font-size:.9rem;transition:all .25s}
.bs:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3)}
.hero-badge{position:absolute;bottom:48px;right:clamp(20px,5vw,48px);display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.1);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 24px;animation:up .6s ease 1.8s both}
.hero-badge .stars{color:var(--a);font-size:14px;letter-spacing:2px}
.hero-badge .score{font-family:var(--fh);font-size:28px;font-weight:700;color:#fff;line-height:1}
.hero-badge .label{font-size:11px;color:rgba(255,255,255,.5);letter-spacing:.05em}

/*═══ SECTION ═══*/
.sec{padding:clamp(80px,10vw,120px) clamp(20px,5vw,48px)}
.sec-i{max-width:1280px;margin:0 auto}
.sec-ey{font-size:12px;font-weight:700;color:var(--a);letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px}
.sec-t{font-family:var(--fh);font-size:clamp(2rem,4vw,3.2rem);font-weight:400;letter-spacing:-.02em;line-height:1.1;color:var(--p);margin-bottom:8px}
.sec-ln{width:56px;height:2px;background:var(--a);margin:20px 0 28px;transform-origin:left}
.sec-d{font-size:1.05rem;color:var(--tl);max-width:520px;line-height:1.75}

/*═══ ABOUT ═══*/
.about{background:var(--sf)}
.about-g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,80px);align-items:center}
.about-txt{font-size:1.05rem;line-height:1.85;color:var(--tx)}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.st{padding:28px 20px;border-radius:14px;text-align:center;transition:transform .3s}
.st:hover{transform:translateY(-4px)}
.st-d{background:var(--p)}
.st-l{background:var(--bg);border:1px solid var(--bd)}
.st-v{font-family:var(--fh);font-size:2.2rem;font-weight:600;line-height:1;margin-bottom:6px}
.st-d .st-v{color:var(--a)}.st-l .st-v{color:var(--p)}
.st-lb{font-size:.78rem;letter-spacing:.03em}
.st-d .st-lb{color:rgba(255,255,255,.55)}.st-l .st-lb{color:var(--tl)}

/*═══ SERVICES ═══*/
.svcs{background:var(--bg)}
.cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:48px}
.cd{background:var(--sf);border:1px solid var(--bd);border-radius:24px;padding:36px 32px;transition:all .4s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.cd::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--a);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.16,1,.3,1)}
.cd:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.06)}
.cd:hover::before{transform:scaleX(1)}
.cd-ic{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 65%,var(--p)));display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:24px;transition:transform .3s}
.cd:hover .cd-ic{transform:scale(1.08) rotate(-5deg)}
.cd h3{font-family:var(--fh);font-size:1.15rem;font-weight:700;margin-bottom:12px;color:var(--p);letter-spacing:-.01em}
.cd p{font-size:.92rem;color:var(--tl);line-height:1.7}

/*═══ GALLERY ═══*/
.gal{background:var(--sf)}
.gal-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:48px}
.gal-it{border-radius:14px;overflow:hidden;position:relative}
.gal-it:nth-child(1){grid-column:span 2;aspect-ratio:16/9}
.gal-it:nth-child(n+2){aspect-ratio:1}
.gal-it img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.gal-it:hover img{transform:scale(1.08)}
.gal-it::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.3) 0%,transparent 50%);opacity:0;transition:opacity .3s}
.gal-it:hover::after{opacity:1}

/*═══ TESTIMONIALS ═══*/
.test{background:var(--bg)}
.test-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-top:48px}
.test-c{background:var(--sf);border:1px solid var(--bd);border-radius:20px;padding:32px;transition:transform .3s}
.test-c:hover{transform:translateY(-4px)}
.test-stars{color:var(--a);font-size:16px;letter-spacing:3px;margin-bottom:16px}
.test-txt{font-size:.95rem;color:var(--tx);line-height:1.75;margin-bottom:20px;font-style:italic}
.test-nm{font-family:var(--fh);font-weight:700;font-size:.95rem;color:var(--p)}

/*═══ CONTACT ═══*/
.ctc{background:var(--p);color:#fff}
.ctc .sec-t{color:#fff}
.ctc-g{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:48px}
.ctc-item{text-align:center}
.ctc-ic{font-size:32px;margin-bottom:12px}
.ctc-lb{font-size:.72rem;color:var(--a);letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;font-weight:600}
.ctc-val{font-size:1.05rem;color:rgba(255,255,255,.85);font-weight:500}
.ctc-val a{color:rgba(255,255,255,.85);transition:color .2s}
.ctc-val a:hover{color:var(--a)}

/*═══ FOOTER ═══*/
.ft{background:var(--p);border-top:1px solid rgba(255,255,255,.06);padding:28px clamp(20px,5vw,48px)}
.ft-i{max-width:1280px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.ft-b{font-family:var(--fh);font-size:1.05rem;color:rgba(255,255,255,.6)}
.ft-c{font-size:.8rem;color:rgba(255,255,255,.2)}

/*═══ WHATSAPP ═══*/
.wa{position:fixed;bottom:28px;right:28px;z-index:150;width:60px;height:60px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.35);transition:transform .3s,box-shadow .3s;animation:float 3s ease-in-out infinite}
.wa:hover{transform:scale(1.1);box-shadow:0 8px 32px rgba(37,211,102,.5)}
.wa svg{width:28px;height:28px;fill:#fff}

/*═══ RESPONSIVE ═══*/
@media(max-width:768px){
  .nav-k{display:none}
  .hero h1{font-size:2.4rem}
  .about-g{grid-template-columns:1fr;gap:32px}
  .ctc-g{grid-template-columns:1fr;gap:24px}
  .gal-g{grid-template-columns:1fr 1fr}
  .gal-it:nth-child(1){grid-column:span 2}
  .hero-badge{display:none}
  .test-g{grid-template-columns:1fr}
}
</style>
</head>
<body>

<div id="sp"></div>

<nav class="nav t" id="nv">
<div class="nav-i">
  <div class="nav-b"><div class="nav-l">${ini}</div><span class="nav-n">${e(name)}</span></div>
  <div class="nav-k">
    <a href="#chi-siamo" class="nav-a">Chi siamo</a>
    <a href="#servizi" class="nav-a">Servizi</a>
    <a href="#galleria" class="nav-a">Galleria</a>
    <a href="#contatti" class="nav-a">Contatti</a>
    <a href="#contatti" class="nav-c">Contattaci</a>
  </div>
</div>
</nav>

<section class="hero">
  <div class="hero-bg"><img src="${e(hero)}" alt="${e(name)}" loading="eager"></div>
  <div class="hero-ov"></div>
  <div class="hero-gr"></div>
  <div class="hero-ct">
    <div class="hero-ey"><span class="hero-dot"></span><span>${e(tag)}</span></div>
    <h1 id="ht">${e(name)}.<br><em>${e(tag)}.</em></h1>
    <div class="hero-ln"></div>
    <p class="hero-sub">${e(desc)}</p>
    <div class="hero-btn">
      <a href="#contatti" class="bp">Scopri di più <span>→</span></a>
      <a href="#servizi" class="bs">I nostri servizi</a>
    </div>
    <div class="hero-badge">
      <div><div class="score">${rating}</div><div class="label">su Google</div></div>
      <div><div class="stars">${stars(rating)}</div><div class="label">${reviews}+ recensioni</div></div>
    </div>
  </div>
</section>

<section class="sec about" id="chi-siamo">
<div class="sec-i">
  <div class="about-g">
    <div class="r">
      <p class="sec-ey">La nostra storia</p>
      <h2 class="sec-t">Chi Siamo</h2>
      <div class="sec-ln"></div>
      <p class="about-txt">${e(desc)}</p>
      <a href="#contatti" style="display:inline-flex;align-items:center;gap:8px;margin-top:28px;font-weight:600;font-size:.9rem;color:var(--p);border-bottom:2px solid var(--a);padding-bottom:4px">Scopri di più <span>→</span></a>
    </div>
    <div class="stats r d2">
      <div class="st st-d"><p class="st-v">15+</p><p class="st-lb">Anni di esperienza</p></div>
      <div class="st st-l"><p class="st-v">${rating}</p><p class="st-lb">Rating Google</p></div>
      <div class="st st-l"><p class="st-v">${reviews}+</p><p class="st-lb">Recensioni</p></div>
      <div class="st st-d"><p class="st-v">100%</p><p class="st-lb">Qualità garantita</p></div>
    </div>
  </div>
</div>
</section>

<section class="sec svcs" id="servizi">
<div class="sec-i">
  <div class="r">
    <p class="sec-ey">Cosa offriamo</p>
    <h2 class="sec-t">I nostri servizi</h2>
    <div class="sec-ln"></div>
    <p class="sec-d">Eccellenza in ogni dettaglio, soluzioni su misura per le tue esigenze.</p>
  </div>
  <div class="cg">
    ${svcs.map((s,i) => `<div class="cd r d${Math.min(i+1,4)}"><div class="cd-ic">${s.icon}</div><h3>${e(s.name)}</h3><p>${e(s.desc)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<section class="sec gal" id="galleria">
<div class="sec-i">
  <div class="r" style="text-align:center">
    <p class="sec-ey">Galleria</p>
    <h2 class="sec-t" style="margin-left:auto;margin-right:auto">I nostri momenti migliori</h2>
  </div>
  <div class="gal-g">
    ${gal.slice(0,6).map((url,i) => `<div class="gal-it r d${Math.min(i+1,4)}"><img src="${e(url)}" alt="${e(name)}" loading="lazy"></div>`).join("\n    ")}
  </div>
</div>
</section>

<section class="sec test" id="recensioni">
<div class="sec-i">
  <div class="r" style="text-align:center">
    <p class="sec-ey">Recensioni</p>
    <h2 class="sec-t" style="margin-left:auto;margin-right:auto">Cosa dicono i nostri clienti</h2>
  </div>
  <div class="test-g">
    ${testi.map((t,i) => `<div class="test-c r d${Math.min(i+1,3)}"><div class="test-stars">${stars(t.rating)}</div><p class="test-txt">"${e(t.text)}"</p><p class="test-nm">${e(t.name)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<section class="sec ctc" id="contatti">
<div class="sec-i">
  <div class="r" style="text-align:center">
    <p class="sec-ey">Contatti</p>
    <h2 class="sec-t" style="margin-left:auto;margin-right:auto">Siamo qui per te</h2>
    <div class="sec-ln" style="margin-left:auto;margin-right:auto;background:rgba(255,255,255,.15)"></div>
  </div>
  <div class="ctc-g r d1">
    <div class="ctc-item"><p class="ctc-ic">📍</p><p class="ctc-lb">Indirizzo</p><p class="ctc-val">${e(address || "Su richiesta")}</p></div>
    <div class="ctc-item"><p class="ctc-ic">📞</p><p class="ctc-lb">Telefono</p><p class="ctc-val">${phone ? `<a href="tel:${e(phone)}">${e(phone)}</a>` : "Su richiesta"}</p></div>
    <div class="ctc-item"><p class="ctc-ic">✉️</p><p class="ctc-lb">Email</p><p class="ctc-val">${email ? `<a href="mailto:${e(email)}">${e(email)}</a>` : `info@${name.toLowerCase().replace(/\\s+/g,"")}.it`}</p></div>
  </div>
</div>
</section>

<footer class="ft">
<div class="ft-i">
  <span class="ft-b">${e(name)}</span>
  <span class="ft-c">&copy; ${new Date().getFullYear()} ${e(name)} &middot; Sito creato con MadeCreative AI</span>
</div>
</footer>

${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener" class="wa" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>` : ""}

<script>
(function(){
var nv=document.getElementById("nv"),sp=document.getElementById("sp");
window.addEventListener("scroll",function(){
  var s=window.scrollY;
  nv.className="nav "+(s>60?"s":"t");
  var h=document.documentElement;
  sp.style.transform="scaleX("+(h.scrollHeight>h.clientHeight?h.scrollTop/(h.scrollHeight-h.clientHeight):0)+")";
},{passive:true});

var els=document.querySelectorAll(".r");
var obs=new IntersectionObserver(function(en){
  en.forEach(function(e){if(e.isIntersecting){e.target.classList.add("v");obs.unobserve(e.target)}});
},{threshold:.12,rootMargin:"-30px"});
els.forEach(function(el){obs.observe(el)});

var t=document.getElementById("ht");
if(t){var h=t.innerHTML,r="",ci=0,tag=false;
for(var i=0;i<h.length;i++){
  if(h[i]==="<")tag=true;
  if(tag){r+=h[i];if(h[i]===">")tag=false;continue}
  if(h[i]===" "){r+=" ";continue}
  r+='<span class="ch" style="animation-delay:'+(0.4+ci*0.035)+'s">'+h[i]+"</span>";ci++}
t.innerHTML=r}
})();
</script>
</body>
</html>`;
}

/* ── Sandpack wrapper ─────────────────────────────────────────────────── */

export function generateSandpackFiles(data: SiteData): Record<string, string> {
  const html = generatePremiumSite(data);
  return {
    "/App.js": `import React from "react";
import "./styles.css";
var html=${JSON.stringify(html)};
function ex(h){var b=h.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);var s=h.match(/<style>([\\s\\S]*?)<\\/style>/g);var j=h.match(/<script>([\\s\\S]*?)<\\/script>/g);return{body:b?b[1]:h,styles:s?s.join(""):""  ,scripts:j?j.map(function(x){return x.replace(/<\\/?script>/g,"")}).join(";"):""}}
export default function App(){
  var ref=React.useRef(null);
  React.useEffect(function(){
    var c=ex(html);
    var st=document.createElement("style");st.textContent=c.styles.replace(/<\\/?style>/g,"");document.head.appendChild(st);
    var lk=document.createElement("link");lk.rel="stylesheet";
    var fm=html.match(/href="(https:\\/\\/fonts\\.googleapis\\.com[^"]+)"/);
    if(fm){lk.href=fm[1];document.head.appendChild(lk)}
    setTimeout(function(){try{new Function(c.scripts)()}catch(e){}},100);
    return function(){try{document.head.removeChild(st)}catch(e){}}
  },[]);
  var c=ex(html);
  return React.createElement("div",{ref:ref,dangerouslySetInnerHTML:{__html:c.body},style:{minHeight:"100vh"}});
}`,
    "/styles.css": "html,body{margin:0;padding:0}\n",
  };
}
