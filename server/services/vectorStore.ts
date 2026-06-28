import { Chunk } from "../models/types";
import { logger } from "../utils/logger";

export interface VectorChunk {
  chunkId: string;
  documentId: string;
  content: string;
  embedding: number[];
  chunk: Chunk;
}

export class VectorStore {
  private static instance: VectorStore;
  private store: Map<string, VectorChunk> = new Map();
  
  private constructor() {}

  public static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  /**
   * Adds a single chunk to the vector store.
   */
  public addChunk(chunkId: string, documentId: string, content: string, embedding: number[], originalChunk: Chunk): void {
    this.store.set(chunkId, {
      chunkId,
      documentId,
      content,
      embedding,
      chunk: originalChunk
    });
  }

  /**
   * Adds multiple page chunks to the vector store.
   */
  public async addChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    logger.info(`[VectorStore] Adding ${chunks.length} chunks to vector store`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i] || [];
      this.addChunk(chunk.id, chunk.documentId, chunk.text, embedding, chunk);
    }
    logger.info(`[VectorStore] Total chunks currently indexed in store: ${this.store.size}`);
  }

  /**
   * Deletes all associated chunks of a document.
   */
  public async deleteDocument(documentId: string): Promise<void> {
    logger.info(`[VectorStore] Deleting document ${documentId} from vector store`);
    for (const [key, value] of this.store.entries()) {
      if (value.documentId === documentId) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clears the vector store completely.
   */
  public clear(): void {
    logger.info(`[VectorStore] Clearing all chunks from vector store.`);
    this.store.clear();
  }

  /**
   * Performs vector similarity search across document contexts using cosine similarity and returns candidate chunks with their scores.
   */
  public searchWithScores(queryEmbedding: number[], documentIds: string[], limit: number = 5): { chunk: Chunk; score: number }[] {
    const candidates: { chunk: Chunk; score: number }[] = [];

    for (const [_, vecChunk] of this.store.entries()) {
      if (documentIds.includes(vecChunk.documentId)) {
        const score = this.cosineSimilarity(queryEmbedding, vecChunk.embedding);
        candidates.push({ chunk: vecChunk.chunk, score });
      }
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
  }

  /**
   * Performs vector similarity search across document contexts using cosine similarity.
   */
  public search(queryEmbedding: number[], documentIds: string[], limit: number = 5): Chunk[] {
    logger.info(`[VectorStore] Searching similarity for document IDs: [${documentIds.join(", ")}]`);
    
    const results = this.searchWithScores(queryEmbedding, documentIds, limit);

    // Log top similarity scores for debugging as requested in Step 9
    logger.info(`[VectorStore] Retrieval executed - Top similarity scores:`);
    results.forEach((cand, idx) => {
      logger.info(`  [Top ${idx + 1}] Chunk ID: ${cand.chunk.id}, Doc ID: ${cand.chunk.documentId}, Similarity Score: ${cand.score.toFixed(4)}`);
    });

    // Smart Retrieval: Reduce chunk count when confidence is high
    if (results.length > 0) {
      const topScore = results[0].score;
      let optimizedLimit = limit;
      if (topScore > 0.82) {
        optimizedLimit = Math.max(2, Math.min(limit, 3)); // If extremely relevant, 2 or 3 chunks are plenty!
        logger.info(`[SmartRetrieval] Confidence is very high (${topScore.toFixed(4)}). Optimizing context by reducing chunk limit from ${limit} to ${optimizedLimit}.`);
      } else if (topScore > 0.68) {
        optimizedLimit = Math.max(3, Math.min(limit, 4)); // 3 or 4 chunks
        logger.info(`[SmartRetrieval] Confidence is high (${topScore.toFixed(4)}). Optimizing context by reducing chunk limit from ${limit} to ${optimizedLimit}.`);
      }
      return results.slice(0, optimizedLimit).map(r => r.chunk);
    }

    return results.map(r => r.chunk);
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
export default VectorStore;

