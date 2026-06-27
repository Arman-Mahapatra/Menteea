import { Request, Response } from "express";
import { ChatService } from "../services/chatService";
import { DocumentService } from "../services/documentService";
import { logger } from "../utils/logger";
import { handleAIError } from "../utils/errorHandler";

/**
 * Handles incoming Quiz generation requests.
 */
export async function handleQuiz(req: Request, res: Response) {
  try {
    const { documentId, selectedDocuments } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: "No documentId provided." });
    }

    // Get API Key dynamically (using client key header if provided, fallback to server process env)
    const customKey = req.headers["x-api-key"] as string;
    const activeKey = customKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      return res.status(400).json({
        error: "No Gemini API key found. Please configure it in your Settings, or enter it in the app workspace."
      });
    }

    // Retrieve selected document from centralized DocumentService
    const documentService = DocumentService.getInstance();
    let doc = documentService.getDocument(documentId);

    // Fallback/Synchronization: If the document is not yet in the backend store
    if (!doc && Array.isArray(selectedDocuments)) {
      const clientDoc = selectedDocuments.find((d: any) => d.id === documentId);
      if (clientDoc) {
        logger.info(`[handleQuiz] Synchronizing client document to single source of truth: ID=${clientDoc.id}`);
        doc = {
          id: clientDoc.id,
          name: clientDoc.name,
          pages: (clientDoc.pages || []).map((p: any) => ({
            pageNumber: Number(p.pageNumber),
            text: (p.text || "").trim()
          })),
          size: clientDoc.size
        };
        documentService.storeDocument(doc);
      }
    }

    if (!doc) {
      return res.status(404).json({ error: "Document not found in workspace." });
    }

    const documentContext = doc.pages
      .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
      .join("\n\n");

    const chatService = ChatService.getInstance();
    const result = await chatService.generateQuiz(
      activeKey,
      doc.name,
      documentContext
    );

    return res.json(result);
  } catch (error: any) {
    logger.error("Quiz generation error:", error);
    return handleAIError(error, res);
  }
}

export default handleQuiz;