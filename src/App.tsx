import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import LibraryPanel from "./components/LibraryPanel";
import { MenteeaLogo } from "./components/MenteeaLogo";
import ChatPanel from "./components/ChatPanel";
import PDFViewerPanel from "./components/PDFViewerPanel";
import ApiKeyModal from "./components/ApiKeyModal";
import MindMapPanel from "./components/MindMapPanel";
import QuizPanel from "./components/QuizPanel";
import StudyGuidePanel from "./components/StudyGuidePanel";
import HelpCenterModal from "./components/HelpCenterModal";
import { DocumentFile, ChatMessage } from "./types";
import { Sparkles, Key, RefreshCw, LogOut, FileText, AlertTriangle, X, Sun, Moon, ExternalLink, HelpCircle } from "lucide-react";
import { deletePdfBuffer, clearAllPdfBuffers } from "./utils/pdfDb";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("menteea_theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("menteea_theme", theme);
  }, [theme]);

  // 1. Initial State Loaders
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    const saved = localStorage.getItem("menteea_workspace_active");
    return saved !== "true";
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("menteea_api_key") || "";
  });

  const [documents, setDocuments] = useState<DocumentFile[]>(() => {
    const saved = localStorage.getItem("menteea_documents");
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("menteea_messages");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeDocId, setActiveDocId] = useState<string | null>(() => {
    return localStorage.getItem("menteea_active_doc_id") || null;
  });

  const [viewerPageNumber, setViewerPageNumber] = useState<number>(() => {
    const saved = localStorage.getItem("menteea_viewer_page") || "1";
    return parseInt(saved, 10);
  });

  // UI state variables
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [mindMapDoc, setMindMapDoc] = useState<DocumentFile | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizDoc, setQuizDoc] = useState<DocumentFile | null>(null);
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [studyGuideDoc, setStudyGuideDoc] = useState<DocumentFile | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"quickstart" | "docs" | "faq" | "samples" | "legal-privacy" | "legal-terms" | "legal-security">("quickstart");

  // Panel resizing states
  const [libraryWidth, setLibraryWidth] = useState<number>(() => {
    const saved = localStorage.getItem("menteea_panel_library_width");
    return saved ? parseInt(saved, 10) : 280;
  });

  const [assistantWidth, setAssistantWidth] = useState<number>(() => {
    const saved = localStorage.getItem("menteea_panel_assistant_width");
    return saved ? parseInt(saved, 10) : 400;
  });

  const handleLibraryMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = libraryWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(450, startWidth + (moveEvent.clientX - startX)));
      setLibraryWidth(newWidth);
      localStorage.setItem("menteea_panel_library_width", newWidth.toString());
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleAssistantMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = assistantWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(300, Math.min(700, startWidth - (moveEvent.clientX - startX)));
      setAssistantWidth(newWidth);
      localStorage.setItem("menteea_panel_assistant_width", newWidth.toString());
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // 2. Persistent Storage Syncs
  useEffect(() => {
    localStorage.setItem("menteea_workspace_active", (!showLandingPage).toString());
  }, [showLandingPage]);

  useEffect(() => {
    localStorage.setItem("menteea_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("menteea_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem("menteea_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeDocId) {
      localStorage.setItem("menteea_active_doc_id", activeDocId);
    } else {
      localStorage.removeItem("menteea_active_doc_id");
    }
  }, [activeDocId]);

  useEffect(() => {
    localStorage.setItem("menteea_viewer_page", viewerPageNumber.toString());
  }, [viewerPageNumber]);

  // Find info about the currently active PDF document
  const activeDoc = documents.find((doc) => doc.id === activeDocId) || null;
  const activeDocPagesCount = activeDoc ? activeDoc.pages.length : 1;

  // Ensure viewer page stays in boundary
  useEffect(() => {
    if (viewerPageNumber > activeDocPagesCount) {
      setViewerPageNumber(1);
    }
  }, [activeDocId, activeDocPagesCount]);

  // 3. Document Action Handlers
  const handleSelectDocForViewer = (id: string) => {
    setActiveDocId(id);
    setViewerPageNumber(1);
  };

  const handleToggleDocSelection = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, isSelected: !doc.isSelected } : doc))
    );
  };

  const handleDeleteDoc = (id: string) => {
    if ((window as any)._pdfBuffers) {
      (window as any)._pdfBuffers.delete(id);
    }
    
    // Also delete the PDF buffer from IndexedDB persistent storage
    deletePdfBuffer(id).catch((err) => {
      console.error("[App] Failed to delete PDF from IndexedDB:", err);
    });

    setDocuments((prev) => {
      const updated = prev.filter((doc) => doc.id !== id);
      if (activeDocId === id) {
        if (updated.length > 0) {
          setActiveDocId(updated[0].id);
          setViewerPageNumber(1);
        } else {
          setActiveDocId(null);
          setViewerPageNumber(1);
        }
      }
      return updated;
    });
  };

  const handleUploadStart = () => {
    setIsLoading(true);
    setLoadingStatus("Uploading and extracting PDF text...");
    setErrorAlert(null);
  };

  const handleUploadProgress = (status: string) => {
    setLoadingStatus(status);
  };

  const handleUploadEnd = (newDoc: DocumentFile) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setViewerPageNumber(1);
    setIsLoading(false);

    // Create introductory lightweight message in the chat
    const introContent = newDoc.summaryError
      ? `Document indexed successfully.\n\nThe document has been fully processed and is ready for research.\n\nA summary could not be generated at this time due to temporary AI service availability.\n\nYou can still:\n✓ Ask questions\n✓ Generate study guides\n✓ Create quizzes\n✓ Explore the document\n\nTry generating a summary again later.`
      : `✓ Document indexed successfully.\n\nReady to answer questions.`;

    const summaryMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "assistant",
      content: introContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: newDoc.initialSuggestions || [],
      isInitialSummary: true,
    };

    setMessages((prev) => [...prev, summaryMsg]);
  };

  const handleAddSampleDocument = (doc: DocumentFile) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.map((d) => d.id === doc.id ? { ...d, isSelected: true } : d);
      }
      return [doc, ...prev];
    });
    setActiveDocId(doc.id);
    setViewerPageNumber(1);
    
    const sampleWelcomeMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "assistant",
      content: `I have loaded the sample document: **${doc.name}**.\n\nYou can now:\n1. Chat with me directly about its contents below.\n2. Open the active learning drawers to generate an interactive **Mind Map**, run a **Quiz**, or compile a complete **Study Guide**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: doc.initialSuggestions || [],
      isInitialSummary: true
    };
    setMessages((prev) => [...prev, sampleWelcomeMsg]);
  };

  const handleUploadError = (err: string) => {
    setIsLoading(false);
    setErrorAlert(err);
  };

  // 4. Chat/AI Handler
  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!content.trim() || isLoading) return false;

    // Create User Message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setLoadingStatus("Thinking...");
    setErrorAlert(null);

    try {
      // Gather selected documents text context
      const selectedDocs = documents.filter((doc) => doc.isSelected);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: updatedMessages,
          selectedDocuments: selectedDocs,
          selectedDocumentIds: selectedDocs.map((doc) => doc.id),
        }),
      });

      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error("Failed to receive a response from the AI service.");
        }

        const errMessage = errData?.error || "";

        // Task 4: Improve error mapping
        if (errData?.code === "INVALID_API_KEY" || errMessage.toLowerCase().includes("api key")) {
          throw new Error("Invalid Gemini API key. Please verify your API key.");
        }
        if (
          errData?.code === "RATE_LIMITED" ||
          errMessage.toLowerCase().includes("quota") ||
          errMessage.toLowerCase().includes("limit")
        ) {
          throw new Error(
            "Gemini API quota exceeded. Document indexing completed successfully, but AI generation is temporarily unavailable. Please try again later or use another API key."
          );
        }
        if (
          errData?.code === "AI_SERVICE_UNAVAILABLE" ||
          errMessage.toLowerCase().includes("unavailable")
        ) {
          throw new Error("Gemini services are experiencing high demand. Please try again shortly.");
        }

        throw new Error(errMessage || "An unexpected error occurred while processing your request.");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: data.suggestions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      return true;
    } catch (err: unknown) {
      console.error("Chat Error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while processing your request.";

      setErrorAlert(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindMap = (doc: DocumentFile) => {
    if (!apiKey) {
      setIsApiKeyOpen(true);
      setErrorAlert("Please configure a valid Gemini API key first.");
      return;
    }
    setMindMapDoc(doc);
    setIsMindMapOpen(true);
  };

  const handleGenerateQuiz = (doc: DocumentFile) => {
    if (!apiKey) {
      setIsApiKeyOpen(true);
      setErrorAlert("Please configure a valid Gemini API key first.");
      return;
    }
    setQuizDoc(doc);
    setIsQuizOpen(true);
  };

  const handleGenerateStudyGuide = (doc: DocumentFile) => {
    if (!apiKey) {
      setIsApiKeyOpen(true);
      setErrorAlert("Please configure a valid Gemini API key first.");
      return;
    }
    setStudyGuideDoc(doc);
    setIsStudyGuideOpen(true);
  };

  const handleAskInChat = (question: string) => {
    handleSendMessage(question);
  };

  // Click citation to jump to specific page
  const handleJumpToPage = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= activeDocPagesCount) {
      setViewerPageNumber(pageNum);
    } else {
      setErrorAlert(`Cannot jump to Page ${pageNum}. This document contains ${activeDocPagesCount} pages.`);
    }
  };

  // Clear workspace session data
  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to clear your current library and chat history?")) {
      setDocuments([]);
      setMessages([]);
      setActiveDocId(null);
      setViewerPageNumber(1);
      setErrorAlert(null);
      localStorage.removeItem("menteea_documents");
      localStorage.removeItem("menteea_messages");
      localStorage.removeItem("menteea_active_doc_id");
      localStorage.removeItem("menteea_viewer_page");
      if ((window as any)._pdfBuffers) {
        (window as any)._pdfBuffers.clear();
      }
      
      // Also clear all persisted PDF buffers from IndexedDB
      clearAllPdfBuffers().catch((err) => {
        console.error("[App] Failed to clear IndexedDB PDF buffers:", err);
      });
    }
  };

  // Render Landing Page first if workspace is not active
  if (showLandingPage) {
    return (
      <>
        <LandingPage
          onStart={() => setShowLandingPage(false)}
          onOpenApiKey={() => setIsApiKeyOpen(true)}
          hasApiKey={!!apiKey}
          onOpenHelpCenter={(tab) => {
            setActiveHelpTab(tab);
            setIsHelpOpen(true);
          }}
        />
        <ApiKeyModal
          isOpen={isApiKeyOpen}
          onClose={() => setIsApiKeyOpen(false)}
          currentKey={apiKey}
          onSaveKey={(key) => setApiKey(key)}
        />
        <HelpCenterModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          onAddDocument={handleAddSampleDocument}
          activeTab={activeHelpTab}
          setActiveTab={setActiveHelpTab}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-app overflow-hidden font-sans text-text-primary theme-transition">
      {/* Dynamic Error Alert Banner */}
      {errorAlert && (
        <div className="bg-rose-50 border-b border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 px-6 py-2.5 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 shrink-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-semibold">Workspace Alert:</span>
            <span>{errorAlert}</span>
          </div>
          <button
            onClick={() => setErrorAlert(null)}
            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Header */}
      <header className="h-14 bg-bg-surface border-b border-border-custom px-6 flex items-center justify-between z-20 shrink-0 theme-transition">
        <div className="flex items-center gap-4">
          <div
            onClick={() => setShowLandingPage(true)}
            className="cursor-pointer hover:opacity-85 transition"
          >
            <MenteeaLogo showVersion={true} size={26} />
          </div>
          <div className="h-4 w-[1px] bg-border-custom" />
          <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Research Desk
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsApiKeyOpen(true)}
            title={apiKey ? "Using your personal Gemini API key." : "Connect your Gemini API key to activate AI features."}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              apiKey
                ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400"
                : "bg-bg-surface border-border-custom text-text-primary hover:bg-bg-secondary"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apiKey ? "bg-emerald-500 animate-pulse" : "bg-text-muted"}`} />
            <span>{apiKey ? "Gemini Connected" : "Connect Gemini"}</span>
          </button>

          {/* Premium Light/Dark Theme Toggle */}
          <button
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            className="flex items-center gap-1.5 border border-border-custom bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-secondary rounded transition-all duration-200 active:scale-95 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Theme" : "Switch to Light Theme"}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-neutral-500" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Light</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setActiveHelpTab("quickstart");
              setIsHelpOpen(true);
            }}
            className="flex items-center gap-1.5 border border-border-custom bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-secondary rounded transition-all duration-200 active:scale-95 cursor-pointer"
            title="Open Help Center & Technical Documentation"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
            <span>Help & Docs</span>
          </button>

          <button
            onClick={handleResetSession}
            className="flex items-center gap-1.5 border border-border-custom bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-secondary rounded transition-all duration-200 active:scale-95 cursor-pointer"
            title="Reset Library & Chats"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Space
          </button>

          <button
            onClick={() => setShowLandingPage(true)}
            className="flex items-center gap-1.5 border border-border-custom bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-secondary rounded transition-all duration-200 active:scale-95 cursor-pointer"
            title="Return to Landing Page"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      </header>

      {/* Three Column Grid Container or Welcome Onboarding Card */}
      {!apiKey ? (
        <div className="flex-1 flex items-center justify-center bg-bg-app p-6 overflow-y-auto theme-transition">
          <div className="w-full max-w-xl rounded-2xl border border-border-custom bg-bg-surface p-8 shadow-xl text-left space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                <Sparkles className="h-6 w-6 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-sans tracking-tight text-text-primary">
                  Welcome to Menteea
                </h2>
                <p className="text-xs text-text-muted mt-0.5 font-medium">
                  v1.0 Workspace Activation
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Connect your Gemini API key to unlock grounded conversations, mind maps, quizzes, study guides, and document intelligence features. Menteea runs completely locally and secures your credentials directly in your browser.
            </p>

            {/* Step Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary/40 border border-border-custom/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-primary">Get a Gemini API Key</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed font-semibold">
                    Obtain a free or paid API key instantly in Google AI Studio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary/40 border border-border-custom/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-primary">Connect Your Key</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed font-semibold">
                    Paste and validate your key securely within Menteea settings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary/40 border border-border-custom/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold">
                  3
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-primary">Upload a Document</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed font-semibold">
                    Import any research paper, book, or notes in PDF format.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary/40 border border-border-custom/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold">
                  4
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-primary">Start Learning</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed font-semibold">
                    Generate instant summaries, custom quizzes, and mind maps.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-custom">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-text-muted hover:text-indigo-500 transition duration-150 inline-flex items-center gap-1"
              >
                Learn more about Google AI Studio <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setIsApiKeyOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Key className="h-4 w-4" />
                Connect API Key
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden w-full h-full relative">
          {/* Column 1: Left Library Panel */}
          <div 
            style={{ width: `${libraryWidth}px` }} 
            className="h-full shrink-0 overflow-hidden"
          >
            <LibraryPanel
              documents={documents}
              activeDocId={activeDocId}
              onSelectDocForViewer={handleSelectDocForViewer}
              onToggleDocSelection={handleToggleDocSelection}
              onUploadStart={handleUploadStart}
              onUploadProgress={handleUploadProgress}
              onUploadEnd={handleUploadEnd}
              onUploadError={handleUploadError}
              apiKey={apiKey}
              onDeleteDoc={handleDeleteDoc}
            />
          </div>

          {/* Resize Handle 1: Between Library and PDF Viewer */}
          <div
            onMouseDown={handleLibraryMouseDown}
            className="w-1 cursor-col-resize hover:bg-neutral-300 dark:hover:bg-neutral-700 active:bg-neutral-400 dark:active:bg-neutral-600 transition-colors h-full shrink-0 z-30 bg-bg-app border-l border-r border-border-custom/50"
            title="Drag to resize library panel"
          />

          {/* Column 2: Center PDF Canvas Viewer */}
          <div className="flex-1 h-full min-w-[350px] overflow-hidden">
            <PDFViewerPanel
              documentId={activeDocId}
              documentName={activeDoc ? activeDoc.name : null}
              pageNumber={viewerPageNumber}
              onPageChange={(page) => setViewerPageNumber(page)}
              totalPages={activeDocPagesCount}
              pageText={activeDoc?.pages.find((p) => p.pageNumber === viewerPageNumber)?.text || null}
              documents={documents}
              onGenerateMindMap={handleGenerateMindMap}
              onGenerateQuiz={handleGenerateQuiz}
              onGenerateStudyGuide={handleGenerateStudyGuide}
            />
          </div>

          {/* Resize Handle 2: Between PDF Viewer and AI Assistant */}
          <div
            onMouseDown={handleAssistantMouseDown}
            className="w-1 cursor-col-resize hover:bg-neutral-300 dark:hover:bg-neutral-700 active:bg-neutral-400 dark:active:bg-neutral-600 transition-colors h-full shrink-0 z-30 bg-bg-app border-l border-r border-border-custom/50"
            title="Drag to resize assistant panel"
          />

          {/* Column 3: Right AI Assistant (Chat Panel) */}
          <div 
            style={{ width: `${assistantWidth}px` }} 
            className="h-full shrink-0 overflow-hidden"
          >
            <ChatPanel
              messages={messages}
              selectedDocuments={documents.filter((doc) => doc.isSelected)}
              onSendMessage={handleSendMessage}
              onJumpToPage={handleJumpToPage}
              isLoading={isLoading && loadingStatus === "Thinking..."}
              loadingStatus={loadingStatus}
            />
          </div>
        </div>
      )}

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        currentKey={apiKey}
        onSaveKey={(key) => setApiKey(key)}
      />

      <MindMapPanel
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
        document={mindMapDoc}
        apiKey={apiKey}
        selectedDocuments={documents}
        onAskInChat={handleAskInChat}
      />

      <QuizPanel
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        document={quizDoc}
        apiKey={apiKey}
        selectedDocuments={documents}
      />

      <StudyGuidePanel
        isOpen={isStudyGuideOpen}
        onClose={() => setIsStudyGuideOpen(false)}
        document={studyGuideDoc}
        apiKey={apiKey}
        selectedDocuments={documents}
      />

      <HelpCenterModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onAddDocument={handleAddSampleDocument}
        activeTab={activeHelpTab}
        setActiveTab={setActiveHelpTab}
      />
    </div>
  );
}