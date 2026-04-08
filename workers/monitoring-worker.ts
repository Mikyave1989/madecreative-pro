import "dotenv/config";
import cron from "node-cron";
import { Queue, Worker } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { Resend } from "resend";
import { prisma } from "@madecreative/db";

// ─── Redis & Resend setup ─────────────────────────────────────────────────────

function createRedis(): InstanceType<typeof IORedis> {
  return new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

const resend = new Resend(process.env["RESEND_API_KEY"]);

const ADMIN_EMAIL =
  process.env["ADMIN_ALERT_EMAIL"] ?? "alerts@madecreative.pro";

// ─── BullMQ queue for uptime checks ──────────────────────────────────────────

const UPTIME_QUEUE = "uptime-check-queue";

interface UptimeJobData {
  websiteId: string;
  clientId: string;
  domain: string;
  clientEmail: string;
  companyName: string;
}

// ─── Platform metrics snapshot ────────────────────────────────────────────────

interface MetricSnapshot {
  totalClients: number;
  activeClients: number;
  mrr: number;
  totalProspects: number;
  totalAgentJobs: number;
  failedJobsLast24h: number;
  apiCostLast24h: number;
}

async function collectMetrics(): Promise<MetricSnapshot> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activeClients,
    totalProspects,
    totalAgentJobs,
    failedJobs,
    apiCostResult,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.prospect.count(),
    prisma.agentJob.count(),
    prisma.agentJob.count({
      where: { status: "FAILED", createdAt: { gte: yesterday } },
    }),
    prisma.agentJob.aggregate({
      where: { createdAt: { gte: yesterday }, status: "COMPLETED" },
      _sum: { apiCost: true },
    }),
  ]);

  return {
    totalClients,
    activeClients,
    mrr: activeClients * 297,
    totalProspects,
    totalAgentJobs,
    failedJobsLast24h: failedJobs,
    apiCostLast24h: apiCostResult._sum.apiCost ?? 0,
  };
}

async function checkPlatformAlerts(metrics: MetricSnapshot): Promise<void> {
  const alerts: string[] = [];

  if (metrics.failedJobsLast24h > 10) {
    alerts.push(
      `HIGH ALERT: ${metrics.failedJobsLast24h} agent jobs failed in last 24h`
    );
  }

  if (metrics.apiCostLast24h > 50) {
    alerts.push(
      `COST ALERT: API cost last 24h = $${metrics.apiCostLast24h.toFixed(2)}`
    );
  }

  if (alerts.length > 0) {
    console.warn("[Monitoring] ALERTS:", alerts.join("\n"));
    await resend.emails.send({
      from: "MadeCreative Monitoring <monitoring@madecreative.pro>",
      to: ADMIN_EMAIL,
      subject: `[MadeCreative] Platform Alert — ${new Date().toISOString()}`,
      text: alerts.join("\n\n"),
    });
  }
}

// ─── Uptime check ─────────────────────────────────────────────────────────────

async function checkWebsiteUptime(data: UptimeJobData): Promise<void> {
  const url = data.domain.startsWith("http")
    ? data.domain
    : `https://${data.domain}`;

  let isDown = false;
  let statusCode: number | null = null;
  let errorMessage = "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    statusCode = res.status;
    isDown = res.status >= 500;
  } catch (err) {
    isDown = true;
    errorMessage = err instanceof Error ? err.message : "Connection failed";
  }

  if (isDown) {
    console.warn(
      `[Uptime] DOWN — ${data.domain} (status=${statusCode ?? "N/A"}, err=${errorMessage})`
    );
    await resend.emails.send({
      from: "MadeCreative Monitoring <monitoring@madecreative.pro>",
      to: ADMIN_EMAIL,
      subject: `[SITE DOWN] ${data.companyName} — ${data.domain}`,
      text: [
        `Client: ${data.companyName} (${data.clientEmail})`,
        `Domain: ${data.domain}`,
        `Status code: ${statusCode ?? "N/A"}`,
        `Error: ${errorMessage || "HTTP " + String(statusCode)}`,
        `Detected at: ${new Date().toISOString()}`,
      ].join("\n"),
    });
  } else {
    console.log(`[Uptime] OK — ${data.domain} (${statusCode})`);
  }
}

// ─── Queue all active websites for uptime checks ──────────────────────────────

async function enqueueUptimeChecks(
  queue: Queue<UptimeJobData>
): Promise<void> {
  const websites = await prisma.clientWebsite.findMany({
    where: { deployUrl: { not: null } },
    include: {
      client: { select: { id: true, email: true, companyName: true } },
    },
  });

  for (const site of websites) {
    if (!site.deployUrl) continue;
    await queue.add(
      "uptime-check",
      {
        websiteId: site.id,
        clientId: site.clientId,
        domain: site.deployUrl,
        clientEmail: site.client.email,
        companyName: site.client.companyName,
      },
      { removeOnComplete: 50, removeOnFail: 20, attempts: 1 }
    );
  }

  console.log(`[Uptime] Enqueued ${websites.length} website checks`);
}

// ─── Churn detection ──────────────────────────────────────────────────────────

async function detectChurnedClients(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const churnRisk = await prisma.client.findMany({
    where: {
      status: "ACTIVE",
      lastLoginAt: { lt: thirtyDaysAgo },
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      contactName: true,
      lastLoginAt: true,
    },
  });

  if (churnRisk.length === 0) return;

  console.warn(
    `[Monitoring] ${churnRisk.length} clients have not logged in for >30 days`
  );

  const rows = churnRisk
    .map(
      (c) =>
        `- ${c.companyName} (${c.email}) — last login: ${c.lastLoginAt?.toISOString() ?? "never"}`
    )
    .join("\n");

  await resend.emails.send({
    from: "MadeCreative Monitoring <monitoring@madecreative.pro>",
    to: ADMIN_EMAIL,
    subject: `[Churn Risk] ${churnRisk.length} clients inactive > 30 days`,
    text: `The following active clients have not logged in for more than 30 days:\n\n${rows}\n\nConsider a re-engagement email.`,
  });
}

// ─── Daily metric run ─────────────────────────────────────────────────────────

async function runDailyMetrics(): Promise<void> {
  try {
    const metrics = await collectMetrics();
    console.log("[Monitoring] Daily metrics:", metrics);
    await checkPlatformAlerts(metrics);
    await detectChurnedClients();
  } catch (err) {
    console.error("[Monitoring] Error in daily metrics run:", err);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[Monitoring] Starting monitoring worker...");

  const redis = createRedis();
  const uptimeQueue = new Queue<UptimeJobData>(UPTIME_QUEUE, {
    connection: redis,
  });

  const uptimeWorker = new Worker<UptimeJobData>(
    UPTIME_QUEUE,
    async (job) => {
      await checkWebsiteUptime(job.data);
    },
    { connection: createRedis(), concurrency: 10 }
  );

  uptimeWorker.on("failed", (job, err) => {
    console.error(
      `[Uptime] Job failed — ${job?.data.domain ?? "unknown"}:`,
      err
    );
  });

  cron.schedule("*/15 * * * *", () => {
    enqueueUptimeChecks(uptimeQueue).catch(console.error);
  });

  cron.schedule("0 6 * * *", () => {
    runDailyMetrics().catch(console.error);
  });

  await enqueueUptimeChecks(uptimeQueue);
  await runDailyMetrics();

  process.on("SIGTERM", async () => {
    await uptimeWorker.close();
    await uptimeQueue.close();
    await redis.quit();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await uptimeWorker.close();
    await uptimeQueue.close();
    await redis.quit();
    process.exit(0);
  });

  setInterval(() => {}, 60_000);

  console.log(
    "[Monitoring] Running — uptime checks every 15 min, daily metrics at 06:00 UTC"
  );
}

main().catch((err) => {
  console.error("[Monitoring] Fatal error:", err);
  process.exit(1);
});
