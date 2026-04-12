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
      process.env["PORTAL_URL"] ?? "https://app.madecreative.pro",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
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
    select: { companyName: true, sector: true, city: true, contactPhone: true, contactEmail: true, googleRating: true, reviewCount: true, website: true, photoUrls: true, logoUrl: true },
  });

  if (!prospect) {
    return c.text("Preview not found", 404);
  }

  const { generateSitePreview } = await import("@madecreative/shared");
  const html = generateSitePreview({
    name: prospect.companyName,
    sector: prospect.sector,
    city: prospect.city ?? undefined,
    phone: prospect.contactPhone ?? undefined,
    email: prospect.contactEmail ?? undefined,
    googleRating: prospect.googleRating ?? undefined,
    reviewCount: prospect.reviewCount ?? undefined,
    logoUrl: prospect.logoUrl ?? undefined,
  });

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
