// Vercel serverless entry point — ESM (apps/api uses "type":"module")
import { handle } from "@hono/node-server/vercel";

let _handler: ReturnType<typeof handle> | null = null;
let _initError: { message: string; stack?: string } | null = null;

async function loadApp() {
  if (_handler || _initError) return;
  try {
    const { default: app } = await import("../apps/api/src/app.js");
    _handler = handle(app);
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    _initError = { message: e.message, stack: e.stack };
    console.error("[VERCEL INIT ERROR]", e.message, e.stack);
  }
}

export default async function handler(req: Request): Promise<Response> {
  await loadApp();
  if (_initError) {
    return new Response(
      JSON.stringify({ error: "Lambda init failed", message: _initError.message, stack: _initError.stack?.split("\n").slice(0, 8) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  return _handler!(req);
}
