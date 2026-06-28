import { Document, Page } from "../models/types";
import { VectorStore } from "./vectorStore";
import { RetrievalService } from "./retrievalService";
import { logger } from "../utils/logger";

export class DocumentService {
  private static instance: DocumentService;
  private vectorStore: VectorStore;
  private documents: Map<string, Document> = new Map();

  private constructor() {
    this.vectorStore = VectorStore.getInstance();
  }

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Stores a document in the centralized in-memory store.
   */
  public storeDocument(doc: Document): void {
    logger.info(`[DocumentService] Storing document in single source of truth: ID=${doc.id}, Name="${doc.name}"`);
    this.documents.set(doc.id, doc);
    try {
      RetrievalService.getInstance().invalidateDocumentCache(doc.id);
    } catch (err) {
      logger.error(`[DocumentService] Failed to invalidate cache on store for document ID ${doc.id}:`, err);
    }
  }

  /**
   * Retrieves a document from the centralized store.
   */
  public getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Finds a stored document matching content hash to prevent duplicate ingestion.
   */
  public findMatchingDocument(contentHash: string): Document | undefined {
    if (!contentHash) return undefined;
    for (const doc of this.documents.values()) {
      if (doc.contentHash === contentHash) {
        return doc;
      }
    }
    return undefined;
  }

  /**
   * Helper to process document pages, calculate length stats, etc.
   */
  public processDocumentPages(documentId: string, documentName: string, pages: Page[]): { pageCount: number; charCount: number } {
    logger.info(`[DocumentService] Processing pages for document: "${documentName}" (${documentId})`);
    let charCount = 0;
    if (Array.isArray(pages)) {
      pages.forEach((page) => {
        const text = typeof page.text === "string" ? page.text : "";
        charCount += text.trim().length;
      });
    }
    return {
      pageCount: Array.isArray(pages) ? pages.length : 0,
      charCount,
    };
  }

  /**
   * Cleans up chunks and metadata on document deletion.
   */
  public async deleteDocument(documentId: string): Promise<void> {
    logger.info(`[DocumentService] Deleting document metadata and indexes for ID: ${documentId}`);
    this.documents.delete(documentId);
    try {
      RetrievalService.getInstance().invalidateDocumentCache(documentId);
    } catch (err) {
      logger.error(`[DocumentService] Failed to invalidate cache on delete for document ID ${documentId}:`, err);
    }
    await this.vectorStore.deleteDocument(documentId);
  }
}
export default DocumentService;
