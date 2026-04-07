/**
 * Scraper Cron Worker
 *
 * Runs every night between 02:00 and 06:00 CET.
 * Loads active ScrapeConfigRow entries from the DB and enqueues a ScraperAgent
 * job for each one, respecting a concurrency limit of 3 parallel scrapers.
 */
import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@madecreative/db";
import { Redis as IORedis } from "ioredis";
import { Queue } from "bullmq";
import { AGENT_QUEUE_NAMES } from "@madecreative/shared";

// Infer the ScrapeConfig row type from Prisma's findMany return type
type ScrapeConfigRow = Awaited<
  ReturnType<typeof prisma.scrapeConfig.findMany>
>[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of scraper jobs running concurrently */
const MAX_PARALLEL_SCRAPERS = 3;

/**
 * Minimum interval between two runs for the same ScrapeConfigRow (23 h).
 * Prevents double-runs when the cron fires at both 02:00 and a later hour.
 */
const MIN_RUN_INTERVAL_MS = 23 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Queue singleton
// ---------------------------------------------------------------------------

let scraperQueue: Queue | null = null;

function getScraperQueue(): Queue {
  if (!scraperQueue) {
    const redisUrl = process.env["REDIS_URL"];
    if (!redisUrl) throw new Error("REDIS_URL environment variable is not set");

    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    scraperQueue = new Queue(AGENT_QUEUE_NAMES["SCRAPER"], {
      connection: redis,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return scraperQueue;
}

// ---------------------------------------------------------------------------
// Time window helper — only run inside 02:00-06:00 CET
// ---------------------------------------------------------------------------

function isWithinScrapingWindow(): boolean {
  // We schedule with node-cron at fixed hours so this check is an extra guard.
  const now = new Date();
  // Determine current hour in CET/CEST (UTC+1 / UTC+2)
  // Simple offset: CET = UTC+1, CEST = UTC+2.
  // Use Intl to get the correct offset at runtime.
  const cetHour = Number(
    new Intl.DateTimeFormat("de-DE", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(now)
  );
  return cetHour >= 2 && cetHour < 6;
}

// ---------------------------------------------------------------------------
// Core scraper job enqueuer
// ---------------------------------------------------------------------------

async function runScraperJobs(): Promise<void> {
  if (!isWithinScrapingWindow()) {
    console.log("[ScraperCron] Outside 02:00-06:00 CET window — skipping");
    return;
  }

  console.log("[ScraperCron] Running scheduled scraper jobs...");

  const activeConfigs = await prisma.scrapeConfig.findMany({
    where: { isActive: true },
    orderBy: { lastRunAt: "asc" }, // prioritise longest-idle configs
  });

  if (activeConfigs.length === 0) {
    console.log("[ScraperCron] No active scrape configs found");
    return;
  }

  const now = new Date();
  const eligible = activeConfigs.filter((cfg: ScrapeConfigRow) => {
    if (!cfg.lastRunAt) return true; // never run
    return now.getTime() - cfg.lastRunAt.getTime() >= MIN_RUN_INTERVAL_MS;
  });

  if (eligible.length === 0) {
    console.log("[ScraperCron] All configs ran recently — nothing to enqueue");
    return;
  }

  console.log(
    `[ScraperCron] ${eligible.length} config(s) eligible out of ${activeConfigs.length} active`
  );

  const queue = getScraperQueue();

  // Distribute: only enqueue up to MAX_PARALLEL_SCRAPERS jobs at a time
  // Stagger start times so they do not all hit the proxy simultaneously
  const batch = eligible.slice(0, MAX_PARALLEL_SCRAPERS);

  const results = await Promise.allSettled(
    batch.map(async (config: ScrapeConfigRow, idx: number) => {
      // Stagger by 5 minutes per slot so concurrent jobs use different IPs
      const delayMs = idx * 5 * 60 * 1000;

      const job = await prisma.agentJob.create({
        data: {
          agentType: "SCRAPER",
          status: "QUEUED",
          input: {
            scrapeConfigId: config.id,
            configId: config.id, // backward compat alias
            sector: config.sector,
            countries: config.countries as string[],
            cities: (config.cities as string[] | null) ?? undefined,
            keywords: config.keywords as string[],
            maxResults: config.maxResults,
            minRating: (config.minRating as number | null) ?? undefined,
          },
        },
      });

      await queue.add(
        "SCRAPER",
        { jobId: job.id, input: job.input },
        { jobId: job.id, delay: delayMs }
      );

      console.log(
        `[ScraperCron] Enqueued job ${job.id} for config "${config.name}"` +
          (delayMs ? ` (delay: ${delayMs / 60_000}m)` : "")
      );

      return { configName: config.name, jobId: job.id };
    })
  );

  // Log outcomes
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[ScraperCron] Failed to enqueue job:", r.reason);
    }
  }

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(
    `[ScraperCron] Enqueued ${succeeded}/${batch.length} jobs successfully`
  );
}

// ---------------------------------------------------------------------------
// Main — start cron
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("[ScraperCron] Starting scraper cron service...");

  // node-cron expression: run at :00 of every hour from 02 to 05 (CET).
  // The isWithinScrapingWindow() guard provides finer-grained control.
  cron.schedule(
    "0 2,3,4,5 * * *",
    () => {
      runScraperJobs().catch((err: unknown) =>
        console.error("[ScraperCron] Job error:", err)
      );
    },
    { timezone: "Europe/Berlin" }
  );

  console.log(
    "[ScraperCron] Cron scheduled — fires at 02:00, 03:00, 04:00, 05:00 CET"
  );

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.log("[ScraperCron] Shutting down...");
    if (scraperQueue) await scraperQueue.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    shutdown().catch(console.error);
  });
  process.on("SIGINT", () => {
    shutdown().catch(console.error);
  });
}

main().catch((err: unknown) => {
  console.error("[ScraperCron] Fatal error:", err);
  process.exit(1);
});
