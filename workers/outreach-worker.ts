import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { prisma } from "@madecreative/db";
import { AGENT_QUEUE_NAMES, OUTREACH_CONFIG } from "@madecreative/shared";

const OUTREACH_SENDER_QUEUE = "outreach-send-queue";

function createRedis(): InstanceType<typeof IORedis> {
  return new IORedis(process.env["REDIS_URL"]!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  from: string;
  replyTo?: string;
}): Promise<{ messageId: string }> {
  // In production, use Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.body.replace(/\n/g, "<br>"),
      reply_to: params.replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  const data = (await response.json()) as { id: string };
  return { messageId: data.id };
}

async function processOutreachSend(emailId: string): Promise<void> {
  const email = await prisma.outreachEmail.findUnique({
    where: { id: emailId },
    include: {
      prospect: {
        select: {
          contactEmail: true,
          contactName: true,
          companyName: true,
        },
      },
    },
  });

  if (!email || !email.prospect.contactEmail) {
    console.warn(`[OutreachWorker] Email ${emailId} not found or no contact email`);
    return;
  }

  if (email.status !== "queued") {
    console.warn(`[OutreachWorker] Email ${emailId} is not in queued status: ${email.status}`);
    return;
  }

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sentToday = await prisma.outreachEmail.count({
    where: {
      status: "sent",
      sentAt: { gte: today },
    },
  });

  if (sentToday >= OUTREACH_CONFIG.DAILY_EMAIL_LIMIT) {
    console.warn(`[OutreachWorker] Daily email limit reached (${sentToday}/${OUTREACH_CONFIG.DAILY_EMAIL_LIMIT})`);
    return;
  }

  const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";
  const senderNames = (process.env["EMAIL_FROM_NAMES"] ?? "marco,anna").split(",");
  const senderName = senderNames[Math.floor(Math.random() * senderNames.length)] ?? "marco";
  const fromEmail = `${senderName.toLowerCase()}@${domain}`;

  try {
    await sendEmail({
      to: email.prospect.contactEmail,
      subject: email.subject,
      body: email.body,
      from: `${senderName.charAt(0).toUpperCase() + senderName.slice(1)} from MadeCreative <${fromEmail}>`,
    });

    await prisma.outreachEmail.update({
      where: { id: emailId },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    await prisma.prospect.update({
      where: { id: email.prospectId },
      data: {
        status: "EMAIL_SENT",
        lastContactedAt: new Date(),
        firstContactedAt: email.stepNumber === 1 ? new Date() : undefined,
      },
    });

    console.log(`[OutreachWorker] Email sent to ${email.prospect.contactEmail}`);
  } catch (err) {
    console.error(`[OutreachWorker] Failed to send email ${emailId}:`, err);

    await prisma.outreachEmail.update({
      where: { id: emailId },
      data: { status: "draft" }, // Reset to draft for retry
    });
  }
}

async function queuePendingEmails(sendQueue: Queue): Promise<void> {
  // Find emails ready to be sent
  const pendingEmails = await prisma.outreachEmail.findMany({
    where: {
      status: "queued",
    },
    take: 50,
    orderBy: { id: "asc" },
  });

  for (const email of pendingEmails) {
    await sendQueue.add("send-email", { emailId: email.id }, {
      jobId: `email-${email.id}`,
      delay: 0,
    });
  }

  if (pendingEmails.length > 0) {
    console.log(`[OutreachWorker] Queued ${pendingEmails.length} emails for sending`);
  }
}

async function main(): Promise<void> {
  console.log("[OutreachWorker] Starting...");

  const redis = createRedis();
  const sendQueue = new Queue(OUTREACH_SENDER_QUEUE, { connection: redis });

  // Worker that processes actual email sends
  const sendWorker = new Worker(
    OUTREACH_SENDER_QUEUE,
    async (job) => {
      await processOutreachSend(job.data.emailId as string);
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 10, duration: 60_000 }, // 10 emails per minute
    }
  );

  sendWorker.on("failed", (job, err) => {
    console.error(`[OutreachWorker] Send job failed: ${job?.id}`, err.message);
  });

  // Also process new outreach generation requests
  const agentWorker = new Worker(
    AGENT_QUEUE_NAMES["OUTREACH"],
    async (job) => {
      const { jobId } = job.data as { jobId: string };
      console.log(`[OutreachWorker] Processing outreach generation job: ${jobId}`);
      // The actual agent processing happens in agent-runner
      // This worker just tracks the queue
    },
    { connection: redis, concurrency: 2 }
  );

  void agentWorker;

  // Queue pending emails every 5 minutes
  const interval = setInterval(() => {
    queuePendingEmails(sendQueue).catch(console.error);
  }, 5 * 60 * 1000);

  // Run immediately
  await queuePendingEmails(sendQueue);

  process.on("SIGTERM", async () => {
    clearInterval(interval);
    await Promise.all([sendWorker.close(), sendQueue.close()]);
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    clearInterval(interval);
    await Promise.all([sendWorker.close(), sendQueue.close()]);
    process.exit(0);
  });

  console.log("[OutreachWorker] Running — processing outreach emails");
}

main().catch((err) => {
  console.error("[OutreachWorker] Fatal error:", err);
  process.exit(1);
});
