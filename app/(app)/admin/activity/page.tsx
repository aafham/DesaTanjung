import { AdminActivityLog } from "@/components/admin-activity-log";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { getAdminActivityLogData } from "@/lib/data";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    message?: string;
    page?: string;
    q?: string;
    action?: string;
    role?: "all" | "user" | "admin";
    date?: "today" | "7d" | "14d";
  }>;
}) {
  const params = await searchParams;
  const { activityLogs, warnings, filters, pagination, summary } =
    await getAdminActivityLogData({
      page: Number(params.page ?? "1"),
      pageSize: 10,
      query: params.q ?? "",
      actionFilter: params.action ?? "all",
      roleFilter: params.role ?? "all",
      dateFilter: params.date ?? "14d",
    });

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="Admin activity"
        title="Track the latest portal actions across admin and resident flows"
        description="Review the latest 14 days of logins, profile updates, payment handling, settings updates, and user management actions from one organised activity log."
      />

      <AdminActivityLog
        activityLogs={activityLogs}
        filters={filters}
        pagination={pagination}
        summary={summary}
      />
    </div>
  );
}
