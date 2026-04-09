import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { getClaudeClient } from "@madecreative/ai";
import type { JwtPayload } from "@madecreative/shared";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/index";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_CREDITS_PER_MONTH = 100;
const CREDIT_COST_PER_MESSAGE = 1;

// ─── Credit helpers (in-memory for now, Redis in production) ──────────────────

const creditStore = new Map<string, { used: number; resetAt: number }>();

function getCredits(clientId: string): { remaining: number; used: number; total: number } {
  const now = Date.now();
  let entry = creditStore.get(clientId);

  // Reset monthly
  if (!entry || now > entry.resetAt) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    entry = { used: 0, resetAt: nextMonth.getTime() };
    creditStore.set(clientId, entry);
  }

  return {
    remaining: Math.max(0, FREE_CREDITS_PER_MONTH - entry.used),
    used: entry.used,
    total: FREE_CREDITS_PER_MONTH,
  };
}

function deductCredit(clientId: string): boolean {
  const credits = getCredits(clientId);
  if (credits.remaining <= 0) return false;
  const entry = creditStore.get(clientId)!;
  entry.used += CREDIT_COST_PER_MESSAGE;
  return true;
}

// ─── Editor tools for Claude ──────────────────────────────────────────────────

const EDITOR_TOOLS: Tool[] = [
  {
    name: "update_hero",
    description: "Update the hero section title and description of the website",
    input_schema: {
      type: "object" as const,
      properties: {
        heroText: { type: "string", description: "The main hero title" },
        heroDescription: { type: "string", description: "The hero subtitle/description" },
      },
      required: ["heroText", "heroDescription"],
    },
  },
  {
    name: "update_contact",
    description: "Update contact information (phone, email, address)",
    input_schema: {
      type: "object" as const,
      properties: {
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        address: { type: "string", description: "Physical address" },
      },
      required: [],
    },
  },
  {
    name: "set_whatsapp",
    description: "Set the WhatsApp number for the floating contact button",
    input_schema: {
      type: "object" as const,
      properties: {
        whatsappNumber: { type: "string", description: "WhatsApp number with country code (e.g. +39 333 1234567)" },
      },
      required: ["whatsappNumber"],
    },
  },
  {
    name: "add_menu_item",
    description: "Add a product, dish or service to the menu/price list",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Product/dish name" },
        description: { type: "string", description: "Short description" },
        price: { type: "string", description: "Price (e.g. '€12.50')" },
        category: { type: "string", description: "Category (e.g. Antipasti, Primi, Dessert)" },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "remove_menu_item",
    description: "Remove a menu item by name",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Exact name of the item to remove" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_hours",
    description: "Update opening hours for specific days",
    input_schema: {
      type: "object" as const,
      properties: {
        updates: {
          type: "array",
          description: "Array of day updates",
          items: {
            type: "object",
            properties: {
              day: { type: "string", enum: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] },
              open: { type: "string", description: "Opening time (HH:MM)" },
              close: { type: "string", description: "Closing time (HH:MM)" },
              closed: { type: "boolean", description: "Whether the day is closed" },
            },
            required: ["day"],
          },
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "update_about",
    description: "Update the about/description section text",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "The about section text" },
      },
      required: ["text"],
    },
  },
  {
    name: "get_current_content",
    description: "Get the current website content to understand what's on the site",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(businessName: string, sector: string, language: string): string {
  return `You are the AI website editor for "${businessName}" (sector: ${sector}).
You help the business owner modify their website through natural conversation.
Always respond in ${language === "de" ? "German" : language === "it" ? "Italian" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "nl" ? "Dutch" : language === "pt" ? "Portuguese" : "English"}.

Your capabilities:
- Update hero text and description
- Add/remove menu items with prices
- Update contact info (phone, email, address)
- Set up WhatsApp button
- Update opening hours
- Update about section

When the user asks to make changes, use the appropriate tools immediately.
When they ask to see the current content, use get_current_content.
Be proactive: suggest improvements based on best practices for their sector.
Keep responses concise — max 2-3 sentences after making changes.
After using a tool, confirm what you changed briefly.`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /portal/editor/chat/credits — check remaining credits
app.get("/credits", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const credits = getCredits(clientId);
  return c.json({ success: true, data: credits });
});

// POST /portal/editor/chat — send a message to the AI editor
app.post("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  // Check credits
  const credits = getCredits(clientId);
  if (credits.remaining <= 0) {
    return c.json({
      success: false,
      error: "No credits remaining. Purchase more credits to continue editing.",
      credits,
    }, 402);
  }

  const body = await c.req.json().catch(() => null);
  if (!body?.message || typeof body.message !== "string") {
    return c.json({ success: false, error: "Message is required" }, 400);
  }

  const userMessage = body.message as string;
  const conversationHistory = (body.history ?? []) as MessageParam[];

  // Load client and website data
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { website: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  // Current website content (from pages JSON)
  let currentContent: Record<string, unknown> = {};
  if (client.website?.pages) {
    try {
      currentContent = typeof client.website.pages === "string"
        ? JSON.parse(client.website.pages as string)
        : (client.website.pages as Record<string, unknown>);
    } catch {
      currentContent = {};
    }
  }

  // Build messages
  const systemPrompt = buildSystemPrompt(
    client.companyName,
    client.sector,
    client.language
  );

  const messages: MessageParam[] = [
    ...conversationHistory.slice(-20), // Keep last 20 messages for context
    { role: "user", content: userMessage },
  ];

  // Call Claude with tools
  const claude = getClaudeClient();
  const contentUpdates: Record<string, unknown> = {};

  try {
    const result = await claude.toolUseLoop(
      messages,
      async (toolName, toolInput) => {
        switch (toolName) {
          case "get_current_content":
            return currentContent;

          case "update_hero": {
            const input = toolInput as { heroText: string; heroDescription: string };
            contentUpdates.heroText = input.heroText;
            contentUpdates.heroDescription = input.heroDescription;
            return { success: true, updated: "hero" };
          }

          case "update_contact": {
            const input = toolInput as { phone?: string; email?: string; address?: string };
            if (input.phone) contentUpdates.phone = input.phone;
            if (input.email) contentUpdates.email = input.email;
            if (input.address) contentUpdates.address = input.address;
            return { success: true, updated: Object.keys(input) };
          }

          case "set_whatsapp": {
            const input = toolInput as { whatsappNumber: string };
            contentUpdates.whatsappNumber = input.whatsappNumber;
            return { success: true, whatsappNumber: input.whatsappNumber };
          }

          case "add_menu_item": {
            const input = toolInput as { name: string; description?: string; price: string; category?: string };
            const menuItems = ((currentContent.menuItems as Array<Record<string, unknown>>) ?? []).slice();
            menuItems.push({
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
              name: input.name,
              description: input.description ?? "",
              price: input.price,
              category: input.category ?? "",
              imageUrl: null,
            });
            contentUpdates.menuItems = menuItems;
            currentContent.menuItems = menuItems;
            return { success: true, added: input.name, totalItems: menuItems.length };
          }

          case "remove_menu_item": {
            const input = toolInput as { name: string };
            const items = ((currentContent.menuItems as Array<Record<string, unknown>>) ?? []);
            const filtered = items.filter((i) => (i.name as string).toLowerCase() !== input.name.toLowerCase());
            contentUpdates.menuItems = filtered;
            currentContent.menuItems = filtered;
            return { success: true, removed: input.name, remaining: filtered.length };
          }

          case "update_hours": {
            const input = toolInput as { updates: Array<{ day: string; open?: string; close?: string; closed?: boolean }> };
            const hours = (currentContent.hours as Record<string, Record<string, unknown>>) ?? {};
            for (const u of input.updates) {
              if (!hours[u.day]) hours[u.day] = { open: "09:00", close: "18:00", closed: false };
              const dayEntry = hours[u.day]!;
              if (u.open !== undefined) dayEntry.open = u.open;
              if (u.close !== undefined) dayEntry.close = u.close;
              if (u.closed !== undefined) dayEntry.closed = u.closed;
            }
            contentUpdates.hours = hours;
            currentContent.hours = hours;
            return { success: true, updatedDays: input.updates.map((u) => u.day) };
          }

          case "update_about": {
            const input = toolInput as { text: string };
            contentUpdates.heroDescription = input.text;
            return { success: true, updated: "about" };
          }

          default:
            return { error: `Unknown tool: ${toolName}` };
        }
      },
      {
        system: systemPrompt,
        tools: EDITOR_TOOLS,
        model: "claude-haiku-4-5" as const,
        maxTokens: 2048,
      }
    );

    // Save content updates to DB if any changes were made
    if (Object.keys(contentUpdates).length > 0 && client.website) {
      const mergedContent = { ...currentContent, ...contentUpdates };
      await prisma.clientWebsite.update({
        where: { id: client.website.id },
        data: { pages: mergedContent as object },
      });
    }

    // Deduct credit
    deductCredit(clientId);

    // Extract assistant text
    const assistantText = result.finalContent
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    // Build response messages for conversation history
    const newMessages: MessageParam[] = [
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantText },
    ];

    return c.json({
      success: true,
      data: {
        response: assistantText,
        contentUpdates: Object.keys(contentUpdates).length > 0 ? contentUpdates : null,
        currentContent: { ...currentContent, ...contentUpdates },
        newMessages,
        credits: getCredits(clientId),
        cost: {
          inputTokens: result.totalInputTokens,
          outputTokens: result.totalOutputTokens,
          totalCost: result.totalCost,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EditorChat] Error:", message);
    return c.json({ success: false, error: "AI editor error. Please try again." }, 500);
  }
});

export default app;
