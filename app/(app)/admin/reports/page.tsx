import { AdminPageHeader } from "@/components/admin-page-header";
import { MonthFilter } from "@/components/month-filter";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { PrintPageButton } from "@/components/print-page-button";
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
  const collectionRate =
    totals.totalResidents > 0
      ? Math.round((totals.paidCount / totals.totalResidents) * 100)
      : 0;

  return (
    <div className="space-y-6 print:space-y-4">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
          Desa Tanjung
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">
          Monthly Collection Report
        </h1>
        <p className="mt-2 text-lg text-slate-700">{currentMonthLabel}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Expected</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.expectedCollection.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Collected</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.collectedAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              RM {totals.outstandingAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Due date</p>
            <p className="mt-1 text-xl font-bold text-slate-950">{dueDateLabel}</p>
          </div>
        </div>
      </section>

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Community</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.community_name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Bank account</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{settings.bank_name}</p>
            <p className="text-sm text-slate-700">{settings.bank_account_number}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Meeting use</p>
            <p className="mt-1 text-lg font-bold text-slate-950">Committee review copy</p>
          </div>
        </div>
      </section>

      <AdminPageHeader
        eyebrow="Reports"
        title={`Monthly report for ${currentMonthLabel}`}
        description="Review collection progress, overdue houses, and expected versus collected amount in one page."
        actions={
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end lg:ml-auto">
            <MonthFilter currentMonth={currentMonth} />
            <PrintPageButton className="min-h-14" />
          </div>
        }
      />

      <section className="grid gap-4 print:grid-cols-5 md:grid-cols-2 xl:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))]">
        <Card className="border-slate-200 bg-slate-50 xl:min-h-64">
          <p className="text-base font-bold text-slate-700">Collection rate</p>
          <p className="mt-2 font-display text-5xl font-bold text-slate-950">{collectionRate}%</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-200"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
          <p className="mt-3 text-base text-slate-600">Share of houses settled for the selected month.</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 xl:min-h-64">
          <p className="text-base font-bold text-emerald-800">Residents settled</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-950">{totals.paidCount}</p>
          <p className="mt-2 text-base text-emerald-900">Out of {totals.totalResidents} total houses</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50 xl:min-h-64">
          <p className="text-base font-bold text-amber-800">Awaiting review</p>
          <p className="mt-2 font-display text-4xl font-bold text-amber-950">{totals.pendingCount}</p>
          <p className="mt-2 text-base text-amber-900">Receipts uploaded but not reviewed yet</p>
        </Card>
        <Card className="border-rose-200 bg-rose-50 xl:min-h-64">
          <p className="text-base font-bold text-rose-800">Need follow-up</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">{totals.unsettledCount}</p>
          <p className="mt-2 text-base text-rose-900">Unpaid, overdue, or rejected houses</p>
        </Card>
        <Card className="border-sky-200 bg-sky-50 xl:min-h-64">
          <p className="text-base font-bold text-sky-800">Meeting summary</p>
          <p className="mt-2 text-2xl font-bold text-sky-950">
            {totals.paidCount} paid / {totals.unsettledCount} unsettled
          </p>
          <p className="mt-2 text-base text-sky-900">Use this page for monthly committee review.</p>
        </Card>
      </section>

      <Card className="print:border-slate-300 print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Committee summary
            </p>
            <h3 className="mt-2 text-3xl font-bold text-slate-950">
              Collection progress for {currentMonthLabel}
            </h3>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              {totals.paidCount} houses have settled payment, while {totals.unsettledCount} still need follow-up before closing this month.
            </p>
          </div>
          <div className="min-w-56 rounded-3xl bg-slate-50 px-5 py-4">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
              Overall progress
            </p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{collectionRate}%</p>
          </div>
        </div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="min-h-52 border-sky-200 bg-sky-50">
          <p className="text-base font-bold text-sky-800">Expected collection</p>
          <p className="mt-2 font-display text-4xl font-bold text-sky-950">
            RM {totals.expectedCollection.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-sky-900">
            RM {(settings.monthly_fee ?? 0).toFixed(2)} x {totals.totalResidents} residents
          </p>
        </Card>
        <Card className="min-h-52 border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">Collected</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-950">
            RM {totals.collectedAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-emerald-900">{totals.paidCount} houses paid</p>
        </Card>
        <Card className="min-h-52 border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Outstanding</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">
            RM {totals.outstandingAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-base text-rose-900">
            {totals.unsettledCount} houses to follow up
          </p>
        </Card>
        <Card className="min-h-52 border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Due date</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-950">{dueDateLabel}</p>
          <p className="mt-2 text-base text-amber-900">{totals.pendingCount} receipts still pending</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="min-h-44 border-emerald-200 bg-emerald-50">
          <p className="text-base font-bold text-emerald-800">Paid</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.paidCount}</p>
          <p className="mt-2 text-sm text-emerald-900">Fully settled for this month.</p>
        </Card>
        <Card className="min-h-44 border-amber-200 bg-amber-50">
          <p className="text-base font-bold text-amber-800">Pending</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.pendingCount}</p>
          <p className="mt-2 text-sm text-amber-900">Receipt uploaded and waiting review.</p>
        </Card>
        <Card className="min-h-44 border-slate-200 bg-slate-50">
          <p className="text-base font-bold text-slate-700">Unpaid</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">{totals.unpaidCount}</p>
          <p className="mt-2 text-sm text-slate-600">No payment record submitted yet.</p>
        </Card>
        <Card className="min-h-44 border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Overdue</p>
          <p className="mt-2 font-display text-4xl font-bold text-rose-950">{totals.overdueCount}</p>
          <p className="mt-2 text-sm text-rose-900">Past due date and still unpaid</p>
        </Card>
        <Card className="min-h-44 border-rose-200 bg-rose-50">
          <p className="text-base font-bold text-rose-800">Rejected</p>
          <p className="mt-2 font-display text-4xl font-bold text-slate-950">
            {totals.rejectedCount}
          </p>
          <p className="mt-2 text-sm text-rose-900">Need a clearer re-upload from the resident.</p>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-4">
          <h3 className="text-2xl font-bold text-slate-950">Resident breakdown</h3>
          <p className="mt-1 text-base font-medium text-muted">
            Use this summary during committee meetings or monthly review.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
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

      <section className="hidden rounded-3xl border border-slate-300 bg-white p-6 print:block">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
              Prepared by
            </p>
            <div className="mt-10 border-t border-slate-300 pt-3 text-base text-slate-700">
              Committee / Treasurer Signature
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
              Generated at
            </p>
            <div className="mt-4 text-base font-semibold text-slate-950">
              {formatTimestamp(new Date().toISOString())}
            </div>
            <div className="mt-6 border-t border-slate-300 pt-3 text-base text-slate-700">
              Meeting review notes
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
