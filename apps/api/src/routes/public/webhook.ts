import { Hono } from "hono";
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

// POST /public/webhook/resend
app.post("/resend", async (c) => {
  const { prisma } = await import("@madecreative/db");
  // Optional: verify Resend webhook signature
  const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
  if (webhookSecret) {
    const signature = c.req.header("svix-signature") ?? c.req.header("resend-signature");
    if (!signature) {
      return c.json({ error: "Missing webhook signature" }, 401);
    }
    // Basic HMAC verification is omitted here; production code should use
    // the Svix library: https://docs.resend.com/changelog/webhooks
    // For now we accept all requests when secret is not set.
  }

  let event: ResendWebhookEvent;
  try {
    event = await c.req.json<ResendWebhookEvent>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { type, data } = event;
  const resendMessageId = data.email_id;

  if (!resendMessageId) {
    return c.json({ received: true, skipped: "no email_id" });
  }

  // Find the OutreachEmail by Resend message ID
  const outreachEmail = await prisma.outreachEmail.findUnique({
    where: { resendMessageId },
    include: {
      prospect: {
        select: { id: true, contactEmail: true },
      },
    },
  });

  if (!outreachEmail) {
    // Could be a transactional email — not an outreach email, ignore
    console.log(`[ResendWebhook] email_id ${resendMessageId} not found in outreachEmails — skipping`);
    return c.json({ received: true, skipped: "email not found" });
  }

  console.log(`[ResendWebhook] Event: ${type} for email ${outreachEmail.id}`);

  switch (type) {
    case "email.opened": {
      // Only set openedAt once
      if (!outreachEmail.openedAt) {
        await prisma.outreachEmail.update({
          where: { id: outreachEmail.id },
          data: {
            status: "opened",
            openedAt: new Date(),
          },
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
            // Also mark as opened if not already
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
        data: {
          status: "bounced",
          bouncedAt: new Date(),
        },
      });

      console.log(`[ResendWebhook] Email ${outreachEmail.id} bounced`);

      // Count total bounces for this prospect — auto-blacklist after 2
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

        console.log(
          `[ResendWebhook] Auto-blacklisted prospect ${outreachEmail.prospectId} (${bounceCount} bounces)`
        );
      }
      break;
    }

    case "email.complained": {
      // Spam complaint — immediately blacklist
      if (outreachEmail.prospect.contactEmail) {
        const redis = getRedisConnection();
        await redis.sadd("blacklist:emails", outreachEmail.prospect.contactEmail);

        await prisma.prospect.update({
          where: { id: outreachEmail.prospectId },
          data: { status: "BLACKLISTED" },
        });

        // Cancel all pending outreach emails for this prospect
        await prisma.outreachEmail.updateMany({
          where: { prospectId: outreachEmail.prospectId, status: "draft" },
          data: { status: "cancelled", cancelledAt: new Date() },
        });

        console.log(
          `[ResendWebhook] Spam complaint — blacklisted prospect ${outreachEmail.prospectId}`
        );
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

  return c.json({ received: true });
});

export default app;
