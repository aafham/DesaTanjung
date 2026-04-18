import { AdminGlobalSearch } from "@/components/admin-global-search";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { getAdminSearchData } from "@/lib/data";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { activityLogs, currentMonthLabel, payments, residents, warnings } =
    await getAdminSearchData(params.month);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="Global search"
        title="Search residents, payments, and activity in one place"
        description="Use this page when you need to find a resident quickly without jumping between approvals, users, residents, and activity."
      />

      <AdminGlobalSearch
        currentMonthLabel={currentMonthLabel}
        residents={residents}
        payments={payments}
        activityLogs={activityLogs}
      />
    </div>
  );
}
