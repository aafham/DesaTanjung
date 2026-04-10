import { markCashPaymentAction } from "@/lib/actions";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminDashboardData } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, residents } = await getAdminDashboardData(params.month);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Residents</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Payment status for {currentMonthLabel}
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <MonthFilter currentMonth={currentMonth} />
        </div>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-[0.18em] text-muted">
                <th className="px-4 py-3">House</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm text-slate-700">
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td className="px-4 py-4 font-semibold text-slate-900">{resident.house_number}</td>
                  <td className="px-4 py-4">{resident.name}</td>
                  <td className="px-4 py-4">{resident.address}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={resident.currentPayment?.status ?? "unpaid"} />
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                  <td className="px-4 py-4">
                    <form action={markCashPaymentAction}>
                      <input type="hidden" name="resident_id" value={resident.id} />
                      <input type="hidden" name="month" value={currentMonth} />
                      <button
                        type="submit"
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                      >
                        Mark paid (cash)
                      </button>
                    </form>
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
