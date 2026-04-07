import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import {
  PlanUpgradeSchema,
  PLANS,
  PAGINATION,
} from "@madecreative/shared";
import {
  createCheckoutSession,
  createBillingPortalSession,
} from "../../lib/stripe.js";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/billing/invoices
app.get("/invoices", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const query = c.req.query();
  const page = Math.max(1, parseInt(query["page"] ?? "1", 10));
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    parseInt(query["limit"] ?? "20", 10)
  );
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.clientInvoice.findMany({
      where: { clientId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientInvoice.count({ where: { clientId } }),
  ]);

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /portal/billing/plan
app.get("/plan", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      plan: true,
      status: true,
      monthlyAmount: true,
      setupFeePaid: true,
      stripeCustomerId: true,
      _count: {
        select: {
          websites: true,
          automations: true,
          chatbots: true,
        },
      },
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const planConfig = PLANS[client.plan];

  return c.json({
    success: true,
    data: {
      currentPlan: client.plan,
      status: client.status,
      monthlyAmount: client.monthlyAmount,
      setupFeePaid: client.setupFeePaid,
      limits: planConfig?.limits,
      usage: client._count,
      availablePlans: Object.values(PLANS).map((p) => ({
        id: p.id,
        name: p.name,
        monthlyAmount: p.monthlyAmount,
        limits: p.limits,
        isCurrent: p.id === client.plan,
      })),
    },
  });
});

// POST /portal/billing/upgrade
app.post("/upgrade", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const parsed = PlanUpgradeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { email: true, plan: true, stripeCustomerId: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  if (client.plan === parsed.data.plan) {
    return c.json(
      { success: false, error: "You are already on this plan" },
      409
    );
  }

  const portalUrl = process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";

  // If already a Stripe customer, use billing portal
  if (client.stripeCustomerId) {
    const session = await createBillingPortalSession({
      stripeCustomerId: client.stripeCustomerId,
      returnUrl: `${portalUrl}/billing`,
    });
    return c.json({ success: true, data: { url: session.url } });
  }

  // Otherwise create a new checkout session
  const session = await createCheckoutSession({
    email: client.email,
    planId: parsed.data.plan,
    successUrl: `${portalUrl}/billing?upgraded=true`,
    cancelUrl: `${portalUrl}/billing`,
  });

  return c.json({ success: true, data: { url: session.url } });
});

// POST /portal/billing/portal
app.post("/portal", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { stripeCustomerId: true },
  });

  if (!client?.stripeCustomerId) {
    return c.json(
      { success: false, error: "No billing account found" },
      404
    );
  }

  const portalUrl = process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";

  const session = await createBillingPortalSession({
    stripeCustomerId: client.stripeCustomerId,
    returnUrl: `${portalUrl}/billing`,
  });

  return c.json({ success: true, data: { url: session.url } });
});

export default app;
