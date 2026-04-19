import { AdminActivityLog } from "@/components/admin-activity-log";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { getAdminActivityLogData } from "@/lib/data";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ activityLogs, warnings }, params] = await Promise.all([
    getAdminActivityLogData(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="Admin activity"
        title="Track the latest portal actions across admin and resident flows"
        description="Review the latest 14 days of logins, profile updates, payment handling, settings updates, and user management actions from one organised activity log."
      />

      <AdminActivityLog activityLogs={activityLogs} />
    </div>
  );
}
