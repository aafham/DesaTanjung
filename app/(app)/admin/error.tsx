"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-10">
      <section
        role="alert"
        className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white px-6 py-7 text-center shadow-soft"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-rose-700">
          Admin panel
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
          We could not load this admin page
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
          Try again first. If it still fails, check the Health page and server action error log before continuing live work.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
          Halaman admin gagal dimuatkan. Cuba sekali lagi atau semak Health jika masalah berulang.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            Error reference: {error.digest}
          </p>
        ) : null}
        <Button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </section>
    </div>
  );
}
