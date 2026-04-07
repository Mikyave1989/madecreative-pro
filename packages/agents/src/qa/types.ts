import { z } from "zod";

export const QaInputSchema = z.object({
  targetType: z.enum(["website", "email", "social_post", "chatbot"]),
  targetId: z.string().cuid(),
  checkList: z.array(z.string()).optional(),
});

export const QaIssueSchema = z.object({
  type: z.string(),
  severity: z.enum(["info", "warning", "error"]),
  description: z.string(),
  suggestion: z.string(),
  location: z.string().optional(),
});

export const QaOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  issues: z.array(QaIssueSchema),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type QaInput = z.infer<typeof QaInputSchema>;
export type QaOutput = z.infer<typeof QaOutputSchema>;
export type QaIssue = z.infer<typeof QaIssueSchema>;
