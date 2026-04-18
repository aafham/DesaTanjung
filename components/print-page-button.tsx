"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintPageButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 print:hidden ${className ?? ""}`}
      onClick={() => window.print()}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print report
    </Button>
  );
}
