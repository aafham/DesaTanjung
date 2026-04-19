"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
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

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function AdminResidentsTable({
  residents,
  currentMonth,
  currentMonthLabel,
}: {
  residents: ResidentWithPayment[];
  currentMonth: string;
  currentMonthLabel: string;
}) {
  const PAGE_SIZE = 5;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus | "overdue">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "online" | "cash">("all");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [copiedResidentId, setCopiedResidentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filteredResidents = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return residents.filter((resident) => {
      const status = getStatus(resident);
      const displayStatus = getDisplayStatus(resident);
      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter ||
        displayStatus === statusFilter;
      const matchesMethod =
        methodFilter === "all" || resident.currentPayment?.payment_method === methodFilter;
      const matchesSearch =
        !normalized ||
        resident.house_number.toLowerCase().includes(normalized) ||
        resident.name.toLowerCase().includes(normalized) ||
        resident.address.toLowerCase().includes(normalized) ||
        resident.phone_number?.toLowerCase().includes(normalized);

      return matchesStatus && matchesMethod && matchesSearch;
    });
  }, [deferredQuery, methodFilter, residents, statusFilter]);

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

  const csvHref = useMemo(() => {
    const rows = [
      ["House", "Owner", "Address", "Phone", "Status", "Updated", "Payment method"],
      ...filteredResidents.map((resident) => [
        resident.house_number,
        resident.name,
        resident.address,
        resident.phone_number ?? "",
        getDisplayStatus(resident),
        resident.currentPayment ? formatTimestamp(resident.currentPayment.updated_at) : "No record yet",
        resident.currentPayment?.payment_method ?? "-",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [filteredResidents]);

  const selectedResidents = useMemo(
    () => filteredResidents.filter((resident) => selectedResidentIds.includes(resident.id)),
    [filteredResidents, selectedResidentIds],
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

  const settledCount = filteredResidents.filter(
    (resident) => getDisplayStatus(resident) === "paid",
  ).length;
  const followUpCount = filteredResidents.filter((resident) =>
    ["unpaid", "overdue", "rejected"].includes(getDisplayStatus(resident)),
  ).length;
  const reviewedCount = filteredResidents.filter((resident) =>
    ["paid", "rejected"].includes(getStatus(resident)),
  ).length;
  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, methodFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredResidents.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredResidents]);
  const startItem = filteredResidents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredResidents.length);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 border-b border-line p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label htmlFor="resident-search" className="mb-2 block text-base font-bold text-slate-950">
            Search resident
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="resident-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by house, owner, address, or phone number"
              className="min-h-14 w-full rounded-2xl border border-line py-3 pl-11 pr-4 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
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

          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value as "all" | "online" | "cash")}
            className="min-h-12 rounded-full border border-line bg-white px-4 py-2 text-base font-bold text-slate-950 outline-none focus:border-primary"
          >
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <a
            href={csvHref}
            download={`desa-tanjung-${currentMonth}-payments.csv`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="border-b border-line bg-slate-50 px-4 py-3 text-base text-muted">
        Showing {startItem}-{endItem} of {filteredResidents.length} filtered residents for {currentMonthLabel}.
      </div>

      <div className="grid gap-3 border-b border-line bg-white p-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-800">
            Settled in list
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{settledCount}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">
            Reviewed records
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{reviewedCount}</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-800">
            Need follow-up
          </p>
          <p className="mt-2 text-3xl font-bold text-rose-950">{followUpCount}</p>
        </div>
      </div>

      <form
        action={bulkMarkCashPaymentAction}
        className="flex flex-col gap-3 border-b border-line bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-bold text-slate-950">Bulk action</p>
          <p className="text-sm text-muted">
            Select residents to mark cash paid or prepare one reminder draft for follow-up.
          </p>
        </div>
        <input type="hidden" name="month" value={currentMonth} />
        {selectedResidentIds.map((residentId) => (
          <input key={residentId} type="hidden" name="resident_ids" value={residentId} />
        ))}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
              Select residents with phone numbers
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

      <div className="grid gap-4 p-4 md:hidden">
        {paginatedResidents.map((resident) => (
          <details key={resident.id} className="rounded-3xl border border-line bg-white p-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <div>
                <p className="text-2xl font-bold text-slate-950">{resident.house_number}</p>
                <p className="text-base text-muted">{resident.name}</p>
                <span className="sr-only">Press Enter or Space to expand resident details.</span>
              </div>
              <StatusBadge status={getDisplayStatus(resident)} />
            </summary>

            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <p className="text-base text-slate-800">{resident.address}</p>
              <p className="text-sm font-medium text-muted">
                {resident.phone_number
                  ? formatMalaysianPhoneNumber(resident.phone_number)
                  : "No phone number saved yet"}
              </p>
              <ContactActions phoneNumber={resident.phone_number} compact className="pt-1" />
              <Link
                href={`/admin/residents/${resident.id}?month=${currentMonth}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-white"
              >
                Open resident detail
              </Link>
              <p className="text-sm font-medium text-muted">
                Updated:{" "}
                {resident.currentPayment
                  ? formatTimestamp(resident.currentPayment.updated_at)
                  : "No record yet"}
              </p>
              {resident.currentPayment?.reject_reason ? (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-base font-bold text-rose-900">
                  Reject reason: {resident.currentPayment.reject_reason}
                </p>
              ) : null}
              {resident.currentPayment?.notes ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-base text-slate-800">
                  Admin note: {resident.currentPayment.notes}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => copyReminder(resident)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-teal-950"
              >
                <Copy className="h-4 w-4" />
                {copiedResidentId === resident.id ? "Copied reminder" : "Copy reminder"}
              </button>
            </div>
          </details>
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
            {filteredResidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No residents matched this search or filter.
                </td>
              </tr>
            ) : (
              paginatedResidents.map((resident) => (
                <tr key={resident.id} className="align-top">
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedResidentIds.includes(resident.id)}
                        onChange={() => toggleResident(resident.id)}
                        disabled={getStatus(resident) === "paid"}
                        className="h-5 w-5 rounded border-line"
                        aria-label={`Select ${resident.house_number}`}
                      />
                      <span className="text-lg font-bold text-slate-950">
                        {resident.house_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-semibold text-slate-950">{resident.name}</td>
                  <td className="px-4 py-4">{resident.address}</td>
                  <td className="px-4 py-4">
                    {resident.phone_number
                      ? formatMalaysianPhoneNumber(resident.phone_number)
                      : "-"}
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge status={getDisplayStatus(resident)} />
                  </td>
                  <td className="px-4 py-5">
                    {resident.currentPayment
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-2">
                      {getStatus(resident) === "pending" ? (
                        <Link
                          href={`/admin/approvals?month=${currentMonth}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-slate-950"
                        >
                          Review proof
                        </Link>
                      ) : null}

                      <Link
                        href={`/admin/residents/${resident.id}?month=${currentMonth}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-slate-950"
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
                            className="w-full whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                          >
                            Mark paid cash
                          </ConfirmSubmitButton>
                        </form>
                      ) : (
                        <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-emerald-900">
                          Settled
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => copyReminder(resident)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-center text-sm font-bold leading-tight whitespace-nowrap text-teal-950"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedResidentId === resident.id ? "Copied" : "Reminder"}
                      </button>
                      <ContactActions phoneNumber={resident.phone_number} compact />
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
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="border-t border-line bg-slate-50 p-4">
        <p className="mb-3 text-base font-bold text-slate-950">Payment notes</p>
        {paginatedResidents.filter((resident) => resident.currentPayment).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-4 py-6 text-base text-slate-600">
            No payment records are available on this page yet, so there are no notes to update.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {paginatedResidents
              .filter((resident) => resident.currentPayment)
              .map((resident) => (
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
      </div>
    </Card>
  );
}
