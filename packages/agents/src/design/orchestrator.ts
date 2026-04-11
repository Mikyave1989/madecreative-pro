// ─── Design Pipeline Orchestrator ─────────────────────────────────────────────
// Coordinates the full design pipeline:
//   1. Research Agent → scrapes original site content
//   2. Stitch Agent → generates premium UI via Google Stitch
//   3. UI Component Agent → assembles premium animations & effects
//   4. Outputs unified DesignSpec for landing page, portal, and campaign
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DesignSpec,
  DesignPipelineInput,
  DesignPipelineOutput,
  ColorSystem,
  TypographySystem,
  LayoutSystem,
  SectionDefinition,
  BrandAsset,
  ScrapedContent,
} from "./types.js";
import { SiteResearchAgent } from "./research-agent.js";
import { getStitchClient } from "./stitch-client.js";
import {
  getVariantForSection,
  getAllEffectsForSite,
  PREMIUM_ANIMATIONS,
} from "./ui-components.js";

// ─── Sector Defaults ──────────────────────────────────────────────────────────

const SECTOR_DEFAULTS: Record<string, {
  colors: ColorSystem;
  typography: TypographySystem;
  sections: string[];
}> = {
  restaurant: {
    colors: {
      primary: "#1a1208", secondary: "#3d2e1a", accent: "#c9a84c",
      background: "#faf8f4", surface: "#ffffff", text: "#2d2419",
      textMuted: "#8a7d6f", border: "rgba(0,0,0,0.07)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Cormorant Garamond", bodyFont: "DM Sans", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap",
      scale: { hero: "clamp(3.2rem, 7vw, 6.5rem)", h1: "clamp(2.5rem, 5vw, 4.5rem)", h2: "clamp(1.8rem, 3.5vw, 3rem)", h3: "clamp(1.3rem, 2.5vw, 2rem)", h4: "clamp(1.1rem, 2vw, 1.5rem)", body: "1rem", small: "0.875rem", xs: "0.72rem" },
      headingWeight: 300, bodyWeight: 400,
      lineHeight: { heading: 1.05, body: 1.75 },
      letterSpacing: { heading: "-0.02em", label: "0.22em", body: "0em" },
    },
    sections: ["hero", "about", "services", "gallery", "testimonials", "contact"],
  },
  dental: {
    colors: {
      primary: "#0a2540", secondary: "#1a3a5c", accent: "#00b4d8",
      background: "#f0f8ff", surface: "#ffffff", text: "#1a3050",
      textMuted: "#6b8aab", border: "rgba(0,0,0,0.06)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Outfit", bodyFont: "Source Sans 3", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap",
      scale: { hero: "clamp(2.8rem, 6vw, 5.5rem)", h1: "clamp(2.2rem, 4.5vw, 4rem)", h2: "clamp(1.6rem, 3vw, 2.5rem)", h3: "clamp(1.2rem, 2.2vw, 1.8rem)", h4: "clamp(1rem, 1.8vw, 1.4rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 500, bodyWeight: 400,
      lineHeight: { heading: 1.15, body: 1.7 },
      letterSpacing: { heading: "-0.01em", label: "0.15em", body: "0em" },
    },
    sections: ["hero", "services", "team", "testimonials", "contact"],
  },
  legal: {
    colors: {
      primary: "#1a1a2e", secondary: "#2d2d48", accent: "#c5a028",
      background: "#f8f7f4", surface: "#ffffff", text: "#2d2d3e",
      textMuted: "#6b6b7b", border: "rgba(0,0,0,0.06)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Libre Baskerville", bodyFont: "Karla", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap",
      scale: { hero: "clamp(2.5rem, 5.5vw, 5rem)", h1: "clamp(2rem, 4vw, 3.5rem)", h2: "clamp(1.5rem, 3vw, 2.5rem)", h3: "clamp(1.2rem, 2vw, 1.8rem)", h4: "clamp(1rem, 1.5vw, 1.3rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 400, bodyWeight: 400,
      lineHeight: { heading: 1.2, body: 1.8 },
      letterSpacing: { heading: "0em", label: "0.18em", body: "0em" },
    },
    sections: ["hero", "about", "services", "team", "testimonials", "contact"],
  },
  fitness: {
    colors: {
      primary: "#0d0d0d", secondary: "#1a1a1a", accent: "#ff3d00",
      background: "#111111", surface: "#1a1a1a", text: "#f5f5f5",
      textMuted: "#888888", border: "rgba(255,255,255,0.08)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Bebas Neue", bodyFont: "Barlow", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
      scale: { hero: "clamp(3.5rem, 8vw, 7rem)", h1: "clamp(2.8rem, 6vw, 5rem)", h2: "clamp(2rem, 4vw, 3.5rem)", h3: "clamp(1.4rem, 2.5vw, 2rem)", h4: "clamp(1.1rem, 2vw, 1.5rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 400, bodyWeight: 400,
      lineHeight: { heading: 1.0, body: 1.65 },
      letterSpacing: { heading: "0.05em", label: "0.25em", body: "0em" },
    },
    sections: ["hero", "about", "services", "gallery", "testimonials", "contact"],
  },
  beauty: {
    colors: {
      primary: "#2a1f1a", secondary: "#4a3a30", accent: "#c9967a",
      background: "#fdf8f5", surface: "#ffffff", text: "#3d2e26",
      textMuted: "#9a8a7e", border: "rgba(0,0,0,0.05)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Tenor Sans", bodyFont: "Questrial", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tenor+Sans&family=Questrial&display=swap",
      scale: { hero: "clamp(2.8rem, 6vw, 5.5rem)", h1: "clamp(2.2rem, 4.5vw, 4rem)", h2: "clamp(1.6rem, 3vw, 2.5rem)", h3: "clamp(1.2rem, 2.2vw, 1.8rem)", h4: "clamp(1rem, 1.8vw, 1.4rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 400, bodyWeight: 400,
      lineHeight: { heading: 1.15, body: 1.75 },
      letterSpacing: { heading: "0.02em", label: "0.2em", body: "0em" },
    },
    sections: ["hero", "about", "services", "gallery", "testimonials", "contact"],
  },
  hotel: {
    colors: {
      primary: "#1c1610", secondary: "#3a2e22", accent: "#c9a84c",
      background: "#f9f6f0", surface: "#ffffff", text: "#2c2418",
      textMuted: "#8a7d6f", border: "rgba(0,0,0,0.06)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Italiana", bodyFont: "Crimson Text", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Italiana&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap",
      scale: { hero: "clamp(3rem, 7vw, 6rem)", h1: "clamp(2.5rem, 5vw, 4.5rem)", h2: "clamp(1.8rem, 3.5vw, 3rem)", h3: "clamp(1.3rem, 2.5vw, 2rem)", h4: "clamp(1.1rem, 2vw, 1.5rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 400, bodyWeight: 400,
      lineHeight: { heading: 1.1, body: 1.8 },
      letterSpacing: { heading: "0.05em", label: "0.22em", body: "0em" },
    },
    sections: ["hero", "about", "services", "gallery", "testimonials", "contact"],
  },
  // Default for ecommerce, realestate, medical, professional, other
  _default: {
    colors: {
      primary: "#1e2d40", secondary: "#2a3e58", accent: "#2563eb",
      background: "#f5f7fa", surface: "#ffffff", text: "#2a3854",
      textMuted: "#6b7c94", border: "rgba(0,0,0,0.06)",
      success: "#22c55e", error: "#ef4444",
    },
    typography: {
      headingFont: "Playfair Display", bodyFont: "Nunito", monoFont: "JetBrains Mono",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
      scale: { hero: "clamp(2.8rem, 6vw, 5.5rem)", h1: "clamp(2.2rem, 4.5vw, 4rem)", h2: "clamp(1.6rem, 3vw, 2.5rem)", h3: "clamp(1.2rem, 2.2vw, 1.8rem)", h4: "clamp(1rem, 1.8vw, 1.4rem)", body: "1rem", small: "0.875rem", xs: "0.75rem" },
      headingWeight: 500, bodyWeight: 400,
      lineHeight: { heading: 1.15, body: 1.75 },
      letterSpacing: { heading: "-0.01em", label: "0.18em", body: "0em" },
    },
    sections: ["hero", "about", "services", "testimonials", "contact", "cta"],
  },
};

function getSectorDefaults(sector: string) {
  return SECTOR_DEFAULTS[sector] ?? SECTOR_DEFAULTS["_default"]!;
}

// ─── Design Pipeline ──────────────────────────────────────────────────────────

export class DesignPipelineOrchestrator {
  private researchAgent = new SiteResearchAgent();
  private stitchClient = getStitchClient();
  private logs: Array<{ level: string; step: string; message: string }> = [];

  private log(step: string, level: string, message: string): void {
    this.logs.push({ level, step, message });
    console.log(`[DesignPipeline][${step}] ${message}`);
  }

  /**
   * Execute the full design pipeline.
   *
   * Step 1: Research — scrape original content
   * Step 2: Design System — build colors, typography, layout from research
   * Step 3: Stitch — generate premium UI screens (if available)
   * Step 4: UI Components — select premium variants and effects
   * Step 5: Content — generate copy in the correct language
   * Step 6: Assemble — combine everything into the DesignSpec
   */
  async execute(
    input: DesignPipelineInput,
    businessData: {
      companyName: string;
      sector: string;
      country: string;
      language: string;
      city?: string | null;
      description?: string | null;
      website?: string | null;
      googleRating?: number | null;
      reviewCount?: number | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      existingPhotoUrls?: string[];
      topReviews?: string[];
    },
  ): Promise<DesignPipelineOutput> {
    const warnings: string[] = [];
    const startTime = Date.now();
    const sector = businessData.sector;
    const defaults = getSectorDefaults(sector);

    this.log("init", "info", `Starting design pipeline for ${businessData.companyName} [${sector}]`);

    // ─── Step 1: Research — Scrape original site ──────────────────────
    let scrapedContent: ScrapedContent | undefined;
    const websiteUrl = input.websiteUrl ?? businessData.website;

    if (websiteUrl) {
      this.log("research", "info", `Scraping original site: ${websiteUrl}`);
      try {
        scrapedContent = await this.researchAgent.scrapeOriginalSite(websiteUrl);
        this.log("research", "info",
          `Scraped: ${scrapedContent.photos.length} photos, ` +
          `${scrapedContent.headings.length} headings, ` +
          `${scrapedContent.extractedColors.length} colors, ` +
          `logo: ${scrapedContent.logo ? "found" : "not found"}`);
      } catch (err) {
        warnings.push(`Site scraping failed: ${err instanceof Error ? err.message : String(err)}`);
        this.log("research", "warn", `Scraping failed, continuing with defaults`);
      }
    } else {
      this.log("research", "info", "No website URL available, skipping research");
    }

    // ─── Step 2: Build Design System ──────────────────────────────────
    this.log("design", "info", "Building design system");

    // Colors: prefer original site colors, fallback to sector defaults
    let colors: ColorSystem;
    if (scrapedContent?.extractedColors && scrapedContent.extractedColors.length >= 2) {
      colors = this.researchAgent.buildColorSystemFromScrape(
        scrapedContent.extractedColors,
        defaults.colors,
      );
      this.log("design", "info", "Colors extracted from original site");
    } else {
      colors = defaults.colors;
      this.log("design", "info", "Using sector default colors");
    }

    // Typography: use detected fonts if premium, otherwise sector defaults
    let typography: TypographySystem = defaults.typography;
    if (scrapedContent?.detectedFonts && scrapedContent.detectedFonts.length > 0) {
      const premiumFont = scrapedContent.detectedFonts.find((f) =>
        !["Arial", "Helvetica", "Times New Roman", "Verdana", "Georgia", "Tahoma", "Trebuchet MS", "sans-serif", "serif"].includes(f)
      );
      if (premiumFont) {
        this.log("design", "info", `Detected premium font from site: ${premiumFont}`);
        // Keep detected heading font, use default body font
        typography = {
          ...defaults.typography,
          headingFont: premiumFont,
          googleFontsUrl: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(premiumFont)}:wght@300;400;500;600;700&family=${encodeURIComponent(defaults.typography.bodyFont)}:wght@300;400;500;600&display=swap`,
        };
      }
    }

    const layout: LayoutSystem = {
      maxWidth: "1280px",
      sectionPadding: "clamp(4rem, 8vw, 8rem)",
      containerPadding: "clamp(1rem, 3vw, 2.5rem)",
      gap: { xs: "0.5rem", sm: "1rem", md: "1.5rem", lg: "2.5rem", xl: "4rem", xxl: "6rem" },
      borderRadius: { sm: "4px", md: "8px", lg: "16px", full: "9999px" },
      gridColumns: 12,
    };

    // ─── Step 3: Curate Photos ────────────────────────────────────────
    this.log("photos", "info", "Curating photo collection");

    let allPhotos: BrandAsset[] = [];
    let logoAsset: BrandAsset | undefined = scrapedContent?.logo;
    let originalCount = 0;
    let stockCount = 0;

    // Include scraped photos
    if (scrapedContent?.photos && scrapedContent.photos.length > 0) {
      const quality = await this.researchAgent.filterPhotosByQuality(scrapedContent.photos);
      allPhotos.push(...quality);
      originalCount = quality.length;
      this.log("photos", "info", `${originalCount} quality photos from original site`);
    }

    // Include existing Google Maps photos
    if (businessData.existingPhotoUrls && businessData.existingPhotoUrls.length > 0) {
      for (const url of businessData.existingPhotoUrls.slice(0, 10)) {
        allPhotos.push({
          url,
          source: "google_maps",
          type: "gallery",
        });
        originalCount++;
      }
    }

    // Fill with stock if we don't have enough
    if (allPhotos.length < 5) {
      const needed = 5 - allPhotos.length;
      this.log("photos", "info", `Need ${needed} more photos, fetching stock`);
      const stock = await this.researchAgent.fetchStockPhotos(
        sector,
        businessData.city ?? businessData.country,
        needed,
      );
      allPhotos.push(...stock);
      stockCount = stock.length;
    }

    // Select hero image (largest/best original, or first available)
    const heroImage = allPhotos.find((p) => p.type === "hero") ??
      allPhotos.find((p) => p.source === "original_site" && (p.width ?? 0) >= 1000) ??
      allPhotos[0];

    // ─── Step 4: Stitch Integration ───────────────────────────────────
    let stitchData = undefined;
    const stitchAvailable = await this.stitchClient.isAvailable();

    if (stitchAvailable) {
      this.log("stitch", "info", "Google Stitch available — generating premium UI");
      try {
        const project = await this.stitchClient.createProject(
          businessData.companyName,
          sector,
          `Premium ${sector} website`,
        );

        if (project) {
          stitchData = await this.stitchClient.generateFullSite(
            project.projectId,
            businessData.companyName,
            sector,
            colors,
            typography,
            defaults.sections,
          );
          this.log("stitch", "info", `Stitch generated ${stitchData.screens.length} screens`);
        }
      } catch (err) {
        warnings.push(`Stitch generation failed: ${err instanceof Error ? err.message : String(err)}`);
        this.log("stitch", "warn", "Stitch generation failed, continuing without");
      }
    } else {
      this.log("stitch", "info", "Stitch not available (no API key), using template engine");
    }

    // ─── Step 5: Select Premium Components & Effects ──────────────────
    this.log("components", "info", "Selecting premium component variants");

    const sections: SectionDefinition[] = defaults.sections.map((sectionType, index) => {
      const variant = getVariantForSection(sector, sectionType);
      return {
        id: `section-${sectionType}-${index}`,
        type: sectionType as SectionDefinition["type"],
        order: index,
        variant,
        content: {},
        visible: true,
      };
    });

    // Collect all effects
    const { css: effectsCss, js: effectsJs } = getAllEffectsForSite(
      sections.map((s) => ({ type: s.type, variant: s.variant }))
    );

    // Build premium animation presets
    const allEffectNames = new Set<string>();
    for (const section of sections) {
      for (const effect of section.variant.effects) {
        allEffectNames.add(effect);
      }
    }
    const premiumEffects = [...allEffectNames]
      .map((name) => PREMIUM_ANIMATIONS[name])
      .filter(Boolean) as typeof PREMIUM_ANIMATIONS[string][];

    // ─── Step 6: Generate Content ─────────────────────────────────────
    this.log("content", "info", "Generating content");

    const content = this.generateContent(businessData, scrapedContent);

    // ─── Step 7: Assemble DesignSpec ──────────────────────────────────
    this.log("assemble", "info", "Assembling DesignSpec");

    const now = new Date().toISOString();
    const designSpec: DesignSpec = {
      id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      version: 1,
      createdAt: now,
      updatedAt: now,

      business: {
        name: businessData.companyName,
        sector,
        country: businessData.country,
        language: businessData.language,
        city: businessData.city ?? undefined,
        description: businessData.description ?? undefined,
        googleRating: businessData.googleRating ?? undefined,
        reviewCount: businessData.reviewCount ?? undefined,
      },

      scrapedContent,
      colors,
      typography,
      layout,

      animations: {
        scrollReveal: PREMIUM_ANIMATIONS["scroll_reveal_premium"]!,
        heroEntrance: PREMIUM_ANIMATIONS["character_reveal"]!,
        navTransition: { transparent: true, blurOnScroll: true, scrollThreshold: 60 },
        premiumEffects,
        pageTransition: {
          name: "fade_in",
          type: "page_transition",
          config: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } },
        },
      },

      assets: {
        logo: logoAsset,
        heroImage,
        photos: allPhotos,
        photoSources: {
          original: originalCount,
          stock: stockCount,
          stitchGenerated: stitchData?.screens.length ?? 0,
        },
      },

      content,
      sections,
      stitch: stitchData,

      lighthouse: {
        performance: 90,
        accessibility: 90,
        seo: 95,
        bestPractices: 90,
      },

      targets: input.targets ?? { landingPage: true, portal: true, campaign: true },
    };

    const durationMs = Date.now() - startTime;
    this.log("complete", "info", `Design pipeline completed in ${durationMs}ms`);

    return {
      designSpec,
      status: "SUCCESS",
      warnings,
    };
  }

  // ─── Content Generation ─────────────────────────────────────────────

  private generateContent(
    businessData: {
      companyName: string;
      sector: string;
      language: string;
      city?: string | null;
      description?: string | null;
      googleRating?: number | null;
    },
    scraped?: ScrapedContent,
  ) {
    const name = businessData.companyName;
    const city = businessData.city ?? "";
    const lang = businessData.language.slice(0, 2).toLowerCase();
    const desc = businessData.description ?? scraped?.bodyTexts?.[0] ?? "";

    // Use scraped content when available
    const scrapedTagline = scraped?.tagline;
    const scrapedHeadings = scraped?.headings ?? [];

    // Language-aware content templates
    const templates: Record<string, Record<string, string>> = {
      it: {
        tagline: scrapedTagline ?? "Eccellenza e passione dal primo giorno",
        heroTitle: scrapedHeadings[0] ?? `Benvenuti da ${name}`,
        heroSubtitle: desc || `Scopri l'esperienza unica che solo ${name} può offrirti${city ? ` nel cuore di ${city}` : ""}.`,
        aboutText: desc || `${name} rappresenta il punto di riferimento per chi cerca qualità e professionalità. La nostra storia è fatta di passione, dedizione e attenzione ai dettagli.`,
        ctaPrimary: "Scopri di più",
        ctaSecondary: "Contattaci",
        metaTitle: `${name}${city ? ` | ${city}` : ""}`,
        metaDescription: desc?.slice(0, 155) ?? `${name}${city ? ` a ${city}` : ""} — qualità, professionalità e attenzione al cliente.`,
      },
      de: {
        tagline: scrapedTagline ?? "Exzellenz und Leidenschaft seit dem ersten Tag",
        heroTitle: scrapedHeadings[0] ?? `Willkommen bei ${name}`,
        heroSubtitle: desc || `Entdecken Sie das einzigartige Erlebnis, das nur ${name}${city ? ` im Herzen von ${city}` : ""} bieten kann.`,
        aboutText: desc || `${name} ist die erste Adresse für Qualität und Professionalität.`,
        ctaPrimary: "Mehr erfahren",
        ctaSecondary: "Kontakt",
        metaTitle: `${name}${city ? ` | ${city}` : ""}`,
        metaDescription: desc?.slice(0, 155) ?? `${name}${city ? ` in ${city}` : ""} — Qualität, Professionalität und Kundenorientierung.`,
      },
      fr: {
        tagline: scrapedTagline ?? "Excellence et passion depuis le premier jour",
        heroTitle: scrapedHeadings[0] ?? `Bienvenue chez ${name}`,
        heroSubtitle: desc || `Découvrez l'expérience unique que seul ${name}${city ? ` au cœur de ${city}` : ""} peut vous offrir.`,
        aboutText: desc || `${name} est la référence en matière de qualité et de professionnalisme.`,
        ctaPrimary: "En savoir plus",
        ctaSecondary: "Contactez-nous",
        metaTitle: `${name}${city ? ` | ${city}` : ""}`,
        metaDescription: desc?.slice(0, 155) ?? `${name}${city ? ` à ${city}` : ""} — qualité, professionnalisme et attention client.`,
      },
      es: {
        tagline: scrapedTagline ?? "Excelencia y pasión desde el primer día",
        heroTitle: scrapedHeadings[0] ?? `Bienvenidos a ${name}`,
        heroSubtitle: desc || `Descubre la experiencia única que solo ${name}${city ? ` en el corazón de ${city}` : ""} puede ofrecerte.`,
        aboutText: desc || `${name} es el punto de referencia para quienes buscan calidad y profesionalismo.`,
        ctaPrimary: "Descubrir más",
        ctaSecondary: "Contáctanos",
        metaTitle: `${name}${city ? ` | ${city}` : ""}`,
        metaDescription: desc?.slice(0, 155) ?? `${name}${city ? ` en ${city}` : ""} — calidad, profesionalismo y atención al cliente.`,
      },
      en: {
        tagline: scrapedTagline ?? "Excellence and passion from day one",
        heroTitle: scrapedHeadings[0] ?? `Welcome to ${name}`,
        heroSubtitle: desc || `Discover the unique experience that only ${name}${city ? ` in the heart of ${city}` : ""} can offer.`,
        aboutText: desc || `${name} is the benchmark for quality and professionalism. Our story is built on passion, dedication, and attention to detail.`,
        ctaPrimary: "Learn more",
        ctaSecondary: "Contact us",
        metaTitle: `${name}${city ? ` | ${city}` : ""}`,
        metaDescription: desc?.slice(0, 155) ?? `${name}${city ? ` in ${city}` : ""} — quality, professionalism and customer care.`,
      },
    };

    const t = templates[lang] ?? templates["it"]!;

    return {
      tagline: t["tagline"]!,
      heroTitle: t["heroTitle"]!,
      heroSubtitle: t["heroSubtitle"]!,
      aboutText: t["aboutText"]!,
      ctaPrimary: t["ctaPrimary"]!,
      ctaSecondary: t["ctaSecondary"],
      metaTitle: t["metaTitle"]!,
      metaDescription: t["metaDescription"]!,
      keywords: [name, businessData.sector, city].filter(Boolean) as string[],
    };
  }
}
