import { Request, Response } from "express";
import { ChatService } from "../services/chatService";
import { DocumentService } from "../services/documentService";
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

    // 1. Generate/Verify Document ID
    const id = documentId || Math.random().toString(36).substring(2, 9);

    // 2. Process statistics through DocumentService
    const documentService = DocumentService.getInstance();
    const stats = documentService.processDocumentPages(id, documentName, pages);
    logger.info(`[handleUpload] Document processed: pages=${stats.pageCount}, charCount=${stats.charCount}`);

    // 3. Create and Store the Document Object
    const docObj: Document = {
      id,
      name: documentName,
      pages: pages.map((p: any) => ({
        pageNumber: Number(p.pageNumber),
        text: (p.text || "").trim()
      })),
      size
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

    // 4. Summarize consuming the EXACT same extracted text from DocumentService store
    const storedDoc = documentService.getDocument(id);
    if (!storedDoc) {
      throw new Error("Failed to retrieve stored document for summary generation.");
    }

    const documentContext = storedDoc.pages
      .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
      .join("\n\n");

    const chatService = ChatService.getInstance();
    const result = await chatService.generateDocumentSummary(
      activeKey,
      documentName,
      documentContext
    );

    // 5. Update stored document details with generated summary
    storedDoc.summary = result.summary;
    storedDoc.topics = result.topics;
    storedDoc.purpose = result.purpose;
    storedDoc.initialSuggestions = result.suggestions;

    return res.json({
      documentId: id,
      ...result
    });
  } catch (error: any) {
    logger.error("Summarization error:", error);
    return handleAIError(error, res);
  }
}
export default handleUpload;