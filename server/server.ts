import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { handleChat } from "./api/chat";
import { handleUpload } from "./api/upload";
import { handleMindMap } from "./api/mindmap";
import { handleQuiz } from "./api/quiz";
import { handleStudyGuide } from "./api/studyGuide";
import { handleExportPdf, handleExportDocx } from "./api/export";
import { handleValidateKey } from "./api/validateKey";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = 3000;

// Trust reverse proxy for accurate IP-based rate limiting in Cloud Run/Nginx
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));

// Rate limiter definitions with values configurable via environment variables
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_CHAT_MAX || "60", 10),
  message: {
    error: "Too many chat requests. Please wait a minute before retrying.",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || "10", 10),
  message: {
    error: "Too many document uploads. Please wait a minute before retrying.",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX || "20", 10),
  message: {
    error: "Too many export requests. Please wait a minute before retrying.",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_OTHER_MAX || "20", 10),
  message: {
    error: "Too many request requests. Please wait a minute before retrying.",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

// Refactored routes mapping to modular handlers with rate limits applied
app.post("/api/summarize", uploadLimiter, handleUpload);
app.post("/api/chat", chatLimiter, handleChat);
app.post("/api/mindmap", aiLimiter, handleMindMap);
app.post("/api/quiz", aiLimiter, handleQuiz);
app.post("/api/study-guide", aiLimiter, handleStudyGuide);
app.post("/api/export/pdf", exportLimiter, handleExportPdf);
app.post("/api/export/docx", exportLimiter, handleExportDocx);
app.post("/api/validate-key", aiLimiter, handleValidateKey);

// Integrate Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    logger.info("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    logger.info(`Serving static files from dist directory: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();