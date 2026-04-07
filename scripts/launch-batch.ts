/**
 * scripts/launch-batch.ts
 *
 * Seeds the first scrape configuration (100 restaurant prospects in Germany)
 * and immediately enqueues a SCRAPER AgentJob so the cron picks it up on the
 * next window — or runs it right away when called manually.
 *
 * Usage:
 *   npx tsx scripts/launch-batch.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Batch definition — Ristoranti Germania, Batch 1
// ---------------------------------------------------------------------------

const BATCH_CONFIG = {
  name: "Ristoranti Germania - Batch 1",
  sector: "restaurant",
  countries: ["DE"],
  cities: [
    "München",
    "Berlin",
    "Hamburg",
    "Frankfurt",
    "Köln",
    "Stuttgart",
    "Düsseldorf",
    "Dresden",
    "Leipzig",
    "Nürnberg",
  ],
  keywords: [
    "restaurant",
    "ristorante",
    "italienisches restaurant",
    "trattoria",
    "pizzeria",
    "osteria",
  ],
  minRating: 3.5,
  maxResults: 100,
  // Runs at 03:00 CET every night (Europe/Berlin TZ used by scraper-cron)
  schedule: "0 3 * * *",
} as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    log: ["warn", "error"],
  });

  try {
    console.log("=".repeat(60));
    console.log("  MadeCreative — Launch Batch Seeder");
    console.log("=".repeat(60));
    console.log();

    // Check if a config with this name already exists to avoid duplicates
    const existing = await prisma.scrapeConfig.findFirst({
      where: { name: BATCH_CONFIG.name },
    });

    let scrapeConfig;

    if (existing) {
      console.log(`[ScrapeConfig] Already exists: "${existing.name}" (${existing.id})`);
      console.log("  Skipping creation — using existing config.");
      scrapeConfig = existing;
    } else {
      scrapeConfig = await prisma.scrapeConfig.create({
        data: {
          name: BATCH_CONFIG.name,
          sector: BATCH_CONFIG.sector,
          countries: BATCH_CONFIG.countries,
          cities: BATCH_CONFIG.cities,
          keywords: BATCH_CONFIG.keywords,
          minRating: BATCH_CONFIG.minRating,
          maxResults: BATCH_CONFIG.maxResults,
          schedule: BATCH_CONFIG.schedule,
          isActive: true,
        },
      });

      console.log(`[ScrapeConfig] Created: "${scrapeConfig.name}"`);
      console.log(`  ID       : ${scrapeConfig.id}`);
      console.log(`  Sector   : ${scrapeConfig.sector}`);
      console.log(`  Countries: ${BATCH_CONFIG.countries.join(", ")}`);
      console.log(`  Cities   : ${BATCH_CONFIG.cities.length} cities`);
      console.log(`  Keywords : ${BATCH_CONFIG.keywords.length} keywords`);
      console.log(`  Min rating: ${scrapeConfig.minRating}`);
      console.log(`  Max results: ${scrapeConfig.maxResults}`);
      console.log(`  Schedule  : ${scrapeConfig.schedule} (CET)`);
    }

    console.log();

    // Create an AgentJob so the agent-runner picks it up immediately
    const agentJob = await prisma.agentJob.create({
      data: {
        agentType: "SCRAPER",
        status: "QUEUED",
        input: {
          scrapeConfigId: scrapeConfig.id,
          configId: scrapeConfig.id, // backward-compat alias
          sector: scrapeConfig.sector,
          countries: scrapeConfig.countries as string[],
          cities: scrapeConfig.cities as string[],
          keywords: scrapeConfig.keywords as string[],
          maxResults: scrapeConfig.maxResults,
          minRating: scrapeConfig.minRating ?? undefined,
          batchName: scrapeConfig.name,
          isLaunchBatch: true,
        },
      },
    });

    console.log(`[AgentJob]    Created: SCRAPER job`);
    console.log(`  Job ID   : ${agentJob.id}`);
    console.log(`  Status   : ${agentJob.status}`);
    console.log(`  Agent    : ${agentJob.agentType}`);

    console.log();
    console.log("=".repeat(60));
    console.log("  SUMMARY");
    console.log("=".repeat(60));
    console.log();
    console.log("  ScrapeConfig ID : " + scrapeConfig.id);
    console.log("  AgentJob ID     : " + agentJob.id);
    console.log("  Target          : 100 restaurants in 10 German cities");
    console.log("  Next auto-run   : 03:00 CET (scraper-cron.ts)");
    console.log();
    console.log("  The agent-runner will pick up the QUEUED job on its next");
    console.log("  poll cycle. Monitor via: apps/admin or agent-runner logs.");
    console.log();
    console.log("  READY TO SCRAPE");
    console.log("=".repeat(60));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("[launch-batch] Fatal error:", err);
  process.exit(1);
});
