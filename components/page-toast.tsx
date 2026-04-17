"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function PageToast({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  const content = error ?? message;
  const [visible, setVisible] = useState(Boolean(content));

  useEffect(() => {
    setVisible(Boolean(content));

    if (!content) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(false), 3500);
    return () => window.clearTimeout(timer);
  }, [content]);

  if (!content || !visible) {
    return null;
  }

  const isError = Boolean(error);

  return (
    <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-3xl border px-4 py-4 shadow-soft ${
          isError
            ? "border-rose-200 bg-rose-50 text-rose-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}
      >
        <div className="mt-0.5">
          {isError ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-[0.12em]">
            {isError ? "Action needed" : "Success"}
          </p>
          <p className="mt-1 text-base">{decodeURIComponent(content)}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
