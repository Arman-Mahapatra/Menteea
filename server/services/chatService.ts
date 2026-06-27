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

  /**
   * Generates a hierarchical knowledge structure for document concept mapping.
   */
  public async generateMindMap(
    apiKey: string,
    documentName: string,
    documentContext: string
  ): Promise<any> {
    logger.info(`Generating mind map structure for "${documentName}" via Gemini API`);
    const ai = this.getGenAI(apiKey);

    const prompt = `Analyze the uploaded document named "${documentName}" and build a detailed hierarchical knowledge structure for a mind map visualization.
Identify the core central concept, 3-5 major subtopics, and granular child concepts with brief definitions.

Document Content:
${documentContext.slice(0, 150000)}
`;

    const systemInstruction = `You are Menteea's Mind Map Generator. Analyze the document and build a hierarchical knowledge graph structure.
Return a single JSON object matching the MindMapNode schema recursively.
- The root node should represent the overall document title or main topic.
- It must have 3-5 major topics under "children".
- Each major topic should have 2-4 subtopics or core concepts.
- Provide a concise 1-sentence user-friendly explanation/definition for each node in "description".
Ensure that the JSON is fully valid and strictly matches the recursive "children", "title", and "description" schema.`;

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
              title: {
                type: Type.STRING,
                description: "The name of the main topic or overall document name."
              },
              description: {
                type: Type.STRING,
                description: "A short 1-sentence summary of what this document/topic is about."
              },
              children: {
                type: Type.ARRAY,
                description: "Main branches or themes of the document.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "The major topic name."
                    },
                    description: {
                      type: Type.STRING,
                      description: "A short 1-sentence description/definition of this major topic."
                    },
                    children: {
                      type: Type.ARRAY,
                      description: "Subtopics, key sections, or main concepts of this major topic.",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: {
                            type: Type.STRING,
                            description: "The subtopic or concept name."
                          },
                          description: {
                            type: Type.STRING,
                            description: "A 1-sentence description of this subtopic."
                          },
                          children: {
                            type: Type.ARRAY,
                            description: "Deep key definitions, specifics, examples, or granular concepts.",
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                title: {
                                  type: Type.STRING,
                                  description: "Granular concept, key term, or example."
                                },
                                description: {
                                  type: Type.STRING,
                                  description: "Concise definition or explanation of this term/concept."
                                }
                              },
                              required: ["title", "description"]
                            }
                          }
                        },
                        required: ["title", "description"]
                      }
                    }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["title", "description"]
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

  /**
   * Generates a high-quality educational quiz based on the document contents.
   */
  public async generateQuiz(
    apiKey: string,
    documentName: string,
    documentContext: string
  ): Promise<any> {
    logger.info(`Generating quiz for "${documentName}" via Gemini API`);
    const ai = this.getGenAI(apiKey);

    const prompt = `Analyze the uploaded document named "${documentName}" and generate an interactive quiz of exactly 10 questions.
The quiz should test conceptual understanding rather than trivial memorization, cover different sections of the document, and mix difficulty levels (easy, medium, hard).
Ground all questions strictly in the document content. Do not hallucinate external topics.
Identify the main categories/topics from the document so each question is mapped to a specific category (e.g. "Spread Spectrum", "Multiplexing", etc.).

Document Content:
${documentContext.slice(0, 150000)}
`;

    const systemInstruction = `You are Menteea's Quiz Generator. Analyze the document and build a high-quality quiz structure.
Return a single JSON object strictly matching the schema requested.
- Create exactly 10 questions.
- Each question must have a 'question' text, 4 distinct options under 'options', 'correctAnswer' (0-indexed index of the correct option, i.e., 0, 1, 2, or 3), a detailed 'explanation' justifying the correct option, and a 'category' (the conceptual topic of the question, e.g. "Synchronous TDM", "Spread Spectrum", etc.) to help evaluate weak and strong learning areas.
- Ensure all questions are grounded strictly in the provided document context.`;

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
              title: {
                type: Type.STRING,
                description: "The name/title of the quiz."
              },
              description: {
                type: Type.STRING,
                description: "A short description of what this quiz covers."
              },
              questions: {
                type: Type.ARRAY,
                description: "List of exactly 10 quiz questions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                      description: "The conceptual question text."
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 distinct multiple-choice options."
                    },
                    correctAnswer: {
                      type: Type.INTEGER,
                      description: "The 0-indexed index of the correct option inside the options array (must be 0, 1, 2, or 3)."
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "A detailed AI explanation explaining why this option is correct and why others are incorrect."
                    },
                    category: {
                      type: Type.STRING,
                      description: "The specific subtopic/category this question belongs to (e.g., 'Synchronous TDM', 'Statistical TDM', 'Spread Spectrum') to classify weak/strong areas."
                    }
                  },
                  required: ["question", "options", "correctAnswer", "explanation", "category"]
                }
              }
            },
            required: ["title", "description", "questions"]
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

  /**
   * Generates a structured comprehensive Revision Study Guide based on the document context.
   */
  public async generateStudyGuide(
    apiKey: string,
    documentName: string,
    documentContext: string
  ): Promise<any> {
    logger.info(`Generating study guide for "${documentName}" via Gemini API`);
    const ai = this.getGenAI(apiKey);

    const prompt = `Analyze the uploaded document named "${documentName}" and generate a comprehensive structured study and revision guide.
The study guide must transform this document into a highly detailed learning resource.
Ground everything strictly in the document context. Do not hallucinate external topics.
If there are mathematical formulas or technical equations in the text, extract them into the formulae array. If there are none, return an empty array for formulae.

Document Content:
${documentContext.slice(0, 150000)}
`;

    const systemInstruction = `You are Menteea's Study Guide Generator. Analyze the document and build a high-quality, comprehensive study workspace companion.
Return a single JSON object strictly matching the schema requested.
- Provide a clear title, a detailed chapter overview (including learning objectives), key concepts (including explanation and why it matters), important definitions, formulae (leave empty if none exist), sequential processes or workflows, common student exam mistakes, a revision checklist, and an interactive flashcard deck of 10-20 cards.`;

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
              title: {
                type: Type.STRING,
                description: "Structured, descriptive title of the study guide."
              },
              overview: {
                type: Type.STRING,
                description: "A comprehensive chapter overview including what the chapter teaches and learning objectives."
              },
              keyConcepts: {
                type: Type.ARRAY,
                description: "List of major concepts with explanation and practical importance.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    whyItMatters: { type: Type.STRING }
                  },
                  required: ["concept", "explanation", "whyItMatters"]
                }
              },
              importantDefinitions: {
                type: Type.ARRAY,
                description: "Key terms and their respective concise study definitions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              },
              formulae: {
                type: Type.ARRAY,
                description: "Formulas, equations, or mathematical representations (leave empty if none exist in the document).",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    formula: { type: Type.STRING, description: "The mathematical formula, equation, or short relationship." },
                    meaning: { type: Type.STRING, description: "Conceptual meaning of the relationship." },
                    variables: { type: Type.STRING, description: "Detailed list of variables and what they represent." },
                    usage: { type: Type.STRING, description: "How and when to apply this formula." }
                  },
                  required: ["formula", "meaning", "variables", "usage"]
                }
              },
              processes: {
                type: Type.ARRAY,
                description: "Workflows, sequence of steps, or system processes broken down chronologically.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The name of the process or sequence." },
                    steps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of clean sequential steps (e.g. 'Step 1...', 'Step 2...')."
                    }
                  },
                  required: ["name", "steps"]
                }
              },
              examTips: {
                type: Type.ARRAY,
                description: "Strategic tips, key focal points for preparation, and advice for assessments.",
                items: { type: Type.STRING }
              },
              commonMistakes: {
                type: Type.ARRAY,
                description: "Common student errors, misconceptions, and confusion points with correct insights.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mistake: { type: Type.STRING, description: "What students commonly confuse, mix up, or miscalculate." },
                    correction: { type: Type.STRING, description: "The correct concept or accurate methodology." },
                    explanation: { type: Type.STRING, description: "Deep pedagogical explanation of why the mistake happens and how to avoid it." }
                  },
                  required: ["mistake", "correction", "explanation"]
                }
              },
              revisionChecklist: {
                type: Type.ARRAY,
                description: "Highly actionable checkable revision milestones (e.g., 'Understand TDM concept', 'Compare FDM vs TDM').",
                items: { type: Type.STRING }
              },
              flashcards: {
                type: Type.ARRAY,
                description: "A solid deck of 10 to 20 flashcards for rapid interactive revision.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: [
              "title",
              "overview",
              "keyConcepts",
              "importantDefinitions",
              "formulae",
              "processes",
              "examTips",
              "commonMistakes",
              "revisionChecklist",
              "flashcards"
            ]
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


