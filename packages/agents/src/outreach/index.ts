import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult, PainPoint } from "@madecreative/shared";
import { COUNTRY_LANGUAGES } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { Redis as IORedis } from "ioredis";
import { Queue } from "bullmq";
import { outreachTools } from "./tools.js";
import { OUTREACH_SYSTEM_PROMPT, buildOutreachPrompt } from "./prompt.js";
import {
  OutreachInputSchema,
  type GeneratedEmail,
  type BlacklistResult,
  type DailyLimitState,
  type WarmingState,
  BlacklistCheckInputSchema,
  CheckDailyLimitInputSchema,
  GenerateEmailSequenceInputSchema,
  SaveOutreachEmailInputSchema,
  SendEmailInputSchema,
  ScheduleFollowupInputSchema,
} from "./types.js";

// ─── Sender pool ──────────────────────────────────────────────────────────────

const SENDERS: Array<{ name: string; email: string }> = [
  { name: "Marco Bianchi", email: "marco" },
  { name: "Anna Rossi", email: "anna" },
  { name: "Sarah Meyer", email: "sarah" },
];

function pickSender(): { name: string; email: string } {
  return SENDERS[Math.floor(Math.random() * SENDERS.length)] ?? SENDERS[0]!;
}

// ─── Warming schedule ─────────────────────────────────────────────────────────
// Index 0–5 maps to: 5, 10, 20, 50, 100, 200 (one step per 5 days)
const WARMING_LIMITS = [5, 10, 20, 50, 100, 200] as const;

function getWarmingLimit(day: number): number {
  const idx = Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
  return WARMING_LIMITS[idx] ?? 200;
}

// ─── Redis helper (lazy) ──────────────────────────────────────────────────────

let _redis: IORedis | null = null;

function getRedis(): IORedis {
  if (!_redis) {
    const url = process.env["REDIS_URL"];
    if (!url) throw new Error("REDIS_URL is not set");
    _redis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return _redis;
}

// ─── Resend API helper ────────────────────────────────────────────────────────

interface ResendSendResult {
  messageId: string;
}

async function sendViaResend(params: {
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}): Promise<ResendSendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      reply_to: params.replyTo,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: params.headers ?? {},
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as { id: string };
  return { messageId: data.id };
}

// ─── OutreachAgent ────────────────────────────────────────────────────────────

export class OutreachAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return outreachTools;
  }

  // ── Tool dispatch ──────────────────────────────────────────────────────────

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "generate_email_sequence":
        return this.toolGenerateEmailSequence(toolInput);

      case "check_daily_limit":
        return this.toolCheckDailyLimit(toolInput);

      case "handle_warming":
        return this.toolHandleWarming();

      case "blacklist_check":
        return this.toolBlacklistCheck(toolInput);

      case "save_outreach_email":
        return this.toolSaveOutreachEmail(toolInput);

      case "send_email":
        return this.toolSendEmail(toolInput);

      case "schedule_followup":
        return this.toolScheduleFollowup(toolInput);

      case "get_prospect_details":
        return this.toolGetProspectDetails(toolInput);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // ── Tool: get_prospect_details ─────────────────────────────────────────────

  private async toolGetProspectDetails(input: Record<string, unknown>): Promise<unknown> {
    const prospectId = input["prospectId"] as string;
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: {
        outreachEmails: {
          orderBy: { stepNumber: "asc" },
          select: {
            id: true,
            stepNumber: true,
            status: true,
            sentAt: true,
            openedAt: true,
            subject: true,
          },
        },
      },
    });

    if (!prospect) return { error: "Prospect not found" };

    return {
      id: prospect.id,
      companyName: prospect.companyName,
      contactName: prospect.contactName,
      contactEmail: prospect.contactEmail,
      sector: prospect.sector,
      country: prospect.country,
      website: prospect.website,
      googleRating: prospect.googleRating,
      reviewCount: prospect.reviewCount,
      painPoints: prospect.painPoints,
      previewSiteUrl: prospect.previewSiteUrl,
      status: prospect.status,
      outreachHistory: prospect.outreachEmails,
    };
  }

  // ── Tool: generate_email_sequence ──────────────────────────────────────────

  private async toolGenerateEmailSequence(input: Record<string, unknown>): Promise<unknown> {
    const parsed = GenerateEmailSequenceInputSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
    }

    const { prospectId, language, senderName, senderEmail } = parsed.data;

    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) return { error: "Prospect not found" };

    const painPoints = (prospect.painPoints as PainPoint[] | null) ?? [];

    const userPrompt = buildOutreachPrompt({
      prospect: {
        companyName: prospect.companyName,
        contactName: prospect.contactName,
        sector: prospect.sector,
        country: prospect.country,
        website: prospect.website,
        googleRating: prospect.googleRating,
        reviewCount: prospect.reviewCount,
        painPoints,
        previewSiteUrl: prospect.previewSiteUrl,
      },
      language,
      senderName,
      senderEmail,
    });

    // Call Claude directly (no tools within this sub-call)
    const result = await this.client.callWithText(
      [{ role: "user", content: userPrompt }],
      {
        system: OUTREACH_SYSTEM_PROMPT,
        maxTokens: 4096,
      }
    );

    this.totalCost += result.cost;
    this.totalInputTokens += result.inputTokens;
    this.totalOutputTokens += result.outputTokens;

    // Parse the returned JSON
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in Claude response");
      const parsed = JSON.parse(jsonMatch[0]) as {
        email1: GeneratedEmail;
        email2: GeneratedEmail;
        email2Cold: GeneratedEmail;
        email3: GeneratedEmail;
      };

      this.log("info", "Email sequence generated successfully", {
        language,
        prospectId,
      });

      return {
        success: true,
        sequence: parsed,
      };
    } catch (err) {
      this.log("error", "Failed to parse email sequence from Claude", {
        error: err instanceof Error ? err.message : String(err),
        rawText: result.text.slice(0, 500),
      });
      return { error: "Failed to parse email sequence", rawText: result.text };
    }
  }

  // ── Tool: check_daily_limit ────────────────────────────────────────────────

  private async toolCheckDailyLimit(input: Record<string, unknown>): Promise<DailyLimitState> {
    const parsed = CheckDailyLimitInputSchema.safeParse(input);
    const date = parsed.success ? parsed.data.date : new Date().toISOString().slice(0, 10);

    const redis = getRedis();
    const key = `outreach:daily:${date}`;
    const countStr = await redis.get(key);
    const count = parseInt(countStr ?? "0", 10);

    const configLimit = parseInt(process.env["EMAIL_DAILY_LIMIT"] ?? "200", 10);

    // Also check warming limit
    const warming = await this.toolHandleWarming();
    const effectiveLimit = Math.min(configLimit, warming.limit);

    return {
      count,
      limit: effectiveLimit,
      blocked: count >= effectiveLimit,
    };
  }

  // ── Tool: handle_warming ───────────────────────────────────────────────────

  private async toolHandleWarming(): Promise<WarmingState> {
    const redis = getRedis();
    const dayStr = await redis.get("outreach:warming:day");
    const day = parseInt(dayStr ?? "0", 10);
    const limit = getWarmingLimit(day);

    return { day, limit };
  }

  // ── Tool: blacklist_check ──────────────────────────────────────────────────

  private async toolBlacklistCheck(input: Record<string, unknown>): Promise<BlacklistResult> {
    const parsed = BlacklistCheckInputSchema.safeParse(input);
    if (!parsed.success) return { isBlacklisted: false };

    const { email, prospectId } = parsed.data;
    const redis = getRedis();

    // Check Redis blacklist set
    const inRedisBlacklist = await redis.sismember("blacklist:emails", email);
    if (inRedisBlacklist) {
      return { isBlacklisted: true, reason: "Email in Redis blacklist (bounced/unsubscribed)" };
    }

    // Check Prospect status in DB
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: { status: true },
    });

    if (prospect?.status === "BLACKLISTED") {
      return { isBlacklisted: true, reason: "Prospect status is BLACKLISTED" };
    }

    return { isBlacklisted: false };
  }

  // ── Tool: save_outreach_email ──────────────────────────────────────────────

  private async toolSaveOutreachEmail(input: Record<string, unknown>): Promise<unknown> {
    const parsed = SaveOutreachEmailInputSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
    }

    const {
      prospectId,
      stepNumber,
      subject,
      body,
      bodyPlain,
      language,
      fromName,
      fromEmail,
      status,
    } = parsed.data;

    const email = await prisma.outreachEmail.create({
      data: {
        prospectId,
        stepNumber,
        subject,
        body,
        bodyPlain,
        language,
        fromName,
        fromEmail,
        status: status ?? "draft",
      },
    });

    return { emailId: email.id, status: email.status };
  }

  // ── Tool: send_email ───────────────────────────────────────────────────────

  private async toolSendEmail(input: Record<string, unknown>): Promise<unknown> {
    const parsed = SendEmailInputSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
    }

    const {
      emailId,
      toEmail,
      subject,
      bodyHtml,
      bodyPlain,
      fromName,
      fromEmail,
      prospectId,
      stepNumber,
    } = parsed.data;

    // ① Check daily limit before sending
    const today = new Date().toISOString().slice(0, 10);
    const limitState = await this.toolCheckDailyLimit({ date: today });

    if (limitState.blocked) {
      this.log("warn", "Daily email limit reached — deferring send", {
        count: limitState.count,
        limit: limitState.limit,
      });
      return {
        success: false,
        deferred: true,
        reason: `Daily limit reached (${limitState.count}/${limitState.limit})`,
      };
    }

    const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";
    const fromAddress = `${fromName} <${fromEmail}@${domain}>`;

    // ② Inject tracking pixel & link tracking
    const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";
    const trackedHtml = injectTracking(bodyHtml, emailId, apiBase);

    try {
      const result = await sendViaResend({
        from: fromAddress,
        replyTo: `${fromEmail}@${domain}`,
        to: toEmail,
        subject,
        html: trackedHtml,
        text: bodyPlain,
        headers: {
          "X-Entity-Ref-ID": emailId,
        },
      });

      // ③ Update DB
      await prisma.outreachEmail.update({
        where: { id: emailId },
        data: {
          status: "sent",
          sentAt: new Date(),
          fromName,
          fromEmail,
          resendMessageId: result.messageId,
        },
      });

      // ④ Update Prospect status
      await prisma.prospect.update({
        where: { id: prospectId },
        data: {
          status: stepNumber === 1 ? "EMAIL_SENT" : "EMAIL_SENT",
          lastContactedAt: new Date(),
          ...(stepNumber === 1 ? { firstContactedAt: new Date() } : {}),
        },
      });

      // ⑤ Increment daily counter
      const redis = getRedis();
      const counterKey = `outreach:daily:${today}`;
      await redis.incr(counterKey);
      await redis.expire(counterKey, 86400 * 2); // keep 2 days

      this.log("info", `Email sent to ${toEmail} via Resend`, {
        emailId,
        messageId: result.messageId,
        stepNumber,
      });

      return {
        success: true,
        messageId: result.messageId,
        emailId,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.log("error", `Failed to send email ${emailId}: ${errMsg}`);

      await prisma.outreachEmail.update({
        where: { id: emailId },
        data: { status: "draft" },
      });

      return { success: false, error: errMsg };
    }
  }

  // ── Tool: schedule_followup ────────────────────────────────────────────────

  private async toolScheduleFollowup(input: Record<string, unknown>): Promise<unknown> {
    const parsed = ScheduleFollowupInputSchema.safeParse(input);
    if (!parsed.success) {
      return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
    }

    const { prospectId, emailId, stepNumber, delayDays } = parsed.data;

    const redis = getRedis();
    const queue = new Queue("outreach-followup", {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    const delayMs = delayDays * 24 * 60 * 60 * 1000;
    const jobId = `followup-${prospectId}-step${stepNumber}`;

    await queue.add(
      "send-followup",
      {
        prospectId,
        previousEmailId: emailId,
        stepNumber,
      },
      {
        jobId,
        delay: delayMs,
      }
    );

    await queue.close();

    this.log("info", `Follow-up scheduled: step ${stepNumber} in ${delayDays} days`, {
      prospectId,
      emailId,
      jobId,
    });

    return {
      success: true,
      jobId,
      scheduledAt: new Date(Date.now() + delayMs).toISOString(),
      delayDays,
    };
  }

  // ── Main run ───────────────────────────────────────────────────────────────

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const startTime = Date.now();

    const parsed = OutreachInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
    }

    const {
      prospectId,
      stepNumber,
      language: inputLanguage,
      senderName: inputSenderName,
      senderEmail: inputSenderEmail,
      previousEmailOpened,
    } = parsed.data;

    try {
      await this.markJobStarted();
      this.log("info", "OutreachAgent starting", { prospectId, stepNumber });
      await this.updateProgress(5);

      // ── Load prospect ──────────────────────────────────────────────────────
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        include: {
          outreachEmails: {
            orderBy: { stepNumber: "asc" },
            select: { id: true, stepNumber: true, status: true, openedAt: true },
          },
        },
      });

      if (!prospect) {
        const error = `Prospect ${prospectId} not found`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      if (!prospect.contactEmail) {
        const error = "Prospect has no contact email";
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(10);

      // ── Blacklist check ────────────────────────────────────────────────────
      const blacklistResult = await this.toolBlacklistCheck({
        email: prospect.contactEmail,
        prospectId,
      });

      if (blacklistResult.isBlacklisted) {
        const error = `Prospect is blacklisted: ${blacklistResult.reason}`;
        this.log("warn", error);
        await this.markJobFailed(error);
        return { success: false, error, apiCost: 0, tokensUsed: 0, durationMs: 0, toolCalls: [] };
      }

      await this.updateProgress(15);

      // ── Daily limit check ──────────────────────────────────────────────────
      const today = new Date().toISOString().slice(0, 10);
      const limitState = await this.toolCheckDailyLimit({ date: today });

      if (limitState.blocked) {
        const error = `Daily email limit reached (${limitState.count}/${limitState.limit})`;
        this.log("warn", error);
        // Don't fail the job — just queue email as 'queued' for later
        await this.markJobCompleted({ deferred: true, reason: error });
        return {
          success: true,
          data: { deferred: true, reason: error },
          apiCost: this.totalCost,
          tokensUsed: this.totalInputTokens + this.totalOutputTokens,
          durationMs: Date.now() - startTime,
          toolCalls: this.toolCalls,
        };
      }

      await this.updateProgress(20);

      // ── Determine language & sender ────────────────────────────────────────
      const language = inputLanguage !== "de"
        ? inputLanguage
        : (COUNTRY_LANGUAGES[prospect.country as keyof typeof COUNTRY_LANGUAGES] ?? "en");

      const sender = {
        name: inputSenderName ?? pickSender().name,
        email: inputSenderEmail ?? pickSender().email,
      };

      const painPoints = (prospect.painPoints as PainPoint[] | null) ?? [];

      await this.updateProgress(25);

      // ── For step 1: Generate full sequence and send email 1 ────────────────
      if (stepNumber === 1) {
        // Generate full sequence
        this.log("info", "Generating email sequence via Claude");
        const seqResult = await this.toolGenerateEmailSequence({
          prospectId,
          language,
          senderName: sender.name,
          senderEmail: sender.email,
        }) as { success: boolean; sequence?: {
          email1: GeneratedEmail;
          email2: GeneratedEmail;
          email2Cold: GeneratedEmail;
          email3: GeneratedEmail;
        }; error?: string };

        if (!seqResult.success || !seqResult.sequence) {
          const error = seqResult.error ?? "Failed to generate email sequence";
          await this.markJobFailed(error);
          return { success: false, error, apiCost: this.totalCost, tokensUsed: this.totalInputTokens + this.totalOutputTokens, durationMs: Date.now() - startTime, toolCalls: this.toolCalls };
        }

        const { email1, email2, email2Cold, email3 } = seqResult.sequence;

        await this.updateProgress(60);

        // Save email 1 + send it
        const saveResult = await this.toolSaveOutreachEmail({
          prospectId,
          stepNumber: 1,
          subject: email1.subject,
          body: email1.body,
          bodyPlain: email1.bodyPlain,
          language,
          fromName: email1.fromName,
          fromEmail: email1.fromEmail,
          status: "draft",
        }) as { emailId: string; error?: string };

        if (saveResult.error) {
          await this.markJobFailed(saveResult.error);
          return { success: false, error: saveResult.error, apiCost: this.totalCost, tokensUsed: this.totalInputTokens + this.totalOutputTokens, durationMs: Date.now() - startTime, toolCalls: this.toolCalls };
        }

        const email1Id = saveResult.emailId;

        await this.updateProgress(70);

        const sendResult = await this.toolSendEmail({
          emailId: email1Id,
          toEmail: prospect.contactEmail,
          subject: email1.subject,
          bodyHtml: email1.body,
          bodyPlain: email1.bodyPlain,
          fromName: email1.fromName,
          fromEmail: email1.fromEmail,
          prospectId,
          stepNumber: 1,
        }) as { success: boolean; deferred?: boolean; error?: string };

        await this.updateProgress(80);

        if (!sendResult.success && !sendResult.deferred) {
          this.log("warn", "Email 1 send failed, saving remaining as draft");
        }

        // Save email 2, 2-cold, and 3 as drafts for future scheduling
        const [e2Save, e2cSave, e3Save] = await Promise.all([
          this.toolSaveOutreachEmail({
            prospectId,
            stepNumber: 2,
            subject: email2.subject,
            body: email2.body,
            bodyPlain: email2.bodyPlain,
            language,
            fromName: email2.fromName,
            fromEmail: email2.fromEmail,
            status: "draft",
          }),
          this.toolSaveOutreachEmail({
            prospectId,
            stepNumber: 2, // same step, alternative variant
            subject: email2Cold.subject,
            body: email2Cold.body,
            bodyPlain: email2Cold.bodyPlain,
            language,
            fromName: email2Cold.fromName,
            fromEmail: email2Cold.fromEmail,
            status: "draft",
          }),
          this.toolSaveOutreachEmail({
            prospectId,
            stepNumber: 3,
            subject: email3.subject,
            body: email3.body,
            bodyPlain: email3.bodyPlain,
            language,
            fromName: email3.fromName,
            fromEmail: email3.fromEmail,
            status: "draft",
          }),
        ]);

        await this.updateProgress(90);

        // Schedule follow-ups
        if (sendResult.success) {
          await this.toolScheduleFollowup({
            prospectId,
            emailId: email1Id,
            stepNumber: 2,
            delayDays: 4,
          });
        }

        const output = {
          prospectId,
          stepNumber: 1,
          email1Id,
          email2Id: (e2Save as { emailId?: string }).emailId,
          email2ColdId: (e2cSave as { emailId?: string }).emailId,
          email3Id: (e3Save as { emailId?: string }).emailId,
          language,
          senderName: sender.name,
          sent: sendResult.success,
          deferred: sendResult.deferred ?? false,
        };

        await this.markJobCompleted(output);
        return {
          success: true,
          data: output,
          apiCost: this.totalCost,
          tokensUsed: this.totalInputTokens + this.totalOutputTokens,
          durationMs: Date.now() - startTime,
          toolCalls: this.toolCalls,
        };
      }

      // ── For steps 2 & 3: Send existing draft emails ────────────────────────
      // Find the appropriate draft email for this step
      // For step 2: check if email 1 was opened to pick warm vs cold variant
      let targetEmail: {
        id: string;
        subject: string;
        body: string;
        bodyPlain: string | null;
        fromName: string | null;
        fromEmail: string | null;
      } | null = null;

      if (stepNumber === 2) {
        // If previousEmailOpened is explicitly provided, use it; otherwise check DB
        let wasOpened = previousEmailOpened ?? false;
        if (previousEmailOpened === undefined) {
          const prevEmail = await prisma.outreachEmail.findFirst({
            where: { prospectId, stepNumber: 1, status: { in: ["sent", "opened", "clicked"] } },
            select: { openedAt: true },
          });
          wasOpened = prevEmail?.openedAt !== null && prevEmail?.openedAt !== undefined;
        }

        // Pick warm variant if opened, cold otherwise
        // Warm variant is the one with more words (heuristic) — or we track by index
        // Since both are saved as stepNumber=2, we get them ordered by createdAt
        const drafts = await prisma.outreachEmail.findMany({
          where: { prospectId, stepNumber: 2, status: "draft" },
          orderBy: { createdAt: "asc" },
        });

        // First draft saved = warm (email2), second = cold (email2Cold)
        targetEmail = wasOpened
          ? (drafts[0] ?? null)
          : (drafts[1] ?? drafts[0] ?? null);
      } else if (stepNumber === 3) {
        targetEmail = await prisma.outreachEmail.findFirst({
          where: { prospectId, stepNumber: 3, status: "draft" },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!targetEmail) {
        // No draft found: generate a single email on the fly
        this.log("warn", `No draft found for step ${stepNumber}, generating fresh email`);

        const singlePrompt = buildOutreachPrompt({
          prospect: {
            companyName: prospect.companyName,
            contactName: prospect.contactName,
            sector: prospect.sector,
            country: prospect.country,
            website: prospect.website,
            googleRating: prospect.googleRating,
            reviewCount: prospect.reviewCount,
            painPoints,
            previewSiteUrl: prospect.previewSiteUrl,
          },
          language,
          senderName: sender.name,
          senderEmail: sender.email,
        });

        const result = await this.client.callWithText(
          [{ role: "user", content: `${singlePrompt}\n\nReturn only email${stepNumber} as a JSON object with subject, body, bodyPlain, fromName, fromEmail fields.` }],
          { system: OUTREACH_SYSTEM_PROMPT, maxTokens: 2048 }
        );

        this.totalCost += result.cost;
        this.totalInputTokens += result.inputTokens;
        this.totalOutputTokens += result.outputTokens;

        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in response");
          const generated = JSON.parse(jsonMatch[0]) as GeneratedEmail;

          const saveResult = await this.toolSaveOutreachEmail({
            prospectId,
            stepNumber,
            subject: generated.subject,
            body: generated.body,
            bodyPlain: generated.bodyPlain,
            language,
            fromName: generated.fromName,
            fromEmail: generated.fromEmail,
            status: "draft",
          }) as { emailId: string };

          targetEmail = await prisma.outreachEmail.findUnique({
            where: { id: saveResult.emailId },
          });
        } catch {
          const error = "Failed to generate fallback email";
          await this.markJobFailed(error);
          return { success: false, error, apiCost: this.totalCost, tokensUsed: this.totalInputTokens + this.totalOutputTokens, durationMs: Date.now() - startTime, toolCalls: this.toolCalls };
        }
      }

      if (!targetEmail) {
        const error = `No email found for step ${stepNumber}`;
        await this.markJobFailed(error);
        return { success: false, error, apiCost: this.totalCost, tokensUsed: this.totalInputTokens + this.totalOutputTokens, durationMs: Date.now() - startTime, toolCalls: this.toolCalls };
      }

      await this.updateProgress(70);

      const sendResult = await this.toolSendEmail({
        emailId: targetEmail.id,
        toEmail: prospect.contactEmail,
        subject: targetEmail.subject,
        bodyHtml: targetEmail.body,
        bodyPlain: targetEmail.bodyPlain ?? targetEmail.subject,
        fromName: targetEmail.fromName ?? sender.name,
        fromEmail: targetEmail.fromEmail ?? sender.email,
        prospectId,
        stepNumber,
      }) as { success: boolean; deferred?: boolean };

      await this.updateProgress(90);

      // Schedule next follow-up if this was step 2
      if (stepNumber === 2 && sendResult.success) {
        await this.toolScheduleFollowup({
          prospectId,
          emailId: targetEmail.id,
          stepNumber: 3,
          delayDays: 5, // day 9 from day 4 = 5 more days
        });
      }

      const output = {
        prospectId,
        stepNumber,
        emailId: targetEmail.id,
        language,
        sent: sendResult.success,
        deferred: sendResult.deferred ?? false,
      };

      await this.markJobCompleted(output);

      return {
        success: true,
        data: output,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: Date.now() - startTime,
        toolCalls: this.toolCalls,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log("error", `OutreachAgent failed: ${error}`);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: this.totalInputTokens + this.totalOutputTokens,
        durationMs: Date.now() - startTime,
        toolCalls: this.toolCalls,
      };
    }
  }
}

// ─── Tracking injection helper ────────────────────────────────────────────────

function injectTracking(html: string, emailId: string, apiBase: string): string {
  // Replace tracking pixel placeholder
  let result = html.replace(
    /https:\/\/api\.madecreative\.pro\/track\/open\/\{\{EMAIL_ID\}\}/g,
    `${apiBase}/track/open/${emailId}`
  );

  // Replace tracking click placeholder
  result = result.replace(
    /https:\/\/api\.madecreative\.pro\/track\/click\/\{\{EMAIL_ID\}\}/g,
    `${apiBase}/track/click/${emailId}`
  );

  // Inject tracking pixel before </body> if not already present
  if (!result.includes(`/track/open/${emailId}`)) {
    const pixel = `<img src="${apiBase}/track/open/${emailId}" width="1" height="1" alt="" style="display:none;border:0;outline:none;text-decoration:none" />`;
    result = result.replace(/<\/body>/i, `${pixel}</body>`);
    if (!result.includes("</body>")) {
      result += pixel;
    }
  }

  return result;
}
