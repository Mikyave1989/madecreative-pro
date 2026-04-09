import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { prisma } from "@madecreative/db";

// ─── Redis ────────────────────────────────────────────────────────────────────

function createRedis(): IORedis {
  const url = process.env["REDIS_URL"];
  if (!url) throw new Error("REDIS_URL is not set");
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// ─── Resend helper ────────────────────────────────────────────────────────────

interface ResendSendResult {
  messageId: string;
}

async function sendViaResend(params: {
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  emailId: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      reply_to: params.replyTo,
      to: [params.to],
      subject: params.subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${params.html}</body></html>`,
      text: params.text,
      headers: {
        "X-Entity-Ref-ID": params.emailId,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as { id: string };
  return { messageId: data.id };
}

// ─── Tracking injection ───────────────────────────────────────────────────────

function injectTracking(html: string, emailId: string): string {
  const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";

  let result = html.replace(
    /https:\/\/api\.madecreative\.pro\/track\/open\/\{\{EMAIL_ID\}\}/g,
    `${apiBase}/track/open/${emailId}`
  );
  result = result.replace(
    /https:\/\/api\.madecreative\.pro\/track\/click\/\{\{EMAIL_ID\}\}/g,
    `${apiBase}/track/click/${emailId}`
  );

  if (!result.includes(`/track/open/${emailId}`)) {
    const pixel = `<img src="${apiBase}/track/open/${emailId}" width="1" height="1" alt="" style="display:none;border:0" />`;
    result = result.replace(/<\/body>/i, `${pixel}</body>`);
    if (!result.includes("</body>")) result += pixel;
  }

  return result;
}

// ─── Check blacklist ──────────────────────────────────────────────────────────

async function isBlacklisted(redis: IORedis, email: string, prospectId: string): Promise<boolean> {
  const inSet = await redis.sismember("blacklist:emails", email);
  if (inSet) return true;

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { status: true },
  });
  return prospect?.status === "BLACKLISTED";
}

// ─── Check daily limit ────────────────────────────────────────────────────────

async function checkDailyLimit(redis: IORedis): Promise<{ allowed: boolean; count: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `outreach:daily:${today}`;
  const countStr = await redis.get(key);
  const count = parseInt(countStr ?? "0", 10);

  // Get warming limit
  const dayStr = await redis.get("outreach:warming:day");
  const warmDay = parseInt(dayStr ?? "0", 10);
  const warmLimits = [5, 10, 20, 50, 100, 200];
  const warmIdx = Math.min(Math.floor(warmDay / 5), warmLimits.length - 1);
  const warmLimit = warmLimits[warmIdx] ?? 200;

  const configLimit = parseInt(process.env["EMAIL_DAILY_LIMIT"] ?? "200", 10);
  const limit = Math.min(configLimit, warmLimit);

  return { allowed: count < limit, count, limit };
}

// ─── Increment daily counter ──────────────────────────────────────────────────

async function incrementDailyCounter(redis: IORedis): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `outreach:daily:${today}`;
  await redis.incr(key);
  await redis.expire(key, 86400 * 2);
}

// ─── Process a follow-up job ──────────────────────────────────────────────────

interface FollowupJobData {
  prospectId: string;
  previousEmailId: string;
  stepNumber: number;
}

async function processFollowup(data: FollowupJobData, redis: IORedis): Promise<void> {
  const { prospectId, previousEmailId, stepNumber } = data;

  console.log(`[OutreachWorker] Processing follow-up step ${stepNumber} for prospect ${prospectId}`);

  // Load prospect
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: {
      id: true,
      contactEmail: true,
      contactName: true,
      companyName: true,
      status: true,
    },
  });

  if (!prospect?.contactEmail) {
    console.warn(`[OutreachWorker] Prospect ${prospectId} not found or no email`);
    return;
  }

  // Blacklist check
  if (await isBlacklisted(redis, prospect.contactEmail, prospectId)) {
    console.warn(`[OutreachWorker] Prospect ${prospectId} is blacklisted — skipping`);
    return;
  }

  // If prospect already replied or converted, skip
  if (["REPLIED", "CONVERTED", "BLACKLISTED"].includes(prospect.status)) {
    console.log(`[OutreachWorker] Skipping prospect ${prospectId} — status: ${prospect.status}`);
    return;
  }

  // Check daily limit
  const { allowed, count, limit } = await checkDailyLimit(redis);
  if (!allowed) {
    console.warn(`[OutreachWorker] Daily limit reached (${count}/${limit}) — re-queuing follow-up`);
    // Re-queue for next day
    const followupQueue = new Queue("outreach-followup", { connection: redis });
    await followupQueue.add(
      "send-followup",
      data,
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours
        jobId: `retry-${prospectId}-step${stepNumber}-${Date.now()}`,
      }
    );
    await followupQueue.close();
    return;
  }

  // Check if previous email was opened
  const previousEmail = await prisma.outreachEmail.findUnique({
    where: { id: previousEmailId },
    select: { openedAt: true, stepNumber: true },
  });

  const wasOpened = previousEmail?.openedAt !== null && previousEmail?.openedAt !== undefined;

  console.log(`[OutreachWorker] Step ${stepNumber} — previous email opened: ${wasOpened}`);

  // Find the appropriate draft for this step
  let targetEmail: {
    id: string;
    subject: string;
    body: string;
    bodyPlain: string | null;
    fromName: string | null;
    fromEmail: string | null;
  } | null = null;

  if (stepNumber === 2) {
    // Step 2: warm (first draft) or cold (second draft)
    const drafts = await prisma.outreachEmail.findMany({
      where: { prospectId, stepNumber: 2, status: "draft" },
      orderBy: { createdAt: "asc" },
    });
    targetEmail = wasOpened
      ? (drafts[0] ?? null)
      : (drafts[1] ?? drafts[0] ?? null);
  } else {
    targetEmail = await prisma.outreachEmail.findFirst({
      where: { prospectId, stepNumber, status: "draft" },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!targetEmail) {
    console.warn(`[OutreachWorker] No draft email found for step ${stepNumber}, prospect ${prospectId}`);
    return;
  }

  const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";
  const fromName = targetEmail.fromName ?? "Marco Bianchi";
  const fromEmail = targetEmail.fromEmail ?? "marco";
  const fromAddress = `${fromName} <${fromEmail}@${domain}>`;

  const trackedHtml = injectTracking(targetEmail.body, targetEmail.id);

  try {
    const result = await sendViaResend({
      from: fromAddress,
      replyTo: `${fromEmail}@${domain}`,
      to: prospect.contactEmail,
      subject: targetEmail.subject,
      html: trackedHtml,
      text: targetEmail.bodyPlain ?? targetEmail.subject,
      emailId: targetEmail.id,
    });

    // Update email record
    await prisma.outreachEmail.update({
      where: { id: targetEmail.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        resendMessageId: result.messageId,
      },
    });

    // Update prospect
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        status: "EMAIL_SENT",
        lastContactedAt: new Date(),
      },
    });

    // Increment daily counter
    await incrementDailyCounter(redis);

    // Schedule next follow-up (step 3 after step 2)
    if (stepNumber === 2) {
      const followupQueue = new Queue("outreach-followup", { connection: redis });
      await followupQueue.add(
        "send-followup",
        {
          prospectId,
          previousEmailId: targetEmail.id,
          stepNumber: 3,
        },
        {
          delay: 5 * 24 * 60 * 60 * 1000, // 5 days (day 4 + 5 = day 9)
          jobId: `followup-${prospectId}-step3`,
        }
      );
      await followupQueue.close();
    }

    console.log(`[OutreachWorker] Follow-up step ${stepNumber} sent to ${prospect.contactEmail} (${result.messageId})`);
  } catch (err) {
    console.error(`[OutreachWorker] Failed to send follow-up step ${stepNumber} to ${prospect.contactEmail}:`, err);

    // Reset to draft for retry
    await prisma.outreachEmail.update({
      where: { id: targetEmail.id },
      data: { status: "draft" },
    });

    throw err; // Let BullMQ handle retry
  }
}

// ─── Handle bounce webhook (called by API route) ───────────────────────────────
// This function is exported for use by the webhook route

export async function handleBounce(
  resendMessageId: string,
  redis: IORedis
): Promise<void> {
  const email = await prisma.outreachEmail.findUnique({
    where: { resendMessageId },
    include: {
      prospect: {
        select: { id: true, contactEmail: true },
      },
    },
  });

  if (!email) {
    console.warn(`[OutreachWorker] Bounce: email with resendMessageId ${resendMessageId} not found`);
    return;
  }

  await prisma.outreachEmail.update({
    where: { id: email.id },
    data: { status: "bounced", bouncedAt: new Date() },
  });

  // Count bounces for this prospect
  const bounceCount = await prisma.outreachEmail.count({
    where: { prospectId: email.prospectId, status: "bounced" },
  });

  if (bounceCount >= 2 && email.prospect.contactEmail) {
    // Auto-blacklist after 2 bounces
    await redis.sadd("blacklist:emails", email.prospect.contactEmail);

    await prisma.prospect.update({
      where: { id: email.prospectId },
      data: { status: "BLACKLISTED" },
    });

    console.log(
      `[OutreachWorker] Auto-blacklisted ${email.prospect.contactEmail} after ${bounceCount} bounces`
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[OutreachWorker] Starting follow-up worker...");

  const redis = createRedis();

  // Worker: process scheduled follow-up emails
  const followupWorker = new Worker<FollowupJobData>(
    "outreach-followup",
    async (job) => {
      await processFollowup(job.data, redis);
    },
    {
      connection: redis,
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 }, // max 10 emails per minute
    }
  );

  followupWorker.on("completed", (job) => {
    console.log(`[OutreachWorker] Follow-up job completed: ${job.id}`);
  });

  followupWorker.on("failed", (job, err) => {
    console.error(`[OutreachWorker] Follow-up job failed: ${job?.id}`, err.message);
  });

  followupWorker.on("error", (err) => {
    console.error("[OutreachWorker] Worker error:", err.message);
  });

  // Increment warming day counter once per day (simple cron-like check)
  const warmingInterval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      // Around midnight, increment warming day
      const dayStr = await redis.get("outreach:warming:day");
      const day = parseInt(dayStr ?? "0", 10);
      await redis.set("outreach:warming:day", String(day + 1));
      console.log(`[OutreachWorker] Warming day incremented to ${day + 1}`);
    }
  }, 5 * 60 * 1000); // check every 5 minutes

  const shutdown = async (): Promise<void> => {
    clearInterval(warmingInterval);
    await followupWorker.close();
    await redis.quit();
    console.log("[OutreachWorker] Gracefully shut down");
    process.exit(0);
  };

  process.on("SIGTERM", () => { void shutdown(); });
  process.on("SIGINT", () => { void shutdown(); });

  console.log("[OutreachWorker] Running — listening for follow-up jobs on 'outreach-followup' queue");
}

main().catch((err) => {
  console.error("[OutreachWorker] Fatal error:", err);
  process.exit(1);
});
