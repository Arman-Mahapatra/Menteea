import { Chunk } from "../models/types";
import { VectorStore } from "../services/vectorStore";
import { EmbeddingService } from "../services/embeddingService";
import { logger } from "../utils/logger";

/**
 * Retrieves matching contextual chunks and formats them according to RAG requirements.
 */
export async function retrieveRelevantChunks(
  query: string,
  documentIds: string[],
  limit: number = 5,
  apiKey?: string
): Promise<{ content: string; score: number; documentId: string }[]> {
  logger.info(`[retrieveRelevantChunks] Retrieving relevant chunks for query: "${query}" across documents: [${documentIds.join(", ")}]`);
  
  try {
    const embeddingService = EmbeddingService.getInstance();
    const vectorStore = VectorStore.getInstance();

    // 1. Generate Query Embedding
    const queryEmbedding = await embeddingService.getEmbedding(query, apiKey);

    // 2. Search vector store
    const candidates = vectorStore.searchWithScores(queryEmbedding, documentIds, limit);

    // 3. Format output
    return candidates.map((cand) => ({
      content: cand.chunk.text,
      score: cand.score,
      documentId: cand.chunk.documentId,
    }));
  } catch (err) {
    logger.error("[retrieveRelevantChunks] Error during retrieval:", err);
    return [];
  }
}
