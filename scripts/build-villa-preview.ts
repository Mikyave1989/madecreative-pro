import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic();
const VERCEL_TOKEN = process.env["VERCEL_TOKEN"]!;
const SLUG = "villa-del-vecchio-pozzo-napoli";

const data = JSON.parse(readFileSync("/tmp/scraped-villa.json", "utf8"));
const s = data.data.scraped;
const pages: any[] = s.pages;

// Collect real photos — prioritize .jpg/.webp with alt text, filter junk
const imgSet = new Set<string>();
const imgEntries: Array<{ url: string; alt: string; score: number }> = [];
for (const p of pages) {
  for (const img of p.images || []) {
    const url = typeof img === "string" ? img : img.url;
    const alt = typeof img === "object" ? (img.alt || "") : "";
    if (!url?.startsWith("http") || imgSet.has(url)) continue;
    // Filter junk
    if (/dummy|plugin|admin\/assets|widget|icon|sprite|pixel|tracking|badge|spinner|\.svg/i.test(url)) continue;
    if (/map\.jpg|map_mobile/i.test(url)) continue;
    if (!url.match(/\.(jpg|jpeg|png|webp)/i)) continue;
    imgSet.add(url);
    // Score: .jpg/.webp > .png, with alt > without, longer filenames = more likely real
    const isJpg = /\.(jpg|jpeg|webp)/i.test(url);
    const hasAlt = alt.length > 2;
    const score = (isJpg ? 10 : 2) + (hasAlt ? 5 : 0);
    imgEntries.push({ url, alt, score });
  }
}
// Sort by score, best photos first
imgEntries.sort((a, b) => b.score - a.score);
const imgs = imgEntries.map(e => e.url);
const imgWithAlt = imgEntries.filter(e => e.alt).map(e => `${e.url} (${e.alt})`);

// Collect headings + paragraphs
const headings: any[] = [];
const paras: string[] = [];
for (const p of pages) {
  for (const h of p.headings || []) { if (h.text?.length > 3 && !headings.some((x: any) => x.text === h.text)) headings.push(h); }
  for (const t of p.paragraphs || []) { if (t.length > 30 && !paras.includes(t)) paras.push(t); }
}

async function main() {
  console.log(`Generating premium site with ${imgs.length} real photos...`);

  // Use images WITH alt text first (these are described photos), then fill with others
  const photoList = imgs.slice(0, 15).map((u, i) => {
    const entry = imgEntries.find(e => e.url === u);
    return `${i + 1}. ${u}${entry?.alt ? ` — "${entry.alt}"` : ""}`;
  }).join("\n");
  const headingList = headings.slice(0, 15).map(h => `h${h.level}: ${h.text}`).join("\n");
  const paraList = paras.slice(0, 8).map((p, i) => `${i + 1}. ${p.slice(0, 300)}`).join("\n");

  const userPrompt = `Build a COMPLETE premium single-page website for "Villa del Vecchio Pozzo" — a luxury wedding and ceremony venue in Posillipo, Naples, Italy.

USE ONLY THESE REAL CONTENTS:

LOGO: ${s.logo}

REAL PHOTOS (use ONLY these — they are from the actual venue. The alt text describes what each photo shows. Use them in the right section.):
${photoList}

CRITICAL: Use ONLY these photos. Do NOT use any placeholder, stock, or generic images. Every <img> tag must use one of the URLs listed above.

REAL HEADINGS:
${headingList}

REAL TEXT (use these exact paragraphs, improve wording slightly but keep meaning):
${paraList}

CONTACT INFO (use exactly as-is):
- Phone: ${s.contact.phone}
- Email: ${s.contact.email}
- Address: ${s.contact.address}
- WhatsApp: ${s.contact.whatsapp}

SOCIAL MEDIA:
- Facebook: ${s.socialLinks?.facebook || ""}
- Instagram: ${s.socialLinks?.instagram || ""}

COLORS: Enhance the originals into a luxury palette — warm golds (#c9a14a), deep charcoal (#1a1208), cream (#faf8f4), rich brown text (#2d2419)

FONTS: "Cormorant Garamond" for headings + "DM Sans" for body

MANDATORY STRUCTURE:
1. HERO — full-screen (100vh), best venue photo as background, gradient overlay, animated heading "Villa del Vecchio Pozzo", subtitle "L'incantevole villa per matrimoni a Posillipo", CTA "Richiedi Informazioni"
2. ABOUT — "La Villa" with real description + real venue photo
3. SERVICES — Matrimoni, Ricevimenti, Feste cards with real photos
4. GALLERY — 6-8 REAL venue photos grid with hover zoom
5. EXPERIENCE — "Creiamo la Magia" + "L'Arte del Ricevere" with real text
6. CONTACT — dark section with address, phone, email, WhatsApp, social links
7. FOOTER — logo, address, copyright

MANDATORY DESIGN:
- Scroll reveal on every section (IntersectionObserver, fade + rise)
- Glassmorphism nav: transparent → solid blur on scroll
- Scroll progress bar (gold)
- Hover effects on gallery (scale + shadow)
- WhatsApp floating button (real number: ${s.contact.whatsapp})
- All responsive (mobile-first)
- Language: Italian

OUTPUT: Single self-contained index.html with ALL CSS + JS inline.`;

  const result = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 32000,
    system: `You are a world-class web designer building a €10,000+ quality website.
You MUST use ONLY the real content provided — real photos, real text, real contact info.
NEVER invent text, NEVER use stock photos, NEVER make up content.
The design must be visually STUNNING with premium animations and typography.
Output ONLY the complete HTML starting with <!DOCTYPE html>. No markdown wrapping.`,
    messages: [{ role: "user", content: userPrompt }],
  });

  let html = (result.content[0] as any).text as string;
  html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "");
  console.log(`Generated ${html.length} chars`);

  // Deploy to Vercel
  const projectName = `mc-preview-${SLUG}`;
  const raw = Buffer.from(html, "utf8");

  console.log("Deploying to Vercel...");
  const res = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: projectName,
      files: [{ file: "index.html", data: raw.toString("base64"), encoding: "base64" }],
      projectSettings: { framework: null },
      target: "production",
    }),
  });
  if (!res.ok) { console.error(await res.text()); process.exit(1); }
  const dep = (await res.json()) as { url: string };
  console.log(`Deployed: https://${dep.url}`);

  // Disable auth
  await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ passwordProtection: null, ssoProtection: null }),
  }).catch(() => {});

  console.log(`DEPLOY_URL=https://${dep.url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
