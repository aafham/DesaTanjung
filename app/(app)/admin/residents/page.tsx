import { AdminResidentsTable } from "@/components/admin-residents-table";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { MonthFilter } from "@/components/month-filter";
import { PageToast } from "@/components/page-toast";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, residents, warnings } = await getAdminDashboardData(params.month);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />
      <AdminPageHeader
        eyebrow="Residents"
        title={`Payment status for ${currentMonthLabel}`}
        description="Search, filter settlement status, export CSV, open resident details, or mark cash payments from one table."
        actions={
          <div className="max-w-sm lg:ml-auto">
            <MonthFilter currentMonth={currentMonth} />
          </div>
        }
      />

      <AdminResidentsTable
        residents={residents}
        currentMonth={currentMonth}
        currentMonthLabel={currentMonthLabel}
      />
    </div>
  );
}
