/**
 * Sector template registry.
 *
 * Each sector can register a SectorTemplate that overrides the default
 * homepage, hero, CSS additions and can add sector-specific components/pages.
 * Falls back to the default generators in generate-project.ts when no template
 * is registered for the requested sector.
 */

import type { TemplateConfig } from "../templates.js";
import type { ProjectData, I18nTranslations } from "../generate-project.js";

export interface SectorTemplate {
  sector: string;
  additionalCss(cfg: TemplateConfig): string;
  genHomePage(data: ProjectData, cfg: TemplateConfig, t: I18nTranslations): string;
  genHero(cfg: TemplateConfig, t: I18nTranslations): string;
  additionalComponents(
    data: ProjectData,
    cfg: TemplateConfig,
    t: I18nTranslations,
  ): Record<string, string>;
  additionalPages?(
    data: ProjectData,
    cfg: TemplateConfig,
    t: I18nTranslations,
  ): Record<string, string>;
}

// ── Registry ──────────────────────────────────────────────────────────────────

const _registry: Record<string, SectorTemplate> = {};

export function registerTemplate(tpl: SectorTemplate): void {
  _registry[tpl.sector] = tpl;
}

export function getSectorTemplate(sector: string): SectorTemplate | null {
  return _registry[sector] ?? null;
}

// ── Auto-register all built-in templates ─────────────────────────────────────
// Templates will be added here as they're created.
// import "./restaurant.js";  // TODO: create restaurant template
