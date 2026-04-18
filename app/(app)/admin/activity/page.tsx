import { AdminActivityLog } from "@/components/admin-activity-log";
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

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Admin activity</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Track resident actions across the portal
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Review logins, logouts, profile changes, password updates, and receipt uploads from one page.
        </p>
      </section>

      <AdminActivityLog activityLogs={activityLogs} />
    </div>
  );
}
