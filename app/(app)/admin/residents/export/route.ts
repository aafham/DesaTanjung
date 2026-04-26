import type { PaymentRecord, PaymentStatus, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel, formatTimestamp, getDueDateForMonth, getMonthKey } from "@/lib/utils";

const EXPORT_LIMIT = 5000;
const STATUS_FILTERS = ["all", "paid", "pending", "unpaid", "overdue", "rejected"] as const;
const METHOD_FILTERS = ["all", "online", "cash"] as const;

type DisplayStatus = PaymentStatus | "overdue";

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeLikeTerm(value: string) {
  return value.replaceAll(",", " ").replaceAll("%", "");
}

function sanitizeFilter<T extends readonly string[]>(
  value: string | null,
  allowedValues: T,
  fallback: T[number],
): T[number] {
  return allowedValues.includes(value ?? "") ? (value as T[number]) : fallback;
}

function getDisplayStatus(
  status: PaymentRecord["status"] | null | undefined,
  month: string,
  dueDay: number,
): DisplayStatus {
  const resolvedStatus = status ?? "unpaid";

  if (resolvedStatus === "paid" || resolvedStatus === "pending" || resolvedStatus === "rejected") {
    return resolvedStatus;
  }

  return new Date() > getDueDateForMonth(month, dueDay) ? "overdue" : resolvedStatus;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Login required.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, must_change_password")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.must_change_password) {
    return new Response("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? getMonthKey();
  const query = (url.searchParams.get("q") ?? "").trim();
  const statusFilter = sanitizeFilter(url.searchParams.get("status"), STATUS_FILTERS, "all");
  const methodFilter = sanitizeFilter(url.searchParams.get("method"), METHOD_FILTERS, "all");

  const { data: settings } = await supabase
    .from("app_settings")
    .select("due_day")
    .eq("id", true)
    .single();
  const dueDay = settings?.due_day ?? 7;

  let residentsQuery = supabase
    .from("users")
    .select("id, house_number, name, address, phone_number, role, must_change_password")
    .eq("role", "user")
    .order("house_number", { ascending: true })
    .limit(EXPORT_LIMIT);

  if (query) {
    const likeQuery = `%${escapeLikeTerm(query)}%`;
    residentsQuery = residentsQuery.or(
      `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery}`,
    );
  }

  const { data: residents, error: residentsError } = await residentsQuery;

  if (residentsError) {
    return new Response(residentsError.message, { status: 500 });
  }

  const residentList = (residents as UserProfile[] | null) ?? [];
  const residentIds = residentList.map((resident) => resident.id);
  const { data: payments, error: paymentsError } = residentIds.length
    ? await supabase
        .from("payments")
        .select(
          "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
        )
        .eq("month", month)
        .in("user_id", residentIds)
    : { data: [], error: null };

  if (paymentsError) {
    return new Response(paymentsError.message, { status: 500 });
  }

  const paymentsByUserId = new Map(
    ((payments as PaymentRecord[] | null) ?? []).map((payment) => [payment.user_id, payment]),
  );
  const filteredResidents = residentList
    .map((resident) => {
      const payment = paymentsByUserId.get(resident.id) ?? null;
      const recordStatus = payment?.status ?? "unpaid";
      const displayStatus = getDisplayStatus(recordStatus, month, dueDay);
      const paymentMethod = payment?.payment_method ?? "-";

      return {
        resident,
        payment,
        recordStatus,
        displayStatus,
        paymentMethod,
      };
    })
    .filter((entry) => {
      const matchesStatus =
        statusFilter === "all" ||
        entry.recordStatus === statusFilter ||
        entry.displayStatus === statusFilter;
      const matchesMethod = methodFilter === "all" || entry.payment?.payment_method === methodFilter;

      return matchesStatus && matchesMethod;
    });

  const rows = [
    ["Month", "House", "Owner", "Address", "Phone", "Display status", "Record status", "Updated", "Payment method", "Note", "Reject reason"],
    ...filteredResidents.map(({ resident, payment, recordStatus, displayStatus, paymentMethod }) => [
      formatMonthLabel(month),
      resident.house_number,
      resident.name,
      resident.address,
      resident.phone_number ?? "",
      displayStatus,
      recordStatus,
      payment ? formatTimestamp(payment.updated_at) : "No record yet",
      paymentMethod,
      payment?.notes ?? "",
      payment?.reject_reason ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const filename = `desa-tanjung-residents-${month}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
