import { Document, Page } from "../models/types";
import { VectorStore } from "./vectorStore";
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
  }

  /**
   * Retrieves a document from the centralized store.
   */
  public getDocument(id: string): Document | undefined {
    return this.documents.get(id);
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
    await this.vectorStore.deleteDocument(documentId);
  }
}
export default DocumentService;
