import Stripe from "stripe";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export function getStripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function createCheckoutSession(params: {
  email: string;
  prospectId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const priceId = process.env["STRIPE_PRICE_ID"];
  if (!priceId) throw new Error("STRIPE_PRICE_ID is not set");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        ...(params.prospectId ? { prospectId: params.prospectId } : {}),
      },
    },
    metadata: {
      ...(params.prospectId ? { prospectId: params.prospectId } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

export async function generatePaymentLink(params: {
  prospectId: string;
  email: string;
}): Promise<{ checkoutUrl: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await createCheckoutSession({
    email: params.email,
    prospectId: params.prospectId,
    successUrl: `${process.env["PORTAL_URL"] ?? "https://madecreative.pro"}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env["MARKETING_URL"] ?? "https://madecreative.pro"}`,
  });

  return { checkoutUrl: session.url ?? "", expiresAt };
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
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      break;
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { prisma } = await import("@madecreative/db");
  const { PLANS } = await import("@madecreative/shared");
  const prospectId = session.metadata?.["prospectId"] as string | undefined;
  const plan = (session.metadata?.["plan"] as string) ?? "STARTER";
  const websiteUrl = (session.metadata?.["websiteUrl"] as string) || null;
  const companyNameMeta = (session.metadata?.["companyName"] as string) || null;
  const localeMeta = (session.metadata?.["locale"] as string) || null;

  if (!session.customer_email || !session.customer) return;

  const existingClient = await prisma.client.findUnique({
    where: { email: session.customer_email },
  });

  if (existingClient) {
    await prisma.client.update({
      where: { id: existingClient.id },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubId: session.subscription as string,
        status: "ACTIVE",
        plan,
      },
    });
    return;
  }

  let prospectData: {
    companyName: string;
    contactName?: string | null;
    country: string;
    city?: string | null;
    sector: string;
    language?: string;
  } | null = null;

  if (prospectId) {
    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
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

  const tempPassword = crypto.randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const client = await prisma.client.create({
    data: {
      email: session.customer_email,
      companyName: prospectData?.companyName ?? companyNameMeta ?? session.customer_email.split("@")[0] ?? "Business",
      contactName: prospectData?.contactName ?? "Contact",
      passwordHash,
      country: prospectData?.country ?? "DE",
      city: prospectData?.city ?? null,
      sector: prospectData?.sector ?? "professional",
      language: prospectData?.language ?? localeMeta ?? "de",
      plan,
      websiteUrl,
      stripeCustomerId: session.customer as string,
      stripeSubId: session.subscription as string,
      status: "ACTIVE",
    },
  });

  if (prospectId) {
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { clientId: client.id, status: "CONVERTED", convertedAt: new Date() },
    });
  }

  // Record first invoice
  const planPrice = PLANS[plan as keyof typeof PLANS]?.price ?? 25;
  await prisma.clientInvoice.create({
    data: {
      clientId: client.id,
      amount: planPrice,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Store temp password in Redis for onboarding
  try {
    const { getRedisConnection } = await import("../lib/queue.js");
    const redis = getRedisConnection();
    await redis.set(`onboarding:temp_password:${client.id}`, tempPassword, "EX", 86400);
  } catch {
    // Non-critical
  }

  // Auto-trigger website builder if client provided a website URL
  try {
    const { Queue } = await import("bullmq");
    const { getRedisConnection } = await import("../lib/queue.js");

    if (websiteUrl) {
      const builderQueue = new Queue("builder-queue", { connection: getRedisConnection() });
      await builderQueue.add(
        "BUILDER",
        {
          clientId: client.id,
          websiteUrl,
          templateSlug: prospectData?.sector ?? "professional",
          rebuild: false,
        },
        { jobId: `builder-${client.id}`, delay: 5000 }
      );
      await builderQueue.close();

      await prisma.agentJob.create({
        data: {
          agentType: "BUILDER",
          status: "QUEUED",
          input: { clientId: client.id, websiteUrl, templateSlug: prospectData?.sector ?? "professional" },
          clientId: client.id,
        },
      });
    }

    // Enqueue onboarding email job
    const onboardingQueue = new Queue("onboarding-queue", { connection: getRedisConnection() });
    await onboardingQueue.add(
      "ONBOARDING",
      { clientId: client.id, prospectId: prospectId ?? null, tempPassword },
      { jobId: `onboarding-${client.id}`, delay: 0 }
    );
    await onboardingQueue.close();
  } catch (err) {
    console.error("[Stripe] Failed to enqueue jobs:", err);
  }

  // Send payment confirmation email with credentials
  const portalUrl = process.env["PORTAL_URL"] ?? "https://madecreative.pro";
  try {
    const resendApiKey = process.env["RESEND_API_KEY"];
    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `MadeCreative <onboarding@${process.env["EMAIL_DOMAIN"] ?? "madecreative.pro"}>`,
          to: [client.email],
          subject: "Benvenuto in MadeCreative — ecco le tue credenziali",
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;color:#1e293b;max-width:520px;margin:0 auto;padding:24px">
<h2 style="color:#6366f1">Benvenuto in MadeCreative!</h2>
<p>Ciao ${client.contactName},</p>
<p>Il tuo account è pronto. ${websiteUrl ? "Stiamo già ricostruendo il tuo sito — riceverai il link appena sarà pronto." : ""}</p>
<p><strong>Le tue credenziali:</strong></p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px 16px;background:#f1f5f9;border-radius:6px 0 0 0"><strong>Email</strong></td><td style="padding:8px 16px;background:#f1f5f9;border-radius:0 6px 0 0">${client.email}</td></tr>
<tr><td style="padding:8px 16px;background:#f8fafc;border-radius:0 0 0 6px"><strong>Password</strong></td><td style="padding:8px 16px;background:#f8fafc;border-radius:0 0 6px 0"><code>${tempPassword}</code></td></tr>
</table>
<p><a href="${portalUrl}/login" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accedi alla dashboard</a></p>
<p style="color:#94a3b8;font-size:13px">Piano ${plan} — €${planPrice}/mese<br>Ti consigliamo di cambiare la password dopo il primo accesso.</p>
<p>Il team MadeCreative</p>
</body></html>`,
        }),
      });
    }
  } catch {
    // Non-critical
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const { prisma } = await import("@madecreative/db");
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
  const { prisma } = await import("@madecreative/db");
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
      amount: invoice.amount_due / 100,
      status: "FAILED",
    },
    update: { status: "FAILED" },
  });

  if ((invoice.attempt_count ?? 0) >= 3) {
    await prisma.client.update({
      where: { id: client.id },
      data: { status: "CHURNED" },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const { prisma } = await import("@madecreative/db");
  const client = await prisma.client.findUnique({
    where: { stripeSubId: subscription.id },
  });

  if (!client) return;

  await prisma.client.update({
    where: { id: client.id },
    data: { status: "CHURNED" },
  });
}
