import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import type { AgentType } from "@madecreative/shared";

let _redisConnection: InstanceType<typeof IORedis> | null = null;

export function getRedisConnection(): InstanceType<typeof IORedis> {
  if (!_redisConnection) {
    const url = process.env["REDIS_URL"];
    if (!url) throw new Error("REDIS_URL environment variable is not set");

    _redisConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
    });

    _redisConnection.on("error", (err: Error) => {
      console.error("Redis connection error:", err.message);
    });
  }

  return _redisConnection;
}

const _queues: Partial<Record<AgentType, Queue>> = {};

export async function getQueue(agentType: AgentType): Promise<Queue> {
  if (!_queues[agentType]) {
    const { AGENT_QUEUE_NAMES } = await import("@madecreative/shared");
    const queueName = AGENT_QUEUE_NAMES[agentType];
    _queues[agentType] = new Queue(queueName, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _queues[agentType]!;
}

export async function enqueueAgentJob(params: {
  agentType: AgentType;
  jobId: string;
  input: Record<string, unknown>;
  priority?: number;
  delay?: number;
}): Promise<void> {
  try {
    const queue = await getQueue(params.agentType);
    await queue.add(
      params.agentType,
      { jobId: params.jobId, input: params.input },
      {
        jobId: params.jobId,
        priority: params.priority,
        delay: params.delay,
      }
    );
  } catch (err) {
    // Redis/BullMQ not available (serverless environment) — job is still in DB as QUEUED
    // Workers will pick it up via DB polling when available
    console.warn(`[Queue] enqueue failed for ${params.agentType}/${params.jobId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function closeAllQueues(): Promise<void> {
  const closePromises = Object.values(_queues).map((q) => q?.close());
  await Promise.all(closePromises);
  if (_redisConnection) {
    await _redisConnection.quit();
    _redisConnection = null;
  }
}
