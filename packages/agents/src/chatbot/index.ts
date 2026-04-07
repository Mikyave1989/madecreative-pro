import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { chatbotTools } from "./tools.js";
import { CHATBOT_SYSTEM_PROMPT, buildChatbotSetupPrompt } from "./prompt.js";
import { ChatbotAgentInputSchema } from "./types.js";

export class ChatbotAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return chatbotTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "generate_knowledge_base": {
        // This generates structured knowledge base content
        this.log("info", "Generating knowledge base");
        return { generated: true };
      }

      case "save_chatbot": {
        const {
          clientId,
          chatbotId,
          name,
          knowledgeBase,
          personality,
          widgetConfig,
        } = toolInput as {
          clientId: string;
          chatbotId?: string;
          name: string;
          knowledgeBase: Record<string, unknown>;
          personality?: Record<string, unknown>;
          widgetConfig?: Record<string, unknown>;
        };

        let chatbot;
        if (chatbotId) {
          chatbot = await prisma.clientChatbot.update({
            where: { id: chatbotId },
            data: {
              name,
              knowledgeBase: knowledgeBase ,
              personality: personality ,
              widgetConfig: widgetConfig ,
            },
          });
        } else {
          chatbot = await prisma.clientChatbot.create({
            data: {
              clientId,
              name,
              knowledgeBase: knowledgeBase ,
              personality: personality ,
              widgetConfig: widgetConfig ,
              isActive: false,
            },
          });
        }

        return { chatbotId: chatbot.id, status: "created" };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = ChatbotAgentInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
    }

    try {
      await this.markJobStarted();
      this.log("info", "Chatbot agent starting", { clientId: parsed.data.clientId });

      const client = await prisma.client.findUnique({
        where: { id: parsed.data.clientId },
      });

      if (!client) {
        const error = `Client ${parsed.data.clientId} not found`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(20);

      const userPrompt = `${buildChatbotSetupPrompt({
        companyName: client.companyName,
        sector: client.sector,
        language: client.language,
        city: client.city,
      })}\n\nClient ID: ${client.id}${parsed.data.chatbotId ? `\nChatbot ID: ${parsed.data.chatbotId}` : ""}`;

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        CHATBOT_SYSTEM_PROMPT
      );

      await this.updateProgress(95);
      const output = { clientId: client.id, ...(result.data as Record<string, unknown>), apiCost: this.totalCost };
      await this.markJobCompleted(output);

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.markJobFailed(error);
      return { success: false, error, apiCost: this.totalCost, tokensUsed: 0, durationMs: 0, toolCalls: this.toolCalls };
    }
  }
}
