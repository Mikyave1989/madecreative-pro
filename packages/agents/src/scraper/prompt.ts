import { SCRAPER_SYSTEM_PROMPT, buildScraperPrompt } from "@madecreative/ai";

export { SCRAPER_SYSTEM_PROMPT };

export function buildScraperUserPrompt(params: {
  sector: string;
  countries: string[];
  cities?: string[];
  keywords: string[];
  maxResults: number;
}): string {
  return buildScraperPrompt({
    sector: params.sector,
    country: params.countries.join(", "),
    cities: params.cities,
    keywords: params.keywords,
    maxResults: params.maxResults,
  });
}
