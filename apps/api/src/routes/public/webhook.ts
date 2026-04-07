import { Hono } from "hono";
import { handleStripeWebhook } from "../../lib/stripe.js";

const app = new Hono();

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

export default app;
