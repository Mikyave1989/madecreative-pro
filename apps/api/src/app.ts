// build: 2026-04-08
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

// Middleware
import { adminAuthMiddleware, clientAuthMiddleware } from "./middleware/auth.js";
// Rate limiting disabled — Redis unavailable on Vercel serverless.
// Re-enable when API moves to a persistent server (Railway).

// Admin Routes
import adminAuthRoutes from "./routes/admin/auth.js";
import adminProspectsRoutes from "./routes/admin/prospects.js";
import adminClientsRoutes from "./routes/admin/clients.js";
import adminAgentsRoutes from "./routes/admin/agents.js";
import adminMetricsRoutes from "./routes/admin/metrics.js";
import adminLaunchRoutes from "./routes/admin/launch.js";

// Portal Routes
import portalAuthRoutes from "./routes/portal/auth.js";
import portalDashboardRoutes from "./routes/portal/dashboard.js";
import portalWebsiteRoutes from "./routes/portal/website.js";
import portalChatbotRoutes from "./routes/portal/chatbot.js";
import portalBillingRoutes from "./routes/portal/billing.js";
import portalReportsRoutes from "./routes/portal/reports.js";
import portalEditorRoutes from "./routes/portal/editor.js";
import portalEditorChatRoutes from "./routes/portal/editor-chat.js";
import portalSettingsRoutes from "./routes/portal/settings.js";
import portalProjectsRoutes from "./routes/portal/projects.js";

// Public Routes
import webhookRoutes from "./routes/public/webhook.js";
import chatbotWidgetRoutes from "./routes/public/chatbot-widget.js";
import unsubscribeRoutes from "./routes/public/unsubscribe.js";
import trackRoutes from "./routes/public/track.js";
import signupRoutes from "./routes/public/signup.js";
import aiGenerateRoutes from "./routes/public/ai-generate.js";

const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: [
      process.env["MARKETING_URL"] ?? "https://madecreative.pro",
      process.env["ADMIN_URL"] ?? "https://admin.madecreative.pro",
      process.env["PORTAL_URL"] ?? "https://madecreative.pro",
      process.env["EDITOR_URL"] ?? "https://madecreative.pro",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:5173",
    ],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    credentials: true,
  })
);
app.use("*", prettyJSON());

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", async (c) => {
  let db = "unknown";
  try {
    const { prisma } = await import("@madecreative/db");
    await prisma.$queryRawUnsafe("SELECT 1");
    db = "ok";
  } catch (e) {
    db = `error: ${e instanceof Error ? e.message.substring(0, 100) : String(e)}`;
  }
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "1.0.0",
    db,
  });
});

// ─── Public Routes (no auth) ──────────────────────────────────────────────────

app.route("/public/webhook", webhookRoutes);
app.route("/public/chatbot", chatbotWidgetRoutes);
// Alias: /public/chatbot-widget.js → redirect to correct path
app.get("/public/chatbot-widget.js", (c) => c.redirect("/public/chatbot/chatbot-widget.js", 301));
app.route("/public/unsubscribe", unsubscribeRoutes);
app.route("/public/signup", signupRoutes);
app.route("/track", trackRoutes);
app.route("/public/ai-generate", aiGenerateRoutes);

// ─── Public Preview (serves generated site HTML) ─────────────────────────────

app.get("/preview/:prospectId", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("prospectId");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { companyName: true, sector: true, city: true, contactPhone: true, contactEmail: true, googleRating: true, reviewCount: true, website: true, photoUrls: true, logoUrl: true, country: true, previewSiteUrl: true },
  });

  if (!prospect) {
    return c.text("Preview not found", 404);
  }

  // ─── Localised copy ───────────────────────────────────────────────────────────
  const country = (prospect.country ?? "").toUpperCase();
  type LangPack = { topBar: string; bottomLabel: string; cta: string; powered: string };
  const i18n: LangPack = (() => {
    if (["DE", "AT", "CH"].includes(country)) {
      return {
        topBar: "Das ist eine Vorschau Ihrer neuen Website — von KI in 60 Sekunden erstellt",
        bottomLabel: `${prospect.companyName} — Ihre neue Website ist fertig!`,
        cta: "Diese Website erhalten — ab €25/Monat",
        powered: "Bereitgestellt von MadeCreative",
      };
    }
    if (country === "IT") {
      return {
        topBar: "Questa è un'anteprima del tuo nuovo sito web — creato dall'AI in 60 secondi",
        bottomLabel: `${prospect.companyName} — Il tuo nuovo sito è pronto!`,
        cta: "Ottieni questo sito — da €25/mese",
        powered: "Offerto da MadeCreative",
      };
    }
    if (["FR", "BE"].includes(country)) {
      return {
        topBar: "Ceci est un aperçu de votre nouveau site web — créé par l'IA en 60 secondes",
        bottomLabel: `${prospect.companyName} — Votre nouveau site est prêt\u00a0!`,
        cta: "Obtenir ce site — à partir de €25/mois",
        powered: "Propulsé par MadeCreative",
      };
    }
    if (country === "ES") {
      return {
        topBar: "Esta es una vista previa de su nuevo sitio web — creado por IA en 60 segundos",
        bottomLabel: `${prospect.companyName} — ¡Tu nuevo sitio está listo!`,
        cta: "Obtener este sitio — desde €25/mes",
        powered: "Ofrecido por MadeCreative",
      };
    }
    // Default — English
    return {
      topBar: "This is a preview of your new website — built by AI in 60 seconds",
      bottomLabel: `${prospect.companyName} — Your new website is ready!`,
      cta: "Get This Website — from €25/mo",
      powered: "Powered by MadeCreative",
    };
  })();

  const signupUrl = `https://madecreative.pro/signup?plan=STARTER&email=${encodeURIComponent(prospect.contactEmail ?? "")}&company=${encodeURIComponent(prospect.companyName)}`;

  // ─── If builder has deployed a real site, fetch its HTML and inject banners ──
  if (prospect.previewSiteUrl) {
    try {
      const siteRes = await fetch(prospect.previewSiteUrl, { headers: { "User-Agent": "MadeCreative-Preview/1.0" } });
      if (siteRes.ok) {
        let siteHtml = await siteRes.text();

        // Inject banner CSS + HTML into the fetched site
        const bannerCss = `<style>:root{--mc-top:48px;--mc-bottom:64px}body{padding-top:var(--mc-top)!important;padding-bottom:var(--mc-bottom)!important}#mc-top-bar{position:fixed;top:0;left:0;right:0;height:var(--mc-top);z-index:2147483647;background:linear-gradient(90deg,#4f46e5 0%,#7c3aed 60%,#9333ea 100%);display:flex;align-items:center;justify-content:center;padding:0 16px;box-shadow:0 2px 12px rgba(79,70,229,0.35);gap:10px}#mc-top-bar span{color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:500;text-align:center;line-height:1.3}#mc-top-bar .mc-dot{width:8px;height:8px;border-radius:50%;background:#a5f3fc;flex-shrink:0;animation:mc-pulse 2s ease-in-out infinite}@keyframes mc-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}#mc-bottom-bar{position:fixed;bottom:0;left:0;right:0;height:var(--mc-bottom);z-index:2147483647;background:linear-gradient(90deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%);display:flex;align-items:center;justify-content:space-between;padding:0 24px;gap:12px;box-shadow:0 -2px 16px rgba(79,70,229,0.4)}#mc-bottom-bar .mc-company-label{color:#c7d2fe;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}#mc-bottom-bar .mc-right{display:flex;align-items:center;gap:16px;flex-shrink:0}#mc-bottom-bar .mc-powered{color:#6366f1;font-size:11px;white-space:nowrap}#mc-cta-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff!important;font-size:14px;font-weight:700;padding:10px 22px;border-radius:9999px;text-decoration:none!important;white-space:nowrap;box-shadow:0 4px 14px rgba(99,102,241,0.5);transition:transform .15s,box-shadow .15s}#mc-cta-btn:hover{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,0.65)}#mc-cta-btn .mc-arrow{font-size:16px;transition:transform .15s}#mc-cta-btn:hover .mc-arrow{transform:translateX(3px)}@media(max-width:600px){#mc-top-bar span{font-size:11px}#mc-bottom-bar{padding:0 12px;gap:8px}#mc-bottom-bar .mc-company-label{display:none}#mc-bottom-bar .mc-powered{display:none}#mc-cta-btn{font-size:13px;padding:9px 16px}}</style>`;
        const topBar = `<div id="mc-top-bar" role="banner"><span class="mc-dot"></span><span>${i18n.topBar}</span></div>`;
        const bottomBar = `<div id="mc-bottom-bar" role="complementary"><span class="mc-company-label">${i18n.bottomLabel}</span><div class="mc-right"><span class="mc-powered">${i18n.powered}</span><a id="mc-cta-btn" href="${signupUrl}" target="_blank" rel="noopener noreferrer">${i18n.cta}<span class="mc-arrow" aria-hidden="true">&#8594;</span></a></div></div>`;

        siteHtml = siteHtml
          .replace("</head>", `${bannerCss}\n</head>`)
          .replace(/<body([^>]*)>/, `<body$1>\n${topBar}`)
          .replace("</body>", `${bottomBar}\n</body>`);

        return c.html(siteHtml);
      }
    } catch {
      // Fetch failed — fall through to generated fallback
    }
  }

  // ─── Fallback: generate HTML on-the-fly for prospects without a deployed site ─
  const { generateSitePreview } = await import("@madecreative/shared");
  const siteHtml = generateSitePreview({
    name: prospect.companyName,
    sector: prospect.sector,
    city: prospect.city ?? undefined,
    phone: prospect.contactPhone ?? undefined,
    email: prospect.contactEmail ?? undefined,
    googleRating: prospect.googleRating ?? undefined,
    reviewCount: prospect.reviewCount ?? undefined,
    logoUrl: prospect.logoUrl ?? undefined,
  });

  // ─── Injected CSS ─────────────────────────────────────────────────────────────
  const bannerStyle = `
<style>
  /* MadeCreative preview banner */
  :root {
    --mc-top: 48px;
    --mc-bottom: 64px;
  }
  body {
    padding-top: var(--mc-top) !important;
    padding-bottom: var(--mc-bottom) !important;
  }
  #mc-top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--mc-top);
    z-index: 2147483647;
    background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    box-shadow: 0 2px 12px rgba(79,70,229,0.35);
    gap: 10px;
  }
  #mc-top-bar span {
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-align: center;
    line-height: 1.3;
  }
  #mc-top-bar .mc-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a5f3fc;
    flex-shrink: 0;
    animation: mc-pulse 2s ease-in-out infinite;
  }
  @keyframes mc-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }
  #mc-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--mc-bottom);
    z-index: 2147483647;
    background: linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    gap: 12px;
    box-shadow: 0 -2px 16px rgba(79,70,229,0.4);
  }
  #mc-bottom-bar .mc-company-label {
    color: #c7d2fe;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  #mc-bottom-bar .mc-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  #mc-bottom-bar .mc-powered {
    color: #6366f1;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    font-weight: 400;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
  #mc-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #fff !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 10px 22px;
    border-radius: 9999px;
    text-decoration: none !important;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(99,102,241,0.5);
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  #mc-cta-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.65);
  }
  #mc-cta-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(99,102,241,0.4);
  }
  #mc-cta-btn .mc-arrow {
    font-size: 16px;
    transition: transform 0.15s ease;
  }
  #mc-cta-btn:hover .mc-arrow {
    transform: translateX(3px);
  }
  @media (max-width: 600px) {
    #mc-top-bar span { font-size: 11px; }
    #mc-bottom-bar { padding: 0 12px; gap: 8px; }
    #mc-bottom-bar .mc-company-label { display: none; }
    #mc-bottom-bar .mc-powered { display: none; }
    #mc-cta-btn { font-size: 13px; padding: 9px 16px; }
  }
</style>`;

  // ─── Injected HTML ────────────────────────────────────────────────────────────
  const topBar = `
<div id="mc-top-bar" role="banner" aria-label="Preview notice">
  <span class="mc-dot"></span>
  <span>${i18n.topBar}</span>
</div>`;

  const bottomBar = `
<div id="mc-bottom-bar" role="complementary" aria-label="Purchase call to action">
  <span class="mc-company-label">${i18n.bottomLabel}</span>
  <div class="mc-right">
    <span class="mc-powered">${i18n.powered}</span>
    <a id="mc-cta-btn" href="${signupUrl}" target="_blank" rel="noopener noreferrer">
      ${i18n.cta}<span class="mc-arrow" aria-hidden="true">&#8594;</span>
    </a>
  </div>
</div>`;

  // Inject into the generated HTML
  const html = siteHtml
    .replace("</head>", `${bannerStyle}\n</head>`)
    .replace("<body", `${topBar}\n<body`)
    .replace("</body>", `${bottomBar}\n</body>`);

  return c.html(html);
});

// Also support slug-based preview
app.get("/preview/site/:slug", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const slug = c.req.param("slug");

  // Try to find by subdomain or by company name slug
  const website = await prisma.clientWebsite.findFirst({
    where: { OR: [{ subdomain: slug }, { domain: { contains: slug } }] },
    include: { client: true },
  });

  if (website?.client) {
    const { generateSitePreview } = await import("@madecreative/shared");
    const html = generateSitePreview({
      name: website.client.companyName,
      sector: website.client.sector,
      city: website.client.city ?? undefined,
      phone: website.client.phone ?? undefined,
      email: website.client.email ?? undefined,
    });
    return c.html(html);
  }

  return c.text("Site not found", 404);
});

// ─── Admin Auth Routes ───────────────────────────────────────────────────────

app.route("/admin/auth", adminAuthRoutes);

// ─── Admin Protected Routes ───────────────────────────────────────────────────

app.use("/admin/prospects/*", adminAuthMiddleware);
app.use("/admin/clients/*", adminAuthMiddleware);
app.use("/admin/agents/*", adminAuthMiddleware);
app.use("/admin/metrics/*", adminAuthMiddleware);
app.use("/admin/launch/*", adminAuthMiddleware);

app.route("/admin/prospects", adminProspectsRoutes);
app.route("/admin/clients", adminClientsRoutes);
app.route("/admin/agents", adminAgentsRoutes);
app.route("/admin/metrics", adminMetricsRoutes);
app.route("/admin/launch", adminLaunchRoutes);

// ─── Portal Auth Routes (rate limited) ───────────────────────────────────────

app.route("/portal/auth", portalAuthRoutes);

// ─── Portal Protected Routes ──────────────────────────────────────────────────

app.use("/portal/dashboard/*", clientAuthMiddleware);
app.use("/portal/website/*", clientAuthMiddleware);
app.use("/portal/chatbot/*", clientAuthMiddleware);
app.use("/portal/billing/*", clientAuthMiddleware);
app.use("/portal/reports/*", clientAuthMiddleware);
app.use("/portal/editor/*", clientAuthMiddleware);

app.route("/portal/dashboard", portalDashboardRoutes);
app.route("/portal/website", portalWebsiteRoutes);
app.route("/portal/chatbot", portalChatbotRoutes);
app.route("/portal/billing", portalBillingRoutes);
app.route("/portal/reports", portalReportsRoutes);
app.route("/portal/editor", portalEditorRoutes);
app.route("/portal/editor/chat", portalEditorChatRoutes);
app.use("/portal/settings/*", clientAuthMiddleware);
app.route("/portal/settings", portalSettingsRoutes);

app.use("/portal/projects/*", clientAuthMiddleware);
app.route("/portal/projects", portalProjectsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ success: false, error: "Not found" }, 404);
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  const isDev = process.env["NODE_ENV"] === "development";
  return c.json(
    {
      success: false,
      error: "Internal server error",
      ...(isDev ? { details: err.message, stack: err.stack } : {}),
    },
    500
  );
});

export default app;
