import { z } from "zod";

export const OutreachInputSchema = z.object({
  prospectId: z.string().cuid(),
  stepNumber: z.number().int().min(1).max(4),
  language: z.string().default("de"),
  senderName: z.string().optional(),
});

export const OutreachOutputSchema = z.object({
  emailId: z.string(),
  subject: z.string(),
  body: z.string(),
  prospectId: z.string(),
  stepNumber: z.number(),
  language: z.string(),
  status: z.string(),
});

export type OutreachInput = z.infer<typeof OutreachInputSchema>;
export type OutreachOutput = z.infer<typeof OutreachOutputSchema>;
