/**
 * Premium template configurations per sector.
 * Source of truth: /templates/{sector}/template.json
 * Used by: BuilderAgent, landing demo preview, portal editor fallback
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

export interface TemplateConfig {
  sector: string;
  fonts: TemplateFonts;
  colors: TemplateColors;
  heroVariant: string;
  animationPreset: string;
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  restaurant: {
    sector: "restaurant",
    fonts: {
      heading: "Cormorant Garamond",
      body: "DM Sans",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap",
    },
    colors: { primary: "#1a1208", accent: "#c9a84c", background: "#faf8f4", text: "#2d2419", textLight: "#6b5c42", border: "#e8e0d0", surface: "#ffffff" },
    heroVariant: "split_parallax",
    animationPreset: "elegant_fade",
  },
  dental: {
    sector: "dental",
    fonts: {
      heading: "Outfit",
      body: "Source Sans 3",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap",
    },
    colors: { primary: "#0a2540", accent: "#00b4d8", background: "#f0f8ff", text: "#1a3050", textLight: "#4a6285", border: "#d0e8f5", surface: "#ffffff" },
    heroVariant: "centered_clean",
    animationPreset: "clean_rise",
  },
  beauty: {
    sector: "beauty",
    fonts: {
      heading: "Tenor Sans",
      body: "Questrial",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tenor+Sans&family=Questrial&display=swap",
    },
    colors: { primary: "#2a1f1a", accent: "#c9967a", background: "#fdf8f5", text: "#3d2e26", textLight: "#8a7068", border: "#ead8cc", surface: "#ffffff" },
    heroVariant: "editorial_portrait",
    animationPreset: "soft_reveal",
  },
  fitness: {
    sector: "fitness",
    fonts: {
      heading: "Bebas Neue",
      body: "Barlow",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#0f0f0f", accent: "#ff3b30", background: "#f5f5f5", text: "#1a1a1a", textLight: "#6b6b6b", border: "#e0e0e0", surface: "#ffffff" },
    heroVariant: "bold_overlay",
    animationPreset: "punch_in",
  },
  hotel: {
    sector: "hotel",
    fonts: {
      heading: "Italiana",
      body: "Crimson Text",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Italiana&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap",
    },
    colors: { primary: "#1a1520", accent: "#b8860b", background: "#f9f6f0", text: "#2a2530", textLight: "#6a6070", border: "#e0d8cc", surface: "#ffffff" },
    heroVariant: "fullscreen_cinematic",
    animationPreset: "luxury_reveal",
  },
  legal: {
    sector: "legal",
    fonts: {
      heading: "Libre Baskerville",
      body: "Karla",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a2332", accent: "#2c5282", background: "#f7f9fc", text: "#2d3748", textLight: "#718096", border: "#e2e8f0", surface: "#ffffff" },
    heroVariant: "authority_split",
    animationPreset: "professional_fade",
  },
  medical: {
    sector: "medical",
    fonts: {
      heading: "Playfair Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a3a4a", accent: "#38a169", background: "#f0faf5", text: "#2d4a3e", textLight: "#68907e", border: "#c6e8d8", surface: "#ffffff" },
    heroVariant: "trust_centered",
    animationPreset: "gentle_rise",
  },
  professional: {
    sector: "professional",
    fonts: {
      heading: "Playfair Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a1a2e", accent: "#6366f1", background: "#f8f9fc", text: "#2d2d44", textLight: "#6b6b85", border: "#e2e4ea", surface: "#ffffff" },
    heroVariant: "modern_split",
    animationPreset: "clean_slide",
  },
  ecommerce: {
    sector: "ecommerce",
    fonts: {
      heading: "Playfair Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a1a1a", accent: "#f59e0b", background: "#fefce8", text: "#292524", textLight: "#78716c", border: "#e7e5e4", surface: "#ffffff" },
    heroVariant: "product_showcase",
    animationPreset: "snap_in",
  },
  realestate: {
    sector: "realestate",
    fonts: {
      heading: "Playfair Display",
      body: "Nunito",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#1a2e35", accent: "#14b8a6", background: "#f0fdfa", text: "#2d4a50", textLight: "#5f8a8e", border: "#ccece6", surface: "#ffffff" },
    heroVariant: "gallery_hero",
    animationPreset: "panoramic_reveal",
  },
};

export function getTemplateConfig(sector: string): TemplateConfig {
  return TEMPLATE_CONFIGS[sector.toLowerCase()] ?? TEMPLATE_CONFIGS["professional"]!;
}
