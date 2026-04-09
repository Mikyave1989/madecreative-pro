// Vercel serverless entry point — ESM (apps/api uses "type":"module")
import type { IncomingMessage, ServerResponse } from "node:http";

let _handler: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | null = null;
let _initError: Error | null = null;

// Lazy-load to capture any import/init errors
async function ensureHandler() {
  if (_handler) return _handler;
  if (_initError) throw _initError;
  try {
    const { handle } = await import("@hono/node-server/vercel");
    const { default: app } = await import("../apps/api/src/app.js");
    _handler = handle(app);
    return _handler;
  } catch (err) {
    _initError = err as Error;
    throw err;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const h = await ensureHandler();
    return h(req, res);
  } catch (err: unknown) {
    const e = err as Error;
    console.error("INIT_ERROR", e.message, e.stack);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "init_failed",
      message: e.message,
      code: (e as NodeJS.ErrnoException).code,
    }));
  }
}
