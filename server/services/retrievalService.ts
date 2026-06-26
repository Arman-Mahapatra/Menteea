import { Chunk } from "../models/types";
import { VectorStore } from "./vectorStore";
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
   * Retrieves matching contextual chunks for a given user query in selected documents.
   */
  public async retrieveRelevantContext(query: string, documentIds: string[], limit: number = 5): Promise<Chunk[]> {
    logger.info(`[RetrievalService] Retrieving chunks for query: "${query}" in docs: [${documentIds.join(", ")}]`);
    return this.vectorStore.search(query, documentIds, limit);
  }
}
export default RetrievalService;