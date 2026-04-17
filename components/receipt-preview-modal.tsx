"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand, X } from "lucide-react";

export function ReceiptPreviewModal({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-slate-950"
      >
        <Expand className="h-4 w-4" />
        View larger
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-4xl bg-white shadow-soft">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-950 px-3 py-2 text-sm font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Close
              </span>
            </button>
            <div className="max-h-[85vh] overflow-auto p-3 sm:p-4">
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
