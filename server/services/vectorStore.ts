import { Chunk } from "../models/types";
import { logger } from "../utils/logger";

export class VectorStore {
  private static instance: VectorStore;
  
  private constructor() {}

  public static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  /**
   * Adds parsed page chunks to the vector store.
   */
  public async addChunks(chunks: Chunk[]): Promise<void> {
    logger.info(`[VectorStore] Adding ${chunks.length} chunks to vector store (Placeholder)`);
  }

  /**
   * Deletes all associated chunks of a document.
   */
  public async deleteDocument(documentId: string): Promise<void> {
    logger.info(`[VectorStore] Deleting document ${documentId} from vector store (Placeholder)`);
  }

  /**
   * Performs vector similarity search across document contexts.
   */
  public async search(query: string, documentIds: string[], limit: number = 5): Promise<Chunk[]> {
    logger.info(`[VectorStore] Searching similarity for query: "${query}" in docs: [${documentIds.join(", ")}] (Placeholder)`);
    return [];
  }
}
export default VectorStore;