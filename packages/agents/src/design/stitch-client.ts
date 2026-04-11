// ─── Google Stitch SDK Integration ────────────────────────────────────────────
// Wrapper around @google/stitch-sdk for programmatic UI generation.
// Generates premium UI screens from text prompts, extracts HTML/React code,
// and manages design systems for consistent output across all channels.
// ─────────────────────────────────────────────────────────────────────────────

import type { StitchScreen, StitchDesignSystem, ColorSystem, TypographySystem } from "./types.js";

// ─── Types from Stitch SDK ────────────────────────────────────────────────────

interface StitchSDK {
  project: (id: string) => StitchProject;
  projects: () => Promise<StitchProject[]>;
}

interface StitchProject {
  id?: string;
  generate: (prompt: string, deviceType?: string) => Promise<StitchScreenResult>;
  screens: () => Promise<StitchScreenResult[]>;
  getScreen: (screenId: string) => Promise<StitchScreenResult>;
  createDesignSystem: (ds: Record<string, unknown>) => Promise<{ id: string }>;
  listDesignSystems: () => Promise<Array<{ id: string }>>;
  designSystem: (id: string) => StitchDesignSystemRef;
}

interface StitchScreenResult {
  id?: string;
  edit: (prompt: string, deviceType?: string) => Promise<StitchScreenResult>;
  variants: (prompt: string, options: VariantOptions) => Promise<StitchScreenResult[]>;
  getHtml: () => Promise<string>;
  getImage: () => Promise<string>;
}

interface StitchDesignSystemRef {
  update: (ds: Record<string, unknown>) => Promise<void>;
  apply: (screens: Array<{ screenId: string }>) => Promise<void>;
}

interface VariantOptions {
  variantCount?: number;
  creativeRange?: "REFINE" | "EXPLORE" | "REIMAGINE";
  aspects?: Array<"LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT">;
}

// ─── Stitch Client ────────────────────────────────────────────────────────────

export class StitchClient {
  private sdk: StitchSDK | null = null;
  private projectId: string | null = null;
  private initialized = false;

  constructor(private apiKey?: string) {
    this.apiKey = apiKey ?? process.env["STITCH_API_KEY"];
  }

  /**
   * Lazy-load the Stitch SDK to avoid import errors when API key is not set.
   */
  private async init(): Promise<boolean> {
    if (this.initialized) return this.sdk !== null;

    try {
      const mod = await import("@google/stitch-sdk");
      this.sdk = mod.stitch ?? mod.default?.stitch ?? mod.default;

      if (!this.sdk) {
        console.warn("[StitchClient] SDK loaded but no stitch export found");
        return false;
      }

      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(
        "[StitchClient] Stitch SDK not available:",
        err instanceof Error ? err.message : String(err)
      );
      this.initialized = true;
      return false;
    }
  }

  /**
   * Check if Stitch is available and configured.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    return this.init();
  }

  /**
   * Create a new Stitch project for a business and generate screens.
   */
  async createProject(
    businessName: string,
    sector: string,
    designPrompt: string,
  ): Promise<{ projectId: string; screens: StitchScreen[] } | null> {
    if (!(await this.isAvailable()) || !this.sdk) return null;

    try {
      // Use tool client for project creation
      const mod = await import("@google/stitch-sdk");
      const StitchToolClient = mod.StitchToolClient ?? mod.default?.StitchToolClient;

      if (StitchToolClient) {
        const client = new StitchToolClient({ apiKey: this.apiKey });
        const result = await client.callTool("create_project", {
          title: `${businessName} - ${sector}`,
        });
        const projectId = (result as { projectId?: string })?.projectId;
        if (projectId) {
          this.projectId = projectId;
          return { projectId, screens: [] };
        }
        await client.close();
      }

      return null;
    } catch (err) {
      console.error("[StitchClient] createProject failed:", err);
      return null;
    }
  }

  /**
   * Generate a screen from a text prompt.
   * Returns HTML and screenshot URL.
   */
  async generateScreen(
    projectId: string,
    prompt: string,
    deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "AGNOSTIC" = "DESKTOP",
  ): Promise<StitchScreen | null> {
    if (!(await this.isAvailable()) || !this.sdk) return null;

    try {
      const project = this.sdk.project(projectId);
      const screen = await project.generate(prompt, deviceType);

      const htmlUrl = await screen.getHtml().catch(() => undefined);
      const imageUrl = await screen.getImage().catch(() => undefined);

      return {
        screenId: screen.id ?? `screen-${Date.now()}`,
        projectId,
        name: prompt.slice(0, 100),
        htmlUrl,
        imageUrl,
        deviceType,
      };
    } catch (err) {
      console.error("[StitchClient] generateScreen failed:", err);
      return null;
    }
  }

  /**
   * Generate multiple screen variants with different design approaches.
   */
  async generateVariants(
    projectId: string,
    prompt: string,
    options: VariantOptions = {},
  ): Promise<StitchScreen[]> {
    if (!(await this.isAvailable()) || !this.sdk) return [];

    try {
      const project = this.sdk.project(projectId);
      const baseScreen = await project.generate(prompt);

      const variants = await baseScreen.variants(prompt, {
        variantCount: options.variantCount ?? 3,
        creativeRange: options.creativeRange ?? "EXPLORE",
        aspects: options.aspects ?? ["LAYOUT", "COLOR_SCHEME"],
      });

      const results: StitchScreen[] = [];
      for (const variant of variants) {
        const htmlUrl = await variant.getHtml().catch(() => undefined);
        const imageUrl = await variant.getImage().catch(() => undefined);
        results.push({
          screenId: variant.id ?? `variant-${Date.now()}`,
          projectId,
          name: `Variant of: ${prompt.slice(0, 80)}`,
          htmlUrl,
          imageUrl,
          deviceType: "DESKTOP",
        });
      }

      return results;
    } catch (err) {
      console.error("[StitchClient] generateVariants failed:", err);
      return [];
    }
  }

  /**
   * Create a design system in Stitch from our DesignSpec colors and typography.
   */
  async createDesignSystem(
    projectId: string,
    colors: ColorSystem,
    typography: TypographySystem,
  ): Promise<string | null> {
    if (!(await this.isAvailable()) || !this.sdk) return null;

    try {
      const project = this.sdk.project(projectId);
      const result = await project.createDesignSystem({
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          background: colors.background,
          surface: colors.surface,
          text: colors.text,
        },
        typography: {
          headingFont: typography.headingFont,
          bodyFont: typography.bodyFont,
          scale: typography.scale,
        },
      });

      return result.id;
    } catch (err) {
      console.error("[StitchClient] createDesignSystem failed:", err);
      return null;
    }
  }

  /**
   * Apply a design system to specific screens for consistency.
   */
  async applyDesignSystem(
    projectId: string,
    designSystemId: string,
    screenIds: string[],
  ): Promise<boolean> {
    if (!(await this.isAvailable()) || !this.sdk) return false;

    try {
      const project = this.sdk.project(projectId);
      const ds = project.designSystem(designSystemId);
      await ds.apply(screenIds.map((id) => ({ screenId: id })));
      return true;
    } catch (err) {
      console.error("[StitchClient] applyDesignSystem failed:", err);
      return false;
    }
  }

  /**
   * Download HTML content from a Stitch screen URL.
   */
  async downloadHtml(htmlUrl: string): Promise<string | null> {
    try {
      const response = await fetch(htmlUrl);
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  /**
   * Generate a complete set of screens for a business website.
   * Produces desktop + mobile for each section type.
   */
  async generateFullSite(
    projectId: string,
    businessName: string,
    sector: string,
    colors: ColorSystem,
    typography: TypographySystem,
    sections: string[],
  ): Promise<StitchDesignSystem> {
    const result: StitchDesignSystem = {
      projectId,
      screens: [],
      exportedHtml: {},
      exportedReact: {},
    };

    if (!(await this.isAvailable())) return result;

    // Create design system first
    const dsId = await this.createDesignSystem(projectId, colors, typography);
    if (dsId) result.designSystemId = dsId;

    // Generate screens for each section
    for (const section of sections) {
      const prompt = this.buildSectionPrompt(businessName, sector, section, colors, typography);

      const screen = await this.generateScreen(projectId, prompt, "DESKTOP");
      if (screen) {
        result.screens.push(screen);

        // Download and store HTML
        if (screen.htmlUrl) {
          const html = await this.downloadHtml(screen.htmlUrl);
          if (html) result.exportedHtml[section] = html;
        }
      }

      // Also generate mobile variant
      const mobileScreen = await this.generateScreen(projectId, prompt, "MOBILE");
      if (mobileScreen) {
        result.screens.push({ ...mobileScreen, name: `${section} (mobile)` });
      }
    }

    // Apply design system to all screens if available
    if (dsId && result.screens.length > 0) {
      await this.applyDesignSystem(
        projectId,
        dsId,
        result.screens.map((s) => s.screenId),
      );
    }

    return result;
  }

  /**
   * Build a rich prompt for Stitch screen generation based on section type.
   */
  private buildSectionPrompt(
    businessName: string,
    sector: string,
    sectionType: string,
    colors: ColorSystem,
    typography: TypographySystem,
  ): string {
    const baseContext = `Design a ${sectionType} section for "${businessName}", a premium ${sector} business. ` +
      `Use colors: primary ${colors.primary}, accent ${colors.accent}, background ${colors.background}. ` +
      `Typography: headings in ${typography.headingFont}, body in ${typography.bodyFont}. ` +
      `The design must look like a premium $10,000+ custom website. Modern, elegant, with generous whitespace.`;

    const sectionPrompts: Record<string, string> = {
      hero: `${baseContext} Create a stunning full-viewport hero section with a large background image, ` +
        `a captivating headline with elegant typography, a subtle tagline, and a prominent CTA button. ` +
        `Include smooth parallax scrolling effect and a glass-morphism navigation bar.`,

      about: `${baseContext} Create an about/story section with a split layout: ` +
        `elegant text on one side with the business story, and a beautiful image composition on the other. ` +
        `Include subtle statistics or awards. Premium feel with custom typography hierarchy.`,

      services: `${baseContext} Create a services/offerings section with a grid of service cards. ` +
        `Each card should have an icon, title, description, and subtle hover animation. ` +
        `Use a bento grid layout with varying card sizes for visual interest.`,

      gallery: `${baseContext} Create an immersive photo gallery section with a masonry or dynamic grid layout. ` +
        `Photos should have hover effects (scale + overlay). Include a filter bar and lightbox capability. ` +
        `Premium magazine-style layout.`,

      testimonials: `${baseContext} Create a testimonials section with an elegant carousel or card layout. ` +
        `Each testimonial should have a quote, author name, role, and star rating. ` +
        `Use large quotation marks as a decorative element. Auto-play with smooth transitions.`,

      contact: `${baseContext} Create a contact section with a split layout: ` +
        `contact information and social links on one side, a clean contact form on the other. ` +
        `Include an embedded map area. Dark background with accent color highlights.`,

      team: `${baseContext} Create a team section with a grid of team member cards. ` +
        `Each card should have a professional photo, name, role, and social links. ` +
        `Elegant hover effects that reveal additional information.`,

      pricing: `${baseContext} Create a pricing section with 3 pricing tiers. ` +
        `Feature a prominent "recommended" tier in the center. Clean comparison with checkmarks. ` +
        `Include a toggle for monthly/annual pricing.`,

      cta: `${baseContext} Create a compelling call-to-action section with a bold headline, ` +
        `supporting text, and a prominent button. Use the accent color background ` +
        `with contrasting text. Include a subtle pattern or gradient overlay.`,

      footer: `${baseContext} Create an elegant footer with business info, navigation links, ` +
        `social media icons, newsletter signup, and legal links. ` +
        `Dark background with organized columns and subtle accent color borders.`,
    };

    return sectionPrompts[sectionType] ?? baseContext;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: StitchClient | null = null;

export function getStitchClient(): StitchClient {
  if (!instance) {
    instance = new StitchClient();
  }
  return instance;
}
