import { CHATBOT_SYSTEM_PROMPT } from "@madecreative/ai";

export { CHATBOT_SYSTEM_PROMPT };

export function buildChatbotSetupPrompt(client: {
  companyName: string;
  sector: string;
  language: string;
  city?: string | null;
}): string {
  return `Generate a complete chatbot knowledge base and configuration for this business:

Company: ${client.companyName}
Sector: ${client.sector}
Language: ${client.language}
Location: ${client.city ?? ""}

Please:
1. Generate 10-15 realistic FAQ questions and answers in ${client.language}
2. Create a professional business description
3. List 5-8 typical services for a ${client.sector} business
4. Set appropriate chatbot personality (tone, greeting, fallback message)
5. Suggest widget colors that match the ${client.sector} sector

Then use the save_chatbot tool to save the configuration with clientId provided.`;
}
