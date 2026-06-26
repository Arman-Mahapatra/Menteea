import { Request, Response } from "express";
import { ChatService } from "../services/chatService";
import { DocumentService } from "../services/documentService";
import { logger } from "../utils/logger";
import { handleAIError } from "../utils/errorHandler";
import { Document } from "../models/types";

/**
 * Handles incoming Workspace Chat requests.
 */
export async function handleChat(req: Request, res: Response) {
  try {
    const { messages, selectedDocuments, selectedDocumentIds } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    // Get API Key dynamically (using client key header if provided, fallback to server process env)
    const customKey = req.headers["x-api-key"] as string;
    const activeKey = customKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      return res.status(400).json({
        error: "No Gemini API key found. Please configure it in your Settings, or enter it in the app workspace."
      });
    }

    // Retrieve selected documents from centralized DocumentService (the single source of truth)
    const documentService = DocumentService.getInstance();
    const resolvedDocs: Document[] = [];

    // Use selectedDocumentIds if provided by client
    const docIdsToLookup = Array.isArray(selectedDocumentIds)
      ? selectedDocumentIds
      : (Array.isArray(selectedDocuments) ? selectedDocuments.map((d: any) => d.id) : []);

    docIdsToLookup.forEach((id: string) => {
      const doc = documentService.getDocument(id);
      if (doc) {
        resolvedDocs.push(doc);
      }
    });

    // Fallback/Synchronization: If any selected documents are not yet in the backend store
    // (e.g. following a server restart), we gracefully register them from the client payload
    if (resolvedDocs.length < docIdsToLookup.length && Array.isArray(selectedDocuments)) {
      selectedDocuments.forEach((clientDoc: any) => {
        if (!clientDoc || !clientDoc.id) return;
        const alreadyResolved = resolvedDocs.some((d) => d.id === clientDoc.id);
        if (!alreadyResolved) {
          logger.info(`[handleChat] Synchronizing client document to single source of truth: ID=${clientDoc.id}`);
          const docObj: Document = {
            id: clientDoc.id,
            name: clientDoc.name,
            pages: (clientDoc.pages || []).map((p: any) => ({
              pageNumber: Number(p.pageNumber),
              text: (p.text || "").trim()
            })),
            size: clientDoc.size,
            summary: clientDoc.summary,
            topics: clientDoc.topics,
            purpose: clientDoc.purpose,
            initialSuggestions: clientDoc.initialSuggestions
          };
          documentService.storeDocument(docObj);
          resolvedDocs.push(docObj);
        }
      });
    }

    // Format resolved documents into contextual prompt block
    let docsContext = "";
    if (resolvedDocs.length > 0) {
      docsContext = "Here is the content of the selected documents you must reason across:\n\n";
      resolvedDocs.forEach((doc) => {
        docsContext += `<document name="${doc.name}">\n`;
        doc.pages.forEach((page) => {
          docsContext += `<page number="${page.pageNumber}">\n${page.text}\n</page>\n`;
        });
        docsContext += `</document>\n\n`;
      });
    } else {
      docsContext = "No documents are currently selected. Answer using general knowledge but clearly state that no documents are selected.";
    }

    const lastMessage = messages[messages.length - 1].content;
    const previousMessages = messages.slice(0, messages.length - 1);

    const formattedHistory = previousMessages.map((m: any) => {
      return `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`;
    }).join("\n");

    const chatService = ChatService.getInstance();
    const result = await chatService.generateChatResponse(
      activeKey,
      docsContext,
      formattedHistory,
      lastMessage
    );

    return res.json(result);
  } catch (error: any) {
    logger.error("Chat handler error:", error);
    return handleAIError(error, res);
  }
}
export default handleChat;
