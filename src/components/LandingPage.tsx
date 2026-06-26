import { Sparkles, ArrowRight, FileText, Compass, ShieldCheck } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
}

export default function LandingPage({ onStart, onOpenApiKey, hasApiKey }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-[#F9F9F8] text-[#1A1A1A] flex flex-col justify-between overflow-hidden">
      {/* Subtle organic layout decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1A1A1A]/[0.01] pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-8 py-6 flex items-center justify-between border-b border-neutral-200/40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1A1A1A] text-white">
            <span className="font-serif font-bold text-base italic">M</span>
          </div>
          <span className="font-serif font-bold text-xl tracking-tight italic text-neutral-900">
            Menteea
          </span>
          <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-neutral-400 align-top ml-1">
            v0.1
          </span>
        </div>

        <button
          onClick={onOpenApiKey}
          className={`flex items-center gap-2 border px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-200 ${
            hasApiKey
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800 shadow-xs"
          }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-neutral-300"}`} />
          {hasApiKey ? "API Key Active" : "Configure Key"}
        </button>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 border border-neutral-200 bg-white px-3.5 py-1 text-xs font-medium text-neutral-500 shadow-xs mb-8">
          <Sparkles className="h-3.5 w-3.5 text-neutral-800" />
          <span>Interactive Editorial Workspace for Modern Research</span>
        </div>

        <h1 className="font-serif font-medium text-5xl sm:text-7xl tracking-tight text-[#1A1A1A] mb-8 leading-tight">
          Understand complex research, <span className="italic font-bold">naturally.</span>
        </h1>

        <p className="text-neutral-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-12 font-sans">
          Menteea translates static research PDFs into interactive, grounded dialogues. Guided by custom-built Summaries, inline citation jumps, and smart suggested queries.
        </p>

        <button
          onClick={onStart}
          className="group flex items-center gap-2 rounded bg-[#1A1A1A] px-8 py-3.5 text-xs uppercase tracking-widest font-bold text-white shadow-md hover:bg-neutral-800 transition duration-300"
        >
          Open Workspace
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>

        {/* Feature Highlights with elegant borders instead of cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-3xl mt-24 border-t border-neutral-200 pt-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-8 w-8 flex items-center justify-center rounded bg-neutral-100 text-[#1A1A1A] mb-3">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif font-bold italic text-neutral-900 text-sm mb-1.5">Interactive Reader</h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">
              Explore text with side-by-side active views and live citation links.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-8 w-8 flex items-center justify-center rounded bg-neutral-100 text-[#1A1A1A] mb-3">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif font-bold italic text-neutral-900 text-sm mb-1.5">Grounded Context</h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">
              Answers are completely verified against and constrained by your uploaded documents.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-8 w-8 flex items-center justify-center rounded bg-neutral-100 text-[#1A1A1A] mb-3">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif font-bold italic text-neutral-900 text-sm mb-1.5">Local Autonomy</h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">
              Manage credentials transparently. Key configurations remain stored in your local session.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200 bg-white/50 py-6 text-center">
        <p className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
          DESIGNED FOR HIGHER SCHOLARSHIP • POWERED BY GEMINI AI
        </p>
      </footer>
    </div>
  );
}
