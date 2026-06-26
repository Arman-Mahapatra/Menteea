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

  // 1. Invalid API Key Mapping
  if (
    status === 400 && message.includes("api key") ||
    status === 403 ||
    message.includes("api key") && (message.includes("invalid") || message.includes("not valid") || message.includes("unauthorized") || message.includes("expired"))
  ) {
    return res.status(403).json({
      code: "INVALID_API_KEY",
      error: "Invalid Gemini API key. Please verify your API key."
    });
  }

  // 2. Daily Quota Exhausted Mapping
  if (
    status === 429 ||
    message.includes("quota") ||
    message.includes("limit") ||
    message.includes("exhausted") ||
    message.includes("rate")
  ) {
    return res.status(429).json({
      code: "RATE_LIMITED",
      error: "Daily Gemini API quota reached. Please wait for quota reset or use another API key."
    });
  }

  // 3. Temporary Service Unavailable Mapping
  if (
    status === 503 ||
    status === 504 ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("timeout") ||
    message.includes("fetch failed")
  ) {
    return res.status(503).json({
      code: "AI_SERVICE_UNAVAILABLE",
      error: "Gemini is temporarily unavailable. Please try again shortly."
    });
  }

  // 4. Default Fallback
  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    error: "Something went wrong while processing your request."
  });
}