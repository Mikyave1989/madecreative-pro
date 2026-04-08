// Vercel serverless entry point for the MadeCreative API.
// Diagnostic: minimal Hono app without workspace deps to isolate Lambda crash.
import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

export default handle(app);
