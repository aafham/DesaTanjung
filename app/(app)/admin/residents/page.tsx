import { AdminResidentsTable } from "@/components/admin-residents-table";
import { MonthFilter } from "@/components/month-filter";
import { getAdminDashboardData } from "@/lib/data";

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

      <AdminResidentsTable
        residents={residents}
        currentMonth={currentMonth}
        currentMonthLabel={currentMonthLabel}
      />
    </div>
  );
}
