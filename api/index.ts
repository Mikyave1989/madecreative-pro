// Vercel serverless entry point — error capture build
import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";

let app: Hono;
let initError: unknown = null;

try {
  const { default: importedApp } = await import("../apps/api/src/app.js");
  app = importedApp;
} catch (err) {
  initError = err;
  app = new Hono();
  app.all("*", (c) =>
    c.json(
      {
        error: "Lambda init failed",
        message: String(initError),
        stack: initError instanceof Error ? initError.stack : undefined,
      },
      500
    )
  );
}

export default handle(app!);
