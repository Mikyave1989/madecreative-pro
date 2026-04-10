import { Hono } from "hono";
import type { JwtPayload } from "@madecreative/shared";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/index";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Credit system (Lovable-style variable cost) ─────────────────────────────

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,   // €197/mo — 100 crediti inclusi
  growth: 250,    // €347/mo — 250 crediti inclusi
  pro: 500,       // €597/mo — 500 crediti inclusi
};

// Variable credit cost based on complexity (like Lovable.dev)
function estimateCreditCost(toolCalls: string[], isFullBuild = false): number {
  if (toolCalls.length === 0) return 0.5; // Simple chat
  if (isFullBuild && toolCalls.length > 0) return 3.0; // Full site build
  if (toolCalls.includes("generate_with_opus")) return 2.0; // Opus generation
  if (toolCalls.length >= 3) return 1.5; // Complex multi-tool
  return 1.0; // Standard edit
}

// ─── Credit helpers (in-memory, Redis in production) ──────────────────────────

const creditStore = new Map<string, { used: number; purchased: number; resetAt: number }>();

function getCredits(clientId: string, plan = "starter"): { remaining: number; used: number; total: number; purchased: number } {
  const now = Date.now();
  let entry = creditStore.get(clientId);

  // Reset monthly
  if (!entry || now > entry.resetAt) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    const purchased = entry?.purchased ?? 0;
    entry = { used: 0, purchased, resetAt: nextMonth.getTime() };
    creditStore.set(clientId, entry);
  }

  const planCredits = PLAN_CREDITS[plan] ?? 100;
  const total = planCredits + entry.purchased;

  return {
    remaining: Math.max(0, total - entry.used),
    used: entry.used,
    total,
    purchased: entry.purchased,
  };
}

function deductCredits(clientId: string, amount: number): boolean {
  const credits = getCredits(clientId);
  if (credits.remaining < amount) return false;
  const entry = creditStore.get(clientId)!;
  entry.used += amount;
  return true;
}

function addPurchasedCredits(clientId: string, amount: number): void {
  const entry = creditStore.get(clientId);
  if (entry) {
    entry.purchased += amount;
  } else {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    creditStore.set(clientId, { used: 0, purchased: amount, resetAt: nextMonth.getTime() });
  }
}

// ─── Editor tools for Claude ──────────────────────────────────────────────────

const EDITOR_TOOLS: Tool[] = [
  {
    name: "update_hero",
    description: "Update the hero section: title, description, background image, and CTA button text",
    input_schema: {
      type: "object" as const,
      properties: {
        heroText: { type: "string", description: "The main hero title (bold, impactful)" },
        heroDescription: { type: "string", description: "The hero subtitle/description (1-2 sentences)" },
        heroImage: { type: "string", description: "Background image URL. Use Unsplash: https://images.unsplash.com/photo-ID?w=1200. Pick a relevant photo for the business sector." },
        heroCtaText: { type: "string", description: "CTA button text, e.g. 'Prenota ora', 'Scopri di più', 'Contattaci'" },
      },
      required: [],
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
    description: "Update the about section with text and optional image",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "About section text (2-4 paragraphs, professional tone)" },
        aboutImage: { type: "string", description: "Image URL for the about section. Use Unsplash." },
      },
      required: ["text"],
    },
  },
  {
    name: "set_gallery",
    description: "Set the photo gallery with multiple images. Use Unsplash URLs for professional photos relevant to the business.",
    input_schema: {
      type: "object" as const,
      properties: {
        images: {
          type: "array",
          description: "Array of gallery images (4-8 images recommended)",
          items: {
            type: "object",
            properties: {
              url: { type: "string", description: "Image URL from Unsplash (use ?w=800 for quality)" },
              caption: { type: "string", description: "Short caption for the image" },
            },
            required: ["url"],
          },
        },
      },
      required: ["images"],
    },
  },
  {
    name: "set_testimonials",
    description: "Set customer testimonials/reviews for social proof",
    input_schema: {
      type: "object" as const,
      properties: {
        testimonials: {
          type: "array",
          description: "Array of testimonials (3-5 recommended)",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Customer name" },
              text: { type: "string", description: "Review text (1-3 sentences)" },
              rating: { type: "number", description: "Rating 1-5" },
            },
            required: ["name", "text", "rating"],
          },
        },
      },
      required: ["testimonials"],
    },
  },
  {
    name: "set_services",
    description: "Set the services/offerings section with descriptions and optional prices",
    input_schema: {
      type: "object" as const,
      properties: {
        services: {
          type: "array",
          description: "Array of services (3-6 recommended)",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Service name" },
              description: { type: "string", description: "Service description (1-2 sentences)" },
              icon: { type: "string", description: "Emoji icon for the service" },
              price: { type: "string", description: "Price if applicable (e.g. 'Da €50')" },
            },
            required: ["name", "description"],
          },
        },
      },
      required: ["services"],
    },
  },
  {
    name: "search_photos",
    description: "Search for professional stock photos. Returns URLs. Use descriptive queries in English.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query in English, e.g. 'italian restaurant interior warm cozy'" },
        count: { type: "number", description: "Number of photos (1-8, default 4)" },
      },
      required: ["query"],
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
  {
    name: "generate_with_opus",
    description: "Delegate complex content generation to Claude Opus (powerful model). Use this for: writing full menus with many items, creating professional descriptions, generating marketing copy, bulk content creation. Returns generated content that you should then apply using the other tools.",
    input_schema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "What to generate (e.g. 'Create a full Italian restaurant menu with 20 dishes across 4 categories with descriptions and prices')",
        },
        context: {
          type: "string",
          description: "Business context: name, sector, city, style, any preferences the user mentioned",
        },
        outputFormat: {
          type: "string",
          enum: ["menu_items", "text", "hero_content"],
          description: "Expected output format",
        },
      },
      required: ["task", "context", "outputFormat"],
    },
  },
];

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(businessName: string, sector: string, language: string, currentContent: Record<string, unknown>): string {
  const lang = language === "de" ? "German" : language === "it" ? "Italian" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "nl" ? "Dutch" : language === "pt" ? "Portuguese" : "English";

  // Summarise current state for AI memory
  const existingSections: string[] = [];
  if (currentContent.heroText) existingSections.push(`hero (title: "${currentContent.heroText}")`);
  if (currentContent.aboutText) existingSections.push("about");
  if (currentContent.phone || currentContent.email || currentContent.address) existingSections.push("contact");
  if (currentContent.hours) existingSections.push("hours");
  if (Array.isArray(currentContent.menuItems) && currentContent.menuItems.length > 0) existingSections.push(`menu (${(currentContent.menuItems as unknown[]).length} items)`);
  if (Array.isArray(currentContent.services) && currentContent.services.length > 0) existingSections.push(`services (${(currentContent.services as unknown[]).length} items)`);
  if (Array.isArray(currentContent.gallery) && currentContent.gallery.length > 0) existingSections.push(`gallery (${(currentContent.gallery as unknown[]).length} images)`);
  if (Array.isArray(currentContent.testimonials) && currentContent.testimonials.length > 0) existingSections.push(`testimonials (${(currentContent.testimonials as unknown[]).length})`);
  if (currentContent.whatsappNumber) existingSections.push(`whatsapp (${currentContent.whatsappNumber})`);

  const currentStateBlock = existingSections.length > 0
    ? `\nCURRENT WEBSITE STATE:\nThe following sections already exist: ${existingSections.join(", ")}.\n`
    : `\nCURRENT WEBSITE STATE: No content yet. The site is blank.\n`;

  return `You are a PREMIUM AI website builder for "${businessName}" (sector: ${sector}).
You build STUNNING, professional websites worth €10,000+. Always respond in ${lang}.
${currentStateBlock}
CRITICAL RULES — FOLLOW EXACTLY:

1. NEVER ask questions. NEVER say you can't do something. BUILD IMMEDIATELY.

2. For single-section edits, ONLY call the ONE relevant tool. Do NOT touch other sections.

3. When the user says "build/create/make my site" — call ALL these tools in sequence:
   a) update_hero — professional title + compelling description + heroImage + CTA text
   b) update_about — 2-3 paragraphs about the business + aboutImage
   c) update_contact — use provided info or invent realistic placeholders
   d) update_hours — typical hours for the sector
   e) set_services OR add_menu_item (multiple times) — 6-10 items with realistic descriptions and prices
   f) set_gallery — 4-6 professional photos relevant to the sector
   g) set_testimonials — 3-4 realistic customer reviews with 4-5 star ratings
   h) set_whatsapp — if number provided

4. IMAGES: Use the search_photos tool to find SPECIFIC, relevant photos.
   - For hero: search "[business type] [specific detail]" e.g. "neapolitan pizza oven wood fire"
   - For gallery: multiple specific searches, not one generic
   - For about: "[business type] team chef owner"
   NEVER use hardcoded URLs. Always search with search_photos tool.

5. CONTENT QUALITY: Write like a professional copywriter.
   - Hero: impactful, emotional, sector-appropriate
   - About: storytelling, passion, expertise, unique selling points
   - Services/Menu: detailed descriptions, not just names
   - Testimonials: realistic, varied, specific details

6. After building, respond with a SHORT summary (2-3 lines) of what was created.

7. For subsequent edits (change title, add item, etc.) — use tools directly, don't ask.

You are building websites that look and feel like €10,000+ professional sites with real photos, compelling copy, and complete content.`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /portal/editor/chat/credits — check remaining credits
app.get("/credits", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const credits = getCredits(clientId);
  return c.json({
    success: true,
    data: {
      ...credits,
      costInfo: {
        chat: 0.5,
        simpleEdit: 1.0,
        complexEdit: 1.5,
        opusGeneration: 2.0,
      },
      topUpOptions: [
        { credits: 50, price: "€9.90", priceId: "price_topup_50" },
        { credits: 150, price: "€24.90", priceId: "price_topup_150" },
        { credits: 500, price: "€69.90", priceId: "price_topup_500" },
      ],
    },
  });
});

// POST /portal/editor/chat/buy-credits — purchase additional credits
app.post("/buy-credits", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const pack = body?.pack as string;

  const PACKS: Record<string, { credits: number; amount: number }> = {
    "50": { credits: 50, amount: 990 },
    "150": { credits: 150, amount: 2490 },
    "500": { credits: 500, amount: 6990 },
  };

  const selected = PACKS[pack];
  if (!selected) {
    return c.json({ success: false, error: "Invalid credit pack" }, 400);
  }

  // Create Stripe checkout for credit purchase
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { stripeCustomerId: true, email: true },
  });

  if (!client) return c.json({ success: false, error: "Client not found" }, 404);

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) {
    // Fallback: add credits directly (dev mode)
    addPurchasedCredits(clientId, selected.credits);
    return c.json({
      success: true,
      data: { credits: getCredits(clientId), added: selected.credits },
    });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: client.stripeCustomerId ?? undefined,
      customer_email: !client.stripeCustomerId ? client.email : undefined,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: `${selected.credits} Crediti AI — MadeCreative` },
          unit_amount: selected.amount,
        },
        quantity: 1,
      }],
      metadata: { clientId, creditPack: pack, credits: String(selected.credits) },
      success_url: `${process.env["PORTAL_URL"] ?? "https://app.madecreative.pro"}/editor?credits=purchased`,
      cancel_url: `${process.env["PORTAL_URL"] ?? "https://app.madecreative.pro"}/editor`,
    });

    return c.json({
      success: true,
      data: { checkoutUrl: session.url, credits: selected.credits },
    });
  } catch (err) {
    return c.json({ success: false, error: "Payment error" }, 500);
  }
});

// POST /portal/editor/chat — send a message to the AI editor
app.post("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { getClaudeClient } = await import("@madecreative/ai");
  const clientId = c.get("jwtPayload").sub;

  // Check credits
  const credits = getCredits(clientId);
  if (credits.remaining < 0.5) {
    return c.json({
      success: false,
      error: "Crediti esauriti. Acquista crediti aggiuntivi per continuare.",
      credits,
      buyCreditsUrl: `https://buy.stripe.com/credits`, // TODO: create Stripe link
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
    client.language,
    currentContent
  );

  const messages: MessageParam[] = [
    ...conversationHistory.slice(-20), // Keep last 20 messages for context
    { role: "user", content: userMessage },
  ];

  // Intent detection: full site build vs. single edit
  const isFullBuild = /\b(crea|costruisci|build|make|genera|fai)\b.*\b(sito|site|website|pagina)\b/i.test(userMessage);
  const editorModel = isFullBuild ? "claude-opus-4-5" as const : "claude-haiku-4-5" as const;

  // Call Claude with tools
  const claude = getClaudeClient();
  const contentUpdates: Record<string, unknown> = {};

  try {
    const result = await claude.toolUseLoop(
      messages,
      async (toolName, toolInput) => {
        switch (toolName) {
          case "search_photos": {
            const input = toolInput as { query: string; count?: number };
            const count = Math.min(input.count ?? 4, 8);
            const apiKey = process.env["PEXELS_API_KEY"];
            if (!apiKey) return { photos: [], error: "Photo search not configured" };
            try {
              const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.query)}&per_page=${count}&size=medium`, {
                headers: { Authorization: apiKey },
              });
              const data = await res.json() as { photos: Array<{ src: { large: string; medium: string }; photographer: string; alt: string }> };
              return { photos: (data.photos ?? []).map(p => ({ url: p.src.large, alt: p.alt || input.query })) };
            } catch {
              return { photos: [], error: "Search failed" };
            }
          }

          case "get_current_content":
            return currentContent;

          case "generate_with_opus": {
            const input = toolInput as { task: string; context: string; outputFormat: string };
            // Call Opus for heavy content generation
            const opusResult = await claude.callWithText(
              [{ role: "user", content: `${input.task}\n\nContext: ${input.context}\n\nOutput format: Return ONLY valid JSON. For menu_items: {"items":[{"name":"...","description":"...","price":"€...","category":"..."}]}. For text: {"text":"..."}. For hero_content: {"heroText":"...","heroDescription":"..."}` }],
              {
                system: "You are a premium content generator for business websites. Generate high-quality, professional content. Always return valid JSON only, no markdown or explanation.",
                model: "claude-opus-4-5" as const,
                maxTokens: 4096,
              }
            );

            // Parse Opus response and auto-apply content
            try {
              const jsonMatch = opusResult.text.match(/\{[\s\S]*\}/);
              if (!jsonMatch) return { error: "Failed to parse Opus output" };
              const generated = JSON.parse(jsonMatch[0]);

              if (input.outputFormat === "menu_items" && generated.items) {
                const items = (generated.items as Array<{ name: string; description?: string; price: string; category?: string }>).map((item) => ({
                  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                  name: item.name,
                  description: item.description ?? "",
                  price: item.price,
                  category: item.category ?? "",
                  imageUrl: null,
                }));
                const existing = (currentContent.menuItems as Array<Record<string, unknown>>) ?? [];
                contentUpdates.menuItems = [...existing, ...items];
                currentContent.menuItems = contentUpdates.menuItems;
                return { success: true, generatedItems: items.length, items: items.map((i) => `${i.name} - ${i.price}`) };
              }

              if (input.outputFormat === "hero_content" && generated.heroText) {
                contentUpdates.heroText = generated.heroText;
                contentUpdates.heroDescription = generated.heroDescription;
                return { success: true, heroText: generated.heroText, heroDescription: generated.heroDescription };
              }

              if (input.outputFormat === "text" && generated.text) {
                contentUpdates.heroDescription = generated.text;
                return { success: true, text: generated.text };
              }

              return { success: true, raw: generated };
            } catch {
              return { error: "Failed to parse generated content", raw: opusResult.text.substring(0, 500) };
            }
          }

          case "update_hero": {
            const input = toolInput as { heroText?: string; heroDescription?: string; heroImage?: string; heroCtaText?: string };
            if (input.heroText) contentUpdates.heroText = input.heroText;
            if (input.heroDescription) contentUpdates.heroDescription = input.heroDescription;
            if (input.heroImage) contentUpdates.heroImage = input.heroImage;
            if (input.heroCtaText) contentUpdates.heroCtaText = input.heroCtaText;
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
            const input = toolInput as { text: string; aboutImage?: string };
            contentUpdates.aboutText = input.text;
            if (input.aboutImage) contentUpdates.aboutImage = input.aboutImage;
            return { success: true, updated: "about" };
          }

          case "set_gallery": {
            const input = toolInput as { images: Array<{ url: string; caption?: string }> };
            contentUpdates.gallery = input.images;
            currentContent.gallery = input.images;
            return { success: true, totalImages: input.images.length };
          }

          case "set_testimonials": {
            const input = toolInput as { testimonials: Array<{ name: string; text: string; rating: number }> };
            contentUpdates.testimonials = input.testimonials;
            currentContent.testimonials = input.testimonials;
            return { success: true, totalTestimonials: input.testimonials.length };
          }

          case "set_services": {
            const input = toolInput as { services: Array<{ name: string; description: string; icon?: string; price?: string }> };
            contentUpdates.services = input.services;
            currentContent.services = input.services;
            return { success: true, totalServices: input.services.length };
          }

          default:
            return { error: `Unknown tool: ${toolName}` };
        }
      },
      {
        system: systemPrompt,
        tools: EDITOR_TOOLS,
        model: editorModel,
        maxTokens: 4096,
      }
    );

    // Save content updates to DB if any changes were made
    if (Object.keys(contentUpdates).length > 0 && client.website) {
      // Snapshot current state for rollback
      const previousContent = JSON.parse(JSON.stringify(currentContent));
      const snapshots = ((client.website.designTokens as { _snapshots?: Array<{ ts: string; data: object }> })?._snapshots ?? []).slice(-19);
      snapshots.push({ ts: new Date().toISOString(), data: previousContent });

      const mergedContent = { ...currentContent, ...contentUpdates };
      await prisma.clientWebsite.update({
        where: { id: client.website.id },
        data: {
          pages: mergedContent as object,
          designTokens: { ...(client.website.designTokens as object ?? {}), _snapshots: snapshots },
        },
      });

      // Auto-deploy: queue a rebuild job
      try {
        const rebuildJob = await prisma.agentJob.create({
          data: {
            agentType: "BUILDER",
            status: "QUEUED",
            clientId,
            input: { clientId, trigger: "ai-editor-auto-deploy" },
          },
        });
        console.log(`[EditorChat] Auto-deploy queued: ${rebuildJob.id}`);
      } catch (rebuildErr) {
        console.warn("[EditorChat] Auto-deploy queue failed:", rebuildErr);
      }
    }

    // Deduct credits (variable cost like Lovable.dev)
    const toolNames: string[] = [];
    for (const m of result.messages) {
      if (m.role === "assistant" && Array.isArray(m.content)) {
        for (const b of m.content) {
          if (typeof b === "object" && "type" in b && b.type === "tool_use" && "name" in b) {
            toolNames.push(b.name as string);
          }
        }
      }
    }
    const creditCost = estimateCreditCost(toolNames, isFullBuild);
    deductCredits(clientId, creditCost);

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

// GET /portal/editor/chat/history — get version history (snapshots)
app.get("/history", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const website = await prisma.clientWebsite.findUnique({
    where: { clientId },
    select: { designTokens: true },
  });
  const snapshots = ((website?.designTokens as { _snapshots?: Array<{ ts: string }> })?._snapshots ?? [])
    .map((s, i) => ({ index: i, timestamp: s.ts }))
    .reverse();
  return c.json({ success: true, data: { versions: snapshots, count: snapshots.length } });
});

// POST /portal/editor/chat/rollback — restore a previous version
app.post("/rollback", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const index = body?.index as number | undefined;

  const website = await prisma.clientWebsite.findUnique({
    where: { clientId },
    select: { id: true, designTokens: true, pages: true },
  });

  if (!website) return c.json({ success: false, error: "Website not found" }, 404);

  const snapshots = ((website.designTokens as { _snapshots?: Array<{ ts: string; data: object }> })?._snapshots ?? []).slice();

  // Default: rollback to most recent snapshot
  const targetIndex = index ?? snapshots.length - 1;
  const snapshot = snapshots[targetIndex];

  if (!snapshot) return c.json({ success: false, error: "No version to restore" }, 404);

  // Save current state as a new snapshot BEFORE restoring (so undo is itself undoable)
  const currentPages = website.pages ?? {};
  const updatedSnapshots = snapshots.filter((_, i) => i !== targetIndex);
  updatedSnapshots.push({ ts: new Date().toISOString(), data: currentPages as object });

  // Restore content and update snapshots
  await prisma.clientWebsite.update({
    where: { id: website.id },
    data: {
      pages: snapshot.data,
      designTokens: { ...(website.designTokens as object ?? {}), _snapshots: updatedSnapshots },
    },
  });

  // Queue rebuild
  try {
    await prisma.agentJob.create({
      data: {
        agentType: "BUILDER",
        status: "QUEUED",
        clientId,
        input: { clientId, trigger: "rollback" },
      },
    });
  } catch { /* non-critical */ }

  return c.json({
    success: true,
    data: {
      restoredTo: snapshot.ts,
      content: snapshot.data,
      message: "Versione precedente ripristinata. Il sito si aggiornera in circa 2 minuti.",
    },
  });
});

export default app;
