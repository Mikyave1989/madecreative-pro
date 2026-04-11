// ─── Design Pipeline — Public Exports ─────────────────────────────────────────

// Types
export type {
  DesignSpec,
  DesignPipelineInput,
  DesignPipelineOutput,
  ColorSystem,
  TypographySystem,
  LayoutSystem,
  AnimationSystem,
  AnimationPreset,
  ComponentVariant,
  SectionDefinition,
  BrandAsset,
  ScrapedContent,
  StitchScreen,
  StitchDesignSystem,
} from "./types.js";

export {
  DesignSpecSchema,
  DesignPipelineInputSchema,
  DesignPipelineOutputSchema,
  ColorSystemSchema,
  TypographySystemSchema,
  LayoutSystemSchema,
  AnimationSystemSchema,
  ComponentVariantSchema,
  SectionDefinitionSchema,
  BrandAssetSchema,
  ScrapedContentSchema,
  StitchScreenSchema,
  StitchDesignSystemSchema,
} from "./types.js";

// Agents & Orchestrator
export { SiteResearchAgent } from "./research-agent.js";
export { StitchClient, getStitchClient } from "./stitch-client.js";
export { DesignPipelineOrchestrator } from "./orchestrator.js";

// UI Components
export {
  PREMIUM_ANIMATIONS,
  PREMIUM_COMPONENT_VARIANTS,
  SECTOR_VARIANT_PREFERENCES,
  getVariantForSection,
  collectEffectsCss,
  collectEffectsJs,
  getAllEffectsForSite,
} from "./ui-components.js";
