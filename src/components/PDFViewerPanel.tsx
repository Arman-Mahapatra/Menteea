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
  Expand
} from "lucide-react";

interface PDFViewerPanelProps {
  documentId: string | null;
  documentName: string | null;
  pageNumber: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  pageText?: string | null;
}

type ZoomMode = "fit-width" | "fit-page" | "manual";

export default function PDFViewerPanel({
  documentId,
  documentName,
  pageNumber,
  onPageChange,
  totalPages,
  pageText,
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
              Upload one or more PDFs to begin your research workspace.
            </h3>
            <p className="text-xs text-text-muted mt-3.5 leading-relaxed font-sans px-4">
              Menteea will summarize your documents, answer questions with citations, and help you connect ideas across sources.
            </p>
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
