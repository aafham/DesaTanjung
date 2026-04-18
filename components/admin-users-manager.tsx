"use client";

import { useMemo, useState } from "react";
import {
  deleteManagedUserAction,
  resetManagedUserPasswordAction,
  updateManagedUserAction,
} from "@/lib/actions";
import type { ManagedUser } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card } from "@/components/ui/card";

export function AdminUsersManager({
  users,
  currentAdminId,
}: {
  users: ManagedUser[];
  currentAdminId: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch =
        !normalized ||
        user.house_number.toLowerCase().includes(normalized) ||
        user.name.toLowerCase().includes(normalized) ||
        user.phone_number?.toLowerCase().includes(normalized);

      return matchesRole && matchesSearch;
    });
  }, [query, roleFilter, users]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const residentCount = users.filter((user) => user.role === "user").length;
  const passwordResetCount = users.filter((user) => user.must_change_password).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">All users</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Manage every account in one place
          </h3>
        </div>
        <div className="w-full max-w-md">
          <label htmlFor="user-search" className="mb-2 block text-base font-bold text-slate-950">
            Search by house number, owner name, or phone number
          </label>
          <input
            id="user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search A-12, Nur Aisyah, or 0123456789"
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "all" ? "bg-slate-950 text-white" : "bg-slate-50 text-muted"
          }`}
        >
          <span className="block font-semibold">{users.length}</span>
          All users
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("user")}
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "user" ? "bg-primary text-primary-foreground" : "bg-slate-50 text-muted"
          }`}
        >
          <span className="block font-semibold">{residentCount}</span>
          Residents
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("admin")}
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "admin" ? "bg-primary text-primary-foreground" : "bg-slate-50 text-muted"
          }`}
        >
          <span className="block font-semibold">{adminCount}</span>
          Admins
        </button>
        <div className="rounded-3xl bg-amber-50 px-4 py-3 text-base font-bold text-amber-900">
          <span className="block font-semibold">{passwordResetCount}</span>
          Need password change
        </div>
      </div>

      <div className="rounded-3xl bg-slate-50 px-4 py-3 text-base text-muted">
        Showing {filteredUsers.length} of {users.length} users. Click a card to open or close details.
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="text-center text-sm text-muted">
            No users matched your search.
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-0">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-6 py-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                      {user.role === "admin" ? "Admin" : "Resident"}
                    </p>
                    <h4 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                      {user.house_number}
                    </h4>
                    <p className="mt-1 text-base text-muted">{user.name}</p>
                    <p className="mt-1 text-sm text-muted">{user.phone_number || "No phone number saved yet"}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          Last login
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {user.last_login_at ? formatTimestamp(user.last_login_at) : "No login recorded yet"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          Last logout
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {user.last_logout_at ? formatTimestamp(user.last_logout_at) : "No logout recorded yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-800">
                      {user.must_change_password ? "Needs password change" : "Password active"}
                    </div>
                    <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                      Open
                    </div>
                  </div>
                </summary>

                <div className="border-t border-line px-6 py-5">
                  <p className="mb-5 text-base text-muted">{user.email}</p>

                  <form action={updateManagedUserAction} className="grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="user_id" value={user.id} />
                    <div>
                      <label htmlFor={`house-${user.id}`} className="mb-2 block text-base font-bold text-slate-950">
                        House number / Username
                      </label>
                      <input
                        id={`house-${user.id}`}
                        name="house_number"
                        required
                        defaultValue={user.house_number}
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor={`name-${user.id}`} className="mb-2 block text-base font-bold text-slate-950">
                        Owner name
                      </label>
                      <input
                        id={`name-${user.id}`}
                        name="name"
                        required
                        defaultValue={user.name}
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor={`address-${user.id}`} className="mb-2 block text-base font-bold text-slate-950">
                        Address
                      </label>
                      <input
                        id={`address-${user.id}`}
                        name="address"
                        required
                        defaultValue={user.address}
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor={`phone-${user.id}`} className="mb-2 block text-base font-bold text-slate-950">
                        Phone number
                      </label>
                      <input
                        id={`phone-${user.id}`}
                        name="phone_number"
                        required
                        defaultValue={user.phone_number ?? ""}
                        placeholder="012-345 6789"
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor={`role-${user.id}`} className="mb-2 block text-base font-bold text-slate-950">
                        Role
                      </label>
                      <select
                        id={`role-${user.id}`}
                        name="role"
                        defaultValue={user.role}
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      >
                        <option value="user">Resident</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-full bg-primary px-5 py-3 text-base font-bold text-primary-foreground"
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
                      <ConfirmSubmitButton
                        confirmTitle="Reset this password?"
                        confirmMessage={`Reset password for ${user.house_number} to default password?`}
                        className="rounded-full bg-amber-500 px-5 py-3 text-base font-bold text-slate-950"
                      >
                        Reset to default password
                      </ConfirmSubmitButton>
                    </form>

                    <form action={deleteManagedUserAction}>
                      <input type="hidden" name="user_id" value={user.id} />
                      <input type="hidden" name="house_number" value={user.house_number} />
                      <ConfirmSubmitButton
                        confirmTitle="Delete this user?"
                        confirmMessage={`Delete ${user.house_number}? This also removes the login account and payment records.`}
                        disabled={user.id === currentAdminId}
                        variant="danger"
                        className="rounded-full bg-rose-700 px-5 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete user
                      </ConfirmSubmitButton>
                    </form>
                  </div>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                      Resident activity log
                    </p>
                    <div className="mt-3 space-y-3">
                      {(user.activityLogs ?? []).length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-base text-muted">
                          No resident activity has been recorded yet.
                        </div>
                      ) : (
                        (user.activityLogs ?? []).map((log) => (
                          <div key={log.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-base font-bold text-slate-950">{log.message}</p>
                            <p className="mt-1 text-sm text-muted">
                              {formatTimestamp(log.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
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
