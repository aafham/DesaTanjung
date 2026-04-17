import {
  createManagedUserAction,
} from "@/lib/actions";
import { AdminUsersManager } from "@/components/admin-users-manager";
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
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">User management</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
            Add, edit, delete, and reset user accounts
          </h2>
        </div>
        {params.error ? (
          <div className="rounded-3xl bg-rose-50 px-4 py-3 text-base font-bold text-rose-800">
            {decodeURIComponent(params.error)}
          </div>
        ) : null}
        {params.message ? (
          <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-800">
            {decodeURIComponent(params.message)}
          </div>
        ) : null}
      </section>

      <Card>
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Create user</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Register a new resident
          </h3>
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
          <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-base text-muted">
              Every new resident is created with username based on house number and default
              password <span className="font-semibold text-slate-900">password</span>.
            </p>
            <button
              type="submit"
              className="min-h-14 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground"
            >
              Add user
            </button>
          </div>
        </form>
      </Card>

      <AdminUsersManager users={users} currentAdminId={profile.id} />
    </div>
  );
}
