/**
 * launch-check.ts
 * Pre-launch verification script. Run with: npx tsx scripts/launch-check.ts
 * Checks all critical systems before going live.
 */

import "dotenv/config";

// Run as: npx tsx --tsconfig tsconfig.json scripts/launch-check.ts

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail";
  message: string;
}

async function main() {

const results: CheckResult[] = [];

function ok(name: string, message: string) {
  results.push({ name, status: "ok", message });
}
function warn(name: string, message: string) {
  results.push({ name, status: "warn", message });
}
function fail(name: string, message: string) {
  results.push({ name, status: "fail", message });
}

// ─── 1. ENV VARS ──────────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "DATABASE_URL",
  "REDIS_URL",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "RESEND_API_KEY",
  "JWT_SECRET",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_ACCESS_KEY",
  "CLOUDFLARE_R2_SECRET_KEY",
  "CLOUDFLARE_R2_ENDPOINT",
  "BRIGHTDATA_API_KEY",
  "API_URL",
  "MARKETING_URL",
  "PORTAL_URL",
  "ADMIN_URL",
];

for (const v of REQUIRED_VARS) {
  if (!process.env[v] || process.env[v]!.includes("...")) {
    fail("ENV", `Missing or placeholder: ${v}`);
  } else {
    ok("ENV", `${v} ✓`);
  }
}

// Optional
const OPTIONAL_VARS = ["META_PAGE_ACCESS_TOKEN", "GOOGLE_MAPS_API_KEY", "SENTRY_DSN"];
for (const v of OPTIONAL_VARS) {
  if (!process.env[v] || process.env[v] === "...") {
    warn("ENV", `Optional missing: ${v}`);
  }
}

// ─── 2. DATABASE ──────────────────────────────────────────────────────────────

try {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const [admins, scrapeConfigs, clients] = await Promise.all([
    prisma.adminUser.count(),
    prisma.scrapeConfig.count({ where: { isActive: true } }),
    prisma.client.count(),
  ]);

  if (admins === 0) fail("DB", "No admin users found — run seed script");
  else ok("DB", `Admin users: ${admins}`);

  if (scrapeConfigs === 0) warn("DB", "No active ScrapeConfig — first batch won't start");
  else ok("DB", `Active ScrapeConfigs: ${scrapeConfigs}`);

  ok("DB", `Total clients: ${clients}`);
  await prisma.$disconnect();
} catch (e) {
  fail("DB", `Connection failed: ${(e as Error).message}`);
}

// ─── 3. REDIS ─────────────────────────────────────────────────────────────────

try {
  const { Redis: IORedis } = await import("ioredis");
  const redis = new IORedis(process.env["REDIS_URL"]!, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
  });
  await redis.ping();
  ok("REDIS", "Connection OK");

  const warmDay = await redis.get("outreach:warming:day");
  ok("REDIS", `Email warming day: ${warmDay ?? "0 (start)"}`);

  await redis.quit();
} catch (e) {
  fail("REDIS", `Connection failed: ${(e as Error).message}`);
}

// ─── 4. API HEALTH ────────────────────────────────────────────────────────────

const apiUrl = process.env["API_URL"] ?? "https://api.madecreative.pro";
try {
  const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
  if (res.ok) {
    const data = await res.json() as { status: string };
    ok("API", `${apiUrl} → ${data.status}`);
  } else {
    fail("API", `Health check returned ${res.status}`);
  }
} catch {
  warn("API", `${apiUrl} unreachable (may not be deployed yet)`);
}

// ─── 5. STRIPE ────────────────────────────────────────────────────────────────

try {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!, {
    apiVersion: "2024-12-18.acacia",
  });

  const price = await stripe.prices.retrieve(process.env["STRIPE_PRICE_ID"]!);
  ok("STRIPE", `Price: €${(price.unit_amount ?? 0) / 100}/mese — ${price.active ? "active" : "INACTIVE"}`);

  const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
  const ourWebhook = webhooks.data.find((w) => w.url.includes("madecreative.pro"));
  if (ourWebhook) ok("STRIPE", `Webhook: ${ourWebhook.url} — ${ourWebhook.status}`);
  else warn("STRIPE", "No webhook configured for madecreative.pro");
} catch (e) {
  fail("STRIPE", `Error: ${(e as Error).message}`);
}

// ─── 6. RESEND ────────────────────────────────────────────────────────────────

try {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "check@madecreative.pro",
      to: ["test@example.com"],
      subject: "Launch check",
      html: "<p>test</p>",
    }),
  });
  // 422 = validation error but API key works; 401 = bad key
  if (res.status === 401) fail("RESEND", "Invalid API key");
  else ok("RESEND", `API key valid (status ${res.status})`);
} catch (e) {
  fail("RESEND", `Error: ${(e as Error).message}`);
}

// ─── 7. DNS CHECK ─────────────────────────────────────────────────────────────

const domains = [
  { domain: "madecreative.pro", type: "A", expected: "76.76.21.21" },
  { domain: "api.madecreative.pro", type: "CNAME" },
  { domain: "app.madecreative.pro", type: "CNAME" },
  { domain: "admin.madecreative.pro", type: "CNAME" },
];

for (const { domain, type, expected } of domains) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
    const data = await res.json() as { Answer?: Array<{ data: string }> };
    const record = data.Answer?.[0]?.data;
    if (!record) {
      fail("DNS", `${domain}: No ${type} record`);
    } else if (expected && !record.includes(expected)) {
      fail("DNS", `${domain}: Expected ${expected}, got ${record}`);
    } else {
      ok("DNS", `${domain} → ${record}`);
    }
  } catch {
    fail("DNS", `${domain}: lookup failed`);
  }
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

console.log("\n" + "═".repeat(60));
console.log("  MADECREATIVE LAUNCH CHECK");
console.log("═".repeat(60) + "\n");

const okCount = results.filter((r) => r.status === "ok").length;
const warnCount = results.filter((r) => r.status === "warn").length;
const failCount = results.filter((r) => r.status === "fail").length;

for (const r of results) {
  const icon = r.status === "ok" ? "✅" : r.status === "warn" ? "⚠️ " : "❌";
  if (r.status !== "ok") {
    console.log(`${icon}  [${r.name}] ${r.message}`);
  }
}

console.log("\n" + "─".repeat(60));
console.log(`✅ OK: ${okCount}  ⚠️  WARN: ${warnCount}  ❌ FAIL: ${failCount}`);

if (failCount === 0) {
  console.log("\n🚀 READY TO LAUNCH — all critical checks passed!");
} else {
  console.log("\n⛔ NOT READY — fix failures before launching");
  process.exit(1);
}

} // end main

main().catch((e) => { console.error(e); process.exit(1); });
