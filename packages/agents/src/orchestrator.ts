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
      const result = await agent.run(input);

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
  });

  worker.on("failed", (job, err) => {
    console.error(`[Orchestrator] ${agentType} job failed: ${job?.id}`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[Orchestrator] Worker error for ${agentType}:`, err.message);
  });

  return worker;
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
