import { ShieldCheck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-teal-50">
        <Wallet className="h-6 w-6 text-primary" />
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-950">
          Resident-friendly flow
        </h3>
        <p className="mt-2 text-base text-muted">
          Pay by bank transfer or QR, upload your receipt, and track approval status by month.
        </p>
      </Card>
      <Card className="bg-amber-50">
        <ShieldCheck className="h-6 w-6 text-amber-800" />
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-950">
          Committee control
        </h3>
        <p className="mt-2 text-base text-muted">
          Review every uploaded receipt, approve or reject it, and record cash payments manually.
        </p>
      </Card>
    </div>
  );
}
