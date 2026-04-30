import Link from "next/link";
import { ArrowRight, Clock3, FolderCheck, TriangleAlert } from "lucide-react";
import { AdminApprovalCard } from "@/components/admin-approval-card";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { LiveRefresh } from "@/components/live-refresh";
import { MonthFilter } from "@/components/month-filter";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/admin-dashboard-data";

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, pendingPayments, warnings } = await getAdminDashboardData(
    params.month,
  );
  const pendingCount = pendingPayments.filter((payment) => payment.status === "pending").length;
  const rejectedCount = pendingPayments.filter((payment) => payment.status === "rejected").length;

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <LiveRefresh />
      <DataWarning warnings={warnings} />
      <AdminPageHeader
        eyebrow="Approval system"
        title={`Review submissions for ${currentMonthLabel}`}
        description="Open each receipt, confirm the transfer proof is clear, then approve or reject with a short reason."
        actions={
          <div className="max-w-sm lg:ml-auto">
            <MonthFilter currentMonth={currentMonth} />
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_0.95fr_1.1fr] xl:items-start">
        <Card className="min-h-48 border-amber-200 bg-amber-50">
          <Clock3 className="h-5 w-5 text-amber-700" />
          <p className="mt-4 text-base font-bold text-amber-800">Pending proof</p>
          <p className="mt-2 font-display text-4xl font-bold text-amber-950">{pendingCount}</p>
          <p className="mt-2 text-sm text-amber-900">Receipts uploaded and waiting for review.</p>
          <p className="mt-4 text-sm leading-7 text-amber-900">
            Clear this queue first so valid uploads do not stay waiting for too long.
          </p>
        </Card>
        <Card className="min-h-48 border-rose-200 bg-rose-50">
          <TriangleAlert className="h-5 w-5 text-rose-700" />
          <p className="mt-4 text-base font-bold text-rose-800">Rejected follow-up</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">{rejectedCount}</p>
          <p className="mt-2 text-sm text-rose-900">Residents who need to upload a clearer proof.</p>
          <p className="mt-4 text-sm leading-7 text-rose-900">
            Use this count to track residents who still need a fresh re-upload.
          </p>
        </Card>
        <Card
          className="min-h-48 border-slate-900 text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #10263a 45%, #134e4a 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">Review flow</p>
          <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
            Keep committee review clear and fast
          </h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-100">
            <p className="font-semibold">1. Open the uploaded receipt and confirm it is readable.</p>
            <p className="font-semibold">2. Match the transfer proof with the correct resident and month.</p>
            <p className="font-semibold">3. Approve if valid, or reject with a short reason for re-upload.</p>
          </div>
        </Card>
      </section>

      {pendingPayments.length === 0 ? (
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <Card className="border-dashed border-slate-300 bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <FolderCheck className="h-8 w-8 text-emerald-700" />
              </div>
              <p className="mt-5 text-3xl font-bold text-slate-950">
                No uploaded receipts are waiting for review this month.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Once a resident uploads proof, the approval and reject actions will appear inside the
                receipt card automatically. Until then, the queue stays clear for this month.
              </p>
              <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                Queue status: clear for {currentMonthLabel}
              </div>
            </div>
          </Card>

          <Card className="bg-white">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Useful next steps</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              No approvals right now, but you can keep admin work moving
            </h3>
            <div className="mt-5 space-y-3">
              <Link
                href={`/admin/residents?month=${currentMonth}`}
                className="flex items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div>
                  <p className="text-base font-bold text-slate-950">Review unsettled residents</p>
                  <p className="mt-1 text-sm text-rose-900">
                    Follow up with unpaid, overdue, or rejected houses.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-rose-900" />
              </Link>
              <Link
                href="/admin/health"
                className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div>
                  <p className="text-base font-bold text-slate-950">Check portal health</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Confirm QR, storage, and follow-up data are ready.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-700" />
              </Link>
              <Link
                href={`/admin/reports?month=${currentMonth}`}
                className="flex items-center justify-between gap-3 rounded-3xl border border-teal-200 bg-teal-50 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div>
                  <p className="text-base font-bold text-slate-950">Open monthly report</p>
                  <p className="mt-1 text-sm text-teal-900">
                    Review collection progress while the queue is clear.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-teal-900" />
              </Link>
            </div>
          </Card>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {pendingPayments.map((payment) => <AdminApprovalCard key={payment.id} payment={payment} />)}
        </section>
      )}
    </div>
  );
}
