import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { GEMINI_MODEL } from "../config/models";

/**
 * Validate a Gemini API key by performing a minimal API request.
 * Handles temporary Gemini outages separately from actual key failures.
 */
export async function handleValidateKey(req: Request, res: Response) {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return res.status(400).json({
        error: "API Key is required.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "menteea",
        },
      },
    });

    // Lightweight validation request
    await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "ping",
    });

    return res.status(200).json({
      valid: true,
      provider: "Gemini",
      model: GEMINI_MODEL,
      modelAccess: "Confirmed",
      message:
        "✓ Gemini API Key Verified\nProvider: Gemini\nModel Access: Confirmed",
    });
  } catch (error: any) {
    logger.error("API Key validation error:", error);

    const status = error?.status ?? error?.code;
    const message = String(error?.message || error).toLowerCase();

    // ===== Temporary Gemini Service Issues =====
    if (status === 503 || message.includes("unavailable")) {
      return res.status(200).json({
        valid: true,
        warning:
          "Gemini service is temporarily unavailable. Your API key appears valid. Please try again in a few moments.",
        provider: "Gemini",
        model: GEMINI_MODEL,
        serviceStatus: "Temporary Outage",
      });
    }

    // ===== Rate Limit / Quota =====
    if (
      status === 429 ||
      message.includes("quota") ||
      message.includes("exhausted") ||
      message.includes("rate limit")
    ) {
      return res.status(429).json({
        valid: true,
        warning:
          "API key is valid, but quota has been exceeded or rate limits have been reached.",
        provider: "Gemini",
        model: GEMINI_MODEL,
      });
    }

    // ===== Invalid API Key =====
    if (
      status === 401 ||
      message.includes("api_key_invalid") ||
      message.includes("api key not valid") ||
      message.includes("invalid api key") ||
      message.includes("invalid key")
    ) {
      return res.status(401).json({
        valid: false,
        error:
          "Invalid API Key. Please verify that your Gemini API key was copied correctly.",
      });
    }

    // ===== Forbidden =====
    if (status === 403) {
      return res.status(403).json({
        valid: false,
        error:
          "This API key does not have permission to access the Gemini API.",
      });
    }

    // ===== Unknown Error =====
    return res.status(500).json({
      valid: false,
      error:
        "Unable to validate API key due to an unexpected server error.",
    });
  }
}

export default handleValidateKey;