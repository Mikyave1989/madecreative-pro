import "dotenv/config";
import { startOrchestrator } from "@madecreative/agents";
import type { Worker } from "bullmq";

let workers: Worker[] = [];

async function main(): Promise<void> {
  console.log("[AgentRunner] Starting agent orchestrator...");

  workers = await startOrchestrator();

  console.log(`[AgentRunner] Started ${workers.length} agent workers`);

  // Graceful shutdown
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

async function shutdown(): Promise<void> {
  console.log("[AgentRunner] Shutting down gracefully...");

  await Promise.all(workers.map((w) => w.close()));
  console.log("[AgentRunner] All workers closed");

  process.exit(0);
}

main().catch((err) => {
  console.error("[AgentRunner] Fatal error:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[AgentRunner] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[AgentRunner] Uncaught exception:", err);
  process.exit(1);
});
