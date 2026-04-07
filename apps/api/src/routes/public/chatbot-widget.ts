import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { ChatbotMessageSchema } from "@madecreative/shared";
import { buildChatbotSystemPrompt } from "@madecreative/ai";
import { getClaudeClient } from "@madecreative/ai";
import type {
  KnowledgeBase,
  ChatbotPersonality,
  WidgetConfig,
} from "@madecreative/shared";

const app = new Hono();

// GET /public/chatbot/:chatbotId/config — returns widget config for embed
app.get("/:chatbotId/config", async (c) => {
  const chatbotId = c.req.param("chatbotId");

  const chatbot = await prisma.clientChatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      name: true,
      isActive: true,
      widgetConfig: true,
      personality: true,
      client: {
        select: { sector: true, language: true },
      },
    },
  });

  if (!chatbot || !chatbot.isActive) {
    return c.json({ error: "Chatbot not found or inactive" }, 404);
  }

  return c.json({
    success: true,
    data: {
      chatbotId: chatbot.id,
      name: chatbot.name,
      widgetConfig: chatbot.widgetConfig,
      language: chatbot.client.language,
    },
  });
});

// POST /public/chatbot/:chatbotId/message — process a visitor message
app.post("/:chatbotId/message", async (c) => {
  const chatbotId = c.req.param("chatbotId");

  const body = await c.req.json().catch(() => null);
  const messageData = {
    ...body,
    chatbotId,
  };

  const parsed = ChatbotMessageSchema.safeParse(messageData);
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

  const chatbot = await prisma.clientChatbot.findUnique({
    where: { id: chatbotId },
    include: {
      client: {
        select: {
          sector: true,
          language: true,
          companyName: true,
          status: true,
        },
      },
    },
  });

  if (!chatbot || !chatbot.isActive) {
    return c.json({ error: "Chatbot not found or inactive" }, 404);
  }

  if (chatbot.client.status !== "ACTIVE") {
    return c.json(
      { success: false, response: "This service is temporarily unavailable." },
      503
    );
  }

  const knowledgeBase = chatbot.knowledgeBase as KnowledgeBase;
  const personality = chatbot.personality as ChatbotPersonality | null;
  const widgetConfig = chatbot.widgetConfig as WidgetConfig | null;
  void widgetConfig;

  const systemPrompt = buildChatbotSystemPrompt({
    businessName: chatbot.client.companyName,
    sector: chatbot.client.sector,
    language: chatbot.client.language,
    knowledgeBase,
    personality: personality ?? {
      tone: "professional",
      greeting: "Hello! How can I help you today?",
      fallbackMessage:
        "I'll have someone from our team get back to you shortly.",
    },
  });

  try {
    const claude = getClaudeClient();
    const result = await claude.callWithText(
      [{ role: "user", content: parsed.data.message }],
      {
        system: systemPrompt,
        maxTokens: 512,
        model: "claude-haiku-4-5",
      }
    );

    // Update conversation count asynchronously
    prisma.clientChatbot
      .update({
        where: { id: chatbotId },
        data: { totalConversations: { increment: 1 } },
      })
      .catch(console.error);

    return c.json({
      success: true,
      data: {
        response: result.text,
        sessionId: parsed.data.sessionId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Chatbot message error:", msg);
    return c.json(
      {
        success: true,
        data: {
          response:
            personality?.fallbackMessage ??
            "I'm sorry, I'm having trouble responding right now. Please try again later or contact us directly.",
          sessionId: parsed.data.sessionId,
        },
      },
      200
    );
  }
});

// GET /public/chatbot-widget.js — serve the embeddable widget script
app.get("/chatbot-widget.js", (c) => {
  const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";

  const script = `
(function() {
  var config = window.MadeCreativeConfig || {};
  if (!config.chatbotId) return;

  var apiUrl = config.apiUrl || '${apiUrl}';
  var chatbotId = config.chatbotId;
  var sessionId = 'mc_' + Math.random().toString(36).slice(2);

  fetch(apiUrl + '/public/chatbot/' + chatbotId + '/config')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      var cfg = data.data;
      var wc = cfg.widgetConfig || {};

      // Create widget container
      var container = document.createElement('div');
      container.id = 'mc-chatbot';
      container.style.cssText = [
        'position:fixed',
        (wc.position === 'bottom-left' ? 'left:20px' : 'right:20px'),
        'bottom:20px',
        'z-index:999999',
        'font-family:system-ui,sans-serif'
      ].join(';');

      var primaryColor = wc.primaryColor || '#6366f1';

      // Toggle button
      var btn = document.createElement('button');
      btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background:' + primaryColor + ';border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;margin-left:auto;';
      btn.innerHTML = '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

      // Chat panel
      var panel = document.createElement('div');
      panel.style.cssText = 'display:none;flex-direction:column;width:320px;height:440px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.15);margin-bottom:8px;overflow:hidden;';

      var header = document.createElement('div');
      header.style.cssText = 'background:' + primaryColor + ';color:white;padding:16px;font-weight:600;font-size:14px;';
      header.textContent = wc.title || cfg.name;

      var messages = document.createElement('div');
      messages.style.cssText = 'flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;';

      var inputRow = document.createElement('div');
      inputRow.style.cssText = 'display:flex;padding:8px;border-top:1px solid #eee;gap:8px;';

      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type a message...';
      input.style.cssText = 'flex:1;border:1px solid #ddd;border-radius:20px;padding:8px 12px;font-size:13px;outline:none;';

      var sendBtn = document.createElement('button');
      sendBtn.style.cssText = 'background:' + primaryColor + ';color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      sendBtn.innerHTML = '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

      function addMessage(text, isUser) {
        var msg = document.createElement('div');
        msg.style.cssText = 'max-width:80%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.4;' + (isUser ? 'background:' + primaryColor + ';color:white;align-self:flex-end;' : 'background:#f1f1f1;color:#333;align-self:flex-start;');
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
      }

      function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        addMessage(text, true);
        input.value = '';
        sendBtn.disabled = true;

        fetch(apiUrl + '/public/chatbot/' + chatbotId + '/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: sessionId })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.success) addMessage(d.data.response, false);
        })
        .catch(function() { addMessage('Sorry, something went wrong.', false); })
        .finally(function() { sendBtn.disabled = false; });
      }

      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });

      var isOpen = false;
      btn.addEventListener('click', function() {
        isOpen = !isOpen;
        panel.style.display = isOpen ? 'flex' : 'none';
        if (isOpen && messages.children.length === 0) {
          addMessage(wc.subtitle || 'Hello! How can I help you today?', false);
        }
      });

      inputRow.appendChild(input);
      inputRow.appendChild(sendBtn);
      panel.appendChild(header);
      panel.appendChild(messages);
      panel.appendChild(inputRow);
      container.appendChild(panel);
      container.appendChild(btn);
      document.body.appendChild(container);
    })
    .catch(function(e) { console.error('MadeCreative widget error:', e); });
})();
`;

  c.header("Content-Type", "application/javascript");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(script);
});

export default app;
