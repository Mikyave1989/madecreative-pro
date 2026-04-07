import { z } from "zod";

export const ChatbotAgentInputSchema = z.object({
  clientId: z.string().cuid(),
  chatbotId: z.string().cuid().optional(),
  websiteUrl: z.string().url().optional(),
  forceRetrain: z.boolean().default(false),
});

export const FAQSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
});

export const BusinessInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  hours: z.string().optional(),
  website: z.string().optional(),
});

export const ServiceInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.string().optional(),
});

export const KnowledgeBaseSchema = z.object({
  faqs: z.array(FAQSchema),
  businessInfo: BusinessInfoSchema,
  services: z.array(ServiceInfoSchema),
  policies: z.array(z.string()).optional(),
  customRules: z.array(z.string()).optional(),
});

export const ChatbotPersonaSchema = z.object({
  name: z.string(),
  tone: z.enum(["professional", "friendly", "casual", "formal", "warm", "energetic"]),
  language: z.string(),
  greeting: z.string(),
  fallbackMessage: z.string(),
  openingPhrases: z.array(z.string()).optional(),
});

export const WidgetConfigSchema = z.object({
  position: z.enum(["bottom-right", "bottom-left"]),
  primaryColor: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  avatarUrl: z.string().optional(),
  avatarEmoji: z.string().optional(),
});

export const TestResultSchema = z.object({
  question: z.string(),
  response: z.string(),
  score: z.number().min(1).max(10),
  feedback: z.string().optional(),
});

export const ChatbotAgentOutputSchema = z.object({
  chatbotId: z.string(),
  knowledgeBase: KnowledgeBaseSchema,
  persona: ChatbotPersonaSchema,
  widgetConfig: WidgetConfigSchema,
  testResults: z.array(TestResultSchema).optional(),
  avgTestScore: z.number().optional(),
  status: z.string(),
});

export type ChatbotAgentInput = z.infer<typeof ChatbotAgentInputSchema>;
export type ChatbotAgentOutput = z.infer<typeof ChatbotAgentOutputSchema>;
export type KnowledgeBaseData = z.infer<typeof KnowledgeBaseSchema>;
export type ChatbotPersonaData = z.infer<typeof ChatbotPersonaSchema>;
export type WidgetConfigData = z.infer<typeof WidgetConfigSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type FAQData = z.infer<typeof FAQSchema>;
export type ServiceInfoData = z.infer<typeof ServiceInfoSchema>;
export type BusinessInfoData = z.infer<typeof BusinessInfoSchema>;
