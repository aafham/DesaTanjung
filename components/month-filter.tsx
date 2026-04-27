import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { label: string; help: string; apply: string }> = {
  ms: {
    label: "Tapis bulan",
    help: "Pilih bulan laporan atau bulan kerja admin, kemudian tekan guna untuk segarkan data.",
    apply: "Guna",
  },
  en: {
    label: "Filter month",
    help: "Choose a report or admin working month, then apply to refresh the page data.",
    apply: "Apply",
  },
};

export function MonthFilter({
  currentMonth,
  locale = "en",
}: {
  currentMonth: string;
  locale?: Locale;
}) {
  const text = copy[locale];

  return (
    <form className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="month" className="mb-2 block text-base font-bold text-slate-900">
          {text.label}
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={currentMonth}
          aria-describedby="month-filter-help"
          className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-primary"
        />
        <p id="month-filter-help" className="mt-2 text-sm text-muted">
          {text.help}
        </p>
      </div>
      <button
        type="submit"
        aria-label={text.apply}
        className="min-h-14 rounded-full bg-slate-950 px-6 py-3 text-base font-bold text-white transition hover:bg-slate-800"
      >
        {text.apply}
      </button>
    </form>
  );
}
