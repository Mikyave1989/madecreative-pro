import { Hono } from "hono";
import { generateTokens } from "../../lib/auth.js";
import { getStripeClient } from "../../lib/stripe.js";

const app = new Hono();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientPayload(client: {
  id: string;
  email: string;
  companyName: string;
  contactName: string | null;
  plan: string;
  status: string;
  language: string;
}) {
  return {
    id: client.id,
    email: client.email,
    companyName: client.companyName,
    contactName: client.contactName,
    plan: client.plan,
    status: client.status,
    language: client.language,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── POST /checkout — Create Stripe Checkout Session for paid plans ──────────

app.post("/checkout", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { plan, billing, email, companyName, websiteUrl, locale } = body as {
    plan?: string;
    billing?: string;
    email?: string;
    companyName?: string;
    websiteUrl?: string;
    locale?: string;
  };

  const validPlans = ["STARTER", "GROWTH", "PRO"] as const;
  const validBillings = ["monthly", "annual"] as const;

  if (!plan || !validPlans.includes(plan as (typeof validPlans)[number])) {
    return c.json(
      { success: false, error: "Plan must be STARTER, GROWTH, or PRO" },
      400
    );
  }

  if (
    !billing ||
    !validBillings.includes(billing as (typeof validBillings)[number])
  ) {
    return c.json(
      { success: false, error: "Billing must be monthly or annual" },
      400
    );
  }

  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ success: false, error: "A valid email is required" }, 400);
  }

  // Look up the Stripe price ID from environment
  const envKey = `STRIPE_PRICE_${plan}_${billing.toUpperCase()}`;
  const priceId = process.env[envKey];

  if (!priceId) {
    return c.json(
      { success: false, error: `Price not configured for ${plan} ${billing}` },
      400
    );
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: email.toLowerCase(),
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      plan,
      websiteUrl: websiteUrl ?? "",
      companyName: companyName ?? "",
      locale: locale ?? "de",
    },
    subscription_data: { metadata: { plan } },
    success_url: `${process.env["PORTAL_URL"] ?? "https://app.madecreative.pro"}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env["MARKETING_URL"] ?? "https://madecreative.pro"}/${locale ?? "de"}#pricing`,
    allow_promotion_codes: true,
  });

  return c.json({
    success: true,
    data: { checkoutUrl: session.url },
  });
});

// ─── POST /verify-session — Verify Stripe session & auto-login ──────────────

app.post("/verify-session", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { sessionId } = body as { sessionId?: string };

  if (!sessionId) {
    return c.json({ success: false, error: "sessionId is required" }, 400);
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return c.json(
      { success: false, error: "Payment not completed" },
      402
    );
  }

  const email = session.customer_email?.toLowerCase();
  if (!email) {
    return c.json(
      { success: false, error: "No email found on checkout session" },
      400
    );
  }

  // Retry up to 5 times — the webhook may not have created the client yet
  let client: Awaited<ReturnType<typeof prisma.client.findUnique>> = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    client = await prisma.client.findUnique({ where: { email } });
    if (client) break;
    await sleep(2000);
  }

  if (!client) {
    return c.json(
      { success: false, error: "Account not found. Please try again shortly." },
      404
    );
  }

  const tokens = await generateTokens({
    sub: client.id,
    email: client.email,
    role: "STANDARD",
    type: "client",
  });

  return c.json({
    success: true,
    data: {
      ...tokens,
      user: clientPayload(client),
    },
  });
});

// ─── POST /analyze-url — Quick website analysis (public, no auth) ────────────

app.post("/analyze-url", async (c) => {
  const body = await c.req.json().catch(() => null);
  const url = (body?.url as string)?.trim();

  if (!url) {
    return c.json({ success: false, error: "URL is required" }, 400);
  }

  // Normalize URL
  let targetUrl = url;
  if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;

  try {
    // Quick fetch to get basic page info
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "MadeCreative-Analyzer/1.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Extract basic info
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)/i);
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);

    // Check for common issues
    const issues: string[] = [];
    const hasViewport = /meta[^>]*name=["']viewport/i.test(html);
    const hasHttps = targetUrl.startsWith("https");
    const hasH1 = !!h1Match;
    const hasMeta = !!descMatch;
    const hasOgImage = !!ogImageMatch;
    const htmlSize = html.length;
    const isWordPress = /wp-content|wordpress/i.test(html);
    const isWix = /wix\.com|wixstatic/i.test(html);
    const isSquarespace = /squarespace/i.test(html);

    if (!hasViewport) issues.push("Non ottimizzato per mobile");
    if (!hasHttps) issues.push("Manca HTTPS (sicurezza)");
    if (!hasMeta) issues.push("Manca meta description (SEO)");
    if (!hasOgImage) issues.push("Manca Open Graph image (social)");
    if (htmlSize > 500000) issues.push("Pagina troppo pesante (lenta)");
    if (!hasH1) issues.push("Manca H1 (struttura SEO)");

    // Score 0-100
    let score = 100;
    if (!hasViewport) score -= 20;
    if (!hasHttps) score -= 15;
    if (!hasMeta) score -= 15;
    if (!hasOgImage) score -= 10;
    if (!hasH1) score -= 10;
    if (htmlSize > 500000) score -= 15;
    if (isWordPress) score -= 5;

    const platform = isWordPress ? "WordPress" : isWix ? "Wix" : isSquarespace ? "Squarespace" : "Custom";

    return c.json({
      success: true,
      data: {
        url: targetUrl,
        title: titleMatch?.[1]?.trim() || null,
        description: descMatch?.[1]?.trim() || null,
        ogImage: ogImageMatch?.[1]?.trim() || null,
        h1: h1Match?.[1]?.trim() || null,
        platform,
        score: Math.max(0, score),
        issues,
        mobile: hasViewport,
        https: hasHttps,
        seo: hasMeta,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Impossibile analizzare il sito";
    return c.json({
      success: true,
      data: {
        url: targetUrl,
        title: null,
        description: null,
        ogImage: null,
        h1: null,
        platform: "Sconosciuto",
        score: 0,
        issues: ["Sito non raggiungibile o troppo lento"],
        mobile: false,
        https: false,
        seo: false,
        error: msg,
      },
    });
  }
});

export default app;
