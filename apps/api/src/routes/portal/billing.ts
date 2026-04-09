import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { PAGINATION, PLAN_PRICE, REFUND_POLICY } from "@madecreative/shared";
import { createBillingPortalSession } from "../../lib/stripe.js";
import Stripe from "stripe";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

function getStripe(): Stripe {
  return new Stripe(process.env["STRIPE_SECRET_KEY"]!, {
    apiVersion: "2025-02-24.acacia",
  });
}

// GET /portal/billing — summary
app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      status: true,
      stripeCustomerId: true,
      stripeSubId: true,
      createdAt: true,
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  // Determine refund eligibility: within 14 days of account creation
  const daysSinceCreation = Math.floor(
    (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isEligibleForRefund =
    client.status === "ACTIVE" && daysSinceCreation <= REFUND_POLICY.DAYS;

  // Map internal status to portal status
  const portalStatus: "ACTIVE" | "AT_RISK" | "PAUSED" =
    client.status === "ACTIVE" ? "ACTIVE"
    : client.status === "AT_RISK" ? "AT_RISK"
    : "PAUSED";

  let nextChargeDate: string | null = null;
  let paymentMethod: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null = null;

  if (client.stripeSubId || client.stripeCustomerId) {
    const stripe = getStripe();

    // Fetch next billing date from subscription
    if (client.stripeSubId) {
      try {
        const sub = await stripe.subscriptions.retrieve(client.stripeSubId);
        nextChargeDate = new Date(sub.current_period_end * 1000).toISOString();
      } catch {
        // Ignore
      }
    }

    // Fetch default payment method
    if (client.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(client.stripeCustomerId);
        if (!("deleted" in customer) && customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method as string
          );
          if (pm.card) {
            paymentMethod = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year,
            };
          }
        }
      } catch {
        // Non-critical — just show "no payment method"
      }
    }
  }

  return c.json({
    success: true,
    data: {
      plan: "Standard",
      nextChargeAmount: PLAN_PRICE,
      status: portalStatus,
      nextChargeDate,
      clientSince: client.createdAt.toISOString(),
      isEligibleForRefund,
      daysSinceCreation,
      refundDeadlineDays: REFUND_POLICY.DAYS,
      paymentMethod,
    },
  });
});

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

  const [raw, total] = await Promise.all([
    prisma.clientInvoice.findMany({
      where: { clientId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientInvoice.count({ where: { clientId } }),
  ]);

  const data = raw.map((inv) => ({
    id: inv.id,
    date: (inv.paidAt ?? inv.createdAt).toISOString(),
    description: "Piano Standard — MadeCreative",
    amount: inv.amount,
    status: inv.status as "PAID" | "PENDING" | "FAILED" | "REFUNDED",
    pdfUrl: null,
  }));

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

// POST /portal/billing/portal — Stripe Customer Portal
app.post("/portal", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { stripeCustomerId: true },
  });

  if (!client?.stripeCustomerId) {
    return c.json({ success: false, error: "No billing account found" }, 404);
  }

  const portalUrl = process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";

  const session = await createBillingPortalSession({
    stripeCustomerId: client.stripeCustomerId,
    returnUrl: `${portalUrl}/billing`,
  });

  return c.json({ success: true, data: { url: session.url } });
});

// POST /portal/billing/cancel — cancel subscription
app.post("/cancel", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { stripeSubId: true, status: true },
  });

  if (!client || client.status !== "ACTIVE") {
    return c.json({ success: false, error: "No active subscription" }, 400);
  }

  if (!client.stripeSubId) {
    return c.json({ success: false, error: "No subscription found" }, 404);
  }

  const stripe = getStripe();

  // Cancel at period end (site stays live until end of billing period)
  await stripe.subscriptions.update(client.stripeSubId, {
    cancel_at_period_end: true,
  });

  return c.json({
    success: true,
    data: {
      message: "Abbonamento cancellato — il sito resterà online fino alla fine del periodo.",
    },
  });
});

// POST /portal/billing/refund — automatic 14-day refund
app.post("/refund", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      status: true,
      stripeSubId: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  if (client.status !== "ACTIVE") {
    return c.json({ success: false, error: "Account not active" }, 400);
  }

  // Check 14-day eligibility
  const daysSinceCreation = Math.floor(
    (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation > REFUND_POLICY.DAYS) {
    return c.json(
      {
        success: false,
        error: `Refund window expired (${REFUND_POLICY.DAYS} days). Account created ${daysSinceCreation} days ago.`,
      },
      400
    );
  }

  const stripe = getStripe();

  // Cancel subscription immediately
  if (client.stripeSubId) {
    await stripe.subscriptions.cancel(client.stripeSubId);
  }

  // Find and refund the most recent paid invoice
  if (client.stripeCustomerId) {
    const charges = await stripe.charges.list({
      customer: client.stripeCustomerId,
      limit: 1,
    });

    if (charges.data.length > 0 && charges.data[0]?.status === "succeeded") {
      const charge = charges.data[0];
      await stripe.refunds.create({ charge: charge.id });
    }
  }

  // Update client status
  await prisma.client.update({
    where: { id: clientId },
    data: { status: "REFUNDED" },
  });

  return c.json({
    success: true,
    data: {
      message: "Rimborso processato automaticamente. Riceverai €197 entro 5-10 giorni lavorativi.",
      refunded: true,
    },
  });
});

export default app;
