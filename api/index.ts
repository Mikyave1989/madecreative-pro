// Vercel serverless entry point
// Manually converts IncomingMessage → Web API Request to fix POST body parsing
import type { IncomingMessage, ServerResponse } from "node:http";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _app: any = null;

async function getApp() {
  if (_app) return _app;
  const { default: app } = await import("../apps/api/src/app.js");
  _app = app;
  return _app;
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    const app = await getApp();

    // Build URL
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "api.madecreative.pro";
    const url = `${proto}://${host}${req.url}`;

    // Build headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    // Build body — use req.body (pre-parsed by Vercel) or rawBody
    let body: string | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (typeof req.body === "object" && req.body !== null) {
        body = JSON.stringify(req.body);
        headers.set("content-type", "application/json");
      } else if (typeof req.body === "string") {
        body = req.body;
      } else {
        const raw = (req as unknown as Record<string, unknown>).rawBody;
        if (typeof raw === "string") {
          body = raw;
        } else if (raw) {
          body = String(raw);
        }
      }
    }

    // Create Web API Request
    const request = new Request(url, {
      method: req.method || "GET",
      headers,
      body,
    });

    // Call Hono
    const response = await app.fetch(request);

    // Write response
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
        return pump();
      };
      await pump();
    } else {
      const text = await response.text();
      res.end(text);
    }
  } catch (err) {
    console.error("Handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}
