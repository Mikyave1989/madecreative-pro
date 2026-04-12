/**
 * AI Site Generator — unified endpoint that uses Claude to generate premium sites.
 * Same AI, same quality, same libraries as the portal editor (Stitch).
 * Used by: landing page preview, campaign builder, email previews.
 *
 * POST /public/ai-generate
 * Body: { scrapedData?: ScrapedWebsite, name: string, sector: string, language?: string }
 * Returns: { files: Record<string, string>, previewHtml: string }
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

const app = new Hono();

// The same tools as the portal editor — write_file only (we generate, not edit)
const TOOLS: Tool[] = [
  {
    name: "write_file",
    description: "Create a file in the project. Path relative to project root.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path (e.g. 'app/page.tsx', 'components/Hero.tsx')" },
        content: { type: "string", description: "Complete file content" },
      },
      required: ["path", "content"],
    },
  },
];

// Build the prompt for a full site generation
function buildGenerationPrompt(data: {
  name: string;
  sector: string;
  language: string;
  description?: string;
  images?: Array<{ url: string; alt: string }>;
  headings?: string[];
  paragraphs?: string[];
  contact?: { phone?: string | null; email?: string | null; address?: string | null };
  logo?: string | null;
  navigation?: Array<{ label: string; url: string }>;
  googleRating?: number;
  reviewCount?: number;
}): string {
  const lang = data.language === "de" ? "German" : data.language === "it" ? "Italian" : data.language === "fr" ? "French" : data.language === "es" ? "Spanish" : "English";

  const hasContent = (data.images?.length ?? 0) > 0 || (data.paragraphs?.length ?? 0) > 0;

  let contentBlock = "";
  if (hasContent) {
    contentBlock = `\n\nREAL CONTENT FROM THE EXISTING WEBSITE (use this, don't invent):`;
    if (data.images && data.images.length > 0) {
      contentBlock += `\n\nIMAGES (use these real photos, not stock):`;
      data.images.slice(0, 12).forEach((img, i) => {
        contentBlock += `\n  ${i + 1}. ${img.url} (${img.alt})`;
      });
    }
    if (data.headings && data.headings.length > 0) {
      contentBlock += `\n\nHEADINGS FROM SITE:\n  ${data.headings.slice(0, 15).join("\n  ")}`;
    }
    if (data.paragraphs && data.paragraphs.length > 0) {
      contentBlock += `\n\nTEXT CONTENT:\n  ${data.paragraphs.slice(0, 10).join("\n  ")}`;
    }
    if (data.navigation && data.navigation.length > 0) {
      contentBlock += `\n\nNAVIGATION PAGES: ${data.navigation.map(n => n.label).join(", ")}`;
    }
  }

  let contactBlock = "";
  if (data.contact) {
    const parts: string[] = [];
    if (data.contact.phone) parts.push(`Phone: ${data.contact.phone}`);
    if (data.contact.email) parts.push(`Email: ${data.contact.email}`);
    if (data.contact.address) parts.push(`Address: ${data.contact.address}`);
    if (parts.length > 0) contactBlock = `\n\nCONTACT INFO: ${parts.join(" | ")}`;
  }

  return `Build a COMPLETE, premium website for "${data.name}" (sector: ${data.sector}). Write ALL files needed for a Next.js 14 project. Respond in ${lang}.
${contentBlock}${contactBlock}
${data.logo ? `\nLOGO URL: ${data.logo}` : ""}
${data.googleRating ? `\nGoogle Rating: ${data.googleRating}/5 (${data.reviewCount ?? 0}+ reviews)` : ""}

REQUIREMENTS:
1. Create a COMPLETE multi-page site with: homepage, about, services/gallery, contact
2. Use Tailwind CSS with a premium color palette matching the ${data.sector} sector
3. Use Framer Motion for scroll animations, hover effects, page transitions
4. Add premium effects: animated gradient text on hero, magic card hover on service cards, number ticker on stats, blur-fade reveals on scroll
5. Include: sticky glassmorphism nav with mobile hamburger, hero with parallax image, stats section, testimonials, gallery grid, contact form, WhatsApp widget, footer
6. Use the REAL images and text provided above — do NOT use placeholder/stock content
7. Mobile-first responsive design
8. SEO: proper meta tags, Schema.org, Open Graph

Create these files using write_file:
- package.json (with next, react, framer-motion, tailwindcss, lucide-react)
- tailwind.config.ts
- app/globals.css
- app/layout.tsx
- app/page.tsx
- components/Nav.tsx (with mobile hamburger)
- components/Hero.tsx (with parallax + animated text)
- components/Footer.tsx
- lib/data.ts (all business data as constants)
- Any additional components needed

Build something that looks like a €10,000+ professional website.`;
}

// POST /public/ai-generate — generate a full site using AI
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.name) return c.json({ success: false, error: "name is required" }, 400);

  const name = (body.name as string).trim();
  const sector = ((body.sector as string) ?? "professional").trim();
  const language = ((body.language as string) ?? "de").trim();

  // Build prompt with scraped data if available
  const scraped = body.scrapedData as Record<string, unknown> | undefined;
  const promptData: Parameters<typeof buildGenerationPrompt>[0] = {
    name,
    sector,
    language,
    description: (scraped?.pages as Array<Record<string, unknown>>)?.[0]?.metaDescription as string | undefined,
    images: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => (p.images as Array<{ url: string; alt: string }>) ?? []
    )?.filter((img: { url: string }) => !img.url.includes("icon") && !img.url.includes("logo")),
    headings: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => ((p.headings as Array<{ text: string }>) ?? []).map(h => h.text)
    ),
    paragraphs: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => (p.paragraphs as string[]) ?? []
    ),
    contact: scraped?.contact as { phone?: string | null; email?: string | null; address?: string | null } | undefined,
    logo: scraped?.logo as string | null | undefined,
    navigation: scraped?.navigation as Array<{ label: string; url: string }> | undefined,
    googleRating: body.googleRating as number | undefined,
    reviewCount: body.reviewCount as number | undefined,
  };

  const prompt = buildGenerationPrompt(promptData);

  // Use the same system prompt as the portal editor
  const { getClaudeClient } = await import("@madecreative/ai");
  const claude = getClaudeClient();

  const projectFiles: Record<string, string> = {};

  try {
    const result = await claude.toolUseLoop(
      [{ role: "user", content: prompt }],
      async (toolName, toolInput) => {
        if (toolName === "write_file") {
          const path = toolInput["path"] as string;
          const content = toolInput["content"] as string;
          if (path && content) {
            projectFiles[path] = content;
            return { success: true, path, size: content.length };
          }
          return { error: "path and content required" };
        }
        return { error: `Unknown tool: ${toolName}` };
      },
      {
        system: `You are a world-class AI full-stack developer. You build stunning, production-ready websites using React, Next.js 14, Tailwind CSS, Framer Motion, and Lucide React icons. You know premium UI patterns: Magic Card (spotlight follow mouse), animated gradient text, number ticker, blur-fade scroll reveals, border beam, marquee, bento grid, parallax sections. Always respond in ${language === "de" ? "German" : language === "it" ? "Italian" : "English"}. NEVER ask questions — build immediately. Use write_file to create every file.`,
        tools: TOOLS,
        model: "claude-sonnet-4-6" as const,
        maxTokens: 16384,
      }
    );

    if (Object.keys(projectFiles).length === 0) {
      return c.json({ success: false, error: "AI generated no files" }, 500);
    }

    // Generate preview HTML from the AI-generated project
    const { projectToPreviewHtml } = await import("@madecreative/shared");
    const previewHtml = projectToPreviewHtml(projectFiles);

    return c.json({
      success: true,
      data: {
        files: projectFiles,
        fileCount: Object.keys(projectFiles).length,
        previewHtml,
        usage: {
          inputTokens: result.totalInputTokens,
          outputTokens: result.totalOutputTokens,
          cost: result.totalCost,
        },
      },
    });
  } catch (err) {
    console.error("[ai-generate] Error:", err instanceof Error ? err.message : String(err));
    return c.json({ success: false, error: "AI generation failed" }, 500);
  }
});

// POST /public/ai-generate/stream — SSE streaming version (no timeout issues)
app.post("/stream", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.name) return c.json({ success: false, error: "name is required" }, 400);

  const name = (body.name as string).trim();
  const sector = ((body.sector as string) ?? "professional").trim();
  const language = ((body.language as string) ?? "de").trim();

  const scraped = body.scrapedData as Record<string, unknown> | undefined;
  const promptData: Parameters<typeof buildGenerationPrompt>[0] = {
    name, sector, language,
    description: (scraped?.pages as Array<Record<string, unknown>>)?.[0]?.metaDescription as string | undefined,
    images: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => (p.images as Array<{ url: string; alt: string }>) ?? []
    )?.filter((img: { url: string }) => !img.url.includes("icon") && !img.url.includes("logo")),
    headings: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => ((p.headings as Array<{ text: string }>) ?? []).map(h => h.text)
    ),
    paragraphs: (scraped?.pages as Array<Record<string, unknown>>)?.flatMap(
      (p: Record<string, unknown>) => (p.paragraphs as string[]) ?? []
    ),
    contact: scraped?.contact as { phone?: string | null; email?: string | null; address?: string | null } | undefined,
    logo: scraped?.logo as string | null | undefined,
    navigation: scraped?.navigation as Array<{ label: string; url: string }> | undefined,
    googleRating: body.googleRating as number | undefined,
    reviewCount: body.reviewCount as number | undefined,
  };

  const prompt = buildGenerationPrompt(promptData);

  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    const { getClaudeClient } = await import("@madecreative/ai");
    const claude = getClaudeClient();
    const projectFiles: Record<string, string> = {};
    let fileCount = 0;

    try {
      const generator = claude.streamToolUseLoop(
        [{ role: "user", content: prompt }],
        async (toolName, toolInput) => {
          if (toolName === "write_file") {
            const path = toolInput["path"] as string;
            const content = toolInput["content"] as string;
            if (path && content) {
              projectFiles[path] = content;
              fileCount++;
              await stream.writeSSE({ data: JSON.stringify({ type: "file_created", path, fileCount }) });
              return { success: true, path, size: content.length };
            }
          }
          return { error: "Unknown tool" };
        },
        {
          system: `You are a world-class AI full-stack developer. Build stunning €10k+ websites with Next.js 14, Tailwind CSS, Framer Motion. Use premium effects: Magic Card, animated gradient text, blur-fade, number ticker, parallax. Use the REAL content provided (images, text, headings). NEVER ask questions — build immediately using write_file.`,
          tools: TOOLS,
          model: "claude-sonnet-4-6" as const,
          maxTokens: 16384,
        }
      );

      for await (const event of generator) {
        if (event.type === "done") {
          // Generate preview HTML
          const { projectToPreviewHtml } = await import("@madecreative/shared");
          const previewHtml = projectToPreviewHtml(projectFiles);
          await stream.writeSSE({ data: JSON.stringify({ type: "complete", previewHtml, fileCount, files: Object.keys(projectFiles) }) });
        } else if (event.type === "text_delta") {
          // Stream AI thinking text (optional, for UX)
          await stream.writeSSE({ data: JSON.stringify({ type: "text", text: event.text }) });
        }
      }
    } catch (err) {
      console.error("[ai-generate/stream] Error:", err instanceof Error ? err.message : String(err));
      await stream.writeSSE({ data: JSON.stringify({ type: "error", message: "AI generation failed" }) });
    }
  });
});

export default app;
