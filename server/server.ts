import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { handleChat } from "./api/chat";
import { handleUpload } from "./api/upload";
import { handleMindMap } from "./api/mindmap";
import { handleQuiz } from "./api/quiz";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

// Refactored routes mapping to modular handlers
app.post("/api/summarize", handleUpload);
app.post("/api/chat", handleChat);
app.post("/api/mindmap", handleMindMap);
app.post("/api/quiz", handleQuiz);

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
