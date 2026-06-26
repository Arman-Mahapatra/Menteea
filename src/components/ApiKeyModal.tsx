import React, { useState } from "react";
import { Key, CheckCircle, AlertCircle, X, Shield } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  if (!isOpen) return null;

  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setValidationResult({
        status: "error",
        message: "API Key cannot be empty.",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: "idle", message: "Validating key..." });

    try {
      const res = await fetch("/api/health", {
        method: "GET",
        headers: {
          "x-api-key": key.trim(),
        },
      });
      const data = await res.json();

      if (res.ok) {
        setValidationResult({
          status: "success",
          message: "API Key validated successfully! Activating workspace.",
        });
        setTimeout(() => {
          onSaveKey(key.trim());
          onClose();
        }, 1000);
      } else {
        setValidationResult({
          status: "error",
          message: data.error || "Invalid API key. Please check your credentials.",
        });
      }
    } catch (err) {
      setValidationResult({
        status: "error",
        message: "Unable to connect to validation server.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-neutral-800" />
            <span className="font-semibold text-neutral-900 font-sans tracking-tight">
              Gemini API Key Configuration
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleValidateAndSave} className="p-6">
          <p className="mb-4 text-xs text-neutral-500 leading-relaxed">
            Provide your custom Gemini API key. This key will be stored securely in your browser's
            local storage and sent only to the server-side proxy to execute AI requests.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
                />
                <Shield className="absolute left-3.5 top-3 h-4.5 w-4.5 text-neutral-400" />
              </div>
            </div>

            {/* Validation Message */}
            {validationResult.status !== "idle" && (
              <div
                className={`flex gap-2.5 rounded-xl border p-3 text-xs ${
                  validationResult.status === "success"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                    : "border-rose-100 bg-rose-50 text-rose-800"
                }`}
              >
                {validationResult.status === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}

            {/* Submit & Secondary Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating}
                className="flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {isValidating ? "Validating..." : "Save Key"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
