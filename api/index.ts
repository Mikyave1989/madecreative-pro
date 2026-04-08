// Vercel serverless entry point for the MadeCreative API.
// @vercel/node (esbuild/nft) bundles this file + all imports into a single Lambda.
let appHandler: ((req: Request) => Promise<Response>) | null = null;
let initError: Error | null = null;

try {
  const { handle } = require("@hono/node-server/vercel");
  const { default: app } = require("../apps/api/src/app.js");
  const handler = handle(app);
  appHandler = handler;
} catch (err) {
  initError = err instanceof Error ? err : new Error(String(err));
  console.error("[INIT ERROR]", initError.message, initError.stack);
}

export default function handler(req: Request): Promise<Response> {
  if (initError) {
    const body = JSON.stringify({
      error: "Lambda init failed",
      message: initError.message,
      stack: initError.stack?.split("\n").slice(0, 5),
    });
    return Promise.resolve(new Response(body, { status: 500, headers: { "content-type": "application/json" } }));
  }
  return appHandler!(req);
}
