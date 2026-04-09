// Vercel serverless entry point
import type { IncomingMessage, ServerResponse } from "node:http";

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

let _handler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (_handler) return _handler;
  const { handle } = await import("@hono/node-server/vercel");
  const { default: app } = await import("../apps/api/src/app.js");
  _handler = handle(app);
  return _handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  return h(req, res);
}
