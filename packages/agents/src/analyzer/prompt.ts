import { ANALYZER_SYSTEM_PROMPT, buildAnalyzerPrompt } from "@madecreative/ai";

export { ANALYZER_SYSTEM_PROMPT };

export function buildAnalyzerUserPrompt(prospect: {
  companyName: string;
  website?: string | null;
  sector: string;
  country: string;
  googleRating?: number | null;
  reviewCount?: number | null;
}): string {
  return buildAnalyzerPrompt(prospect);
}
