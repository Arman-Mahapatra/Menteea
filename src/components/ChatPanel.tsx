import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Send, Sparkles, User, HelpCircle, Loader2, FileText, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { ChatMessage, DocumentFile } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  selectedDocuments: DocumentFile[];
  onSendMessage: (content: string) => void;
  onJumpToPage: (pageNumber: number) => void;
  isLoading: boolean;
  loadingStatus: string;
}

export default function ChatPanel({
  messages,
  selectedDocuments,
  onSendMessage,
  onJumpToPage,
  isLoading,
  loadingStatus,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Reset showAllSuggestions when messages count changes
  useEffect(() => {
    setShowAllSuggestions(false);
  }, [messages.length]);

  // Auto-scroll on new messages or loading/expansion state changes
  useEffect(() => {
    if (scrollRef.current) {
      const scroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };
      scroll();
      const timer = setTimeout(scroll, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, showAllSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  // Convert (Page X) or [Page X] or (Page X, Y) into a clean Markdown link so we can intercept it
  const preprocessCitations = (content: string) => {
    // Replace (Page X) or (page X) with [Page X](#page-X)
    let processed = content.replace(/\([Pp]age (\d+)\)/g, "[Page $1](#page-$1)");
    // Also support [Page X] or [page X]
    processed = processed.replace(/\[[Pp]age (\d+)\]/g, "[Page $1](#page-$1)");
    return processed;
  };

  // Get active suggestions from the very last message in the chat (if assistant)
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const activeSuggestions =
    lastMessage && lastMessage.role === "assistant" && lastMessage.suggestions
      ? lastMessage.suggestions
      : [];

  const hasMore = activeSuggestions.length > 4;
  const visibleSuggestions = showAllSuggestions
    ? activeSuggestions
    : activeSuggestions.slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-bg-app theme-transition">
      {/* Top Context Indicator Bar */}
      <div className="flex items-center justify-between bg-bg-surface border-b border-border-custom px-6 py-3.5 shrink-0 theme-transition">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Workspace Chat</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            Context:
          </span>
          {selectedDocuments.length === 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 border border-amber-200/50 dark:border-amber-900/30 rounded">
              General Knowledge
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-text-secondary bg-bg-secondary px-2.5 py-0.5 border border-border-custom rounded">
              {selectedDocuments.length} {selectedDocuments.length === 1 ? "document" : "documents"}
            </span>
          )}
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center py-16 select-none">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-text-primary text-bg-surface shadow-xs mb-5">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <h3 className="font-serif font-bold italic text-lg text-text-primary mb-2.5">
                Start Researching with AI
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                Upload PDFs to your library on the left, ensure they are selected, and submit research inquiries. Instant page citations will guide your reading.
              </p>
              {selectedDocuments.length > 0 && selectedDocuments[0].initialSuggestions && (
                <div className="w-full space-y-2 text-left">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-3.5 text-center">
                    Suggested Investigations
                  </p>
                  {selectedDocuments[0].initialSuggestions.slice(0, 3).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(suggestion)}
                      className="w-full text-left text-xs bg-bg-surface hover:bg-bg-secondary border border-border-custom hover:border-text-muted rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-between text-text-secondary group shadow-xs cursor-pointer"
                    >
                      <span className="truncate pr-4 font-medium">{suggestion}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-text-muted group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 items-start ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {/* Avatar for Assistant */}
                  {isAssistant && (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-text-primary text-bg-surface shrink-0 text-[10px] font-bold font-serif italic shadow-xs">
                      M
                    </div>
                  )}

                  {/* Message Body */}
                  <div className={`max-w-[85%] space-y-1 ${!isAssistant ? "ml-auto" : ""}`}>
                    {isAssistant && msg.isInitialSummary && (
                      <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1 font-sans">
                        Document Summary Analysis
                      </p>
                    )}
                    <div
                      className={`text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-transparent text-text-primary font-sans"
                          : "bg-bg-surface border border-border-custom px-4 py-2.5 rounded-xl shadow-xs text-text-primary"
                      }`}
                    >
                      {isAssistant ? (
                        <div className="markdown-body space-y-3 font-sans">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="my-2 leading-relaxed text-text-primary">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-text-secondary">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-text-secondary">{children}</ol>,
                              li: ({ children }) => <li className="my-0.5">{children}</li>,
                              strong: ({ children }) => <strong className="font-bold text-text-primary font-serif italic">{children}</strong>,
                              code: ({ children }) => (
                                <code className="font-mono text-xs bg-bg-secondary text-text-primary rounded px-1.5 py-0.5 border border-border-custom">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="font-mono text-xs bg-bg-secondary text-text-primary rounded border border-border-custom p-3.5 my-2.5 overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-3 rounded border border-border-custom bg-bg-surface">
                                  <table className="min-w-full divide-y divide-border-custom border-collapse">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-bg-app">{children}</thead>,
                              tbody: ({ children }) => <tbody className="divide-y divide-border-custom/50 bg-bg-surface">{children}</tbody>,
                              tr: ({ children }) => <tr>{children}</tr>,
                              th: ({ children }) => (
                                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-text-secondary">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-4 py-2 text-xs text-text-secondary border-t border-border-custom/50">
                                  {children}
                                </td>
                              ),
                              a: ({ href, children, ...props }) => {
                                if (href && href.startsWith("#page-")) {
                                  const pageNum = parseInt(href.replace("#page-", ""), 10);
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onJumpToPage(pageNum);
                                      }}
                                      className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer hover:bg-emerald-500/20 transition mx-0.5"
                                    >
                                      p. {pageNum}
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-primary underline hover:text-text-secondary font-serif italic"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              },
                            }}
                          >
                            {preprocessCitations(msg.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <div className={`text-[9px] text-text-muted font-mono ${!isAssistant ? "text-right" : "mt-1.5"}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Avatar for User */}
                  {!isAssistant && (
                    <div className="flex h-6 w-6 items-center justify-center rounded border border-border-custom bg-bg-surface text-text-secondary shrink-0 text-[10px] font-bold shadow-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Streaming / Active Loading state */}
          {isLoading && (
            <div className="flex gap-4 justify-start items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-text-primary text-bg-surface shrink-0 animate-pulse text-[10px] font-bold italic font-serif shadow-xs">
                M
              </div>
              <div className="max-w-[85%]">
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-text-primary" />
                  <span className="font-mono text-[10px] tracking-wider uppercase">{loadingStatus || "Thinking..."}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Suggestions / Continue Exploring */}
          {activeSuggestions.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pt-6 border-t border-border-custom/40 mt-6"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted select-none mb-3 font-sans">
                Continue Exploring
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {visibleSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(suggestion)}
                    className="max-w-[92%] px-5 py-2.5 bg-bg-surface border border-border-custom hover:border-text-muted hover:bg-bg-secondary text-text-secondary hover:text-text-primary rounded-2xl text-xs font-medium tracking-tight shadow-xs transition-all duration-200 cursor-pointer hover:-translate-y-[1px] active:scale-[0.98] flex items-center justify-center select-none text-center leading-snug"
                    title={suggestion}
                  >
                    <span className="line-clamp-2 overflow-hidden text-ellipsis break-words">
                      {suggestion}
                    </span>
                  </button>
                ))}
                {hasMore && !showAllSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowAllSuggestions(true)}
                    className="h-10 px-4 py-2 bg-bg-secondary hover:bg-bg-secondary/80 border border-border-custom hover:border-text-muted rounded-2xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center select-none"
                  >
                    +{activeSuggestions.length - 4} more
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input box */}
      <div className="bg-bg-app border-t border-border-custom/60 px-6 py-5 shrink-0 theme-transition">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              rows={1}
              placeholder={
                selectedDocuments.length === 0
                  ? "Type a query (No active documents selected)..."
                  : "Ask a research question..."
              }
              className="w-full bg-bg-surface border border-border-custom rounded-xl px-4 py-3.5 text-sm text-text-primary outline-none transition focus:border-text-muted focus:ring-1 focus:ring-text-muted disabled:opacity-50 pr-12 shadow-xs resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3.5 w-8 h-8 bg-text-primary hover:opacity-90 text-bg-surface rounded flex items-center justify-center shadow-xs transition disabled:opacity-30 cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
