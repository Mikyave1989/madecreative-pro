// Vercel serverless entry point — uses @vercel/node (builds config)
// This ensures req.rawBody is available for POST body parsing
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

let _handler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (_handler) return _handler;
  const { handle } = await import("@hono/node-server/vercel");
  const { default: app } = await import("../apps/api/src/app.js");
  _handler = handle(app) as Handler;
  return _handler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const h = await getHandler();
  return h(req, res);
}
