import { logger } from "../utils/logger";

export interface PromptPayload {
  context: string;
  history: string;
  question: string;
}

/**
 * Builds the text prompt sent to the LLM including context, conversation history, and current question.
 */
export function buildChatPrompt({ context, history, question }: PromptPayload): string {
  logger.info("Building chat prompt with context and history");
  return `Selected Documents Context:
${context}

Conversation History:
${history}

Current User Message:
User: ${question}
`;
}

/**
 * Returns the system instruction setting boundaries, RAG expectations, citations, and schemas.
 */
export function buildSystemInstruction(): string {
  return `You are Menteea, an elite, helpful AI research assistant.
Your main job is to answer the user's question based on the provided documents.

CRITICAL INSTRUCTIONS FOR GROUNDED RAG:
1. Grounding: Answer using the provided documents. If the answer is found in the documents, construct a detailed, elegant, and fully accurate response.
2. Citations: When citing facts or concepts, ALWAYS append page references in the exact format: "(Page X)" (e.g., "The model achieved 94% accuracy (Page 12)"). Multiple pages can be cited as "(Page 3, Page 4)". Clickable citations will navigate to the page, so use this exact "(Page X)" syntax. Do not make up page numbers; only cite pages that are explicitly present in the provided XML context.
3. General Knowledge: If the answer cannot be found in the documents, or if the user asks for general information unrelated to the files, you MUST explicitly indicate that the answer is based on general knowledge rather than the uploaded material. Never fabricate facts about the document.
4. Suggestions: Along with your response, generate 4-5 highly relevant, specific follow-up questions that the user might want to ask next based on your response and the document context.
5. Markdown formatting: Use rich markdown for tables, bulleted lists, bold accents, blockquotes, and code blocks to make your response extremely readable and professional.

Return your response strictly as a JSON object matching this schema:
- "text": your markdown-formatted response with page citations where appropriate.
- "suggestions": an array of 4-5 relevant follow-up questions.`;
}