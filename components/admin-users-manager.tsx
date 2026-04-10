"use client";

import { useMemo, useState } from "react";
import {
  deleteManagedUserAction,
  resetManagedUserPasswordAction,
  updateManagedUserAction,
} from "@/lib/actions";
import type { ManagedUser } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function AdminUsersManager({
  users,
  currentAdminId,
}: {
  users: ManagedUser[];
  currentAdminId: string;
}) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.house_number.toLowerCase().includes(normalized) ||
        user.name.toLowerCase().includes(normalized)
      );
    });
  }, [query, users]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">All users</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Manage every account in one place
          </h3>
        </div>
        <div className="w-full max-w-md">
          <label htmlFor="user-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search by house number or owner name
          </label>
          <input
            id="user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search A-12 or Nur Aisyah"
            className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-muted">
        Showing {filteredUsers.length} of {users.length} users.
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="text-center text-sm text-muted">
            No users matched your search.
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-0">
              <details className="group" open={query.length > 0}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-6 py-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-primary">
                      {user.role === "admin" ? "Admin" : "Resident"}
                    </p>
                    <h4 className="mt-2 font-display text-2xl font-bold text-slate-950">
                      {user.house_number}
                    </h4>
                    <p className="mt-1 text-sm text-muted">{user.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {user.must_change_password ? "Needs password change" : "Password active"}
                    </div>
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      Open
                    </div>
                  </div>
                </summary>

                <div className="border-t border-line px-6 py-5">
                  <p className="mb-5 text-sm text-muted">{user.email}</p>

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

                  <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
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
                        disabled={user.id === currentAdminId}
                        className="rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete user
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
