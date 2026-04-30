import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ManagedUser,
  NotificationRecord,
  PaymentAuditLog,
  PaymentRecord,
  ResidentPaymentRecord,
  ResidentWithPayment,
  UserActivityWithUser,
  UserProfile,
} from "@/lib/types";
import {
  createWarningMessage,
  enrichPaymentRecord,
  getSystemHealthWarnings,
} from "@/lib/data-helpers";
import {
  formatDateLabel,
  formatMonthLabel,
  getDueDateForMonth,
  getMonthKey,
} from "@/lib/utils";
import {
  getAnnouncements,
  getAppSettings,
  getPaymentAuditLogs,
  getSignedReceiptUrl,
  requireUserProfile,
} from "@/lib/data";

type PendingApprovalPayment = ResidentPaymentRecord & {
  status: "pending" | "rejected";
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number">;
  auditLogs?: PaymentAuditLog[];
};

export async function getAdminDashboardData(filterMonth?: string) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const month = filterMonth ?? getMonthKey();

  const [
    { data: pendingPayments, error: pendingPaymentsError },
    { data: notifications, error: notificationsError },
    { data: residents, error: residentsError },
    { data: monthlyRecords, error: monthlyRecordsError },
    { data: recentActivity, error: recentActivityError },
    settings,
    announcements,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason, users!payments_user_id_fkey(house_number, name, address, phone_number)",
      )
      .eq("month", month)
      .in("status", ["pending", "rejected"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, user_id, payment_id, message, is_read, scope, created_at")
      .eq("scope", "admin")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("users")
      .select("id, house_number, name, address, phone_number, role, must_change_password, last_login_at")
      .eq("role", "user")
      .order("house_number", { ascending: true }),
    supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
      )
      .eq("month", month),
    supabase
      .from("user_activity_logs")
      .select("id, user_id, action, message, created_at, users(house_number, name, role)")
      .order("created_at", { ascending: false })
      .limit(12),
    getAppSettings(),
    getAnnouncements({
      audience: "admins",
      limit: 5,
    }),
  ]);
  const warnings: string[] = [...getSystemHealthWarnings(settings)];

  if (pendingPaymentsError) {
    warnings.push(createWarningMessage("Approval queue", pendingPaymentsError.message));
  }
  if (notificationsError) {
    warnings.push(createWarningMessage("Notifications", notificationsError.message));
  }
  if (residentsError) {
    warnings.push(createWarningMessage("Residents", residentsError.message));
  }
  if (monthlyRecordsError) {
    warnings.push(createWarningMessage("Monthly records", monthlyRecordsError.message));
  }
  if (recentActivityError) {
    warnings.push(createWarningMessage("Recent resident activity", recentActivityError.message));
  }

  const residentRows = ((residents as UserProfile[] | null) ?? []).map((resident) => {
    const currentPayment =
      (monthlyRecords as PaymentRecord[] | null)?.find((payment) => payment.user_id === resident.id) ??
      null;

    return {
      ...resident,
      currentPayment: enrichPaymentRecord(currentPayment, month, settings.due_day),
    } satisfies ResidentWithPayment;
  });

  const pendingWithReceipts = await Promise.all(
    (((pendingPayments as Array<PendingApprovalPayment> | null) ?? [])).map(async (payment) => ({
      ...payment,
      display_status: payment.status,
      is_overdue: false,
      signedProofUrl: payment.proof_url ? await getSignedReceiptUrl(payment.proof_url) : null,
      auditLogs: await getPaymentAuditLogs(payment.id),
    })),
  );

  const residentDirectory = (residents as ManagedUser[] | null) ?? [];
  const missingPhoneCount = residentDirectory.filter((resident) => !resident.phone_number).length;
  const neverLoggedInCount = residentDirectory.filter((resident) => !resident.last_login_at).length;

  return {
    currentMonth: month,
    currentMonthLabel: formatMonthLabel(month),
    dueDateLabel: formatDateLabel(getDueDateForMonth(month, settings.due_day)),
    settings,
    profile,
    pendingPayments: pendingWithReceipts,
    notifications: (notifications as NotificationRecord[] | null) ?? [],
    residents: residentRows,
    recentActivity: (recentActivity as UserActivityWithUser[] | null) ?? [],
    announcements,
    onboardingSummary: {
      missingPhoneCount,
      neverLoggedInCount,
    },
    warnings,
  };
}
