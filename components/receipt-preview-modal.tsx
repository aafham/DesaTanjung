"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const modalCopy: Record<Locale, { title: string; description: string; close: string }> = {
  ms: {
    title: "Pratonton resit",
    description: "Pratonton resit yang dibesarkan. Tekan Escape untuk tutup dialog ini.",
    close: "Tutup",
  },
  en: {
    title: "Receipt preview",
    description: "Enlarged receipt preview. Press Escape to close this dialog.",
    close: "Close",
  },
};

export function ReceiptPreviewModal({
  src,
  alt,
  triggerLabel = "Lihat lebih besar",
  inline = false,
  locale = "ms",
}: {
  src: string;
  alt: string;
  triggerLabel?: string;
  inline?: boolean;
  locale?: Locale;
}) {
  const copy = modalCopy[locale];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const modalTitleId = useId();
  const modalDescriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? modalTitleId : undefined}
        className={
          inline
            ? "inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            : "absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-slate-950"
        }
      >
        <Expand className="h-4 w-4" />
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescriptionId}
            className="relative w-full max-w-4xl overflow-hidden rounded-4xl bg-white shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="sr-only" id={modalDescriptionId}>
              {copy.description}
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-950 px-3 py-2 text-sm font-bold text-white"
              aria-describedby={modalDescriptionId}
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {copy.close}
              </span>
            </button>
            <div className="max-h-[85vh] overflow-auto p-3 sm:p-4">
              <h2 id={modalTitleId} className="sr-only">{copy.title}</h2>
              <Image
                src={src}
                alt={alt}
                width={1400}
                height={1400}
                className="h-auto w-full rounded-3xl object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
