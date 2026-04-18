import { MonthFilter } from "@/components/month-filter";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminReportData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, dueDateLabel, residents, settings, totals, warnings } =
    await getAdminReportData(params.month);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Reports</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
            Monthly report for {currentMonthLabel}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Review collection progress, overdue houses, and expected versus collected amount in one page.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          className="text-white"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #12324a 100%)",
          }}
        >
          <p className="text-base font-bold text-slate-100">Expected collection</p>
          <p className="mt-2 font-display text-4xl font-bold text-white">
            RM {totals.expectedCollection.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-slate-200">
            RM {(settings.monthly_fee ?? 0).toFixed(2)} x {totals.totalResidents} residents
          </p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">Collected</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-950">
            RM {totals.collectedAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-emerald-900">{totals.paidCount} houses paid</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Outstanding</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">
            RM {totals.outstandingAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-rose-900">
            {totals.unsettledCount} houses to follow up
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Due date</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-950">{dueDateLabel}</p>
          <p className="mt-2 text-base text-amber-900">{totals.pendingCount} receipts still pending</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">Paid</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.paidCount}</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Pending</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.pendingCount}</p>
        </Card>
        <Card className="border-slate-200 bg-slate-50">
          <p className="text-base font-bold text-slate-700">Unpaid</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.unpaidCount}</p>
        </Card>
        <Card
          className="text-white"
          style={{
            background:
              "linear-gradient(135deg, #5f1020 0%, #8b1538 100%)",
          }}
        >
          <p className="text-base font-bold text-rose-100">Overdue</p>
          <p className="mt-2 font-display text-4xl font-bold text-white">{totals.overdueCount}</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Rejected</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">
            {totals.rejectedCount}
          </p>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-4">
          <h3 className="text-2xl font-bold text-slate-950">Resident breakdown</h3>
          <p className="mt-1 text-base text-muted">
            Use this summary during committee meetings or monthly review.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-4">House</th>
                <th className="px-4 py-4">Owner</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-slate-800">
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td className="px-4 py-4 text-lg font-bold text-slate-950">
                    {resident.house_number}
                  </td>
                  <td className="px-4 py-4">{resident.name}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={resident.currentPayment?.display_status ?? "unpaid"} />
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {resident.currentPayment?.payment_method ?? "-"}
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment?.updated_at
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
