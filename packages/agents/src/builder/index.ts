import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { builderTools } from "./tools.js";
import { BUILDER_SYSTEM_PROMPT, buildBuilderUserPrompt } from "./prompt.js";
import { BuilderInputSchema } from "./types.js";

const SECTOR_DESIGN_TOKENS: Record<string, Record<string, string>> = {
  restaurant: {
    primaryColor: "#D4501A",
    secondaryColor: "#F5E6D3",
    accentColor: "#2C3E50",
    fontHeading: "Playfair Display",
    fontBody: "Lato",
    borderRadius: "8px",
  },
  dental: {
    primaryColor: "#0077B6",
    secondaryColor: "#E8F4FD",
    accentColor: "#00B4D8",
    fontHeading: "Nunito",
    fontBody: "Open Sans",
    borderRadius: "12px",
  },
  legal: {
    primaryColor: "#1A1A2E",
    secondaryColor: "#F0F0F0",
    accentColor: "#C5A028",
    fontHeading: "Merriweather",
    fontBody: "Source Sans Pro",
    borderRadius: "4px",
  },
  fitness: {
    primaryColor: "#FF6B35",
    secondaryColor: "#1A1A1A",
    accentColor: "#FFD700",
    fontHeading: "Oswald",
    fontBody: "Roboto",
    borderRadius: "6px",
  },
  beauty: {
    primaryColor: "#D4A5A5",
    secondaryColor: "#FDF0F0",
    accentColor: "#8B5E5E",
    fontHeading: "Cormorant Garamond",
    fontBody: "Jost",
    borderRadius: "20px",
  },
  hotel: {
    primaryColor: "#2C3E50",
    secondaryColor: "#F8F5F0",
    accentColor: "#C9A84C",
    fontHeading: "Cormorant",
    fontBody: "Raleway",
    borderRadius: "2px",
  },
  medical: {
    primaryColor: "#006E7F",
    secondaryColor: "#E8F7F9",
    accentColor: "#00B4CC",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "10px",
  },
  professional: {
    primaryColor: "#2563EB",
    secondaryColor: "#F0F6FF",
    accentColor: "#1E40AF",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "8px",
  },
};

export class BuilderAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return builderTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "fetch_template": {
        const slug = toolInput["templateSlug"] as string;
        // Return template structure based on sector
        return {
          slug,
          pages: ["home", "about", "services", "contact"],
          defaultSections: {
            home: ["hero", "features", "cta", "testimonials"],
            about: ["story", "team", "values"],
            services: ["services-grid", "pricing", "faq"],
            contact: ["contact-form", "map", "info"],
          },
        };
      }

      case "generate_page_content": {
        // This would normally call Claude, but since we're inside an agent, return placeholder
        const pageType = toolInput["pageType"] as string;
        const biz = toolInput["businessInfo"] as Record<string, string>;
        return {
          pageType,
          title: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} - ${biz["name"]}`,
          content: `Generated ${pageType} content for ${biz["name"]}`,
        };
      }

      case "select_design_tokens": {
        const sector = (toolInput["sector"] as string).toLowerCase();
        return (
          SECTOR_DESIGN_TOKENS[sector] ??
          SECTOR_DESIGN_TOKENS["professional"] ?? {
            primaryColor: "#2563EB",
            secondaryColor: "#F0F6FF",
            accentColor: "#1E40AF",
            fontHeading: "Inter",
            fontBody: "Inter",
            borderRadius: "8px",
          }
        );
      }

      case "save_website": {
        const {
          clientId,
          websiteId,
          name,
          pages,
          designTokens,
          seoConfig,
        } = toolInput as {
          clientId: string;
          websiteId?: string;
          name: string;
          pages: unknown[];
          designTokens: Record<string, string>;
          seoConfig?: Record<string, unknown>;
        };

        let website;
        if (websiteId) {
          website = await prisma.clientWebsite.update({
            where: { id: websiteId },
            data: {
              name,
              pages: pages ,
              designTokens,
              seoConfig: seoConfig ,
              status: "REVIEW",
              updatedAt: new Date(),
            },
          });
        } else {
          website = await prisma.clientWebsite.create({
            data: {
              clientId,
              name,
              pages: pages ,
              designTokens,
              seoConfig: seoConfig ,
              status: "REVIEW",
            },
          });
        }

        return { websiteId: website.id, status: website.status };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = BuilderInputSchema.safeParse(input);
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
      this.log("info", "Builder agent starting", { clientId: parsed.data.clientId });
      await this.updateProgress(10);

      const client = await prisma.client.findUnique({
        where: { id: parsed.data.clientId },
      });

      if (!client) {
        const error = `Client ${parsed.data.clientId} not found`;
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

      const userPrompt = buildBuilderUserPrompt({
        companyName: client.companyName,
        sector: client.sector,
        country: client.country,
        language: client.language,
        city: client.city,
        templateSlug: parsed.data.templateSlug,
        customizations: parsed.data.customizations,
      });

      const result = await this.callClaude(
        [{ role: "user", content: `${userPrompt}\n\nClient ID: ${client.id}${parsed.data.websiteId ? `\nWebsite ID: ${parsed.data.websiteId}` : ""}` }],
        BUILDER_SYSTEM_PROMPT
      );

      await this.updateProgress(95);

      const output = {
        clientId: client.id,
        ...(result.data as Record<string, unknown>),
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      this.log("info", "Builder agent completed successfully");

      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `Builder agent failed: ${error}`);
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
