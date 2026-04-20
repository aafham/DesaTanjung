import { AdminResidentsTable } from "@/components/admin-residents-table";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { MonthFilter } from "@/components/month-filter";
import { PageToast } from "@/components/page-toast";
import { getAdminResidentsData } from "@/lib/data";

export default async function AdminResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    message?: string;
    error?: string;
    page?: string;
    q?: string;
    status?: "all" | "paid" | "pending" | "unpaid" | "overdue" | "rejected";
    method?: "all" | "online" | "cash";
  }>;
}) {
  const params = await searchParams;
  const { currentMonth, currentMonthLabel, residents, warnings, filters, pagination, summary } =
    await getAdminResidentsData({
      filterMonth: params.month,
      page: Number(params.page ?? "1"),
      query: params.q ?? "",
      statusFilter: params.status ?? "all",
      methodFilter: params.method ?? "all",
    });

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
        filters={filters}
        pagination={pagination}
        summary={summary}
      />
    </div>
  );
}
