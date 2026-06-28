import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { GEMINI_EMBEDDING_MODEL } from "../config/models";
import { callWithRetry } from "../utils/aiRetryHelper";

export class EmbeddingService {
  private static instance: EmbeddingService;
  private cache: Map<string, number[]> = new Map();
  private maxCacheSize: number = 3000; // configurable reasonable default between 2000-5000

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Configures the maximum number of entries allowed in the cache.
   */
  public setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    this.pruneCache();
  }

  /**
   * Helper to keep the cache size within bounds.
   */
  private pruneCache(): void {
    while (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        logger.info(`[EmbeddingService] Evicting oldest embedding cache entry (Cache Size: ${this.cache.size})`);
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  private getGenAI(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  /**
   * Generates embedding vector representation for text with in-memory caching.
   */
  public async getEmbedding(text: string, apiKey?: string): Promise<number[]> {
    const trimmed = text.trim();
    if (this.cache.has(trimmed)) {
      logger.info(`[EmbeddingService] Embedding cache HIT for text length: ${trimmed.length}`);
      const val = this.cache.get(trimmed)!;
      // Move to end to mark as most recently used (LRU)
      this.cache.delete(trimmed);
      this.cache.set(trimmed, val);
      return val;
    }

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("No Gemini API key found for generating embeddings.");
    }

    logger.info(`[EmbeddingService] Generating embedding for text length: ${trimmed.length}`);
    try {
      const ai = this.getGenAI(key);
      const response = await callWithRetry(() =>
        ai.models.embedContent({
          model: GEMINI_EMBEDDING_MODEL,
          contents: trimmed,
        })
      );

      const values = response.embeddings?.[0]?.values;
      if (!values || !Array.isArray(values)) {
        throw new Error("Invalid embedding response structure from Gemini API");
      }
      
      this.cache.set(trimmed, values);
      this.pruneCache();
      
      return values;
    } catch (err: any) {
      logger.error("[EmbeddingService] Error generating embedding:", err);
      throw err;
    }
  }

  /**
   * Generates batch embeddings.
   */
  public async getEmbeddings(texts: string[], apiKey?: string): Promise<number[][]> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("No Gemini API key found for generating embeddings.");
    }

    if (texts.length === 0) return [];

    logger.info(`[EmbeddingService] Generating batch embeddings for ${texts.length} items using controlled concurrency`);
    try {
      const concurrencyLimit = 30;
      const results: number[][] = new Array(texts.length);
      let currentIndex = 0;
      let fallbackDimension = 3072; // default for gemini-embedding-2-preview

      const worker = async () => {
        while (currentIndex < texts.length) {
          const index = currentIndex++;
          try {
            const emb = await this.getEmbedding(texts[index], key);
            results[index] = emb;
            if (emb && emb.length > 0) {
              fallbackDimension = emb.length;
            }
          } catch (err) {
            logger.error(`[EmbeddingService] Failed to embed text at index ${index}`, err);
            results[index] = null as any;
          }
        }
      };

      const workers = [];
      for (let i = 0; i < Math.min(concurrencyLimit, texts.length); i++) {
        workers.push(worker());
      }

      await Promise.all(workers);

      // Fill in any failed indices with a zero array of the correct dimension
      for (let i = 0; i < results.length; i++) {
        if (!results[i]) {
          logger.warn(`[EmbeddingService] Using zero array fallback of dimension ${fallbackDimension} at index ${i}`);
          results[i] = new Array(fallbackDimension).fill(0);
        }
      }

      return results;
    } catch (err: any) {
      logger.error("[EmbeddingService] Error generating batch embeddings with controlled concurrency:", err);
      const results: number[][] = [];
      for (const t of texts) {
        results.push(await this.getEmbedding(t, key));
      }
      return results;
    }
  }
}
export default EmbeddingService;


