import { Page, Chunk } from "../models/types";
import { countTokens } from "../utils/tokenizer";
import { logger } from "../utils/logger";

/**
 * Placeholder for document chunking algorithm.
 * Returns an empty array or basic placeholder structure for this milestone.
 */
export function chunkDocument(documentId: string, documentName: string, pages: Page[]): Chunk[] {
  logger.info(`Chunking document: ${documentName} (${documentId})`);
  return [];
}