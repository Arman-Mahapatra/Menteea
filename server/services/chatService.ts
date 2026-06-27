import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "../utils/logger";
import { buildChatPrompt, buildSystemInstruction } from "../rag/promptBuilder";
import { RetrievalService } from "./retrievalService";

export class ChatService {
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private getGenAI(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        const errStr = String(error).toLowerCase();
        const isRetryable =
          errStr.includes("503") ||
          errStr.includes("service unavailable") ||
          errStr.includes("resource exhausted") ||
          errStr.includes("429") ||
          errStr.includes("overloaded") ||
          errStr.includes("timeout") ||
          errStr.includes("fetch failed") ||
          errStr.includes("socket hang up") ||
          errStr.includes("econnreset");

        if (isRetryable && attempt < retries) {
          logger.warn(`Gemini API call failed (Attempt ${attempt}/${retries}): ${error.message || error}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }
    throw new Error("Maximum retries reached for Gemini API call.");
  }

  /**
   * Generates conversational responses using the provided context chunks, dialogue history, and user question.
   */
  public async generateChatResponse(
    apiKey: string,
    context: string,
    history: string,
    question: string,
    selectedDocumentIds?: string[]
  ): Promise<{ text: string; suggestions: string[] }> {
    logger.info("Generating chat response via Gemini API");
    
    let activeContext = context;
    let chunkCount = 0;
    let docCount = 0;

    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      logger.info(`[ChatService] RAG Lite triggered. Retrieving chunks for question from selected documents: [${selectedDocumentIds.join(", ")}]`);
      try {
        const retrievalService = RetrievalService.getInstance();
        const matchedChunks = await retrievalService.retrieveRelevantContext(question, selectedDocumentIds, 5, apiKey);
        
        chunkCount = matchedChunks.length;
        const uniqueDocs = new Set(matchedChunks.map(c => c.documentId));
        docCount = uniqueDocs.size;

        logger.info(`[ChatService] Retrieved ${chunkCount} chunks from ${docCount} selected documents`);

        if (matchedChunks.length > 0) {
          activeContext = "Here is the context retrieved from the selected documents:\n\n";
          matchedChunks.forEach((chunk) => {
            activeContext += `<document name="${chunk.documentName}">\n`;
            activeContext += `<page number="${chunk.pageNumber}">\n${chunk.text}\n</page>\n`;
            activeContext += `</document>\n\n`;
          });
        } else {
          activeContext = "No relevant document chunks could be found.";
        }
      } catch (err) {
        logger.error("[ChatService] Error during context retrieval, falling back to full context:", err);
      }
    }

    const prompt = buildChatPrompt({ context: activeContext, history, question });
    const systemInstruction = buildSystemInstruction();
    const ai = this.getGenAI(apiKey);

    const response = await this.callWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The detailed response, formatted beautifully in markdown, with (Page X) citations."
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4-5 highly specific suggested follow-up questions."
              }
            },
            required: ["text", "suggestions"]
          }
        }
      })
    );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API.");
    }

    const parsed = JSON.parse(resultText);

    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      const infoHeader = `*Retrieved ${chunkCount} relevant chunks from ${docCount} selected documents.*\n\n`;
      parsed.text = infoHeader + parsed.text;
    }

    return parsed;
  }

  /**
   * Generates high-quality document summary, topics list, purpose statement, and suggested initial inquiries.
   */
  public async generateDocumentSummary(
    apiKey: string,
    documentName: string,
    documentContext: string
  ): Promise<{ summary: string; topics: string[]; purpose: string; suggestions: string[] }> {
    logger.info(`Generating document summary for "${documentName}" via Gemini API`);
    const ai = this.getGenAI(apiKey);

    const prompt = `Analyze the uploaded document named "${documentName}" and generate a high-quality summary, key topics list, its core purpose, and 4-5 initial smart suggested questions.

Document Content:
${documentContext.slice(0, 150000)} // Limit content to fit within a safe size if extremely large
`;

    const systemInstruction = `You are Menteea's document analysis engine. Analyze the document and generate a structured summary.
Return a JSON object conforming strictly to the requested schema.
- The "summary" should be a concise, professional 1-2 paragraph summary of the document.
- The "topics" should be a list of 3-5 main themes or key concepts.
- The "purpose" should be a 1-sentence statement describing the main objective of the document.
- The "suggestions" should be a list of 4-5 intelligent suggested questions a user can ask about this specific document (e.g., "Summarize Chapter 1", "Explain the methodology", "What are the core conclusions?"). Make them very specific to the actual contents of this document.`;

    const response = await this.callWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Concise professional summary of the document (1-2 paragraphs)."
              },
              topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 key topics/themes discussed in the document."
              },
              purpose: {
                type: Type.STRING,
                description: "A one-sentence statement of the document's core purpose."
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4-5 intelligent follow-up suggestions specific to the document contents."
              }
            },
            required: ["summary", "topics", "purpose", "suggestions"]
          }
        }
      })
    );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API.");
    }

    return JSON.parse(resultText);
  }
}
export default ChatService;
