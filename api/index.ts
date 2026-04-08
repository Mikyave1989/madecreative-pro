// Diagnostic: synchronous import to capture init error
import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Try to import the full app — if it throws, we capture the error
let app: Hono;
let initError: unknown = null;

import("../apps/api/src/app.js")
  .then((m) => { app = m.default; })
  .catch((err) => { initError = err; });

const fallback = new Hono();
fallback.all("*", (c) =>
  c.json(
    {
      error: "Lambda init failed",
      message: String(initError),
      stack: initError instanceof Error ? initError.stack?.split("\n").slice(0, 5) : undefined,
    },
    500
  )
);

// Wait for dynamic import on first request
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    // Give the async import a moment to settle
    await new Promise((r) => setTimeout(r, 100));
  }
  const honoHandler = handle(app ?? fallback);
  return honoHandler(req, res);
}
