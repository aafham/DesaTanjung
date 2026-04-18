import { AdminGlobalSearch } from "@/components/admin-global-search";
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

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Global search</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Search residents, payments, and activity in one place
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Use this page when you need to find a resident quickly without jumping between approvals, users, residents, and activity.
        </p>
      </section>

      <AdminGlobalSearch
        currentMonthLabel={currentMonthLabel}
        residents={residents}
        payments={payments}
        activityLogs={activityLogs}
      />
    </div>
  );
}
