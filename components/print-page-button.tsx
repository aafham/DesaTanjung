"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function PrintPageButton({
  className,
  locale = "en",
}: {
  className?: string;
  locale?: Locale;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 print:hidden ${className ?? ""}`}
      onClick={() => window.print()}
    >
      <Printer className="mr-2 h-4 w-4" />
      {locale === "ms" ? "Cetak laporan" : "Print report"}
    </Button>
  );
}
