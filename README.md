# Menteea

> **Knowledge in Motion.**
>
> Menteea is an AI-powered research workspace that transforms static documents into interactive understanding. Upload PDFs, textbooks, lecture notes, research papers, and reports, then explore them through grounded conversations, intelligent summaries, quizzes, study guides, mind maps, and evidence-backed insights.

---

## Overview

Modern knowledge work is fragmented.

Students, researchers, and professionals spend hours reading dense documents, switching between note-taking tools, searching for key concepts, creating revision materials, and manually connecting ideas across sources.

Menteea was built to solve this problem.

Instead of treating documents as static files, Menteea transforms them into an intelligent workspace where information can be explored, questioned, summarized, and converted into actionable understanding.

The platform combines modern Retrieval-Augmented Generation (RAG), document intelligence workflows, caching systems, and interactive learning tools into a single unified experience.

---

## Key Features

### Intelligent Document Upload

Upload:

* Research papers
* Lecture notes
* Textbooks
* Technical reports
* Study materials
* Documentation

Menteea automatically processes, indexes, and prepares documents for semantic retrieval.

---

### AI-Powered Research Chat

Ask natural language questions about your documents.

Examples:

* Explain this chapter in simple terms
* What are the main findings?
* Compare section 3 and section 7
* Generate revision notes
* What assumptions does the author make?

Responses are grounded in retrieved document content rather than generic model knowledge.

---

### Automatic Document Summaries

Generate concise summaries of uploaded documents.

Summaries provide:

* Core themes
* Major concepts
* Key takeaways
* Important insights

---

### Study Guide Generation

Convert documents into structured learning material including:

* Topic breakdowns
* Important concepts
* Revision notes
* Study plans

---

### Quiz Generation

Automatically generate assessment questions from uploaded documents.

Supports:

* Concept checks
* Revision practice
* Knowledge reinforcement

---

### Mind Map Generation

Transform dense information into visual knowledge structures.

Mind maps help users:

* Understand relationships
* Visualize concepts
* Build mental models
* Explore topic hierarchies

---

### Multi-Document Research Workspace

Work across multiple documents simultaneously.

Menteea can reason across selected documents within a single workspace context.

---

### Persistent Research Sessions

Workspace state is preserved across page reloads.

Features preserved:

* Uploaded documents
* PDF viewer state
* Theme preferences
* Research workspace context

---

### Dark & Light Mode

Carefully designed themes optimized for extended reading sessions.

---

## Architecture

Menteea follows a modular service-oriented architecture.

```text
User
 │
 ▼
Frontend (React + TypeScript)
 │
 ▼
Document Pipeline
 │
 ├── PDF Extraction
 ├── Chunking
 ├── Embedding Generation
 └── Vector Indexing
 │
 ▼
Retrieval Layer
 │
 ├── Semantic Search
 ├── Context Selection
 └── Cache Optimization
 │
 ▼
Gemini Integration
 │
 ▼
Response Generation
```

---

## RAG Pipeline

### 1. Document Ingestion

Uploaded PDFs are parsed and converted into structured text.

### 2. Intelligent Chunking

Documents are divided into retrieval-friendly semantic chunks.

### 3. Embedding Generation

Embeddings are generated for each chunk using Gemini embeddings.

### 4. Vector Indexing

Embeddings are stored for semantic similarity search.

### 5. Query Retrieval

Relevant chunks are selected based on similarity scores.

### 6. Context Construction

Only the most relevant document sections are included.

### 7. Response Generation

Gemini generates grounded responses using retrieved evidence.

---

## Performance Optimizations

Menteea includes several production-focused optimizations.

### SHA-256 Document Deduplication

Duplicate documents are automatically detected using content hashing.

Benefits:

* Prevents duplicate indexing
* Prevents duplicate summaries
* Saves tokens
* Improves upload speed

---

### Embedding Cache

Previously generated embeddings are cached and reused.

Benefits:

* Faster indexing
* Lower API usage
* Reduced latency

---

### Retrieval Cache

Frequently repeated queries reuse cached retrieval results.

Benefits:

* Faster responses
* Reduced compute overhead

---

### Confidence-Based Retrieval

High-confidence searches automatically reduce retrieval context size.

Benefits:

* Lower token consumption
* Faster generation
* Improved efficiency

---

### Bounded LRU Cache

Embedding caches use a Least Recently Used strategy to prevent memory growth.

Benefits:

* Predictable memory usage
* Long-term stability

---

## Security & Reliability

### API Key Isolation

User API keys remain isolated to individual browser sessions.

No shared keys are used.

---

### Rate Limiting

Critical endpoints are protected against abuse.

Protected routes include:

* Chat
* Uploads
* Exports
* AI generation endpoints

---

### Large Document Protection

Client-side safeguards prevent excessive memory consumption.

Current limits:

* 25 MB file size
* 1000 pages
* 1.5 million extracted characters

---

### Graceful Failure Handling

Menteea continues functioning even if summary generation fails.

Users can still:

* Chat
* Generate quizzes
* Generate study guides
* Explore documents

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript

### AI Layer

* Gemini Flash

### Document Processing

* PDF.js
* Semantic Chunking
* Vector Retrieval

### Storage

* IndexedDB
* Browser Persistence
* In-Memory Vector Store

---

## Project Structure

```text
src/
├── components/
├── hooks/
├── utils/
├── types/

server/
├── api/
├── services/
├── models/
├── utils/

dist/
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd menteea
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create:

```env
.env
```

Example:

```env
GEMINI_API_KEY=your_key_here
```

### Start Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## Future Roadmap

### Sprint 3

* Advanced citation tracking
* Improved source attribution
* Cross-document knowledge graphs
* Enhanced workspace intelligence

### Sprint 4

* User accounts
* Cloud synchronization
* Workspace sharing
* Team collaboration

### Sprint 5

* Persistent vector database
* Large-scale document collections
* Research projects
* Workspace analytics

### Long-Term Vision

Menteea aims to become an operating system for understanding knowledge.

Instead of simply storing documents, future versions will help users:

* Build knowledge networks
* Conduct research
* Learn faster
* Generate insights
* Connect information across disciplines

---

## Known Limitations

Current version focuses on PDF-based workflows.

Future versions may include:

* DOCX support
* Web source ingestion
* Audio transcription
* Video understanding
* Cloud document storage

---

## Why Menteea?

Most AI document tools stop at question answering.

Menteea focuses on something larger:

**Transforming information into understanding.**

The goal is not merely retrieval.

The goal is helping people think, learn, research, and create knowledge more effectively.

---

## Author

**Arman Mahapatra**

Creator of Menteea.

Built as a portfolio project exploring AI-powered knowledge systems, document intelligence, Retrieval-Augmented Generation (RAG), and human-centered research workflows.

---

## License

This project is licensed under the MIT License.

---

## Version

Current Release: **v0.2.0**

