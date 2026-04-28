import {
  createManagedUserAction,
} from "@/lib/actions";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { AdminPageHeader } from "@/components/admin-page-header";
import { DataWarning } from "@/components/data-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { Card } from "@/components/ui/card";
import { canManageDestructiveAdminActions } from "@/lib/admin-permissions";
import { getAdminUserManagementData } from "@/lib/data";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    message?: string;
    page?: string;
    q?: string;
    role?: "all" | "admin" | "user";
    follow?: "all" | "missing-phone" | "never-logged-in" | "inactive";
  }>;
}) {
  const params = await searchParams;
  const { users, profile, warnings, filters, pagination, summary } =
    await getAdminUserManagementData({
      page: Number(params.page ?? "1"),
      query: params.q ?? "",
      roleFilter: params.role ?? "all",
      followUpFilter: params.follow ?? "all",
    });

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <DataWarning warnings={warnings} />
      <AdminPageHeader
        eyebrow="User management"
        title="Add, edit, delete, and reset user accounts"
        description="Keep resident records tidy, update contact details, and manage who can access the portal."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-slate-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
            Resident accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{summary.residentCount}</p>
          <p className="mt-2 text-sm text-slate-600">
            Active resident profiles available for billing and follow-up.
          </p>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-800">
            Missing phone
          </p>
          <p className="mt-2 text-3xl font-bold text-rose-950">{summary.missingPhoneCount}</p>
          <p className="mt-2 text-sm text-rose-900">
            These residents are not ready for WhatsApp and call shortcuts.
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Never logged in
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{summary.neverLoggedInCount}</p>
          <p className="mt-2 text-sm text-amber-900">
            Useful for onboarding follow-up after new accounts are created.
          </p>
        </Card>
      </section>

      <Card>
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
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
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="#user-directory"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                >
                  Jump to user directory
                </a>
                <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Default first password: password
                </span>
              </div>
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
              <div>
                <label htmlFor="new-role" className="mb-2 block text-base font-bold text-slate-950">
                  Account role
                </label>
                <select
                  id="new-role"
                  name="role"
                  defaultValue="user"
                  className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                >
                  <option value="user">Resident</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-2 text-sm text-muted">
                  Create separate admin accounts for committee members instead of sharing one login.
                </p>
              </div>
              <div className="md:col-span-2 rounded-3xl bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="max-w-xl text-base text-muted">
                    Every new account is created with username based on house number. Resident
                    accounts start with default password <span className="font-semibold text-slate-900">password</span>,
                    while admin accounts start with <span className="font-semibold text-slate-900">passwordadmin</span>.
                  </p>
                  <FormSubmitButton className="min-h-14 shrink-0 px-6 py-3 sm:min-w-[10rem]" pendingLabel="Adding user...">
                    Add user
                  </FormSubmitButton>
                </div>
              </div>
            </form>
          </div>
          <div className="rounded-4xl border border-line bg-slate-50 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quick guide</p>
            <div className="mt-4 grid gap-3">
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
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-base font-bold text-slate-950">4. Use separate admin accounts</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Create one admin login per committee member so audit history stays clear and you can avoid shared passwords.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div id="user-directory">
        <AdminUsersManager
          users={users}
          currentAdminId={profile.id}
          canDeleteUsers={canManageDestructiveAdminActions(profile)}
          filters={filters}
          pagination={pagination}
          summary={summary}
        />
      </div>
    </div>
  );
}
