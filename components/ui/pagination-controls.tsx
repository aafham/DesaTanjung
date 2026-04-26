"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = getVisiblePageItems(currentPage, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-4"
      aria-label="Pagination"
    >
      <p className="text-sm font-bold text-muted">
        Page <span className="text-slate-950">{currentPage}</span> of{" "}
        <span className="text-slate-950">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="min-h-11 px-4"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>

        {pageItems.map((pageItem) =>
          typeof pageItem === "number" ? (
            <Button
              key={pageItem}
              variant={currentPage === pageItem ? "primary" : "secondary"}
              onClick={() => onPageChange(pageItem)}
              className="min-h-11 min-w-11 px-4"
              aria-label={`Page ${pageItem}`}
              aria-current={currentPage === pageItem ? "page" : undefined}
            >
              {pageItem}
            </Button>
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

        <Button
          variant="secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="min-h-11 px-4"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </nav>
  );
}
