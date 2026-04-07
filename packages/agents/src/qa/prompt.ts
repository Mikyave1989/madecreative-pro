import { QA_SYSTEM_PROMPT } from "@madecreative/ai";

export { QA_SYSTEM_PROMPT };

export function buildQaPrompt(params: {
  targetType: string;
  content: unknown;
  language?: string;
}): string {
  return `Please perform a quality review on the following ${params.targetType} content:

${JSON.stringify(params.content, null, 2)}

Language: ${params.language ?? "auto-detect"}

Check for:
1. Grammar and spelling errors
2. Cultural appropriateness
3. SEO optimization (if applicable)
4. CTA clarity
5. Tone consistency
6. Legal compliance (GDPR mentions, privacy policy)

Provide a score from 0-100 and specific improvement suggestions.
Use the save_qa_result tool to save your findings.`;
}
