import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { analyzerTools } from "./tools.js";
import {
  ANALYZER_SYSTEM_PROMPT,
  buildAnalyzerUserPrompt,
} from "./prompt.js";
import { AnalyzerInputSchema } from "./types.js";

export class AnalyzerAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return analyzerTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "analyze_website": {
        const url = toolInput["url"] as string;
        this.log("info", `Analyzing website: ${url}`);

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "MadeCreativeBot/1.0" },
          });
          clearTimeout(timeout);

          return {
            exists: response.ok,
            status: response.status,
            hasSSL: url.startsWith("https"),
            // In production, integrate with PageSpeed Insights API
            mobileOptimized: null,
            loadSpeed: null,
            seoScore: null,
            designQuality: null,
          };
        } catch {
          return {
            exists: false,
            status: 0,
            hasSSL: false,
            mobileOptimized: null,
            loadSpeed: null,
          };
        }
      }

      case "check_social_presence": {
        this.log(
          "info",
          `Checking social presence for: ${toolInput["companyName"]}`
        );
        // In production, integrate with social media APIs
        return {
          facebook: null,
          instagram: null,
          googleMyBusiness: null,
          overallScore: 0,
        };
      }

      case "save_analysis": {
        const {
          prospectId,
          leadScore,
          websiteQuality,
          socialPresence,
          painPoints,
          suggestedServices,
          aiAnalysis,
        } = toolInput as {
          prospectId: string;
          leadScore: number;
          websiteQuality?: number;
          socialPresence?: number;
          painPoints: Array<{ category: string; description: string; severity: string }>;
          suggestedServices: Array<{ serviceType: string; priority: number; rationale: string; estimatedValue: number }>;
          aiAnalysis: string;
        };

        await prisma.prospect.update({
          where: { id: prospectId },
          data: {
            leadScore,
            websiteQuality: websiteQuality ?? null,
            socialPresence: socialPresence ?? null,
            painPoints: painPoints ,
            suggestedServices: suggestedServices ,
            aiAnalysis,
            status: "ANALYZED",
            updatedAt: new Date(),
          },
        });

        return { saved: true, prospectId };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = AnalyzerInputSchema.safeParse(input);
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
      this.log("info", "Analyzer agent starting", { prospectId: parsed.data.prospectId });
      await this.updateProgress(10);

      const prospect = await prisma.prospect.findUnique({
        where: { id: parsed.data.prospectId },
      });

      if (!prospect) {
        const error = `Prospect ${parsed.data.prospectId} not found`;
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

      if (prospect.status === "ANALYZED" && !parsed.data.forceReanalyze) {
        this.log("info", "Prospect already analyzed, skipping");
        await this.markJobCompleted({ skipped: true, reason: "Already analyzed" });
        return {
          success: true,
          data: { skipped: true },
          apiCost: 0,
          tokensUsed: 0,
          durationMs: 0,
          toolCalls: [],
        };
      }

      await this.updateProgress(20);

      const userPrompt = buildAnalyzerUserPrompt({
        companyName: prospect.companyName,
        website: prospect.website,
        sector: prospect.sector,
        country: prospect.country,
        googleRating: prospect.googleRating,
        reviewCount: prospect.reviewCount,
      });

      const result = await this.callClaude(
        [{ role: "user", content: `${userPrompt}\n\nProspect ID for saving results: ${prospect.id}` }],
        ANALYZER_SYSTEM_PROMPT
      );

      await this.updateProgress(95);

      const output = {
        prospectId: prospect.id,
        ...(result.data as Record<string, unknown>),
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      this.log("info", "Analyzer agent completed successfully");

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Analyzer agent failed: ${error}`);
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
