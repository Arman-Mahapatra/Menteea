import { Page, Chunk } from "../models/types";
import { countTokens } from "../utils/tokenizer";
import { logger } from "../utils/logger";

/**
 * Semantically chunks document pages into 800-1200 character windows with 150-200 overlap.
 */
export function chunkDocument(documentId: string, documentName: string, pages: Page[]): Chunk[] {
  logger.info(`[chunkDocument] Chunking document: ${documentName} (${documentId})`);
  const chunks: Chunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const text = page.text || "";
    const pageNum = page.pageNumber;

    if (text.trim().length === 0) {
      continue;
    }

    const targetSize = 1000; // Between 800 and 1200 characters
    const overlap = 175;    // Between 150 and 200 characters
    let start = 0;

    while (start < text.length) {
      let end = start + targetSize;
      if (end > text.length) {
        end = text.length;
      } else {
        // Attempt to find a natural boundary (like a space) in the last 150 characters
        const searchSub = text.substring(Math.max(start, end - 150), end);
        const lastSpace = searchSub.lastIndexOf(" ");
        if (lastSpace !== -1) {
          end = Math.max(start + 1, end - 150 + lastSpace);
        }
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 0) {
        const chunkId = `${documentId}-chunk-${globalChunkIndex}`;
        chunks.push({
          id: chunkId,
          documentId,
          documentName,
          pageNumber: pageNum,
          chunkIndex: globalChunkIndex,
          text: chunkText,
          content: chunkText, // Set content field as well for metadata compatibility
          tokenCount: countTokens(chunkText)
        } as any);
        globalChunkIndex++;
      }

      const nextStart = end - overlap;
      if (nextStart <= start) {
        start = end; // Prevent infinite loops by forcing forward progress
      } else {
        start = nextStart;
      }

      if (end >= text.length) {
        break;
      }
    }
  }

  logger.info(`[chunkDocument] Created ${chunks.length} chunks for document ID: ${documentId}`);
  return chunks;
}