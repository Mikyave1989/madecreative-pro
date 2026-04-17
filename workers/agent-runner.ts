import "dotenv/config";
import { startOrchestrator } from "@madecreative/agents";
import type { Worker } from "bullmq";

// Fail-fast env validation. Every agent ultimately hits the Anthropic API,
// so a missing ANTHROPIC_API_KEY means 100% of jobs will fail silently with
// "Could not resolve authentication method" mid-run. Crash here instead.
const REQUIRED_ENV = ["ANTHROPIC_API_KEY", "DATABASE_URL"] as const;
for (const key of REQUIRED_ENV) {
  const val = process.env[key];
  if (!val || val.length < 10) {
    console.error(`[AgentRunner] FATAL: ${key} is missing or empty. Check Railway variables for agent-runner service. Aborting boot.`);
    process.exit(1);
  }
}
console.log(`[AgentRunner] Env OK: ANTHROPIC_API_KEY present (${process.env["ANTHROPIC_API_KEY"]!.length} chars), DATABASE_URL present`);

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
