import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, Message, ContentBlock } from "@anthropic-ai/sdk/resources/messages/index";
import { AI_MODELS, AI_COST_PER_MILLION_TOKENS } from "@madecreative/shared";

export type ClaudeModel = keyof typeof AI_COST_PER_MILLION_TOKENS;

export interface ClaudeCallOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  system?: string;
  tools?: Tool[];
  toolChoice?: Anthropic.ToolChoiceAuto | Anthropic.ToolChoiceAny | Anthropic.ToolChoiceTool;
  temperature?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface ClaudeCallResult {
  content: ContentBlock[];
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
}

export interface ToolUseLoopResult {
  messages: MessageParam[];
  finalContent: ContentBlock[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  iterations: number;
}

export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; toolName: string; toolId: string }
  | { type: "tool_done"; toolName: string; result: unknown }
  | { type: "content_update"; updates: Record<string, unknown> }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number; cost: number } };

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelKey = model as ClaudeModel;
  const pricing = AI_COST_PER_MILLION_TOKENS[modelKey];
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: ClaudeModel;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env["ANTHROPIC_API_KEY"],
      timeout: 600_000, // 10 min — no premature timeout on large generations
    });
    this.defaultModel = AI_MODELS.DEFAULT as ClaudeModel;
  }

  async call(
    messages: MessageParam[],
    options: ClaudeCallOptions = {}
  ): Promise<ClaudeCallResult> {
    const {
      model = this.defaultModel,
      maxTokens = 4096,
      system,
      tools,
      toolChoice,
      temperature,
      maxRetries = 3,
      retryDelayMs = 1000,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const params: Anthropic.MessageCreateParams = {
          model,
          max_tokens: maxTokens,
          messages,
          ...(system ? { system } : {}),
          ...(tools && tools.length > 0 ? { tools } : {}),
          ...(toolChoice ? { tool_choice: toolChoice } : {}),
          ...(temperature !== undefined ? { temperature } : {}),
        };

        const response = await this.client.messages.create(params);
        const msg = response as Message;

        const inputTokens = msg.usage.input_tokens;
        const outputTokens = msg.usage.output_tokens;
        const cost = calculateCost(model, inputTokens, outputTokens);

        return {
          content: msg.content,
          stopReason: msg.stop_reason,
          inputTokens,
          outputTokens,
          cost,
          model,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a rate limit or overload error — retry
        const isRetryable =
          lastError.message.includes("529") ||
          lastError.message.includes("overloaded") ||
          lastError.message.includes("rate_limit") ||
          lastError.message.includes("529");

        if (!isRetryable || attempt === maxRetries) {
          throw lastError;
        }

        const delay = retryDelayMs * Math.pow(2, attempt);
        console.warn(
          `Claude API attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`
        );
        await sleep(delay);
      }
    }

    throw lastError ?? new Error("Claude API call failed after all retries");
  }

  async callWithText(
    messages: MessageParam[],
    options: ClaudeCallOptions = {}
  ): Promise<{ text: string; cost: number; inputTokens: number; outputTokens: number }> {
    const result = await this.call(messages, options);
    const textBlocks = result.content.filter((b) => b.type === "text");
    const text = textBlocks.map((b) => (b as Anthropic.TextBlock).text).join("\n");
    return {
      text,
      cost: result.cost,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  }

  /**
   * Runs a tool use loop: sends messages, processes tool calls, loops until end_turn
   */
  async toolUseLoop(
    initialMessages: MessageParam[],
    toolHandler: (
      toolName: string,
      toolInput: Record<string, unknown>
    ) => Promise<unknown>,
    options: ClaudeCallOptions = {}
  ): Promise<ToolUseLoopResult> {
    const messages: MessageParam[] = [...initialMessages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let iterations = 0;
    const maxIterations = 20;
    let finalContent: ContentBlock[] = [];

    while (iterations < maxIterations) {
      iterations++;
      const result = await this.call(messages, options);

      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;
      totalCost += result.cost;
      finalContent = result.content;

      // Add assistant message
      messages.push({ role: "assistant", content: result.content });

      if (result.stopReason === "end_turn") {
        break;
      }

      if (result.stopReason !== "tool_use") {
        break;
      }

      // Process tool calls
      const toolUseBlocks = result.content.filter((b) => b.type === "tool_use");
      if (toolUseBlocks.length === 0) {
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        const toolBlock = block as Anthropic.ToolUseBlock;

        try {
          const output = await toolHandler(
            toolBlock.name,
            toolBlock.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: JSON.stringify(output),
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: `Error: ${errMsg}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    return {
      messages,
      finalContent,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      iterations,
    };
  }

  /**
   * Streams a tool use loop, yielding StreamEvent as the model responds.
   * Yields text_delta events letter-by-letter, tool_start/tool_done around
   * each tool execution, and a done event with final token usage.
   */
  async *streamToolUseLoop(
    initialMessages: MessageParam[],
    toolHandler: (
      toolName: string,
      toolInput: Record<string, unknown>
    ) => Promise<unknown>,
    options: ClaudeCallOptions = {}
  ): AsyncGenerator<StreamEvent> {
    const {
      model = this.defaultModel,
      maxTokens = 4096,
      system,
      tools,
      toolChoice,
      temperature,
    } = options;

    const messages: MessageParam[] = [...initialMessages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations) {
      iterations++;

      const params: Anthropic.MessageStreamParams = {
        model,
        max_tokens: maxTokens,
        messages,
        ...(system ? { system } : {}),
        ...(tools && tools.length > 0 ? { tools } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
      };

      const stream = this.client.messages.stream(params);

      // Accumulate full content blocks for tool processing
      const contentBlocks: Anthropic.ContentBlock[] = [];
      let currentToolUseBlock: { id: string; name: string; inputJson: string } | null = null;

      // Process stream events
      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            currentToolUseBlock = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputJson: "",
            };
            yield { type: "tool_start", toolName: event.content_block.name, toolId: event.content_block.id };
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            yield { type: "text_delta", text: event.delta.text };
          } else if (event.delta.type === "input_json_delta" && currentToolUseBlock) {
            currentToolUseBlock.inputJson += event.delta.partial_json;
          }
        } else if (event.type === "content_block_stop") {
          if (currentToolUseBlock) {
            // Parse the completed tool input and add to contentBlocks
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(currentToolUseBlock.inputJson || "{}") as Record<string, unknown>;
            } catch {
              parsedInput = {};
            }
            contentBlocks.push({
              type: "tool_use",
              id: currentToolUseBlock.id,
              name: currentToolUseBlock.name,
              input: parsedInput,
            } as Anthropic.ToolUseBlock);
            currentToolUseBlock = null;
          }
        } else if (event.type === "message_delta") {
          // Accumulate usage
          if (event.usage) {
            totalOutputTokens += event.usage.output_tokens;
          }
        } else if (event.type === "message_start") {
          if (event.message.usage) {
            totalInputTokens += event.message.usage.input_tokens;
            totalOutputTokens += event.message.usage.output_tokens;
          }
        }
      }

      // Get the finalized message
      const finalMessage = await stream.finalMessage();
      const stopReason = finalMessage.stop_reason;

      // Rebuild content blocks from finalMessage for accuracy
      const finalContentBlocks = finalMessage.content;

      // Add text blocks that are not already in contentBlocks
      const textBlocks = finalContentBlocks.filter((b: Anthropic.ContentBlock) => b.type === "text");
      const allBlocks: Anthropic.ContentBlock[] = [
        ...textBlocks,
        ...contentBlocks,
      ];

      messages.push({ role: "assistant", content: allBlocks });

      if (stopReason === "end_turn" || stopReason !== "tool_use") {
        break;
      }

      // Process all tool_use blocks
      const toolUseBlocks = allBlocks.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
      if (toolUseBlocks.length === 0) {
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        try {
          const result = await toolHandler(
            toolBlock.name,
            toolBlock.input as Record<string, unknown>
          );
          yield { type: "tool_done", toolName: toolBlock.name, result };
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          yield { type: "tool_done", toolName: toolBlock.name, result: { error: errMsg } };
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: `Error: ${errMsg}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    totalCost = calculateCost(model, totalInputTokens, totalOutputTokens);

    yield {
      type: "done",
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: totalCost,
      },
    };
  }
}

// Singleton instance
let _claudeClient: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!_claudeClient) {
    _claudeClient = new ClaudeClient();
  }
  return _claudeClient;
}

export { calculateCost };
