import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/types";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

function getVisiblePageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageWindow = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 3) {
    pageWindow.add(2);
    pageWindow.add(3);
    pageWindow.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pageWindow.add(totalPages - 3);
    pageWindow.add(totalPages - 2);
    pageWindow.add(totalPages - 1);
  }

  const pages = Array.from(pageWindow)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return pages.reduce<PageItem[]>((items, page, index) => {
    const previousPage = pages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(page - previousPage === 2 ? previousPage + 1 : index === 1 ? "start-ellipsis" : "end-ellipsis");
    }

    items.push(page);
    return items;
  }, []);
}

export function ServerPaginationControls({
  pagination,
  getHref,
}: {
  pagination: PaginationMeta;
  getHref: (page: number) => string;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const pageItems = getVisiblePageItems(pagination.currentPage, pagination.totalPages);
  const pageLinkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 py-3 text-base font-bold transition";

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-4"
      aria-label="Pagination"
    >
      <p className="text-sm font-bold text-muted">
        Halaman <span className="text-slate-950">{pagination.currentPage}</span> daripada{" "}
        <span className="text-slate-950">{pagination.totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {pagination.currentPage > 1 ? (
          <Link
            href={getHref(pagination.currentPage - 1)}
            className={`${pageLinkClass} bg-slate-100 text-slate-950 hover:bg-slate-200`}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Sebelumnya</span>
          </Link>
        ) : (
          <span
            className={`${pageLinkClass} cursor-not-allowed bg-slate-50 text-slate-400`}
            aria-hidden="true"
          >
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        {pageItems.map((pageItem) =>
          typeof pageItem === "number" ? (
            <Link
              key={pageItem}
              href={getHref(pageItem)}
              aria-current={pagination.currentPage === pageItem ? "page" : undefined}
              className={
                pagination.currentPage === pageItem
                  ? `${pageLinkClass} bg-primary text-primary-foreground`
                  : `${pageLinkClass} bg-slate-100 text-slate-950 hover:bg-slate-200`
              }
            >
              {pageItem}
            </Link>
          ) : (
            <span
              key={pageItem}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-50 px-3 text-sm font-bold text-muted"
              aria-hidden="true"
            >
              ...
            </span>
          ),
        )}

        {pagination.currentPage < pagination.totalPages ? (
          <Link
            href={getHref(pagination.currentPage + 1)}
            className={`${pageLinkClass} bg-slate-100 text-slate-950 hover:bg-slate-200`}
            aria-label="Halaman seterusnya"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Seterusnya</span>
          </Link>
        ) : (
          <span
            className={`${pageLinkClass} cursor-not-allowed bg-slate-50 text-slate-400`}
            aria-hidden="true"
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
