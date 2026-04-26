"use client";

import { setLocaleAction } from "@/lib/actions";
import type { Locale } from "@/lib/i18n";

const labels: Record<Locale, { title: string; bm: string; en: string }> = {
  ms: {
    title: "Bahasa",
    bm: "BM",
    en: "English",
  },
  en: {
    title: "Language",
    bm: "BM",
    en: "English",
  },
};

export function LanguageToggle({ locale }: { locale: Locale }) {
  const copy = labels[locale];

  return (
    <div className="mt-4 rounded-3xl border border-slate-100 bg-white/90 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{copy.title}</p>
      <form action={setLocaleAction} className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="submit"
          name="locale"
          value="ms"
          aria-pressed={locale === "ms"}
          className={`min-h-10 rounded-full px-3 py-2 text-sm font-bold transition ${
            locale === "ms"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {copy.bm}
        </button>
        <button
          type="submit"
          name="locale"
          value="en"
          aria-pressed={locale === "en"}
          className={`min-h-10 rounded-full px-3 py-2 text-sm font-bold transition ${
            locale === "en"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {copy.en}
        </button>
      </form>
    </div>
  );
}
