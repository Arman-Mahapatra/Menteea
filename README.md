# Menteea v0.1 — AI-Powered Research Assistant

Menteea is a polished, full-stack AI-powered research assistant that transforms static PDF documents into interactive, intelligent workspaces. Perfect for students, engineers, researchers, and professionals, it bridges the gap between structured documentation and natural language exploration.

---

## 🚀 Core Features

1. **Landing Page**: Minimal, Apple-inspired entrance detailing Menteea's primary value proposition.
2. **Dynamic API Key Workspace**: Configure your own Gemini API key inside the app with full live validation, or let Menteea fall back to the secure environment variable configuration.
3. **Research Library**: A left-hand card organizer showing your active document vault, page count, document summaries, and key topics. Select multiple documents to reason across them simultaneously!
4. **Interactive PDF Viewer**: A crisp canvas renderer using PDF.js. Jump directly to any page, zoom in/out, or fit to width with fluid resizing driven by a `ResizeObserver`.
5. **Grounded RAG Chat**: Chat with your documents. Menteea answers questions strictly using your active PDF context. If information is missing or general knowledge is used, it clearly flags it.
6. **Active Citations**: Page references like `(Page 12)` are rendered as interactive buttons in the chat space. Click any citation to instantly flip the PDF reader to that specific source page.
7. **Instant Summarization & Suggestions**: As soon as a document is uploaded, it generates a comprehensive summary, purpose list, and 4-5 follow-up questions to jumpstart your research.
8. **Feedback & Safety**: Safe loading indicators, and user-friendly error boundaries to gracefully handle empty states, missing keys, or oversized documents.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, PDF.js, React Markdown, Lucide icons.
* **Backend**: Express, Node.js, `@google/genai` TypeScript SDK.
* **AI Model**: `gemini-3.5-flash` (The modern industry standard for grounded text reasoning and structured JSON output schemas).

---

## 🏗️ Architecture Design & Scalability

1. **State Preservation**: Persists your chat history, active view preferences, and document metadata in `localStorage`.
2. **Quota-Safe Memory Mapping**: Since `localStorage` has a tight 5MB quota, binary PDF buffers are managed via a client-side session registry. This allows heavy files to load and render page-by-page at 60 FPS without ever risking storage overflow!
3. **Stateless Backend Proxy**: The Express server acts as a clean, stateless proxy to execute secure Gemini API calls, keeping API keys protected from browser inspection.
4. **Structured JSON Output Schema**: We utilize Gemini's native `responseSchema` to guarantee that answers and follow-up suggestion chips are generated in a single atomic request, resulting in high speed and low latency.

---

## 🏁 Quick Start & Run Locally

1. **Configure Environment**:
   Duplicate `.env.example` as `.env` and fill in your secure Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with your workspace.

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

*Menteea — Transforming static documents into active dialogues.*
