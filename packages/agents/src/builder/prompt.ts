import { BUILDER_SYSTEM_PROMPT, buildBuilderPrompt } from "@madecreative/ai";

export { BUILDER_SYSTEM_PROMPT };

export function buildBuilderUserPrompt(client: {
  companyName: string;
  sector: string;
  country: string;
  language: string;
  city?: string | null;
  templateSlug: string;
  customizations?: Record<string, unknown>;
}): string {
  return buildBuilderPrompt({
    companyName: client.companyName,
    sector: client.sector,
    country: client.country,
    language: client.language,
    city: client.city,
    templateSlug: client.templateSlug,
  });
}
