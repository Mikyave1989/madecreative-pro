import Stripe from "stripe";
import { prisma } from "@madecreative/db";
import { PLANS } from "@madecreative/shared";

export function getStripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function createCheckoutSession(params: {
  email: string;
  planId: "STARTER" | "GROWTH" | "ENTERPRISE";
  prospectId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const plan = PLANS[params.planId];
  if (!plan) throw new Error(`Invalid plan: ${params.planId}`);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: params.email,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        planId: params.planId,
        ...(params.prospectId ? { prospectId: params.prospectId } : {}),
      },
    },
    metadata: {
      planId: params.planId,
      ...(params.prospectId ? { prospectId: params.prospectId } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient();
  return stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });
}

export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<{ received: boolean; event?: Stripe.Event }> {
  const stripe = getStripeClient();
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Webhook signature verification failed: ${msg}`);
  }

  await processStripeEvent(event);
  return { received: true, event };
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      // Unhandled event type
      break;
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const planId = session.metadata?.["planId"] as string | undefined;
  const prospectId = session.metadata?.["prospectId"] as string | undefined;

  if (!planId || !session.customer_email || !session.customer) return;

  const plan = PLANS[planId];
  if (!plan) return;

  // Check if client already exists
  const existingClient = await prisma.client.findUnique({
    where: { email: session.customer_email },
  });

  if (existingClient) {
    await prisma.client.update({
      where: { id: existingClient.id },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubId: session.subscription as string,
        plan: planId,
        monthlyAmount: plan.monthlyAmount,
        status: "ONBOARDING",
      },
    });
    return;
  }

  // Fetch prospect data if available
  let prospectData: {
    companyName: string;
    contactName?: string | null;
    country: string;
    city?: string | null;
    sector: string;
    language?: string;
  } | null = null;

  if (prospectId) {
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });
    if (prospect) {
      prospectData = {
        companyName: prospect.companyName,
        contactName: prospect.contactName,
        country: prospect.country,
        city: prospect.city,
        sector: prospect.sector,
      };
    }
  }

  // Create new client with temporary password hash
  const { default: bcrypt } = await import("bcryptjs");
  const tempPassword = Math.random().toString(36).slice(2, 10);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const client = await prisma.client.create({
    data: {
      email: session.customer_email,
      companyName: prospectData?.companyName ?? session.customer_email.split("@")[0] ?? "Business",
      contactName: prospectData?.contactName ?? "Contact",
      passwordHash,
      country: prospectData?.country ?? "DE",
      city: prospectData?.city ?? null,
      sector: prospectData?.sector ?? "professional",
      language: prospectData?.language ?? "de",
      plan: planId,
      monthlyAmount: plan.monthlyAmount,
      stripeCustomerId: session.customer as string,
      stripeSubId: session.subscription as string,
      status: "ONBOARDING",
    },
  });

  // Link prospect to client if exists
  if (prospectId) {
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        clientId: client.id,
        status: "CONVERTED",
        convertedAt: new Date(),
      },
    });
  }

  // Record invoice
  await prisma.clientInvoice.create({
    data: {
      clientId: client.id,
      amount: plan.setupFee,
      type: "SETUP_FEE",
      status: "PAID",
      paidAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.customer) return;

  const client = await prisma.client.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!client) return;

  await prisma.clientInvoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      clientId: client.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      type: "MONTHLY",
      status: "PAID",
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    },
    update: {
      status: "PAID",
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.customer) return;

  const client = await prisma.client.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!client) return;

  const attemptCount = invoice.attempt_count ?? 0;

  await prisma.clientInvoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      clientId: client.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      type: "MONTHLY",
      status: "FAILED",
    },
    update: {
      status: "FAILED",
    },
  });

  // After 3 failed attempts, suspend client
  if (attemptCount >= 3) {
    await prisma.client.update({
      where: { id: client.id },
      data: { status: "SUSPENDED" },
    });
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { stripeSubId: subscription.id },
  });

  if (!client) return;

  const planId = subscription.metadata?.["planId"] as string | undefined;
  const plan = planId ? PLANS[planId] : null;

  await prisma.client.update({
    where: { id: client.id },
    data: {
      ...(plan
        ? { plan: planId, monthlyAmount: plan.monthlyAmount }
        : {}),
      status:
        subscription.status === "active"
          ? "ACTIVE"
          : subscription.status === "paused"
          ? "PAUSED"
          : client.status,
    },
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { stripeSubId: subscription.id },
  });

  if (!client) return;

  await prisma.client.update({
    where: { id: client.id },
    data: { status: "CHURNED" },
  });
}
