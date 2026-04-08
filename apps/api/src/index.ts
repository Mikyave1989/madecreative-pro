import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import app from "./app.js";
// build: 2026-04-08

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


