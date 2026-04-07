import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { scraperTools } from "./tools.js";
import { SCRAPER_SYSTEM_PROMPT, buildScraperUserPrompt } from "./prompt.js";
import { ScraperInputSchema, type ScrapedBusiness } from "./types.js";

export class ScraperAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return scraperTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "search_google_maps": {
        // In production, integrate with BrightData or Google Maps API
        // For now return mock structure
        this.log("info", `Searching Google Maps: ${toolInput["query"]}`);
        return {
          results: [],
          message: "Google Maps search would be executed here with BrightData API",
        };
      }

      case "check_website_exists": {
        const url = toolInput["url"] as string;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return { exists: response.ok, status: response.status };
        } catch {
          return { exists: false, status: 0 };
        }
      }

      case "extract_contact_info": {
        this.log("info", `Extracting contact info from: ${toolInput["url"]}`);
        // In production, use a scraping service
        return { phone: null, email: null, address: null };
      }

      case "save_prospects": {
        const businesses = toolInput["businesses"] as ScrapedBusiness[];
        const source = (toolInput["source"] as string) ?? "GOOGLE_MAPS";

        let newCount = 0;
        let skippedCount = 0;

        for (const biz of businesses) {
          // Check for duplicates by company name + country
          const existing = await prisma.prospect.findFirst({
            where: {
              companyName: { equals: biz.companyName, mode: "insensitive" },
              country: biz.country,
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          await prisma.prospect.create({
            data: {
              companyName: biz.companyName,
              contactName: biz.contactName ?? null,
              contactEmail: biz.contactEmail ?? null,
              contactPhone: biz.contactPhone ?? null,
              website: biz.website ?? null,
              googleMapsUrl: biz.googleMapsUrl ?? null,
              googleRating: biz.googleRating ?? null,
              reviewCount: biz.reviewCount ?? null,
              country: biz.country,
              city: biz.city ?? null,
              region: biz.region ?? null,
              sector: biz.sector,
              employeeEstimate: biz.employeeEstimate ?? null,
              hasWebsite: biz.hasWebsite ?? false,
              status: "SCRAPED",
              source,
              scrapeJobId: this.jobId,
            },
          });

          newCount++;
        }

        return { saved: newCount, skipped: skippedCount };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = ScraperInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: 0,
        tokensUsed: 0,
        durationMs: 0,
        toolCalls: [],
      };
    }

    try {
      await this.markJobStarted();
      this.log("info", "Scraper agent starting", { input: parsed.data });
      await this.updateProgress(10);

      const userPrompt = buildScraperUserPrompt(parsed.data);

      await this.updateProgress(20);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        SCRAPER_SYSTEM_PROMPT
      );

      await this.updateProgress(90);

      if (parsed.data.configId) {
        await prisma.scrapeConfig.update({
          where: { id: parsed.data.configId },
          data: { lastRunAt: new Date() },
        });
      }

      const output = {
        ...((result.data as Record<string, unknown>) ?? {}),
        toolCallCount: this.toolCalls.length,
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      this.log("info", "Scraper agent completed successfully");

      return {
        ...result,
        data: output,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Scraper agent failed: ${error}`);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: 0,
        toolCalls: this.toolCalls,
      };
    }
  }
}
