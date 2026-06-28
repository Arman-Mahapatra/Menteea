import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Sparkles,
  Loader2,
  BookOpen,
  Layers,
  HelpCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Download,
  RefreshCw,
  Award,
  ArrowRight,
  ArrowLeft,
  Flame,
  CheckCircle,
  Eye,
  Info,
  ExternalLink,
  Sigma,
  Zap,
  TrendingUp,
  BookOpenCheck
} from "lucide-react";
import { DocumentFile } from "../types";

interface KeyConcept {
  concept: string;
  explanation: string;
  whyItMatters: string;
}

interface Definition {
  term: string;
  definition: string;
}

interface Formula {
  formula: string;
  meaning: string;
  variables: string;
  usage: string;
}

interface ProcessWorkflow {
  name: string;
  steps: string[];
}

interface CommonMistake {
  mistake: string;
  correction: string;
  explanation: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface StudyGuideData {
  title: string;
  overview: string;
  keyConcepts: KeyConcept[];
  importantDefinitions: Definition[];
  formulae: Formula[];
  processes: ProcessWorkflow[];
  examTips: string[];
  commonMistakes: CommonMistake[];
  revisionChecklist: string[];
  flashcards: Flashcard[];
}

interface StudyGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentFile | null;
  apiKey: string;
  selectedDocuments: DocumentFile[];
}

export default function StudyGuidePanel({
  isOpen,
  onClose,
  document: activeDoc,
  apiKey,
  selectedDocuments,
}: StudyGuidePanelProps) {
  const [guide, setGuide] = useState<StudyGuideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [guideCache, setGuideCache] = useState<Record<string, StudyGuideData>>({});

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    concepts: true,
    definitions: true,
    formulae: true,
    processes: true,
    examTips: true,
    checklist: true,
    flashcards: true,
  });

  // Active side panel tab (for quick scroll/jumping if needed)
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Checklist completed items (temporary interactive state per doc)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Flashcards carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Premium Export Center states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | "markdown" | null>(null);
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Toggle single collapsible section
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Scroll to a specific section smoothly
  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`sg-sec-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Fetch or load from Cache
  const loadStudyGuide = useCallback(async (forceRegenerate = false) => {
    if (!activeDoc) return;

    setErrorMsg(null);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);

    // Read from cache if available and not regenerating
    if (!forceRegenerate && guideCache[activeDoc.id]) {
      setGuide(guideCache[activeDoc.id]);
      // Initialize checklist state
      const initialChecked: Record<string, boolean> = {};
      guideCache[activeDoc.id].revisionChecklist.forEach((_, idx) => {
        initialChecked[`${activeDoc.id}-${idx}`] = false;
      });
      setCheckedItems(initialChecked);
      return;
    }

    setIsLoading(true);
    setGuide(null);

    try {
      const response = await fetch("/api/study-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          documentId: activeDoc.id,
          selectedDocuments: selectedDocuments.map((d) => ({
            id: d.id,
            name: d.name,
            pages: d.pages,
            size: d.size,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || "Unable to formulate a guide at this moment. Please check your key or try again.");
      }

      const data = (await response.json()) as StudyGuideData;

      if (!data || typeof data.title !== "string" || !Array.isArray(data.keyConcepts)) {
        throw new Error("Formulated study guide has an incompatible structure. Please try again.");
      }

      // Cache it
      setGuideCache((prev) => ({
        ...prev,
        [activeDoc.id]: data,
      }));
      setGuide(data);

      // Initialize checklist state
      const initialChecked: Record<string, boolean> = {};
      data.revisionChecklist.forEach((_, idx) => {
        initialChecked[`${activeDoc.id}-${idx}`] = false;
      });
      setCheckedItems(initialChecked);
    } catch (err: any) {
      console.error("Study Guide Load Error:", err);
      setErrorMsg(err.message || "Failed to generate your personalized study guide. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeDoc, apiKey, selectedDocuments, guideCache]);

  // Load guide on open
  useEffect(() => {
    if (isOpen && activeDoc) {
      loadStudyGuide();
    }
  }, [isOpen, activeDoc]);

  // Handle checking checklist item
  const toggleChecklist = (index: number) => {
    if (!activeDoc) return;
    const key = `${activeDoc.id}-${index}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculated Checklist Progress
  const checklistProgress = useMemo(() => {
    if (!guide || !activeDoc) return { completed: 0, total: 0, percentage: 0 };
    let completed = 0;
    const total = guide.revisionChecklist.length;
    guide.revisionChecklist.forEach((_, idx) => {
      if (checkedItems[`${activeDoc.id}-${idx}`]) {
        completed += 1;
      }
    });
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [guide, checkedItems, activeDoc]);

  // Export to Markdown
  const handleExportMarkdown = () => {
    if (!guide) return;

    let md = `# Study Guide: ${guide.title}\n`;
    md += `*Generated personalized revision resource via Menteea Study Workspace*\n\n`;

    md += `## 📚 Chapter Overview\n${guide.overview}\n\n`;

    md += `## 💡 Key Concepts\n`;
    guide.keyConcepts.forEach((c) => {
      md += `### ✦ ${c.concept}\n`;
      md += `**Explanation:** ${c.explanation}\n\n`;
      md += `**Why It Matters:** ${c.whyItMatters}\n\n`;
    });

    md += `## 📝 Important Definitions\n`;
    guide.importantDefinitions.forEach((d) => {
      md += `- **${d.term}**: ${d.definition}\n`;
    });
    md += `\n`;

    if (guide.formulae && guide.formulae.length > 0) {
      md += `## 📐 Formulae & Key Equations\n`;
      guide.formulae.forEach((f) => {
        md += `### Equation: ${f.formula}\n`;
        md += `- **Conceptual Meaning:** ${f.meaning}\n`;
        md += `- **Variables:** ${f.variables}\n`;
        md += `- **Usage Context:** ${f.usage}\n\n`;
      });
    }

    if (guide.processes && guide.processes.length > 0) {
      md += `## ⚙️ Chronological Workflows & Processes\n`;
      guide.processes.forEach((p) => {
        md += `### 🔄 ${p.name}\n`;
        p.steps.forEach((step, idx) => {
          md += `Step ${idx + 1}. ${step}\n`;
        });
        md += `\n`;
      });
    }

    md += `## ⚠️ Common Exam Mistakes & Confusion Points\n`;
    guide.commonMistakes.forEach((m) => {
      md += `### Mistake: ${m.mistake}\n`;
      md += `- **Correction:** ${m.correction}\n`;
      md += `- **AI Insights:** ${m.explanation}\n\n`;
    });

    md += `## 🎯 Exam Tips & Strategy\n`;
    guide.examTips.forEach((tip) => {
      md += `- [Tip] ${tip}\n`;
    });
    md += `\n`;

    md += `## 📋 Revision Milestones Checklist\n`;
    guide.revisionChecklist.forEach((item) => {
      md += `- [ ] ${item}\n`;
    });
    md += `\n`;

    md += `## 📇 Flashcard Revision Deck\n`;
    guide.flashcards.forEach((f, idx) => {
      md += `### Card #${idx + 1}\n`;
      md += `**Question:** ${f.question}\n`;
      md += `**Answer:** ${f.answer}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    link.setAttribute("download", `${safeName}_revision_guide.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFormat = async (format: "pdf" | "docx" | "markdown") => {
    if (!guide || !activeDoc) return;
    
    setIsExporting(format);
    setExportStatus(null);
    
    if (format === "markdown") {
      try {
        handleExportMarkdown();
        setExportStatus({
          type: "success",
          message: "Successfully compiled and exported Markdown (.md) file!"
        });
        setTimeout(() => {
          setIsExportOpen(false);
          setExportStatus(null);
        }, 2000);
      } catch (err) {
        setExportStatus({
          type: "error",
          message: "Failed to download Markdown file."
        });
      } finally {
        setIsExporting(null);
      }
      return;
    }

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          guide,
          documentName: activeDoc.name
        })
      });

      if (!response.ok) {
        throw new Error("Endpoint failed to compile export document.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const safeTitle = guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      link.setAttribute("download", `${safeTitle}_study_guide.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus({
        type: "success",
        message: `Successfully generated professional ${format.toUpperCase()} packet!`
      });
      
      setTimeout(() => {
        setIsExportOpen(false);
        setExportStatus(null);
      }, 2500);

    } catch (err: any) {
      console.error(`Export ${format} error:`, err);
      setExportStatus({
        type: "error",
        message: `Failed to compile ${format.toUpperCase()} export document. Please try again.`
      });
    } finally {
      setIsExporting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4">
      {/* 3D Flip Card Styles injection */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="flex flex-col bg-bg-surface w-full h-full sm:max-w-6xl sm:h-[92vh] sm:rounded-2xl overflow-hidden border border-border-custom shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Fullscreen Header */}
        <header className="h-16 bg-bg-surface border-b border-border-custom px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BookOpenCheck className="h-5 w-5 text-indigo-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                Personalized Revision Workspace
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Premium
                </span>
              </h2>
              <p className="text-[11px] text-text-muted font-medium line-clamp-1 max-w-lg">
                Structured dynamic exam aid for "{activeDoc?.name}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {guide && (
              <>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                  title="Export study notes to professional formats (PDF, DOCX, Markdown)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Notes</span>
                </button>

                <button
                  onClick={() => loadStudyGuide(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-bg-secondary text-text-secondary disabled:opacity-50 cursor-pointer active:scale-95 transition border border-border-custom"
                  title="Regenerate guide contents via Gemini"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4 bg-bg-app">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-indigo-400 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary uppercase tracking-wider animate-pulse">
                Formulating Study Companion...
              </p>
              <p className="text-[11px] text-text-muted mt-2 font-medium max-w-md mx-auto leading-relaxed">
                Synthesizing chapter outline, extracting equations, detailing chronological processes, predicting tricky mistakes, and packaging custom flashcards.
              </p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 max-w-md mx-auto gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Revision Guide formulation failed
              </h3>
              <p className="text-[11px] text-text-muted leading-relaxed mt-2">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={() => loadStudyGuide(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              Retry Generation
            </button>
          </div>
        ) : !guide ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-3 bg-bg-app">
            <p className="text-xs text-text-muted font-medium">No guide formulated for this chapter yet.</p>
            <button
              onClick={() => loadStudyGuide(false)}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700"
            >
              Generate Guide
            </button>
          </div>
        ) : (
          /* Split Workspace Layout */
          <div className="flex-1 flex overflow-hidden bg-bg-app">
            
            {/* Left Sidebar navigation / metadata */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border-custom bg-bg-surface shrink-0 p-5 justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">
                    Study Chapters
                  </h3>
                  <div className="mt-2.5 p-3 bg-bg-app border border-border-custom rounded-xl flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-text-primary font-bold line-clamp-2 leading-relaxed">
                      {guide.title}
                    </span>
                  </div>
                </div>

                {/* Checklist Progress card */}
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    <span>Revision Progress</span>
                    <span>{checklistProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden border border-border-custom/40">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${checklistProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-text-muted mt-1.5 font-medium">
                    Ticked {checklistProgress.completed} of {checklistProgress.total} milestones.
                  </p>
                </div>

                {/* Jump links */}
                <div className="space-y-1">
                  <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-2">
                    Jump to Section
                  </h3>
                  {[
                    { id: "overview", label: "Chapter Overview", emoji: "📚" },
                    { id: "concepts", label: "Key Concepts", emoji: "💡" },
                    { id: "definitions", label: "Important Definitions", emoji: "📝" },
                    ...(guide.formulae && guide.formulae.length > 0 ? [{ id: "formulae", label: "Formulae & Equations", emoji: "📐" }] : []),
                    ...(guide.processes && guide.processes.length > 0 ? [{ id: "processes", label: "Processes & Workflows", emoji: "⚙️" }] : []),
                    { id: "examTips", label: "Exam Tips", emoji: "🎯" },
                    { id: "mistakes", label: "Common Exam Mistakes", emoji: "⚠️" },
                    { id: "checklist", label: "Revision Checklist", emoji: "📋" },
                    { id: "flashcards", label: "Flashcards Deck", emoji: "📇" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(tab.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-between group cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold"
                          : "text-text-secondary hover:bg-bg-secondary/50 hover:text-text-primary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{tab.emoji}</span>
                        <span>{tab.label}</span>
                      </span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-bg-app rounded-xl border border-border-custom/80">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  <Zap className="h-3 w-3 text-indigo-500" />
                  <span>Menteea AI Engine</span>
                </div>
                <p className="text-[9px] text-text-muted mt-1 leading-normal font-medium">
                  Dynamic evaluation leverages Google Gemini 2.5 Flash for real-time document mapping.
                </p>
              </div>
            </aside>

            {/* Scrollable Main Content Pane */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-custom select-none">
              
              {/* Section 1: Chapter Overview */}
              <section id="sg-sec-overview" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("overview")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📚</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Chapter Overview & Objectives
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.overview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.overview && (
                  <div className="p-5 animate-in fade-in duration-200">
                    <p className="text-xs text-text-secondary leading-relaxed font-medium whitespace-pre-line bg-bg-app p-4 rounded-xl border border-border-custom/60">
                      {guide.overview}
                    </p>
                  </div>
                )}
              </section>

              {/* Section 2: Key Concepts */}
              <section id="sg-sec-concepts" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("concepts")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">💡</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Key Concepts & Structural Pillars
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.concepts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.concepts && (
                  <div className="p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 gap-4">
                      {guide.keyConcepts.map((item, idx) => (
                        <div key={idx} className="p-4 bg-bg-app border border-border-custom/70 rounded-xl flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 border border-indigo-100/50 dark:border-indigo-900/40 rounded">
                              Pillar {idx + 1}
                            </span>
                            <h4 className="text-xs font-extrabold text-text-primary">
                              {item.concept}
                            </h4>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Conceptual Breakdown:</span>
                              <p className="text-xs text-text-secondary leading-relaxed font-medium mt-0.5">
                                {item.explanation}
                              </p>
                            </div>
                            <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/15">
                              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> Why It Matters:
                              </span>
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed mt-0.5">
                                {item.whyItMatters}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 3: Important Definitions */}
              <section id="sg-sec-definitions" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("definitions")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📝</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Important Glossary Definitions
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.definitions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.definitions && (
                  <div className="p-5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {guide.importantDefinitions.map((item, idx) => (
                        <div key={idx} className="p-3.5 bg-bg-app border border-border-custom/50 rounded-xl flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {item.term}
                          </span>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                            {item.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 4: Formulae & Key Equations (Conditional) */}
              {guide.formulae && guide.formulae.length > 0 && (
                <section id="sg-sec-formulae" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleSection("formulae")}
                    className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">📐</span>
                      <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                        Formulae & Analytical Equations
                      </h3>
                    </div>
                    <button className="text-text-muted">
                      {expandedSections.formulae ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  {expandedSections.formulae && (
                    <div className="p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 gap-4">
                        {guide.formulae.map((item, idx) => (
                          <div key={idx} className="p-4 bg-bg-app border border-border-custom/70 rounded-xl flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-custom/50 pb-2.5">
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-300 font-mono tracking-tight bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/30 px-3 py-1 rounded-lg">
                                {item.formula}
                              </span>
                              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sigma className="h-3 w-3" /> Equation {idx + 1}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                              <div>
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Core Relationship:</span>
                                <p className="text-[11px] text-text-secondary mt-1 font-semibold leading-relaxed">{item.meaning}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Variable Keys:</span>
                                <p className="text-[11px] text-text-secondary mt-1 font-medium leading-relaxed font-mono">{item.variables}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Application Guide:</span>
                                <p className="text-[11px] text-text-secondary mt-1 font-medium leading-relaxed">{item.usage}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Section 5: Processes & Workflows (Conditional) */}
              {guide.processes && guide.processes.length > 0 && (
                <section id="sg-sec-processes" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleSection("processes")}
                    className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">⚙️</span>
                      <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                        Chronological Processes & Workflows
                      </h3>
                    </div>
                    <button className="text-text-muted">
                      {expandedSections.processes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  {expandedSections.processes && (
                    <div className="p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 gap-4">
                        {guide.processes.map((proc, idx) => (
                          <div key={idx} className="p-4 bg-bg-app border border-border-custom/70 rounded-xl">
                            <h4 className="text-xs font-extrabold text-text-primary flex items-center gap-1.5 mb-3.5">
                              <span className="text-xs">🔄</span>
                              {proc.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {proc.steps.map((step, sIdx) => (
                                <div key={sIdx} className="p-3 bg-bg-surface border border-border-custom rounded-lg flex items-start gap-2.5 shadow-2xs">
                                  <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                                    {sIdx + 1}
                                  </div>
                                  <span className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Section 6: Common Exam Mistakes */}
              <section id="sg-sec-mistakes" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("mistakes")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚠️</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Tricky Mistakes & Misconceptions
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.mistakes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.mistakes && (
                  <div className="p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 gap-4">
                      {guide.commonMistakes.map((item, idx) => (
                        <div key={idx} className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
                            <span>Mistake: {item.mistake}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/15">
                              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Correct Conception
                              </span>
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed mt-1">
                                {item.correction}
                              </p>
                            </div>
                            <div className="p-3 bg-bg-surface rounded-lg border border-border-custom">
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">AI Pedagogical Advice:</span>
                              <p className="text-[11.5px] text-text-secondary font-medium leading-relaxed mt-1">
                                {item.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 7: Exam Tips */}
              <section id="sg-sec-examTips" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("examTips")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Focal Exam Tips & Strategic Advice
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.examTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.examTips && (
                  <div className="p-5 animate-in fade-in duration-200">
                    <ul className="grid grid-cols-1 gap-3">
                      {guide.examTips.map((tip, idx) => (
                        <li key={idx} className="p-3 bg-bg-app border border-border-custom/50 rounded-xl flex items-start gap-3">
                          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-500 shrink-0">
                            <Award className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[11.5px] text-text-secondary leading-relaxed font-semibold mt-0.5">
                            {tip}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Section 8: Revision Checklist */}
              <section id="sg-sec-checklist" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("checklist")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📋</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Interactive Revision Milestones
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.checklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.checklist && (
                  <div className="p-5 animate-in fade-in duration-200">
                    <p className="text-[10px] text-text-muted font-medium mb-3.5 leading-normal">
                      Mark each learning objective to track your revision confidence before entering exams.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {guide.revisionChecklist.map((item, idx) => {
                        const isChecked = checkedItems[`${activeDoc.id}-${idx}`] || false;
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleChecklist(idx)}
                            className={`p-3 border rounded-xl flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                              isChecked
                                ? "bg-emerald-500/5 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-semibold"
                                : "bg-bg-app border-border-custom/70 hover:border-border-custom text-text-secondary hover:bg-bg-secondary/10"
                            }`}
                          >
                            <button className="shrink-0 text-indigo-500 dark:text-indigo-400 mt-0.5">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Square className="h-4 w-4 text-text-muted" />
                              )}
                            </button>
                            <span className="text-[11.5px] leading-relaxed flex-1">
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 9: Interactive Flashcard Deck */}
              <section id="sg-sec-flashcards" className="bg-bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection("flashcards")}
                  className="px-5 py-4 flex items-center justify-between border-b border-border-custom/50 cursor-pointer hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📇</span>
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Interactive Flashcards Revision Deck
                    </h3>
                  </div>
                  <button className="text-text-muted">
                    {expandedSections.flashcards ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedSections.flashcards && (
                  <div className="p-5 animate-in fade-in duration-200">
                    <p className="text-[10px] text-text-muted font-medium mb-4 leading-normal">
                      Click the card to toggle between the question and correct AI answer. Use navigation to review the whole deck.
                    </p>

                    <div className="flex flex-col items-center justify-center max-w-lg mx-auto py-3">
                      {/* 3D Animated Flip Container */}
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="w-full h-56 perspective-1000 cursor-pointer group"
                      >
                        <div
                          className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                            isCardFlipped ? "rotate-y-180" : ""
                          }`}
                        >
                          {/* Front Side: Question */}
                          <div className="absolute inset-0 w-full h-full bg-bg-app border-2 border-dashed border-border-custom rounded-2xl p-6 flex flex-col justify-between backface-hidden shadow-xs hover:border-indigo-400/50 transition-colors">
                            <div className="flex items-center justify-between text-[10px] text-text-muted font-extrabold uppercase tracking-wider">
                              <span>Question Side</span>
                              <span>Card {currentCardIndex + 1} of {guide.flashcards.length}</span>
                            </div>
                            <div className="text-center py-4 flex items-center justify-center">
                              <p className="text-xs sm:text-sm font-bold text-text-primary leading-relaxed tracking-tight max-w-sm">
                                {guide.flashcards[currentCardIndex]?.question}
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:scale-105 transition-transform">
                              <Eye className="h-3.5 w-3.5" />
                              <span>Reveal AI Answer</span>
                            </div>
                          </div>

                          {/* Back Side: Answer */}
                          <div className="absolute inset-0 w-full h-full bg-indigo-50/50 dark:bg-indigo-950/25 border-2 border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between backface-hidden rotate-y-180 shadow-md">
                            <div className="flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                              <span>Concept Answer</span>
                              <span>Card {currentCardIndex + 1} of {guide.flashcards.length}</span>
                            </div>
                            <div className="text-center py-4 flex items-center justify-center overflow-y-auto max-h-[120px] scrollbar-custom">
                              <p className="text-[11.5px] font-bold text-text-primary leading-relaxed tracking-tight max-w-sm">
                                {guide.flashcards[currentCardIndex]?.answer}
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-[9px] font-extrabold text-text-muted uppercase tracking-widest">
                              <Info className="h-3.5 w-3.5" />
                              <span>Click to Flip Back</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flashcard Navigation bar */}
                      <div className="flex items-center justify-between w-full mt-5 select-none px-2">
                        <button
                          disabled={currentCardIndex === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCardFlipped(false);
                            setTimeout(() => {
                              setCurrentCardIndex((prev) => prev - 1);
                            }, isCardFlipped ? 150 : 0);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-text-secondary hover:bg-bg-secondary disabled:opacity-30 transition cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Prev</span>
                        </button>

                        <span className="text-[10px] text-text-muted font-bold tracking-widest">
                          {currentCardIndex + 1} / {guide.flashcards.length} CARDS
                        </span>

                        <button
                          disabled={currentCardIndex === guide.flashcards.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCardFlipped(false);
                            setTimeout(() => {
                              setCurrentCardIndex((prev) => prev + 1);
                            }, isCardFlipped ? 150 : 0);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-text-secondary hover:bg-bg-secondary disabled:opacity-30 transition cursor-pointer"
                        >
                          <span>Next</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* End spacer */}
              <div className="h-10" />
            </main>
          </div>
        )}
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setIsExportOpen(false);
                setExportStatus(null);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <BookOpenCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                Professional Export Center
              </h3>
            </div>

            <p className="text-[11px] text-slate-400 mb-5 leading-relaxed font-semibold">
              Choose your preferred professional format to download and continue studying offline or in other platforms.
            </p>

            <div className="space-y-3">
              {/* PDF Option */}
              <button
                onClick={() => handleExportFormat("pdf")}
                disabled={!!isExporting}
                className="w-full text-left p-3.5 bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 group active:scale-98 disabled:opacity-50"
              >
                <div className="text-xl group-hover:scale-110 transition-transform shrink-0">📄</div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-extrabold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    Export PDF
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-medium">
                    Portable study packet for reading, printing, and sharing.
                  </p>
                </div>
                {isExporting === "pdf" && (
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0 self-center" />
                )}
              </button>

              {/* Word Option */}
              <button
                onClick={() => handleExportFormat("docx")}
                disabled={!!isExporting}
                className="w-full text-left p-3.5 bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 group active:scale-98 disabled:opacity-50"
              >
                <div className="text-xl group-hover:scale-110 transition-transform shrink-0">📝</div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-extrabold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    Export Word (.docx)
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-medium">
                    Editable study guide for adding personal notes and annotations.
                  </p>
                </div>
                {isExporting === "docx" && (
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0 self-center" />
                )}
              </button>

              {/* Markdown Option */}
              <button
                onClick={() => handleExportFormat("markdown")}
                disabled={!!isExporting}
                className="w-full text-left p-3 bg-slate-800/10 hover:bg-slate-800/40 border border-slate-800/50 hover:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 group active:scale-98 disabled:opacity-50"
              >
                <div className="text-sm group-hover:scale-110 transition-transform shrink-0 self-center">📑</div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-slate-300 group-hover:text-slate-100 transition-colors">
                    Export Markdown (.md)
                  </h4>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal font-medium">
                    Lightweight plain text backup for Markdown editors.
                  </p>
                </div>
                {isExporting === "markdown" && (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0 self-center" />
                )}
              </button>
            </div>

            {/* Export Status Notification */}
            {exportStatus && (
              <div className={`mt-4 p-3 rounded-xl border text-[10.5px] font-semibold flex items-center gap-2 ${
                exportStatus.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                <div className="flex-1">
                  {exportStatus.message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}