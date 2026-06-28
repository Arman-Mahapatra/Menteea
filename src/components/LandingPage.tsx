import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { MenteeaLogo, MenteeaIcon } from "./MenteeaLogo";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Brain,
  Award,
  Download,
  Check,
  Play,
  X,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Database,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Search,
  BookOpenCheck,
  BookmarkCheck,
  Users,
  GraduationCap,
  Wrench,
  ExternalLink,
  Github,
  Linkedin,
  FileDown,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkle,
  Lightbulb,
  Network
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
  onOpenHelpCenter: (tab: "quickstart" | "docs" | "faq" | "samples" | "legal-privacy" | "legal-terms" | "legal-security") => void;
}

export default function LandingPage({ onStart, onOpenApiKey, hasApiKey, onOpenHelpCenter }: LandingPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Performance-optimized mouse tracker for premium parallax layers
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty('--mx', `${x}`);
      hero.style.setProperty('--my', `${y}`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Tabs for the main interactive sandbox
  const [activeTab, setActiveTab] = useState<"reader" | "mindmap" | "quiz" | "guide">("reader");
  const [selectedMindMapNode, setSelectedMindMapNode] = useState<string>("superposition");
  
  // Interactive Quiz State
  const [quizAnswered, setQuizAnswered] = useState<Record<number, number | null>>({
    1: null,
    2: null,
    3: null
  });
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  // Active guide section selection in the preview
  const [activeGuideSection, setActiveGuideSection] = useState<string>("summary");

  // Hover states for interactions
  const [hoveredPipelineStep, setHoveredPipelineStep] = useState<number | null>(null);
  const [hoveredIntelCard, setHoveredIntelCard] = useState<number | null>(null);

  // Auto-typing animation variables for the simulated Hero Workspace
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [heroChatStep, setHeroChatStep] = useState<"typing" | "waiting" | "responding" | "idle">("typing");
  const [heroChatMessages, setHeroChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; page?: string }>>([]);
  const [highlightedExcerpt, setHighlightedExcerpt] = useState(false);
  
  const queryToType = "Explain phase decoherence in micro-Kelvin environments.";
  const fullResponseText = "According to Section 3.2, environmental decoherence is triggered when local thermal photons entangle with the coherent superposition states. In micro-Kelvin isolating environments, the transition probability scales quadratically, which halts spontaneous state collapse and extends phase coherence.";

  // Handle the automatic typing simulator loop in the Hero
  useEffect(() => {
    let active = true;
    const runSimulator = async () => {
      while (active) {
        // Step 1: Wait and reset
        setHeroChatStep("typing");
        setHeroSearchQuery("");
        setHeroChatMessages([]);
        setHighlightedExcerpt(false);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Typing query
        for (let i = 0; i <= queryToType.length; i++) {
          if (!active) return;
          setHeroSearchQuery(queryToType.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, 45));
        }

        // Send query
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (!active) return;
        setHeroChatMessages([{ sender: "user", text: queryToType }]);
        setHeroSearchQuery("");
        setHeroChatStep("waiting");

        // Waiting / thinking
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!active) return;
        setHeroChatStep("responding");
        setHighlightedExcerpt(true);

        // Render response gradually
        let currentResponse = "";
        const words = fullResponseText.split(" ");
        for (let w = 0; w < words.length; w++) {
          if (!active) return;
          currentResponse += (w === 0 ? "" : " ") + words[w];
          setHeroChatMessages([
            { sender: "user", text: queryToType },
            { sender: "bot", text: currentResponse, page: "Page 4" }
          ]);
          await new Promise((resolve) => setTimeout(resolve, 60));
        }

        setHeroChatStep("idle");
        // Hold state
        await new Promise((resolve) => setTimeout(resolve, 7000));
      }
    };

    runSimulator();
    return () => {
      active = false;
    };
  }, []);

  // Quiz questions data
  const quizQuestions = [
    {
      id: 1,
      question: "Which mechanism primarily initiates environmental decoherence in quantum systems?",
      options: [
        "Uncontrolled entanglement with thermal degrees of freedom in the external environment",
        "Gravitational redshifting at the microscopic quantum boundary",
        "The spontaneous collapse of macroscopic measurement operators"
      ],
      correctIndex: 0,
      feedback: "Grounded in Section 3.2: Decoherence is driven by scattering thermal photons or gas molecules entangling the quantum state with local environmental elements."
    },
    {
      id: 2,
      question: "What does the No-Cloning Theorem establish mathematically?",
      options: [
        "Unitary operators cannot replicate an arbitrary unknown quantum state with perfect fidelity",
        "Classical files cannot be backed up into remote optical node networks",
        "Superposition states dissipate at exponential rates regardless of environment"
      ],
      correctIndex: 0,
      feedback: "Grounded in Section 4.1: The linear nature of quantum operators renders copying of arbitrary unknown states physically impossible, ensuring physical-layer security."
    },
    {
      id: 3,
      question: "How does the Zeno Effect freeze quantum state transition probability?",
      options: [
        "Through high-frequency continuous projective measurements",
        "By heating the isolating chamber above micro-Kelvin levels",
        "By enforcing strict physical separation between adjacent quantum cells"
      ],
      correctIndex: 0,
      feedback: "Grounded in Section 5.3: Extremely frequent measurements freeze state evolution because transition probability scales quadratically with short time steps."
    }
  ];

  const handleAnswerQuiz = (qId: number, optionIdx: number) => {
    setQuizAnswered((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  // Pipeline active step cycling simulation (auto-play when not hovered)
  const [pipelineActiveStep, setPipelineActiveStep] = useState(0);
  useEffect(() => {
    if (hoveredPipelineStep !== null) return;
    const interval = setInterval(() => {
      setPipelineActiveStep((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, [hoveredPipelineStep]);

  return (
    <div className="relative min-h-screen bg-[#02040a] text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Visual Background Grid - Refined Opacity for Content Priority */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none opacity-40" />

      {/* Radial depth glows */}
      <div className="absolute top-[-15%] left-[15%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[450px] h-[450px] bg-indigo-500/3 rounded-full filter blur-[130px] pointer-events-none" />

      {/* Top Navigation Bar - Sticky & Premium */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900/80 bg-[#02040a]/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="group-hover:scale-[1.03] transition-transform duration-300">
                <MenteeaLogo showVersion={true} size={28} darkBg={true} />
              </div>
            </div>

            {/* Premium Desktop Links */}
            <nav className="hidden md:flex items-center gap-6 text-[11.5px] font-semibold text-slate-400 tracking-wide">
              <a href="#pipeline" className="hover:text-slate-100 transition">Pipeline</a>
              <a href="#intelligence" className="hover:text-slate-100 transition">Intelligence</a>
              <a href="#interactive-showcase" className="hover:text-slate-100 transition">Interactive Sandbox</a>
              <a href="#outcomes" className="hover:text-slate-100 transition">Outcomes</a>
              <a href="#export" className="hover:text-slate-100 transition">Export</a>
            </nav>
          </div>

          {/* Header Action controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenApiKey}
              className={`flex items-center gap-2 border px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                hasApiKey
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-300"
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${hasApiKey ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              {hasApiKey ? "API Integration Active" : "Configure API Access"}
            </button>

            <button
              onClick={onStart}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer active:scale-95"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        
        {/* ================= SECTION 1: HERO (ABOVE THE FOLD REFINED) ================= */}
        <section ref={heroRef} className="relative w-full max-w-7xl px-6 sm:px-8 pt-16 pb-8 flex flex-col items-center text-center">
          {/* Subtle Premium "Knowledge Universe" Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Inline CSS styles for keyframes, depth, and premium animations */}
            <style>{`
              @keyframes hero-twinkle {
                0%, 100% { opacity: 0.08; }
                50% { opacity: 0.35; }
              }
              @keyframes hero-rotate-cw {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes hero-rotate-ccw {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
              }
              @keyframes connection-pulse-slow {
                0%, 100% { opacity: 0.01; }
                50% { opacity: 0.14; }
              }
              @keyframes connection-pulse-alt {
                0%, 100% { opacity: 0.12; }
                50% { opacity: 0.02; }
              }
              @keyframes nebula-pulse {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 0.95; transform: scale(1.05); }
              }
            `}</style>

            {/* Ambient Multi-layered Subtle Nebula-like Gradients (Behind Grid) */}
            <div className="absolute inset-0 bg-[#02040a] -z-20">
              {/* Very faint deep navy base wash */}
              <div className="absolute top-[-20%] left-[10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.3),rgba(12,10,36,0.06)_50%,transparent_80%)] pointer-events-none" />
              
              {/* Soft, blended dark indigo nebula */}
              <div 
                className="absolute top-[-10%] left-[20%] w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(24,24,64,0.16)_0%,rgba(15,23,42,0.04)_60%,transparent_100%)] pointer-events-none filter blur-[110px]"
                style={{ animation: 'nebula-pulse 25s ease-in-out infinite' }}
              />
              
              {/* Barely noticeable subtle violet accent nebula */}
              <div 
                className="absolute top-[15%] right-[10%] w-[700px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_0%,rgba(30,27,75,0.02)_55%,transparent_100%)] pointer-events-none filter blur-[120px]"
                style={{ animation: 'nebula-pulse 32s ease-in-out infinite 4s' }}
              />
              
              {/* Extremely dim cyan wash on the bottom left for depth contrast */}
              <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.025)_0%,transparent_75%)] pointer-events-none filter blur-[100px]" />
            </div>

            {/* Soft Central Intelligence Core Glow centered behind the headline */}
            <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[950px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.065)_0%,rgba(168,85,247,0.035)_40%,transparent_70%)] pointer-events-none filter blur-[100px]" />
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.04)_0%,transparent_75%)] pointer-events-none filter blur-[80px]" />

            {/* Sparse Twinkling Star Field - Tiny, low opacity */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(16)].map((_, i) => {
                const top = (i * 8.3 + 14) % 100;
                const left = (i * 12.7 + 9) % 100;
                const size = i % 4 === 0 ? 0.8 : 1.2;
                const delay = (i * 0.4).toFixed(1);
                const duration = (4.0 + (i % 3) * 2.5).toFixed(1);
                return (
                  <div
                    key={`star-polished-${i}`}
                    className="absolute bg-slate-100 rounded-full"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      opacity: i % 2 === 0 ? 0.15 : 0.28,
                      animation: `hero-twinkle ${duration}s ease-in-out infinite ${delay}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Interactive Elegant Orbital Knowledge System */}
            <div className="absolute inset-0">
              
              {/* ================= LAYER 3: BACKGROUND ORBIT (Furthest away, slight blur, low speed) ================= */}
              <div
                className="absolute top-[42%] left-1/2 w-[950px] h-[380px] md:w-[1240px] md:h-[480px] border border-t-slate-700/[0.04] border-b-slate-700/[0.02] border-l-transparent border-r-transparent rounded-full pointer-events-none"
                style={{
                  transform: 'translate(calc(-50% + var(--mx, 0) * 8px), calc(-50% + var(--my, 0) * 8px)) rotate(12deg)',
                  transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Slow Rotating Inner Group (90s orbit duration) */}
                <div 
                  className="absolute inset-0"
                  style={{
                    animation: 'hero-rotate-cw 90s linear infinite',
                  }}
                >
                  {/* Subtle Connection Line 1 */}
                  <div 
                    className="absolute top-1/2 left-[10%] right-[10%] h-[0.5px] bg-gradient-to-r from-transparent via-slate-500/8 to-transparent"
                    style={{
                      transform: 'translateY(-50%) rotate(30deg)',
                      animation: 'connection-pulse-slow 16s ease-in-out infinite',
                    }}
                  />

                  {/* Node Background 1: Study Guide/Quiz (HelpCircle) - Smaller, slightly blurred */}
                  <div 
                    className="absolute top-[12%] left-[18%] -translate-x-1/2 -translate-y-1/2 bg-[#04060c]/85 border border-slate-900/40 p-2 rounded-xl shadow-sm blur-[0.4px] opacity-65"
                    style={{
                      animation: 'hero-rotate-ccw 90s linear infinite',
                    }}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Node Background 2: Chat Bubble (MessageSquare) - Smaller, slightly blurred */}
                  <div 
                    className="absolute bottom-[12%] right-[18%] translate-x-1/2 translate-y-1/2 bg-[#04060c]/85 border border-slate-900/40 p-2 rounded-xl shadow-sm blur-[0.4px] opacity-65"
                    style={{
                      animation: 'hero-rotate-ccw 90s linear infinite',
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Node Background 3: Database/Knowledge Base (Database) - Smaller, blurred */}
                  <div 
                    className="absolute top-[50%] right-[5%] translate-x-1/2 -translate-y-1/2 bg-[#04060c]/80 border border-slate-900/40 p-2 rounded-xl shadow-sm blur-[0.5px] opacity-60"
                    style={{
                      animation: 'hero-rotate-ccw 90s linear infinite',
                    }}
                  >
                    <Database className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* ================= LAYER 2: MIDGROUND ORBIT (Medium depth & speed) ================= */}
              <div
                className="absolute top-[41%] left-1/2 w-[740px] h-[300px] md:w-[980px] md:h-[390px] border border-l-purple-500/[0.035] border-r-purple-500/[0.02] border-t-transparent border-b-transparent rounded-full pointer-events-none"
                style={{
                  transform: 'translate(calc(-50% + var(--mx, 0) * 18px), calc(-50% + var(--my, 0) * 18px)) rotate(-15deg)',
                  transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Mid Rotating Inner Group (68s orbit duration) */}
                <div 
                  className="absolute inset-0"
                  style={{
                    animation: 'hero-rotate-ccw 68s linear infinite',
                  }}
                >
                  {/* Subtle Connection Line 2 */}
                  <div 
                    className="absolute top-1/2 left-[15%] right-[15%] h-[0.5px] bg-gradient-to-r from-transparent via-purple-500/12 to-transparent"
                    style={{
                      transform: 'translateY(-50%) rotate(-40deg)',
                      animation: 'connection-pulse-alt 12s ease-in-out infinite 3s',
                    }}
                  />

                  {/* Node Mid 1: Lightbulb Idea (Lightbulb) - Standard size */}
                  <div 
                    className="absolute top-[22%] right-[15%] translate-x-1/2 -translate-y-1/2 bg-[#04060c]/90 border border-slate-800/40 p-2.5 rounded-xl shadow-[0_0_12px_rgba(234,179,8,0.03)] opacity-90"
                    style={{
                      animation: 'hero-rotate-cw 68s linear infinite',
                    }}
                  >
                    <Lightbulb className="h-4 w-4 text-slate-300" />
                  </div>

                  {/* Node Mid 2: Citation/Reference (BookmarkCheck) - Standard size */}
                  <div 
                    className="absolute bottom-[22%] left-[15%] -translate-x-1/2 translate-y-1/2 bg-[#04060c]/90 border border-slate-800/40 p-2.5 rounded-xl shadow-[0_0_12px_rgba(34,211,238,0.03)] opacity-90"
                    style={{
                      animation: 'hero-rotate-cw 68s linear infinite',
                    }}
                  >
                    <BookmarkCheck className="h-4 w-4 text-slate-300" />
                  </div>

                  {/* Node Mid 3: Connection Node (Network) - Standard size */}
                  <div 
                    className="absolute top-[50%] left-[4%] -translate-x-1/2 -translate-y-1/2 bg-[#04060c]/90 border border-slate-800/30 p-2.5 rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.03)] opacity-85"
                    style={{
                      animation: 'hero-rotate-cw 68s linear infinite',
                    }}
                  >
                    <Network className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* ================= LAYER 1: FOREGROUND ORBIT (Closest, larger, higher contrast, fast speed) ================= */}
              <div
                className="absolute top-[40%] left-1/2 w-[550px] h-[220px] md:w-[720px] md:h-[280px] border border-t-indigo-500/[0.05] border-b-indigo-500/[0.035] border-l-transparent border-r-transparent rounded-full pointer-events-none"
                style={{
                  transform: 'translate(calc(-50% + var(--mx, 0) * 32px), calc(-50% + var(--my, 0) * 32px)) rotate(6deg)',
                  transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Fast Rotating Inner Group (48s orbit duration) */}
                <div 
                  className="absolute inset-0"
                  style={{
                    animation: 'hero-rotate-cw 48s linear infinite',
                  }}
                >
                  {/* Premium Connection Line 3 */}
                  <div 
                    className="absolute top-1/2 left-[8%] right-[8%] h-[0.5px] bg-gradient-to-r from-transparent via-indigo-500/18 to-transparent"
                    style={{
                      transform: 'translateY(-50%) rotate(15deg)',
                      animation: 'connection-pulse-slow 9s ease-in-out infinite 1s',
                    }}
                  />

                  {/* Node Fore 1: PDF Document (FileText) - Slightly larger, high contrast, clean glow */}
                  <div 
                    className="absolute top-[8%] left-[12%] -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-700/60 p-3 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.08)] scale-105"
                    style={{
                      animation: 'hero-rotate-ccw 48s linear infinite',
                    }}
                  >
                    <FileText className="h-4.5 w-4.5 text-slate-200" />
                  </div>

                  {/* Node Fore 2: Concept Map (Brain) - Slightly larger, high contrast, clean glow */}
                  <div 
                    className="absolute bottom-[8%] right-[12%] translate-x-1/2 translate-y-1/2 bg-slate-950 border border-slate-700/60 p-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.08)] scale-105"
                    style={{
                      animation: 'hero-rotate-ccw 48s linear infinite',
                    }}
                  >
                    <Brain className="h-4.5 w-4.5 text-slate-200" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Subtle floating feature pill */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-slate-800/80 bg-slate-900/30 backdrop-blur-md px-3.5 py-1.5 text-[10.5px] font-semibold text-slate-400 rounded-full mb-6 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="tracking-wide text-slate-300">A research operating system where documents become understanding</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white mb-6 max-w-4xl leading-[1.08]"
          >
            Knowledge <br />
            <span className="font-serif italic font-medium text-indigo-400 drop-shadow-sm">in motion.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed mb-8 font-medium"
          >
            Upload PDFs, papers, textbooks, and notes. Menteea transforms them into concept maps, grounded conversations, quizzes, and study guides.
          </motion.p>

          {/* Action Row */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mb-10"
          >
            <button
              onClick={onStart}
              className="w-full sm:w-auto group flex items-center justify-center gap-2 rounded-lg bg-slate-100 hover:bg-white text-slate-950 font-bold px-6 py-3.5 text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Enter Research Workspace
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </button>
            <a
              href="#interactive-showcase"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-700 text-slate-300 font-bold px-6 py-3.5 text-[11px] uppercase tracking-widest transition-all rounded-lg cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Live Workspace Demo
            </a>
          </motion.div>

          {/* Trust Strip - Moved Here Under Action Row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-4xl border-t border-slate-900/80 pt-6 pb-12 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mr-2">BUILT FOR</span>
              {["Researchers", "Students", "Engineers", "Technical Learners", "Faculty"].map((item, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 px-3 py-1 rounded-md text-[10px] font-semibold text-slate-300 hover:border-indigo-500/20 hover:text-indigo-300 transition duration-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mr-2">SUPPORTS</span>
              {["Research Papers", "Textbooks", "Lecture Notes", "Reports", "Technical PDFs"].map((item, idx) => (
                <div key={idx} className="bg-indigo-950/5 border border-slate-900 px-3 py-1 rounded-md text-[9.5px] font-semibold text-slate-400">
                  📄 {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ================= SECTION 2: PRODUCT PREVIEW - DOMINATES THE HERO ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-6xl rounded-xl border border-slate-800/70 bg-[#060910] p-2 shadow-[0_0_60px_rgba(0,0,0,0.85)] relative group mb-12"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-xl filter blur-xl opacity-40 group-hover:opacity-55 transition duration-1000" />
            
            <div className="relative rounded-lg border border-slate-800/80 overflow-hidden bg-slate-950">
              {/* Desktop Window Chrome */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-850">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/30" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/30" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/30" />
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 font-medium">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> quantum_optics_manifest.pdf — Interactive Active Sandbox
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded text-[9px] font-mono text-indigo-400 border border-slate-850">
                  CTRL + L
                </div>
              </div>
              
              {/* Full Interactive Product Mock Environment */}
              <div className="grid grid-cols-1 md:grid-cols-12 h-[420px] text-left text-xs text-slate-300 font-medium">
                
                {/* 1. Document Sidebar (Col Span 3) */}
                <div className="hidden md:block col-span-3 border-r border-slate-900 bg-[#04060b] p-4 font-mono text-[10px] space-y-4">
                  <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold flex items-center justify-between">
                    <span>Document Library</span>
                    <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400">3 Files</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span className="truncate font-semibold">quantum_optics_info.pdf</span>
                    </div>
                    <div className="p-2.5 rounded hover:bg-slate-900/60 text-slate-500 flex items-center gap-2 transition cursor-pointer">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">solid_state_physics.pdf</span>
                    </div>
                    <div className="p-2.5 rounded hover:bg-slate-900/60 text-slate-500 flex items-center gap-2 transition cursor-pointer">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">nano_optics_intro.pdf</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold mb-2">Workspace Modules</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 px-2 py-1 bg-slate-900/30 rounded text-[9.5px]">
                        <Brain className="h-3 w-3 text-indigo-400" />
                        <span>Spatial Concept Maps</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 px-2 py-1 text-[9.5px]">
                        <Award className="h-3 w-3" />
                        <span>Adaptive Evaluation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Active Document Frame (Col Span 5) */}
                <div className="col-span-12 md:col-span-5 p-5 bg-slate-950 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#02040a]/80 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">SECTION 3.2 — STUDY ENVIRONMENT</span>
                      <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">PDF PAGE 4</span>
                    </div>

                    <h3 className="font-serif italic text-lg text-slate-100 mb-2 font-medium">3.2 Coherent Superposition Decay</h3>
                    
                    {/* Excerpt with dynamic highlighting */}
                    <div className="text-slate-400 leading-relaxed text-[11px] space-y-3 font-medium">
                      <p>
                        The decay rate of superposition states is deeply coupled to environmental temperature. Thermal photons scatter across the quantum boundary, collapsing the density matrix off-diagonals.
                      </p>
                      
                      <motion.div 
                        animate={{ 
                          backgroundColor: highlightedExcerpt ? "rgba(99, 102, 241, 0.12)" : "rgba(0,0,0,0)",
                          borderColor: highlightedExcerpt ? "rgba(99, 102, 241, 0.25)" : "rgba(255,255,255,0.03)"
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-2.5 rounded border leading-relaxed text-slate-300 font-semibold transition"
                      >
                        Consequently, maintaining long-range quantum phase preservation requires robust micro-Kelvin isolating environments. Thermal noise collapses superposition.
                      </motion.div>
                    </div>
                  </div>

                  {/* Foot Indicator */}
                  <div className="relative z-10 mt-4 p-3 bg-slate-900/40 border border-slate-900 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-indigo-400" />
                      Dynamic Relational Analysis
                    </span>
                    <button onClick={onStart} className="text-[10.5px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer">
                      Map Workspace <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* 3. Simulated Active Chat Bot (Col Span 4) */}
                <div className="hidden md:flex col-span-4 border-l border-slate-900 bg-[#04060b] p-4 flex-col justify-between">
                  <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-none">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Grounded Verification</span>
                      <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping" /> Real-time Response
                      </span>
                    </div>

                    <AnimatePresence>
                      {heroChatMessages.map((msg, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : ""}`}
                        >
                          {msg.sender === "bot" && (
                            <div className="h-6 w-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              <MenteeaIcon size={14} />
                            </div>
                          )}
                          <div className={`p-3 rounded-lg border text-[10.5px] font-medium leading-relaxed max-w-[90%] ${
                            msg.sender === "user"
                              ? "bg-slate-900 border-slate-800 text-slate-200"
                              : "bg-indigo-950/15 border-indigo-900/20 text-slate-300"
                          }`}>
                            <p>{msg.text}</p>
                            {msg.page && (
                              <div className="mt-2 text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10 inline-flex items-center gap-1">
                                <BookmarkCheck className="h-3 w-3" /> {msg.page} (Cited Evidence)
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Chat assistant status states */}
                    {heroChatStep === "waiting" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-500 text-[10px] pl-8">
                        <Clock className="h-3 w-3 animate-spin text-indigo-500" />
                        <span>Searching source material...</span>
                      </motion.div>
                    )}
                    {heroChatStep === "responding" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-slate-500 text-[10px] pl-8">
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </motion.div>
                    )}
                  </div>

                  {/* Input Query Bar with simulation */}
                  <div className="pt-3 border-t border-slate-900">
                    <div className="relative">
                      <input
                        disabled
                        type="text"
                        value={heroSearchQuery}
                        placeholder="Inquire about document physics..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-8 py-2 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center">
                        <span className="h-3 w-0.5 bg-indigo-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </section>

        {/* ================= SECTION 2: THE UNDERSTANDING PIPELINE (UPGRADED) ================= */}
        <section id="pipeline" className="w-full bg-[#010206] border-y border-slate-900/80 py-24 px-6 sm:px-8 flex flex-col items-center">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
                THE UNDERSTANDING PIPELINE
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
                A proven path from reading to mastery.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto font-medium">
                Menteea transforms static source literature into highly organized, accessible structures of personal expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {/* Dynamic Connecting Line with light pulsing glow */}
              <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-slate-900 z-0">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-1000 ease-in-out"
                  style={{ width: `${((pipelineActiveStep + 1) / 5) * 100}%` }}
                />
              </div>

              {[
                {
                  id: 0,
                  step: "01",
                  title: "Upload PDF",
                  desc: "Upload important papers, books, or notes in seconds.",
                  icon: FileText
                },
                {
                  id: 1,
                  step: "02",
                  title: "Map Concepts",
                  desc: "Menteea builds spatial maps of ideas, formulas, and relationships.",
                  icon: Brain
                },
                {
                  id: 2,
                  step: "03",
                  title: "Challenge Gap",
                  desc: "Adaptive quizzes reveal what you truly understand.",
                  icon: Award
                },
                {
                  id: 3,
                  step: "04",
                  title: "Build Guide",
                  desc: "Generate structured study guides, formulas, pitfalls, and plans.",
                  icon: BookOpenCheck
                },
                {
                  id: 4,
                  step: "05",
                  title: "Export Artifact",
                  desc: "Download publication-ready PDFs, Word docs, or Markdown.",
                  icon: Download
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                const isActive = pipelineActiveStep === index;
                return (
                  <div
                    key={index}
                    className="relative z-10 flex flex-col items-center text-center group cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredPipelineStep(index);
                      setPipelineActiveStep(index);
                    }}
                    onMouseLeave={() => setHoveredPipelineStep(null)}
                  >
                    {/* Active pulse aura */}
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                      isActive
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] scale-110"
                        : "bg-slate-900 border-slate-850 text-slate-500 group-hover:border-slate-800"
                    } mb-4 relative`}>
                      <IconComponent className="h-5 w-5" />
                      {isActive && (
                        <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      )}
                    </div>
                    <div className={`text-[9px] font-mono tracking-widest uppercase font-bold transition duration-300 ${isActive ? "text-indigo-400" : "text-slate-600"}`}>
                      STEP {item.step}
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold mt-1.5 mb-1 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-[10.5px] leading-relaxed max-w-[160px] font-medium">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: CORE INTELLIGENCE LAYER (CARD REFINEMENT) ================= */}
        <section id="intelligence" className="w-full max-w-5xl px-6 sm:px-8 py-24">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
              CORE INTELLIGENCE LAYER
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
              Surgical tools for deep research.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-xl mx-auto font-medium animate-pulse">
              Skip general chat summaries. Generate focused, structured knowledge modules directly from verified literature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: "See how ideas connect.",
                feature: "Spatial Concept Maps",
                desc: "Convert text chapters into visible hierarchy maps. Grasp which physical laws, derivations, or ideas branch out of primary arguments instantly.",
                icon: Brain,
                color: "text-purple-400",
                bg: "bg-purple-500/5",
                border: "border-purple-500/10",
                hoverBorder: "group-hover:border-purple-500/30"
              },
              {
                title: "Discover what you actually understand.",
                feature: "Grounded Quizzes",
                desc: "Probe local retention limitations. Adaptive questions extract nuanced arguments and provide contextual corrections grounded strictly to exact coordinates.",
                icon: Award,
                color: "text-emerald-400",
                bg: "bg-emerald-500/5",
                border: "border-emerald-500/10",
                hoverBorder: "group-hover:border-emerald-500/30"
              },
              {
                title: "Synthesize literature instantly.",
                feature: "Automated Study Guides",
                desc: "Gather formulas, terms, processes, and warning checklists into clean study folders. Eliminate manual summarizing and highlight tracking.",
                icon: BookOpen,
                color: "text-amber-400",
                bg: "bg-amber-500/5",
                border: "border-emerald-500/10",
                hoverBorder: "group-hover:border-amber-500/30"
              },
              {
                title: "Evidence-backed conversations.",
                feature: "Grounded Document Chat",
                desc: "Probe multiple text files concurrently. Answers are completely backed and constrained by source text, verified with precise page citation chips.",
                icon: MessageSquare,
                color: "text-blue-400",
                bg: "bg-blue-500/5",
                border: "border-blue-500/10",
                hoverBorder: "group-hover:border-blue-500/30"
              }
            ].map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIntelCard(idx)}
                  onMouseLeave={() => setHoveredIntelCard(null)}
                  className="p-5 rounded-xl bg-slate-900/15 border border-slate-850 hover:border-slate-800 transition-all duration-300 hover:bg-slate-900/30 text-left flex flex-col justify-between group min-h-[300px]"
                >
                  <div>
                    <div className={`h-9 w-9 rounded-lg ${card.bg} ${card.border} ${card.hoverBorder} flex items-center justify-center ${card.color} mb-4 group-hover:scale-105 transition-transform duration-300`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase block">
                      {card.feature}
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-100 mt-1 mb-2.5 group-hover:text-indigo-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-900/50 flex items-center justify-between">
                    <span className="text-[8.5px] text-slate-500 font-mono">STANDALONE MODULE</span>
                    <button
                      onClick={onStart}
                      className="text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      Explore <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION 4: THE LIVE INTERACTIVE WORKSPACE SANDBOX ================= */}
        <section id="interactive-showcase" className="w-full bg-[#010205] border-t border-slate-900/80 py-24 px-6 sm:px-8 flex flex-col items-center">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-12">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
                04 LIVE INTERACTIVE SANDBOX
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
                Try Menteea. Right here.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto font-medium">
                Every module is interactive. Experience the core before you enter.
              </p>
            </div>

            {/* Sandbox Module Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { id: "reader", label: "Active Reader", icon: FileText },
                { id: "mindmap", label: "Mind Map Engine", icon: Brain },
                { id: "quiz", label: "Adaptive Quiz", icon: Award },
                { id: "guide", label: "Study Guide Preview", icon: BookOpenCheck }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[11px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 text-slate-400"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sandbox Window Frame */}
            <div className="w-full rounded-xl border border-slate-850 bg-slate-950 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                  <span className="text-[9.5px] text-slate-500 font-mono ml-3 border-l border-slate-800 pl-3">
                    Active Sandbox
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded border border-slate-850">
                  {activeTab === "reader" && "📚 Active Reader"}
                  {activeTab === "mindmap" && "🧠 Mind Map Engine"}
                  {activeTab === "quiz" && "📝 Adaptive Quiz"}
                  {activeTab === "guide" && "📖 Study Guide Preview"}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">LIVE PREVIEW</span>
                </div>
              </div>

              {/* Window Content */}
              <div className="p-6 min-h-[360px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: ACTIVE READER */}
                  {activeTab === "reader" && (
                    <motion.div
                      key="reader"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
                    >
                      {/* Left Side: PDF Excerpt */}
                      <div className="p-4 rounded-lg bg-[#04060b] border border-slate-850 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900">
                            <span className="text-[9px] font-mono text-slate-500 font-bold">SEC 4.1 — CRYPTOGRAPHIC INTEGRITY</span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded">PAGE 12</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-2">No-Cloning Constraint & State Security</h4>
                          <p className="text-slate-400 text-[10.5px] leading-relaxed mb-4 font-semibold">
                            An arbitrary unknown quantum state cannot be replicated exactly. This linear constraint <span className="text-indigo-400 font-bold font-mono bg-indigo-950/40 px-1 rounded border border-indigo-900/30 text-[10px]" id="ref-no-cloning">[Ref 1]</span> makes classical interception detectable. If an eavesdropper attempts to intercept and clone the transmission, quantum disturbance collapses state vectors <span className="text-indigo-400 font-bold font-mono bg-indigo-950/40 px-1 rounded border border-indigo-900/30 text-[10px]" id="ref-noise">[Ref 2]</span>.
                          </p>
                        </div>
                        <div className="p-2.5 bg-indigo-500/5 rounded-md border border-indigo-500/10 text-[9.5px] text-indigo-300 font-semibold leading-relaxed">
                          💡 Hover or click references in the sandbox view to see ground-truth verification triggers.
                        </div>
                      </div>

                      {/* Right Side: Chat Panel */}
                      <div className="flex flex-col justify-between bg-slate-900/20 border border-slate-850 rounded-lg p-4">
                        <div className="space-y-3.5">
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850">
                            <div className="text-[9px] font-mono text-slate-500 mb-1">USER INQUIRY</div>
                            <p className="text-[10.5px] text-slate-200 font-bold">Why can't we clone an incoming arbitrary quantum state?</p>
                          </div>
                          
                          <div className="p-3.5 bg-indigo-950/10 rounded-lg border border-indigo-900/20">
                            <div className="text-[9px] font-mono text-indigo-400 mb-1 font-bold">MENTEEA VERIFIED</div>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                              Linear algebra operators are strictly unitary. A unitary copying matrix <code className="text-indigo-300 font-mono text-[10px]">U|ψ⟩|0⟩ = |ψ⟩|ψ⟩</code> cannot hold for superpositions of distinct states without violating system linearity.
                            </p>
                            
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="text-[9px] font-mono bg-indigo-600 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <BookmarkCheck className="h-2.5 w-2.5" /> Grounded Source: Ref 1 (Page 12)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-900 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-mono">100% verified to source</span>
                          <button onClick={onStart} className="text-[10.5px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer">
                            Launch Full Chat <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: MIND MAP ENGINE */}
                  {activeTab === "mindmap" && (
                    <motion.div
                      key="mindmap"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
                    >
                      {/* Interactive concept selector map representation */}
                      <div className="col-span-12 md:col-span-7 bg-[#04060b] border border-slate-850 rounded-lg p-5 min-h-[260px] flex flex-col justify-between relative overflow-hidden">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase block mb-3">Relational Connection network</span>
                          <div className="relative h-[180px] flex items-center justify-center">
                            
                            {/* Connector Lines SVG */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                              <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#1e293b" strokeWidth="2" />
                              <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#1e293b" strokeWidth="2" />
                              <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#1e293b" strokeWidth="2" />
                              
                              {/* Highlight current node connection path */}
                              {selectedMindMapNode === "superposition" && (
                                <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#6366f1" strokeWidth="2" className="animate-pulse" />
                              )}
                              {selectedMindMapNode === "entanglement" && (
                                <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#6366f1" strokeWidth="2" className="animate-pulse" />
                              )}
                              {selectedMindMapNode === "decoherence" && (
                                <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#6366f1" strokeWidth="2" className="animate-pulse" />
                              )}
                            </svg>

                            {/* Base state node */}
                            <button
                              onClick={() => setSelectedMindMapNode("quantum_mechanics")}
                              className={`absolute z-20 px-3.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                                selectedMindMapNode === "quantum_mechanics"
                                  ? "bg-slate-100 text-slate-950 border-white shadow-md scale-105"
                                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              ⚛️ Quantum Computing Base
                            </button>

                            {/* Outer Node 1 */}
                            <button
                              onClick={() => setSelectedMindMapNode("superposition")}
                              className={`absolute top-4 left-4 sm:left-8 z-20 px-3 py-1.5 rounded-lg border text-[9.5px] font-bold transition-all duration-300 cursor-pointer ${
                                selectedMindMapNode === "superposition"
                                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md scale-105"
                                  : "bg-slate-900/90 border-slate-850 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              💡 Coherent Superposition
                            </button>

                            {/* Outer Node 2 */}
                            <button
                              onClick={() => setSelectedMindMapNode("entanglement")}
                              className={`absolute top-4 right-4 sm:right-8 z-20 px-3 py-1.5 rounded-lg border text-[9.5px] font-bold transition-all duration-300 cursor-pointer ${
                                selectedMindMapNode === "entanglement"
                                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md scale-105"
                                  : "bg-slate-900/90 border-slate-850 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              🧬 Quantum Entanglement
                            </button>

                            {/* Outer Node 3 */}
                            <button
                              onClick={() => setSelectedMindMapNode("decoherence")}
                              className={`absolute bottom-4 z-20 px-3 py-1.5 rounded-lg border text-[9.5px] font-bold transition-all duration-300 cursor-pointer ${
                                selectedMindMapNode === "decoherence"
                                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md scale-105"
                                  : "bg-slate-900/90 border-slate-850 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              ⚙️ Phase Decoherence Cascade
                            </button>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-semibold">
                          👆 Click different node buttons to navigate structural relationships.
                        </div>
                      </div>

                      {/* Map info panel details */}
                      <div className="col-span-12 md:col-span-5 bg-slate-900/20 border border-slate-850 rounded-lg p-4.5 flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                          {selectedMindMapNode === "quantum_mechanics" && (
                            <motion.div
                              key="quantum"
                              initial={{ opacity: 0, x: 4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              className="space-y-2.5"
                            >
                              <div className="text-[9px] font-mono text-slate-500 font-bold">CORE DOMAIN</div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-indigo-400">Quantum Computing Base</h4>
                              <p className="text-slate-300 text-[10.5px] leading-relaxed font-semibold">
                                The mathematical application of linear algebra, Hilbert spaces, and physical state operators to process complex information beyond binary state limitations.
                              </p>
                              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-850 text-[9.5px] text-slate-400 font-mono leading-relaxed">
                                • Hilbert Space Dimensions: 2^N<br />
                                • Operator Norm: Unitary (U*U = I)
                              </div>
                            </motion.div>
                          )}

                          {selectedMindMapNode === "superposition" && (
                            <motion.div
                              key="superposition"
                              initial={{ opacity: 0, x: 4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              className="space-y-2.5"
                            >
                              <div className="text-[9px] font-mono text-indigo-400 font-bold">NODE VALUE 01</div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-indigo-300">Coherent Superposition</h4>
                              <p className="text-slate-300 text-[10.5px] leading-relaxed font-semibold">
                                The physical state of a quantum system existing concurrently in a linear combination of multiple basis states until active projective measurement collapses the vector.
                              </p>
                              <div className="bg-indigo-950/10 p-2.5 rounded border border-indigo-900/25 text-[9.5px] text-indigo-300 font-mono leading-relaxed">
                                Equation: |Ψ⟩ = α|0⟩ + β|1⟩<br />
                                Constraint: |α|² + |β|² = 1
                              </div>
                            </motion.div>
                          )}

                          {selectedMindMapNode === "entanglement" && (
                            <motion.div
                              key="entanglement"
                              initial={{ opacity: 0, x: 4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              className="space-y-2.5"
                            >
                              <div className="text-[9px] font-mono text-indigo-400 font-bold">NODE VALUE 02</div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-indigo-300">Quantum Entanglement</h4>
                              <p className="text-slate-300 text-[10.5px] leading-relaxed font-semibold">
                                A physical connection where the quantum state of each particle cannot be described independently of the other, even when separated by galactic distances.
                              </p>
                              <div className="bg-indigo-950/10 p-2.5 rounded border border-indigo-900/25 text-[9.5px] text-indigo-300 font-mono leading-relaxed">
                                Example Bell State:<br />
                                |Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
                              </div>
                            </motion.div>
                          )}

                          {selectedMindMapNode === "decoherence" && (
                            <motion.div
                              key="decoherence"
                              initial={{ opacity: 0, x: 4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              className="space-y-2.5"
                            >
                              <div className="text-[9px] font-mono text-rose-400 font-bold">NODE CONSTRAINT 03</div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-rose-300">Phase Decoherence Cascade</h4>
                              <p className="text-slate-300 text-[10.5px] leading-relaxed font-semibold">
                                The loss of quantum coherence caused by uncontrolled leakage of phase information into external degrees of freedom, collapsing superpositions to classical states.
                              </p>
                              <div className="bg-rose-950/10 p-2.5 rounded border border-rose-900/25 text-[9.5px] text-rose-300 font-mono leading-relaxed">
                                • Decay Coefficient: exp(-t/T_2)<br />
                                • Major Pitfall: Thermal Noise
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button onClick={onStart} className="mt-4 w-full text-center py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] text-slate-300 hover:text-white font-bold border border-slate-800 transition cursor-pointer">
                          Generate Custom Map
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: ADAPTIVE QUIZ */}
                  {activeTab === "quiz" && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-left max-w-2xl mx-auto flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                          ACTIVE ASSESSMENT — QUESTION {currentQuizIndex + 1} OF {quizQuestions.length}
                        </span>
                        <div className="flex gap-1">
                          {quizQuestions.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                                currentQuizIndex === idx ? "bg-indigo-500" : quizAnswered[idx + 1] !== null ? "bg-slate-700" : "bg-slate-900"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Active Quiz Card */}
                      <div className="bg-[#04060b] border border-slate-850 rounded-lg p-4.5 mb-3">
                        <h4 className="text-[11.5px] font-extrabold text-slate-100 mb-3.5 leading-normal">
                          {quizQuestions[currentQuizIndex].question}
                        </h4>

                        <div className="space-y-2">
                          {quizQuestions[currentQuizIndex].options.map((option, optIdx) => {
                            const userAnswer = quizAnswered[quizQuestions[currentQuizIndex].id];
                            const correctIndex = quizQuestions[currentQuizIndex].correctIndex;
                            const isSelected = userAnswer === optIdx;
                            
                            let optionStyle = "bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-300";
                            if (userAnswer !== null) {
                              if (optIdx === correctIndex) {
                                optionStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                              } else if (isSelected) {
                                optionStyle = "bg-rose-500/10 border-rose-500/30 text-rose-400";
                              } else {
                                optionStyle = "bg-slate-950 border-slate-900 text-slate-600";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={userAnswer !== null}
                                onClick={() => handleAnswerQuiz(quizQuestions[currentQuizIndex].id, optIdx)}
                                className={`w-full text-left p-3 rounded-lg border text-[10.5px] font-semibold transition-all duration-200 cursor-pointer ${optionStyle}`}
                              >
                                <span className="mr-2 opacity-50">{optIdx === 0 ? "A" : optIdx === 1 ? "B" : "C"}.</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {/* Diagnostic Feedback */}
                        {quizAnswered[quizQuestions[currentQuizIndex].id] !== null && (
                          <div className={`mt-3.5 p-3 rounded-lg border text-[10px] leading-relaxed font-semibold bg-indigo-500/5 border-indigo-500/10 text-indigo-300`}>
                            {quizQuestions[currentQuizIndex].feedback}
                          </div>
                        )}
                      </div>

                      {/* Quiz Controls */}
                      <div className="flex items-center justify-between mt-2.5">
                        <button
                          disabled={currentQuizIndex === 0}
                          onClick={() => setCurrentQuizIndex((p) => p - 1)}
                          className="px-3.5 py-1.5 rounded bg-slate-900 text-slate-400 hover:text-white text-[10px] font-bold border border-slate-850 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          Previous
                        </button>
                        
                        <div className="text-[10px] text-slate-500 font-mono font-bold">
                          {Object.values(quizAnswered).filter(v => v !== null).length} of {quizQuestions.length} completed
                        </div>

                        {currentQuizIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuizIndex((p) => p + 1)}
                            className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition"
                          >
                            Next Challenge
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setQuizAnswered({ 1: null, 2: null, 3: null });
                              setCurrentQuizIndex(0);
                            }}
                            className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 text-[10px] font-bold border border-slate-850 transition"
                          >
                            Reset Assessment
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: STUDY GUIDE PREVIEW */}
                  {activeTab === "guide" && (
                    <motion.div
                      key="guide"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
                    >
                      {/* Left: Section Navigator */}
                      <div className="col-span-12 md:col-span-4 space-y-1 bg-[#04060b] border border-slate-850 p-3 rounded-lg">
                        <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-2 px-2">GUIDE INDICES</div>
                        {[
                          { id: "summary", label: "1. Core Summary Pillars" },
                          { id: "formulas", label: "2. Formula Dictionary" },
                          { id: "pitfalls", label: "3. Common Pitfalls" },
                          { id: "milestones", label: "4. Revision Milestones" },
                          { id: "recap", label: "5. Quick Recap" }
                        ].map((sec) => (
                          <button
                            key={sec.id}
                            onClick={() => setActiveGuideSection(sec.id)}
                            className={`w-full text-left px-2.5 py-2 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                              activeGuideSection === sec.id
                                ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-bold"
                                : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                            }`}
                          >
                            {sec.label}
                          </button>
                        ))}

                        <div className="pt-4 mt-2 border-t border-slate-900">
                          <button onClick={onStart} className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9.5px] rounded transition">
                            <Download className="h-3.5 w-3.5" /> Download Preview (PDF)
                          </button>
                        </div>
                      </div>

                      {/* Right: Section Details Preview */}
                      <div className="col-span-12 md:col-span-8 bg-slate-900/25 border border-slate-850 rounded-lg p-5 flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                          {activeGuideSection === "summary" && (
                            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                              <div>
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-1">Core Summary Pillars</h4>
                                <p className="text-slate-400 text-[10px] leading-relaxed font-semibold">
                                  Physical state representations are preserved in a mathematical complex vector space. When scaling, local phase coefficients are threatened by external thermal decoherence.
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 bg-slate-950 border border-slate-900 rounded">
                                  <div className="text-[9.5px] text-indigo-400 font-bold mb-1">Key Idea</div>
                                  <p className="text-[10px] text-slate-300 leading-snug font-medium">Superposition decay scales with environmental thermal photons.</p>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-900 rounded">
                                  <div className="text-[9.5px] text-indigo-400 font-bold mb-1">Observation</div>
                                  <p className="text-[10px] text-slate-300 leading-snug font-medium">Frequent measurements halt spontaneous phase collapse.</p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {activeGuideSection === "formulas" && (
                            <motion.div key="formulas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-1">Mathematical Dictionary</h4>
                              <div className="bg-slate-950 border border-slate-900 p-3 rounded">
                                <div className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider mb-2">Equation (Schrödinger Evolution)</div>
                                <div className="text-center py-4 bg-[#030509] rounded border border-slate-900 font-mono text-indigo-300 text-xs tracking-wider">
                                  iℏ ∂/∂t |Ψ(t)⟩ = Ĥ |Ψ(t)⟩
                                </div>
                                <p className="text-slate-400 text-[10px] leading-relaxed mt-2.5 font-semibold">
                                  This equation dictates the unitary evolution of a quantum state vector within complex Hilbert space before any measurement events.
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {activeGuideSection === "pitfalls" && (
                            <motion.div key="pitfalls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-1">Critical Pitfalls & Misconceptions</h4>
                              <ul className="space-y-2 text-[10.5px] font-semibold text-slate-300">
                                <li className="flex items-start gap-2 text-rose-300">
                                  <span className="text-rose-500 font-bold text-xs">⚠️</span>
                                  <span><strong className="text-rose-200">Decoherence is NOT dissipation:</strong> Decoherence is phase loss without necessarily losing system energy.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-indigo-400 font-bold text-xs">•</span>
                                  <span><strong className="text-slate-200">The No-Cloning Trap:</strong> Assuming you can verify a state without destroying its original superposition coordinates.</span>
                                </li>
                              </ul>
                            </motion.div>
                          )}

                          {activeGuideSection === "milestones" && (
                            <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-1">Revision Milestones</h4>
                              <div className="space-y-2">
                                <div className="p-2.5 bg-slate-950 border-l-2 border-emerald-500 rounded-r flex items-center justify-between">
                                  <span className="text-[10px] text-slate-300 font-semibold">1. Derive unitary transformation requirements</span>
                                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">PASSED</span>
                                </div>
                                <div className="p-2.5 bg-slate-950 border-l-2 border-indigo-500 rounded-r flex items-center justify-between">
                                  <span className="text-[10px] text-slate-300 font-semibold">2. Calculate T2 phase relaxation limits</span>
                                  <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">READY</span>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {activeGuideSection === "recap" && (
                            <motion.div key="recap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 mb-1">Quick Chapter Takeaways</h4>
                              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded space-y-2">
                                <div className="flex items-center gap-2 text-slate-300 text-[10.5px] font-semibold">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                  <span>Superposition requires micro-Kelvin thermal shielding.</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 text-[10.5px] font-semibold">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                  <span>Linear operators guarantee physical cryptography security boundaries.</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Verified against source materials</span>
                          <button onClick={onStart} className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer">
                            Export PDF Package <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: "WHAT YOU WALK AWAY WITH" (REPLACES OUTCOMES) ================= */}
        <section id="outcomes" className="w-full max-w-5xl px-6 sm:px-8 py-24 border-t border-slate-900/80">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
              05 CREDIBILITY & VALUE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
              What You Walk Away With
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-xl mx-auto font-medium">
              We replace flashy, fabricated metrics with tangible knowledge assets. Menteea ensures real comprehension and retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: "Concept Maps Instantly Generated",
                desc: "See the structure behind complex ideas in clear, visual hierarchies. Eliminate linear reading bottlenecks.",
                icon: Brain,
                metric: "Conceptual Blueprint"
              },
              {
                title: "Quizzes That Teach",
                desc: "Test your understanding with questions grounded strictly in the actual text. Instant page-linked feedback.",
                icon: Award,
                metric: "Active Recall Tests"
              },
              {
                title: "Study Guides That Stick",
                desc: "Get clean, organized revision packets with mathematical formulas, warning lists, and critical chapter pitfalls.",
                icon: BookOpenCheck,
                metric: "Revision Folders"
              },
              {
                title: "Grounded AI Chat",
                desc: "Ask complex questions across your paper pool. Every single answer is locked to exact coordinates inside your source files.",
                icon: MessageSquare,
                metric: "Ground-Truth Chats"
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-lg bg-slate-900/20 border border-slate-850 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/35 transition-all duration-300">
                  <div>
                    <div className="h-8 w-8 rounded bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-900 flex items-center justify-between text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    <span>OUTPUT FORMAT</span>
                    <span>{item.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION 6: EXPORT & OWNERSHIP SECTION ================= */}
        <section id="export" className="w-full bg-[#010206] border-y border-slate-900/80 py-24 px-6 sm:px-8 flex flex-col items-center">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
                06 EXPORT & OWNERSHIP
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
                Your knowledge. Your formats. Your way.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto font-medium">
                No proprietary formats. Export beautiful, formatted study packages that integrate seamlessly with your physical note habits or digital note-taking stacks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: PDF Export */}
              <div className="p-6 rounded-xl bg-slate-900/10 border border-slate-850 hover:border-slate-850 hover:bg-slate-900/25 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded font-bold uppercase">PRINT READY</span>
                    <FileText className="h-5 w-5 text-rose-400" />
                  </div>
                  
                  {/* Miniature abstract representation of a document */}
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-2 mb-4">
                    <div className="h-2 w-12 bg-rose-400/20 rounded" />
                    <div className="h-1.5 w-full bg-slate-900 rounded" />
                    <div className="h-1.5 w-5/6 bg-slate-900 rounded" />
                    <div className="grid grid-cols-3 gap-1.5 pt-2">
                      <div className="h-4 bg-slate-900/40 rounded border border-slate-900" />
                      <div className="h-4 bg-slate-900/40 rounded border border-slate-900" />
                      <div className="h-4 bg-slate-900/40 rounded border border-slate-900" />
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mb-1.5 group-hover:text-rose-400 transition-colors">Portable Study PDF</h3>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">
                    Print-ready, clean, and structured for physical study sessions. Highly formatted layout optimized for margin annotation.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-[8.5px] font-mono text-slate-500">FORMAT: .PDF</span>
                  <button onClick={onStart} className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer">
                    Export PDF <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 2: Word Export */}
              <div className="p-6 rounded-xl bg-slate-900/10 border border-slate-850 hover:border-slate-850 hover:bg-slate-900/25 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded font-bold uppercase font-sans">EDITABLE</span>
                    <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                  </div>
                  
                  {/* Miniature abstract representation */}
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-2 mb-4">
                    <div className="h-2 w-16 bg-blue-400/20 rounded" />
                    <div className="h-1.5 w-full bg-slate-900 rounded" />
                    <div className="h-1.5 w-4/5 bg-slate-900 rounded" />
                    <div className="h-3 w-1/3 bg-slate-900 rounded mt-1" />
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mb-1.5 group-hover:text-blue-400 transition-colors">Editable Word Pack</h3>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">
                    Fully formatted for Microsoft Word and Google Docs. Ready for custom annotation, paragraph merging, and direct study guide appending.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-[8.5px] font-mono text-slate-500">FORMAT: .DOCX</span>
                  <button onClick={onStart} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                    Export Word <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 3: Markdown Export */}
              <div className="p-6 rounded-xl bg-slate-900/10 border border-slate-850 hover:border-slate-850 hover:bg-slate-900/25 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded font-bold uppercase">PORTABLE</span>
                    <Layers className="h-5 w-5 text-indigo-400" />
                  </div>
                  
                  {/* Miniature abstract representation */}
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-2 mb-4 font-mono text-[6.5px] text-slate-500 leading-none">
                    <div># Quantum Physics base</div>
                    <div className="text-indigo-400/60">- Coherent Superposition [Page 4]</div>
                    <div className="text-indigo-400/60">- Entanglement links [Page 12]</div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mb-1.5 group-hover:text-indigo-400 transition-colors">Markdown Backup</h3>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">
                    Lightweight and future-proof. Perfect for Obsidian, Notion, Logseq, and general relational personal knowledge graph systems.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-[8.5px] font-mono text-slate-500">FORMAT: .MD</span>
                  <button onClick={onStart} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                    Export Markdown <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lock-in Statement */}
            <div className="mt-10 text-center flex items-center justify-center gap-2 text-slate-500 text-[11px] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No lock-in. No proprietary formats. Your data remains completely yours.
            </div>
          </div>
        </section>

        {/* ================= SECTION 7: FINAL CTA ================= */}
        <section className="w-full max-w-5xl px-6 sm:px-8 py-28 text-center relative overflow-hidden">
          {/* Subtle glowing ring background representing orbital nodes */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="h-[250px] w-[250px] rounded-full border border-indigo-500/10 animate-pulse" />
            <div className="h-[380px] w-[380px] rounded-full border border-blue-500/5 animate-ping absolute" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black">
              GET STARTED INSTANTLY
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
              Stop Reading. <br />
              <span className="font-serif italic font-medium text-indigo-400">Start Understanding.</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto font-medium leading-relaxed">
              Initialize your personalized research workspace in one click. No credit card required. Works completely local.
            </p>
            <div className="pt-4">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 shadow-xl hover:shadow-indigo-500/10 transition active:scale-95 cursor-pointer"
              >
                <span>Enter Research Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ================= FOOTER UPGRADE ================= */}
      <footer className="border-t border-slate-900/80 bg-[#010205] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12">
            
            {/* Branding Column */}
            <div className="col-span-2 space-y-4 text-left">
              <MenteeaLogo showVersion={true} size={24} darkBg={true} />
              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold max-w-xs">
                An active research operating system designed to convert complex technical literature, PDFs, and books into structured personal knowledge assets.
              </p>
              <div className="flex items-center gap-3 text-slate-500 pt-2">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition">
                  <Github className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-extrabold">Product</h4>
              <ul className="space-y-2 text-[11px] font-semibold text-slate-400">
                <li><button onClick={onStart} className="hover:text-white transition cursor-pointer text-left">Workspace Desk</button></li>
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Concept Maps</button></li>
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Adaptive Quizzes</button></li>
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Study Guides</button></li>
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Format Exports</button></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-extrabold">Resources</h4>
              <ul className="space-y-2 text-[11px] font-semibold text-slate-400">
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Documentation</button></li>
                <li><button onClick={() => onOpenHelpCenter("quickstart")} className="hover:text-white transition cursor-pointer text-left">Guides & Tutorials</button></li>
                <li><button onClick={() => onOpenHelpCenter("samples")} className="hover:text-white transition cursor-pointer text-left">Sample PDFs</button></li>
                <li><button onClick={() => onOpenHelpCenter("docs")} className="hover:text-white transition cursor-pointer text-left">Markdown Specs</button></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-extrabold">Company</h4>
              <ul className="space-y-2 text-[11px] font-semibold text-slate-400">
                <li><button onClick={() => onOpenHelpCenter("quickstart")} className="hover:text-white transition cursor-pointer text-left">Our Mission</button></li>
                <li><button onClick={() => onOpenHelpCenter("legal-privacy")} className="hover:text-white transition cursor-pointer text-left">Privacy Policy</button></li>
                <li><button onClick={() => onOpenHelpCenter("legal-terms")} className="hover:text-white transition cursor-pointer text-left">Terms of Service</button></li>
                <li><button onClick={() => onOpenHelpCenter("legal-security")} className="hover:text-white transition cursor-pointer text-left">Security & Privacy</button></li>
              </ul>
            </div>

            {/* Column 5: Connect */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-extrabold">Support</h4>
              <ul className="space-y-2 text-[11px] font-semibold text-slate-400">
                <li className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Support Email</span>
                  <a 
                    href="mailto:arman.m1012@gmail.com" 
                    className="text-slate-300 hover:text-white transition underline underline-offset-4 decoration-indigo-500/50 hover:decoration-indigo-400 break-all"
                  >
                    arman.m1012@gmail.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar with Copyright and Creator Attribution */}
          <div className="border-t border-slate-900/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-semibold gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
              <span>© {new Date().getFullYear()} Menteea. All rights reserved.</span>
              <span className="text-slate-700">•</span>
              <span className="text-indigo-400/80">Research Operating System</span>
              <span className="text-slate-700">•</span>
              <span>Version: <strong className="text-slate-400">v1.0</strong></span>
              <span className="text-slate-700">•</span>
              <span>Status: <strong className="text-indigo-400/80">Launch Candidate</strong></span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-1 text-slate-400">
                <span>Creator:</span>
                <a 
                  href="mailto:arman.m1012@gmail.com" 
                  className="text-slate-300 hover:text-white underline underline-offset-4 decoration-indigo-500 transition font-bold"
                >
                  Arman Mahapatra
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}




