import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@madecreative/db";
import type { AgentType } from "@madecreative/shared";
import { AGENT_QUEUE_NAMES } from "@madecreative/shared";

// Lazy imports for each agent to avoid loading all at startup
async function getAgent(agentType: AgentType, context: {
  jobId: string;
  agentType: AgentType;
  input: Record<string, unknown>;
}) {
  switch (agentType) {
    case "SCRAPER": {
      const { ScraperAgent } = await import("./scraper/index.js");
      return new ScraperAgent(context);
    }
    case "ANALYZER": {
      const { AnalyzerAgent } = await import("./analyzer/index.js");
      return new AnalyzerAgent(context);
    }
    case "BUILDER": {
      const { BuilderAgent } = await import("./builder/index.js");
      return new BuilderAgent(context);
    }
    case "OUTREACH": {
      const { OutreachAgent } = await import("./outreach/index.js");
      return new OutreachAgent(context);
    }
    case "CHATBOT": {
      const { ChatbotAgent } = await import("./chatbot/index.js");
      return new ChatbotAgent(context);
    }
    case "QA": {
      const { QaAgent } = await import("./qa/index.js");
      return new QaAgent(context);
    }
    default:
      throw new Error(`Unknown agent type: ${agentType as string}`);
  }
}

export function createOrchestratorWorker(
  agentType: AgentType,
  redisConnection: IORedis
): Worker {
  const queueName = AGENT_QUEUE_NAMES[agentType];

  const worker = new Worker(
    queueName,
    async (job) => {
      const { jobId, input } = job.data as {
        jobId: string;
        input: Record<string, unknown>;
      };

      console.log(`[Orchestrator] Processing ${agentType} job: ${jobId}`);

      // Check if job still exists and is not cancelled
      const dbJob = await prisma.agentJob.findUnique({
        where: { id: jobId },
      });

      if (!dbJob) {
        throw new Error(`Job ${jobId} not found in database`);
      }

      if (dbJob.status === "CANCELLED") {
        console.log(`[Orchestrator] Job ${jobId} was cancelled, skipping`);
        return { cancelled: true };
      }

      const context = {
        jobId,
        agentType,
        input,
      };

      const agent = await getAgent(agentType, context);
      const result = await agent.runWithRetry(input);

      return result;
    },
    {
      connection: redisConnection,
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60_000, // 5 jobs per minute per agent type
      },
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[Orchestrator] ${agentType} job completed: ${job.id}`, {
      cost: (result as { apiCost?: number })?.apiCost,
    });

    // Auto-pipeline: chain agents after completion
    void chainNextAgent(agentType, job.data as { jobId: string; input: Record<string, unknown> }, result).catch((err) => {
      console.error(`[Orchestrator] Auto-chain error for ${agentType}:`, err);
    });
  });

  worker.on("failed", (job, err) => {
    console.error(`[Orchestrator] ${agentType} job failed: ${job?.id}`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[Orchestrator] Worker error for ${agentType}:`, err.message);
  });

  return worker;
}

// ─── Auto-pipeline: chain agents after completion ────────────────────────────
// SCRAPER → ANALYZER (for each new prospect)
// ANALYZER → BUILDER (if leadScore >= 50)
// BUILDER → OUTREACH (generate + send cold email after preview built)
// BUILDER (client site) → QA (run lighthouse/check after deploy)

async function chainNextAgent(
  completedType: AgentType,
  jobData: { jobId: string; input: Record<string, unknown> },
  result: unknown,
): Promise<void> {
  const { Queue } = await import("bullmq");
  const url = process.env["REDIS_URL"];
  if (!url) return;

  const redis = new (await import("ioredis")).default(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  try {
    if (completedType === "SCRAPER") {
      // After scraping, queue ANALYZER for all new SCRAPED prospects without a score
      const prospects = await prisma.prospect.findMany({
        where: { status: "SCRAPED", leadScore: 0 },
        take: 50,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (prospects.length === 0) return;

      const analyzerQueue = new Queue(AGENT_QUEUE_NAMES["ANALYZER"], { connection: redis });

      for (let i = 0; i < prospects.length; i++) {
        const prospect = prospects[i]!;
        const job = await prisma.agentJob.create({
          data: {
            agentType: "ANALYZER",
            status: "QUEUED",
            input: { prospectId: prospect.id },
            prospectId: prospect.id,
          },
        });

        await analyzerQueue.add(
          "ANALYZER",
          { jobId: job.id, input: { prospectId: prospect.id } },
          { jobId: job.id, delay: i * 10_000 }, // stagger 10s apart
        );
      }

      await analyzerQueue.close();
      console.log(`[Orchestrator] Auto-chained ${prospects.length} ANALYZER jobs after SCRAPER`);
    }

    if (completedType === "ANALYZER") {
      // After analyzing, queue BUILDER for high-score prospects without preview
      const prospectId = jobData.input["prospectId"] as string | undefined;
      if (!prospectId) return;

      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, leadScore: true, previewSiteUrl: true, sector: true },
      });

      if (!prospect || prospect.leadScore < 50 || prospect.previewSiteUrl) return;

      const builderQueue = new Queue(AGENT_QUEUE_NAMES["BUILDER"], { connection: redis });

      const job = await prisma.agentJob.create({
        data: {
          agentType: "BUILDER",
          status: "QUEUED",
          input: { prospectId: prospect.id, templateSlug: prospect.sector },
          prospectId: prospect.id,
        },
      });

      await builderQueue.add(
        "BUILDER",
        { jobId: job.id, input: { prospectId: prospect.id, templateSlug: prospect.sector } },
        { jobId: job.id, delay: 5_000 },
      );

      await builderQueue.close();
      console.log(`[Orchestrator] Auto-chained BUILDER for prospect ${prospectId} (score: ${prospect.leadScore})`);
    }

    if (completedType === "BUILDER") {
      const prospectId = jobData.input["prospectId"] as string | undefined;
      if (!prospectId) return;

      // Check if this prospect now has a preview and hasn't been contacted yet
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: {
          id: true,
          contactEmail: true,
          status: true,
          previewSiteUrl: true,
          companyName: true,
          sector: true,
          country: true,
          city: true,
        },
      });

      if (!prospect?.contactEmail || !prospect.previewSiteUrl) return;

      // Only chain OUTREACH if prospect hasn't been contacted yet
      const alreadyContacted = ["EMAIL_QUEUED", "CONTACTED", "EMAIL_SENT", "FOLLOWED_UP", "REPLIED", "CALL_SCHEDULED", "CONVERTED", "BLACKLISTED"].includes(prospect.status);
      if (alreadyContacted) return;

      const outreachQueue = new Queue(AGENT_QUEUE_NAMES["OUTREACH"], { connection: redis });

      const job = await prisma.agentJob.create({
        data: {
          agentType: "OUTREACH",
          status: "QUEUED",
          input: {
            prospectId: prospect.id,
            previewUrl: prospect.previewSiteUrl,
            companyName: prospect.companyName,
            sector: prospect.sector,
            country: prospect.country,
            city: prospect.city,
          },
          prospectId: prospect.id,
        },
      });

      // Delay 30min to let preview deploy settle + avoid rate limits
      await outreachQueue.add(
        "OUTREACH",
        { jobId: job.id, input: job.input as Record<string, unknown> },
        { jobId: job.id, delay: 30 * 60 * 1000 },
      );

      // Update prospect status
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: { status: "EMAIL_QUEUED" },
      });

      await outreachQueue.close();
      console.log(`[Orchestrator] Auto-chained OUTREACH for prospect ${prospectId} (email: ${prospect.contactEmail})`);

      // Also chain QA for the built preview site
      const qaQueue = new Queue(AGENT_QUEUE_NAMES["QA"], { connection: redis });

      const qaJob = await prisma.agentJob.create({
        data: {
          agentType: "QA",
          status: "QUEUED",
          input: {
            prospectId: prospect.id,
            url: prospect.previewSiteUrl,
            checks: ["lighthouse", "mobile", "links"],
          },
          prospectId: prospect.id,
        },
      });

      await qaQueue.add(
        "QA",
        { jobId: qaJob.id, input: qaJob.input as Record<string, unknown> },
        { jobId: qaJob.id, delay: 60_000 }, // 1min after deploy
      );

      await qaQueue.close();
      console.log(`[Orchestrator] Auto-chained QA for prospect ${prospectId}`);
    }
  } finally {
    await redis.quit();
  }
}

export async function startOrchestrator(): Promise<Worker[]> {
  const url = process.env["REDIS_URL"];
  if (!url) throw new Error("REDIS_URL is not set");

  const redis = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const agentTypes: AgentType[] = [
    "SCRAPER",
    "ANALYZER",
    "BUILDER",
    "OUTREACH",
    "CHATBOT",
    "QA",
  ];

  const workers = agentTypes.map((type) =>
    createOrchestratorWorker(type, redis)
  );

  console.log(
    `[Orchestrator] Started ${workers.length} workers for agent types: ${agentTypes.join(", ")}`
  );

  // ── DB Poller: pick up jobs that were created but never reached BullMQ ──
  // This handles the case where the API (Vercel) can't connect to Redis
  // and creates jobs in DB only. We poll every 30s and enqueue them.
  const pollInterval = setInterval(async () => {
    try {
      const stuckJobs = await prisma.agentJob.findMany({
        where: {
          status: { in: ["QUEUED", "RUNNING"] },
          progress: 0,
          startedAt: { lt: new Date(Date.now() - 60_000) }, // older than 1 min
        },
        take: 5,
        orderBy: { createdAt: "asc" },
      });

      if (stuckJobs.length === 0) return;

      console.log(`[Orchestrator] DB Poller: found ${stuckJobs.length} stuck jobs, re-enqueueing...`);

      for (const job of stuckJobs) {
        const agentType = job.agentType as AgentType;
        const queueName = AGENT_QUEUE_NAMES[agentType];
        const queue = new (await import("bullmq")).Queue(queueName, { connection: redis });

        try {
          await queue.add(
            agentType,
            { jobId: job.id, input: job.input as Record<string, unknown> },
            { jobId: job.id }
          );
          // Reset startedAt so we don't re-enqueue next cycle
          await prisma.agentJob.update({
            where: { id: job.id },
            data: { startedAt: new Date() },
          });
          console.log(`[Orchestrator] DB Poller: re-enqueued ${agentType} job ${job.id}`);
        } catch (err) {
          console.error(`[Orchestrator] DB Poller: failed to enqueue ${job.id}:`, (err as Error).message);
        }

        await queue.close();
      }
    } catch (err) {
      // Non-fatal — will retry next cycle
    }
  }, 30_000);

  // Cleanup on process exit
  process.on("SIGTERM", () => clearInterval(pollInterval));

  return workers;
}
