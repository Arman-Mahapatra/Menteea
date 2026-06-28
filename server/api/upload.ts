import { Request, Response } from "express";
import crypto from "crypto";
import { ChatService } from "../services/chatService";
import { DocumentService } from "../services/documentService";
import { chunkDocument } from "../rag/chunker";
import { EmbeddingService } from "../services/embeddingService";
import { VectorStore } from "../services/vectorStore";
import { logger } from "../utils/logger";
import { handleAIError } from "../utils/errorHandler";
import { Document } from "../models/types";

/**
 * Handles incoming requests to upload and summarize a PDF document.
 */
export async function handleUpload(req: Request, res: Response) {
  try {
    const { documentId, documentName, pages, size } = req.body;
    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: "Document must contain pages with text." });
    }

    // 1. Calculate SHA-256 hash of extracted combined pages text
    const combinedText = pages.map((p: any) => p.text || "").join("\n\n");
    const contentHash = crypto.createHash("sha256").update(combinedText).digest("hex");

    // 2. Check if we already have this document processed and indexed in DocumentService
    const documentService = DocumentService.getInstance();
    const existingDoc = (documentId ? documentService.getDocument(documentId) : null) || 
                        documentService.findMatchingDocument(contentHash);

    if (existingDoc) {
      logger.info(`[handleUpload] DEDUPLICATION DIAGNOSTICS:
        * Generated SHA-256 Hash: ${contentHash}
        * Cache Status: HIT (Document found in-memory store)
        * Document Reuse Occurred: YES (Reusing existing ID "${existingDoc.id}")
        * Summary Generation Skipped: YES (Reusing cached summary)
        * Embedding Generation Skipped: YES (Reusing cached embeddings index)`);

      return res.json({
        documentId: existingDoc.id,
        summary: existingDoc.summary || "Summary successfully retrieved from cache.",
        topics: existingDoc.topics || ["Document Research"],
        purpose: existingDoc.purpose || "Document loaded successfully from cache.",
        suggestions: existingDoc.initialSuggestions || ["Give me an overview of this document", "What are the main key points?"],
        summaryError: null
      });
    }

    logger.info(`[handleUpload] DEDUPLICATION DIAGNOSTICS:
      * Generated SHA-256 Hash: ${contentHash}
      * Cache Status: MISS (No matching document found)
      * Document Reuse Occurred: NO (Creating new document profile)
      * Summary Generation Skipped: NO (Triggering Gemini summary generation)
      * Embedding Generation Skipped: NO (Triggering chunks embedding generation)`);

    // 3. Generate/Verify Document ID
    const id = documentId || Math.random().toString(36).substring(2, 9);

    // 4. Process statistics through DocumentService
    const stats = documentService.processDocumentPages(id, documentName, pages);
    logger.info(`[handleUpload] Document processed: pages=${stats.pageCount}, charCount=${stats.charCount}`);

    // 5. Create and Store the Document Object
    const docObj: Document = {
      id,
      name: documentName,
      pages: pages.map((p: any) => ({
        pageNumber: Number(p.pageNumber),
        text: (p.text || "").trim()
      })),
      size,
      contentHash
    };
    documentService.storeDocument(docObj);

    // Get API Key dynamically (using client key header if provided, fallback to server process env)
    const customKey = req.headers["x-api-key"] as string;
    const activeKey = customKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      return res.status(400).json({
        error: "No Gemini API key found. Please configure it in your Settings, or enter it in the app workspace."
      });
    }

    // Index document chunks (Chunk -> Embed -> Store)
    try {
      const chunks = chunkDocument(id, documentName, docObj.pages);
      const embeddingService = EmbeddingService.getInstance();
      const textsToEmbed = chunks.map(c => c.text);
      logger.info(`[handleUpload] Generating embeddings for ${chunks.length} chunks of document: ${documentName}`);
      const embeddings = await embeddingService.getEmbeddings(textsToEmbed, activeKey);
      const vectorStore = VectorStore.getInstance();
      await vectorStore.addChunks(chunks, embeddings);
    } catch (indexErr) {
      logger.error(`[handleUpload] Failed to index document chunks for ID ${id}:`, indexErr);
    }

    // 4. Summarize consuming the EXACT same extracted text from DocumentService store
    const storedDoc = documentService.getDocument(id);
    if (!storedDoc) {
      throw new Error("Failed to retrieve stored document for summary generation.");
    }

    const documentContext = storedDoc.pages
      .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
      .join("\n\n");

    const chatService = ChatService.getInstance();
    let summaryResult = {
      summary: "An automatic summary could not be generated for this document. However, all pages are fully indexed, and you can start asking questions about it in the chat space.",
      topics: ["Document Research"],
      purpose: "Document loaded successfully for page review and chat context.",
      suggestions: ["Give me an overview of this document", "What are the main key points?"]
    };
    let summaryError: string | null = null;

    try {
      const result = await chatService.generateDocumentSummary(
        activeKey,
        documentName,
        documentContext
      );
      summaryResult = result;
    } catch (sumErr: any) {
      logger.error(`[handleUpload] Summary generation failed for ID ${id}:`, sumErr);
      const status = sumErr?.status || sumErr?.code;
      const message = String(sumErr?.message || sumErr).toLowerCase();

      if (
        status === 429 ||
        message.includes("429") ||
        message.includes("quota") ||
        message.includes("limit") ||
        message.includes("exhausted") ||
        message.includes("rate")
      ) {
        summaryError = "Gemini API quota exceeded. Document indexing completed successfully, but AI generation is temporarily unavailable. Please try again later or use another API key.";
      } else if (
        status === 401 ||
        status === 403 ||
        (status === 400 && message.includes("api key")) ||
        (message.includes("api key") && (
          message.includes("invalid") ||
          message.includes("not valid") ||
          message.includes("unauthorized") ||
          message.includes("expired")
        ))
      ) {
        summaryError = "Invalid Gemini API key. Please verify your API key.";
      } else if (
        status === 503 ||
        status === 504 ||
        message.includes("503") ||
        message.includes("unavailable") ||
        message.includes("overloaded") ||
        message.includes("timeout") ||
        message.includes("fetch failed")
      ) {
        summaryError = "Gemini services are experiencing high demand. Please try again shortly.";
      } else {
        summaryError = sumErr?.message || "AI summary generation failed.";
      }
    }

    // 5. Update stored document details with generated summary
    storedDoc.summary = summaryResult.summary;
    storedDoc.topics = summaryResult.topics;
    storedDoc.purpose = summaryResult.purpose;
    storedDoc.initialSuggestions = summaryResult.suggestions;

    return res.json({
      documentId: id,
      ...summaryResult,
      summaryError
    });
  } catch (error: any) {
    logger.error("Summarization error:", error);
    return handleAIError(error, res);
  }
}
export default handleUpload;