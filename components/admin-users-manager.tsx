"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterX, Search } from "lucide-react";
import {
  deleteManagedUserAction,
  resetManagedUserPasswordAction,
  updateManagedUserAction,
} from "@/lib/actions";
import { ContactActions } from "@/components/contact-actions";
import type { ManagedUser } from "@/lib/types";
import { formatMalaysianPhoneNumber, formatTimestamp } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card } from "@/components/ui/card";
import type { PaginationMeta } from "@/lib/types";

export function AdminUsersManager({
  users,
  currentAdminId,
  canDeleteUsers,
  filters,
  pagination,
  summary,
}: {
  users: ManagedUser[];
  currentAdminId: string;
  canDeleteUsers: boolean;
  filters: {
    query: string;
    roleFilter: "all" | "admin" | "user";
    followUpFilter: "all" | "missing-phone" | "never-logged-in" | "inactive";
  };
  pagination: PaginationMeta;
  summary: {
    totalUsers: number;
    adminCount: number;
    residentCount: number;
    passwordResetCount: number;
    missingPhoneCount: number;
    inactiveCount: number;
    neverLoggedInCount: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.query);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">(filters.roleFilter);
  const [followUpFilter, setFollowUpFilter] = useState<
    "all" | "missing-phone" | "never-logged-in" | "inactive"
  >(filters.followUpFilter);
  const deferredQuery = useDeferredValue(query);
  const activeRoleFilterLabel =
    roleFilter === "all" ? "All users" : roleFilter === "admin" ? "Admins only" : "Residents only";
  const activeFollowUpLabel =
    followUpFilter === "all"
      ? "All conditions"
      : followUpFilter === "missing-phone"
        ? "Missing phone"
        : followUpFilter === "never-logged-in"
          ? "Never logged in"
          : "Inactive 30+ days";

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setRoleFilter(filters.roleFilter);
  }, [filters.roleFilter]);

  useEffect(() => {
    setFollowUpFilter(filters.followUpFilter);
  }, [filters.followUpFilter]);

  const updateUrl = useCallback((next: {
    page?: number;
    query?: string;
    role?: "all" | "admin" | "user";
    follow?: "all" | "missing-phone" | "never-logged-in" | "inactive";
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("message");
    params.delete("error");

    const nextQuery = next.query ?? deferredQuery;
    const nextRole = next.role ?? roleFilter;
    const nextFollow = next.follow ?? followUpFilter;
    const nextPage = next.page ?? pagination.currentPage;

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextRole !== "all") {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }

    if (nextFollow !== "all") {
      params.set("follow", nextFollow);
    } else {
      params.delete("follow");
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [deferredQuery, followUpFilter, pagination.currentPage, pathname, roleFilter, router, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (deferredQuery !== filters.query) {
        updateUrl({ query: deferredQuery, page: 1 });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, filters.query, updateUrl]);

  const startItem =
    pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
  const hasActiveFilters =
    query.trim().length > 0 || roleFilter !== "all" || followUpFilter !== "all";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">All users</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Manage every account in one place
          </h3>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Use this page to keep phone numbers, account access, and resident records tidy without opening multiple admin pages.
          </p>
        </div>
        <div className="w-full max-w-md">
          <label htmlFor="user-search" className="mb-2 block text-base font-bold text-slate-950">
            Search by house number, owner, address, email, or phone number
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="user-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search A-12, Nur Aisyah, Jalan Tanjung, or 0123456789"
              aria-describedby="user-search-help user-results-summary"
              className="min-h-14 w-full rounded-2xl border border-line py-3 pl-11 pr-4 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>
          <p id="user-search-help" className="mt-2 text-sm text-muted">
            Search by house number, owner, address, email, or phone to narrow the directory quickly.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
            Current view
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{pagination.totalItems}</p>
          <p className="mt-2 text-sm text-slate-600">
            {activeRoleFilterLabel} with {activeFollowUpLabel.toLowerCase()}.
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Need first login
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-950">{summary.neverLoggedInCount}</p>
          <p className="mt-2 text-sm text-amber-900">
            Accounts that have never entered the portal yet.
          </p>
        </Card>
        <Card className="border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-800">
            Missing contact
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-950">{summary.missingPhoneCount}</p>
          <p className="mt-2 text-sm text-rose-900">
            Residents who still need a phone number for follow-up.
          </p>
        </Card>
        <Card className="border-slate-200 bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
            Shown on this page
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {startItem}-{endItem}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Page {pagination.currentPage} of {pagination.totalPages}.
          </p>
        </Card>
      </section>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={() => {
            setRoleFilter("all");
            updateUrl({ role: "all", page: 1 });
          }}
          aria-pressed={roleFilter === "all"}
          aria-controls="user-results-list"
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "all"
              ? "border border-slate-900 text-white"
              : "border border-slate-200 bg-slate-50 text-muted"
          }`}
          style={
            roleFilter === "all"
              ? {
                  background:
                    "linear-gradient(135deg, #07111f 0%, #10263a 45%, #134e4a 100%)",
                }
              : undefined
          }
        >
          <span className="block font-semibold">{summary.totalUsers}</span>
          All users
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter("user");
            updateUrl({ role: "user", page: 1 });
          }}
          aria-pressed={roleFilter === "user"}
          aria-controls="user-results-list"
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "user"
              ? "border border-teal-700 bg-primary text-primary-foreground"
              : "border border-slate-200 bg-slate-50 text-muted"
          }`}
        >
          <span className="block font-semibold">{summary.residentCount}</span>
          Residents
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter("admin");
            updateUrl({ role: "admin", page: 1 });
          }}
          aria-pressed={roleFilter === "admin"}
          aria-controls="user-results-list"
          className={`rounded-3xl px-4 py-3 text-left text-base font-bold transition ${
            roleFilter === "admin"
              ? "border border-teal-700 bg-primary text-primary-foreground"
              : "border border-slate-200 bg-slate-50 text-muted"
          }`}
        >
          <span className="block font-semibold">{summary.adminCount}</span>
          Admins
        </button>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-base font-bold text-amber-900">
          <span className="block font-semibold">{summary.passwordResetCount}</span>
          Need password change
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-base font-bold text-rose-900">
          <span className="block font-semibold">{summary.missingPhoneCount}</span>
          Missing phone
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-base font-bold text-slate-900">
          <span className="block font-semibold">{summary.inactiveCount}</span>
          Inactive 30+ days
        </div>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Follow-up filters
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { value: "all", label: "All conditions" },
                { value: "missing-phone", label: "Missing phone" },
                { value: "never-logged-in", label: "Never logged in" },
                { value: "inactive", label: "Inactive 30+ days" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const nextFollow = option.value as
                      | "all"
                      | "missing-phone"
                      | "never-logged-in"
                      | "inactive";
                    setFollowUpFilter(nextFollow);
                    updateUrl({
                      follow: nextFollow,
                      page: 1,
                    });
                  }}
                  aria-pressed={followUpFilter === option.value}
                  aria-controls="user-results-list"
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    followUpFilter === option.value
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-base text-slate-600">
              {summary.neverLoggedInCount} users have never logged in yet. Use these filters to quickly
              spot accounts that still need setup or follow-up.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("all");
                  setFollowUpFilter("all");
                  updateUrl({
                    query: "",
                    role: "all",
                    follow: "all",
                    page: 1,
                  });
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                <FilterX className="h-4 w-4" />
                Clear all filters
              </button>
            ) : null}
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
              Current result window
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950">
              {activeRoleFilterLabel} - {activeFollowUpLabel}
            </p>
            <p id="user-results-summary" className="mt-2 text-sm text-slate-600">
              Showing {startItem}-{endItem} of {pagination.totalItems} matched users.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                {summary.passwordResetCount} need password change
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                {summary.missingPhoneCount} missing phone
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                {summary.inactiveCount} inactive 30+ days
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">
          Account safety
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">Reset password</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Requires typing the exact house number before the default password is restored.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">Delete user</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Requires the configured lead admin plus typing DELETE and the house number.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-base font-bold text-slate-950">Current admin</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The signed-in admin account cannot delete itself from this page.
            </p>
          </div>
        </div>
        {!canDeleteUsers ? (
          <div className="mt-3 rounded-3xl bg-white/80 px-4 py-4 text-sm leading-6 text-amber-950">
            Delete actions are locked for this admin session. Ask the configured lead admin to delete accounts.
          </div>
        ) : null}
      </Card>

      <div id="user-results-list" className="grid gap-4">
        {pagination.totalItems === 0 ? (
          <Card className="rounded-4xl border-dashed text-center text-sm text-muted">
            <p className="text-lg font-bold text-slate-950">No users matched this view.</p>
            <p className="mt-2 text-sm text-muted">
              Try clearing filters, searching with a shorter keyword, or switching back to all conditions.
            </p>
            {hasActiveFilters ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("all");
                    setFollowUpFilter("all");
                    updateUrl({
                      query: "",
                      role: "all",
                      follow: "all",
                      page: 1,
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                >
                  <FilterX className="h-4 w-4" />
                  Reset view
                </button>
              </div>
            ) : null}
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="p-0">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 rounded-3xl px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                      {user.role === "admin" ? "Admin" : "Resident"}
                    </p>
                    <h4 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                      {user.house_number}
                    </h4>
                    <p className="mt-1 text-base text-muted">{user.name}</p>
                    <p className="mt-1 text-sm font-medium text-muted">
                      {user.phone_number
                        ? formatMalaysianPhoneNumber(user.phone_number)
                        : "No phone number saved yet"}
                    </p>
                    <span className="sr-only">Press Enter or Space to expand user account details.</span>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                          Last login
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {user.last_login_at ? formatTimestamp(user.last_login_at) : "No login recorded yet"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                          Last logout
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {user.last_logout_at ? formatTimestamp(user.last_logout_at) : "No logout recorded yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {!user.phone_number ? (
                        <div className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-rose-800">
                          Missing phone
                        </div>
                      ) : null}
                      {!user.last_login_at ? (
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-amber-900">
                          Never logged in
                        </div>
                      ) : Date.now() - new Date(user.last_login_at).getTime() >= 1000 * 60 * 60 * 24 * 30 ? (
                        <div className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-slate-800">
                          Inactive 30+ days
                        </div>
                      ) : null}
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-slate-800">
                        {user.must_change_password ? "Needs password change" : "Password active"}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap text-white">
                      Open details
                    </div>
                    <ContactActions
                      phoneNumber={user.phone_number}
                      compact
                      className="sm:justify-end"
                    />
                  </div>
                </summary>

                <div className="border-t border-line px-6 py-5">
                  <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Login email</p>
                      <p className="mt-1 text-base font-semibold text-slate-950">{user.email}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      Created {formatTimestamp(user.created_at)}
                    </div>
                  </div>

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
                        defaultValue={user.phone_number ? formatMalaysianPhoneNumber(user.phone_number) : ""}
                        placeholder="012-345 6789"
                        className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                      />
                      <p className="mt-2 text-sm text-muted">Use Malaysian mobile format such as 012-345 6789.</p>
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
                    <div className="md:col-span-2 rounded-3xl bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                        Account update
                      </p>
                      <FormSubmitButton className="rounded-full px-5 py-3" pendingLabel="Saving changes...">
                        Save changes
                      </FormSubmitButton>
                    </div>
                  </form>

                  <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
                    <form action={resetManagedUserPasswordAction}>
                      <input type="hidden" name="user_id" value={user.id} />
                      <input type="hidden" name="role" value={user.role} />
                      <input type="hidden" name="house_number" value={user.house_number} />
                      <ConfirmSubmitButton
                        confirmTitle="Reset this password?"
                        confirmMessage={`Reset password for ${user.house_number} to the default ${user.role === "admin" ? "admin" : "resident"} password. The user must change it again on next login.`}
                        confirmLabel="Reset password"
                        requiredConfirmationText={user.house_number}
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
                        confirmMessage={`Delete ${user.house_number}? This removes the Supabase Auth login account and linked profile data. Do this only after backup or committee approval.`}
                        confirmLabel="Delete user"
                        requiredConfirmationText={`DELETE ${user.house_number}`}
                        disabled={user.id === currentAdminId || !canDeleteUsers}
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

      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => updateUrl({ page })}
      />
    </section>
  );
}
