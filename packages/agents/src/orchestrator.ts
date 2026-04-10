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

  return workers;
}
