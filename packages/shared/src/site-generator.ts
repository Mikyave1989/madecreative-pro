/**
 * Universal Premium Site Generator v4 — Multi-Page
 *
 * Generates €10k+ quality multi-page sites:
 *   index.html     — Hero + about preview + services preview + testimonials + CTA
 *   chi-siamo.html — Full about + stats + story + milestones
 *   servizi.html   — Full services grid with expanded cards
 *   galleria.html  — Masonry gallery with CSS lightbox
 *   contatti.html  — Form + info + map + opening hours
 *
 * Features:
 * - 5 hero layout variants per sector
 * - Mobile hamburger menu with slide drawer
 * - Page transition feel via consistent nav highlighting
 * - Sector-specific stats, about text, CTA labels
 * - Contact form, Google Maps embed
 * - Schema.org LocalBusiness JSON-LD, Open Graph
 * - Scroll animations, micro-interactions
 * - WhatsApp floating widget
 * - Zero external JS dependencies
 */

import { getTemplateConfig, type TemplateConfig, type SectorStat } from "./templates.js";

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
  openingHours?: string;
  logoUrl?: string;
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
  restaurant: [{icon:"\ud83c\udf7d\ufe0f",name:"Menu del giorno",desc:"Piatti freschi ogni giorno con ingredienti locali selezionati dal nostro chef"},{icon:"\ud83d\udcc5",name:"Prenotazioni online",desc:"Prenota il tuo tavolo in pochi secondi, disponibile 24/7"},{icon:"\ud83d\udef5",name:"Delivery & Takeaway",desc:"I nostri sapori direttamente a casa tua, veloci e caldi"},{icon:"\ud83c\udf89",name:"Eventi privati",desc:"Organizza compleanni, matrimoni e cene aziendali nel nostro spazio esclusivo"}],
  dental: [{icon:"\u2728",name:"Igiene dentale",desc:"Pulizia professionale per mantenere i denti sani e bianchi"},{icon:"\ud83d\ude01",name:"Ortodonzia invisibile",desc:"Allineatori invisibili e apparecchi per un sorriso perfetto"},{icon:"\ud83e\uddb7",name:"Implantologia",desc:"Impianti di ultima generazione, duraturi e dall'aspetto naturale"},{icon:"\ud83d\udc8e",name:"Sbiancamento",desc:"Trattamento laser professionale per un sorriso luminoso"}],
  beauty: [{icon:"\u2702\ufe0f",name:"Taglio & Styling",desc:"Stilisti esperti per ogni tipo di capello e tendenza"},{icon:"\ud83c\udf3f",name:"Trattamenti viso",desc:"Rituali di bellezza naturali per una pelle radiosa e giovane"},{icon:"\ud83d\udc85",name:"Manicure & Nail Art",desc:"Unghie perfette con prodotti premium e design esclusivi"},{icon:"\ud83e\uddd6",name:"Massaggi & SPA",desc:"Relax totale con massaggi professionali e percorsi benessere"}],
  fitness: [{icon:"\ud83c\udfcb\ufe0f",name:"Personal Training",desc:"Programmi su misura con trainer certificati internazionali"},{icon:"\ud83e\udd38",name:"Corsi di gruppo",desc:"Yoga, pilates, HIIT, zumba e molto altro ogni giorno"},{icon:"\ud83e\udd57",name:"Piani nutrizionali",desc:"Dieta bilanciata personalizzata abbinata al tuo allenamento"},{icon:"\ud83d\udcca",name:"Body Analysis",desc:"Analisi corporea avanzata con tecnologia InBody"}],
  hotel: [{icon:"\ud83d\udecf\ufe0f",name:"Suite & Camere",desc:"Ambienti eleganti con vista panoramica e dotazioni premium"},{icon:"\ud83c\udf77",name:"Ristorante Gourmet",desc:"Cucina d'autore e cocktail bar con terrazza panoramica"},{icon:"\ud83d\udc86",name:"SPA & Wellness",desc:"Piscina infinity, sauna finlandese e trattamenti esclusivi"},{icon:"\ud83d\udcbc",name:"Meeting & Eventi",desc:"Sale modulari con tecnologia AV per conferenze fino a 200 persone"}],
  legal: [{icon:"\u2696\ufe0f",name:"Diritto civile",desc:"Tutela completa dei tuoi diritti in ogni controversia civile"},{icon:"\ud83c\udfe2",name:"Diritto societario",desc:"Contratti, M&A, corporate governance e compliance"},{icon:"\ud83d\udd12",name:"Privacy & GDPR",desc:"Consulenza specializzata in protezione dati e normativa europea"},{icon:"\ud83e\udd1d",name:"Mediazione",desc:"Risoluzione alternativa delle controversie rapida ed efficace"}],
  medical: [{icon:"\ud83e\ude7a",name:"Visite specialistiche",desc:"Specialisti in cardiologia, ortopedia, dermatologia e neurologia"},{icon:"\ud83d\udd2c",name:"Diagnostica avanzata",desc:"Ecografie 4D, risonanze magnetiche e analisi di ultima generazione"},{icon:"\ud83d\udc8a",name:"Medicina preventiva",desc:"Check-up completi e piani di prevenzione personalizzati"},{icon:"\ud83c\udfc3",name:"Riabilitazione",desc:"Fisioterapia e percorsi di recupero con tecnologie innovative"}],
  professional: [{icon:"\ud83d\udca1",name:"Consulenza strategica",desc:"Analisi del mercato e pianificazione per scalare il business"},{icon:"\u2699\ufe0f",name:"Implementazione",desc:"Esecuzione operativa con team dedicati e metodologie agili"},{icon:"\ud83d\udcca",name:"Data Analytics",desc:"Dashboard personalizzate con KPI e insights azionabili"},{icon:"\ud83d\udee1\ufe0f",name:"Supporto dedicato",desc:"Account manager personale e assistenza prioritaria"}],
  ecommerce: [{icon:"\ud83d\udecd\ufe0f",name:"Catalogo smart",desc:"Gestisci migliaia di prodotti con varianti, filtri e ricerca AI"},{icon:"\ud83d\udcb3",name:"Pagamenti sicuri",desc:"Carta, PayPal, Apple Pay, Klarna \u2014 tutte le opzioni integrate"},{icon:"\ud83d\udce6",name:"Logistica integrata",desc:"Tracking real-time e integrazioni con i principali corrieri"},{icon:"\ud83d\udcc8",name:"Analytics & CRO",desc:"Ottimizzazione conversioni con A/B testing e heatmaps"}],
  realestate: [{icon:"\ud83c\udfe0",name:"Compravendita",desc:"Compra e vendi immobili con la nostra rete di professionisti certificati"},{icon:"\ud83d\udd11",name:"Gestione affitti",desc:"Gestione completa degli affitti residenziali e commerciali"},{icon:"\ud83d\udcd0",name:"Valutazioni certificate",desc:"Perizie professionali e stime di mercato sempre aggiornate"},{icon:"\ud83c\udfd7\ufe0f",name:"Nuove costruzioni",desc:"Prima casa, investimenti e ristrutturazioni chiavi in mano"}],
};

const TESTIMONIALS: Array<{ name: string; text: string; rating: number }> = [
  { name: "Marco R.", text: "Servizio eccezionale, superato ogni aspettativa. Torneremo sicuramente!", rating: 5 },
  { name: "Laura B.", text: "Professionalit\u00e0 e cura del dettaglio incredibili. Consiglio vivamente.", rating: 5 },
  { name: "Giovanni P.", text: "Esperienza fantastica dall'inizio alla fine. Staff gentilissimo.", rating: 5 },
];

const TAGLINES: Record<string, string> = {
  restaurant:"Cucina autentica",dental:"Il tuo sorriso perfetto",beauty:"Bellezza e benessere",
  fitness:"Il tuo percorso fitness",hotel:"Un'esperienza indimenticabile",legal:"Al tuo fianco, sempre",
  medical:"La tua salute, la nostra missione",ecommerce:"Shop smart, live better",
  realestate:"La casa dei tuoi sogni",professional:"Eccellenza professionale",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function img(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}
function stars(n: number): string {
  return "\u2605".repeat(Math.round(n)) + "\u2606".repeat(5 - Math.round(n));
}
function mapUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
function slugDomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
}

/* ── Resolved data container ─────────────────────────────────────────── */

interface R {
  cfg: TemplateConfig;
  name: string; ini: string; tag: string; desc: string; aboutRaw: string;
  hero: string; svcs: Array<{ icon: string; name: string; desc: string }>;
  gal: string[]; testi: Array<{ name: string; text: string; rating: number }>;
  rating: number; reviews: number; city: string; phone: string; email: string;
  address: string; wa: string; openingHours: string; logoUrl: string;
  stats: [SectorStat, SectorStat, SectorStat, SectorStat];
}

function resolve(data: SiteData): R {
  const cfg = getTemplateConfig(data.sector);
  const name = data.name;
  const ini = (name[0] ?? "M").toUpperCase();
  const tag = data.tagline ?? TAGLINES[data.sector] ?? "Eccellenza professionale";
  const aboutRaw = cfg.aboutText.replace(/\{name\}/g, name).replace(/\{city\}/g, data.city ?? "la tua citt\u00e0");
  const desc = data.description ?? `Da ${name}, ogni dettaglio \u00e8 curato con passione. Scopri un'esperienza unica nel cuore di ${data.city ?? "citt\u00e0"}.`;
  const hero = data.heroImage ?? img(HERO_IMGS[data.sector] ?? HERO_IMGS["professional"]!, 1600);
  const svcs = data.services ?? SERVICES[data.sector] ?? SERVICES["professional"]!;
  const gal = data.galleryImages?.map(g => g.url) ?? (GALLERY[data.sector] ?? GALLERY["professional"]!).map(id => img(id, 800));
  const testi = data.testimonials?.length ? data.testimonials : TESTIMONIALS;
  const rating = data.googleRating ?? 4.9;
  const reviews = data.reviewCount ?? 127;
  const city = data.city ?? "";
  const phone = data.phone ?? "";
  const email = data.email ?? `info@${slugDomain(name)}.com`;
  const address = data.address ?? "";
  const wa = data.whatsapp ?? phone.replace(/\D/g, "");
  const openingHours = data.openingHours ?? "";
  const logoUrl = data.logoUrl ?? "";
  return { cfg, name, ini, tag, desc, aboutRaw, hero, svcs, gal, testi, rating, reviews, city, phone, email, address, wa, openingHours, logoUrl, stats: cfg.stats };
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED PARTS: <head>, nav, footer, WhatsApp, scripts
   ═══════════════════════════════════════════════════════════════════════ */

function sharedHead(r: R, pageTitle: string, pageDesc: string): string {
  const c = r.cfg.colors;
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "LocalBusiness", name: r.name,
    ...(r.desc ? { description: r.desc } : {}),
    ...(r.address ? { address: { "@type": "PostalAddress", streetAddress: r.address } } : {}),
    ...(r.phone ? { telephone: r.phone } : {}),
    ...(r.email ? { email: r.email } : {}),
    ...(r.city ? { areaServed: r.city } : {}),
    aggregateRating: { "@type": "AggregateRating", ratingValue: r.rating, reviewCount: r.reviews },
  });
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(pageDesc)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDesc)}">
<meta property="og:image" content="${esc(r.hero)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(c.accent)}'/><text x='50' y='72' font-size='60' text-anchor='middle' fill='white' font-family='system-ui'>${r.ini}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${r.cfg.fonts.googleFontsUrl}" rel="stylesheet">
<script type="application/ld+json">${schema}</script>
<style>${sharedCSS(r)}</style>
</head>
<body>
<div class="preloader" id="pl"><div class="preloader-spinner"></div></div>`;
}

function sharedNav(r: R, active: string): string {
  const ac = (page: string) => page === active ? ' class="nav-a nav-a--active"' : ' class="nav-a"';
  return `
<div id="sp"></div>
<nav class="nav ${active === "home" ? "t" : "s"}" id="nv">
<div class="nav-i">
  <a href="index.html" class="nav-b">${r.logoUrl ? `<img src="${esc(r.logoUrl)}" alt="${esc(r.name)}" class="nav-logo-img">` : `<div class="nav-l">${r.ini}</div>`}<span class="nav-n">${esc(r.name)}</span></a>
  <div class="nav-k">
    <a href="chi-siamo.html"${ac("chi-siamo")}>Chi siamo</a>
    <a href="servizi.html"${ac("servizi")}>Servizi</a>
    <a href="galleria.html"${ac("galleria")}>Galleria</a>
    <a href="contatti.html"${ac("contatti")}>Contatti</a>
    <a href="contatti.html" class="nav-c">${esc(r.cfg.ctaLabel)}</a>
  </div>
  <button class="ham" id="ham" aria-label="Menu"><span></span><span></span><span></span></button>
</div>
</nav>
<div class="mob-overlay" id="mo"></div>
<div class="mob-menu" id="mm">
  <a href="index.html">Home</a>
  <a href="chi-siamo.html">Chi siamo</a>
  <a href="servizi.html">Servizi</a>
  <a href="galleria.html">Galleria</a>
  <a href="contatti.html">Contatti</a>
  <a href="contatti.html" class="mob-cta">${esc(r.cfg.ctaLabel)}</a>
</div>`;
}

function sharedFooter(r: R): string {
  return `<footer class="ft">
<div class="ft-i">
  <div class="ft-left">
    <span class="ft-b">${esc(r.name)}</span>
    ${r.address ? `<span class="ft-addr">${esc(r.address)}</span>` : ""}
  </div>
  <div class="ft-links">
    <a href="index.html">Home</a>
    <a href="chi-siamo.html">Chi siamo</a>
    <a href="servizi.html">Servizi</a>
    <a href="galleria.html">Galleria</a>
    <a href="contatti.html">Contatti</a>
  </div>
  <span class="ft-c">&copy; ${new Date().getFullYear()} ${esc(r.name)} &middot; Sito creato con MadeCreative</span>
</div>
</footer>
<button class="btt" id="btt" aria-label="Torna su"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>`;
}

function sharedWhatsApp(r: R): string {
  if (!r.wa) return "";
  return `<a href="https://wa.me/${r.wa}" target="_blank" rel="noopener" class="wa" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>`;
}

function sharedScripts(isHome: boolean): string {
  return `<script>
(function(){
var nv=document.getElementById("nv"),sp=document.getElementById("sp");
window.addEventListener("scroll",function(){
  var s=window.scrollY;
  ${isHome ? 'nv.className="nav "+(s>60?"s":"t");' : ''}
  var h=document.documentElement;
  sp.style.transform="scaleX("+(h.scrollHeight>h.clientHeight?h.scrollTop/(h.scrollHeight-h.clientHeight):0)+")";
},{passive:true});
var els=document.querySelectorAll(".r");
var obs=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add("v");obs.unobserve(e.target)}})},{threshold:.12,rootMargin:"-30px"});
els.forEach(function(el){obs.observe(el)});
${isHome ? `var t=document.getElementById("ht");
if(t){var h2=t.innerHTML,rr="",ci=0,tag=false;
for(var i=0;i<h2.length;i++){if(h2[i]==="<")tag=true;if(tag){rr+=h2[i];if(h2[i]===">")tag=false;continue}if(h2[i]===" "){rr+=" ";continue}rr+='<span class="ch" style="animation-delay:'+(0.4+ci*0.035)+'s">'+h2[i]+"</span>";ci++}
t.innerHTML=rr}` : ""}
/* Hamburger */
var ham=document.getElementById("ham"),mm=document.getElementById("mm"),mo=document.getElementById("mo");
function toggleMenu(){ham.classList.toggle("open");mm.classList.toggle("open");mo.classList.toggle("open");document.body.style.overflow=mm.classList.contains("open")?"hidden":""}
ham.addEventListener("click",toggleMenu);
mo.addEventListener("click",toggleMenu);
document.querySelectorAll("#mm a").forEach(function(a){a.addEventListener("click",function(){if(mm.classList.contains("open"))toggleMenu()})});

/* Preloader */
window.addEventListener("load",function(){var pl=document.getElementById("pl");if(pl)pl.classList.add("done")});
setTimeout(function(){var pl=document.getElementById("pl");if(pl)pl.classList.add("done")},2500);

/* Back to top */
var btt=document.getElementById("btt");
window.addEventListener("scroll",function(){if(btt)btt.className="btt"+(window.scrollY>600?" show":"")},{passive:true});
if(btt)btt.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});

/* Parallax hero image */
var heroBg=document.querySelector(".hero-bg img");
if(heroBg){window.addEventListener("scroll",function(){var s=window.scrollY;if(s<window.innerHeight*1.2){heroBg.style.transform="translateY("+s*0.3+"px) scale(1)"}},{passive:true})}

/* Counter animation on stats */
var counted=new Set();
var cObs=new IntersectionObserver(function(entries){entries.forEach(function(e){
  if(!e.isIntersecting||counted.has(e.target))return;
  counted.add(e.target);
  var el=e.target,txt=el.textContent,num=parseFloat(txt.replace(/[^\d.]/g,"")),suffix=txt.replace(/[\d.]/g,""),isFloat=txt.includes(".");
  if(isNaN(num))return;
  var duration=1200,start=performance.now();
  function tick(now){var p=Math.min((now-start)/duration,1);var eased=1-Math.pow(1-p,3);
    var v=eased*num;el.textContent=(isFloat?v.toFixed(1):Math.round(v))+suffix;
    if(p<1)requestAnimationFrame(tick)}
  requestAnimationFrame(tick);
})},{threshold:.5});
document.querySelectorAll(".st-v").forEach(function(el){cObs.observe(el)});
})();
</script>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   CSS (shared across all pages)
   ═══════════════════════════════════════════════════════════════════════ */

function sharedCSS(r: R): string {
  const c = r.cfg.colors;
  const fh = r.cfg.fonts.heading;
  const fb = r.cfg.fonts.body;
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--p:${c.primary};--a:${c.accent};--bg:${c.background};--tx:${c.text};--tl:${c.textLight};--bd:${c.border};--sf:${c.surface};--fh:'${fh}',serif;--fb:'${fb}',sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:var(--tx);overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}
::selection{background:var(--a);color:#fff}

/* Animations */
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes lineGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes heroImg{from{transform:scale(1.12)}to{transform:scale(1)}}
@keyframes kenBurns{0%{transform:scale(1)}100%{transform:scale(1.08)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.r{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.r.v{opacity:1;transform:none}
.r.d1{transition-delay:.1s}.r.d2{transition-delay:.2s}.r.d3{transition-delay:.3s}.r.d4{transition-delay:.4s}

/* Scroll progress */
#sp{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--a),color-mix(in srgb,var(--a) 60%,#fff));z-index:300;transform-origin:left;transform:scaleX(0);transition:transform .15s}

/* Nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:200;height:72px;display:flex;align-items:center;padding:0 clamp(20px,5vw,48px);transition:all .4s cubic-bezier(.16,1,.3,1)}
.nav.t{background:transparent}.nav.s{background:rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(200%);border-bottom:1px solid var(--bd);box-shadow:0 1px 20px rgba(0,0,0,.04)}
.nav-i{max-width:1280px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between}
.nav-b{display:flex;align-items:center;gap:12px;z-index:210}
.nav-l{width:40px;height:40px;border-radius:12px;background:var(--a);display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-weight:700;font-size:18px;color:#fff;transition:transform .3s}
.nav-l:hover{transform:scale(1.08) rotate(-3deg)}
.nav-logo-img{width:40px;height:40px;border-radius:12px;object-fit:contain;transition:transform .3s}
.nav-logo-img:hover{transform:scale(1.08)}
.nav-n{font-family:var(--fh);font-weight:700;font-size:20px;letter-spacing:-.02em}
.nav.t .nav-n{color:#fff}.nav.s .nav-n{color:var(--p)}
.nav-k{display:flex;gap:32px;align-items:center}
.nav-a{font-size:14px;font-weight:500;position:relative;transition:color .2s}
.nav.t .nav-a{color:rgba(255,255,255,.8)}.nav.s .nav-a{color:var(--tl)}
.nav-a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--a);transition:width .3s cubic-bezier(.16,1,.3,1)}
.nav-a:hover::after,.nav-a--active::after{width:100%}
.nav-a--active{color:var(--a)!important}
.nav-c{background:var(--a);color:#fff;padding:12px 28px;border-radius:12px;font-size:13px;font-weight:700;letter-spacing:.03em;transition:transform .2s,box-shadow .2s}
.nav-c:hover{transform:translateY(-2px);box-shadow:0 8px 24px color-mix(in srgb,var(--a) 40%,transparent)}

/* Hamburger */
.ham{display:none;width:44px;height:44px;border:none;background:none;cursor:pointer;z-index:210;position:relative;padding:0}
.ham span{display:block;width:24px;height:2px;background:var(--tx);border-radius:2px;transition:all .3s cubic-bezier(.16,1,.3,1);position:absolute;left:10px}
.ham span:nth-child(1){top:14px}.ham span:nth-child(2){top:21px}.ham span:nth-child(3){top:28px}
.nav.t .ham span{background:#fff}
.ham.open span:nth-child(1){transform:rotate(45deg);top:21px}
.ham.open span:nth-child(2){opacity:0;transform:translateX(-8px)}
.ham.open span:nth-child(3){transform:rotate(-45deg);top:21px}
.mob-menu{position:fixed;top:0;right:0;width:min(320px,85vw);height:100vh;background:var(--sf);box-shadow:-8px 0 40px rgba(0,0,0,.12);z-index:205;transform:translateX(100%);transition:transform .4s cubic-bezier(.16,1,.3,1);padding:96px 32px 32px;display:flex;flex-direction:column;gap:8px}
.mob-menu.open{transform:translateX(0)}
.mob-menu a{font-family:var(--fh);font-size:1.2rem;font-weight:600;color:var(--p);padding:16px 0;border-bottom:1px solid var(--bd);transition:color .2s,padding-left .2s}
.mob-menu a:hover{color:var(--a);padding-left:8px}
.mob-menu .mob-cta{margin-top:auto;background:var(--a);color:#fff;text-align:center;padding:16px;border-radius:14px;font-weight:700;border-bottom:none}
.mob-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:202;opacity:0;pointer-events:none;transition:opacity .3s}
.mob-overlay.open{opacity:1;pointer-events:auto}

/* Hero */
.hero{position:relative;min-height:100vh;overflow:hidden}
.hero-bg{position:absolute;inset:0}.hero-bg img{width:100%;height:100%;object-fit:cover;animation:heroImg 2.5s cubic-bezier(.16,1,.3,1) forwards}
.hero-bg--ken img{animation:kenBurns 20s ease-in-out infinite alternate}
.hero-ov{position:absolute;inset:0;background:linear-gradient(165deg,${c.primary}e6 0%,${c.primary}33 45%,${c.primary}99 100%)}
.hero-ov--dark{background:linear-gradient(180deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.8) 100%)}
.hero-ov--vignette{background:radial-gradient(ellipse at center,${c.primary}22 0%,${c.primary}cc 100%)}
.hero-gr{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");pointer-events:none}
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
.bp--lg{padding:20px 48px;font-size:1.05rem;border-radius:16px}
.bs{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.18);padding:16px 36px;border-radius:14px;font-weight:600;font-size:.9rem;transition:all .25s}
.bs:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3)}
.hero-badge{display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.1);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 24px;animation:up .6s ease 1.8s both}
.hero-badge .stars{color:var(--a);font-size:14px;letter-spacing:2px}
.hero-badge .score{font-family:var(--fh);font-size:28px;font-weight:700;color:#fff;line-height:1}
.hero-badge .label{font-size:11px;color:rgba(255,255,255,.5);letter-spacing:.05em}

/* Hero split */
.hero--split{background:var(--p);display:flex;align-items:center}
.hero--split .hero-grid{display:grid;grid-template-columns:1fr 1fr;max-width:1280px;margin:0 auto;padding:120px clamp(20px,5vw,48px) 80px;gap:clamp(32px,4vw,64px);width:100%;align-items:center;position:relative;z-index:2}
.hero--split .hero-img-wrap{border-radius:24px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 32px 80px rgba(0,0,0,.3)}
.hero--split .hero-img-wrap img{width:100%;height:100%;object-fit:cover;animation:heroImg 2.5s cubic-bezier(.16,1,.3,1) forwards}
.hero--split .hero-badge{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);white-space:nowrap}
/* Hero editorial */
.hero--editorial .hero-ct{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:100vh}
.hero-kicker{font-size:13px;font-weight:600;color:var(--a);letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px;animation:up .7s ease .2s both}
.hero-editorial-h1{font-size:clamp(3.5rem,8vw,7rem)!important;font-weight:200!important;letter-spacing:-.04em!important;max-width:none!important;text-align:center;margin-bottom:16px!important}
.hero-editorial-divider{width:120px;height:1px;background:var(--a);margin:24px auto;animation:lineGrow 1.2s ease 1s both}
.hero-editorial-tag{font-size:clamp(1.1rem,2vw,1.4rem);color:rgba(255,255,255,.5);font-style:italic;letter-spacing:.05em;animation:up .7s ease 1.2s both;margin-bottom:40px}
/* Hero bold */
.hero--bold .hero-ct{display:flex;flex-direction:column;justify-content:flex-end;min-height:100vh;padding-bottom:80px}
.hero-bold-h1{font-size:clamp(3rem,10vw,8rem)!important;font-weight:900!important;line-height:.92!important;letter-spacing:-.04em!important;max-width:none!important;margin-bottom:12px!important}
.hero-bold-accent{width:80px;height:6px;background:var(--a);margin-bottom:24px;border-radius:3px;animation:lineGrow .8s ease 1s both}
/* Hero cinematic */
.hero-cine-h1{font-size:clamp(3rem,7vw,6rem)!important;font-weight:400!important;letter-spacing:.08em!important;text-align:center;max-width:none!important}
.hero-cine-line{width:1px;height:60px;background:var(--a);margin:24px auto;animation:lineGrow 1.2s ease 1s both;transform-origin:top}

/* Page header (inner pages) */
.page-hdr{background:var(--p);padding:140px clamp(20px,5vw,48px) 80px;text-align:center;position:relative;overflow:hidden}
.page-hdr::before{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")}
.page-hdr h1{font-family:var(--fh);font-size:clamp(2.4rem,5vw,4rem);font-weight:400;color:#fff;letter-spacing:-.02em;position:relative}
.page-hdr p{color:rgba(255,255,255,.5);font-size:1.05rem;margin-top:12px;position:relative}
.page-hdr .ph-line{width:56px;height:2px;background:var(--a);margin:20px auto 0;position:relative}

/* Section */
.sec{padding:clamp(80px,10vw,120px) clamp(20px,5vw,48px)}
.sec-i{max-width:1280px;margin:0 auto}
.sec-ey{font-size:12px;font-weight:700;color:var(--a);letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px}
.sec-t{font-family:var(--fh);font-size:clamp(2rem,4vw,3.2rem);font-weight:400;letter-spacing:-.02em;line-height:1.1;color:var(--p);margin-bottom:8px}
.sec-ln{width:56px;height:2px;background:var(--a);margin:20px 0 28px;transform-origin:left}
.sec-d{font-size:1.05rem;color:var(--tl);max-width:520px;line-height:1.75}

/* About / Stats */
.about{background:var(--sf)}
.about-g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,80px);align-items:center}
.about-txt{font-size:1.05rem;line-height:1.85;color:var(--tx)}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.st{padding:28px 20px;border-radius:14px;text-align:center;transition:transform .3s}.st:hover{transform:translateY(-4px)}
.st-d{background:var(--p)}.st-l{background:var(--bg);border:1px solid var(--bd)}
.st-v{font-family:var(--fh);font-size:2.2rem;font-weight:600;line-height:1;margin-bottom:6px}
.st-d .st-v{color:var(--a)}.st-l .st-v{color:var(--p)}
.st-lb{font-size:.78rem;letter-spacing:.03em}
.st-d .st-lb{color:rgba(255,255,255,.55)}.st-l .st-lb{color:var(--tl)}

/* Services */
.cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:48px}
.cd{background:var(--sf);border:1px solid var(--bd);border-radius:24px;padding:36px 32px;transition:all .4s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.cd::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--a);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.16,1,.3,1)}
.cd:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.06)}.cd:hover::before{transform:scaleX(1)}
.cd-ic{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 65%,var(--p)));display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:24px;transition:transform .3s}
.cd:hover .cd-ic{transform:scale(1.08) rotate(-5deg)}
.cd h3{font-family:var(--fh);font-size:1.15rem;font-weight:700;margin-bottom:12px;color:var(--p);letter-spacing:-.01em}
.cd p{font-size:.92rem;color:var(--tl);line-height:1.7}

/* Gallery */
.gal-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:48px}
.gal-it{border-radius:14px;overflow:hidden;position:relative;cursor:pointer}
.gal-it:nth-child(1){grid-column:span 2;aspect-ratio:16/9}.gal-it:nth-child(n+2){aspect-ratio:1}
.gal-it img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.gal-it:hover img{transform:scale(1.08)}
.gal-it::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.3) 0%,transparent 50%);opacity:0;transition:opacity .3s}.gal-it:hover::after{opacity:1}
/* Gallery full page - all same aspect ratio */
.gal-full{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:48px}
.gal-full .gal-it{aspect-ratio:4/3}
.gal-full .gal-it:nth-child(1){grid-column:auto}
/* Lightbox */
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:500;display:none;align-items:center;justify-content:center;padding:40px;cursor:pointer}
.lightbox:target{display:flex}
.lightbox img{max-width:90vw;max-height:85vh;border-radius:12px;object-fit:contain}
.lightbox .lb-close{position:absolute;top:20px;right:28px;color:#fff;font-size:32px;cursor:pointer;opacity:.7;transition:opacity .2s}
.lightbox .lb-close:hover{opacity:1}

/* Testimonials */
.test-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-top:48px}
.test-c{background:var(--sf);border:1px solid var(--bd);border-radius:20px;padding:32px;transition:transform .3s}.test-c:hover{transform:translateY(-4px)}
.test-stars{color:var(--a);font-size:16px;letter-spacing:3px;margin-bottom:16px}
.test-txt{font-size:.95rem;color:var(--tx);line-height:1.75;margin-bottom:20px;font-style:italic}
.test-nm{font-family:var(--fh);font-weight:700;font-size:.95rem;color:var(--p)}

/* Contact */
.ctc{background:var(--p);color:#fff}
.ctc .sec-t{color:#fff}
.ctc-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,4vw,64px);margin-top:48px;align-items:start}
.ctc-info{display:flex;flex-direction:column;gap:28px}
.ctc-item{display:flex;align-items:flex-start;gap:16px}
.ctc-ic{font-size:24px;width:48px;height:48px;background:rgba(255,255,255,.08);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ctc-lb{font-size:.72rem;color:var(--a);letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;font-weight:600}
.ctc-val{font-size:1rem;color:rgba(255,255,255,.85);font-weight:500}
.ctc-val a{color:rgba(255,255,255,.85);transition:color .2s}.ctc-val a:hover{color:var(--a)}
.ctc-form{display:flex;flex-direction:column;gap:16px}
.ctc-form .fg{display:flex;flex-direction:column;gap:6px}
.ctc-form label{font-size:.75rem;font-weight:600;color:var(--a);letter-spacing:.08em;text-transform:uppercase}
.ctc-form input,.ctc-form textarea{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 18px;color:#fff;font-family:var(--fb);font-size:.95rem;transition:border-color .3s,box-shadow .3s;outline:none}
.ctc-form input:focus,.ctc-form textarea:focus{border-color:var(--a);box-shadow:0 0 0 3px color-mix(in srgb,var(--a) 20%,transparent)}
.ctc-form input::placeholder,.ctc-form textarea::placeholder{color:rgba(255,255,255,.25)}
.ctc-form textarea{resize:vertical;min-height:120px}
.ctc-form .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ctc-form button{background:var(--a);color:#fff;border:none;padding:16px 36px;border-radius:14px;font-family:var(--fb);font-size:.95rem;font-weight:700;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1);letter-spacing:.03em}
.ctc-form button:hover{transform:translateY(-2px);box-shadow:0 12px 36px color-mix(in srgb,var(--a) 35%,transparent)}

/* Map */
.map-wrap{border-radius:20px;overflow:hidden;height:400px;margin-top:48px;border:1px solid var(--bd)}.map-wrap iframe{width:100%;height:100%;border:0}
.map-full{border-radius:0;height:450px;margin-top:0;border:none}

/* CTA Banner */
.cta-banner{background:var(--p);padding:clamp(60px,8vw,100px) clamp(20px,5vw,48px);text-align:center;position:relative;overflow:hidden}
.cta-banner::before{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")}
.cta-banner h2{font-family:var(--fh);font-size:clamp(1.8rem,4vw,3rem);color:#fff;margin-bottom:16px;position:relative}
.cta-banner p{color:rgba(255,255,255,.5);font-size:1.05rem;margin-bottom:32px;position:relative}
.cta-banner .bp{position:relative}

/* Footer */
.ft{background:var(--p);border-top:1px solid rgba(255,255,255,.06);padding:40px clamp(20px,5vw,48px)}
.ft-i{max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
.ft-left{display:flex;flex-direction:column;gap:6px}
.ft-b{font-family:var(--fh);font-size:1.2rem;font-weight:700;color:rgba(255,255,255,.7)}
.ft-addr{font-size:.85rem;color:rgba(255,255,255,.3)}
.ft-links{display:flex;gap:24px;flex-wrap:wrap}
.ft-links a{font-size:.85rem;color:rgba(255,255,255,.4);transition:color .2s}.ft-links a:hover{color:var(--a)}
.ft-c{font-size:.8rem;color:rgba(255,255,255,.2)}

/* WhatsApp */
.wa{position:fixed;bottom:28px;right:28px;z-index:150;width:60px;height:60px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.35);transition:transform .3s,box-shadow .3s;animation:float 3s ease-in-out infinite}
.wa:hover{transform:scale(1.1);box-shadow:0 8px 32px rgba(37,211,102,.5)}
.wa svg{width:28px;height:28px;fill:#fff}

/* Responsive */
@media(max-width:768px){
  .nav-k{display:none}
  .ham{display:flex;align-items:center;justify-content:center}
  .hero h1{font-size:2.2rem}
  .hero--split .hero-grid{grid-template-columns:1fr;padding-top:100px}
  .hero--split .hero-col--img{order:-1}
  .hero--split .hero-img-wrap{aspect-ratio:16/9}
  .hero-editorial-h1{font-size:2.8rem!important}
  .hero-bold-h1{font-size:3rem!important}
  .hero-cine-h1{font-size:2.6rem!important}
  .about-g{grid-template-columns:1fr;gap:32px}
  .ctc-grid{grid-template-columns:1fr}
  .gal-g{grid-template-columns:1fr 1fr}.gal-it:nth-child(1){grid-column:span 2}
  .gal-full{grid-template-columns:1fr 1fr}
  .hero-badge{display:none}
  .test-g{grid-template-columns:1fr}
  .ctc-form .row{grid-template-columns:1fr}
  .map-wrap{height:280px}
  .ft-links{gap:16px}
}
@media(max-width:480px){
  .hero h1{font-size:1.8rem}
  .hero-editorial-h1{font-size:2.2rem!important}
  .hero-bold-h1{font-size:2.4rem!important}
  .sec-t{font-size:1.6rem}
  .gal-g,.gal-full{grid-template-columns:1fr}
  .gal-it:nth-child(1){grid-column:span 1;aspect-ratio:4/3}
  .gal-it:nth-child(n+2){aspect-ratio:4/3}
}

/* Preloader */
.preloader{position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;align-items:center;justify-content:center;transition:opacity .5s,visibility .5s}
.preloader.done{opacity:0;visibility:hidden;pointer-events:none}
.preloader-spinner{width:40px;height:40px;border:3px solid var(--bd);border-top-color:var(--a);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Back to top */
.btt{position:fixed;bottom:100px;right:28px;z-index:140;width:44px;height:44px;border-radius:50%;background:var(--p);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s,background .2s;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.15)}
.btt.show{opacity:1;transform:translateY(0);pointer-events:auto}
.btt:hover{background:var(--a)}
.btt svg{width:18px;height:18px}

/* Parallax hero */
.hero-bg.parallax img{will-change:transform}

/* Counter animation */
.counter{display:inline-block}
`;
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO VARIANTS (home only)
   ═══════════════════════════════════════════════════════════════════════ */

function heroSplit(r: R): string {
  return `<section class="hero hero--split">
  <div class="hero-gr"></div>
  <div class="hero-grid">
    <div class="hero-col hero-col--text">
      <div class="hero-ey"><span class="hero-dot"></span><span>${esc(r.tag)}</span></div>
      <h1 id="ht">${esc(r.name)}.<br><em>${esc(r.tag)}.</em></h1>
      <div class="hero-ln"></div>
      <p class="hero-sub">${esc(r.desc)}</p>
      <div class="hero-btn">
        <a href="contatti.html" class="bp">${esc(r.cfg.ctaLabel)} <span>\u2192</span></a>
        <a href="servizi.html" class="bs">${esc(r.cfg.ctaSecondary)}</a>
      </div>
    </div>
    <div class="hero-col hero-col--img" style="position:relative">
      <div class="hero-img-wrap"><img src="${esc(r.hero)}" alt="${esc(r.name)}" loading="eager"></div>
      ${heroBadge(r)}
    </div>
  </div>
</section>`;
}
function heroCentered(r: R): string {
  return `<section class="hero hero--centered">
  <div class="hero-bg"><img src="${esc(r.hero)}" alt="${esc(r.name)}" loading="eager"></div>
  <div class="hero-ov"></div><div class="hero-gr"></div>
  <div class="hero-ct" style="text-align:center">
    <div class="hero-ey" style="justify-content:center"><span class="hero-dot"></span><span>${esc(r.tag)}</span></div>
    <h1 id="ht" style="margin-left:auto;margin-right:auto">${esc(r.name)}.<br><em>${esc(r.tag)}.</em></h1>
    <div class="hero-ln" style="margin-left:auto;margin-right:auto"></div>
    <p class="hero-sub" style="margin-left:auto;margin-right:auto">${esc(r.desc)}</p>
    <div class="hero-btn" style="justify-content:center">
      <a href="contatti.html" class="bp">${esc(r.cfg.ctaLabel)} <span>\u2192</span></a>
      <a href="servizi.html" class="bs">${esc(r.cfg.ctaSecondary)}</a>
    </div>
    <div style="margin-top:48px;animation:up .6s ease 1.8s both">${heroBadge(r)}</div>
  </div>
</section>`;
}
function heroEditorial(r: R): string {
  return `<section class="hero hero--editorial">
  <div class="hero-bg"><img src="${esc(r.hero)}" alt="${esc(r.name)}" loading="eager"></div>
  <div class="hero-ov"></div><div class="hero-gr"></div>
  <div class="hero-ct">
    <p class="hero-kicker">${esc(r.city || "")}</p>
    <h1 id="ht" class="hero-editorial-h1">${esc(r.name)}</h1>
    <div class="hero-editorial-divider"></div>
    <p class="hero-editorial-tag">${esc(r.tag)}</p>
    <div class="hero-btn" style="justify-content:center">
      <a href="contatti.html" class="bp">${esc(r.cfg.ctaLabel)} <span>\u2192</span></a>
    </div>
  </div>
</section>`;
}
function heroBold(r: R): string {
  return `<section class="hero hero--bold">
  <div class="hero-bg"><img src="${esc(r.hero)}" alt="${esc(r.name)}" loading="eager"></div>
  <div class="hero-ov hero-ov--dark"></div>
  <div class="hero-ct">
    <h1 id="ht" class="hero-bold-h1">${esc(r.name).toUpperCase()}</h1>
    <div class="hero-bold-accent"></div>
    <p class="hero-sub">${esc(r.desc)}</p>
    <div class="hero-btn">
      <a href="contatti.html" class="bp bp--lg">${esc(r.cfg.ctaLabel)} <span>\u2192</span></a>
      <a href="servizi.html" class="bs">${esc(r.cfg.ctaSecondary)}</a>
    </div>
  </div>
</section>`;
}
function heroCinematic(r: R): string {
  return `<section class="hero hero--cinematic">
  <div class="hero-bg hero-bg--ken"><img src="${esc(r.hero)}" alt="${esc(r.name)}" loading="eager"></div>
  <div class="hero-ov hero-ov--vignette"></div><div class="hero-gr"></div>
  <div class="hero-ct" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh">
    <div class="hero-ey" style="justify-content:center"><span class="hero-dot"></span><span>${esc(r.tag)}</span></div>
    <h1 id="ht" class="hero-cine-h1">${esc(r.name)}</h1>
    <div class="hero-cine-line"></div>
    <p class="hero-sub" style="text-align:center;margin-left:auto;margin-right:auto;max-width:600px">${esc(r.desc)}</p>
    <div class="hero-btn" style="justify-content:center">
      <a href="contatti.html" class="bp">${esc(r.cfg.ctaLabel)} <span>\u2192</span></a>
      <a href="servizi.html" class="bs">${esc(r.cfg.ctaSecondary)}</a>
    </div>
    <div style="margin-top:48px;animation:up .6s ease 1.8s both">${heroBadge(r)}</div>
  </div>
</section>`;
}
function heroBadge(r: R): string {
  return `<div class="hero-badge"><div><div class="score">${r.rating}</div><div class="label">su Google</div></div><div><div class="stars">${stars(r.rating)}</div><div class="label">${r.reviews}+ recensioni</div></div></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE BUILDERS
   ═══════════════════════════════════════════════════════════════════════ */

function pageHome(r: R): string {
  const heroMap: Record<string, (r: R) => string> = { split: heroSplit, centered: heroCentered, editorial: heroEditorial, bold: heroBold, cinematic: heroCinematic };
  const heroHtml = (heroMap[r.cfg.heroVariant] ?? heroCentered)(r);
  return `${sharedHead(r, `${r.name}${r.city ? ` \u2014 ${r.city}` : ""}`, r.desc)}
${sharedNav(r, "home")}
${heroHtml}

<section class="sec about">
<div class="sec-i">
  <div class="about-g">
    <div class="r">
      <p class="sec-ey">La nostra storia</p>
      <h2 class="sec-t">Chi Siamo</h2>
      <div class="sec-ln"></div>
      <p class="about-txt">${esc(r.aboutRaw)}</p>
      <a href="chi-siamo.html" style="display:inline-flex;align-items:center;gap:8px;margin-top:28px;font-weight:600;font-size:.9rem;color:var(--p);border-bottom:2px solid var(--a);padding-bottom:4px">Scopri di pi\u00f9 \u2192</a>
    </div>
    <div class="stats r d2">
      ${r.stats.map(s => `<div class="st ${s.dark ? "st-d" : "st-l"}"><p class="st-v">${esc(s.value)}</p><p class="st-lb">${esc(s.label)}</p></div>`).join("\n      ")}
    </div>
  </div>
</div>
</section>

<section class="sec" style="background:var(--bg)">
<div class="sec-i">
  <div class="r"><p class="sec-ey">Cosa offriamo</p><h2 class="sec-t">I nostri servizi</h2><div class="sec-ln"></div></div>
  <div class="cg">
    ${r.svcs.slice(0, 3).map((s, i) => `<div class="cd r d${i + 1}"><div class="cd-ic">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join("\n    ")}
  </div>
  <div style="text-align:center;margin-top:40px"><a href="servizi.html" class="bp">Tutti i servizi \u2192</a></div>
</div>
</section>

<section class="sec" style="background:var(--sf)">
<div class="sec-i">
  <div class="r" style="text-align:center"><p class="sec-ey">Galleria</p><h2 class="sec-t" style="margin-left:auto;margin-right:auto">I nostri momenti</h2></div>
  <div class="gal-g">
    ${r.gal.slice(0, 3).map((url, i) => `<div class="gal-it r d${i + 1}"><img src="${esc(url)}" alt="${esc(r.name)}" loading="lazy"></div>`).join("\n    ")}
  </div>
  <div style="text-align:center;margin-top:40px"><a href="galleria.html" class="bp">Vedi tutta la galleria \u2192</a></div>
</div>
</section>

<section class="sec" style="background:var(--bg)">
<div class="sec-i">
  <div class="r" style="text-align:center"><p class="sec-ey">Recensioni</p><h2 class="sec-t" style="margin-left:auto;margin-right:auto">Cosa dicono i nostri clienti</h2></div>
  <div class="test-g">
    ${r.testi.map((t, i) => `<div class="test-c r d${Math.min(i + 1, 3)}"><div class="test-stars">${stars(t.rating)}</div><p class="test-txt">\u201C${esc(t.text)}\u201D</p><p class="test-nm">${esc(t.name)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<div class="cta-banner">
  <h2 class="r">${esc(r.tag)}</h2>
  <p class="r d1">Contattaci oggi per una consulenza gratuita</p>
  <a href="contatti.html" class="bp r d2">${esc(r.cfg.ctaLabel)} \u2192</a>
</div>

${sharedFooter(r)}
${sharedWhatsApp(r)}
${sharedScripts(true)}
</body></html>`;
}

function pageChiSiamo(r: R): string {
  return `${sharedHead(r, `Chi Siamo \u2014 ${r.name}`, r.aboutRaw)}
${sharedNav(r, "chi-siamo")}

<div class="page-hdr">
  <h1>Chi Siamo</h1>
  <p>${esc(r.tag)}</p>
  <div class="ph-line"></div>
</div>

<section class="sec about">
<div class="sec-i">
  <div class="about-g">
    <div class="r">
      <p class="sec-ey">La nostra storia</p>
      <h2 class="sec-t">La nostra missione</h2>
      <div class="sec-ln"></div>
      <p class="about-txt">${esc(r.aboutRaw)}</p>
      <p class="about-txt" style="margin-top:20px">${esc(r.desc)}</p>
    </div>
    <div class="r d2" style="border-radius:24px;overflow:hidden;aspect-ratio:4/5">
      <img src="${esc(r.hero)}" alt="${esc(r.name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">
    </div>
  </div>
</div>
</section>

<section class="sec" style="background:var(--bg)">
<div class="sec-i">
  <div class="r" style="text-align:center"><p class="sec-ey">I numeri</p><h2 class="sec-t" style="margin-left:auto;margin-right:auto">Il nostro impatto</h2></div>
  <div class="stats r d1" style="max-width:600px;margin:48px auto 0">
    ${r.stats.map(s => `<div class="st ${s.dark ? "st-d" : "st-l"}"><p class="st-v">${esc(s.value)}</p><p class="st-lb">${esc(s.label)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<section class="sec" style="background:var(--sf)">
<div class="sec-i">
  <div class="r" style="text-align:center"><p class="sec-ey">Recensioni</p><h2 class="sec-t" style="margin-left:auto;margin-right:auto">Cosa dicono di noi</h2></div>
  <div class="test-g">
    ${r.testi.map((t, i) => `<div class="test-c r d${Math.min(i + 1, 3)}"><div class="test-stars">${stars(t.rating)}</div><p class="test-txt">\u201C${esc(t.text)}\u201D</p><p class="test-nm">${esc(t.name)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<div class="cta-banner">
  <h2 class="r">Vuoi saperne di pi\u00f9?</h2>
  <p class="r d1">Siamo sempre disponibili per te</p>
  <a href="contatti.html" class="bp r d2">${esc(r.cfg.ctaLabel)} \u2192</a>
</div>

${sharedFooter(r)}
${sharedWhatsApp(r)}
${sharedScripts(false)}
</body></html>`;
}

function pageServizi(r: R): string {
  return `${sharedHead(r, `Servizi \u2014 ${r.name}`, `Scopri tutti i servizi di ${r.name}: ${r.svcs.map(s => s.name).join(", ")}.`)}
${sharedNav(r, "servizi")}

<div class="page-hdr">
  <h1>I Nostri Servizi</h1>
  <p>Eccellenza in ogni dettaglio</p>
  <div class="ph-line"></div>
</div>

<section class="sec">
<div class="sec-i">
  <div class="cg">
    ${r.svcs.map((s, i) => `<div class="cd r d${Math.min(i + 1, 4)}"><div class="cd-ic">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join("\n    ")}
  </div>
</div>
</section>

<div class="cta-banner">
  <h2 class="r">Interessato ai nostri servizi?</h2>
  <p class="r d1">Contattaci per un preventivo personalizzato</p>
  <a href="contatti.html" class="bp r d2">${esc(r.cfg.ctaLabel)} \u2192</a>
</div>

${sharedFooter(r)}
${sharedWhatsApp(r)}
${sharedScripts(false)}
</body></html>`;
}

function pageGalleria(r: R): string {
  const lbs = r.gal.map((_, i) => `<div class="lightbox" id="img${i}"><a href="#" class="lb-close">&times;</a><img src="${esc(r.gal[i]!)}" alt="${esc(r.name)}"></div>`).join("\n");
  return `${sharedHead(r, `Galleria \u2014 ${r.name}`, `Galleria fotografica di ${r.name}.`)}
${sharedNav(r, "galleria")}

<div class="page-hdr">
  <h1>Galleria</h1>
  <p>I nostri momenti migliori</p>
  <div class="ph-line"></div>
</div>

<section class="sec">
<div class="sec-i">
  <div class="gal-full">
    ${r.gal.map((url, i) => `<a href="#img${i}" class="gal-it r d${Math.min(i + 1, 4)}"><img src="${esc(url)}" alt="${esc(r.name)}" loading="lazy"></a>`).join("\n    ")}
  </div>
</div>
</section>

${lbs}

<div class="cta-banner">
  <h2 class="r">Ti piace quello che vedi?</h2>
  <p class="r d1">Vieni a trovarci di persona</p>
  <a href="contatti.html" class="bp r d2">${esc(r.cfg.ctaLabel)} \u2192</a>
</div>

${sharedFooter(r)}
${sharedWhatsApp(r)}
${sharedScripts(false)}
</body></html>`;
}

function pageContatti(r: R): string {
  return `${sharedHead(r, `Contatti \u2014 ${r.name}`, `Contatta ${r.name}: ${r.address || r.phone || r.email}.`)}
${sharedNav(r, "contatti")}

<div class="page-hdr">
  <h1>Contatti</h1>
  <p>Siamo qui per te</p>
  <div class="ph-line"></div>
</div>

<section class="sec ctc">
<div class="sec-i">
  <div class="ctc-grid">
    <div class="ctc-info r d1">
      <div class="ctc-item"><div class="ctc-ic">\ud83d\udccd</div><div><p class="ctc-lb">Indirizzo</p><p class="ctc-val">${esc(r.address || "Su richiesta")}</p></div></div>
      <div class="ctc-item"><div class="ctc-ic">\ud83d\udcde</div><div><p class="ctc-lb">Telefono</p><p class="ctc-val">${r.phone ? `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>` : "Su richiesta"}</p></div></div>
      <div class="ctc-item"><div class="ctc-ic">\u2709\ufe0f</div><div><p class="ctc-lb">Email</p><p class="ctc-val"><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></p></div></div>
      ${r.openingHours ? `<div class="ctc-item"><div class="ctc-ic">\ud83d\udd50</div><div><p class="ctc-lb">Orari</p><p class="ctc-val">${esc(r.openingHours)}</p></div></div>` : ""}
    </div>
    <form class="ctc-form r d2" onsubmit="event.preventDefault();this.querySelector('button').textContent='Inviato \u2713';this.querySelector('button').style.background='#22c55e'">
      <div class="row">
        <div class="fg"><label for="fn">Nome</label><input id="fn" name="name" placeholder="Il tuo nome" required></div>
        <div class="fg"><label for="fe">Email</label><input id="fe" name="email" type="email" placeholder="La tua email" required></div>
      </div>
      <div class="fg"><label for="fp">Telefono</label><input id="fp" name="phone" type="tel" placeholder="Il tuo numero (opzionale)"></div>
      <div class="fg"><label for="fm">Messaggio</label><textarea id="fm" name="message" placeholder="Come possiamo aiutarti?" required></textarea></div>
      <button type="submit">${esc(r.cfg.ctaLabel)} \u2192</button>
    </form>
  </div>
</div>
</section>

${r.address ? `<div class="map-wrap map-full"><iframe src="${mapUrl(r.address)}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mappa"></iframe></div>` : ""}

${sharedFooter(r)}
${sharedWhatsApp(r)}
${sharedScripts(false)}
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════ */

/** Generate a full multi-page site. Returns { "index.html": "...", "chi-siamo.html": "...", ... } */
export function generateMultiPageSite(data: SiteData): Record<string, string> {
  const r = resolve(data);
  return {
    "index.html": pageHome(r),
    "chi-siamo.html": pageChiSiamo(r),
    "servizi.html": pageServizi(r),
    "galleria.html": pageGalleria(r),
    "contatti.html": pageContatti(r),
  };
}

/** Legacy: generate single-page site (for Sandpack preview / backward compat) */
export function generatePremiumSite(data: SiteData): string {
  return generateMultiPageSite(data)["index.html"]!;
}

/** Sandpack wrapper — uses homepage for preview */
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
