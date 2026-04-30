import { AdminGlobalSearch } from "@/components/admin-global-search";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { PageToast } from "@/components/page-toast";
import { getAdminSearchData } from "@/lib/admin-search-data";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; query?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const {
    activityLogs,
    currentMonthLabel,
    payments,
    residents,
    searchQuery,
    warnings,
  } = await getAdminSearchData(params.month, params.query);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />

      <AdminPageHeader
        eyebrow="Global search"
        title="Search residents, payments, and activity in one place"
        description="Use this page when you need to find a resident quickly without jumping between approvals, users, residents, and activity."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Resident records</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{residents.length}</p>
          <p className="mt-2 text-sm text-slate-600">Search house number, owner name, address, phone, or email.</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">Payments in focus</p>
          <p className="mt-2 text-2xl font-bold text-amber-950">{payments.length}</p>
          <p className="mt-2 text-sm text-amber-900">Review notes, reject reasons, and status for {currentMonthLabel}.</p>
        </div>
        <div className="rounded-3xl border border-teal-200 bg-teal-50 px-5 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-800">Recent actions</p>
          <p className="mt-2 text-2xl font-bold text-teal-950">{activityLogs.length}</p>
          <p className="mt-2 text-sm text-teal-900">Look up login, profile update, payment, and account activity.</p>
        </div>
      </section>

      <AdminGlobalSearch
        currentMonthLabel={currentMonthLabel}
        residents={residents}
        payments={payments}
        activityLogs={activityLogs}
        initialQuery={searchQuery}
      />
    </div>
  );
}
