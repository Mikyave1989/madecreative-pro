import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { qaTools } from "./tools.js";
import { QA_SYSTEM_PROMPT, buildQaPrompt } from "./prompt.js";
import { QaInputSchema } from "./types.js";

export class QaAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return qaTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "check_grammar": {
        this.log("info", `Checking grammar for language: ${toolInput["language"]}`);
        // In production, integrate with LanguageTool API
        return { errors: [], score: 95 };
      }

      case "check_seo": {
        this.log("info", "Checking SEO quality");
        const title = toolInput["title"] as string;
        const description = toolInput["description"] as string;
        const issues = [];

        if (title.length < 30 || title.length > 60) {
          issues.push({ type: "seo", severity: "warning", description: "Title length should be between 30-60 characters" });
        }
        if (description.length < 120 || description.length > 160) {
          issues.push({ type: "seo", severity: "warning", description: "Meta description should be between 120-160 characters" });
        }

        return { issues, score: issues.length === 0 ? 100 : 75 };
      }

      case "save_qa_result": {
        const { targetType, targetId, score, passed, summary } = toolInput as {
          targetType: string;
          targetId: string;
          score: number;
          passed: boolean;
          summary: string;
        };

        // Update the target based on type and QA result
        if (targetType === "website") {
          await prisma.clientWebsite.update({
            where: { id: targetId },
            data: {
              lighthouseScore: score,
              status: passed ? "APPROVED" : "REVIEW",
            },
          });
        }

        this.log("info", `QA result saved: score=${score}, passed=${passed}`);
        return { saved: true, targetType, targetId, score, passed, summary };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = QaInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
    }

    try {
      await this.markJobStarted();
      this.log("info", "QA agent starting", { targetType: parsed.data.targetType, targetId: parsed.data.targetId });

      let content: unknown = null;
      let language: string | undefined;

      if (parsed.data.targetType === "website") {
        const website = await prisma.clientWebsite.findUnique({
          where: { id: parsed.data.targetId },
          include: { client: { select: { language: true } } },
        });
        content = website;
        language = website?.client.language;
      } else if (parsed.data.targetType === "email") {
        const email = await prisma.outreachEmail.findUnique({
          where: { id: parsed.data.targetId },
        });
        content = email;
        language = email?.language;
      }

      if (!content) {
        const error = `Target not found: ${parsed.data.targetType}/${parsed.data.targetId}`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(20);

      const userPrompt = buildQaPrompt({
        targetType: parsed.data.targetType,
        content,
        language,
      });

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        QA_SYSTEM_PROMPT
      );

      await this.updateProgress(95);
      const output = { ...(result.data as Record<string, unknown>), apiCost: this.totalCost };
      await this.markJobCompleted(output);

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.markJobFailed(error);
      return { success: false, error, apiCost: this.totalCost, tokensUsed: 0, durationMs: 0, toolCalls: this.toolCalls };
    }
  }
}
