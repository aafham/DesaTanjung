"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { markCashPaymentAction } from "@/lib/actions";
import type { PaymentRecord, PaymentStatus, UserProfile } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type ResidentWithPayment = UserProfile & {
  currentPayment: PaymentRecord | null;
};

const filterOptions: Array<{ label: string; value: "all" | PaymentStatus }> = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Rejected", value: "rejected" },
];

function getStatus(resident: ResidentWithPayment): PaymentStatus {
  return resident.currentPayment?.status ?? "unpaid";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const deferredQuery = useDeferredValue(query);

  const filteredResidents = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return residents.filter((resident) => {
      const status = getStatus(resident);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !normalized ||
        resident.house_number.toLowerCase().includes(normalized) ||
        resident.name.toLowerCase().includes(normalized) ||
        resident.address.toLowerCase().includes(normalized);

      return matchesStatus && matchesSearch;
    });
  }, [deferredQuery, residents, statusFilter]);

  const csvHref = useMemo(() => {
    const rows = [
      ["House", "Owner", "Address", "Status", "Updated", "Payment method"],
      ...filteredResidents.map((resident) => [
        resident.house_number,
        resident.name,
        resident.address,
        getStatus(resident),
        resident.currentPayment ? formatTimestamp(resident.currentPayment.updated_at) : "No record yet",
        resident.currentPayment?.payment_method ?? "-",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [filteredResidents]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 border-b border-line p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label htmlFor="resident-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search resident
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="resident-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by house, owner, or address"
              className="w-full rounded-2xl border border-line py-3 pl-11 pr-4 outline-none focus:border-primary"
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
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <a
            href={csvHref}
            download={`desa-tanjung-${currentMonth}-payments.csv`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="border-b border-line bg-slate-50 px-4 py-3 text-sm text-muted">
        Showing {filteredResidents.length} of {residents.length} residents for {currentMonthLabel}.
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.18em] text-muted">
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm text-slate-700">
            {filteredResidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No residents matched this search or filter.
                </td>
              </tr>
            ) : (
              filteredResidents.map((resident) => (
                <tr key={resident.id} className="align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">{resident.house_number}</td>
                  <td className="px-4 py-4">{resident.name}</td>
                  <td className="px-4 py-4">{resident.address}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={getStatus(resident)} />
                  </td>
                  <td className="px-4 py-4">
                    {resident.currentPayment
                      ? formatTimestamp(resident.currentPayment.updated_at)
                      : "No record yet"}
                  </td>
                  <td className="px-4 py-4">
                    <form action={markCashPaymentAction}>
                      <input type="hidden" name="resident_id" value={resident.id} />
                      <input type="hidden" name="month" value={currentMonth} />
                      <ConfirmSubmitButton
                        confirmMessage={`Mark ${resident.house_number} as paid by cash for ${currentMonthLabel}?`}
                        className="whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                      >
                        Mark paid (cash)
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
