import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { ChatbotUpdateSchema } from "@madecreative/shared";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/chatbots
app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const chatbots = await prisma.clientChatbot.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      isActive: true,
      totalConversations: true,
      resolvedRate: true,
      widgetConfig: true,
      personality: true,
      createdAt: true,
    },
  });

  return c.json({ success: true, data: chatbots });
});

// GET /portal/chatbots/:id
app.get("/:id", async (c) => {
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

// PATCH /portal/chatbots/:id
app.patch("/:id", async (c) => {
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

  const { name, isActive, personality, widgetConfig } = parsed.data;

  const updated = await prisma.clientChatbot.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(personality !== undefined ? { personality } : {}),
      ...(widgetConfig !== undefined ? { widgetConfig } : {}),
    },
  });

  return c.json({ success: true, data: updated });
});

// GET /portal/chatbots/:id/embed-code
app.get("/:id/embed-code", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const chatbot = await prisma.clientChatbot.findFirst({
    where: { id, clientId },
  });

  if (!chatbot) {
    return c.json({ success: false, error: "Chatbot not found" }, 404);
  }

  const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";

  const embedCode = `<!-- MadeCreative Chatbot Widget -->
<script>
  window.MadeCreativeConfig = {
    chatbotId: "${chatbot.id}",
    apiUrl: "${apiUrl}"
  };
</script>
<script src="${apiUrl}/public/chatbot-widget.js" async defer></script>`;

  return c.json({
    success: true,
    data: {
      embedCode,
      chatbotId: chatbot.id,
      isActive: chatbot.isActive,
    },
  });
});

export default app;
