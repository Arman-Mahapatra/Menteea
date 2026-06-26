import React, { useRef, useState } from "react";
import { Upload, FileText, Check, Plus, Loader2, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { DocumentFile } from "../types";

interface LibraryPanelProps {
  documents: DocumentFile[];
  activeDocId: string | null;
  onSelectDocForViewer: (id: string) => void;
  onToggleDocSelection: (id: string) => void;
  onUploadStart: () => void;
  onUploadProgress: (status: string) => void;
  onUploadEnd: (newDoc: DocumentFile) => void;
  onUploadError: (err: string) => void;
  apiKey: string;
  onDeleteDoc: (id: string) => void;
}

export default function LibraryPanel({
  documents,
  activeDocId,
  onSelectDocForViewer,
  onToggleDocSelection,
  onUploadStart,
  onUploadProgress,
  onUploadEnd,
  onUploadError,
  apiKey,
  onDeleteDoc,
}: LibraryPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentFile | null>(null);

  // Parse PDF and generate summary
  const processPdfFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      onUploadError("Unsupported file type. Please upload a valid PDF.");
      return;
    }

    onUploadStart();
    setLocalProgress("Initializing parser...");

    try {
      // 1. Read file as ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsArrayBuffer(file);
      });

      // 2. Load PDF with PDF.js
      if (!(window as any).pdfjsLib) {
        throw new Error("PDF.js library is not loaded yet. Please wait a moment and try again.");
      }

      const pdfjsLib = (window as any).pdfjsLib;
      // Ensure GlobalWorkerOptions is set
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      setLocalProgress("Loading PDF structure...");
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const pagesData: Array<{ pageNumber: number; text: string }> = [];

      // 3. Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        setLocalProgress(`Extracting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(" ");
        pagesData.push({ pageNumber: i, text: text.trim() });
      }

      // Store binary buffer globally in a window map so the PDF viewer can read it without hitting localStorage quotas
      if (!(window as any)._pdfBuffers) {
        (window as any)._pdfBuffers = new Map<string, ArrayBuffer>();
      }
      const docId = Math.random().toString(36).substring(2, 9);
      (window as any)._pdfBuffers.set(docId, arrayBuffer.slice(0));

      // 4. Summarize via Backend Express API
      setLocalProgress("Generating document summary with Gemini...");
      onUploadProgress("Summarizing...");

      let summaryResult = {
        summary: "An automatic summary could not be generated for this document. However, all pages are fully indexed, and you can start asking questions about it in the chat space.",
        topics: ["Document Research"],
        purpose: "Document loaded successfully for page review and chat context.",
        suggestions: ["Give me an overview of this document", "What are the main key points?"]
      };

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) {
          headers["x-api-key"] = apiKey;
        }

        const response = await fetch("/api/summarize", {
          method: "POST",
          headers,
          body: JSON.stringify({
            documentName: file.name,
            pages: pagesData,
          }),
        });

        if (response.ok) {
          summaryResult = await response.json();
        } else {
          console.warn("Summarization API responded with an error, falling back to basic details.");
        }
      } catch (sumErr) {
        console.error("Failed to fetch document summary:", sumErr);
      }

      // Formulate our final DocumentFile structure
      const newDoc: DocumentFile = {
        id: docId,
        name: file.name,
        pages: pagesData,
        summary: summaryResult.summary,
        topics: summaryResult.topics,
        purpose: summaryResult.purpose,
        initialSuggestions: summaryResult.suggestions,
        uploadTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSelected: true, // Automatically select for chat
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };

      onUploadEnd(newDoc);
    } catch (err: any) {
      console.error(err);
      onUploadError(err.message || "Failed to extract and parse PDF.");
    } finally {
      setLocalProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPdfFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface border-r border-border-custom p-5 theme-transition">
      {/* Title block */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h2 className="font-serif font-bold italic text-lg text-text-primary">
          Library
        </h2>
        <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted bg-bg-secondary px-2 py-0.5 rounded border border-border-custom/40">
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </span>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 mb-5 cursor-pointer transition duration-200 ${
          isDragging
            ? "border-text-primary bg-bg-secondary"
            : "border-border-custom hover:border-text-muted bg-bg-surface"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {localProgress ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <Loader2 className="h-5 w-5 text-text-primary animate-spin" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Processing Document</p>
              <p className="text-[9px] text-text-muted mt-1 font-mono">{localProgress}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-secondary mb-3 text-text-secondary border border-border-custom/50">
              <Upload className="h-4 w-4 text-text-muted" />
            </div>
            <p className="text-xs font-semibold text-text-primary">Drop PDF here</p>
            <p className="text-[9px] text-text-muted uppercase tracking-tight mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Document Library Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center border border-dashed border-border-custom rounded-md p-4 bg-bg-app/50">
            <FileText className="h-6 w-6 text-text-muted/60 mb-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Your library is empty</p>
            <p className="text-[10px] text-text-muted max-w-[180px] mt-1.5 leading-relaxed font-sans">
              Upload research PDFs to build your context vault and start exploring insights.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocForViewer(doc.id)}
                className={`group relative flex flex-col rounded-md border p-3.5 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 ${
                  isActive
                    ? "border-text-primary bg-bg-secondary shadow-xs"
                    : "border-border-custom hover:border-text-muted hover:bg-bg-secondary/40"
                }`}
              >
                {/* Title and inclusion checkbox */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-text-primary" : "text-text-muted"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary leading-snug truncate">
                        {doc.name}
                      </p>
                      <p className="text-[9px] text-text-muted uppercase tracking-tight font-sans mt-0.5">
                        {doc.pages.length} Pages • {doc.size || "Unknown size"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Trash icon button visible on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocToDelete(doc);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded transition-all duration-150 cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDocSelection(doc.id);
                      }}
                      className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                        doc.isSelected
                          ? "bg-text-primary border-text-primary text-bg-surface"
                          : "border-border-custom hover:border-text-muted bg-bg-surface"
                      }`}
                    >
                      {doc.isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </div>

                {/* Summarized visual highlights on active card */}
                {doc.summary && (
                  <div className="mt-3 pt-3 border-t border-border-custom/50">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">
                      <Sparkles className="h-2.5 w-2.5 text-text-muted/80 animate-pulse" />
                      Summary
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3 font-serif italic">
                      "{doc.summary}"
                    </p>

                    {doc.topics && doc.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.topics.slice(0, 3).map((topic, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.5 bg-bg-secondary text-text-secondary rounded-sm font-medium border border-border-custom/40"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helper Context Banner */}
      <div className="mt-4 pt-4 border-t border-border-custom/60 flex gap-2 text-[10px] text-text-muted leading-normal shrink-0">
        <AlertCircle className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
        <span>
          Checked documents are reasoned across together in the workspace.
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 transition-all duration-200">
          <div className="bg-bg-surface rounded-lg shadow-xl border border-border-custom max-w-sm w-full mx-4 p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif font-bold italic text-base text-text-primary">
              Delete "{docToDelete.name}"?
            </h3>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              This removes the document from your current workspace.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-1.5 border border-border-custom hover:border-text-muted text-text-secondary hover:text-text-primary bg-transparent rounded text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteDoc(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
