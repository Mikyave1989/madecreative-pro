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
import adminGenerateSiteRoutes from "./routes/admin/generate-site.js";

// Portal Routes
import portalAuthRoutes from "./routes/portal/auth.js";
import portalDashboardRoutes from "./routes/portal/dashboard.js";
import portalWebsiteRoutes from "./routes/portal/website.js";
import portalChatbotRoutes from "./routes/portal/chatbot.js";
import portalBillingRoutes from "./routes/portal/billing.js";
import portalReportsRoutes from "./routes/portal/reports.js";
// Editor removed — sites are modified directly via Claude
// import portalEditorRoutes from "./routes/portal/editor.js";
// import portalEditorChatRoutes from "./routes/portal/editor-chat.js";
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

// ─── Public deep-scrape proxy — forwards to Railway worker (has Playwright) ──

app.post("/public/scrape-deep", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.url) return c.json({ error: "url required" }, 400);

  const scrapeUrl = process.env["SCRAPE_SERVICE_URL"];
  if (!scrapeUrl) {
    // Fallback to basic scraper if worker URL not configured
    const { scrapeWebsite } = await import("@madecreative/shared");
    try {
      const scraped = await scrapeWebsite(body.url as string);
      return c.json({ success: true, data: { scraped } });
    } catch (err) {
      return c.json({ error: "Scrape failed", details: err instanceof Error ? err.message : String(err) }, 500);
    }
  }

  // Forward to Railway worker's Playwright scraper (no auth needed — public sites only)
  try {
    const res = await fetch(`${scrapeUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: body.url }),
    });
    const data = await res.json();
    return c.json(data, res.ok ? 200 : 500);
  } catch (err) {
    return c.json({ error: "Worker unreachable", details: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// ─── Internal Route — called by workers, protected by JWT_SECRET header ──────

app.post("/internal/send-preview-email/:prospectId", async (c) => {
  const secret = c.req.header("X-Internal-Token");
  if (!secret || secret !== process.env["JWT_SECRET"]) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("prospectId");
  const body = await c.req.json().catch(() => ({})) as { language?: string };

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, companyName: true, contactEmail: true, previewSiteUrl: true, city: true, sector: true, country: true, scrapedContent: true },
  });

  if (!prospect?.contactEmail) return c.json({ error: "No email" }, 422);
  if (!prospect?.previewSiteUrl) return c.json({ error: "No preview URL" }, 422);

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) return c.json({ error: "RESEND not configured" }, 500);

  // Determine plan & price based on number of pages in scrapedContent
  const planPrices: Record<string, { setup: number; monthly: number }> = {
    STARTER: { setup: 997, monthly: 49 },
    GROWTH: { setup: 1997, monthly: 79 },
    PRO: { setup: 3497, monthly: 129 },
  };
  const pageCount = (prospect.scrapedContent as { pages?: unknown[] } | null)?.pages?.length ?? 1;
  const plan = pageCount >= 8 ? "PRO" : pageCount >= 3 ? "GROWTH" : "STARTER";
  const price = planPrices[plan]!;

  const lang = body.language ?? "en";
  const name = prospect.companyName;
  const city = prospect.city ?? "";
  const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";
  const previewUrl = `${apiBase}/preview/${id}`; // API preview URL (cleaner, consistent)
  const signupUrl = `https://madecreative.pro/signup?plan=${plan}&email=${encodeURIComponent(prospect.contactEmail)}&company=${encodeURIComponent(name)}&prospectId=${id}&source=preview`;

  // Price labels removed — WhatsApp CTA doesn't show prices

  // Clean email — personal intro + one preview button + WhatsApp
  const subjects: Record<string, string> = {
    de: `${name} - Ihre neue Website ist fertig`,
    it: `${name} - il vostro nuovo sito e pronto`,
    fr: `${name} - votre nouveau site est pret`,
    es: `${name} - su nuevo sitio web esta listo`,
    en: `${name} - your new website is ready`,
  };

  const waNumber = "393317389918";
  const waMsg = encodeURIComponent(`Ciao, ho visto l'anteprima del sito per ${name}. Vorrei saperne di più!`);
  const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

  const btn = `<a href="${previewUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin:20px 0">`;
  const waBtn = `<a href="${waLink}" style="display:inline-block;background:#25D366;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 0">`;

  const bodies: Record<string, string> = {
    de: `<p style="margin:0 0 16px">Hallo,</p><p style="margin:0 0 16px">ich habe mir <strong>${name}</strong>${city ? ` in ${city}` : ""} angesehen und einen kostenlosen Webseiten-Vorschlag erstellt.</p><p style="margin:0 0 24px">Hier ist das Ergebnis:</p><p style="margin:0 0 16px;text-align:center">${btn}Website-Vorschau ansehen</a></p><p style="margin:0 0 24px;text-align:center">${waBtn}Auf WhatsApp schreiben</a></p><p style="margin:0">Viele Gruesse,<br>Marco Bianchi<br><span style="color:#6366f1">madecreative.pro</span></p>`,
    it: `<p style="margin:0 0 16px">Ciao,</p><p style="margin:0 0 16px">ho visto <strong>${name}</strong>${city ? ` a ${city}` : ""} e ho creato una proposta gratuita per un nuovo sito web.</p><p style="margin:0 0 24px">Ecco il risultato:</p><p style="margin:0 0 16px;text-align:center">${btn}Vedi l'anteprima</a></p><p style="margin:0 0 24px;text-align:center">${waBtn}Scrivici su WhatsApp</a></p><p style="margin:0">Cordialmente,<br>Marco Bianchi<br><span style="color:#6366f1">madecreative.pro</span></p>`,
    fr: `<p style="margin:0 0 16px">Bonjour,</p><p style="margin:0 0 16px">J'ai vu <strong>${name}</strong>${city ? ` a ${city}` : ""} et j'ai cree une proposition gratuite de nouveau site web.</p><p style="margin:0 0 24px">Voici le resultat:</p><p style="margin:0 0 16px;text-align:center">${btn}Voir l'apercu</a></p><p style="margin:0 0 24px;text-align:center">${waBtn}Ecrivez-nous sur WhatsApp</a></p><p style="margin:0">Cordialement,<br>Marco Bianchi<br><span style="color:#6366f1">madecreative.pro</span></p>`,
    es: `<p style="margin:0 0 16px">Hola,</p><p style="margin:0 0 16px">He visto <strong>${name}</strong>${city ? ` en ${city}` : ""} y he creado una propuesta gratuita de nuevo sitio web.</p><p style="margin:0 0 24px">Aqui esta el resultado:</p><p style="margin:0 0 16px;text-align:center">${btn}Ver vista previa</a></p><p style="margin:0 0 24px;text-align:center">${waBtn}Escribenos por WhatsApp</a></p><p style="margin:0">Saludos,<br>Marco Bianchi<br><span style="color:#6366f1">madecreative.pro</span></p>`,
    en: `<p style="margin:0 0 16px">Hi,</p><p style="margin:0 0 16px">I came across <strong>${name}</strong>${city ? ` in ${city}` : ""} and created a free website proposal for you.</p><p style="margin:0 0 24px">Here is the result:</p><p style="margin:0 0 16px;text-align:center">${btn}View your preview</a></p><p style="margin:0 0 24px;text-align:center">${waBtn}Chat with us on WhatsApp</a></p><p style="margin:0">Best,<br>Marco Bianchi<br><span style="color:#6366f1">madecreative.pro</span></p>`,
  };

  const subject = subjects[lang] ?? subjects.en!;
  const bodyHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#333;line-height:1.6;font-size:15px;background:#ffffff">${bodies[lang] ?? bodies.en!}<p style="margin:32px 0 0;padding-top:20px;border-top:1px solid #e8e8e8;font-size:12px;color:#999">MadeCreative · madecreative.pro · Unsubscribe</p></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Marco Bianchi <marco@madecreative.pro>", to: [prospect.contactEmail], reply_to: "info@madecreative.pro", subject, html: bodyHtml }),
  });

  const data = await res.json() as { id?: string; error?: unknown };
  if (!res.ok) return c.json({ error: "Resend error", details: data }, 500);

  await prisma.outreachEmail.create({ data: { prospectId: id, stepNumber: 1, subject, body: bodyHtml, bodyPlain: `${name} - Preview: ${previewUrl}`, language: lang, fromName: "Marco Bianchi", fromEmail: "marco@madecreative.pro", resendMessageId: data.id ?? null, sentAt: new Date(), status: "sent" } });
  await prisma.prospect.update({ where: { id }, data: { status: "CONTACTED", firstContactedAt: new Date(), lastContactedAt: new Date() } });

  return c.json({ success: true, data: { messageId: data.id, sentTo: prospect.contactEmail, previewUrl } });
});

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
        cta: "Auf WhatsApp schreiben",
        powered: "Bereitgestellt von MadeCreative",
      };
    }
    if (country === "IT") {
      return {
        topBar: "Questa è un'anteprima del tuo nuovo sito web — creato dall'AI in 60 secondi",
        bottomLabel: `${prospect.companyName} — Il tuo nuovo sito è pronto!`,
        cta: "Scrivici su WhatsApp",
        powered: "Offerto da MadeCreative",
      };
    }
    if (["FR", "BE"].includes(country)) {
      return {
        topBar: "Ceci est un aperçu de votre nouveau site web — créé par l'IA en 60 secondes",
        bottomLabel: `${prospect.companyName} — Votre nouveau site est prêt\u00a0!`,
        cta: "Ecrivez-nous sur WhatsApp",
        powered: "Propulsé par MadeCreative",
      };
    }
    if (country === "ES") {
      return {
        topBar: "Esta es una vista previa de su nuevo sitio web — creado por IA en 60 segundos",
        bottomLabel: `${prospect.companyName} — ¡Tu nuevo sitio está listo!`,
        cta: "Escribenos por WhatsApp",
        powered: "Ofrecido por MadeCreative",
      };
    }
    // Default — English
    return {
      topBar: "This is a preview of your new website — built by AI in 60 seconds",
      bottomLabel: `${prospect.companyName} — Your new website is ready!`,
      cta: "Chat on WhatsApp",
      powered: "Powered by MadeCreative",
    };
  })();

  const waNumber = "393317389918";
  const waText = encodeURIComponent(`Ciao, ho visto l'anteprima del sito per ${prospect.companyName}. Vorrei saperne di più!`);
  const whatsappUrl = `https://wa.me/${waNumber}?text=${waText}`;

  // ─── If builder has deployed a real site, redirect to it ──
  // Direct redirect avoids proxy issues with Next.js relative paths (/_next/...)
  if (prospect.previewSiteUrl && !prospect.previewSiteUrl.includes("/preview/")) {
    return c.redirect(prospect.previewSiteUrl, 302);
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
  /* MadeCreative preview banner — bottom only, no top bar blocking hamburger */
  :root {
    --mc-bottom: 64px;
  }
  body {
    padding-bottom: var(--mc-bottom) !important;
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
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
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
    box-shadow: 0 4px 14px rgba(37,211,102,0.5);
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  #mc-cta-btn:hover {
    background: linear-gradient(135deg, #20BD5A 0%, #0E7A6C 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37,211,102,0.65);
  }
  #mc-cta-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(37,211,102,0.4);
  }
  #mc-cta-btn .mc-arrow {
    font-size: 16px;
    transition: transform 0.15s ease;
  }
  #mc-cta-btn:hover .mc-arrow {
    transform: translateX(3px);
  }
  @media (max-width: 600px) {
    #mc-bottom-bar { padding: 0 12px; gap: 8px; }
    #mc-bottom-bar .mc-company-label { display: none; }
    #mc-bottom-bar .mc-powered { display: none; }
    #mc-cta-btn { font-size: 13px; padding: 9px 16px; }
  }
</style>`;

  // ─── Bottom bar only — no top bar (was blocking hamburger menu on mobile) ─────
  const bottomBar = `
<div id="mc-bottom-bar" role="complementary" aria-label="Purchase call to action">
  <span class="mc-company-label">${i18n.bottomLabel}</span>
  <div class="mc-right">
    <span class="mc-powered">${i18n.powered}</span>
    <a id="mc-cta-btn" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
      ${i18n.cta}<span class="mc-arrow" aria-hidden="true">&#8594;</span>
    </a>
  </div>
</div>`;

  // Inject into the generated HTML
  const html = siteHtml
    .replace("</head>", `${bannerStyle}\n</head>`)
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
app.route("/admin/generate-site", adminGenerateSiteRoutes);

// ─── Portal Auth Routes (rate limited) ───────────────────────────────────────

app.route("/portal/auth", portalAuthRoutes);

// ─── Portal Protected Routes ──────────────────────────────────────────────────

app.use("/portal/dashboard/*", clientAuthMiddleware);
app.use("/portal/website/*", clientAuthMiddleware);
app.use("/portal/chatbot/*", clientAuthMiddleware);
app.use("/portal/billing/*", clientAuthMiddleware);
app.use("/portal/reports/*", clientAuthMiddleware);
app.route("/portal/dashboard", portalDashboardRoutes);
app.route("/portal/website", portalWebsiteRoutes);
app.route("/portal/chatbot", portalChatbotRoutes);
app.route("/portal/billing", portalBillingRoutes);
app.route("/portal/reports", portalReportsRoutes);
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
