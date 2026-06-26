import { Chunk } from "../models/types";
import { logger } from "../utils/logger";

/**
 * Placeholder retriever. Returns no relevant chunks for now.
 */
export function retrieveRelevantChunks(query: string, documentIds: string[], limit: number = 5): Chunk[] {
  logger.info(`Retrieving relevant chunks for query: "${query}" across documents: [${documentIds.join(", ")}]`);
  return [];
}