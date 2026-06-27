import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, HelpCircle, BookOpen, Key, FileText, CheckCircle2, 
  AlertCircle, ShieldCheck, HelpCircle as HelpIcon, ArrowRight,
  Sparkles, Layers, ListFilter, Play, Bookmark, ExternalLink,
  Cpu, FileCode, Check, RefreshCw
} from "lucide-react";
import { DocumentFile } from "../types";

// Types for the Help Center Modal
interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: DocumentFile) => void;
  activeTab: "quickstart" | "docs" | "faq" | "samples" | "legal-privacy" | "legal-terms" | "legal-security";
  setActiveTab: (tab: "quickstart" | "docs" | "faq" | "samples" | "legal-privacy" | "legal-terms" | "legal-security") => void;
}

export default function HelpCenterModal({ 
  isOpen, 
  onClose, 
  onAddDocument,
  activeTab,
  setActiveTab
}: HelpCenterModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Sample Documents Data (Task 6)
  const sampleDocuments: DocumentFile[] = [
    {
      id: "sample-attention",
      name: "Attention_Is_All_You_Need_Transformer.pdf",
      size: "1.2 MB",
      uploadTime: new Date().toLocaleDateString(),
      isSelected: true,
      topics: ["Transformer", "Self-Attention", "Deep Learning", "NLP"],
      purpose: "Understand the core mathematical breakthrough of modern Large Language Models.",
      initialSuggestions: [
        "Explain the formula for Scaled Dot-Product Attention.",
        "What are Positional Encodings and why are they needed?",
        "How does Multi-Head Attention improve representation learning?"
      ],
      summary: "This landmark paper introduces the Transformer, a novel sequence-to-sequence network architecture based entirely on self-attention mechanisms, completely dispensing with recurrence and convolutions. It achieves state-of-the-art results in translation tasks while training significantly faster.",
      pages: [
        {
          pageNumber: 1,
          text: "Attention Is All You Need (Transformer Architecture)\n\nAbstract\nThe dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."
        },
        {
          pageNumber: 2,
          text: "Scaled Dot-Product Attention\n\nWe compute the attention function on a set of queries packed together into a matrix Q, keys K, and values V:\n\nAttention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V\n\nWhere d_k is the dimension of the keys. Softmax scaling prevents extremely large values which drive the gradients into flat regions. Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions."
        },
        {
          pageNumber: 3,
          text: "Positional Encoding\n\nSince our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add 'positional encodings' to the input embeddings at the bottoms of the encoder and decoder stacks. We use sine and cosine functions of different frequencies."
        }
      ]
    },
    {
      id: "sample-quantum",
      name: "Introduction_to_Quantum_Superposition.pdf",
      size: "820 KB",
      uploadTime: new Date().toLocaleDateString(),
      isSelected: true,
      topics: ["Quantum Physics", "Superposition", "Wave Mechanics", "Schrödinger"],
      purpose: "Master the foundational physics behind quantum state vectors and wave equation dynamics.",
      initialSuggestions: [
        "Explain the physical meaning of a state vector in Dirac notation.",
        "What is the mathematical formulation of Schrödinger's wave equation?",
        "Explain the measurement collapse concept."
      ],
      summary: "An educational handbook detailing the principles of quantum state spaces, linear operator dynamics, and the physical reality of superposition. Discusses how systems exist in combinations of pure states until a measurement forces a collapse into a single eigenvalue.",
      pages: [
        {
          pageNumber: 1,
          text: "Quantum Superposition & Wave Mechanics\n\nIn classical mechanics, a particle has a definite position and momentum. In quantum mechanics, a physical system is described instead by a state vector |ψ⟩ in a complex Hilbert space. The state vector contains all possible configurations simultaneously. Until observed, a quantum system exists in a linear superposition of all possible eigenstates."
        },
        {
          pageNumber: 2,
          text: "Schrödinger's Wave Equation\n\nThe temporal evolution of a non-relativistic quantum state is governed by the time-dependent Schrödinger equation:\n\ni ħ ∂/∂t |ψ(t)⟩ = H |ψ(t)⟩\n\nWhere H is the Hamiltonian operator representing the total energy of the system, and ħ is the reduced Planck constant. The solution yields probability amplitudes whose squared absolute magnitudes describe observable results."
        }
      ]
    },
    {
      id: "sample-gemini",
      name: "Google_Gemini_1.5_Architecture.pdf",
      size: "1.8 MB",
      uploadTime: new Date().toLocaleDateString(),
      isSelected: true,
      topics: ["Gemini 1.5", "Mixture of Experts", "Context Window", "AI Systems"],
      purpose: "Explore the multimodal engineering principles behind Gemini's long-context capabilities.",
      initialSuggestions: [
        "What is the Mixture-of-Experts (MoE) architecture?",
        "How does Gemini handle up to 2 million tokens in context?",
        "Explain the model's multi-modal cross-attention processing."
      ],
      summary: "This technical whitepaper details Google's Gemini 1.5 architecture, emphasizing its high-efficiency Mixture-of-Experts (MoE) foundation. It highlights how the model handles ultra-long context windows up to 2,000,000 tokens while maintaining outstanding recall and cross-modal retrieval rates.",
      pages: [
        {
          pageNumber: 1,
          text: "Google Gemini 1.5 Architecture Specifications\n\nIntroduction\nGemini 1.5 represents a major advance in large-scale machine learning efficiency and long-context capabilities. Built on a sparse Mixture-of-Experts (MoE) transformer model, Gemini 1.5 optimizes inference speeds by routing token representations to specialized sub-networks ('experts') rather than activating the entire dense model parameters."
        },
        {
          pageNumber: 2,
          text: "Ultra-Long Context Retrieval & Needle in a Haystack\n\nGemini 1.5 introduces custom attention kernels allowing reliable context windows of up to 2,000,000 tokens. In extensive testing, the model achieves near-perfect (99%+) recall on 'Needle in a Haystack' queries across text, audio, and video modalities, enabling comprehensive analyses of hundreds of documents concurrently."
        }
      ]
    },
    {
      id: "sample-cnn",
      name: "Lecture_Notes_Convolutional_Networks.pdf",
      size: "450 KB",
      uploadTime: new Date().toLocaleDateString(),
      isSelected: true,
      topics: ["CNN", "Computer Vision", "Convolution", "Feature Maps"],
      purpose: "Learn the visual processing pipeline of convolution operations and spatial filters.",
      initialSuggestions: [
        "What is the purpose of a stride in a convolution filter?",
        "Explain Max Pooling and why it reduces spatial dimensions.",
        "How do multiple filters form hierarchical feature maps?"
      ],
      summary: "A comprehensive academic slides deck on spatial convolution filters. It explains how kernel matrices detect visual boundaries, gradients, and semantic categories iteratively through layers of convolutional filters and pooling.",
      pages: [
        {
          pageNumber: 1,
          text: "Lecture Notes: Convolutional Neural Networks (CNNs)\n\nVisual processing in biological retinas inspired the mathematical structure of CNNs. Rather than processing full global vectors, CNNs apply local spatial kernels. Each kernel maps local pixel relationships, identifying edge orientations, textures, and color boundaries while preserving translational invariance."
        },
        {
          pageNumber: 2,
          text: "Convolution Math & Pooling Layers\n\nA 2D convolution applies a kernel matrix K over an input image I:\n\nS(i,j) = Σ_m Σ_n I(i-m, j-n) K(m,n)\n\nFollowing convolution, Max Pooling filters are applied to down-sample spatial resolutions. A standard 2x2 max pool with stride 2 takes the maximum value in each quadrant, significantly reducing computational overhead while retaining spatial features."
        }
      ]
    }
  ];

  const handleLoadSample = (doc: DocumentFile) => {
    onAddDocument(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-bg-surface border border-border-custom shadow-2xl rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden theme-transition"
      >
        {/* Header section */}
        <div className="px-6 py-4 border-b border-border-custom/80 flex items-center justify-between bg-bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans tracking-tight text-text-primary flex items-center gap-1.5">
                Menteea Support Center & Docs
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">v1.0</span>
              </h2>
              <p className="text-[11px] text-text-muted font-medium">Onboarding, Diagnostics, Technical Manual, and Legal Sandbox</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border-custom/50 bg-bg-surface hover:bg-bg-secondary text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Navigation Sidebar */}
          <div className="w-56 border-r border-border-custom bg-bg-secondary/10 overflow-y-auto p-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-mono font-bold tracking-wider uppercase text-text-muted px-2 pb-1.5">Getting Started</p>
                <button
                  onClick={() => setActiveTab("quickstart")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "quickstart" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <Play className="h-3.5 w-3.5 shrink-0" />
                  Quick Start Guide
                </button>
                <button
                  onClick={() => setActiveTab("samples")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "samples" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Sample PDFs
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-mono font-bold tracking-wider uppercase text-text-muted px-2 pb-1.5">Knowledge Base</p>
                <button
                  onClick={() => setActiveTab("docs")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "docs" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  Documentation Hub
                </button>
                <button
                  onClick={() => setActiveTab("faq")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "faq" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <HelpIcon className="h-3.5 w-3.5 shrink-0" />
                  Frequently Asked Questions
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-mono font-bold tracking-wider uppercase text-text-muted px-2 pb-1.5">Legal & Security</p>
                <button
                  onClick={() => setActiveTab("legal-security")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "legal-security" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Security & Privacy
                </button>
                <button
                  onClick={() => setActiveTab("legal-privacy")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "legal-privacy" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5 shrink-0" />
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveTab("legal-terms")}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "legal-terms" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5 shrink-0" />
                  Terms of Service
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border-custom/50 space-y-2 text-left">
              <div className="p-2.5 rounded-xl bg-bg-secondary/40 border border-border-custom/30 text-[10px] text-text-muted space-y-1 font-semibold leading-relaxed">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="text-text-secondary">v1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Build:</span>
                  <span className="text-indigo-500">Launch Cand.</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-500">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-app/10">
            <AnimatePresence mode="wait">
              {activeTab === "quickstart" && (
                <motion.div
                  key="quickstart"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Getting Started with Menteea</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Follow our quick 6-step walkthrough to unlock grounded conversations, interactive mind maps, and structured study guides.
                    </p>
                  </div>

                  {/* 6 Step Interactive Walkthrough (Task 3) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5 relative">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        1
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Get Gemini API Key</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Visit Google AI Studio to secure your personal, high-speed API key. Access is free for developer prototyping.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        2
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Connect Key</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Click the &quot;Connect Gemini&quot; button in the workspace toolbar or sidebar and save your key. It validates instantly.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        3
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Upload Document</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Drag any textbook chapter, academic research paper, or lecture deck in PDF format into the library panel.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        4
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Chat With Documents</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Ask localized questions in the chat panel. Menteea scans your PDFs and delivers grounded answers with precise citations.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        5
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Generate Assets</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Use active learning tools in the PDF drawer to instantly generate comprehensive mind maps, custom quizzes, and structured study guides.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 shadow-xs space-y-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                        6
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">Export Results</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Export your summaries, indexes, quizzes, and study guides in formatted PDF, editable Microsoft Word (DOCX), or portable Markdown.
                      </p>
                    </div>
                  </div>

                  {/* Product Transparency Section (Task 9) */}
                  <div className="border-t border-border-custom/60 pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">Product Transparency: How Menteea Works</h4>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold max-w-2xl">
                      Menteea is architected to perform entirely transparent operations. We don&apos;t store your data on secondary cloud servers. All pipeline extraction and intelligence processing flows straight from your machine to Google secure Gemini infrastructure.
                    </p>

                    {/* Flow Diagram */}
                    <div className="p-4 rounded-xl bg-bg-secondary/40 border border-border-custom/50 flex flex-col md:flex-row items-stretch justify-between gap-4 font-mono text-[10px] text-text-secondary">
                      <div className="flex-1 flex flex-col items-center text-center p-2 rounded-lg bg-bg-surface border border-border-custom/40">
                        <div className="font-bold text-indigo-500 pb-1">Document Upload</div>
                        <p className="text-[9px] text-text-muted leading-snug">Local PDF read & split into memory buffers</p>
                      </div>
                      <div className="hidden md:flex items-center justify-center text-text-muted">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex-1 flex flex-col items-center text-center p-2 rounded-lg bg-bg-surface border border-border-custom/40">
                        <div className="font-bold text-indigo-500 pb-1">Processing & Extract</div>
                        <p className="text-[9px] text-text-muted leading-snug">Client-side text parsing & semantic page division</p>
                      </div>
                      <div className="hidden md:flex items-center justify-center text-text-muted">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex-1 flex flex-col items-center text-center p-2 rounded-lg bg-bg-surface border border-border-custom/40">
                        <div className="font-bold text-indigo-500 pb-1">Gemini Integration</div>
                        <p className="text-[9px] text-text-muted leading-snug">Secure BYOK API requests for grounded indexing</p>
                      </div>
                      <div className="hidden md:flex items-center justify-center text-text-muted">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex-1 flex flex-col items-center text-center p-2 rounded-lg bg-bg-surface border border-border-custom/40">
                        <div className="font-bold text-emerald-500 pb-1">Learning Assets</div>
                        <p className="text-[9px] text-text-muted leading-snug">Mind Maps, Quizzes, Study Guides & Exports</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "samples" && (
                <motion.div
                  key="samples"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Instant Testing Sandbox</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Don&apos;t have any PDFs on hand? Choose a curated academic sample below to immediately test Menteea&apos;s active study guides, concept mind maps, and quiz engines.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sampleDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-5 rounded-2xl bg-bg-surface border border-border-custom hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold uppercase tracking-wider">
                              {doc.topics?.[0] || "Sample PDF"}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted font-semibold">{doc.size}</span>
                          </div>
                          <h4 className="text-xs font-bold text-text-primary truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                            {doc.purpose}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {doc.topics?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[9px] font-semibold text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded border border-border-custom/40">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleLoadSample(doc)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Instantly Launch Sample</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "docs" && (
                <motion.div
                  key="docs"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Documentation Hub</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Deep-dive technical guide on workspace interfaces, grounding parameters, learning algorithms, and exports.
                    </p>
                  </div>

                  {/* Workspace Overview (Task 5) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">1. Workspace Overview</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Library Panel</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Upload, catalog, and select documents. Manage multi-file selections to construct cross-document query spaces.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">PDF Viewer</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Full-canvas vector viewer. Enables exact-text fallback rendering if native PDF canvases encounter limitations.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Workspace Chat</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Engage in conversation grounded directly in selected sources. Includes pinpoint page references and citation highlighting.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Learning Tools (Task 5) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">2. Learning Tools</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Interactive Mind Maps</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Leverages Gemini to build hierarchical conceptual models, highlighting dependency maps and semantic relations between nodes.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Grounded MCQ Quizzes</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Builds 10 rigorous, conceptual multiple-choice challenges complete with deep written feedback for each option.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Comprehensive Study Guides</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Synthesizes deep executive summaries, structured glossary terms, key formulas, and core discussion prompts.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/50 space-y-1.5">
                        <div className="font-bold text-xs text-text-primary">Active-Recall Flashcards</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                          Allows card-flipping interactions mapping central definitions to optimize memory recall.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Export Center (Task 5) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">3. Export Center</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold max-w-2xl">
                      Export generated study guides, quiz logs, and text summaries instantly in three high-fidelity formats. These files are built client-side with proper styles and table structures:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl bg-bg-secondary/40 border border-border-custom/40 font-semibold text-[11px] text-text-secondary">
                        <strong className="text-text-primary">Standard PDF:</strong> Optimized for high-resolution printing, containing professional title pages and pagination layouts.
                      </div>
                      <div className="p-3.5 rounded-xl bg-bg-secondary/40 border border-border-custom/40 font-semibold text-[11px] text-text-secondary">
                        <strong className="text-text-primary">Microsoft Word (.DOCX):</strong> Fully editable. Embedded templates ensure clean margins, structured headings, and tables.
                      </div>
                      <div className="p-3.5 rounded-xl bg-bg-secondary/40 border border-border-custom/40 font-semibold text-[11px] text-text-secondary">
                        <strong className="text-text-primary">Markdown (.MD):</strong> Standard format. Features full compatibility with knowledge vaults like Obsidian, Notion, or Roam Research.
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting (Task 5) */}
                  <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                    <div className="flex items-center gap-2 text-rose-500">
                      <AlertCircle className="h-4.5 w-4.5" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider">4. Troubleshooting Guide</h4>
                    </div>
                    <div className="space-y-2.5 text-[11px] text-text-secondary font-semibold leading-relaxed">
                      <p>
                        <strong className="text-text-primary">🔑 API Key Authentication Errors:</strong> Check if your key contains trailing spaces or invalid characters. Confirm that your Google Cloud billing setup or rate-limit tiers match active requests.
                      </p>
                      <p>
                        <strong className="text-text-primary">⏳ Gemini Model Overloads & Quotas:</strong> Standard free tiers have a limit of 15 Requests Per Minute (RPM). If you receive rate-limiting codes, wait 60 seconds before initiating subsequent generation requests.
                      </p>
                      <p>
                        <strong className="text-text-primary">📄 PDF Processing Failures:</strong> Scanned documents without OCR text layers cannot be read cleanly by text-extractors. Check that your PDF is searchable or copyable locally.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "faq" && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Frequently Asked Questions</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Quick answers to typical structural, economic, security, and functional inquiries about Menteea.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* FAQ 1 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-primary">What is a Gemini API Key?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        A Gemini API Key is a secure credential used to communicate with Google&apos;s language models. Menteea is structured on a Bring-Your-Own-Key (BYOK) paradigm. This means we do not charge middleman markup fees; you obtain a key directly from Google AI Studio (which is free for standard tiers) and plug it into your workspace locally.
                      </p>
                    </div>

                    {/* FAQ 2 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-primary">Is My API Key Safe?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Yes, absolutely. Your API key is stored exclusively inside your local browser storage (`localStorage`). It is never transmitted to our servers, logged on remote databases, or exposed to external entities. Every request is sent straight from your browser/workspace to the secure Google Gemini server. You can rotate or delete your key instantly from settings.
                      </p>
                    </div>

                    {/* FAQ 3 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-primary">Why Does Menteea Use My Own API Key?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        BYOK gives you complete independence and cost control. Typical AI applications run expensive subscription systems to cover API overheads, adding massive profit margins. Menteea avoids subscription models, allowing students and researchers to utilize Gemini at pure developer costs (or completely free within standard usage limits).
                      </p>
                    </div>

                    {/* FAQ 4 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-primary">What Documents Can I Upload?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Menteea supports all standard text-based PDF documents, including dense academic research papers, university lecture notes, complete textbook chapters, company technical reports, and industry whitepapers. We recommend documents with searchable OCR text layers for the most accurate extraction.
                      </p>
                    </div>

                    {/* FAQ 5 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-primary">What Can Menteea Generate?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Menteea generates deep study resources, including grounded, citation-backed answers in the chat panel, interactive visual Mind Maps (hierarchical concept nodes), 10-question evaluation Quizzes with detailed correction writeups, complete multi-chapter Study Guides, interactive Flashcards, and beautiful format exports (Word, PDF, Markdown).
                      </p>
                    </div>

                    {/* FAQ 6 (Task 2) */}
                    <div className="p-4 rounded-xl bg-bg-surface border border-border-custom/60 space-y-1.5 bg-rose-500/5 border-rose-500/10">
                      <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Why Did Gemini Fail?</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                        Generation failures generally stem from: an invalid key structure, rate-limiting (more than 15 RPM on the free tier), temporary global Google service outages, file sizes exceeding context limits, or sudden connection losses. If a failure occurs, we suggest verifying your key status or trying again in 30-60 seconds.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "legal-security" && (
                <motion.div
                  key="legal-security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Security & Privacy Sandbox</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Technical breakdown of Menteea&apos;s sandboxed local-first architecture and secure request cycles.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Secure Architecture Diagram</h4>
                    
                    {/* Visual Sandbox Box */}
                    <div className="border border-border-custom rounded-xl overflow-hidden font-mono text-[10px]">
                      <div className="bg-bg-secondary px-3 py-1.5 border-b border-border-custom font-bold text-text-primary">
                        🔒 Local Sandbox Environment (User Browser)
                      </div>
                      <div className="p-4 space-y-2 text-text-secondary bg-bg-surface font-semibold">
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>LocalStorage: API Key &amp; File Catalog stays isolated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Document Buffers: PDF files read as local ArrayBuffers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Parsing Module: PDF.js client text-extract remains 100% in browser</span>
                        </div>
                      </div>
                      <div className="bg-bg-secondary px-3 py-1.5 border-t border-b border-border-custom font-bold text-text-primary">
                        📡 Outbound Transmission (Google Cloud Endpoint)
                      </div>
                      <div className="p-4 space-y-2 text-text-secondary bg-bg-surface font-semibold">
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-indigo-500 animate-pulse" />
                          <span>Secure TLS 1.3 Encryption to standard Google Gemini Endpoint</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-indigo-500" />
                          <span>Secure BYOK headers bypass third-party server logging</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-text-secondary leading-relaxed font-semibold">
                    <p>
                      Menteea operates completely in a sandboxed mode. We do not use remote databases to process your information, meaning there is no centralized database representing a vector of attack.
                    </p>
                    <p>
                      All outbound requests used to retrieve grounded answers or synthesize learning guides are secure API calls containing exclusively your specific document chunks and prompt vectors, complying fully with enterprise-grade SSL protocols.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "legal-privacy" && (
                <motion.div
                  key="legal-privacy"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Privacy Policy</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Last Updated: June 27, 2026. Review how Menteea secures your keys, files, and credentials.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-text-secondary leading-relaxed font-semibold">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">1. Local Storage Guarantee</h4>
                      <p>
                        Your personal Gemini API Key and files catalog are stored strictly within local browser parameters (`localStorage`). No tracking profiles are created, and we maintain zero access over your credentials.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">2. Document Integrity</h4>
                      <p>
                        Menteea does not copy or store your uploaded PDF contents on third-party analytical frameworks. PDF files are processed as in-memory buffers to extract raw text chunks, which are then passed inside secure, transient envelopes to Google&apos;s models.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">3. No Advertising or Monetization</h4>
                      <p>
                        Menteea has no telemetry engines, does not sell user analytical statistics to external programmatic marketing exchanges, and charges no usage premium.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">4. AI Provider Disclosures</h4>
                      <p>
                        Outbound requests go straight to Google standard Gemini APIs. Please review Google&apos;s official privacy disclosures for specific policies on AI request processing and data retention schedules.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "legal-terms" && (
                <motion.div
                  key="legal-terms"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-text-primary">Terms of Service</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Effective Date: June 27, 2026. Terms governing the usage of Menteea.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-text-secondary leading-relaxed font-semibold">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">1. Acceptable Educational Use</h4>
                      <p>
                        Menteea is constructed exclusively as an active study and research operating tool. You are permitted to upload textbooks, papers, slides, and notes for personal educational comprehension.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">2. Intellectual Property &amp; Uploads</h4>
                      <p>
                        You retain full ownership, copyrights, and responsibilities for all documents and content uploaded to Menteea. You certify you possess adequate permissions or educational fair-use rights for analyzed material.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">3. AI Accuracy &amp; Disclaimers</h4>
                      <p>
                        Artificial Intelligence models have a potential margin for error, commonly known as hallucinations. Menteea makes no formal guarantee of accuracy, factual perfection, or compliance. Always cross-reference critical scientific, clinical, legal, or financial figures with your original source documents.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">4. Service Availability</h4>
                      <p>
                        Menteea is provided &quot;as is&quot; without explicit service level agreements or guarantees. Operation relies heavily on Google&apos;s external Gemini model availability and local browser storage permanence.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}