import { z } from "zod";

export const ChatbotAgentInputSchema = z.object({
  clientId: z.string().cuid(),
  chatbotId: z.string().cuid().optional(),
});

export const ChatbotAgentOutputSchema = z.object({
  chatbotId: z.string(),
  knowledgeBase: z.object({
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
    businessInfo: z.object({
      name: z.string(),
      description: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      hours: z.string().optional(),
    }),
    services: z.array(
      z.object({ name: z.string(), description: z.string(), price: z.string().optional() })
    ),
  }),
  status: z.string(),
});

export type ChatbotAgentInput = z.infer<typeof ChatbotAgentInputSchema>;
export type ChatbotAgentOutput = z.infer<typeof ChatbotAgentOutputSchema>;
