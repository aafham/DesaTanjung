import { AdminApprovalCard } from "@/components/admin-approval-card";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { LiveRefresh } from "@/components/live-refresh";
import { MonthFilter } from "@/components/month-filter";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/data";

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

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
        <Card className="min-h-48 border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Pending proof</p>
          <p className="mt-2 font-display text-4xl font-bold text-amber-950">{pendingCount}</p>
          <p className="mt-2 text-sm text-amber-900">Receipts uploaded and waiting for review.</p>
        </Card>
        <Card className="min-h-48 border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Rejected follow-up</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">{rejectedCount}</p>
          <p className="mt-2 text-sm text-rose-900">Residents who need to upload a clearer proof.</p>
        </Card>
        <Card className="min-h-48 border-teal-200 bg-teal-50">
          <p className="text-base font-bold text-teal-800">Review tip</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-teal-950">
            <p className="font-semibold">1. Open the uploaded receipt and confirm it is readable.</p>
            <p className="font-semibold">2. Match the transfer proof with the correct resident and month.</p>
            <p className="font-semibold">3. Approve if valid, or reject with a short reason for re-upload.</p>
          </div>
        </Card>
      </section>

      {pendingPayments.length === 0 ? (
        <Card className="border-dashed bg-slate-50 px-6 py-10 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="text-lg font-bold text-slate-950">
              No uploaded receipts are waiting for review this month.
            </p>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Once a resident uploads proof, the approval and reject actions will appear inside the
              receipt card automatically. Until then, the queue stays clear for this month.
            </p>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {pendingPayments.map((payment) => <AdminApprovalCard key={payment.id} payment={payment} />)}
        </section>
      )}
    </div>
  );
}
