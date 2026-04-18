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

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Pending proof</p>
          <p className="mt-2 font-display text-4xl font-bold text-amber-950">{pendingCount}</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Rejected follow-up</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">{rejectedCount}</p>
        </Card>
        <Card
          className="text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #1f3650 45%, #0f766e 100%)",
          }}
        >
          <p className="text-base font-bold text-slate-200">Review tip</p>
          <p className="mt-2 text-base font-bold leading-relaxed">
            Open each receipt, check image clearly, then approve or reject proof.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {pendingPayments.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-line bg-slate-50 px-6 py-10 text-center text-base leading-8 text-slate-600">
            No uploaded receipts are waiting for review this month. The reject button will appear
            inside a receipt card after a resident uploads payment proof.
          </div>
        ) : (
          pendingPayments.map((payment) => <AdminApprovalCard key={payment.id} payment={payment} />)
        )}
      </section>
    </div>
  );
}
