import {
  createManagedUserAction,
  deleteManagedUserAction,
  resetManagedUserPasswordAction,
  updateManagedUserAction,
} from "@/lib/actions";
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
          <p className="text-sm uppercase tracking-[0.18em] text-primary">User management</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Add, edit, delete, and reset user accounts
          </h2>
        </div>
        {params.error ? (
          <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {decodeURIComponent(params.error)}
          </div>
        ) : null}
        {params.message ? (
          <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {decodeURIComponent(params.message)}
          </div>
        ) : null}
      </section>

      <Card>
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Create user</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Register a new resident
          </h3>
        </div>
        <form action={createManagedUserAction} className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="new-house-number" className="mb-2 block text-sm font-medium text-slate-700">
              House number / Username
            </label>
            <input
              id="new-house-number"
              name="house_number"
              required
              placeholder="A-15 or admin2"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="new-name" className="mb-2 block text-sm font-medium text-slate-700">
              Owner name
            </label>
            <input
              id="new-name"
              name="name"
              required
              placeholder="Full name"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="new-address" className="mb-2 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="new-address"
              name="address"
              required
              placeholder="Jalan Tanjung 3"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-sm text-muted">
              Every new resident is created with username based on house number and default
              password <span className="font-semibold text-slate-900">password</span>.
            </p>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Add user
            </button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">All users</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Manage every account in one place
          </h3>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-primary">
                    {user.role === "admin" ? "Admin" : "Resident"}
                  </p>
                  <h4 className="mt-2 font-display text-2xl font-bold text-slate-950">
                    {user.house_number}
                  </h4>
                  <p className="mt-1 text-sm text-muted">{user.email}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {user.must_change_password ? "Needs password change" : "Password active"}
                </div>
              </div>

              <form action={updateManagedUserAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="user_id" value={user.id} />
                <div>
                  <label htmlFor={`house-${user.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                    House number / Username
                  </label>
                  <input
                    id={`house-${user.id}`}
                    name="house_number"
                    required
                    defaultValue={user.house_number}
                    className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor={`name-${user.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                    Owner name
                  </label>
                  <input
                    id={`name-${user.id}`}
                    name="name"
                    required
                    defaultValue={user.name}
                    className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor={`address-${user.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <input
                    id={`address-${user.id}`}
                    name="address"
                    required
                    defaultValue={user.address}
                    className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor={`role-${user.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <select
                    id={`role-${user.id}`}
                    name="role"
                    defaultValue={user.role}
                    className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="user">Resident</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Save changes
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                <form action={resetManagedUserPasswordAction}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="role" value={user.role} />
                  <input type="hidden" name="house_number" value={user.house_number} />
                  <button
                    type="submit"
                    className="rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    Reset to default password
                  </button>
                </form>

                <form action={deleteManagedUserAction}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="house_number" value={user.house_number} />
                  <button
                    type="submit"
                    disabled={user.id === profile.id}
                    className="rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete user
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
