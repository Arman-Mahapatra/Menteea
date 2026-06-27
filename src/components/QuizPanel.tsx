import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Award,
  BookOpen,
  AlertTriangle,
  Flame,
  TrendingUp,
  BrainCircuit,
  CornerDownRight
} from "lucide-react";
import { DocumentFile } from "../types";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

interface QuizPanelProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentFile | null;
  apiKey: string;
  selectedDocuments: DocumentFile[];
}

export default function QuizPanel({
  isOpen,
  onClose,
  document,
  apiKey,
  selectedDocuments,
}: QuizPanelProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizCache, setQuizCache] = useState<Record<string, QuizData>>({});

  // Quiz active workflow states
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Load quiz from cache or generate via Gemini API
  const loadQuiz = useCallback(async (forceRegenerate = false) => {
    if (!document) return;

    // Reset workflow states
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizSubmitted(false);
    setErrorMsg(null);

    // If cached and not forcing regeneration, use cached quiz
    if (!forceRegenerate && quizCache[document.id]) {
      setQuiz(quizCache[document.id]);
      return;
    }

    setIsLoading(true);
    setQuiz(null);

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          documentId: document.id,
          selectedDocuments: selectedDocuments.map((d) => ({
            id: d.id,
            name: d.name,
            pages: d.pages,
            size: d.size,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Quiz generation temporarily unavailable. Please try again later.");
      }

      const data = (await response.json()) as QuizData;

      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Invalid quiz structure generated. Please try again.");
      }

      // Store in cache
      setQuizCache((prev) => ({
        ...prev,
        [document.id]: data,
      }));
      setQuiz(data);
    } catch (err: any) {
      console.error("Quiz load failure:", err);
      setErrorMsg(err.message || "Quiz generation temporarily unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [document, apiKey, selectedDocuments, quizCache]);

  // Handle open
  useEffect(() => {
    if (isOpen && document) {
      loadQuiz();
    }
  }, [isOpen, document]);

  // Option selection handler
  const handleSelectOption = (optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  // Navigations
  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!quiz) return;
    // Check if user answered everything
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < quiz.questions.length) {
      const confirmSubmit = window.confirm(
        `You have only answered ${answeredCount} out of ${quiz.questions.length} questions. Do you still want to submit?`
      );
      if (!confirmSubmit) return;
    }
    setQuizSubmitted(true);
  };

  // Score Calculations
  const scoreResults = useMemo(() => {
    if (!quiz) return { score: 0, total: 0, percentage: 0 };
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    const total = quiz.questions.length;
    return {
      score,
      total,
      percentage: Math.round((score / total) * 100),
    };
  }, [quiz, userAnswers]);

  // Performance category breakdown calculations
  const performanceBreakdown = useMemo(() => {
    if (!quiz) return { strongAreas: [], needsReview: [] };

    const categories: Record<string, { total: number; correct: number }> = {};

    quiz.questions.forEach((q, idx) => {
      const catName = q.category || "General Context";
      if (!categories[catName]) {
        categories[catName] = { total: 0, correct: 0 };
      }
      categories[catName].total += 1;
      if (userAnswers[idx] === q.correctAnswer) {
        categories[catName].correct += 1;
      }
    });

    const strongAreas: string[] = [];
    const needsReview: string[] = [];

    Object.entries(categories).forEach(([cat, stats]) => {
      const accuracy = stats.correct / stats.total;
      if (accuracy >= 0.7) {
        strongAreas.push(`${cat} (${stats.correct}/${stats.total} Correct)`);
      } else {
        needsReview.push(`${cat} (${stats.correct}/${stats.total} Correct)`);
      }
    });

    return { strongAreas, needsReview };
  }, [quiz, userAnswers]);

  const scoreMessage = useMemo(() => {
    const p = scoreResults.percentage;
    if (p === 100) return { title: "Perfect Score! 🌟", comment: "Outstanding! You have demonstrated absolute conceptual mastery over this document." };
    if (p >= 80) return { title: "Excellent Understanding! 🚀", comment: "Superb comprehension! You've grasped the core ideas and implications extremely well." };
    if (p >= 60) return { title: "Good Competency! 👍", comment: "Nice effort! You've secured a solid understanding of the primary themes." };
    return { title: "Keep Reviewing! 📚", comment: "A solid baseline. Re-read the chapters and try again to cement your conceptual knowledge." };
  }, [scoreResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 md:p-8">
      <div className="flex flex-col bg-bg-surface w-full h-full max-w-4xl rounded-2xl overflow-hidden border border-border-custom shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="h-14 bg-bg-surface border-b border-border-custom px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                Knowledge Assessment Quiz
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Interactive
                </span>
              </h2>
              <p className="text-[10px] text-text-muted font-medium line-clamp-1 max-w-lg">
                Conceptual evaluation for "{document?.name}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {quiz && (
              <button
                onClick={() => loadQuiz(true)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-bg-secondary text-text-secondary disabled:opacity-50 cursor-pointer active:scale-95 transition"
                title="Regenerate dynamic questions using Gemini"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-indigo-500 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">New Quiz</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-bg-app p-6 flex flex-col justify-between">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-3">
              <Loader2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <div>
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider animate-pulse">
                  Formulating AI Quiz...
                </p>
                <p className="text-[10px] text-text-muted mt-1.5 font-medium max-w-sm">
                  Synthesizing conceptual questions, options, explanations, and key categories based on your document content.
                </p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                  Quiz Generation Failed
                </h3>
                <p className="text-[11px] text-text-muted leading-relaxed mt-2.5">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={() => loadQuiz(false)}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              >
                Retry Generation
              </button>
            </div>
          ) : !quiz ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-text-muted font-medium">No quiz loaded.</p>
            </div>
          ) : !quizStarted ? (
            /* Intro / Start Screen */
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10 gap-6">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-2xs border border-indigo-500/20 animate-bounce">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary tracking-tight">
                  {quiz.title}
                </h3>
                <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed">
                  {quiz.description || "Synthesized test with 10 conceptual multiple-choice questions curated directly from the pages of your document."}
                </p>
              </div>

              <div className="w-full bg-bg-surface rounded-xl border border-border-custom p-4 text-left flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span>Assessment Guidelines</span>
                </div>
                <ul className="text-[10px] text-text-muted space-y-2 leading-relaxed font-medium">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                    <span>Contains <strong>10 questions</strong> mapping distinct document sub-concepts.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                    <span>Evaluates conceptual insight, core logic, and direct implications.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                    <span>Provides instant score grading, answer keys, and tailored summaries of strengths & blind spots.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setQuizStarted(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Start Challenge</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : !quizSubmitted ? (
            /* Active Question Screen */
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                {/* Progress Indicators */}
                <div className="flex items-center justify-between text-[10px] text-text-muted font-bold tracking-wider uppercase mb-3 select-none">
                  <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}% Complete
                  </span>
                </div>

                <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden mb-6 border border-border-custom/40">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>

                {/* Sub-category Pill badge */}
                <div className="mb-4">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200/50 dark:border-indigo-900/40 px-2.5 py-1 rounded-lg">
                    🧠 {quiz.questions[currentQuestionIndex].category || "Conceptual Comprehension"}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-sm font-bold text-text-primary leading-relaxed tracking-tight mb-6">
                  {quiz.questions[currentQuestionIndex].question}
                </h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {quiz.questions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === idx;
                    const letters = ["A", "B", "C", "D"];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`flex items-center gap-4 p-4 rounded-xl text-left text-xs transition-all duration-200 cursor-pointer select-none ${
                          isSelected
                            ? "bg-indigo-50/40 hover:bg-indigo-50/60 border-indigo-500 text-text-primary font-semibold ring-1 ring-indigo-500/20 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30"
                            : "bg-bg-surface hover:bg-bg-secondary/40 border-border-custom hover:border-border-custom/80 text-text-secondary"
                        } border`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 transition-colors duration-200 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-bg-secondary text-text-muted border border-border-custom"
                          }`}
                        >
                          {letters[idx]}
                        </div>
                        <span className="flex-1 leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Action Footer */}
              <div className="flex items-center justify-between border-t border-border-custom mt-8 pt-4 shrink-0 select-none">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-text-secondary hover:bg-bg-secondary/60 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-bg-surface hover:bg-bg-secondary border border-border-custom text-text-primary transition active:scale-95 cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span>Submit Quiz</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed / Grading Results Page */
            <div className="flex-1 flex flex-col gap-6">
              {/* Grand score badge block */}
              <div className="bg-bg-surface border border-border-custom rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                {/* Visual Circle Gauge */}
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="var(--color-bg-secondary, #f1f5f9)"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke={scoreResults.percentage >= 70 ? "#10b981" : "#f59e0b"}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - scoreResults.percentage / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-text-primary leading-none">
                      {scoreResults.percentage}%
                    </span>
                    <span className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">
                      {scoreResults.score} / {scoreResults.total} Correct
                    </span>
                  </div>
                </div>

                {/* Score commentary & evaluation text */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-base font-extrabold text-text-primary">
                    {scoreMessage.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed font-medium mt-1">
                    {scoreMessage.comment}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2.5 justify-center md:justify-start">
                    <button
                      onClick={() => {
                        setUserAnswers({});
                        setCurrentQuestionIndex(0);
                        setQuizSubmitted(false);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Retake Challenge
                    </button>
                    <button
                      onClick={() => loadQuiz(true)}
                      className="px-3.5 py-1.5 bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary font-semibold text-xs rounded-xl border border-border-custom transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>New Questions</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Categories split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strong Areas Card */}
                <div className="bg-bg-surface border border-border-custom rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Strong Learning Areas</span>
                  </div>
                  {performanceBreakdown.strongAreas.length > 0 ? (
                    <ul className="text-[10px] text-text-muted space-y-2 leading-relaxed font-semibold">
                      {performanceBreakdown.strongAreas.map((area, index) => (
                        <li key={index} className="flex items-center gap-2 bg-emerald-500/5 dark:bg-emerald-500/10 p-2 border border-emerald-500/10 dark:border-emerald-500/20 rounded-lg">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-text-muted font-medium italic">
                      No categories graded above 70% accuracy yet. Retake to secure masteries!
                    </p>
                  )}
                </div>

                {/* Needs Review Card */}
                <div className="bg-bg-surface border border-border-custom rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Flame className="h-4 w-4 shrink-0" />
                    <span>Needs Focus Review</span>
                  </div>
                  {performanceBreakdown.needsReview.length > 0 ? (
                    <ul className="text-[10px] text-text-muted space-y-2 leading-relaxed font-semibold">
                      {performanceBreakdown.needsReview.map((area, index) => (
                        <li key={index} className="flex items-center gap-2 bg-amber-500/5 dark:bg-amber-500/10 p-2 border border-amber-500/10 dark:border-amber-500/20 rounded-lg">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 border border-emerald-500/20 rounded-lg">
                      Perfect! No weak category areas detected. Absolute comprehensive knowledge.
                    </p>
                  )}
                </div>
              </div>

              {/* Answer Key & Explanation review section */}
              <div className="border-t border-border-custom pt-5">
                <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider mb-4">
                  Granular Explanation Review
                </h3>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-custom">
                  {quiz.questions.map((q, idx) => {
                    const isCorrect = userAnswers[idx] === q.correctAnswer;
                    const letters = ["A", "B", "C", "D"];
                    return (
                      <div
                        key={idx}
                        className="bg-bg-surface border border-border-custom rounded-xl p-4 flex flex-col gap-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 border border-indigo-200/50 dark:border-indigo-900/40 rounded">
                              Q{idx + 1}
                            </span>
                            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest bg-bg-secondary px-2 py-0.5 border border-border-custom rounded">
                              {q.category}
                            </span>
                          </div>

                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 px-2 py-0.5 rounded-lg select-none">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 px-2 py-0.5 rounded-lg select-none">
                              <XCircle className="h-3.5 w-3.5 text-rose-500" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-text-primary leading-normal">
                          {q.question}
                        </h4>

                        {/* Options indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                          {q.options.map((option, optIdx) => {
                            const isChosen = userAnswers[idx] === optIdx;
                            const isAnswerKey = q.correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border text-[10.5px] leading-relaxed flex items-start gap-2.5 font-medium ${
                                  isAnswerKey
                                    ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                                    : isChosen
                                    ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300 font-semibold"
                                    : "bg-bg-app border-border-custom/50 text-text-muted"
                                }`}
                              >
                                <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                  isAnswerKey
                                    ? "bg-emerald-500 text-white animate-pulse"
                                    : isChosen
                                    ? "bg-rose-500 text-white"
                                    : "bg-bg-secondary text-text-muted border border-border-custom"
                                }`}>
                                  {letters[optIdx]}
                                </span>
                                <span className="flex-1">{option}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        <div className="mt-2 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-200/20 dark:border-indigo-900/20 p-3 rounded-lg flex items-start gap-2.5">
                          <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                              AI Core Reasoning:
                            </span>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-1 font-medium">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}