import { ClaudeClient, getClaudeClient } from "@madecreative/ai";
import type { ClaudeCallOptions } from "@madecreative/ai";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/index";
import type {
  AgentType,
  AgentLog,
  AgentResult,
  AgentToolCall,
} from "@madecreative/shared";
import { prisma } from "@madecreative/db";

export interface AgentContext {
  jobId: string;
  agentType: AgentType;
  input: Record<string, unknown>;
}

export abstract class BaseAgent {
  protected client: ClaudeClient;
  protected jobId: string;
  protected agentType: AgentType;
  protected logs: AgentLog[] = [];
  protected toolCalls: AgentToolCall[] = [];
  protected totalCost = 0;
  protected totalInputTokens = 0;
  protected totalOutputTokens = 0;

  constructor(context: AgentContext) {
    this.client = getClaudeClient();
    this.jobId = context.jobId;
    this.agentType = context.agentType;
  }

  abstract run(input: Record<string, unknown>): Promise<AgentResult>;

  protected abstract getTools(): Tool[];
  protected abstract handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown>;

  protected log(
    level: AgentLog["level"],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: AgentLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };
    this.logs.push(entry);
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[${this.agentType}][${this.jobId}] ${message}`,
      metadata ?? ""
    );
  }

  protected async updateProgress(progress: number): Promise<void> {
    await prisma.agentJob.update({
      where: { id: this.jobId },
      data: {
        progress: Math.min(100, Math.max(0, progress)),
        logs: this.logs as Parameters<typeof prisma.agentJob.update>[0] extends { data: infer D } ? D extends { logs?: infer L } ? L : never : never,
      },
    });
  }

  protected async callClaude(
    messages: MessageParam[],
    systemPrompt: string,
    options: Partial<ClaudeCallOptions> = {}
  ): Promise<AgentResult> {
    const startTime = Date.now();

    const tools = this.getTools();

    if (tools.length === 0) {
      const result = await this.client.callWithText(messages, {
        system: systemPrompt,
        ...options,
      });

      this.totalCost += result.cost;
      this.totalInputTokens += result.inputTokens;
      this.totalOutputTokens += result.outputTokens;

      return {
        success: true,
        data: { text: result.text },
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: Date.now() - startTime,
        toolCalls: this.toolCalls,
      };
    }

    const loopResult = await this.client.toolUseLoop(
      messages,
      async (toolName, toolInput) => {
        const toolStart = Date.now();
        this.log("info", `Calling tool: ${toolName}`, { toolInput });

        const output = await this.handleToolCall(toolName, toolInput);
        const durationMs = Date.now() - toolStart;

        this.toolCalls.push({
          toolName,
          input: toolInput,
          output,
          durationMs,
        });

        this.log("info", `Tool ${toolName} completed in ${durationMs}ms`);
        return output;
      },
      {
        system: systemPrompt,
        tools,
        ...options,
      }
    );

    this.totalCost += loopResult.totalCost;
    this.totalInputTokens += loopResult.totalInputTokens;
    this.totalOutputTokens += loopResult.totalOutputTokens;

    const textContent = loopResult.finalContent
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    return {
      success: true,
      data: { text: textContent, messages: loopResult.messages },
      apiCost: this.totalCost,
      tokensUsed: this.totalInputTokens + this.totalOutputTokens,
      durationMs: Date.now() - startTime,
      toolCalls: this.toolCalls,
    };
  }

  protected async markJobStarted(): Promise<void> {
    await prisma.agentJob.update({
      where: { id: this.jobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        progress: 0,
      },
    });
  }

  protected async markJobCompleted(
    output: Record<string, unknown>
  ): Promise<void> {
    await prisma.agentJob.update({
      where: { id: this.jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        progress: 100,
        output,
        apiCost: this.totalCost,
        logs: this.logs as Parameters<typeof prisma.agentJob.update>[0] extends { data: infer D } ? D extends { logs?: infer L } ? L : never : never,
      },
    });
  }

  protected async markJobFailed(error: string): Promise<void> {
    await prisma.agentJob.update({
      where: { id: this.jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error,
        apiCost: this.totalCost,
        logs: this.logs as Parameters<typeof prisma.agentJob.update>[0] extends { data: infer D } ? D extends { logs?: infer L } ? L : never : never,
      },
    });
  }
}
