import { logger } from "./logger";

/**
 * Placeholder token counter.
 * Estimate about 1 token per 4 characters.
 */
export function countTokens(text: string): number {
  logger.info(`Calculating estimated tokens for text of length: ${text.length}`);
  return Math.ceil(text.length / 4);
}
