export { BaseAgent } from "./base-agent.js";
export type { AgentContext } from "./base-agent.js";
export { startOrchestrator, createOrchestratorWorker } from "./orchestrator.js";
export { ScraperAgent } from "./scraper/index.js";
export { AnalyzerAgent } from "./analyzer/index.js";
export { BuilderAgent } from "./builder/index.js";
export { OutreachAgent, analyzeReply } from "./outreach/index.js";
export type { ReplyAnalysisResult } from "./outreach/index.js";
export { ChatbotAgent } from "./chatbot/index.js";
export { QaAgent } from "./qa/index.js";

// ─── Design Pipeline ──────────────────────────────────────────────────────────
export {
  DesignPipelineOrchestrator,
  SiteResearchAgent,
  StitchClient,
  getStitchClient,
  PREMIUM_ANIMATIONS,
  PREMIUM_COMPONENT_VARIANTS,
  SECTOR_VARIANT_PREFERENCES,
  getVariantForSection,
  collectEffectsCss,
  collectEffectsJs,
  getAllEffectsForSite,
} from "./design/index.js";

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
} from "./design/index.js";

export {
  DesignSpecSchema,
  DesignPipelineInputSchema,
  DesignPipelineOutputSchema,
} from "./design/index.js";
