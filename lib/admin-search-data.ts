import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ManagedUser,
  PaymentRecord,
  UserActivityWithUser,
  UserProfile,
} from "@/lib/types";
import {
  createWarningMessage,
  getDisplayStatus,
  getSystemHealthWarnings,
} from "@/lib/data-helpers";
import { formatMonthLabel, getMonthKey } from "@/lib/utils";
import { getAppSettings, requireUserProfile } from "@/lib/data";

type SearchPaymentRecord = PaymentRecord & {
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number"> | null;
};

export async function getAdminSearchData(filterMonth?: string, rawQuery?: string) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const month = filterMonth ?? getMonthKey();
  const query = rawQuery?.trim() ?? "";
  const settings = await getAppSettings();
  const supabase = await createClient();
  const escapeForLike = (value: string) => value.replaceAll(",", " ").replaceAll("%", "");
  const likeQuery = `%${escapeForLike(query)}%`;

  const fetchResidents = async () => {
    const baseQuery = supabase
      .from("users")
      .select("id, house_number, email, name, address, phone_number, role, must_change_password, created_at, last_login_at, last_logout_at")
      .order("house_number", { ascending: true });

    if (!query) {
      return baseQuery;
    }

    return baseQuery
      .or(
        `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery},email.ilike.${likeQuery}`,
      )
      .limit(24);
  };

  const { data: residents, error: residentsError } = await fetchResidents();
  const residentRows = (residents as ManagedUser[] | null) ?? [];
  const matchedResidentIds = residentRows.map((resident) => resident.id);
  const dedupeById = <T extends { id: string }>(rows: T[]) =>
    Array.from(new Map(rows.map((row) => [row.id, row])).values());

  const paymentSearchSelect =
    "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason, users!payments_user_id_fkey(house_number, name, address, phone_number)";
  const activitySearchSelect = "id, user_id, action, message, created_at, users(house_number, name, role)";

  const fetchPaymentsByText = async () => {
    if (!query) {
      return supabase
        .from("payments")
        .select(paymentSearchSelect)
        .eq("month", month)
        .order("updated_at", { ascending: false });
    }

    return supabase
      .from("payments")
      .select(paymentSearchSelect)
      .eq("month", month)
      .or(`notes.ilike.${likeQuery},reject_reason.ilike.${likeQuery}`)
      .order("updated_at", { ascending: false })
      .limit(24);
  };

  const fetchPaymentsByResident = async () => {
    if (!query || matchedResidentIds.length === 0) {
      return { data: [], error: null };
    }

    return supabase
      .from("payments")
      .select(paymentSearchSelect)
      .eq("month", month)
      .in("user_id", matchedResidentIds)
      .order("updated_at", { ascending: false })
      .limit(24);
  };

  const fetchActivityByText = async () => {
    if (!query) {
      return supabase
        .from("user_activity_logs")
        .select(activitySearchSelect)
        .order("created_at", { ascending: false })
        .limit(60);
    }

    return supabase
      .from("user_activity_logs")
      .select(activitySearchSelect)
      .or(`message.ilike.${likeQuery},action.ilike.${likeQuery}`)
      .order("created_at", { ascending: false })
      .limit(24);
  };

  const fetchActivityByResident = async () => {
    if (!query || matchedResidentIds.length === 0) {
      return { data: [], error: null };
    }

    return supabase
      .from("user_activity_logs")
      .select(activitySearchSelect)
      .in("user_id", matchedResidentIds)
      .order("created_at", { ascending: false })
      .limit(24);
  };

  const [
    { data: paymentsByText, error: paymentsTextError },
    { data: paymentsByResident, error: paymentsResidentError },
    { data: activityByText, error: activityTextError },
    { data: activityByResident, error: activityResidentError },
  ] = await Promise.all([
    fetchPaymentsByText(),
    fetchPaymentsByResident(),
    fetchActivityByText(),
    fetchActivityByResident(),
  ]);

  const paymentsError = paymentsTextError ?? paymentsResidentError;
  const activityLogsError = activityTextError ?? activityResidentError;
  const mergedPayments = dedupeById(
    [
      ...((paymentsByResident as SearchPaymentRecord[] | null) ?? []),
      ...((paymentsByText as SearchPaymentRecord[] | null) ?? []),
    ],
  ).sort((left, right) => right.updated_at.localeCompare(left.updated_at));
  const mergedActivityLogs = dedupeById(
    [
      ...((activityByResident as UserActivityWithUser[] | null) ?? []),
      ...((activityByText as UserActivityWithUser[] | null) ?? []),
    ],
  ).sort((left, right) => right.created_at.localeCompare(left.created_at));

  const warnings = [
    ...getSystemHealthWarnings(settings),
    ...(residentsError ? [createWarningMessage("Users", residentsError.message)] : []),
    ...(paymentsError ? [createWarningMessage("Payments", paymentsError.message)] : []),
    ...(activityLogsError ? [createWarningMessage("Activity log", activityLogsError.message)] : []),
  ];

  return {
    profile,
    currentMonth: month,
    currentMonthLabel: formatMonthLabel(month),
    searchQuery: query,
    residents: residentRows,
    payments:
      mergedPayments.map((payment) => ({
        ...payment,
        display_status: getDisplayStatus(payment.status, payment.month, settings.due_day),
        is_overdue: getDisplayStatus(payment.status, payment.month, settings.due_day) === "overdue",
      })) ?? [],
    activityLogs: mergedActivityLogs,
    warnings,
  };
}
