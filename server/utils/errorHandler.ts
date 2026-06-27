import { Response } from "express";
import { logger } from "./logger";

export interface FriendlyError {
  code: string;
  error: string;
}

/**
 * Maps common Gemini AI failures into clean, friendly user-facing responses.
 */
export function handleAIError(error: any, res: Response) {
  logger.error("Mapping Gemini/AI Error:", error);

  const status = error?.status || error?.code;
  const message = String(error?.message || error).toLowerCase();

  // 1. Quota / Rate Limit (429) - checked first to take precedence
  if (
    status === 429 ||
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("limit") ||
    message.includes("exhausted") ||
    message.includes("rate")
  ) {
    return res.status(429).json({
      code: "RATE_LIMITED",
      error: "Gemini API quota exceeded. Document indexing completed successfully, but AI generation is temporarily unavailable. Please try again later or use another API key."
    });
  }

  // 2. Invalid API Key Mapping (401 / 403)
  if (
    status === 401 ||
    status === 403 ||
    (status === 400 && message.includes("api key")) ||
    (message.includes("api key") && (
      message.includes("invalid") ||
      message.includes("not valid") ||
      message.includes("unauthorized") ||
      message.includes("expired")
    ))
  ) {
    return res.status(403).json({
      code: "INVALID_API_KEY",
      error: "Invalid Gemini API key. Please verify your API key."
    });
  }

  // 3. Temporary Service Unavailable Mapping (503)
  if (
    status === 503 ||
    status === 504 ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("timeout") ||
    message.includes("fetch failed")
  ) {
    return res.status(503).json({
      code: "AI_SERVICE_UNAVAILABLE",
      error: "Gemini services are experiencing high demand. Please try again shortly."
    });
  }

  // 4. Default Fallback
  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    error: "Something went wrong while processing your request."
  });
}
