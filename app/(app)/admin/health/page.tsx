import { CircleAlert, CircleCheckBig, TriangleAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { Card } from "@/components/ui/card";
import { getAdminHealthData } from "@/lib/data";

const statusPresentation = {
  healthy: {
    icon: CircleCheckBig,
    card: "border-emerald-200 bg-emerald-50",
    iconColor: "text-emerald-700",
    label: "Healthy",
    labelClass: "bg-emerald-100 text-emerald-900",
  },
  warning: {
    icon: TriangleAlert,
    card: "border-amber-200 bg-amber-50",
    iconColor: "text-amber-700",
    label: "Warning",
    labelClass: "bg-amber-100 text-amber-900",
  },
  error: {
    icon: CircleAlert,
    card: "border-rose-200 bg-rose-50",
    iconColor: "text-rose-700",
    label: "Error",
    labelClass: "bg-rose-100 text-rose-900",
  },
} as const;

export default async function AdminHealthPage() {
  const { checks, warnings } = await getAdminHealthData();
  const healthyCount = checks.filter((check) => check.status === "healthy").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const errorCount = checks.filter((check) => check.status === "error").length;

  return (
    <div className="space-y-6">
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="System health"
        title="Check portal readiness before residents use it"
        description="Use this page to confirm the environment, QR setup, storage buckets, phone number coverage, and duplicate payment risks are all in a healthy state."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-800">
            Healthy checks
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-950">{healthyCount}</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Warnings
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-950">{warningCount}</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-800">
            Errors
          </p>
          <p className="mt-2 text-4xl font-bold text-rose-950">{errorCount}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {checks.map((check) => {
          const presentation = statusPresentation[check.status];
          const Icon = presentation.icon;

          return (
            <Card key={check.id} className={presentation.card}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/80 p-3">
                    <Icon className={`h-5 w-5 ${presentation.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-950">{check.label}</p>
                    <p className="mt-2 text-base leading-7 text-slate-700">{check.detail}</p>
                    {check.action ? (
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Next step: {check.action}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${presentation.labelClass}`}>
                  {presentation.label}
                </span>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
