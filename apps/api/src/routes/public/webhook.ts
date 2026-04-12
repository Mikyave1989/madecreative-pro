import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "crypto";
import { handleStripeWebhook } from "../../lib/stripe.js";
import { getRedisConnection } from "../../lib/queue.js";

const app = new Hono();

// ─── Stripe webhook ───────────────────────────────────────────────────────────

// POST /public/webhook/stripe
app.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const rawBody = await c.req.raw.arrayBuffer();
  const payload = Buffer.from(rawBody);

  try {
    await handleStripeWebhook(payload, signature);
    return c.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe webhook error:", msg);
    return c.json({ error: msg }, 400);
  }
});

// ─── Resend webhook ───────────────────────────────────────────────────────────

/**
 * Resend sends events to this endpoint.
 * Events: email.sent, email.delivered, email.opened, email.clicked,
 *         email.bounced, email.complained, email.delivery_delayed
 *
 * Verify the webhook signature using the Resend-Signature header.
 * For simplicity in dev mode we skip signature verification if no secret is set.
 */

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to?: string[];
    from?: string;
    subject?: string;
    created_at?: string;
    click?: { link: string; timestamp: string };
    bounce?: { message: string };
  };
}

// ─── Resend event handler (shared between verified and dev paths) ─────────────

async function processResendEvent(
  prisma: import("@prisma/client").PrismaClient,
  event: ResendWebhookEvent,
): Promise<{ received: boolean; skipped?: string }> {
  const { type, data } = event;
  const resendMessageId = data.email_id;

  if (!resendMessageId) {
    return { received: true, skipped: "no email_id" };
  }

  const outreachEmail = await prisma.outreachEmail.findUnique({
    where: { resendMessageId },
    include: { prospect: { select: { id: true, contactEmail: true } } },
  });

  if (!outreachEmail) {
    console.log(`[ResendWebhook] email_id ${resendMessageId} not found in outreachEmails — skipping`);
    return { received: true, skipped: "email not found" };
  }

  console.log(`[ResendWebhook] Event: ${type} for email ${outreachEmail.id}`);

  switch (type) {
    case "email.opened": {
      if (!outreachEmail.openedAt) {
        await prisma.outreachEmail.update({
          where: { id: outreachEmail.id },
          data: { status: "opened", openedAt: new Date() },
        });
        console.log(`[ResendWebhook] Marked email ${outreachEmail.id} as opened`);
      }
      break;
    }

    case "email.clicked": {
      if (!outreachEmail.clickedAt) {
        await prisma.outreachEmail.update({
          where: { id: outreachEmail.id },
          data: {
            status: "clicked",
            clickedAt: new Date(),
            openedAt: outreachEmail.openedAt ?? new Date(),
          },
        });
        console.log(`[ResendWebhook] Marked email ${outreachEmail.id} as clicked`);
      }
      break;
    }

    case "email.bounced": {
      await prisma.outreachEmail.update({
        where: { id: outreachEmail.id },
        data: { status: "bounced", bouncedAt: new Date() },
      });
      console.log(`[ResendWebhook] Email ${outreachEmail.id} bounced`);

      const bounceCount = await prisma.outreachEmail.count({
        where: { prospectId: outreachEmail.prospectId, status: "bounced" },
      });

      if (bounceCount >= 2 && outreachEmail.prospect.contactEmail) {
        const redis = getRedisConnection();
        await redis.sadd("blacklist:emails", outreachEmail.prospect.contactEmail);
        await prisma.prospect.update({
          where: { id: outreachEmail.prospectId },
          data: { status: "BLACKLISTED" },
        });
        console.log(`[ResendWebhook] Auto-blacklisted prospect ${outreachEmail.prospectId} (${bounceCount} bounces)`);
      }
      break;
    }

    case "email.complained": {
      if (outreachEmail.prospect.contactEmail) {
        const redis = getRedisConnection();
        await redis.sadd("blacklist:emails", outreachEmail.prospect.contactEmail);
        await prisma.prospect.update({
          where: { id: outreachEmail.prospectId },
          data: { status: "BLACKLISTED" },
        });
        await prisma.outreachEmail.updateMany({
          where: { prospectId: outreachEmail.prospectId, status: "draft" },
          data: { status: "cancelled", cancelledAt: new Date() },
        });
        console.log(`[ResendWebhook] Spam complaint — blacklisted prospect ${outreachEmail.prospectId}`);
      }
      break;
    }

    case "email.delivered":
    case "email.delivery_delayed":
    case "email.sent":
      // Informational only — no action needed
      break;

    default:
      console.log(`[ResendWebhook] Unhandled event type: ${type}`);
  }

  return { received: true };
}

// POST /public/webhook/resend
app.post("/resend", async (c) => {
  const { prisma } = await import("@madecreative/db");

  // HMAC signature verification — required when RESEND_WEBHOOK_SECRET is set.
  // Resend uses Svix, which signs with: "<svix-id>.<svix-timestamp>.<body>"
  const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
  if (webhookSecret) {
    const svixId = c.req.header("svix-id");
    const svixTimestamp = c.req.header("svix-timestamp");
    const svixSignature = c.req.header("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return c.json({ error: "Missing webhook signature headers" }, 401);
    }

    // Reject timestamps older than 5 minutes to prevent replay attacks
    const ts = parseInt(svixTimestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return c.json({ error: "Webhook timestamp out of range" }, 401);
    }

    const rawBody = await c.req.text();
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expectedSig = createHmac("sha256", webhookSecret)
      .update(signedContent)
      .digest("base64");

    // svix-signature may contain multiple space-separated "v1,<base64>" entries
    const signatures = svixSignature.split(" ").map(s => s.replace(/^v1,/, ""));
    const expectedBuf = Buffer.from(expectedSig);
    const verified = signatures.some(sig => {
      try {
        const sigBuf = Buffer.from(sig, "base64");
        return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
      } catch {
        return false;
      }
    });

    if (!verified) {
      console.warn("[ResendWebhook] Invalid signature — request rejected");
      return c.json({ error: "Invalid webhook signature" }, 401);
    }

    let event: ResendWebhookEvent;
    try {
      event = JSON.parse(rawBody) as ResendWebhookEvent;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    return c.json(await processResendEvent(prisma, event));
  }

  // Development mode — no secret set, skip verification
  let event: ResendWebhookEvent;
  try {
    event = await c.req.json<ResendWebhookEvent>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  return c.json(await processResendEvent(prisma, event));
});

export default app;
