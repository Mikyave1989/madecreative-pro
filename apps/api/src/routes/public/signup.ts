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

export default app;
