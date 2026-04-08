// Vercel serverless entry point — diagnostic error capture
import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let app: Hono | null = null;
let initError: unknown = null;

import("../apps/api/src/app.js")
  .then((m) => { app = m.default; })
  .catch((err) => { initError = err; console.error("Lambda init error:", err); });

const fallback = new Hono();
fallback.all("*", (c) =>
  c.json({
    error: "Lambda init failed",
    message: String(initError),
    stack: initError instanceof Error ? initError.stack?.split("\n").slice(0, 8) : undefined,
  }, 500)
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app && !initError) {
    await new Promise((r) => setTimeout(r, 200));
  }
  return handle(app ?? fallback)(req, res);
}
