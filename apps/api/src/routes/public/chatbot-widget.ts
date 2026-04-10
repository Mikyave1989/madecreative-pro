import { Hono } from "hono";
import { getRedisConnection } from "../../lib/queue.js";
import type {
  KnowledgeBase,
  WidgetConfig,
} from "@madecreative/shared";

interface ChatbotPersonality {
  tone?: string;
  greeting?: string;
  fallbackMessage?: string;
}

const app = new Hono();

// ─── Rate limit helper (20 msg/min per IP for chatbot) ───────────────────────

async function checkChatbotRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRedisConnection();
    const windowMs = 60_000;
    const maxRequests = 20;
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const key = `rl:chatbot_widget:${ip}:${windowStart}`;

    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 65);
    const results = await pipeline.exec();

    const count = (results?.[0]?.[1] as number) ?? 1;
    const remaining = Math.max(0, maxRequests - count);
    return { allowed: count <= maxRequests, remaining };
  } catch {
    // If Redis is unavailable, allow
    return { allowed: true, remaining: 20 };
  }
}

// ─── Redis session helpers ────────────────────────────────────────────────────

interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SessionMeta {
  chatbotId: string;
  startedAt: string;
  messageCount: number;
}

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
const MAX_SESSION_MESSAGES = 20; // Keep last 20 messages for context

async function getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  try {
    const redis = getRedisConnection();
    const key = `chatbot:session:${sessionId}:messages`;
    const raw = await redis.get(key);
    if (!raw) return [];
    return JSON.parse(raw) as SessionMessage[];
  } catch {
    return [];
  }
}

async function saveSessionMessages(
  sessionId: string,
  messages: SessionMessage[]
): Promise<void> {
  try {
    const redis = getRedisConnection();
    const key = `chatbot:session:${sessionId}:messages`;
    // Keep last N messages
    const trimmed = messages.slice(-MAX_SESSION_MESSAGES);
    await redis.setex(key, SESSION_TTL, JSON.stringify(trimmed));
  } catch {
    // Non-fatal
  }
}

async function updateSessionMeta(
  sessionId: string,
  chatbotId: string
): Promise<void> {
  try {
    const redis = getRedisConnection();
    const key = `chatbot:session:${sessionId}:meta`;
    const existing = await redis.get(key);
    let meta: SessionMeta;

    if (existing) {
      meta = JSON.parse(existing) as SessionMeta;
      meta.messageCount += 1;
    } else {
      meta = {
        chatbotId,
        startedAt: new Date().toISOString(),
        messageCount: 1,
      };
    }

    await redis.setex(key, SESSION_TTL, JSON.stringify(meta));
  } catch {
    // Non-fatal
  }
}

// ─── GET /public/chatbot/:chatbotId/config ────────────────────────────────────

app.get("/:chatbotId/config", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const chatbotId = c.req.param("chatbotId");

  const chatbot = await prisma.clientChatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      isActive: true,
      widgetConfig: true,
      knowledgeBase: true,
      client: {
        select: { sector: true, language: true, companyName: true },
      },
    },
  });

  if (!chatbot || !chatbot.isActive) {
    return c.json({ error: "Chatbot not found or inactive" }, 404);
  }

  const wc = chatbot.widgetConfig as WidgetConfig | null;
  const kb = chatbot.knowledgeBase as KnowledgeBase | null;
  const defaultTitle = `Assistente di ${chatbot.client.companyName}`;

  return c.json({
    success: true,
    data: {
      chatbotId: chatbot.id,
      name: wc?.title ?? defaultTitle,
      widgetConfig: wc ?? {
        position: "bottom-right",
        primaryColor: "#6366f1",
        title: defaultTitle,
        subtitle: "Online",
      },
      language: chatbot.client.language,
      greeting: kb?.faqs?.[0]?.answer ?? "Ciao! Come posso aiutarti?",
      sector: chatbot.client.sector,
    },
  });
});

// ─── POST /public/chatbot/:chatbotId/message ──────────────────────────────────

app.post("/:chatbotId/message", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ChatbotMessageSchema } = await import("@madecreative/shared");
  const { buildChatbotSystemPrompt, getClaudeClient } = await import("@madecreative/ai");
  // Rate limiting per IP
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown";

  const { allowed, remaining } = await checkChatbotRateLimit(ip);
  c.header("X-RateLimit-Remaining", remaining.toString());

  if (!allowed) {
    return c.json(
      { success: false, error: "Too many messages, please wait a moment" },
      429
    );
  }

  const chatbotId = c.req.param("chatbotId");
  const body = await c.req.json().catch(() => null);
  const messageData = { ...body, chatbotId };

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
    select: {
      id: true,
      isActive: true,
      knowledgeBase: true,
      widgetConfig: true,
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

  const knowledgeBase = chatbot.knowledgeBase as unknown as KnowledgeBase;
  const wc = chatbot.widgetConfig as WidgetConfig | null;

  const systemPrompt = buildChatbotSystemPrompt({
    businessName: chatbot.client.companyName,
    sector: chatbot.client.sector,
    language: chatbot.client.language,
    knowledgeBase,
    personality: {
      tone: "professional",
      greeting: wc?.title ? `Ciao! Sono l'assistente di ${chatbot.client.companyName}.` : "Ciao! Come posso aiutarti?",
      fallbackMessage: "Non ho questa informazione. Contattaci direttamente.",
    },
  });

  // Load session history for context
  const sessionMessages = await getSessionMessages(parsed.data.sessionId);

  // Build messages with history (last 8 messages for context window efficiency)
  const historyMessages = sessionMessages.slice(-8).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const claude = getClaudeClient();
    const result = await claude.callWithText(
      [
        ...historyMessages,
        { role: "user", content: parsed.data.message },
      ],
      {
        system: systemPrompt,
        maxTokens: 512,
        model: "claude-haiku-4-5",
      }
    );

    // Save messages to Redis session
    const updatedMessages: SessionMessage[] = [
      ...sessionMessages,
      {
        role: "user",
        content: parsed.data.message,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: result.text,
        timestamp: new Date().toISOString(),
      },
    ];

    await Promise.all([
      saveSessionMessages(parsed.data.sessionId, updatedMessages),
      updateSessionMeta(parsed.data.sessionId, chatbotId),
    ]);

    // Increment conversation count asynchronously
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
            "Mi dispiace, ho un problema tecnico. Riprova o contattaci direttamente.",
          sessionId: parsed.data.sessionId,
        },
      },
      200
    );
  }
});

// ─── GET /public/chatbot-widget.js ────────────────────────────────────────────
// Optimized vanilla JS widget with:
// - Bubble button (bottom-right / bottom-left configurable)
// - Animated chat panel
// - Typing indicator (3 dots)
// - Basic markdown support (bold, links)
// - Mobile responsive
// - Auto-scroll
// - Session persistence via localStorage

app.get("/chatbot-widget.js", (c) => {
  const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";

  const script = `(function(){
var C=window.MadeCreativeConfig||{};
if(!C.chatbotId)return;
var AU=C.apiUrl||'${apiUrl}';
var CID=C.chatbotId;
var SID=function(){var k='mc_sid_'+CID;var s=localStorage.getItem(k);if(!s){s='mc_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(k,s);}return s;}();
var OPEN=false;
var container,panel,msgs,btn,inp,sendBtn,typingEl;

function md(t){
  t=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1</a>');
  t=t.replace(/\n/g,'<br>');
  return t;
}

function addMsg(text,isUser,raw){
  if(typingEl&&typingEl.parentNode)typingEl.parentNode.removeChild(typingEl);
  var d=document.createElement('div');
  var color=window._mcColor||'#6366f1';
  d.style.cssText='max-width:82%;padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.45;word-break:break-word;'+(isUser?'background:'+color+';color:#fff;align-self:flex-end;border-bottom-right-radius:4px;':'background:#f4f4f8;color:#1a1a2e;align-self:flex-start;border-bottom-left-radius:4px;');
  if(raw){d.innerHTML=md(text);}else{d.textContent=text;}
  msgs.appendChild(d);
  msgs.scrollTop=msgs.scrollHeight;
}

function showTyping(){
  typingEl=document.createElement('div');
  typingEl.style.cssText='align-self:flex-start;padding:10px 14px;background:#f4f4f8;border-radius:16px;border-bottom-left-radius:4px;';
  typingEl.innerHTML='<span style="display:inline-flex;gap:4px;align-items:center"><span style="width:7px;height:7px;border-radius:50%;background:#aaa;animation:mc-bounce 1.2s infinite 0s"></span><span style="width:7px;height:7px;border-radius:50%;background:#aaa;animation:mc-bounce 1.2s infinite 0.2s"></span><span style="width:7px;height:7px;border-radius:50%;background:#aaa;animation:mc-bounce 1.2s infinite 0.4s"></span></span>';
  msgs.appendChild(typingEl);
  msgs.scrollTop=msgs.scrollHeight;
}

function sendMsg(){
  var t=(inp.value||'').trim();
  if(!t||sendBtn.disabled)return;
  addMsg(t,true,false);
  inp.value='';
  sendBtn.disabled=true;
  inp.disabled=true;
  showTyping();
  fetch(AU+'/public/chatbot/'+CID+'/message',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:t,sessionId:SID})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.success&&d.data&&d.data.response){addMsg(d.data.response,false,true);}
    else{addMsg('Errore nella risposta. Riprova.',false,false);}
  })
  .catch(function(){
    if(typingEl&&typingEl.parentNode)typingEl.parentNode.removeChild(typingEl);
    addMsg('Errore di connessione. Riprova.',false,false);
  })
  .finally(function(){sendBtn.disabled=false;inp.disabled=false;inp.focus();});
}

function togglePanel(){
  OPEN=!OPEN;
  panel.style.display=OPEN?'flex':'none';
  panel.style.opacity=OPEN?'1':'0';
  btn.innerHTML=OPEN?
    '<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>':
    '<svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  if(OPEN&&msgs.children.length===0){
    fetch(AU+'/public/chatbot/'+CID+'/config')
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.success&&d.data&&d.data.greeting){addMsg(d.data.greeting,false,false);}
      }).catch(function(){});
  }
  if(OPEN)setTimeout(function(){inp.focus();},150);
}

function buildWidget(cfg){
  var wc=cfg.widgetConfig||{};
  var color=wc.primaryColor||'#6366f1';
  var pos=wc.position==='bottom-left'?'left:20px':'right:20px';
  window._mcColor=color;

  var style=document.createElement('style');
  style.textContent='@keyframes mc-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}@keyframes mc-slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}#mc-chatbot *{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}#mc-panel{animation:mc-slide-up 0.2s ease}@media(max-width:480px){#mc-panel{width:calc(100vw - 24px) !important;height:calc(100vh - 100px) !important;right:12px !important;left:12px !important;}}';
  document.head.appendChild(style);

  container=document.createElement('div');
  container.id='mc-chatbot';
  container.style.cssText='position:fixed;'+pos+';bottom:20px;z-index:2147483647;';

  panel=document.createElement('div');
  panel.id='mc-panel';
  panel.style.cssText='display:none;flex-direction:column;width:340px;height:480px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);margin-bottom:10px;overflow:hidden;border:1px solid rgba(0,0,0,.08);';

  var header=document.createElement('div');
  header.style.cssText='background:'+color+';color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  var avatarDiv=document.createElement('div');
  avatarDiv.style.cssText='width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;';
  avatarDiv.textContent=wc.avatarEmoji||'💬';
  var headerText=document.createElement('div');
  headerText.style.cssText='flex:1;min-width:0;';
  var headerTitle=document.createElement('div');
  headerTitle.style.cssText='font-weight:700;font-size:14px;';
  headerTitle.textContent=wc.title||cfg.name||'Assistente';
  var headerSub=document.createElement('div');
  headerSub.style.cssText='font-size:11px;opacity:0.85;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  headerSub.textContent=wc.subtitle||'Online';
  var onlineDot=document.createElement('span');
  onlineDot.style.cssText='width:8px;height:8px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 0 2px rgba(255,255,255,0.4);';
  headerText.appendChild(headerTitle);
  headerText.appendChild(headerSub);
  header.appendChild(avatarDiv);
  header.appendChild(headerText);
  header.appendChild(onlineDot);

  msgs=document.createElement('div');
  msgs.style.cssText='flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;scroll-behavior:smooth;';
  msgs.style.overscrollBehavior='contain';

  var inputRow=document.createElement('div');
  inputRow.style.cssText='display:flex;padding:10px 12px;border-top:1px solid #f0f0f0;gap:8px;align-items:center;flex-shrink:0;background:#fafafa;';

  inp=document.createElement('input');
  inp.type='text';
  inp.placeholder=cfg.language==='it'?'Scrivi un messaggio...':cfg.language==='de'?'Nachricht schreiben...':cfg.language==='fr'?'Votre message...':cfg.language==='es'?'Escribe un mensaje...':'Type a message...';
  inp.style.cssText='flex:1;border:1.5px solid #e5e7eb;border-radius:24px;padding:9px 14px;font-size:13px;outline:none;background:#fff;transition:border-color 0.15s;color:#111;';
  inp.addEventListener('focus',function(){inp.style.borderColor=color;});
  inp.addEventListener('blur',function(){inp.style.borderColor='#e5e7eb';});

  sendBtn=document.createElement('button');
  sendBtn.type='button';
  sendBtn.style.cssText='background:'+color+';color:#fff;border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.15s;';
  sendBtn.innerHTML='<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  sendBtn.addEventListener('mouseenter',function(){sendBtn.style.opacity='0.85';});
  sendBtn.addEventListener('mouseleave',function(){sendBtn.style.opacity='1';});

  inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
  sendBtn.addEventListener('click',sendMsg);

  inputRow.appendChild(inp);
  inputRow.appendChild(sendBtn);
  panel.appendChild(header);
  panel.appendChild(msgs);
  panel.appendChild(inputRow);

  btn=document.createElement('button');
  btn.type='button';
  btn.style.cssText='width:56px;height:56px;border-radius:50%;background:'+color+';border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;margin-left:auto;transition:transform 0.15s,box-shadow 0.15s;';
  btn.innerHTML='<svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  btn.setAttribute('aria-label','Apri chat');
  btn.addEventListener('mouseenter',function(){btn.style.transform='scale(1.08)';btn.style.boxShadow='0 6px 20px rgba(0,0,0,.3)';});
  btn.addEventListener('mouseleave',function(){btn.style.transform='scale(1)';btn.style.boxShadow='0 4px 16px rgba(0,0,0,.25)';});
  btn.addEventListener('click',togglePanel);

  container.appendChild(panel);
  container.appendChild(btn);
  document.body.appendChild(container);
}

fetch(AU+'/public/chatbot/'+CID+'/config')
  .then(function(r){return r.json();})
  .then(function(d){if(d.success&&d.data){buildWidget(d.data);}})
  .catch(function(e){console.warn('MadeCreative widget error:',e);});
})();`;

  c.header("Content-Type", "application/javascript");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(script);
});

export default app;
