import { z } from "zod";

// ─── Input / Output schemas ───────────────────────────────────────────────────

export const OutreachInputSchema = z.object({
  prospectId: z.string().cuid(),
  stepNumber: z.number().int().min(1).max(3),
  language: z.string().default("de"),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  /** Whether the previous email in the sequence was opened */
  previousEmailOpened: z.boolean().optional(),
});

export const OutreachOutputSchema = z.object({
  emailId: z.string(),
  subject: z.string(),
  body: z.string(),
  bodyPlain: z.string(),
  prospectId: z.string(),
  stepNumber: z.number(),
  language: z.string(),
  status: z.string(),
  fromName: z.string(),
  fromEmail: z.string(),
});

export type OutreachInput = z.infer<typeof OutreachInputSchema>;
export type OutreachOutput = z.infer<typeof OutreachOutputSchema>;

// ─── Email generation ─────────────────────────────────────────────────────────

export interface GeneratedEmail {
  subject: string;
  body: string;
  bodyPlain: string;
  fromName: string;
  fromEmail: string;
}

export interface EmailSequence {
  email1: GeneratedEmail;
  email2: GeneratedEmail;
  email2Cold: GeneratedEmail; // alternative if email1 not opened
  email3: GeneratedEmail;
}

// ─── Warming ──────────────────────────────────────────────────────────────────

export interface WarmingState {
  day: number;
  limit: number;
}

// ─── Daily limit ──────────────────────────────────────────────────────────────

export interface DailyLimitState {
  count: number;
  limit: number;
  blocked: boolean;
}

// ─── Blacklist check ──────────────────────────────────────────────────────────

export interface BlacklistResult {
  isBlacklisted: boolean;
  reason?: string;
}

// ─── Tool input schemas (Zod) ─────────────────────────────────────────────────

export const GenerateEmailSequenceInputSchema = z.object({
  prospectId: z.string(),
  language: z.string(),
  senderName: z.string(),
  senderEmail: z.string(),
});

export const SendEmailInputSchema = z.object({
  emailId: z.string(),
  toEmail: z.string().email(),
  subject: z.string(),
  bodyHtml: z.string(),
  bodyPlain: z.string(),
  fromName: z.string(),
  fromEmail: z.string(),
  prospectId: z.string(),
  stepNumber: z.number().int(),
});

export const CheckDailyLimitInputSchema = z.object({
  date: z.string(), // YYYY-MM-DD
});

export const HandleWarmingInputSchema = z.object({});

export const ScheduleFollowupInputSchema = z.object({
  prospectId: z.string(),
  emailId: z.string(),
  stepNumber: z.number().int(),
  delayDays: z.number().int(),
});

export const BlacklistCheckInputSchema = z.object({
  email: z.string().email(),
  prospectId: z.string(),
});

export const SaveOutreachEmailInputSchema = z.object({
  prospectId: z.string(),
  stepNumber: z.number().int().min(1).max(3),
  subject: z.string(),
  body: z.string(),
  bodyPlain: z.string(),
  language: z.string(),
  fromName: z.string(),
  fromEmail: z.string(),
  status: z.string().default("draft"),
});

export type GenerateEmailSequenceInput = z.infer<typeof GenerateEmailSequenceInputSchema>;
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;
export type CheckDailyLimitInput = z.infer<typeof CheckDailyLimitInputSchema>;
export type ScheduleFollowupInput = z.infer<typeof ScheduleFollowupInputSchema>;
export type BlacklistCheckInput = z.infer<typeof BlacklistCheckInputSchema>;
export type SaveOutreachEmailInput = z.infer<typeof SaveOutreachEmailInputSchema>;
