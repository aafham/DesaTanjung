import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const copy = {
  ms: {
    label: "Pagination ringkas",
    page: "Halaman",
    of: "daripada",
    previous: "Halaman sebelumnya",
    next: "Halaman seterusnya",
    latest: "Terkini",
    last: "Akhir",
  },
  en: {
    label: "Compact pagination",
    page: "Page",
    of: "of",
    previous: "Previous page",
    next: "Next page",
    latest: "Latest",
    last: "Last",
  },
} as const;

export function CompactServerPaginationControls({
  pagination,
  getHref,
  locale = "en",
}: {
  pagination: PaginationMeta;
  getHref: (page: number) => string;
  locale?: Locale;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const text = copy[locale];
  const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition";
  const currentPage = pagination.currentPage;
  const totalPages = pagination.totalPages;

  return (
    <nav
      className="rounded-3xl border border-line bg-white px-4 py-4"
      aria-label={text.label}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">
          {text.page} <span className="text-slate-950">{currentPage}</span> {text.of}{" "}
          <span className="text-slate-950">{totalPages}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={getHref(currentPage - 1)}
              className={`${linkClass} min-w-11 bg-slate-100 text-slate-950 hover:bg-slate-200`}
              aria-label={text.previous}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={`${linkClass} min-w-11 cursor-not-allowed bg-slate-50 text-slate-400`}
              aria-hidden="true"
            >
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}

          {currentPage > 2 ? (
            <Link
              href={getHref(1)}
              className={`${linkClass} bg-slate-100 text-slate-950 hover:bg-slate-200`}
            >
              {text.latest}
            </Link>
          ) : null}

          <span className={`${linkClass} min-w-16 bg-primary text-primary-foreground`}>
            {currentPage}
          </span>

          {currentPage < totalPages - 1 ? (
            <Link
              href={getHref(totalPages)}
              className={`${linkClass} bg-slate-100 text-slate-950 hover:bg-slate-200`}
            >
              {text.last}
            </Link>
          ) : null}

          {currentPage < totalPages ? (
            <Link
              href={getHref(currentPage + 1)}
              className={`${linkClass} min-w-11 bg-slate-100 text-slate-950 hover:bg-slate-200`}
              aria-label={text.next}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={`${linkClass} min-w-11 cursor-not-allowed bg-slate-50 text-slate-400`}
              aria-hidden="true"
            >
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
