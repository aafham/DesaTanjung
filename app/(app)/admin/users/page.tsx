import {
  createManagedUserAction,
} from "@/lib/actions";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { AdminPageHeader } from "@/components/admin-page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { getAdminUserManagementData } from "@/lib/data";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ users, profile }, params] = await Promise.all([
    getAdminUserManagementData(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <AdminPageHeader
        eyebrow="User management"
        title="Add, edit, delete, and reset user accounts"
        description="Keep resident records tidy, update contact details, and manage who can access the portal."
      />

      <Card>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Create user</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                Register a new resident
              </h3>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Add one resident account with house number, owner details, address, and phone number.
                The system will prepare the default login automatically.
              </p>
            </div>
            <form action={createManagedUserAction} className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="new-house-number" className="mb-2 block text-base font-bold text-slate-950">
                  House number / Username
                </label>
                <input
                  id="new-house-number"
                  name="house_number"
                  required
                  placeholder="A-15 or admin2"
                  className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="new-name" className="mb-2 block text-base font-bold text-slate-950">
                  Owner name
                </label>
                <input
                  id="new-name"
                  name="name"
                  required
                  placeholder="Full name"
                  className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="new-address" className="mb-2 block text-base font-bold text-slate-950">
                  Address
                </label>
                <input
                  id="new-address"
                  name="address"
                  required
                  placeholder="Jalan Tanjung 3"
                  className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="new-phone-number" className="mb-2 block text-base font-bold text-slate-950">
                  Phone number
                </label>
                <input
                  id="new-phone-number"
                  name="phone_number"
                  required
                  placeholder="012-345 6789"
                  className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                />
                <p className="mt-2 text-sm text-muted">Use Malaysian mobile format such as 012-345 6789.</p>
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
                <p className="text-base text-muted">
                  Every new resident is created with username based on house number and default
                  password <span className="font-semibold text-slate-900">password</span>.
                </p>
                <FormSubmitButton className="min-h-14 shrink-0 px-6 py-3 sm:min-w-[10rem]" pendingLabel="Adding user...">
                  Add user
                </FormSubmitButton>
              </div>
            </form>
          </div>
          <div className="rounded-4xl border border-line bg-slate-50 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quick guide</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-base font-bold text-slate-950">1. Add complete contact details</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Fill in phone number during registration so Call and WhatsApp actions work immediately.
                </p>
              </div>
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-base font-bold text-slate-950">2. Share the first login</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Residents sign in using house number and default password <span className="font-semibold text-slate-900">password</span>.
                </p>
              </div>
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-base font-bold text-slate-950">3. Ask resident to change password</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  The portal will prompt a password change on first login to keep the account secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <AdminUsersManager users={users} currentAdminId={profile.id} />
    </div>
  );
}
