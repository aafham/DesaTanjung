import { updateAppSettingsAction } from "@/lib/actions";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { getAdminSettingsData } from "@/lib/data";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { PageToast } from "@/components/page-toast";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ settings, warnings }, params] = await Promise.all([getAdminSettingsData(), searchParams]);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />
      <AdminPageHeader
        eyebrow="Settings"
        title="Payment and community settings"
        description="Update bank details, upload the QR image, set the monthly fee, and choose the due day without editing code."
      />

      <AdminSettingsForm settings={settings} action={updateAppSettingsAction} />
    </div>
  );
}
