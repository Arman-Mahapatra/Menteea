import React, { useState, useEffect } from "react";
import { Key, CheckCircle, AlertCircle, X, Shield, Eye, EyeOff, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  
  // Track if the currently input key has been successfully validated
  const [isValidated, setIsValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  // Reset the state when modal is opened/closed or currentKey changes
  useEffect(() => {
    if (isOpen) {
      setKey(currentKey);
      setShowConfirmRemove(false);
      setIsValidated(false);
      setValidationResult({ status: "idle", message: "" });
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  // Handle key input changes
  const handleKeyChange = (newVal: string) => {
    setKey(newVal);
    setIsValidated(false);
    setValidationResult({ status: "idle", message: "" });
  };

  const handleValidate = async () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setValidationResult({
        status: "error",
        message: "API Key cannot be empty.",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: "idle", message: "" });

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: trimmedKey }),
      });
      const data = await res.json();

      if (res.ok) {
        setValidationResult({
          status: "success",
          message: "✓ Valid Gemini API Key",
        });
        setIsValidated(true);
      } else {
        setValidationResult({
          status: "error",
          message: data.error || "Invalid API Key. Please verify your Gemini key and try again.",
        });
        setIsValidated(false);
      }
    } catch (err) {
      setValidationResult({
        status: "error",
        message: "Unable to connect to validation server. Please try again.",
      });
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    onSaveKey(key.trim());
    onClose();
  };

  const handleRemoveKey = () => {
    onSaveKey("");
    setKey("");
    setIsValidated(false);
    setValidationResult({ status: "idle", message: "" });
    setShowConfirmRemove(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-custom bg-bg-surface text-text-primary shadow-2xl transition-all duration-300">
        
        {/* Modal Headings / Header */}
        <div className="flex items-center justify-between border-b border-border-custom px-6 py-4 bg-bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Key className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-text-primary">
              Connect Your Gemini API Key
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary transition duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Dynamic Inner Views (Remove Key Confirmation or Main Form) */}
        <AnimatePresence mode="wait">
          {showConfirmRemove ? (
            <motion.div
              key="confirm-remove"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2 rounded-full bg-rose-500/10">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                </div>
                <h3 className="font-bold text-sm tracking-tight">Remove API Key?</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                This will disconnect Gemini and disable AI features until a new key is connected. All your personal documents and mind maps will remain intact, but active AI capabilities will be offline.
              </p>
              
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-custom/50">
                <button
                  type="button"
                  onClick={() => setShowConfirmRemove(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-secondary border border-border-custom transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Key
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4"
            >
              {/* Trust Messaging Banner */}
              <div className="flex gap-3 bg-bg-secondary/60 p-3.5 rounded-xl text-xs text-text-secondary border border-border-custom/40">
                <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary text-[11px]">Your privacy is guaranteed</p>
                  <p className="leading-relaxed text-[10.5px]">
                    Your Gemini API key remains on your device and is never shared publicly. It is stored locally in your browser and used only to process AI requests for your workspace.
                  </p>
                </div>
              </div>

              {/* Input Form Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text-secondary">
                    Gemini API Key
                  </label>
                  {currentKey && key === currentKey && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Currently Active
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="Enter your Gemini API key (AIzaSy...)"
                    className="w-full rounded-xl border border-border-custom bg-bg-secondary/40 py-2.5 pl-10 pr-10 text-xs font-mono tracking-wide outline-none transition focus:border-indigo-500 focus:bg-bg-surface focus:ring-1 focus:ring-indigo-500/20 text-text-primary"
                  />
                  <div className="absolute left-3.5 top-3 text-text-muted">
                    <Key className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-3 text-text-muted hover:text-text-primary transition duration-150 cursor-pointer"
                    title={showKey ? "Hide API key" : "Show API key"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Assistance Section */}
              <div className="flex items-center justify-between text-xs pt-1 border-b border-border-custom/30 pb-3">
                <span className="text-text-muted font-medium">Don't have a Gemini API key?</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Get one from Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Diagnostics Section (Task 5) */}
              {key.trim() && (
                <div className="bg-bg-secondary/40 border border-border-custom/40 rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="font-bold text-[11px] text-text-secondary tracking-wide uppercase">AI Diagnostics</p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                    <div className="text-text-muted">Provider:</div>
                    <div className="font-semibold text-text-primary text-right">
                      Gemini
                    </div>

                    <div className="text-text-muted">Model:</div>
                    <div className="font-mono text-[10px] text-text-primary text-right">
                      gemini-3.5-flash
                    </div>

                    <div className="text-text-muted">Status:</div>
                    <div className="font-semibold text-right flex items-center justify-end gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${validationResult.status === "error" ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}></span>
                      <span className={validationResult.status === "error" ? "text-rose-500" : "text-emerald-500"}>
                        {validationResult.status === "error" ? "Offline" : "Online"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Status Block (Task 6) */}
              <AnimatePresence mode="wait">
                {validationResult.status !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`flex flex-col gap-2 rounded-xl border p-3.5 text-xs leading-relaxed ${
                      validationResult.status === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {validationResult.status === "success" ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      )}
                      <span className="font-bold text-sm">
                        {validationResult.status === "success" ? "✓ Gemini API Key Verified" : "Validation Failed"}
                      </span>
                    </div>
                    {validationResult.status === "success" ? (
                      <div className="space-y-1.5 pl-6.5 text-[11px] text-text-secondary">
                        <div className="flex justify-between border-b border-border-custom/10 pb-1">
                          <span>Provider:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gemini</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Model Access:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Confirmed</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] pl-6.5 text-text-secondary">{validationResult.message}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {currentKey && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmRemove(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Key
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-secondary transition border border-transparent hover:border-border-custom cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* Dynamic Button Flow: Validate -> Save */}
                  {!isValidated && key.trim() !== currentKey ? (
                    <button
                      type="button"
                      onClick={handleValidate}
                      disabled={isValidating || !key.trim()}
                      className="flex items-center gap-1.5 justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition duration-200 disabled:opacity-40 cursor-pointer min-w-[110px]"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Key"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={key.trim() === "" && currentKey === ""}
                      className="flex items-center justify-center rounded-xl bg-neutral-900 dark:bg-slate-100 dark:text-neutral-900 text-white px-4 py-2 text-xs font-bold shadow-sm hover:opacity-90 transition duration-200 cursor-pointer min-w-[110px]"
                    >
                      Save Key
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}