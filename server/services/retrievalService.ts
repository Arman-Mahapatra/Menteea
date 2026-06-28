import { Chunk } from "../models/types";
import { VectorStore } from "./vectorStore";
import { EmbeddingService } from "./embeddingService";
import { logger } from "../utils/logger";

export class RetrievalService {
  private static instance: RetrievalService;
  private vectorStore: VectorStore;
  private retrievalCache: Map<string, Chunk[]> = new Map();

  private constructor() {
    this.vectorStore = VectorStore.getInstance();
  }

  public static getInstance(): RetrievalService {
    if (!RetrievalService.instance) {
      RetrievalService.instance = new RetrievalService();
    }
    return RetrievalService.instance;
  }

  /**
   * Invalidates any cached retrieval queries containing the given document ID.
   */
  public invalidateDocumentCache(documentId: string): void {
    logger.info(`[RetrievalService] Invalidating cache for document ID: ${documentId}`);
    for (const key of this.retrievalCache.keys()) {
      const parts = key.split("::");
      if (parts.length >= 2) {
        const docIds = parts[1].split(",");
        if (docIds.includes(documentId)) {
          logger.info(`[RetrievalService] Evicting cached retrieval query key: "${key}"`);
          this.retrievalCache.delete(key);
        }
      }
    }
  }

  /**
   * Retrieves matching contextual chunks for a given user query in selected documents by generating query embedding.
   */
  public async retrieveRelevantContext(
    query: string,
    documentIds: string[],
    limit: number = 5,
    apiKey?: string
  ): Promise<Chunk[]> {
    const trimmedQuery = query.trim().toLowerCase();
    const sortedDocsKey = [...documentIds].sort().join(",");
    const cacheKey = `${trimmedQuery}::${sortedDocsKey}::${limit}`;

    if (this.retrievalCache.has(cacheKey)) {
      logger.info(`[RetrievalService] Retrieval cache HIT for query: "${query}"`);
      return this.retrievalCache.get(cacheKey)!;
    }

    logger.info(`[RetrievalService] Retrieving relevant chunks for query: "${query}" in docs: [${documentIds.join(", ")}]`);
    
    // 1. Generate embedding for query
    const embeddingService = EmbeddingService.getInstance();
    const queryEmbedding = await embeddingService.getEmbedding(query, apiKey);

    // 2. Search the in-memory vector store with the query embedding
    const results = this.vectorStore.search(queryEmbedding, documentIds, limit);
    
    logger.info(`[RetrievalService] Retrieved ${results.length} chunks`);
    this.retrievalCache.set(cacheKey, results);
    return results;
  }
}
export default RetrievalService;