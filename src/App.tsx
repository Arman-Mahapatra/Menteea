import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import LibraryPanel from "./components/LibraryPanel";
import ChatPanel from "./components/ChatPanel";
import PDFViewerPanel from "./components/PDFViewerPanel";
import ApiKeyModal from "./components/ApiKeyModal";
import { DocumentFile, ChatMessage } from "./types";
import { Sparkles, Key, RefreshCw, LogOut, FileText, AlertTriangle, X, Sun, Moon } from "lucide-react";

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

    // Create introductory lightweight message in the chat (Task 3)
    const introContent = `✓ Document indexed successfully.

Ready to answer questions.`;

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

  const handleUploadError = (err: string) => {
    setIsLoading(false);
    setErrorAlert(err);
  };

  // 4. Chat/AI Handler
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

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
            "Daily Gemini API quota reached. Please wait for quota reset or use another API key."
          );
        }
        if (
          errData?.code === "AI_SERVICE_UNAVAILABLE" ||
          errMessage.toLowerCase().includes("unavailable")
        ) {
          throw new Error("Gemini is temporarily unavailable. Please try again shortly.");
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
    } catch (err: unknown) {
      console.error("Chat Error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while processing your request.";

      setErrorAlert(message);
    } finally {
      setIsLoading(false);
    }
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
        />
        <ApiKeyModal
          isOpen={isApiKeyOpen}
          onClose={() => setIsApiKeyOpen(false)}
          currentKey={apiKey}
          onSaveKey={(key) => setApiKey(key)}
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
          <h1
            onClick={() => setShowLandingPage(true)}
            className="font-serif font-bold text-xl italic tracking-tight text-text-primary cursor-pointer hover:opacity-85 transition"
          >
            Menteea <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-text-muted align-top ml-1">v0.1</span>
          </h1>
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
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold rounded transition cursor-pointer ${
              apiKey
                ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400"
                : "bg-bg-surface border-border-custom text-text-primary hover:bg-bg-secondary"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            {apiKey ? "API Key Configured" : "Add API Key"}
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

      {/* Three Column Grid Container */}
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

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        currentKey={apiKey}
        onSaveKey={(key) => setApiKey(key)}
      />
    </div>
  );
}

