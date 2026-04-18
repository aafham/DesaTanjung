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
  const actionItems = checks.filter((check) => check.status !== "healthy");

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

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          className="text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #10263a 45%, #134e4a 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">
            Health summary
          </p>
          <h3 className="mt-3 text-3xl font-bold leading-tight text-white">
            {errorCount > 0
              ? `${errorCount} critical issue${errorCount > 1 ? "s" : ""} need attention`
              : warningCount > 0
                ? `${warningCount} follow-up item${warningCount > 1 ? "s" : ""} before residents use the portal`
                : "Portal setup looks healthy for day-to-day use"}
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-100">
            Use this page before monthly collection opens, after Supabase changes, and whenever admin or resident data does not appear as expected.
          </p>
        </Card>

        <Card className="bg-slate-50">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Recommended next steps</p>
          <div className="mt-4 space-y-3">
            {actionItems.length === 0 ? (
              <div className="rounded-3xl bg-white px-4 py-4 text-base text-slate-700">
                No urgent action is needed now. You can continue using the portal normally.
              </div>
            ) : (
              actionItems.slice(0, 4).map((check, index) => (
                <div key={check.id} className="rounded-3xl bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950">{check.label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{check.action ?? check.detail}</p>
                </div>
              ))
            )}
          </div>
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

      <Card>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quick admin checklist</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">Before collection opens</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Confirm monthly fee, QR image, and due date are already set in Settings.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">When data looks missing</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Recheck Supabase schema, storage buckets, and duplicate payment risks first.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">For resident follow-up</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Complete phone numbers in Admin Users so Call and WhatsApp actions work properly.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-slate-950">After major updates</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Revisit this page once to confirm the portal is ready before residents log in.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
