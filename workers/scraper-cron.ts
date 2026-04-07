import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@madecreative/db";
import { Redis as IORedis } from "ioredis";
import { Queue } from "bullmq";
import { AGENT_QUEUE_NAMES } from "@madecreative/shared";

let scraperQueue: Queue | null = null;

function getScraperQueue(): Queue {
  if (!scraperQueue) {
    const redis = new IORedis(process.env["REDIS_URL"]!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    scraperQueue = new Queue(AGENT_QUEUE_NAMES["SCRAPER"], {
      connection: redis,
    });
  }
  return scraperQueue;
}

async function runScraperJobs(): Promise<void> {
  console.log("[ScraperCron] Running scheduled scraper jobs...");

  const activeConfigs = await prisma.scrapeConfig.findMany({
    where: {
      isActive: true,
      schedule: { not: null },
    },
  });

  if (activeConfigs.length === 0) {
    console.log("[ScraperCron] No active scrape configs found");
    return;
  }

  const now = new Date();

  for (const config of activeConfigs) {
    // Simple daily check: only run if not run today
    const shouldRun =
      !config.lastRunAt ||
      now.getTime() - config.lastRunAt.getTime() > 23 * 60 * 60 * 1000;

    if (!shouldRun) {
      console.log(`[ScraperCron] Skipping config "${config.name}" — ran recently`);
      continue;
    }

    const job = await prisma.agentJob.create({
      data: {
        agentType: "SCRAPER",
        status: "QUEUED",
        input: {
          configId: config.id,
          sector: config.sector,
          countries: config.countries as string[],
          cities: (config.cities as string[] | null) ?? undefined,
          keywords: config.keywords as string[],
          maxResults: config.maxResults,
        },
      },
    });

    const queue = getScraperQueue();
    await queue.add(
      "SCRAPER",
      { jobId: job.id, input: job.input },
      { jobId: job.id }
    );

    console.log(`[ScraperCron] Enqueued scraper job ${job.id} for config "${config.name}"`);
  }
}

async function main(): Promise<void> {
  console.log("[ScraperCron] Starting scraper cron service...");

  // Run immediately on startup
  await runScraperJobs().catch(console.error);

  // Schedule to run every hour
  cron.schedule("0 * * * *", () => {
    runScraperJobs().catch(console.error);
  });

  console.log("[ScraperCron] Cron scheduled — running every hour");

  process.on("SIGTERM", async () => {
    if (scraperQueue) await scraperQueue.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    if (scraperQueue) await scraperQueue.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[ScraperCron] Fatal error:", err);
  process.exit(1);
});
