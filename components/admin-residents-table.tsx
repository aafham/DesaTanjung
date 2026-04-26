"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, Download, MessageCircle, Search } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import {
  bulkMarkCashPaymentAction,
  markCashPaymentAction,
  updatePaymentNotesAction,
} from "@/lib/actions";
import type { PaymentStatus, ResidentWithPayment } from "@/lib/types";
import {
  formatMalaysianPhoneNumber,
  formatTimestamp,
  getPhoneActionLinks,
} from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PaginationMeta } from "@/lib/types";

const filterOptions: Array<{ label: string; value: "all" | PaymentStatus | "overdue" }> = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Overdue", value: "overdue" },
  { label: "Rejected", value: "rejected" },
];

const methodOptions: Array<{ label: string; value: "all" | "online" | "cash" }> = [
  { label: "All methods", value: "all" },
  { label: "Online", value: "online" },
  { label: "Cash", value: "cash" },
];

function getStatus(resident: ResidentWithPayment): PaymentStatus {
  return resident.currentPayment?.status ?? "unpaid";
}

function getDisplayStatus(resident: ResidentWithPayment) {
  return resident.currentPayment?.display_status ?? "unpaid";
}

export function AdminResidentsTable({
  residents,
  currentMonth,
  currentMonthLabel,
  filters,
  pagination,
  summary,
}: {
  residents: ResidentWithPayment[];
  currentMonth: string;
  currentMonthLabel: string;
  filters: {
    query: string;
    statusFilter: "all" | PaymentStatus | "overdue";
    methodFilter: "all" | "online" | "cash";
  };
  pagination: PaginationMeta;
  summary: {
    settledCount: number;
    reviewedCount: number;
    followUpCount: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.query);
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus | "overdue">(
    filters.statusFilter,
  );
  const [methodFilter, setMethodFilter] = useState<"all" | "online" | "cash">(
    filters.methodFilter,
  );
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [copiedResidentId, setCopiedResidentId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  function toggleResident(residentId: string) {
    setSelectedResidentIds((current) =>
      current.includes(residentId)
        ? current.filter((id) => id !== residentId)
        : [...current, residentId],
    );
  }

  async function copyReminder(resident: ResidentWithPayment) {
    const text = `Salam ${resident.name}, bayaran untuk ${currentMonthLabel} bagi rumah ${resident.house_number} masih belum selesai. Sila buat bayaran dan upload resit dalam sistem Desa Tanjung. Terima kasih.`;

    await navigator.clipboard.writeText(text);
    setCopiedResidentId(resident.id);
    window.setTimeout(() => setCopiedResidentId(null), 1800);
  }

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setStatusFilter(filters.statusFilter);
  }, [filters.statusFilter]);

  useEffect(() => {
    setMethodFilter(filters.methodFilter);
  }, [filters.methodFilter]);

  const updateUrl = useCallback((next: {
    page?: number;
    query?: string;
    status?: "all" | PaymentStatus | "overdue";
    method?: "all" | "online" | "cash";
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("message");
    params.delete("error");

    const nextQuery = next.query ?? deferredQuery;
    const nextStatus = next.status ?? statusFilter;
    const nextMethod = next.method ?? methodFilter;
    const nextPage = next.page ?? pagination.currentPage;

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextMethod !== "all") {
      params.set("method", nextMethod);
    } else {
      params.delete("method");
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [deferredQuery, methodFilter, pagination.currentPage, pathname, router, searchParams, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (deferredQuery !== filters.query) {
        updateUrl({ query: deferredQuery, page: 1 });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, filters.query, updateUrl]);

  const selectedResidents = useMemo(
    () => residents.filter((resident) => selectedResidentIds.includes(resident.id)),
    [residents, selectedResidentIds],
  );

  const selectedResidentsWithPhone = useMemo(
    () =>
      selectedResidents
        .map((resident) => ({
          resident,
          links: getPhoneActionLinks(resident.phone_number),
        }))
        .filter(
          (
            item,
          ): item is {
            resident: ResidentWithPayment;
            links: NonNullable<ReturnType<typeof getPhoneActionLinks>>;
          } => Boolean(item.links),
        ),
    [selectedResidents],
  );

  const bulkWhatsappHref = useMemo(() => {
    if (selectedResidentsWithPhone.length === 0) {
      return null;
    }

    const lines = [
      `Salam, peringatan bayaran ${currentMonthLabel} untuk rumah berikut masih perlu tindakan:`,
      "",
      ...selectedResidentsWithPhone.map(
        ({ resident }) => `- ${resident.house_number} - ${resident.name}`,
      ),
      "",
      "Sila buat bayaran dan muat naik resit ke portal Desa Tanjung. Terima kasih.",
    ];

    return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [currentMonthLabel, selectedResidentsWithPhone]);

  const startItem =
    pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
  const noteResidents = residents.filter(
    (resident) => resident.currentPayment && !resident.currentPayment.id.startsWith("virtual-"),
  );
  const exportParams = new URLSearchParams({ month: currentMonth });

  if (deferredQuery.trim()) {
    exportParams.set("q", deferredQuery.trim());
  }

  if (statusFilter !== "all") {
    exportParams.set("status", statusFilter);
  }

  if (methodFilter !== "all") {
    exportParams.set("method", methodFilter);
  }

  const exportHref = `/admin/residents/export?${exportParams.toString()}`;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-white p-4 sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Resident directory
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Search, filter, and export the full matching resident list for {currentMonthLabel}.
          </p>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-4 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-end">
            <div>
              <label htmlFor="resident-search" className="mb-2 block text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                Search resident
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="resident-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search house, owner, address, or phone"
                  aria-describedby="resident-search-help resident-results-summary"
                  className="min-h-14 w-full rounded-2xl border border-line py-3 pl-11 pr-4 text-base text-slate-950 outline-none focus:border-primary"
                />
              </div>
              <p id="resident-search-help" className="mt-2 text-sm text-muted">
                Example: A-12, Nur Aisyah, Jalan Tanjung, or phone number.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                Payment method
              </label>
              <select
                value={methodFilter}
                onChange={(event) => {
                  const nextMethod = event.target.value as "all" | "online" | "cash";
                  setMethodFilter(nextMethod);
                  updateUrl({ method: nextMethod, page: 1 });
                }}
                aria-describedby="resident-results-summary"
                className="min-h-12 w-full rounded-full border border-line bg-white px-4 py-2 text-base font-bold text-slate-950 outline-none focus:border-primary lg:w-44"
              >
                {methodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <a
            href={exportHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white"
          >
            <Download className="h-4 w-4" />
            Export filtered CSV
          </a>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
            Status filter
          </p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStatusFilter(option.value);
                  updateUrl({ status: option.value, page: 1 });
                }}
                aria-pressed={statusFilter === option.value}
                aria-controls="resident-results-list"
                className={`min-h-11 rounded-full px-4 py-2 text-base font-bold transition ${
                  statusFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        id="resident-results-summary"
        className="border-b border-line bg-slate-50 px-4 py-3 text-base text-muted"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {startItem}-{endItem} of {pagination.totalItems} filtered residents for {currentMonthLabel}.
      </div>

      <div className="grid gap-3 border-b border-line bg-white p-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-800">
            Settled in list
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{summary.settledCount}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Reviewed records
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{summary.reviewedCount}</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-800">
            Need follow-up
          </p>
          <p className="mt-2 text-3xl font-bold text-rose-950">{summary.followUpCount}</p>
        </div>
      </div>

      <form
        action={bulkMarkCashPaymentAction}
        className="grid gap-4 border-b border-line bg-white px-4 py-4 xl:grid-cols-[1fr_auto] xl:items-center"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Bulk action</p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {selectedResidentIds.length} selected for bulk action
          </p>
          <p className="mt-1 text-sm text-muted">
            Select residents to mark cash paid or prepare one reminder draft for follow-up.
          </p>
        </div>
        <input type="hidden" name="month" value={currentMonth} />
        {selectedResidentIds.map((residentId) => (
          <input key={residentId} type="hidden" name="resident_ids" value={residentId} />
        ))}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {bulkWhatsappHref ? (
            <a
              href={bulkWhatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-bold whitespace-nowrap text-emerald-950 transition hover:bg-emerald-200"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp selected
            </a>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-center text-sm font-bold leading-tight whitespace-nowrap text-slate-500">
              Select residents with phones
            </span>
          )}
          <ConfirmSubmitButton
            confirmMessage={`Mark ${selectedResidentIds.length} selected residents as paid by cash?`}
            confirmTitle="Confirm bulk cash update"
            disabled={selectedResidentIds.length === 0}
            className="bg-slate-950 text-white"
          >
            Mark selected cash paid
          </ConfirmSubmitButton>
        </div>
      </form>

      <div id="resident-results-list" className="grid gap-3 bg-slate-50 p-3 md:hidden">
        {residents.map((resident) => (
          <article key={resident.id} className="rounded-3xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <label className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedResidentIds.includes(resident.id)}
                  onChange={() => toggleResident(resident.id)}
                  disabled={getStatus(resident) === "paid"}
                  className="mt-2 h-5 w-5 rounded border-line"
                  aria-label={`Select ${resident.house_number}`}
                />
                <span className="min-w-0">
                  <span className="inline-flex min-h-10 items-center rounded-2xl bg-slate-50 px-3 text-xl font-bold text-slate-950">
                    {resident.house_number}
                  </span>
                  <span className="mt-2 block truncate text-base font-bold text-slate-950">
                    {resident.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{resident.address}</span>
                </span>
              </label>
              <StatusBadge status={getDisplayStatus(resident)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-3xl bg-slate-50 p-3 text-sm">
              <div>
                <p className="font-bold uppercase tracking-[0.12em] text-slate-500">Phone</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {resident.phone_number
                    ? formatMalaysianPhoneNumber(resident.phone_number)
                    : "No phone"}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.12em] text-slate-500">Updated</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {resident.currentPayment
                    ? formatTimestamp(resident.currentPayment.updated_at)
                    : "No record"}
                </p>
              </div>
            </div>

            {resident.currentPayment?.reject_reason ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                Reject reason: {resident.currentPayment.reject_reason}
              </p>
            ) : null}

            {resident.currentPayment?.notes ? (
              <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
                Admin note: {resident.currentPayment.notes}
              </p>
            ) : null}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/admin/residents/${resident.id}?month=${currentMonth}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-white"
              >
                View detail
              </Link>
              {getStatus(resident) !== "paid" ? (
                <form action={markCashPaymentAction}>
                  <input type="hidden" name="resident_id" value={resident.id} />
                  <input type="hidden" name="month" value={currentMonth} />
                  <ConfirmSubmitButton
                    data-testid={`mobile-mark-cash-${resident.house_number}`}
                    confirmMessage={`Mark ${resident.house_number} as paid by cash for ${currentMonthLabel}?`}
                    confirmTitle="Confirm cash payment"
                    className="min-h-11 w-full rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    Mark cash
                  </ConfirmSubmitButton>
                </form>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
                  Settled
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyReminder(resident)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-950"
              >
                <Copy className="h-4 w-4" />
                {copiedResidentId === resident.id ? "Copied" : "Reminder"}
              </button>
              <ContactActions phoneNumber={resident.phone_number} compact />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base text-slate-800">
            {pagination.totalItems === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No residents matched this search or filter.
                </td>
              </tr>
            ) : (
              residents.map((resident) => (
                <tr key={resident.id} className="align-top hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedResidentIds.includes(resident.id)}
                        onChange={() => toggleResident(resident.id)}
                        disabled={getStatus(resident) === "paid"}
                        className="h-5 w-5 rounded border-line"
                        aria-label={`Select ${resident.house_number}`}
                      />
                      <span className="inline-flex min-h-10 min-w-12 items-center justify-center rounded-2xl bg-slate-50 px-3 text-lg font-bold text-slate-950">
                        {resident.house_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-950">{resident.name}</td>
                  <td className="px-4 py-4">{resident.address}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {resident.phone_number
                      ? formatMalaysianPhoneNumber(resident.phone_number)
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={getDisplayStatus(resident)} />
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-[16rem] space-y-2">
                      <div className="grid gap-2">
                        {getStatus(resident) === "pending" ? (
                          <Link
                            href={`/admin/approvals?month=${currentMonth}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-slate-950"
                          >
                            Review proof
                          </Link>
                        ) : null}

                        <Link
                          href={`/admin/residents/${resident.id}?month=${currentMonth}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-slate-950"
                        >
                          View detail
                        </Link>

                        {getStatus(resident) !== "paid" ? (
                          <form action={markCashPaymentAction}>
                            <input type="hidden" name="resident_id" value={resident.id} />
                            <input type="hidden" name="month" value={currentMonth} />
                            <ConfirmSubmitButton
                              data-testid={`mark-cash-${resident.house_number}`}
                              confirmMessage={`Mark ${resident.house_number} as paid by cash for ${currentMonthLabel}?`}
                              confirmTitle="Confirm cash payment"
                              className="min-h-10 w-full whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                            >
                              Mark paid cash
                            </ConfirmSubmitButton>
                          </form>
                        ) : (
                          <span className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-emerald-900">
                            Settled
                          </span>
                        )}
                      </div>

                      <div className="rounded-3xl bg-slate-50 px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyReminder(resident)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-teal-950"
                          >
                            <Copy className="h-4 w-4" />
                            {copiedResidentId === resident.id ? "Copied" : "Reminder"}
                          </button>
                          <ContactActions phoneNumber={resident.phone_number} compact />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line bg-white px-4 py-4">
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => updateUrl({ page })}
        />
      </div>

      <details className="border-t border-line bg-slate-50 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl bg-white px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Payment notes</p>
            <p className="mt-1 text-lg font-bold text-slate-950">Admin notes for this page</p>
            <p className="mt-1 text-sm text-muted">
              {noteResidents.length} editable payment records. Open only when handover notes are needed.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-950">
            Open notes
          </span>
        </summary>

        {noteResidents.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-line bg-white px-4 py-6 text-base text-slate-600">
            No real payment records are available on this page yet, so there are no notes to update.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {noteResidents.map((resident) => (
              <form
                key={resident.id}
                action={updatePaymentNotesAction}
                className="rounded-3xl border border-line bg-white p-4 shadow-sm"
              >
                <input type="hidden" name="payment_id" value={resident.currentPayment!.id} />
                <label className="block text-sm font-bold text-slate-950">
                  {resident.house_number} admin note
                </label>
                <textarea
                  name="notes"
                  defaultValue={resident.currentPayment?.notes ?? ""}
                  placeholder="Example: Paid to treasurer, receipt checked, waiting bank check"
                  className="mt-2 h-24 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
                />
                {resident.currentPayment?.reject_reason ? (
                  <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                    Reject reason: {resident.currentPayment.reject_reason}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="mt-3 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  Save note
                </button>
              </form>
            ))}
          </div>
        )}
      </details>
    </Card>
  );
}
