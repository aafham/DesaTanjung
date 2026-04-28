import { AlertTriangle } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const warningCopy = {
  ms: {
    title: "Sebahagian data live tidak dapat dimuat sepenuhnya.",
    help: "Sila cuba refresh halaman. Jika mesej ini kekal, hubungi jawatankuasa atau semak semula kemudian.",
  },
  en: {
    title: "Some live data could not be loaded fully.",
    help: "Please refresh the page. If this stays visible, contact the committee or check again later.",
  },
} as const;

export function DataWarning({
  warnings,
  locale = "en",
}: {
  warnings: string[];
  locale?: Locale;
}) {
  if (warnings.length === 0) {
    return null;
  }

  const copy = warningCopy[locale];

  return (
    <div
      className="rounded-4xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 shadow-soft"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-base font-bold">{copy.title}</p>
          <p className="mt-1 text-sm font-semibold text-amber-900">{copy.help}</p>
          <div className="mt-2 space-y-1 text-sm">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
