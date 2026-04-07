import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { socialTools } from "./tools.js";
import { SOCIAL_SYSTEM_PROMPT, buildSocialPrompt } from "./prompt.js";
import { SocialAgentInputSchema } from "./types.js";

export class SocialAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return socialTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "generate_post_content": {
        this.log("info", `Generating ${toolInput["platform"]} post content`);
        return { generated: true };
      }

      case "save_social_post": {
        const {
          clientId,
          platform,
          type,
          caption,
          hashtags,
          mediaUrls,
          language,
          scheduledFor,
        } = toolInput as {
          clientId: string;
          platform: string;
          type: string;
          caption: string;
          hashtags?: string;
          mediaUrls?: string[];
          language: string;
          scheduledFor: string;
        };

        const post = await prisma.clientSocialPost.create({
          data: {
            clientId,
            platform,
            type,
            caption,
            hashtags: hashtags ?? null,
            mediaUrls: (mediaUrls ?? []) ,
            language,
            scheduledFor: new Date(scheduledFor),
            status: "draft",
          },
        });

        return { postId: post.id, status: post.status };
      }

      case "publish_to_instagram": {
        const { clientId, postId } = toolInput as {
          clientId: string;
          postId: string;
          mediaUrl?: string;
          caption: string;
        };

        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: {
            igAccessToken: true,
            igAccountId: true,
            socialAutoPublish: true,
          },
        });

        if (!client?.igAccessToken || !client.igAccountId) {
          return { error: "Instagram not connected", published: false };
        }

        if (!client.socialAutoPublish) {
          // Mark as pending approval instead
          await prisma.clientSocialPost.update({
            where: { id: postId },
            data: { status: "scheduled" },
          });
          return { published: false, status: "scheduled", requiresApproval: true };
        }

        // In production: call Meta Graph API to publish
        this.log("info", `Publishing post ${postId} to Instagram`);
        return { published: false, status: "scheduled", message: "Meta API integration pending" };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = SocialAgentInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
    }

    try {
      await this.markJobStarted();
      this.log("info", "Social agent starting", { clientId: parsed.data.clientId });

      const client = await prisma.client.findUnique({
        where: { id: parsed.data.clientId },
        select: { companyName: true, sector: true, language: true },
      });

      if (!client) {
        const error = `Client ${parsed.data.clientId} not found`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(20);

      const userPrompt = `${buildSocialPrompt({
        clientName: client.companyName,
        sector: client.sector,
        platform: parsed.data.platform,
        postType: parsed.data.postType,
        language: client.language,
        topic: parsed.data.topic,
      })}

After generating the content, use the save_social_post tool with:
- clientId: "${parsed.data.clientId}"
- platform: "${parsed.data.platform}"
- type: "${parsed.data.postType}"
- language: "${client.language}"
- scheduledFor: "${parsed.data.scheduledFor}"`;

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        SOCIAL_SYSTEM_PROMPT
      );

      await this.updateProgress(95);
      const output = { clientId: parsed.data.clientId, ...(result.data as Record<string, unknown>), apiCost: this.totalCost };
      await this.markJobCompleted(output);

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.markJobFailed(error);
      return { success: false, error, apiCost: this.totalCost, tokensUsed: 0, durationMs: 0, toolCalls: this.toolCalls };
    }
  }
}
