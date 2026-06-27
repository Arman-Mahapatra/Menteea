import { Chunk } from "../models/types";
import { VectorStore } from "./vectorStore";
import { EmbeddingService } from "./embeddingService";
import { logger } from "../utils/logger";

export class RetrievalService {
  private static instance: RetrievalService;
  private vectorStore: VectorStore;

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
   * Retrieves matching contextual chunks for a given user query in selected documents by generating query embedding.
   */
  public async retrieveRelevantContext(
    query: string,
    documentIds: string[],
    limit: number = 5,
    apiKey?: string
  ): Promise<Chunk[]> {
    logger.info(`[RetrievalService] Retrieving relevant chunks for query: "${query}" in docs: [${documentIds.join(", ")}]`);
    
    // 1. Generate embedding for query
    const embeddingService = EmbeddingService.getInstance();
    const queryEmbedding = await embeddingService.getEmbedding(query, apiKey);

    // 2. Search the in-memory vector store with the query embedding
    const results = this.vectorStore.search(queryEmbedding, documentIds, limit);
    
    logger.info(`[RetrievalService] Retrieved ${results.length} chunks`);
    return results;
  }
}
export default RetrievalService;