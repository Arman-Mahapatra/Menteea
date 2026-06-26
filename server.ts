import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Get GoogleGenAI instance dynamically (using client key if provided, fallback to environment)
function getGenAI(req: express.Request) {
  const customKey = req.headers["x-api-key"] as string;
  const activeKey = customKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("No Gemini API key found. Please configure it in your Settings, or enter it in the app workspace.");
  }
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper function to retry Gemini API calls with exponential backoff on retryable errors (e.g. 503, 429)
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
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
        console.warn(`Gemini API call failed (Attempt ${attempt}/${retries}): ${error.message || error}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("Maximum retries reached for Gemini API call.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

// Endpoint to summarize a PDF document and generate initial suggestions
app.post("/api/summarize", async (req, res) => {
  try {
    const { documentName, pages } = req.body;
    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: "Document must contain pages with text." });
    }

    // Format pages for context
    const documentContext = pages
      .map((p: any) => `[Page ${p.pageNumber}]\n${p.text}`)
      .join("\n\n");

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

    const response = await callGeminiWithRetry(() => getGenAI(req).models.generateContent({
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
    }));

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Summarization error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document." });
  }
});

// Endpoint to chat with selected documents
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, selectedDocuments } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    // Format selected documents into context
    let docsContext = "";
    if (selectedDocuments && selectedDocuments.length > 0) {
      docsContext = "Here is the content of the selected documents you must reason across:\n\n";
      selectedDocuments.forEach((doc: any) => {
        docsContext += `<document name="${doc.name}">\n`;
        doc.pages.forEach((page: any) => {
          docsContext += `<page number="${page.pageNumber}">\n${page.text}\n</page>\n`;
        });
        docsContext += `</document>\n\n`;
      });
    } else {
      docsContext = "No documents are currently selected. Answer using general knowledge but clearly state that no documents are selected.";
    }

    // Format conversation history for Gemini API
    // We can map the messages array to the format expected by the model.
    // The user and assistant turns should alternate.
    const lastMessage = messages[messages.length - 1].content;
    const previousMessages = messages.slice(0, messages.length - 1);

    const formattedHistory = previousMessages.map((m: any) => {
      return `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`;
    }).join("\n");

    const prompt = `Selected Documents Context:
${docsContext}

Conversation History:
${formattedHistory}

Current User Message:
User: ${lastMessage}
`;

    const systemInstruction = `You are Menteea, an elite, helpful AI research assistant.
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

    const response = await callGeminiWithRetry(() => getGenAI(req).models.generateContent({
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
    }));

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini Error:", error);

    const status = error?.status || error?.code;

    if (status === 503) {
        return res.status(503).json({
            code: "AI_SERVICE_UNAVAILABLE",
            error: "The AI service is temporarily unavailable. Please try again in a few moments."
        });
    }

    if (status === 429) {
        return res.status(429).json({
            code: "RATE_LIMITED",
            error: "Too many requests. Please wait a moment and try again."
        });
    }

    return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        error: "Something went wrong while processing your request."
    });
  }
});

// Integrate Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist directory.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
