import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { GEMINI_MODEL } from "../config/models";

/**
 * Validates a Gemini API key by making a lightweight generateContent request.
 */
export async function handleValidateKey(req: Request, res: Response) {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return res.status(400).json({ error: "API Key is required." });
    }

    const trimmedKey = apiKey.trim();

    // Use GoogleGenAI to validate the key by doing a minimal request
    const ai = new GoogleGenAI({
      apiKey: trimmedKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Make an extremely lightweight call to verify the key
    await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "ping",
    });

    return res.json({
      valid: true,
      message: "✓ Gemini API Key Verified\nProvider: Gemini\nModel Access: Confirmed",
      provider: "Gemini",
      modelAccess: "Confirmed",
      model: GEMINI_MODEL
    });
  } catch (error: any) {
    logger.error("API Key validation error:", error);
    let errorMessage = "Invalid API Key. Please verify your Gemini key and try again.";
    
    // Check for specific API key errors
    const errorString = String(error).toLowerCase();
    if (
      errorString.includes("api_key_invalid") || 
      errorString.includes("api key not valid") || 
      errorString.includes("invalid api key") || 
      errorString.includes("key is invalid") ||
      errorString.includes("invalid key")
    ) {
      errorMessage = "Invalid API Key. Please check that you entered the key correctly.";
    } else if (errorString.includes("quota") || errorString.includes("exhausted") || errorString.includes("429")) {
      errorMessage = "Quota exceeded or API rate limited. Please check your Google AI Studio billing/usage.";
    } else if (errorString.includes("api key blocked") || errorString.includes("blocked")) {
      errorMessage = "This API key is blocked or suspended.";
    } else if (errorString.includes("403")) {
      errorMessage = "Forbidden: The API key is either invalid or does not have access to the Gemini API.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(400).json({ error: errorMessage });
  }
}

export default handleValidateKey;