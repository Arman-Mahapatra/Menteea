import { logger } from "./logger";

/**
 * Reusable utility to execute a function with exponential backoff retry.
 * Sequence:
 * - Attempt 1 -> wait 1 second
 * - Attempt 2 -> wait 2 seconds
 * - Attempt 3 -> wait 4 seconds
 * - Attempt 4 -> wait 8 seconds
 * Maximum attempts: 4
 */
export async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 4;
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      const errStr = String(error).toLowerCase();
      const isRetryable =
        errStr.includes("503") ||
        errStr.includes("service unavailable") ||
        errStr.includes("resource exhausted") ||
        errStr.includes("429") ||
        errStr.includes("overloaded") ||
        errStr.includes("timeout") ||
        errStr.includes("fetch failed") ||
        errStr.includes("socket hang up") ||
        errStr.includes("econnreset") ||
        errStr.includes("network error") ||
        errStr.includes("failed to fetch") ||
        errStr.includes("unavailable");

      if (isRetryable && attempt < maxAttempts) {
        logger.warn(
          `[AI Retry] Gemini API call failed (Attempt ${attempt}/${maxAttempts}): ${
            error.message || error
          }. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // 1000 -> 2000 -> 4000 -> 8000
      } else {
        throw error;
      }
    }
  }
  throw new Error("Maximum retries reached for Gemini API call.");
}