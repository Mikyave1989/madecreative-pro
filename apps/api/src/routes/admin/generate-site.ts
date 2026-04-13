/**
 * POST /admin/generate-site
 *
 * Calls bolt.diy editor to generate a premium site from a scraped URL.
 * This uses the SAME engine as the dashboard — same prompt, same quality.
 *
 * Flow:
 * 1. Scrapes the target website
 * 2. Calls bolt.diy /api/chat with the scraped content as user message
 * 3. Parses SSE stream to extract boltAction file creations
 * 4. Returns generated files for Vercel deployment
 *
 * Body: { url: string, sector?: string, prospectId?: string }
 */
import { Hono } from "hono";

const app = new Hono();

const BOLT_URL = process.env["EDITOR_URL"] ?? "https://madecreative.pro";
const ANTHROPIC_KEY = process.env["ANTHROPIC_API_KEY"] ?? "";

interface ScrapedPage {
  url: string;
  title?: string;
  headings?: Array<{ level: number; text: string }>;
  paragraphs?: string[];
  images?: Array<{ url: string; alt?: string }>;
  videos?: Array<{ url: string; type: string }>;
}

interface ScrapedData {
  pages: ScrapedPage[];
  logo?: string;
  contact?: { phone?: string; email?: string; address?: string; whatsapp?: string };
  colors?: { primary?: string; accent?: string; background?: string; text?: string };
  socialLinks?: { facebook?: string; instagram?: string };
}

/**
 * Call bolt.diy's /api/chat endpoint and parse the SSE response
 * to extract generated files from <boltAction> tags.
 */
async function callBoltDiy(message: string): Promise<{ text: string; files: Record<string, string> }> {
  const apiKeys = { Anthropic: ANTHROPIC_KEY };

  const body = {
    messages: [{
      role: "user",
      content: `[Model: claude-sonnet-4-6]\n\n[Provider: Anthropic]\n\n${message}`,
    }],
    files: {},
    contextOptimization: false,
    chatMode: "build",
    maxLLMSteps: 5,
  };

  const res = await fetch(`${BOLT_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `apiKeys=${encodeURIComponent(JSON.stringify(apiKeys))}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`bolt.diy API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  // Parse SSE stream
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("0:")) continue; // text-delta lines start with "0:"
      try {
        const text = JSON.parse(line.slice(2)) as string;
        fullText += text;
      } catch { /* skip non-text events */ }
    }
  }

  // Extract files from <boltAction type="file" filePath="...">...</boltAction> tags
  const files: Record<string, string> = {};
  const fileRegex = /<boltAction\s+type="file"\s+filePath="([^"]+)"[^>]*>([\s\S]*?)<\/boltAction>/g;
  let match;
  while ((match = fileRegex.exec(fullText)) !== null) {
    const filePath = match[1]!;
    const content = match[2]!;
    files[filePath] = content;
  }

  return { text: fullText, files };
}

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.url) return c.json({ success: false, error: "url is required" }, 400);

  const url = body.url as string;
  const sector = (body.sector as string) ?? "professional";
  const prospectId = body.prospectId as string | undefined;

  // ── Step 1: Scrape the website ──
  const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";

  let scraped: ScrapedData;
  try {
    const scrapeRes = await fetch(`${apiBase}/public/signup/analyze-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, generatePreview: false }),
    });
    if (!scrapeRes.ok) throw new Error(`Scrape failed: ${scrapeRes.status}`);
    const scrapeJson = (await scrapeRes.json()) as { data?: { scraped?: ScrapedData } };
    scraped = scrapeJson.data?.scraped as ScrapedData;
    if (!scraped?.pages?.length) throw new Error("No pages scraped");
  } catch (err) {
    return c.json({ success: false, error: `Scrape failed: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }

  // ── Step 2: Deduplicate pages ──
  const seenUrls = new Set<string>();
  const uniquePages: ScrapedPage[] = [];
  for (const p of scraped.pages) {
    const norm = (p.url ?? "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (!norm || seenUrls.has(norm)) continue;
    seenUrls.add(norm);
    if ((p.headings?.length ?? 0) > 0 || (p.paragraphs?.length ?? 0) > 0) {
      uniquePages.push(p);
    }
  }

  // ── Step 3: Build the message for bolt.diy ──
  // Format ALL scraped content as a clear rebuild request
  let pagesContent = "";
  for (const p of uniquePages) {
    const imgs = (p.images ?? [])
      .filter(i => i.url?.startsWith("http") && /\.(jpg|jpeg|png|webp)/i.test(i.url) && !/dummy|plugin|admin|icon|sprite|pixel/i.test(i.url))
      .map((img, i) => `  ${i + 1}. ${img.url}${img.alt ? ` (${img.alt})` : ""}`).join("\n");

    const headings = (p.headings ?? []).filter(h => h.text?.length > 2).map(h => `  h${h.level}: ${h.text}`).join("\n");
    const paras = (p.paragraphs ?? []).filter(t => t.length > 20).map(t => `  ${t}`).join("\n");
    const videos = (p.videos ?? []).map(v => `  VIDEO: ${v.url}`).join("\n");

    pagesContent += `
--- PAGE: ${p.url} (Title: ${p.title || ""}) ---
Headings:
${headings}
Text:
${paras}
Photos (use ALL):
${imgs || "  No photos on this page."}
${videos ? `Videos:\n${videos}` : ""}
`;
  }

  const boltMessage = `Rebuild this website with a stunning €10,000+ premium design: ${url}

Here is the COMPLETE scraped content from the original site. Use ONLY this real data — NEVER invent text or use stock photos.

BUSINESS INFO:
- Logo: ${scraped.logo || "not found"}
- Phone: ${scraped.contact?.phone || "N/A"}
- Email: ${scraped.contact?.email || "N/A"}
- Address: ${scraped.contact?.address || "N/A"}
- WhatsApp: ${scraped.contact?.whatsapp || "N/A"}
- Facebook: ${scraped.socialLinks?.facebook || ""}
- Instagram: ${scraped.socialLinks?.instagram || ""}
- Original colors: ${JSON.stringify(scraped.colors || {})}

The site has ${uniquePages.length} pages. ${uniquePages.length > 1 ? "Build a MULTI-PAGE site with separate files for each page." : "Build a single-page site."}

SCRAPED CONTENT:
${pagesContent}

CRITICAL REQUIREMENTS:
- Include EVERY photo listed above. All of them. In gallery grids or sections.
- Use the exact original text. Do not invent anything.
- Include the real logo, contact info, and social links.
- If there are videos, embed them.
- Make the design premium: scroll animations, glassmorphism nav, beautiful typography, generous whitespace.
- Each page needs its own file. All pages share the same nav, footer, and design system.`;

  // ── Step 4: Call bolt.diy ──
  try {
    const { text, files } = await callBoltDiy(boltMessage);

    if (Object.keys(files).length === 0) {
      return c.json({
        success: false,
        error: "bolt.diy generated no files. Raw response length: " + text.length,
      }, 500);
    }

    // ── Step 5: Save scraped content to prospect ──
    if (prospectId) {
      try {
        const { prisma } = await import("@madecreative/db");
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { scrapedContent: scraped as object },
        });
      } catch { /* non-fatal */ }
    }

    return c.json({
      success: true,
      data: {
        files,
        pages: Object.keys(files).length,
        totalPhotosScraped: scraped.pages.reduce((sum, p) => sum + (p.images?.length ?? 0), 0),
        totalPagesScraped: uniquePages.length,
      },
    });
  } catch (err) {
    return c.json({ success: false, error: `Generation failed: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }
});

export default app;
