import { updateAppSettingsAction } from "@/lib/actions";
import { getAdminSettingsData } from "@/lib/data";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { PageToast } from "@/components/page-toast";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ settings }, params] = await Promise.all([getAdminSettingsData(), searchParams]);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Settings</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Payment and community settings
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Update bank details, upload the QR image, set the monthly fee, and choose the due day without editing code.
        </p>
      </section>

      <AdminSettingsForm settings={settings} action={updateAppSettingsAction} />
    </div>
  );
}
