import { Hono } from "hono";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── POST /portal/settings/domain — add custom domain ────────────────────────

app.post("/domain", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const domain = (body?.domain as string)?.trim().toLowerCase();

  if (!domain || !domain.includes(".")) {
    return c.json({ success: false, error: "Invalid domain" }, 400);
  }

  // Clean domain: remove protocol, trailing slash
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const website = await prisma.clientWebsite.findUnique({ where: { clientId } });
  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  // Try to add domain via Vercel API
  const vercelToken = process.env["VERCEL_TOKEN"];

  let dnsRecords = [
    { type: "CNAME", name: cleanDomain.startsWith("www.") ? "www" : cleanDomain, value: "cname.vercel-dns.com" },
    { type: "A", name: "@", value: "76.76.21.21" },
  ];

  if (vercelToken) {
    try {
      // Add domain to Vercel project
      const res = await fetch(`https://api.vercel.com/v10/projects/${process.env["VERCEL_PROJECT_ID"] ?? "madecreative-preview"}/domains`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: cleanDomain }),
      });

      const result = await res.json() as { name?: string; error?: { code: string; message: string }; verification?: Array<{ type: string; domain: string; value: string }> };

      if (result.verification) {
        dnsRecords = result.verification.map((v) => ({
          type: v.type,
          name: v.domain,
          value: v.value,
        }));
      }
    } catch {
      // Use default DNS records
    }
  }

  // Save domain to website
  await prisma.clientWebsite.update({
    where: { id: website.id },
    data: { domain: cleanDomain },
  });

  return c.json({
    success: true,
    data: {
      domain: cleanDomain,
      verified: false,
      dnsRecords,
    },
  });
});

// ─── GET /portal/settings/domain — check domain status ──────────────────────

app.get("/domain", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const website = await prisma.clientWebsite.findUnique({
    where: { clientId },
    select: { domain: true },
  });

  if (!website?.domain) {
    return c.json({ success: true, data: { domain: null, verified: false, dnsRecords: [] } });
  }

  // Check verification via Vercel API
  let verified = false;
  const vercelToken = process.env["VERCEL_TOKEN"];
  if (vercelToken) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v9/projects/${process.env["VERCEL_PROJECT_ID"] ?? "madecreative-preview"}/domains/${website.domain}`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      );
      const data = await res.json() as { verified?: boolean };
      verified = data.verified === true;
    } catch {
      // Assume not verified
    }
  }

  return c.json({
    success: true,
    data: {
      domain: website.domain,
      verified,
      dnsRecords: [
        { type: "CNAME", name: website.domain.startsWith("www.") ? "www" : website.domain, value: "cname.vercel-dns.com" },
        { type: "A", name: "@", value: "76.76.21.21" },
      ],
    },
  });
});

// ─── POST /portal/settings/connectors — save a connector config ──────────────

app.post("/connectors", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const key = body?.key as string;
  const value = body?.value as string;

  if (!key || !value) {
    return c.json({ success: false, error: "Key and value required" }, 400);
  }

  // Whitelist allowed keys
  const ALLOWED_KEYS = [
    "googleAnalyticsId",
    "googleMapsApiKey",
    "metaPixelId",
    "customEmailFrom",
    "livechatWidgetId",
    "customSslCert",
  ];

  if (!ALLOWED_KEYS.includes(key)) {
    return c.json({ success: false, error: "Invalid connector key" }, 400);
  }

  const website = await prisma.clientWebsite.findUnique({ where: { clientId } });
  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  // Save in designTokens JSON
  const tokens = (website.designTokens as Record<string, unknown>) ?? {};
  tokens[key] = value;

  await prisma.clientWebsite.update({
    where: { id: website.id },
    data: { designTokens: tokens as object },
  });

  return c.json({ success: true, data: { key, saved: true } });
});

// ─── GET /portal/settings/connectors — get all connectors ────────────────────

app.get("/connectors", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const website = await prisma.clientWebsite.findUnique({
    where: { clientId },
    select: { designTokens: true },
  });

  const tokens = (website?.designTokens as Record<string, unknown>) ?? {};
  const connectors: Record<string, boolean> = {};

  for (const key of ["googleAnalyticsId", "googleMapsApiKey", "metaPixelId", "customEmailFrom", "livechatWidgetId"]) {
    connectors[key] = Boolean(tokens[key]);
  }

  return c.json({ success: true, data: connectors });
});

export default app;
