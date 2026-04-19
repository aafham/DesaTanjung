"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, Search, ShieldCheck, Users } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ManagedUser,
  ResidentPaymentRecord,
  UserActivityWithUser,
  UserProfile,
} from "@/lib/types";
import { formatMalaysianPhoneNumber, formatTimestamp } from "@/lib/utils";

type SearchPayment = ResidentPaymentRecord & {
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number"> | null;
};

type SearchResult =
  | {
      id: string;
      kind: "resident";
      title: string;
      subtitle: string;
      supporting: string;
      badge: string;
      primaryHref: string;
      primaryLabel: string;
      secondaryHref: string;
      secondaryLabel: string;
      phoneNumber: string | null | undefined;
    }
  | {
      id: string;
      kind: "payment";
      title: string;
      subtitle: string;
      supporting: string;
      status: SearchPayment["display_status"];
      primaryHref: string;
      primaryLabel: string;
      secondaryHref?: string;
      secondaryLabel?: string;
      phoneNumber: string | null | undefined;
    }
  | {
      id: string;
      kind: "activity";
      title: string;
      subtitle: string;
      supporting: string;
      badge: string;
      primaryHref?: string;
      primaryLabel?: string;
      secondaryHref?: string;
      secondaryLabel?: string;
    };

export function AdminGlobalSearch({
  currentMonthLabel,
  residents,
  payments,
  activityLogs,
  initialQuery,
}: {
  currentMonthLabel: string;
  residents: ManagedUser[];
  payments: SearchPayment[];
  activityLogs: UserActivityWithUser[];
  initialQuery?: string;
}) {
  const PAGE_SIZE = 3;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [focus, setFocus] = useState<"all" | "residents" | "payments" | "activity">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalized = deferredQuery.trim();

      if (normalized) {
        params.set("query", normalized);
      } else {
        params.delete("query");
      }

      const nextSearch = params.toString();
      const nextHref = nextSearch ? `${pathname}?${nextSearch}` : pathname;
      const currentSearch = searchParams.toString();
      const currentHref = currentSearch ? `${pathname}?${currentSearch}` : pathname;

      if (nextHref !== currentHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, pathname, router, searchParams]);

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return {
        residents: residents.slice(0, 8),
        payments: payments.slice(0, 8),
        activityLogs: activityLogs.slice(0, 8),
      };
    }

    const match = (value: string | null | undefined) => value?.toLowerCase().includes(normalized);

    return {
      residents: residents.filter(
        (resident) =>
          match(resident.house_number) ||
          match(resident.name) ||
          match(resident.address) ||
          match(resident.phone_number) ||
          match(resident.email),
      ),
      payments: payments.filter(
        (payment) =>
          match(payment.users?.house_number) ||
          match(payment.users?.name) ||
          match(payment.users?.address) ||
          match(payment.users?.phone_number) ||
          match(payment.notes) ||
          match(payment.reject_reason),
      ),
      activityLogs: activityLogs.filter(
        (activity) =>
          match(activity.users?.house_number) ||
          match(activity.users?.name) ||
          match(activity.message) ||
          match(activity.action),
      ),
    };
  }, [activityLogs, deferredQuery, payments, residents]);

  const hasQuery = query.trim().length > 0;
  const focusCards = [
    {
      value: "all" as const,
      label: "All sections",
      description: "Compare residents, payments, and activity together.",
      icon: Search,
      count: filtered.residents.length + filtered.payments.length + filtered.activityLogs.length,
    },
    {
      value: "residents" as const,
      label: "Residents",
      description: "Jump straight to account and contact details.",
      icon: Users,
      count: filtered.residents.length,
    },
    {
      value: "payments" as const,
      label: "Payments",
      description: `Focus on ${currentMonthLabel} status, notes, and rejects.`,
      icon: ShieldCheck,
      count: filtered.payments.length,
    },
    {
      value: "activity" as const,
      label: "Activity",
      description: "Trace login, profile, and payment actions quickly.",
      icon: Activity,
      count: filtered.activityLogs.length,
    },
  ];

  function getPaymentActionLabel(payment: SearchPayment) {
    if (payment.display_status === "pending") {
      return "Review approval";
    }

    if (payment.display_status === "rejected") {
      return "Follow up reject";
    }

    if (payment.display_status === "overdue" || payment.display_status === "unpaid") {
      return "Follow up resident";
    }

    return "Open resident";
  }

  const residentResults = useMemo<SearchResult[]>(
    () =>
      filtered.residents.map((resident) => ({
        id: `resident-${resident.id}`,
        kind: "resident",
        title: `${resident.house_number} - ${resident.name}`,
        subtitle: resident.address,
        supporting: resident.phone_number
          ? formatMalaysianPhoneNumber(resident.phone_number)
          : "No phone number saved yet",
        badge: resident.role === "admin" ? "Admin" : "Resident",
        primaryHref: `/admin/residents/${resident.id}`,
        primaryLabel: "Open resident",
        secondaryHref: `/admin/users?query=${encodeURIComponent(resident.house_number)}`,
        secondaryLabel: "Open user",
        phoneNumber: resident.phone_number,
      })),
    [filtered.residents],
  );

  const paymentResults = useMemo<SearchResult[]>(
    () =>
      filtered.payments.map((payment) => ({
        id: `payment-${payment.id}`,
        kind: "payment",
        title: `${payment.users?.house_number ?? "-"} - ${payment.users?.name ?? "Resident"}`,
        subtitle: `${currentMonthLabel} payment record`,
        supporting: payment.reject_reason
          ? `Reject reason: ${payment.reject_reason}`
          : payment.notes
            ? `Note: ${payment.notes}`
            : `Updated ${formatTimestamp(payment.updated_at)}`,
        status: payment.display_status,
        primaryHref: `/admin/residents/${payment.user_id}?month=${payment.month}`,
        primaryLabel: getPaymentActionLabel(payment),
        secondaryHref:
          payment.display_status === "pending" || payment.display_status === "rejected"
            ? `/admin/approvals?month=${payment.month}`
            : undefined,
        secondaryLabel:
          payment.display_status === "pending" || payment.display_status === "rejected"
            ? "Open approvals"
            : undefined,
        phoneNumber: payment.users?.phone_number,
      })),
    [currentMonthLabel, filtered.payments],
  );

  const activityResults = useMemo<SearchResult[]>(
    () =>
      filtered.activityLogs.map((activity) => ({
        id: `activity-${activity.id}`,
        kind: "activity",
        title: `${activity.users?.house_number ?? "Resident"} - ${activity.users?.name ?? "Activity"}`,
        subtitle: activity.message,
        supporting: formatTimestamp(activity.created_at),
        badge: activity.action.replaceAll("_", " "),
        primaryHref: activity.user_id ? `/admin/residents/${activity.user_id}` : undefined,
        primaryLabel: activity.user_id ? "Open resident" : undefined,
        secondaryHref: activity.user_id
          ? `/admin/users?query=${encodeURIComponent(activity.users?.house_number ?? "")}`
          : undefined,
        secondaryLabel: activity.user_id ? "Open user" : undefined,
      })),
    [filtered.activityLogs],
  );

  const resultGroups = useMemo(() => {
    if (focus === "residents") {
      return residentResults.slice(0, 10);
    }

    if (focus === "payments") {
      return paymentResults.slice(0, 10);
    }

    if (focus === "activity") {
      return activityResults.slice(0, 10);
    }

    if (hasQuery) {
      return [...residentResults, ...paymentResults, ...activityResults].slice(0, 12);
    }

    return [
      ...residentResults.slice(0, 4),
      ...paymentResults.slice(0, 4),
      ...activityResults.slice(0, 4),
    ];
  }, [activityResults, focus, hasQuery, paymentResults, residentResults]);

  const focusSummaryLabel =
    focus === "all"
      ? "Top matches across residents, payments, and activity."
      : focus === "residents"
        ? "Resident accounts and contact details only."
        : focus === "payments"
          ? `Payment records for ${currentMonthLabel}.`
          : "Recent activity items only.";

  const totalPages = Math.max(1, Math.ceil(resultGroups.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, focus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return resultGroups.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, resultGroups]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label
              htmlFor="admin-global-search"
              className="mb-2 block text-base font-bold text-slate-950"
            >
              Search by house number, owner, address, phone, note, or activity
            </label>
            <p className="text-sm text-slate-600">
              Start typing once and compare resident records, payment records, and activity logs
              side by side.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {hasQuery ? "Live filtered results" : "Showing latest records first"}
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="admin-global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search A-12, Noor Azizan, 0123456789, uploaded..."
            aria-describedby="admin-search-help admin-search-result-summary"
            className="min-h-14 w-full rounded-2xl border border-line py-3 pl-12 pr-4 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>
        <p id="admin-search-help" className="mt-2 text-sm text-muted">
          Search once, then use the focus cards to narrow to residents, payments, or activity.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {focusCards.map((option) => {
            const Icon = option.icon;
            const active = focus === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFocus(option.value)}
                aria-pressed={active}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-line bg-slate-50 text-slate-900 hover:bg-white"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-2xl p-2 ${active ? "bg-white/10" : "bg-white"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      active ? "bg-white/10 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    {option.count}
                  </span>
                </div>
                <p className="mt-4 text-base font-bold">{option.label}</p>
                <p className={`mt-2 text-sm leading-6 ${active ? "text-slate-100" : "text-slate-700"}`}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
          {hasQuery ? (
            <p>
              Searching for{" "}
              <span className="font-bold text-slate-950">&quot;{query.trim()}&quot;</span>. Use
              the focus cards above when you already know whether you need a resident, payment, or
              activity result.
            </p>
          ) : (
            <p>
              Tip: search by house number for the fastest match, or paste part of a payment note,
              phone number, or activity message to find related records.
            </p>
          )}
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
            Resident matches
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{filtered.residents.length}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            House number, owner name, address, phone, and email.
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Payment matches
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{filtered.payments.length}</p>
          <p className="mt-2 text-sm font-medium text-amber-950">
            Notes, reject reasons, and status records for {currentMonthLabel}.
          </p>
        </Card>
        <Card className="border-teal-200 bg-teal-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-800">
            Activity matches
          </p>
          <p className="mt-2 text-3xl font-bold text-teal-950">{filtered.activityLogs.length}</p>
          <p className="mt-2 text-sm font-medium text-teal-950">
            Login, profile changes, uploads, and account activity.
          </p>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Global finder
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              Search once, then jump straight to the right page
            </h3>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              {focusSummaryLabel}
            </p>
          </div>
          <div
            id="admin-search-result-summary"
            className="rounded-3xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {hasQuery
              ? `Showing ${Math.min(PAGE_SIZE, paginatedResults.length)} of ${resultGroups.length} top match${resultGroups.length === 1 ? "" : "es"}`
              : "Showing a compact shortlist"}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {resultGroups.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-base text-muted">
              No residents, payments, or activity items matched this search. Try a shorter keyword
              or switch the focus cards above.
            </div>
          ) : (
            paginatedResults.map((result) => (
              <div
                key={result.id}
                className="rounded-3xl border border-line bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                        {result.kind}
                      </span>
                      {"status" in result ? (
                        <StatusBadge status={result.status} />
                      ) : (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                          {result.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-950">{result.title}</p>
                    <p className="mt-1 text-base text-slate-800">{result.subtitle}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{result.supporting}</p>
                    {"phoneNumber" in result ? (
                      <ContactActions
                        phoneNumber={result.phoneNumber}
                        compact
                        className="mt-3"
                      />
                    ) : null}
                  </div>

                  <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:max-w-[15rem] lg:justify-end">
                    {"primaryHref" in result && result.primaryHref && result.primaryLabel ? (
                      <Link
                        href={result.primaryHref}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      >
                        {result.primaryLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                    {"secondaryHref" in result && result.secondaryHref && result.secondaryLabel ? (
                      <Link
                        href={result.secondaryHref}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700"
                      >
                        {result.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {resultGroups.length > 0 ? (
          <div className="mt-5">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Link
            href="/admin/residents"
            className="rounded-3xl border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Residents</p>
            <p className="mt-2 text-base font-bold text-slate-950">Open resident payment list</p>
            <p className="mt-1 text-sm text-slate-600">
              Best for browsing statuses and monthly settlement.
            </p>
          </Link>
          <Link
            href="/admin/users"
            className="rounded-3xl border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Users</p>
            <p className="mt-2 text-base font-bold text-slate-950">Open account management</p>
            <p className="mt-1 text-sm text-slate-600">
              Best for onboarding, phone numbers, and login follow-up.
            </p>
          </Link>
          <Link
            href="/admin/activity"
            className="rounded-3xl border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Activity</p>
            <p className="mt-2 text-base font-bold text-slate-950">Open full activity log</p>
            <p className="mt-1 text-sm text-slate-600">
              Best for browsing login, uploads, and resident actions over time.
            </p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
