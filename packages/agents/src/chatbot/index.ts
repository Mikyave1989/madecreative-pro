import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { chatbotTools } from "./tools.js";
import { CHATBOT_AGENT_SYSTEM_PROMPT, buildChatbotSetupPrompt } from "./prompt.js";
import { ChatbotAgentInputSchema } from "./types.js";
import type {
  KnowledgeBaseData,
  ChatbotPersonaData,
  WidgetConfigData,
  TestResult,
  FAQData,
  BusinessInfoData,
  ServiceInfoData,
} from "./types.js";

// Sector to default widget color mapping
const SECTOR_COLORS: Record<string, string> = {
  restaurant: "#e85d04",
  dental: "#2563eb",
  medical: "#2563eb",
  fitness: "#16a34a",
  legal: "#1e293b",
  beauty: "#db2777",
  hotel: "#92400e",
  realestate: "#0891b2",
  ecommerce: "#7c3aed",
  automotive: "#dc2626",
  education: "#0284c7",
  finance: "#1d4ed8",
  professional: "#374151",
  retail: "#7c3aed",
  other: "#6366f1",
};

// Sector to chatbot tone mapping
const SECTOR_TONES: Record<string, string> = {
  restaurant: "warm",
  dental: "professional",
  medical: "professional",
  fitness: "energetic",
  legal: "formal",
  beauty: "friendly",
  hotel: "professional",
  realestate: "professional",
  ecommerce: "friendly",
  automotive: "professional",
  education: "friendly",
  finance: "formal",
  professional: "professional",
  retail: "friendly",
  other: "professional",
};

export class ChatbotAgent extends BaseAgent {
  // Accumulated knowledge base state across tool calls
  private knowledgeBase: KnowledgeBaseData | null = null;
  private persona: ChatbotPersonaData | null = null;
  private widgetConfig: WidgetConfigData | null = null;
  private testResults: TestResult[] = [];
  private reviewEnrichments: {
    implicitFAQs?: FAQData[];
    positiveThemes?: string[];
  } = {};

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
      case "build_knowledge_base": {
        this.log("info", "Building knowledge base");

        const input = toolInput as {
          businessName: string;
          sector: string;
          language: string;
          city?: string;
          websiteContent?: string;
          faqs: FAQData[];
          businessInfo: BusinessInfoData;
          services: ServiceInfoData[];
          policies?: string[];
        };

        this.knowledgeBase = {
          faqs: input.faqs ?? [],
          businessInfo: input.businessInfo,
          services: input.services ?? [],
          policies: input.policies ?? [],
          customRules: [],
        };

        this.log("info", `Knowledge base built: ${this.knowledgeBase.faqs.length} FAQs, ${this.knowledgeBase.services.length} services`);

        return {
          success: true,
          faqCount: this.knowledgeBase.faqs.length,
          serviceCount: this.knowledgeBase.services.length,
          hasBusinessInfo: !!this.knowledgeBase.businessInfo,
        };
      }

      case "train_on_reviews": {
        this.log("info", "Training on reviews");

        const input = toolInput as {
          reviews: Array<{ text: string; rating: number; author?: string }>;
          positiveThemes?: string[];
          implicitQuestions?: FAQData[];
          customerExpectations?: string[];
        };

        this.reviewEnrichments = {
          implicitFAQs: input.implicitQuestions ?? [],
          positiveThemes: input.positiveThemes ?? [],
        };

        // Merge implicit FAQs into knowledge base if available
        if (this.knowledgeBase && input.implicitQuestions && input.implicitQuestions.length > 0) {
          this.knowledgeBase.faqs = [
            ...this.knowledgeBase.faqs,
            ...input.implicitQuestions.map((q) => ({ ...q, category: "reviews" })),
          ];
        }

        this.log("info", `Review training complete: ${input.reviews.length} reviews processed, ${input.implicitQuestions?.length ?? 0} new FAQs added`);

        return {
          success: true,
          reviewsProcessed: input.reviews.length,
          newFaqsAdded: input.implicitQuestions?.length ?? 0,
          positiveThemes: input.positiveThemes ?? [],
        };
      }

      case "generate_persona": {
        this.log("info", "Generating chatbot persona");

        const input = toolInput as {
          businessName: string;
          sector: string;
          language: string;
          personaName: string;
          tone: string;
          greeting: string;
          fallbackMessage: string;
          openingPhrases?: string[];
        };

        const tone = (input.tone ?? SECTOR_TONES[input.sector] ?? "professional") as ChatbotPersonaData["tone"];

        this.persona = {
          name: input.personaName,
          tone,
          language: input.language,
          greeting: input.greeting,
          fallbackMessage: input.fallbackMessage,
          openingPhrases: input.openingPhrases ?? [],
        };

        // Generate widget config based on persona
        const color = SECTOR_COLORS[input.sector] ?? "#6366f1";
        this.widgetConfig = {
          position: "bottom-right",
          primaryColor: color,
          title: input.personaName,
          subtitle: `Assistente di ${input.businessName}`,
          avatarEmoji: this.getSectorEmoji(input.sector),
        };

        this.log("info", `Persona generated: ${this.persona.name}, tone: ${this.persona.tone}`);

        return {
          success: true,
          personaName: this.persona.name,
          tone: this.persona.tone,
          widgetColor: color,
        };
      }

      case "test_chatbot": {
        this.log("info", "Testing chatbot quality");

        const input = toolInput as {
          sector: string;
          language: string;
          testQuestions: Array<{ question: string; expectedTheme?: string }>;
          results: TestResult[];
          avgScore: number;
          needsImprovement?: boolean;
          improvements?: string[];
        };

        this.testResults = input.results ?? [];
        const avgScore = input.avgScore ?? 0;

        this.log("info", `Test complete: avgScore=${avgScore.toFixed(1)}, needsImprovement=${input.needsImprovement}`);

        if (input.needsImprovement && input.improvements && input.improvements.length > 0) {
          this.log("warn", "Knowledge base needs improvement", { improvements: input.improvements });
          // Add improvement notes as custom rules to the KB
          if (this.knowledgeBase) {
            this.knowledgeBase.customRules = [
              ...(this.knowledgeBase.customRules ?? []),
              ...input.improvements,
            ];
          }
        }

        return {
          success: true,
          avgScore,
          testCount: this.testResults.length,
          needsImprovement: input.needsImprovement ?? false,
          passed: avgScore >= 7,
        };
      }

      case "activate_widget": {
        this.log("info", "Activating chatbot widget");

        const input = toolInput as {
          clientId: string;
          chatbotId?: string;
          chatbotName: string;
          knowledgeBase: Record<string, unknown>;
          persona: Record<string, unknown>;
          widgetConfig: Record<string, unknown>;
          activateImmediately?: boolean;
        };

        // Use accumulated state if available, fall back to input
        const kb = this.knowledgeBase ?? (input.knowledgeBase as KnowledgeBaseData);
        const persona = this.persona ?? (input.persona as ChatbotPersonaData);
        const wc = this.widgetConfig ?? (input.widgetConfig as WidgetConfigData);
        const shouldActivate = input.activateImmediately ?? true;

        let chatbot;

        if (input.chatbotId) {
          chatbot = await prisma.clientChatbot.update({
            where: { id: input.chatbotId },
            data: {
              knowledgeBase: kb as Parameters<typeof prisma.clientChatbot.update>[0] extends { data: infer D } ? D extends { knowledgeBase?: infer K } ? K : never : never,
              widgetConfig: wc as Parameters<typeof prisma.clientChatbot.update>[0] extends { data: infer D } ? D extends { widgetConfig?: infer W } ? W : never : never,
              isActive: shouldActivate,
            },
          });
        } else {
          chatbot = await prisma.clientChatbot.create({
            data: {
              clientId: input.clientId,
              knowledgeBase: kb as Parameters<typeof prisma.clientChatbot.create>[0] extends { data: infer D } ? D extends { knowledgeBase?: infer K } ? K : never : never,
              widgetConfig: wc as Parameters<typeof prisma.clientChatbot.create>[0] extends { data: infer D } ? D extends { widgetConfig?: infer W } ? W : never : never,
              isActive: shouldActivate,
            },
          });
        }

        const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";
        const embedSnippet = `<script>window.MadeCreativeConfig={chatbotId:"${chatbot.id}",apiUrl:"${apiUrl}"};</script><script src="${apiUrl}/public/chatbot-widget.js" async defer></script>`;

        this.log("info", `Widget activated: chatbotId=${chatbot.id}, isActive=${shouldActivate}`);

        return {
          success: true,
          chatbotId: chatbot.id,
          isActive: chatbot.isActive,
          embedSnippet,
          status: shouldActivate ? "ACTIVE" : "INACTIVE",
        };
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
      this.log("info", "ChatbotAgent starting", { clientId: parsed.data.clientId });

      const client = await prisma.client.findUnique({
        where: { id: parsed.data.clientId },
        include: {
          chatbot: true,
          prospect: { select: { aiAnalysis: true } },
        },
      });

      if (!client) {
        const error = `Client ${parsed.data.clientId} not found`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(10);

      // Determine chatbot ID — use existing if updating
      const existingChatbotId =
        parsed.data.chatbotId ?? client.chatbot?.id;

      // Build review sample from stored prospect analysis if available
      const reviewSample = client.prospect?.aiAnalysis
        ? extractReviewSample(client.prospect.aiAnalysis)
        : null;

      const userPrompt = `${buildChatbotSetupPrompt({
        companyName: client.companyName,
        sector: client.sector,
        language: client.language,
        city: client.city,
        websiteUrl: parsed.data.websiteUrl ?? null,
        reviewSample,
      })}

Client ID: ${client.id}${existingChatbotId ? `\nChatbot ID (update existing): ${existingChatbotId}` : ""}`;

      await this.updateProgress(20);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        CHATBOT_AGENT_SYSTEM_PROMPT,
        { maxTokens: 8192 }
      );

      await this.updateProgress(90);

      const output = {
        clientId: client.id,
        chatbotId: this.findChatbotIdFromToolCalls(),
        testResults: this.testResults,
        avgTestScore:
          this.testResults.length > 0
            ? this.testResults.reduce((sum, r) => sum + r.score, 0) / this.testResults.length
            : null,
        kbFaqCount: this.knowledgeBase?.faqs.length ?? 0,
        kbServiceCount: this.knowledgeBase?.services.length ?? 0,
        personaName: this.persona?.name ?? null,
        apiCost: this.totalCost,
        ...(result.data as Record<string, unknown>),
      };

      await this.markJobCompleted(output);
      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.markJobFailed(error);
      return { success: false, error, apiCost: this.totalCost, tokensUsed: 0, durationMs: 0, toolCalls: this.toolCalls };
    }
  }

  private findChatbotIdFromToolCalls(): string | null {
    const activateCall = this.toolCalls
      .reverse()
      .find((tc) => tc.toolName === "activate_widget");
    if (activateCall && typeof activateCall.output === "object" && activateCall.output !== null) {
      const output = activateCall.output as Record<string, unknown>;
      return typeof output["chatbotId"] === "string" ? output["chatbotId"] : null;
    }
    return null;
  }

  private getSectorEmoji(sector: string): string {
    const map: Record<string, string> = {
      restaurant: "🍽️",
      dental: "🦷",
      medical: "🏥",
      fitness: "💪",
      legal: "⚖️",
      beauty: "💄",
      hotel: "🏨",
      realestate: "🏠",
      ecommerce: "🛍️",
      automotive: "🚗",
      education: "📚",
      finance: "💼",
      professional: "👔",
      retail: "🏪",
      other: "💬",
    };
    return map[sector] ?? "💬";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractReviewSample(aiAnalysis: string): string | null {
  try {
    // If the analysis is JSON, try to extract reviews
    const parsed = JSON.parse(aiAnalysis) as Record<string, unknown>;
    if (Array.isArray(parsed["reviews"])) {
      const reviews = parsed["reviews"] as Array<{
        text?: string;
        rating?: number;
        author?: string;
      }>;
      return reviews
        .slice(0, 20)
        .map(
          (r) =>
            `[${r.rating ?? "?"}★] ${r.author ? r.author + ": " : ""}${r.text ?? ""}`
        )
        .join("\n");
    }
  } catch {
    // Not JSON — return null
  }
  return null;
}
