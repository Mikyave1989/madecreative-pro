import { Hono } from "hono";
import { jwtVerify } from "jose";
import { prisma } from "@madecreative/db";
import { getRedisConnection } from "../../lib/queue.js";

const app = new Hono();

// ─── Unsubscribe page ─────────────────────────────────────────────────────────

/**
 * GET /public/unsubscribe?token=[jwt]
 *
 * The JWT contains: { prospectId, email }
 * On access:
 *  1. Decode JWT
 *  2. Mark Prospect as BLACKLISTED
 *  3. Add email to Redis blacklist
 *  4. Cancel all pending outreach emails
 *  5. Return HTML confirmation page
 */
app.get("/", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.html(unsubscribeHtml("error", "Token mancante. Il link non è valido."), 400);
  }

  // Decode JWT
  let prospectId: string;
  let email: string;

  try {
    const secret = process.env["UNSUBSCRIBE_JWT_SECRET"] ?? process.env["JWT_SECRET"];
    if (!secret) throw new Error("JWT secret not configured");

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    prospectId = payload["prospectId"] as string;
    email = payload["email"] as string;

    if (!prospectId || !email) throw new Error("Invalid token payload");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token non valido";
    console.warn("[Unsubscribe] Invalid token:", msg);
    return c.html(unsubscribeHtml("error", "Il link di cancellazione non è valido o è scaduto."), 400);
  }

  try {
    // Check if already blacklisted
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: { status: true, contactEmail: true },
    });

    if (!prospect) {
      return c.html(unsubscribeHtml("success", "Sei già stato rimosso dalla nostra lista."));
    }

    const redis = getRedisConnection();

    // Add to Redis blacklist
    await redis.sadd("blacklist:emails", email);

    // Update Prospect status
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: "BLACKLISTED" },
    });

    // Cancel all pending/draft outreach emails
    const cancelled = await prisma.outreachEmail.updateMany({
      where: {
        prospectId,
        status: { in: ["draft", "queued"] },
      },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    console.log(
      `[Unsubscribe] Prospect ${prospectId} (${email}) unsubscribed — cancelled ${cancelled.count} pending emails`
    );

    // Schedule GDPR data deletion after 24 hours
    // We store a Redis key that a background job can process
    await redis.set(
      `gdpr:delete:${prospectId}`,
      JSON.stringify({ prospectId, email, requestedAt: new Date().toISOString() }),
      "EX",
      86400 * 30 // Keep the flag for 30 days
    );

    // Add to deletion queue (delayed 24 hours)
    const { Queue } = await import("bullmq");
    const deletionQueue = new Queue("gdpr-deletion", { connection: redis });
    await deletionQueue.add(
      "delete-prospect-data",
      { prospectId, email },
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours
        jobId: `gdpr-delete-${prospectId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    );
    await deletionQueue.close();

    return c.html(unsubscribeHtml("success", undefined));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Unsubscribe] Error:", msg);
    return c.html(unsubscribeHtml("error", "Si è verificato un errore. Riprova più tardi."), 500);
  }
});

// ─── HTML page generator ──────────────────────────────────────────────────────

function unsubscribeHtml(type: "success" | "error", message?: string): string {
  const isSuccess = type === "success";

  const title = isSuccess
    ? "Cancellazione completata"
    : "Errore";

  const bodyText = isSuccess
    ? "Sei stato rimosso dalla lista. Non riceverai altre email da noi."
    : (message ?? "Si è verificato un errore.");

  const color = isSuccess ? "#16a34a" : "#dc2626";
  const icon = isSuccess ? "✓" : "✕";

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — MadeCreative</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${color};
      color: white;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 {
      font-size: 22px;
      color: #111827;
      margin-bottom: 12px;
    }
    p {
      font-size: 15px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer {
      margin-top: 32px;
      font-size: 13px;
      color: #9ca3af;
    }
    a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${bodyText}</p>
    ${isSuccess ? `
    <p style="margin-top: 16px;">
      Se hai cambiato idea o hai domande, puoi contattarci a
      <a href="mailto:info@madecreative.pro">info@madecreative.pro</a>.
    </p>
    ` : ""}
    <div class="footer">
      <a href="https://madecreative.pro">madecreative.pro</a>
    </div>
  </div>
</body>
</html>`;
}

export default app;
