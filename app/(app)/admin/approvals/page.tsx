import { AdminApprovalCard } from "@/components/admin-approval-card";
import { LiveRefresh } from "@/components/live-refresh";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, pendingPayments } = await getAdminDashboardData(
    params.month,
  );
  const pendingCount = pendingPayments.filter((payment) => payment.status === "pending").length;
  const rejectedCount = pendingPayments.filter((payment) => payment.status === "rejected").length;

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Approval system</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Review submissions for {currentMonthLabel}
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-amber-50">
          <p className="text-sm text-amber-700">Pending proof</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-950">{pendingCount}</p>
        </Card>
        <Card className="bg-rose-50">
          <p className="text-sm text-rose-700">Rejected follow-up</p>
          <p className="mt-2 font-display text-3xl font-bold text-rose-950">{rejectedCount}</p>
        </Card>
        <Card className="bg-slate-950 text-white">
          <p className="text-sm text-slate-300">Review tip</p>
          <p className="mt-2 text-sm font-semibold">
            Tap each receipt, then approve or reject with confirmation.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {pendingPayments.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-muted">
            No uploads are waiting for review for this month.
          </div>
        ) : (
          pendingPayments.map((payment) => <AdminApprovalCard key={payment.id} payment={payment} />)
        )}
      </section>
    </div>
  );
}
