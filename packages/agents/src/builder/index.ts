import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { getTemplateConfig, generateNextJsProject, projectToPreviewHtml } from "@madecreative/shared";
import type { ProjectData } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { builderTools } from "./tools.js";
import { BUILDER_SYSTEM_PROMPT, buildBuilderUserPrompt } from "./prompt.js";
import { BuilderInputSchema } from "./types.js";
import type { Photo, ColorPalette } from "./types.js";
// generateNextJsProject + ProjectData now imported from @madecreative/shared

// ─── Sector Default Palettes (from shared template configs) ──────────────────

function getSectorPalette(sector: string): ColorPalette {
  const cfg = getTemplateConfig(sector);
  return {
    primary: cfg.colors.primary,
    accent: cfg.colors.accent,
    background: cfg.colors.background,
    text: cfg.colors.text,
  };
}

const SECTOR_DEFAULT_PALETTES: Record<string, ColorPalette> = Object.fromEntries(
  ["restaurant", "dental", "legal", "fitness", "beauty", "hotel", "ecommerce", "realestate", "medical", "professional"]
    .map((s) => [s, getSectorPalette(s)])
);

// ─── Pexels/Unsplash Fallback Keywords ───────────────────────────────────────

const SECTOR_STOCK_KEYWORDS: Record<string, string> = {
  restaurant: "restaurant food dining",
  dental: "dental clinic teeth",
  legal: "law office professional",
  fitness: "gym fitness workout",
  beauty: "beauty salon spa",
  hotel: "hotel luxury interior",
  ecommerce: "shop products retail",
  realestate: "real estate property house",
  medical: "medical clinic doctor",
  professional: "professional office business",
};

// ─── Helper: generate slug ────────────────────────────────────────────────────

function generateSlug(businessName: string, location?: string | null): string {
  return [businessName, location]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ─── Helper: fetch stock photos from Unsplash ────────────────────────────────

async function fetchStockPhotos(
  query: string,
  count = 5
): Promise<Photo[]> {
  const accessKey = process.env["UNSPLASH_ACCESS_KEY"];
  if (!accessKey) {
    // Return placeholder URLs when no key
    return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      url: `https://images.unsplash.com/photo-${1414235077428 + i * 100000}?w=1200&auto=format&fit=crop`,
      source: "unsplash" as const,
    }));
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
    const data = (await res.json()) as {
      results: Array<{ urls: { regular: string }; width: number; height: number }>;
    };
    return data.results.map((img) => ({
      url: img.urls.regular,
      source: "unsplash" as const,
      width: img.width,
      height: img.height,
    }));
  } catch {
    return [];
  }
}

// ─── Helper: attempt Pexels stock photos ─────────────────────────────────────

async function fetchPexelsPhotos(
  query: string,
  count = 5
): Promise<Photo[]> {
  const apiKey = process.env["PEXELS_API_KEY"];
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) throw new Error(`Pexels error: ${res.status}`);
    const data = (await res.json()) as {
      photos: Array<{ src: { large: string }; width: number; height: number }>;
    };
    return data.photos.map((img) => ({
      url: img.src.large,
      source: "pexels" as const,
      width: img.width,
      height: img.height,
    }));
  } catch {
    return [];
  }
}

// ─── Helper: deploy to Vercel (multi-file project) ──────────────────────────

async function deployToVercel(
  slug: string,
  files: Record<string, string>,
): Promise<{ url: string | null; warning: string | null }> {
  const token = process.env["VERCEL_TOKEN"];
  const teamId = process.env["VERCEL_TEAM_ID"];
  if (!token) {
    return {
      url: null,
      warning:
        "VERCEL_TOKEN environment variable is not set. Files saved locally but not deployed. " +
        "Set VERCEL_TOKEN to enable automatic preview deployment.",
    };
  }

  try {
    const { createHash } = await import("crypto");
    const projectName = `mc-preview-${slug}`.slice(0, 52);
    const isNextJs = "package.json" in files;
    const teamQuery = teamId ? `?teamId=${teamId}` : "";
    const teamQueryAmp = teamId ? `&teamId=${teamId}` : "";

    // Build Vercel files array with base64 + SHA-1
    const vercelFiles = Object.entries(files).map(([filePath, content]) => {
      const raw = Buffer.from(content, "utf8");
      return {
        file: filePath.startsWith("/") ? filePath.slice(1) : filePath,
        data: raw.toString("base64"),
        encoding: "base64" as const,
        sha: createHash("sha1").update(content, "utf8").digest("hex"),
        size: raw.byteLength,
      };
    });

    const payload = {
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: isNextJs ? "nextjs" : null,
      },
      target: "production",
      meta: {
        slug,
        "madecreative:preview": "true",
      },
    };

    const res = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vercel API error ${res.status}: ${body}`);
    }

    const deployment = (await res.json()) as { id: string; url: string; name: string };

    // Assign custom subdomain
    const customDomain = `${slug}.madecreative.pro`;
    try {
      await fetch(
        `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/domains?upsert=true${teamQueryAmp}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: customDomain }),
        }
      );
    } catch { /* non-fatal */ }

    // Disable Vercel auth protection
    try {
      await fetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}${teamQuery}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vercelAuthentication: { deploymentType: "none" },
            ssoProtection: null,
          }),
        }
      );
    } catch { /* non-fatal */ }

    const deployUrl = deployment.url
      ? `https://${deployment.url}`
      : `https://${customDomain}`;

    return { url: deployUrl, warning: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      url: null,
      warning: `Vercel deployment failed: ${message}. Files saved locally.`,
    };
  }
}

// ─── Helper: generate basic static HTML ──────────────────────────────────────

function generateStaticHtml(params: {
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  cta: string;
  metaTitle: string;
  metaDescription: string;
  address: string;
  phone: string;
  email: string;
  heroImageUrl: string;
  colors: ColorPalette;
  sector: string;
  fontHeading: string;
  fontBody: string;
  googleFontsUrl: string;
}): string {
  const {
    businessName, tagline, heroTitle, heroSubtitle, aboutText, cta,
    metaTitle, metaDescription, address, phone, email, heroImageUrl,
    colors, fontHeading, fontBody, googleFontsUrl,
  } = params;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}">
  <meta property="og:title" content="${metaTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:image" content="${heroImageUrl}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { overflow-x: hidden; background: ${colors.background}; color: ${colors.text}; font-family: '${fontBody}', sans-serif; }
    img { max-width: 100%; }
    a { color: inherit; transition: opacity 0.2s; }
    a:hover { opacity: 0.8; }

    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2.5rem; height: 70px;
      background: transparent;
      transition: background 0.4s ease;
    }
    nav.solid {
      background: ${colors.primary};
      box-shadow: 0 2px 20px rgba(0,0,0,0.15);
    }
    .nav-brand {
      font-family: '${fontHeading}', serif;
      font-size: 1.3rem;
      color: #ffffff;
      text-decoration: none;
    }
    .nav-links { display: flex; gap: 2rem; align-items: center; }
    .nav-links a {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    .nav-cta {
      background: ${colors.accent};
      color: ${colors.primary} !important;
      font-weight: 700;
      padding: 0.5rem 1.2rem;
      border-radius: 3px;
    }

    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background-image: url('${heroImageUrl}');
      background-size: cover;
      background-position: center;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 100%);
    }
    .hero-content {
      position: relative; z-index: 2;
      max-width: 1200px; margin: 0 auto;
      padding: 5rem 2.5rem 3rem;
      width: 100%;
    }
    .hero-tagline {
      font-size: 0.75rem;
      font-weight: 600;
      color: ${colors.accent};
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
    }
    .hero-title {
      font-family: '${fontHeading}', serif;
      font-size: clamp(2.8rem, 6vw, 5.5rem);
      font-weight: 300;
      color: #ffffff;
      line-height: 1.05;
      margin-bottom: 1.5rem;
      max-width: 700px;
    }
    .hero-divider {
      width: 60px; height: 2px;
      background: ${colors.accent};
      margin-bottom: 1.5rem;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: rgba(255,255,255,0.75);
      line-height: 1.7;
      max-width: 480px;
      margin-bottom: 2.5rem;
    }
    .hero-cta {
      display: inline-block;
      background: ${colors.accent};
      color: ${colors.primary};
      font-family: '${fontBody}', sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 1rem 2.5rem;
      border-radius: 3px;
      text-decoration: none;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      border: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .hero-cta:hover {
      transform: scale(1.03);
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    }

    section { padding: 6rem 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    .section-label {
      font-size: 0.72rem; font-weight: 600; color: ${colors.accent};
      letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 0.75rem;
    }
    .section-title {
      font-family: '${fontHeading}', serif;
      font-size: clamp(1.8rem, 3.5vw, 3rem);
      color: ${colors.primary};
      font-weight: 400;
      margin-bottom: 1.5rem;
      line-height: 1.15;
    }
    .section-divider {
      width: 50px; height: 1px;
      background: ${colors.accent};
      margin-bottom: 2rem;
    }

    .about { background: #ffffff; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
    .about-text { font-size: 1rem; line-height: 1.85; color: ${colors.text}; }

    .stats-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; }
    .stat-card {
      padding: 1.5rem;
      text-align: center;
      border-radius: 4px;
    }
    .stat-card:nth-child(odd) { background: ${colors.primary}; }
    .stat-card:nth-child(even) { background: ${colors.background}; border: 1px solid rgba(0,0,0,0.07); }
    .stat-value {
      font-family: '${fontHeading}', serif;
      font-size: 2rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .stat-card:nth-child(odd) .stat-value { color: ${colors.accent}; }
    .stat-card:nth-child(even) .stat-value { color: ${colors.primary}; }
    .stat-label { font-size: 0.78rem; }
    .stat-card:nth-child(odd) .stat-label { color: rgba(255,255,255,0.6); }
    .stat-card:nth-child(even) .stat-label { color: #888; }

    .contact-section { background: ${colors.primary}; }
    .contact-section .section-title { color: #ffffff; }
    .contact-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2.5rem; }
    .contact-item-label {
      font-size: 0.7rem; color: ${colors.accent}; letter-spacing: 0.18em;
      text-transform: uppercase; margin-bottom: 0.5rem;
    }
    .contact-item-value {
      font-size: 0.95rem; color: rgba(255,255,255,0.8);
      text-decoration: none; line-height: 1.6;
    }

    footer {
      background: #050505;
      color: rgba(255,255,255,0.35);
      padding: 2rem;
      text-align: center;
      font-size: 0.8rem;
    }

    /* Scroll reveal */
    .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }

    /* Scroll progress */
    #scroll-progress {
      position: fixed; top: 0; left: 0; height: 2px;
      background: ${colors.accent};
      z-index: 200; width: 0%; transition: width 0.1s;
    }

    @media (max-width: 768px) {
      .about-grid { grid-template-columns: 1fr !important; }
      .contact-grid { grid-template-columns: 1fr !important; }
      .nav-links { display: none; }
      .hero-content { padding: 5rem 1.5rem 3rem; }
    }
  </style>
</head>
<body>
  <div id="scroll-progress"></div>

  <nav id="main-nav">
    <a href="#" class="nav-brand">${businessName}</a>
    <div class="nav-links">
      <a href="#chi-siamo">Chi Siamo</a>
      <a href="#servizi">Servizi</a>
      <a href="#contatti">Contatti</a>
      <a href="#contatti" class="nav-cta">${cta}</a>
    </div>
  </nav>

  <section class="hero" id="hero">
    <div class="hero-bg"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <p class="hero-tagline">${tagline}</p>
      <h1 class="hero-title">${heroTitle}</h1>
      <div class="hero-divider"></div>
      <p class="hero-subtitle">${heroSubtitle}</p>
      <a href="#contatti" class="hero-cta">${cta}</a>
    </div>
  </section>

  <section class="about" id="chi-siamo">
    <div class="container">
      <div class="about-grid">
        <div class="reveal">
          <p class="section-label">Chi siamo</p>
          <h2 class="section-title">${businessName}</h2>
          <div class="section-divider"></div>
          <p class="about-text">${aboutText}</p>
        </div>
        <div class="stats-grid reveal">
          <div class="stat-card"><p class="stat-value">100%</p><p class="stat-label">Qualità garantita</p></div>
          <div class="stat-card"><p class="stat-value">★★★★★</p><p class="stat-label">Clienti soddisfatti</p></div>
          <div class="stat-card"><p class="stat-value">15+</p><p class="stat-label">Anni di esperienza</p></div>
          <div class="stat-card"><p class="stat-value">500+</p><p class="stat-label">Clienti serviti</p></div>
        </div>
      </div>
    </div>
  </section>

  <section class="contact-section" id="contatti">
    <div class="container">
      <p class="section-label" style="color:${colors.accent}">Vieni a trovarci</p>
      <h2 class="section-title">Contatti</h2>
      <div class="section-divider"></div>
      <div class="contact-grid">
        <div class="reveal">
          <p class="contact-item-label">Indirizzo</p>
          <p class="contact-item-value">${address}</p>
        </div>
        <div class="reveal">
          <p class="contact-item-label">Telefono</p>
          <a href="tel:${phone}" class="contact-item-value">${phone}</a>
        </div>
        <div class="reveal">
          <p class="contact-item-label">Email</p>
          <a href="mailto:${email}" class="contact-item-value">${email}</a>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <p>© ${new Date().getFullYear()} ${businessName}. Tutti i diritti riservati.</p>
  </footer>

  <script>
    // Nav scroll
    const nav = document.getElementById('main-nav');
    const progress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) nav.classList.add('solid');
      else nav.classList.remove('solid');
      const scrolled = document.documentElement.scrollTop;
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (progress) progress.style.width = (scrolled / total * 100) + '%';
    }, { passive: true });

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.15 });
    reveals.forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

// ─── Builder Agent ────────────────────────────────────────────────────────────

export class BuilderAgent extends BaseAgent {
  // Stored by run() so handleToolCall can access scraped content for multi-page generation
  private _scrapedContent: Record<string, unknown> | null = null;

  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return builderTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "fetch_business_photos": {
        const sector = (toolInput["sector"] as string) ?? "professional";
        const businessName = (toolInput["businessName"] as string) ?? "";
        const city = (toolInput["city"] as string | undefined) ?? "";
        const existing = (toolInput["existingPhotoUrls"] as string[] | undefined) ?? [];
        const photoQuality = (toolInput["photoQuality"] as number | undefined) ?? 0;
        const prospectId = toolInput["prospectId"] as string | undefined;

        // If we have a prospectId, try to fetch saved photos from DB
        let dbPhotos: string[] = existing;
        if (prospectId && dbPhotos.length === 0) {
          try {
            const p = await prisma.prospect.findUnique({
              where: { id: prospectId },
              select: { photoUrls: true },
            });
            if (Array.isArray(p?.photoUrls)) dbPhotos = p.photoUrls as string[];
          } catch { /* non-fatal */ }
        }

        const photos: Photo[] = [];

        // RULE: ALWAYS use original photos first. Stock is ONLY for businesses with NO photos at all.
        if (dbPhotos.length > 0) {
          const originals = dbPhotos.slice(0, 10).map((url) => ({
            url,
            source: "existing_site" as const,
            score: 8,
            scoreReason: "Original business photo — always preferred over stock",
          }));
          photos.push(...originals);
        }

        // ONLY use stock photos if the business has ZERO original photos
        if (photos.length === 0) {
          const keyword = SECTOR_STOCK_KEYWORDS[sector] ?? `${sector} ${city}`;
          const pexels = await fetchPexelsPhotos(keyword, 6);
          photos.push(...pexels);

          if (photos.length < 3) {
            const unsplash = await fetchStockPhotos(keyword, 6 - photos.length);
            photos.push(...unsplash);
          }
        }

        this.log("info", `fetch_business_photos: ${photos.length} photos (${dbPhotos.length} original, quality=${photoQuality})`, { sector, businessName });
        return photos;
      }

      case "analyze_photo_quality": {
        const rawPhotos = (toolInput["photos"] as Array<Record<string, unknown>>) ?? [];
        const sector = (toolInput["sector"] as string) ?? "professional";

        // If Claude Vision is available (photos accessible), we use it
        // For now, we apply heuristic filtering and mark all as quality 8
        const filtered: Photo[] = rawPhotos
          .filter((p) => {
            const url = p["url"] as string | undefined;
            if (!url) return false;
            // Filter out obviously bad sources
            if (url.includes("placeholder") || url.includes("loading")) return false;
            return true;
          })
          .slice(0, 10)
          .map((p) => ({
            url: p["url"] as string,
            source: (p["source"] as Photo["source"]) ?? "unsplash",
            width: p["width"] as number | undefined,
            height: p["height"] as number | undefined,
            score: 8,
            scoreReason: "Passed heuristic quality check",
          }));

        // If too few photos after filtering, top up with stock
        if (filtered.length < 3) {
          const keyword = SECTOR_STOCK_KEYWORDS[sector] ?? sector;
          const stock = await fetchStockPhotos(keyword, 3 - filtered.length);
          filtered.push(...stock.map((p) => ({ ...p, score: 7, scoreReason: "Stock photo fallback" })));
        }

        this.log("info", `analyze_photo_quality: ${filtered.length} photos approved`, { sector });
        return filtered;
      }

      case "extract_dominant_colors": {
        const sector = (toolInput["sector"] as string) ?? "professional";
        const photoUrl = toolInput["photoUrl"] as string | undefined;

        // Attempt color extraction via sharp if available
        let palette = SECTOR_DEFAULT_PALETTES[sector] ?? SECTOR_DEFAULT_PALETTES["professional"];

        if (photoUrl) {
          try {
            // Dynamic import of sharp to avoid breaking if not installed
            const sharp = await import("sharp").catch(() => null);
            if (sharp) {
              const response = await fetch(photoUrl);
              if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer());
                const { dominant } = await (sharp.default ?? sharp)(buffer)
                  .resize(50, 50)
                  .stats();

                // dominant.r, dominant.g, dominant.b are available
                const r = dominant.r;
                const g = dominant.g;
                const b = dominant.b;

                // Create dark primary from the dominant color
                const darkenFactor = 0.4;
                const primaryR = Math.round(r * darkenFactor);
                const primaryG = Math.round(g * darkenFactor);
                const primaryB = Math.round(b * darkenFactor);

                // Lighten for background
                const bgR = Math.round(255 - (255 - r) * 0.08);
                const bgG = Math.round(255 - (255 - g) * 0.08);
                const bgB = Math.round(255 - (255 - b) * 0.08);

                palette = {
                  primary: `rgb(${primaryR},${primaryG},${primaryB})`,
                  accent: `rgb(${r},${g},${b})`,
                  background: `rgb(${bgR},${bgG},${bgB})`,
                  text: `rgb(${Math.round(primaryR * 1.2)},${Math.round(primaryG * 1.2)},${Math.round(primaryB * 1.2)})`,
                };

                this.log("info", "extract_dominant_colors: extracted from photo", { palette });
              }
            }
          } catch (err) {
            this.log("warn", "extract_dominant_colors: sharp extraction failed, using sector default", {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        return palette;
      }

      case "generate_site_content": {
        const businessName = (toolInput["businessName"] as string) ?? "Business";
        const sector = (toolInput["sector"] as string) ?? "professional";
        const language = (toolInput["language"] as string) ?? "it";
        const city = (toolInput["city"] as string | undefined) ?? "";
        const description = (toolInput["description"] as string | undefined) ?? "";
        const googleRating = toolInput["googleRating"] as number | undefined;
        const topReviews = (toolInput["topReviews"] as string[] | undefined) ?? [];

        // Generate content per language
        const lang = language.toLowerCase().slice(0, 2);

        const templates: Record<string, Record<string, (params: { name: string; city: string; sector: string; description: string; rating?: number }) => Record<string, string>>> = {
          it: {
            restaurant: ({ name, city, description: desc }) => ({
              tagline: "Cucina autentica, sapori indimenticabili",
              heroTitle: `Benvenuti da ${name}`,
              heroSubtitle: desc || `Scopri la nostra cucina tradizionale nel cuore di ${city || "città"}. Ingredienti freschi, ricette tramandate di generazione in generazione.`,
              aboutText: desc || `${name} è molto più di un ristorante. È un luogo dove le tradizioni culinarie si incontrano con la passione per la qualità. Ogni piatto è preparato con ingredienti selezionati e amore per il buon cibo.`,
              cta: "Prenota un tavolo",
              metaTitle: `${name} | Ristorante${city ? ` a ${city}` : ""}`,
              metaDescription: desc ? desc.slice(0, 155) : `Scopri ${name}: cucina tradizionale${city ? ` a ${city}` : ""}, ingredienti freschi e un'atmosfera unica.`,
            }),
            dental: ({ name, city }) => ({
              tagline: "Il tuo sorriso, la nostra priorità",
              heroTitle: `Studio Dentistico ${name}`,
              heroSubtitle: `Cura professionale dei denti con tecnologie moderne${city ? ` a ${city}` : ""}. Prenota la tua visita oggi.`,
              aboutText: `Lo Studio Dentistico ${name} offre trattamenti all'avanguardia in un ambiente confortevole e accogliente. Il nostro team di specialisti è dedicato alla salute del tuo sorriso.`,
              cta: "Prenota una visita",
              metaTitle: `${name} | Studio Dentistico${city ? ` ${city}` : ""}`,
              metaDescription: `Studio dentistico ${name}${city ? ` a ${city}` : ""}. Trattamenti professionali, tecnologie moderne e personale qualificato.`,
            }),
            default: ({ name, city, sector: sec }) => ({
              tagline: "Qualità e professionalità al tuo servizio",
              heroTitle: name,
              heroSubtitle: `Servizi professionali di alta qualità${city ? ` a ${city}` : ""}. Contattaci per una consulenza personalizzata.`,
              aboutText: `${name} offre servizi professionali con anni di esperienza nel settore ${sec}. La nostra priorità è la soddisfazione del cliente.`,
              cta: "Contattaci",
              metaTitle: `${name}${city ? ` | ${city}` : ""}`,
              metaDescription: `${name}: servizi professionali${city ? ` a ${city}` : ""}. Qualità, affidabilità e professionalità.`,
            }),
          },
        };

        const langTemplates = templates[lang] ?? templates["it"] ?? {};
        const templateFn =
          (langTemplates[sector] ?? langTemplates["default"]) as
            | ((p: { name: string; city: string; sector: string; description: string; rating?: number }) => Record<string, string>)
            | undefined;

        const defaultFn = (langTemplates["default"] as
          | ((p: { name: string; city: string; sector: string; description: string; rating?: number }) => Record<string, string>)
          | undefined);

        const generated = (templateFn ?? defaultFn)?.(
          { name: businessName, city: city ?? "", sector, description, rating: googleRating }
        ) ?? {
          tagline: businessName,
          heroTitle: businessName,
          heroSubtitle: description || `Benvenuti da ${businessName}`,
          aboutText: description || `${businessName} offre servizi di qualità.`,
          cta: "Contattaci",
          metaTitle: businessName,
          metaDescription: description?.slice(0, 155) || businessName,
        };

        this.log("info", "generate_site_content: content generated", { lang, sector });
        return generated;
      }

      case "build_preview_site": {
        const slug = toolInput["slug"] as string;
        const sector = (toolInput["sector"] as string) ?? "professional";
        const businessData = (toolInput["businessData"] as Record<string, unknown>) ?? {};
        const photos = (toolInput["photos"] as Array<Record<string, unknown>>) ?? [];
        const colors = (toolInput["colors"] as ColorPalette) ??
          SECTOR_DEFAULT_PALETTES[sector] ??
          SECTOR_DEFAULT_PALETTES["professional"]!;

        // Use shared template config for consistent fonts across all surfaces
        const templateCfg = getTemplateConfig(sector);
        const fonts = {
          heading: templateCfg.fonts.heading,
          body: templateCfg.fonts.body,
          fontsUrl: templateCfg.fonts.googleFontsUrl,
        };

        const heroImageUrl = photos[0]?.["url"] as string | undefined ??
          `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop`;

        // Generate premium Next.js project with React components + Framer Motion
        const projectData: ProjectData = {
          businessName: (businessData["businessName"] as string) ?? "Business",
          tagline: (businessData["tagline"] as string) ?? "",
          description: (businessData["description"] as string) ?? (businessData["heroSubtitle"] as string) ?? "",
          aboutText: (businessData["aboutText"] as string) ?? undefined,
          heroTitle: (businessData["heroTitle"] as string) ?? (businessData["businessName"] as string) ?? "Business",
          heroSubtitle: (businessData["heroSubtitle"] as string) ?? "",
          heroImage: heroImageUrl,
          cta: (businessData["cta"] as string) ?? "Contattaci",
          metaTitle: (businessData["metaTitle"] as string) ?? (businessData["businessName"] as string) ?? "Business",
          metaDescription: (businessData["metaDescription"] as string) ?? "",
          address: (businessData["address"] as string) ?? "Su richiesta",
          phone: (businessData["phone"] as string) ?? "Su richiesta",
          email: (businessData["email"] as string) ?? "info@business.com",
          website: (businessData["website"] as string) ?? undefined,
          sector,
          language: (businessData["language"] as string) ?? "it",
          colors,
          galleryImages: photos.slice(0, 6).map((p) => ({ url: p["url"] as string, alt: (p["alt"] as string) ?? undefined })),
          menuItems: (businessData["menuItems"] as ProjectData["menuItems"]) ?? undefined,
          testimonials: (businessData["testimonials"] as ProjectData["testimonials"]) ?? undefined,
          openingHours: (businessData["openingHours"] as ProjectData["openingHours"]) ?? undefined,
          googleRating: businessData["googleRating"] as number | undefined,
          reviewCount: businessData["reviewCount"] as number | undefined,
          socialLinks: businessData["socialLinks"] as ProjectData["socialLinks"] | undefined,
          googleMapsEmbedUrl: (businessData["googleMapsEmbedUrl"] as string) ?? undefined,
        };

        // ── Generate premium site using AI — SAME quality as bolt.diy editor ──
        // Uses identical design system prompt so campaigns and editor produce
        // visually consistent €10k+ sites.

        const fontMap: Record<string, [string, string]> = {
          restaurant: ["Cormorant Garamond", "DM Sans"],
          dental: ["Outfit", "Nunito Sans"],
          legal: ["Libre Baskerville", "Source Sans 3"],
          fitness: ["Bebas Neue", "Barlow"],
          beauty: ["Playfair Display", "Raleway"],
          hotel: ["Cormorant Garamond", "DM Sans"],
          ecommerce: ["Space Grotesk", "Inter"],
          realestate: ["Syne", "Work Sans"],
          medical: ["Outfit", "Nunito Sans"],
          professional: ["Space Grotesk", "Inter"],
        };
        const [fontHeading, fontBody] = fontMap[sector] ?? ["Playfair Display", "Raleway"];

        // ── Detect multi-page vs single-page from scraped content ──
        const scrapedPages = (this._scrapedContent as { pages?: Array<Record<string, unknown>> } | null)?.pages ?? [];
        // Deduplicate pages by normalized URL
        const seenUrls = new Set<string>();
        const uniquePages: Array<Record<string, unknown>> = [];
        for (const p of scrapedPages) {
          const norm = ((p.url as string) ?? "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
          if (!norm || seenUrls.has(norm)) continue;
          seenUrls.add(norm);
          if (((p.headings as unknown[])?.length ?? 0) > 0 || ((p.paragraphs as unknown[])?.length ?? 0) > 0) {
            uniquePages.push(p);
          }
        }
        const isMultiPage = uniquePages.length > 1;
        this.log("info", `build_preview_site: ${isMultiPage ? "MULTI-PAGE" : "SINGLE-PAGE"} (${uniquePages.length} unique pages from scrape)`);

        const systemPrompt = `You are a world-class web designer who builds €10,000+ quality websites.
Use ONLY the real content provided — real photos, real text, real contact info.
NEVER invent text, NEVER use stock/placeholder images. Every <img> must use a provided URL.

DESIGN SYSTEM:
- Fonts: "${fontHeading}" (headings) + "${fontBody}" (body) via Google Fonts <link>
- Colors: primary=${colors.primary}, accent=${colors.accent}, background=${colors.background}, text=${colors.text}
- Hero heading: clamp(3rem, 7vw, 6rem), font-weight 300
- Nav: fixed, glassmorphism (transparent → solid blur on scroll)
- Scroll reveal on every section (IntersectionObserver, fade + rise)
- Scroll progress bar (accent color)
- All responsive (mobile-first, works at 375px)
- WhatsApp floating button if number available

OUTPUT: Create files using write_file. Each file is a self-contained HTML with inline CSS + JS. NEVER ask questions — build immediately.`;

        let projectFiles: Record<string, string> = {};
        try {
          if (isMultiPage) {
            // ── MULTI-PAGE: generate one HTML per scraped page ──
            const baseUrl = (scrapedPages[0]?.url as string)?.replace(/^https?:\/\/(www\.)?[^/]+/, "") ?? "";
            const urlToPath = (url: string): string => {
              let path = url.replace(/^https?:\/\/(www\.)?[^/]+/, "").replace(/\/$/, "");
              if (!path || path === "") return "index.html";
              return path.replace(/^\//, "") + "/index.html";
            };

            // Build nav from top-level pages
            const navItems = uniquePages
              .filter(p => (urlToPath(p.url as string).split("/").length <= 2))
              .map(p => {
                const h1 = ((p.headings as Array<{ level: number; text: string }>) ?? []).find(h => h.level === 1)?.text || (p.title as string) || "";
                const href = "/" + urlToPath(p.url as string).replace("/index.html", "/").replace("index.html", "");
                return `<a href="${href}">${h1}</a>`;
              }).join("\n");

            for (let i = 0; i < uniquePages.length; i++) {
              const page = uniquePages[i]!;
              const localPath = urlToPath(page.url as string);
              const isHome = localPath === "index.html";
              const pageTitle = ((page.headings as Array<{ level: number; text: string }>) ?? []).find(h => h.level === 1)?.text || (page.title as string) || projectData.businessName;

              // Collect page images
              const pageImgs = ((page.images as Array<{ url: string; alt?: string }>) ?? [])
                .filter(img => img.url?.startsWith("http") && /\.(jpg|jpeg|png|webp)/i.test(img.url) && !/dummy|plugin|admin|icon|sprite/i.test(img.url))
                .slice(0, 10)
                .map((img, j) => `${j + 1}. ${img.url}${img.alt ? ` — "${img.alt}"` : ""}`).join("\n");

              const pageHeadings = ((page.headings as Array<{ level: number; text: string }>) ?? [])
                .filter(h => h.text?.length > 2).slice(0, 10)
                .map(h => `h${h.level}: ${h.text}`).join("\n");

              const pageParas = ((page.paragraphs as string[]) ?? [])
                .filter(t => t.length > 20).slice(0, 10)
                .map((t, j) => `${j + 1}. ${t.slice(0, 300)}`).join("\n");

              const pagePrompt = isHome
                ? `Build the HOME PAGE for "${projectData.businessName}". Full-screen hero (100vh), intro sections linking to sub-pages, gallery preview, contact section.`
                : `Build the "${pageTitle}" INTERNAL PAGE. Hero banner (~50vh), page content with real text and photos, gallery if multiple images.`;

              this.log("info", `build_preview_site: generating page ${i + 1}/${uniquePages.length}: ${localPath}`);

              const pageResult = await this.client.toolUseLoop(
                [{ role: "user", content: `${pagePrompt}

NAVIGATION (include on every page): ${navItems}

REAL CONTENT FOR THIS PAGE:
PHOTOS: ${pageImgs || "No page-specific photos."}
HEADINGS: ${pageHeadings}
TEXT: ${pageParas || "No paragraphs — show photo gallery."}
CONTACT: Phone: ${projectData.phone}, Email: ${projectData.email}, Address: ${projectData.address}
Logo: ${projectData.heroImage}

CRITICAL: Use ONLY the provided photo URLs. NEVER use placeholder or stock images.
Output file path: ${localPath}` }],
                async (toolName, input) => {
                  if (toolName === "write_file") {
                    const path = input["path"] as string;
                    const content = input["content"] as string;
                    if (path && content) { projectFiles[path] = content; return { success: true, path }; }
                  }
                  return { error: "Unknown tool" };
                },
                {
                  system: systemPrompt,
                  tools: [{ name: "write_file", description: "Create a project file", input_schema: { type: "object" as const, properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } }],
                  model: "claude-sonnet-4-6" as const,
                  maxTokens: 16000,
                }
              );
              this.totalCost += pageResult.cost;
              this.totalInputTokens += pageResult.inputTokens;
              this.totalOutputTokens += pageResult.outputTokens;
            }
          } else {
            // ── SINGLE-PAGE: generate one index.html ──
            const allPhotos = photos.slice(0, 12).map((p, i) => `${i + 1}. ${(p as Record<string, unknown>).url ?? p}`).join("\n");

            const aiPrompt = `Build a COMPLETE premium single-page website for "${projectData.businessName}" (sector: ${sector}).

REAL CONTENT (never invent data):
- Business: ${projectData.businessName}
- Hero title: ${projectData.heroTitle}
- Description: ${projectData.description}
- Hero image: ${projectData.heroImage}
- Address: ${projectData.address}
- Phone: ${projectData.phone}
- Email: ${projectData.email}
${allPhotos ? `Photos:\n${allPhotos}` : ""}
${projectData.googleRating ? `Google Rating: ${projectData.googleRating}/5 (${projectData.reviewCount ?? 0}+ reviews)` : ""}

MANDATORY: Hero (100vh), About, Services, Gallery, Testimonials, Contact, Footer.
CRITICAL: Use ONLY provided photo URLs. NEVER use stock images.
OUTPUT: write_file with path "index.html".`;

            const aiResult = await this.client.toolUseLoop(
              [{ role: "user", content: aiPrompt }],
              async (toolName, input) => {
                if (toolName === "write_file") {
                  const path = input["path"] as string;
                  const content = input["content"] as string;
                  if (path && content) { projectFiles[path] = content; return { success: true, path }; }
                }
                return { error: "Unknown tool" };
              },
              {
                system: systemPrompt,
                tools: [{ name: "write_file", description: "Create a project file", input_schema: { type: "object" as const, properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } }],
                model: "claude-sonnet-4-6" as const,
                maxTokens: 32000,
              }
            );
            this.totalCost += aiResult.cost;
            this.totalInputTokens += aiResult.inputTokens;
            this.totalOutputTokens += aiResult.outputTokens;
          }
          this.log("info", `build_preview_site: AI generated ${Object.keys(projectFiles).length} files`);
        } catch (aiErr) {
          this.log("warn", `build_preview_site: AI generation failed, falling back to template: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`);
          // Fallback to static template if AI fails
          projectFiles = generateNextJsProject(projectData);
        }

        if (Object.keys(projectFiles).length === 0) {
          projectFiles = generateNextJsProject(projectData);
          this.log("info", `build_preview_site: used template fallback (${Object.keys(projectFiles).length} files)`);
        }

        // Save project files to ClientWebsite if prospect has one
        if (this.agentType === "BUILDER") {
          try {
            const prospect = await prisma.prospect.findUnique({
              where: { id: toolInput["prospectId"] as string ?? "" },
              select: { clientId: true },
            });
            if (prospect?.clientId) {
              const existing = await prisma.clientWebsite.findFirst({
                where: { clientId: prospect.clientId, isActive: true },
                select: { id: true },
              });
              if (existing) {
                await prisma.clientWebsite.update({ where: { id: existing.id }, data: { files: projectFiles } });
              } else {
                await prisma.clientWebsite.create({ data: { clientId: prospect.clientId, files: projectFiles, domain: slug, pages: projectFiles, name: slug } });
              }
            }
          } catch {
            // Non-critical — project files saved but client record may not exist yet
          }
        }

        // Deploy full project files to Vercel (multi-file deploy)
        // Falls back to single HTML if the project has no package.json
        const hasPackageJson = "package.json" in projectFiles;
        let deployFiles = projectFiles;

        if (!hasPackageJson) {
          // No package.json → deploy as static HTML
          const htmlContent = projectToPreviewHtml(projectFiles);
          deployFiles = { "index.html": htmlContent };
          this.log("info", "build_preview_site: no package.json, deploying as static HTML");
        } else {
          this.log("info", `build_preview_site: deploying ${Object.keys(projectFiles).length} files as Next.js project`);
        }

        // Save project files to temp dir for debugging
        const outputDir = `/tmp/preview-${slug}`;
        try {
          const fs = await import("fs/promises");
          await fs.mkdir(outputDir, { recursive: true });
          for (const [filePath, content] of Object.entries(projectFiles)) {
            const fullPath = `${outputDir}/${filePath}`;
            const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, "utf-8");
          }
          this.log("info", `build_preview_site: ${Object.keys(projectFiles).length} files saved to ${outputDir}`);
        } catch (err) {
          this.log("warn", "build_preview_site: could not save to disk", {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        // Deploy to Vercel
        const { url, warning } = await deployToVercel(slug, deployFiles);

        if (warning) {
          this.log("warn", "build_preview_site: deployment warning", { warning });
        }

        return {
          previewUrl: url ?? `http://localhost:3000/preview/${slug}`,
          outputDir,
          warning,
          slug,
          sector,
          colors,
          photoCount: photos.length,
          status: url ? "PREVIEW_READY" : "BUILD_ONLY",
        };
      }

      case "take_screenshot": {
        const previewUrl = toolInput["previewUrl"] as string;
        const slug = (toolInput["slug"] as string) ?? "preview";

        try {
          const { chromium } = await import("playwright");
          const browser = await chromium.launch({ args: ["--no-sandbox"] });

          const screenshots: { desktop?: string; mobile?: string } = {};

          // Desktop
          const desktopPage = await browser.newPage();
          await desktopPage.setViewportSize({ width: 1440, height: 900 });
          await desktopPage.goto(previewUrl, { waitUntil: "networkidle", timeout: 30000 });
          await desktopPage.waitForTimeout(1500);
          const desktopBuffer = await desktopPage.screenshot({ fullPage: false });
          await desktopPage.close();

          // Mobile
          const mobilePage = await browser.newPage();
          await mobilePage.setViewportSize({ width: 390, height: 844 });
          await mobilePage.goto(previewUrl, { waitUntil: "networkidle", timeout: 30000 });
          await mobilePage.waitForTimeout(1500);
          const mobileBuffer = await mobilePage.screenshot({ fullPage: false });
          await mobilePage.close();

          await browser.close();

          // Try to upload to R2 if configured
          const r2AccountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
          const r2AccessKey = process.env["CLOUDFLARE_R2_ACCESS_KEY_ID"];
          const r2SecretKey = process.env["CLOUDFLARE_R2_SECRET_ACCESS_KEY"];
          const r2Bucket = process.env["CLOUDFLARE_R2_BUCKET"] ?? "madecreative-previews";

          if (r2AccountId && r2AccessKey && r2SecretKey) {
            try {
              const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
              const s3 = new S3Client({
                region: "auto",
                endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
                credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
              });

              const desktopKey = `screenshots/${slug}-desktop.jpg`;
              const mobileKey = `screenshots/${slug}-mobile.jpg`;

              await Promise.all([
                s3.send(new PutObjectCommand({
                  Bucket: r2Bucket,
                  Key: desktopKey,
                  Body: desktopBuffer,
                  ContentType: "image/jpeg",
                })),
                s3.send(new PutObjectCommand({
                  Bucket: r2Bucket,
                  Key: mobileKey,
                  Body: mobileBuffer,
                  ContentType: "image/jpeg",
                })),
              ]);

              const r2PublicUrl = process.env["CLOUDFLARE_R2_PUBLIC_URL"] ?? `https://pub-${r2AccountId}.r2.dev`;
              screenshots.desktop = `${r2PublicUrl}/${desktopKey}`;
              screenshots.mobile = `${r2PublicUrl}/${mobileKey}`;
            } catch (r2Err) {
              this.log("warn", "take_screenshot: R2 upload failed, saving locally", {
                error: r2Err instanceof Error ? r2Err.message : String(r2Err),
              });
              // Save locally as fallback
              const fs = await import("fs/promises");
              await fs.mkdir(`/tmp/preview-${slug}`, { recursive: true });
              await fs.writeFile(`/tmp/preview-${slug}/screenshot-desktop.jpg`, desktopBuffer);
              await fs.writeFile(`/tmp/preview-${slug}/screenshot-mobile.jpg`, mobileBuffer);
            }
          } else {
            // Save locally when R2 not configured
            const fs = await import("fs/promises");
            await fs.mkdir(`/tmp/preview-${slug}`, { recursive: true });
            await fs.writeFile(`/tmp/preview-${slug}/screenshot-desktop.jpg`, desktopBuffer);
            await fs.writeFile(`/tmp/preview-${slug}/screenshot-mobile.jpg`, mobileBuffer);
            this.log("info", "take_screenshot: saved locally (R2 not configured)");
          }

          return {
            screenshotDesktopUrl: screenshots.desktop ?? `/tmp/preview-${slug}/screenshot-desktop.jpg`,
            screenshotMobileUrl: screenshots.mobile ?? `/tmp/preview-${slug}/screenshot-mobile.jpg`,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.log("warn", `take_screenshot: failed — ${message}`);
          return {
            screenshotDesktopUrl: null,
            screenshotMobileUrl: null,
            error: message,
          };
        }
      }

      case "update_prospect_preview": {
        const prospectId = toolInput["prospectId"] as string | undefined;
        if (!prospectId) {
          this.log("warn", "update_prospect_preview: no prospectId provided");
          return { updated: false, reason: "No prospectId provided" };
        }

        const previewSiteUrl = toolInput["previewSiteUrl"] as string;
        const screenshotDesktopUrl = toolInput["screenshotDesktopUrl"] as string | undefined;
        const screenshotMobileUrl = toolInput["screenshotMobileUrl"] as string | undefined;

        const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
        if (!prospect) {
          return { updated: false, reason: `Prospect ${prospectId} not found` };
        }

        await prisma.prospect.update({
          where: { id: prospectId },
          data: {
            previewSiteUrl,
            previewGeneratedAt: new Date(),
            status: "PREVIEW_GENERATED",
          },
        });

        this.log("info", `update_prospect_preview: prospect ${prospectId} updated`, {
          previewSiteUrl,
          screenshotDesktopUrl,
          screenshotMobileUrl,
        });

        return {
          updated: true,
          prospectId,
          previewSiteUrl,
          status: "PREVIEW_GENERATED",
        };
      }

      // ─── Legacy tools (backwards compat) ──────────────────────────────────

      case "fetch_template": {
        const slug = (toolInput["templateSlug"] as string) ?? "professional";
        return {
          slug,
          pages: ["home", "about", "services", "contact"],
          defaultSections: {
            home: ["hero", "features", "cta", "testimonials"],
            about: ["story", "team", "values"],
            services: ["services-grid", "pricing", "faq"],
            contact: ["contact-form", "map", "info"],
          },
        };
      }

      case "generate_page_content": {
        const pageType = toolInput["pageType"] as string;
        const biz = (toolInput["businessInfo"] as Record<string, string>) ?? {};
        return {
          pageType,
          title: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} - ${biz["name"] ?? "Business"}`,
          content: `Generated ${pageType} content for ${biz["name"] ?? "Business"}`,
        };
      }

      case "select_design_tokens": {
        const sector = ((toolInput["sector"] as string) ?? "professional").toLowerCase();
        const palette = SECTOR_DEFAULT_PALETTES[sector] ?? SECTOR_DEFAULT_PALETTES["professional"]!;
        return {
          primaryColor: palette.primary,
          secondaryColor: palette.background,
          accentColor: palette.accent,
          fontHeading: "Playfair Display",
          fontBody: "Nunito",
          borderRadius: "4px",
        };
      }

      case "save_website": {
        const {
          clientId,
          websiteId,
          name,
          pages,
          designTokens,
          seoConfig,
        } = toolInput as {
          clientId: string;
          websiteId?: string;
          name: string;
          pages: unknown[];
          designTokens: Record<string, string>;
          seoConfig?: Record<string, unknown>;
        };

        let website;
        if (websiteId) {
          website = await prisma.clientWebsite.update({
            where: { id: websiteId },
            data: {
              pages: pages as never,
              designTokens,
              updatedAt: new Date(),
            },
          });
        } else {
          website = await prisma.clientWebsite.create({
            data: {
              clientId,
              domain: name,
              pages: pages as never,
              designTokens,
            },
          });
        }

        return { websiteId: website.id };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = BuilderInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
    }

    const startTime = Date.now();

    try {
      await this.markJobStarted();
      await this.updateProgress(5);

      // Resolve business data from either clientId or prospectId
      let businessData: {
        companyName: string;
        sector: string;
        country: string;
        language: string;
        city?: string | null;
        description?: string | null;
        googleRating?: number | null;
        reviewCount?: number | null;
        website?: string | null;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        id: string;
        isProspect: boolean;
        existingPhotoUrls?: string[];
        logoUrl?: string | null;
        photoQuality?: number | null;
      } | null = null;

      if (parsed.data.prospectId) {
        const prospect = await prisma.prospect.findUnique({
          where: { id: parsed.data.prospectId },
        });
        if (!prospect) {
          const error = `Prospect ${parsed.data.prospectId} not found`;
          await this.markJobFailed(error);
          return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
        }
        // ── Scrape website if prospect has one but no scrapedContent yet ──
        let scrapedData: Record<string, unknown> | null = prospect.scrapedContent as Record<string, unknown> | null;
        if (prospect.website && !scrapedData) {
          this.log("info", `Scraping website: ${prospect.website}`);
          try {
            const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";
            const scrapeRes = await fetch(`${apiBase}/public/signup/analyze-url`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: prospect.website, generatePreview: false }),
            });
            if (scrapeRes.ok) {
              const scrapeJson = await scrapeRes.json() as { data?: { scraped?: Record<string, unknown> } };
              scrapedData = scrapeJson.data?.scraped ?? null;
              if (scrapedData) {
                // Persist scraped content for future use
                await prisma.prospect.update({
                  where: { id: prospect.id },
                  data: { scrapedContent: scrapedData as object },
                });
                this.log("info", `Scraped content saved: ${(scrapedData.pages as unknown[])?.length ?? 0} pages`);
              }
            }
          } catch (err) {
            this.log("warn", `Website scrape failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Derive language from country
        const langMap: Record<string, string> = { IT: "it", DE: "de", FR: "fr", ES: "es", PT: "pt", NL: "nl", AT: "de", CH: "de", BE: "fr" };
        const language = langMap[prospect.country.toUpperCase()] ?? "en";

        // Extract photos + contact from scraped data if available
        const scraped = scrapedData as { contact?: Record<string, string>; logo?: string; pages?: Array<{ images?: Array<{ url: string; alt?: string }>; headings?: Array<{ level: number; text: string }>; paragraphs?: string[] }> } | null;
        const scrapedPhotos: string[] = [];
        if (scraped?.pages) {
          const seen = new Set<string>();
          for (const p of scraped.pages) {
            for (const img of p.images ?? []) {
              const url = typeof img === "string" ? img : img.url;
              if (url?.startsWith("http") && !seen.has(url) && /\.(jpg|jpeg|png|webp)/i.test(url) && !/dummy|plugin|admin|icon|sprite|pixel/i.test(url)) {
                seen.add(url);
                scrapedPhotos.push(url);
              }
            }
          }
        }

        businessData = {
          companyName: prospect.companyName,
          sector: prospect.sector,
          country: prospect.country,
          language,
          city: prospect.city,
          description: prospect.aiAnalysis ?? null,
          googleRating: prospect.googleRating,
          reviewCount: prospect.reviewCount,
          website: prospect.website,
          phone: scraped?.contact?.phone ?? prospect.contactPhone,
          email: scraped?.contact?.email ?? prospect.contactEmail,
          address: scraped?.contact?.address ?? null,
          id: prospect.id,
          isProspect: true,
          existingPhotoUrls: scrapedPhotos.length > 0 ? scrapedPhotos : (Array.isArray(prospect.photoUrls) ? (prospect.photoUrls as string[]) : []),
          logoUrl: (scraped?.logo as string) ?? prospect.logoUrl,
          photoQuality: scrapedPhotos.length > 0 ? 80 : prospect.photoQuality,
          scrapedContent: scrapedData,
        };
      } else if (parsed.data.clientId) {
        const client = await prisma.client.findUnique({
          where: { id: parsed.data.clientId },
        });
        if (!client) {
          const error = `Client ${parsed.data.clientId} not found`;
          await this.markJobFailed(error);
          return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
        }
        businessData = {
          companyName: client.companyName,
          sector: client.sector,
          country: client.country,
          language: client.language,
          city: client.city,
          description: null,
          googleRating: null,
          reviewCount: null,
          website: null,
          phone: client.phone ?? null,
          email: client.email,
          address: null,
          id: client.id,
          isProspect: false,
        };
      } else {
        const error = "Either clientId or prospectId must be provided";
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      // Store scraped content for multi-page generation in handleToolCall
      this._scrapedContent = (businessData as Record<string, unknown>).scrapedContent as Record<string, unknown> | null ?? null;

      await this.updateProgress(15);
      this.log("info", "Builder agent: starting build", {
        business: businessData.companyName,
        sector: businessData.sector,
        hasScrapedContent: Boolean(this._scrapedContent),
      });

      const userPrompt = buildBuilderUserPrompt({
        businessName: businessData.companyName,
        sector: businessData.sector,
        country: businessData.country,
        language: businessData.language,
        city: businessData.city,
        description: businessData.description,
        googleRating: businessData.googleRating,
        reviewCount: businessData.reviewCount,
        website: businessData.website,
        phone: businessData.phone,
        email: businessData.email,
        address: businessData.address,
        existingPhotoUrls: businessData.existingPhotoUrls ?? [],
        prospectId: businessData.isProspect ? businessData.id : undefined,
        templateSlug: parsed.data.templateSlug,
        customizations: parsed.data.customizations,
      });

      await this.updateProgress(20);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        BUILDER_SYSTEM_PROMPT
      );

      await this.updateProgress(90);

      const output = {
        businessId: businessData.id,
        isProspect: businessData.isProspect,
        sector: businessData.sector,
        ...(result.data as Record<string, unknown>),
        apiCost: this.totalCost,
        durationMs: Date.now() - startTime,
      };

      await this.markJobCompleted(output);
      this.log("info", "Builder agent: completed successfully", {
        business: businessData.companyName,
      });

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Builder agent failed: ${error}`);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: Date.now() - startTime,
        toolCalls: this.toolCalls,
      };
    }
  }
}
