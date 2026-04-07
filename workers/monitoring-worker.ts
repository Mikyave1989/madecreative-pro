import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@madecreative/db";

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
    mrrResult,
    totalProspects,
    totalAgentJobs,
    failedJobs,
    apiCostResult,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyAmount: true },
    }),
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
    mrr: mrrResult._sum.monthlyAmount ?? 0,
    totalProspects,
    totalAgentJobs,
    failedJobsLast24h: failedJobs,
    apiCostLast24h: apiCostResult._sum.apiCost ?? 0,
  };
}

async function saveMetrics(metrics: MetricSnapshot): Promise<void> {
  const entries = Object.entries(metrics).map(([metric, value]) => ({
    metric,
    value: typeof value === "number" ? value : 0,
    date: new Date(),
  }));

  await prisma.platformMetric.createMany({ data: entries });
}

async function checkAlerts(metrics: MetricSnapshot): Promise<void> {
  const alerts: string[] = [];

  // Alert if too many agent failures
  if (metrics.failedJobsLast24h > 10) {
    alerts.push(`HIGH ALERT: ${metrics.failedJobsLast24h} agent jobs failed in last 24h`);
  }

  // Alert if API cost is too high
  if (metrics.apiCostLast24h > 50) {
    alerts.push(`COST ALERT: API cost last 24h = $${metrics.apiCostLast24h.toFixed(2)}`);
  }

  if (alerts.length > 0) {
    console.warn("[Monitoring] ALERTS:", alerts.join("\n"));

    // In production, send to Slack/email
    if (process.env["SENTRY_DSN"]) {
      // Would use Sentry here
    }
  }
}

async function runMonitoring(): Promise<void> {
  try {
    const metrics = await collectMetrics();
    await saveMetrics(metrics);
    await checkAlerts(metrics);

    console.log("[Monitoring] Metrics collected:", {
      clients: `${metrics.activeClients}/${metrics.totalClients}`,
      mrr: `$${metrics.mrr.toFixed(0)}`,
      prospects: metrics.totalProspects,
      failedJobs24h: metrics.failedJobsLast24h,
      apiCost24h: `$${metrics.apiCostLast24h.toFixed(2)}`,
    });
  } catch (err) {
    console.error("[Monitoring] Error collecting metrics:", err);
  }
}

async function main(): Promise<void> {
  console.log("[Monitoring] Starting monitoring worker...");

  // Run every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    runMonitoring().catch(console.error);
  });

  // Run immediately on startup
  await runMonitoring();

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));

  // Keep alive
  setInterval(() => {}, 60_000);

  console.log("[Monitoring] Running — collecting metrics every 15 minutes");
}

main().catch((err) => {
  console.error("[Monitoring] Fatal error:", err);
  process.exit(1);
});
