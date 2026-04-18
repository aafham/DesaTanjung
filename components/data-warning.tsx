import { AlertTriangle } from "lucide-react";

export function DataWarning({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-4xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 shadow-soft">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-base font-bold">Some live data could not be loaded fully.</p>
          <div className="mt-2 space-y-1 text-sm">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
