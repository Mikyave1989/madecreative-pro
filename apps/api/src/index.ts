import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

// Middleware
import { adminAuthMiddleware } from "./middleware/auth.js";
import { clientAuthMiddleware } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/rate-limit.js";

// Admin Routes
import adminAuthRoutes from "./routes/admin/auth.js";
import adminProspectsRoutes from "./routes/admin/prospects.js";
import adminClientsRoutes from "./routes/admin/clients.js";
import adminAgentsRoutes from "./routes/admin/agents.js";
import adminMetricsRoutes from "./routes/admin/metrics.js";

// Portal Routes
import portalAuthRoutes from "./routes/portal/auth.js";
import portalDashboardRoutes from "./routes/portal/dashboard.js";
import portalWebsiteRoutes from "./routes/portal/website.js";
import portalChatbotRoutes from "./routes/portal/chatbot.js";
import portalBillingRoutes from "./routes/portal/billing.js";
import portalReportsRoutes from "./routes/portal/reports.js";
import portalEditorRoutes from "./routes/portal/editor.js";

// Public Routes
import webhookRoutes from "./routes/public/webhook.js";
import chatbotWidgetRoutes from "./routes/public/chatbot-widget.js";
import unsubscribeRoutes from "./routes/public/unsubscribe.js";
import trackRoutes from "./routes/public/track.js";

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

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "1.0.0",
  });
});

// ─── Public Routes (no auth) ──────────────────────────────────────────────────

app.route("/public/webhook", webhookRoutes);
app.route("/public/chatbot", chatbotWidgetRoutes);
app.route("/public/unsubscribe", unsubscribeRoutes);
app.route("/track", trackRoutes);

// ─── Admin Auth Routes (rate limited) ────────────────────────────────────────

app.use("/admin/auth/*", rateLimiter("AUTH"));
app.route("/admin/auth", adminAuthRoutes);

// ─── Admin Protected Routes ───────────────────────────────────────────────────

app.use("/admin/*", rateLimiter("API_GENERAL"));
app.use("/admin/prospects/*", adminAuthMiddleware);
app.use("/admin/clients/*", adminAuthMiddleware);
app.use("/admin/agents/*", adminAuthMiddleware);
app.use("/admin/metrics/*", adminAuthMiddleware);

app.route("/admin/prospects", adminProspectsRoutes);
app.route("/admin/clients", adminClientsRoutes);
app.route("/admin/agents", adminAgentsRoutes);
app.route("/admin/metrics", adminMetricsRoutes);

// ─── Portal Auth Routes (rate limited) ───────────────────────────────────────

app.use("/portal/auth/*", rateLimiter("AUTH"));
app.route("/portal/auth", portalAuthRoutes);

// ─── Portal Protected Routes ──────────────────────────────────────────────────

app.use("/portal/*", rateLimiter("API_GENERAL"));
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

// ─── Server Start ─────────────────────────────────────────────────────────────

// ─── Local dev server ─────────────────────────────────────────────────────────
if (process.env["NODE_ENV"] !== "production" || process.env["PORT"]) {
  const port = parseInt(process.env["PORT"] ?? "8000", 10);
  serve(
    { fetch: app.fetch, port },
    (info) => {
      console.log(`MadeCreative API running on http://localhost:${info.port}`);
    }
  );
}

// ─── Vercel serverless handler ────────────────────────────────────────────────
export default handle(app);
