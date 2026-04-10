import { Hono } from "hono";
import { z } from "zod";
import { getRedisConnection } from "../../lib/queue.js";
import type { JwtPayload, KnowledgeBase } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Schema ───────────────────────────────────────────────────────────────────

const AddFAQSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(2000),
  category: z.string().optional(),
});

// ─── GET /portal/chatbots ────────────────────────────────────────────────────

app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

  const chatbots = await prisma.clientChatbot.findMany({
    where: { clientId },
    select: {
      id: true,
      isActive: true,
      totalConversations: true,
      resolvedRate: true,
      widgetConfig: true,
      createdAt: true,
    },
  });

  return c.json({ success: true, data: chatbots });
});

// ─── GET /portal/chatbots/:id ────────────────────────────────────────────────

app.get("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  return c.json({ success: true, data: chatbot });
});

// ─── PATCH /portal/chatbots/:id ──────────────────────────────────────────────

app.patch("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ChatbotUpdateSchema } = await import("@madecreative/shared");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = ChatbotUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const { isActive, widgetConfig } = parsed.data;

  const updated = await prisma.clientChatbot.update({
    where: { id },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(widgetConfig !== undefined ? { widgetConfig: JSON.parse(JSON.stringify(widgetConfig)) } : {}),
    },
  });

  return c.json({ success: true, data: updated });
});

// ─── GET /portal/chatbots/:id/embed-code ─────────────────────────────────────

app.get("/:id/embed-code", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";
  const embedCode = `<script>window.MadeCreativeConfig={chatbotId:"${chatbot.id}",apiUrl:"${apiUrl}"};</script><script src="${apiUrl}/public/chatbot-widget.js" async defer></script>`;

  return c.json({
    success: true,
    data: {
      embedCode,
      chatbotId: chatbot.id,
      isActive: chatbot.isActive,
    },
  });
});

// ─── GET /portal/chatbots/:id/stats ──────────────────────────────────────────

app.get("/:id/stats", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
    select: {
      id: true,
      totalConversations: true,
      resolvedRate: true,
    },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  // Try to get additional stats from Redis
  let recentSessionCount = 0;
  try {
    const redis = getRedisConnection();
    // Count sessions that started in last 24h (approximated by key scan)
    const keys = await redis.keys(`chatbot:session:*:meta`);
    const pipeline = redis.pipeline();
    for (const key of keys.slice(0, 100)) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const [, val] of results ?? []) {
      if (typeof val === "string") {
        try {
          const meta = JSON.parse(val) as {
            chatbotId?: string;
            startedAt?: string;
          };
          if (
            meta.chatbotId === id &&
            meta.startedAt &&
            new Date(meta.startedAt).getTime() > oneDayAgo
          ) {
            recentSessionCount++;
          }
        } catch {
          // skip
        }
      }
    }
  } catch {
    // Redis unavailable
  }

  return c.json({
    success: true,
    data: {
      totalConversations: chatbot.totalConversations,
      resolvedRate: chatbot.resolvedRate,
      conversationsLast24h: recentSessionCount,
      avgResponseMs: 850, // mock for now
    },
  });
});

// ─── GET /portal/chatbots/:id/conversations ───────────────────────────────────

app.get("/:id/conversations", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  // Fetch recent sessions from Redis
  const conversations: Array<{
    sessionId: string;
    startedAt: string;
    messageCount: number;
    firstMessage: string | null;
    messages: Array<{ role: string; content: string; timestamp: string }>;
  }> = [];

  try {
    const redis = getRedisConnection();
    const metaKeys = await redis.keys(`chatbot:session:*:meta`);

    const pipeline = redis.pipeline();
    for (const key of metaKeys.slice(0, 200)) {
      pipeline.get(key);
    }
    const metaResults = await pipeline.exec();

    const relevantSessions: Array<{
      key: string;
      sessionId: string;
      meta: { chatbotId: string; startedAt: string; messageCount: number };
    }> = [];

    for (let i = 0; i < metaKeys.length; i++) {
      const key = metaKeys[i];
      const val = metaResults?.[i]?.[1];
      if (key && typeof val === "string") {
        try {
          const meta = JSON.parse(val) as {
            chatbotId: string;
            startedAt: string;
            messageCount: number;
          };
          if (meta.chatbotId === id) {
            const sessionId = key.replace("chatbot:session:", "").replace(":meta", "");
            relevantSessions.push({ key, sessionId, meta });
          }
        } catch {
          // skip
        }
      }
    }

    // Sort by startedAt descending
    relevantSessions.sort(
      (a, b) =>
        new Date(b.meta.startedAt).getTime() -
        new Date(a.meta.startedAt).getTime()
    );

    // Load messages for top 20 sessions
    const msgPipeline = redis.pipeline();
    for (const s of relevantSessions.slice(0, 20)) {
      msgPipeline.get(`chatbot:session:${s.sessionId}:messages`);
    }
    const msgResults = await msgPipeline.exec();

    for (let i = 0; i < Math.min(relevantSessions.length, 20); i++) {
      const s = relevantSessions[i];
      if (!s) continue;
      const msgVal = msgResults?.[i]?.[1];
      let messages: Array<{ role: string; content: string; timestamp: string }> = [];
      let firstMessage: string | null = null;

      if (typeof msgVal === "string") {
        try {
          messages = JSON.parse(msgVal) as typeof messages;
          const firstUserMsg = messages.find((m) => m.role === "user");
          if (firstUserMsg) {
            firstMessage =
              firstUserMsg.content.length > 80
                ? firstUserMsg.content.slice(0, 80) + "..."
                : firstUserMsg.content;
          }
        } catch {
          // skip
        }
      }

      conversations.push({
        sessionId: s.sessionId,
        startedAt: s.meta.startedAt,
        messageCount: s.meta.messageCount,
        firstMessage,
        messages: messages.slice(-20),
      });
    }
  } catch (err) {
    console.warn("Redis conversations fetch failed:", err);
  }

  return c.json({ success: true, data: conversations });
});

// ─── POST /portal/chatbots/:id/faqs ──────────────────────────────────────────

app.post("/:id/faqs", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = AddFAQSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const kb = (chatbot.knowledgeBase as unknown as KnowledgeBase | null) ?? {
    faqs: [],
    businessInfo: { name: "", description: "" },
    services: [],
  };

  const newFaq = {
    question: parsed.data.question,
    answer: parsed.data.answer,
    category: parsed.data.category ?? "custom",
  };

  kb.faqs = [...(kb.faqs ?? []), newFaq];

  const updated = await prisma.clientChatbot.update({
    where: { id },
    data: {
      knowledgeBase: JSON.parse(JSON.stringify(kb)),
    },
  });

  return c.json({
    success: true,
    data: {
      faq: newFaq,
      totalFaqs: kb.faqs.length,
      chatbotId: updated.id,
    },
  });
});

// ─── DELETE /portal/chatbots/:id/faqs/:index ─────────────────────────────────

app.delete("/:id/faqs/:index", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");
  const index = parseInt(c.req.param("index"), 10);

  if (isNaN(index) || index < 0) {
    return c.json({ success: false, error: "Invalid FAQ index" }, 400);
  }

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const kb = chatbot.knowledgeBase as unknown as KnowledgeBase;
  if (!kb.faqs || index >= kb.faqs.length) {
    return c.json({ success: false, error: "FAQ not found" }, 404);
  }

  kb.faqs = kb.faqs.filter((_, i) => i !== index);

  await prisma.clientChatbot.update({
    where: { id },
    data: {
      knowledgeBase: JSON.parse(JSON.stringify(kb)),
    },
  });

  return c.json({ success: true, data: { totalFaqs: kb.faqs.length } });
});

// ─── PATCH /portal/chatbots/:id/faqs/:index ──────────────────────────────────

app.patch("/:id/faqs/:index", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");
  const index = parseInt(c.req.param("index"), 10);

  if (isNaN(index) || index < 0) {
    return c.json({ success: false, error: "Invalid FAQ index" }, 400);
  }

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = AddFAQSchema.partial().safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const kb = chatbot.knowledgeBase as unknown as KnowledgeBase;
  if (!kb.faqs || index >= kb.faqs.length) {
    return c.json({ success: false, error: "FAQ not found" }, 404);
  }

  kb.faqs[index] = { ...kb.faqs[index]!, ...parsed.data };

  await prisma.clientChatbot.update({
    where: { id },
    data: {
      knowledgeBase: JSON.parse(JSON.stringify(kb)),
    },
  });

  return c.json({ success: true, data: { faq: kb.faqs[index] } });
});

export default app;
