import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Expand,
  Sparkles,
  X,
  ChevronDown
} from "lucide-react";
import { DocumentFile } from "../types";

interface PDFViewerPanelProps {
  documentId: string | null;
  documentName: string | null;
  pageNumber: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  pageText?: string | null;
  documents: DocumentFile[];
  onGenerateMindMap?: (doc: DocumentFile) => void;
  onGenerateQuiz?: (doc: DocumentFile) => void;
  onGenerateStudyGuide?: (doc: DocumentFile) => void;
}

type ZoomMode = "fit-width" | "fit-page" | "manual";

export default function PDFViewerPanel({
  documentId,
  documentName,
  pageNumber,
  onPageChange,
  totalPages,
  pageText,
  documents,
  onGenerateMindMap,
  onGenerateQuiz,
  onGenerateStudyGuide,
}: PDFViewerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit-width");
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTextFallback, setIsTextFallback] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auto-clear toast notice after 3 seconds
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Monitor fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const loadedDocIdRef = useRef<string | null>(null);

  // Load the PDF.js document whenever active documentId changes
  useEffect(() => {
    if (!documentId) {
      setPdfDocument(null);
      setErrorMsg(null);
      setIsTextFallback(false);
      loadedDocIdRef.current = null;
      return;
    }

    if (loadedDocIdRef.current === documentId && (pdfDocument || isTextFallback)) {
      return;
    }

    const loadPdf = async () => {
      setIsRendering(true);
      setErrorMsg(null);
      setIsTextFallback(false);
      try {
        let globalBuffers = (window as any)._pdfBuffers;
        if (!globalBuffers) {
          (window as any)._pdfBuffers = new Map<string, ArrayBuffer>();
          globalBuffers = (window as any)._pdfBuffers;
        }

        const buffer = globalBuffers.get(documentId);
        if (!buffer) {
          if (pageText !== undefined) {
            setIsTextFallback(true);
            setPdfDocument(null);
            loadedDocIdRef.current = documentId;
            return;
          }
          throw new Error("PDF buffer not found in local session. Try uploading the document again.");
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("PDF.js library failed to load.");
        }

        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        loadedDocIdRef.current = documentId;
      } catch (err: any) {
        console.error("PDF load error:", err);
        setErrorMsg(err.message || "Failed to load PDF document.");
      } finally {
        setIsRendering(false);
      }
    };

    loadPdf();
  }, [documentId, pageText]);

  // Calculate Scale based on Mode
  const calculateScale = async (mode: ZoomMode, doc = pdfDocument, pgNum = pageNumber) => {
    if (!doc || !containerRef.current) return;
    try {
      const page = await doc.getPage(pgNum);
      const padding = 48; // Padding surrounding the canvas
      const containerWidth = Math.max(100, containerRef.current.clientWidth - padding);
      const containerHeight = Math.max(100, containerRef.current.clientHeight - padding);
      const viewport = page.getViewport({ scale: 1.0 });

      if (mode === "fit-width") {
        const fitScale = containerWidth / viewport.width;
        setScale(fitScale);
      } else if (mode === "fit-page") {
        const fitWidthScale = containerWidth / viewport.width;
        const fitHeightScale = containerHeight / viewport.height;
        const fitScale = Math.min(fitWidthScale, fitHeightScale);
        setScale(fitScale);
      }
    } catch (err) {
      console.error("Scale calculation error:", err);
    }
  };

  // Recalculate scale when page, doc, or zoom mode changes
  useEffect(() => {
    if (pdfDocument) {
      calculateScale(zoomMode);
    }
  }, [pdfDocument, pageNumber, zoomMode]);

  // Listen to container resizing to adjust width fluidly
  useEffect(() => {
    if (!pdfDocument || !containerRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateScale(zoomMode);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pdfDocument, zoomMode, pageNumber]);

  // Handle rendering a specific page number
  const renderPage = async () => {
    if (!pdfDocument || !canvasRef.current) return;

    setIsRendering(true);
    try {
      // Cancel any ongoing rendering tasks to prevent overlaps
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore
        }
      }

      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Adjust for high-DPI displays to ensure extremely crisp, sharp text
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;

      // Set CSS dimensions
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.scale(dpr, dpr);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err.name !== "RenderingCancelledException") {
        console.error("Page render error:", err);
      }
    } finally {
      setIsRendering(false);
    }
  };

  // Render on page or scale changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage();
    }
  }, [pdfDocument, pageNumber, scale]);

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      onPageChange(pageNumber + 1);
    }
  };

  const handleZoomIn = () => {
    setZoomMode("manual");
    setScale((prev) => Math.min(prev + 0.15, 4.0));
  };

  const handleZoomOut = () => {
    setZoomMode("manual");
    setScale((prev) => Math.max(prev - 0.15, 0.4));
  };

  const handleFitWidth = () => {
    setZoomMode("fit-width");
  };

  const handleFitPage = () => {
    setZoomMode("fit-page");
  };

  const handleFullscreen = () => {
    if (!panelRef.current) return;
    if (!document.fullscreenElement) {
      panelRef.current.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full bg-bg-app border-l border-border-custom overflow-hidden theme-transition"
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-bg-surface border-b border-border-custom px-4 h-12 shrink-0 z-10 select-none theme-transition">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 text-text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary truncate max-w-[140px] md:max-w-xs">
            {documentName || "PDF Document Viewer"}
          </span>
        </div>

        {/* Center: Page Controls */}
        {(pdfDocument || isTextFallback) && (
          <div className="flex items-center gap-2 border-l border-r border-border-custom/40 px-3">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber <= 1}
              className="p-1 hover:bg-bg-secondary rounded text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-serif font-bold italic text-text-primary min-w-[70px] text-center">
              Page {pageNumber} <span className="text-[10px] font-sans font-medium uppercase tracking-tight not-italic text-text-muted">of</span> {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageNumber >= totalPages}
              className="p-1 hover:bg-bg-secondary rounded text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right: Zoom & Settings or Fallback Indicator */}
        {pdfDocument ? (
          <div className="flex items-center gap-1.5 pl-3 flex-1 justify-end">
            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 border-r border-border-custom/50 pr-2">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-bg-secondary rounded text-text-secondary transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-mono text-text-muted w-11 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-bg-secondary rounded text-text-secondary transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Fit Modes */}
            <div className="flex items-center gap-1 border-r border-border-custom/50 pr-2">
              <button
                onClick={handleFitWidth}
                className={`p-1 rounded transition cursor-pointer ${
                  zoomMode === "fit-width" ? "bg-bg-secondary text-text-primary font-bold" : "text-text-muted hover:bg-bg-secondary"
                }`}
                title="Fit to Width"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleFitPage}
                className={`p-1 rounded transition cursor-pointer ${
                  zoomMode === "fit-page" ? "bg-bg-secondary text-text-primary font-bold" : "text-text-muted hover:bg-bg-secondary"
                }`}
                title="Fit to Page"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Fullscreen Mode */}
            <button
              onClick={handleFullscreen}
              className={`p-1 rounded transition cursor-pointer ${
                isFullscreen ? "bg-bg-secondary text-text-primary" : "text-text-muted hover:bg-bg-secondary"
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
              <Expand className="h-4 w-4" />
            </button>
          </div>
        ) : isTextFallback ? (
          <div className="flex items-center gap-1.5 pl-3 flex-1 justify-end">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              Reader Mode Active
            </span>
          </div>
        ) : null}
      </div>

      {/* Toast Announcement Notification Overlay */}
      {toastMsg && (
        <div className="mx-4 mt-3 p-3 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 rounded-xl flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-300 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded text-indigo-600 dark:text-indigo-400 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Document Intelligence Collapsible Drawer */}
      {documents.filter((doc) => doc.isSelected).length === 1 && (
        <div className="flex flex-col shrink-0 theme-transition select-none z-10">
          {/* Collapsed/Header Compact Trigger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="w-full bg-bg-surface hover:bg-bg-secondary/40 border-b border-border-custom px-5 py-2.5 flex items-center justify-between transition-all duration-200 cursor-pointer text-left focus:outline-none"
            title={isDrawerOpen ? "Collapse AI document understanding tools" : "Expand AI document understanding tools"}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  Document Intelligence
                </span>
                <p className="text-[10px] text-text-muted font-medium mt-0.5">
                  AI-powered document understanding tools
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted bg-bg-secondary/60 px-2 py-0.5 border border-border-custom rounded-md transition-colors">
                {isDrawerOpen ? "Hide Tools" : "Show Tools"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-in-out ${
                  isDrawerOpen ? "rotate-180 text-text-primary" : ""
                }`}
              />
            </div>
          </button>

          {/* Drawer Expandable Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden bg-bg-app ${
              isDrawerOpen ? "max-h-96 opacity-100 border-b border-border-custom" : "max-h-0 opacity-0 border-b-0 pointer-events-none"
            }`}
          >
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3.5">
              {/* Premium Action Card: Mind Map */}
              <button
                onClick={() => {
                  const selectedDoc = documents.find((doc) => doc.isSelected);
                  if (selectedDoc) {
                    onGenerateMindMap?.(selectedDoc);
                  }
                }}
                className="flex items-start gap-3.5 p-3.5 bg-bg-surface hover:bg-indigo-50/30 dark:hover:bg-indigo-950/15 border border-border-custom hover:border-indigo-200/50 dark:hover:border-indigo-900/40 rounded-xl transition-all duration-200 cursor-pointer text-left w-full sm:w-[calc(50%-8px)] lg:w-72 group shadow-2xs hover:shadow-xs active:scale-98 shrink-0"
                title="Generate interactive Mind Map for this document"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200 shrink-0">🧠</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors leading-snug">
                    Mind Map
                  </h4>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1 leading-normal font-medium">
                    Visualize major concepts
                  </p>
                </div>
              </button>

              {/* Premium Action Card: Quiz Generator */}
              <button
                onClick={() => {
                  const selectedDoc = documents.find((doc) => doc.isSelected);
                  if (selectedDoc) {
                    onGenerateQuiz?.(selectedDoc);
                  }
                }}
                className="flex items-start gap-3.5 p-3.5 bg-bg-surface hover:bg-emerald-50/30 dark:hover:bg-emerald-950/15 border border-border-custom hover:border-emerald-200/50 dark:hover:border-emerald-900/40 rounded-xl transition-all duration-200 cursor-pointer text-left w-full sm:w-[calc(50%-8px)] lg:w-72 group shadow-2xs hover:shadow-xs active:scale-98 shrink-0"
                title="Test your understanding with AI practice quizzes"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200 shrink-0">📝</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors leading-snug">
                    Quiz Generator
                  </h4>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1 leading-normal font-medium">
                    Test your understanding
                  </p>
                </div>
              </button>

              {/* Premium Action Card: Study Guide */}
              <button
                onClick={() => {
                  const selectedDoc = documents.find((doc) => doc.isSelected);
                  if (selectedDoc) {
                    onGenerateStudyGuide?.(selectedDoc);
                  }
                }}
                className="flex items-start gap-3.5 p-3.5 bg-bg-surface hover:bg-indigo-50/30 dark:hover:bg-indigo-950/15 border border-border-custom hover:border-indigo-200/50 dark:hover:border-indigo-900/40 rounded-xl transition-all duration-200 cursor-pointer text-left w-full sm:w-[calc(50%-8px)] lg:w-72 group shadow-2xs hover:shadow-xs active:scale-98 shrink-0"
                title="Synthesize structured study revision outlines"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200 shrink-0">📚</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors leading-snug">
                    Study Guide
                  </h4>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1 leading-normal font-medium">
                    Structured revision
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Viewer Container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto p-6 relative min-h-0 ${
          !documentId || errorMsg ? "flex items-center justify-center" : ""
        }`}
      >
        {!documentId ? (
          <div className="flex flex-col items-center justify-center text-center max-w-sm m-auto p-8 select-none">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-bg-surface shadow-sm mb-5 text-text-muted border border-border-custom/50">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-serif font-bold italic text-lg text-text-primary leading-snug">
              Begin Your Active Research Desk
            </h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed font-sans px-4">
              Upload one or more PDFs to get started. Once uploaded, you can immediately:
            </p>
            <div className="mt-4 text-[11px] font-semibold text-text-secondary space-y-2 text-left bg-bg-secondary/40 border border-border-custom/50 rounded-xl p-3.5 w-full">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span>Generate interactive <strong className="text-text-primary">Mind Maps</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span>Create custom <strong className="text-text-primary">Quizzes</strong> & evaluations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span>Synthesize comprehensive <strong className="text-text-primary">Study Guides</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span>Study with adaptive <strong className="text-text-primary">Flashcards</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span>Chat with citations & grounded answers</span>
              </div>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center text-center max-w-xs m-auto text-rose-500">
            <p className="text-xs font-semibold">Viewer Error</p>
            <p className="text-[10px] text-rose-400 mt-1">{errorMsg}</p>
          </div>
        ) : isTextFallback ? (
          <div className="max-w-2xl mx-auto my-4 font-serif">
            {/* Elegant Info Banner */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-sans uppercase tracking-wider">
              <span>Reader Mode: Extracted text view. Source PDF buffer expired.</span>
            </div>
            
            <div className="relative shadow-md border border-border-custom bg-white dark:bg-[#151821] rounded-md p-8 md:p-12 transition-all duration-200 select-text">
              <div className="text-xs uppercase tracking-widest text-text-muted font-sans font-bold border-b border-border-custom/40 pb-3 mb-6 flex justify-between select-none">
                <span>Page {pageNumber}</span>
                <span className="font-serif italic capitalize">Text Reader</span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap font-serif">
                {pageText || "This page has no extracted text content."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto select-none font-sans" style={{ width: "fit-content" }}>
            <div className="relative shadow-2xl border border-border-custom bg-white dark:bg-[#151821] rounded-sm overflow-hidden p-1.5 transition-all duration-200">
              <canvas ref={canvasRef} className="block transition-all duration-150" />
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/40 backdrop-blur-[1px] transition-opacity">
                  <Loader2 className="h-5 w-5 text-text-primary animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

