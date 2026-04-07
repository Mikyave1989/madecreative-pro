import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult, PainPoint } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { outreachTools } from "./tools.js";
import { OUTREACH_SYSTEM_PROMPT, buildOutreachPrompt } from "./prompt.js";
import { OutreachInputSchema } from "./types.js";

const SENDER_NAMES = ["Marco", "Anna", "Luca", "Sarah", "Thomas"];

function getRandomSenderName(): string {
  return SENDER_NAMES[Math.floor(Math.random() * SENDER_NAMES.length)] ?? "Marco";
}

export class OutreachAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return outreachTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "get_prospect_details": {
        const prospect = await prisma.prospect.findUnique({
          where: { id: toolInput["prospectId"] as string },
          include: { outreachEmails: { orderBy: { stepNumber: "asc" } } },
        });
        if (!prospect) return null;

        const { passwordHash: _, ...safeProspect } = prospect as typeof prospect & { passwordHash?: string };
        void _;
        return safeProspect;
      }

      case "check_previous_steps": {
        const count = await prisma.outreachEmail.count({
          where: {
            prospectId: toolInput["prospectId"] as string,
            stepNumber: { lt: toolInput["stepNumber"] as number },
            status: { in: ["sent", "opened", "clicked"] },
          },
        });
        return { previousStepsSent: count, canSendNextStep: count >= (toolInput["stepNumber"] as number) - 1 };
      }

      case "save_outreach_email": {
        const email = await prisma.outreachEmail.create({
          data: {
            prospectId: toolInput["prospectId"] as string,
            stepNumber: toolInput["stepNumber"] as number,
            subject: toolInput["subject"] as string,
            body: toolInput["body"] as string,
            language: toolInput["language"] as string,
            status: "draft",
          },
        });

        // Update prospect status
        await prisma.prospect.update({
          where: { id: toolInput["prospectId"] as string },
          data: { status: "EMAIL_QUEUED" },
        });

        return { emailId: email.id, status: "draft" };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = OutreachInputSchema.safeParse(input);
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
      this.log("info", "Outreach agent starting", { prospectId: parsed.data.prospectId });
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

      if (!prospect.contactEmail) {
        const error = "Prospect has no contact email";
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

      await this.updateProgress(20);

      const senderName = parsed.data.senderName ?? getRandomSenderName();
      const painPoints = (prospect.painPoints as PainPoint[] | null) ?? [];

      const userPrompt = buildOutreachPrompt({
        prospect: {
          companyName: prospect.companyName,
          contactName: prospect.contactName,
          sector: prospect.sector,
          country: prospect.country,
          website: prospect.website,
          googleRating: prospect.googleRating,
          painPoints,
          previewSiteUrl: prospect.previewSiteUrl,
        },
        stepNumber: parsed.data.stepNumber,
        language: parsed.data.language,
        senderName,
      });

      const result = await this.callClaude(
        [
          {
            role: "user",
            content: `${userPrompt}\n\nIMPORTANT: After generating the email, use the save_outreach_email tool to save it with prospectId="${prospect.id}", stepNumber=${parsed.data.stepNumber}, language="${parsed.data.language}".`,
          },
        ],
        OUTREACH_SYSTEM_PROMPT
      );

      await this.updateProgress(95);

      const output = {
        prospectId: prospect.id,
        stepNumber: parsed.data.stepNumber,
        ...(result.data as Record<string, unknown>),
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      this.log("info", "Outreach agent completed successfully");

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Outreach agent failed: ${error}`);
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
