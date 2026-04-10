// Vercel serverless entry point
// Manually converts VercelRequest → Web API Request to avoid body parsing issues
import type { VercelRequest, VercelResponse } from "@vercel/node";

let _app: { fetch: (req: Request) => Promise<Response> } | null = null;

async function getApp() {
  if (_app) return _app;
  const { default: app } = await import("../apps/api/src/app.js");
  _app = app;
  return _app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // Build body — use req.body (already parsed by Vercel) or rawBody
    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (typeof req.body === "object" && req.body !== null) {
        body = JSON.stringify(req.body);
        headers.set("content-type", "application/json");
      } else if (typeof req.body === "string") {
        body = req.body;
      } else if ((req as any).rawBody) {
        body = (req as any).rawBody;
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
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error("Handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
