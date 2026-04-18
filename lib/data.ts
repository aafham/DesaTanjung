import { cache } from "react";
import { redirect } from "next/navigation";
import { PAYMENT_BUCKET } from "@/lib/constants";
import type {
  AnnouncementAudience,
  AnnouncementRecord,
  AppSettings,
  DisplayPaymentStatus,
  ManagedUser,
  NotificationRecord,
  PaymentAuditLog,
  PaymentRecord,
  ResidentPaymentRecord,
  ResidentWithPayment,
  UserActivityWithUser,
  UserActivityLog,
  UserProfile,
} from "@/lib/types";
import {
  formatDateLabel,
  formatMonthLabel,
  getDueDateForMonth,
  getMonthKey,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type PendingApprovalPayment = ResidentPaymentRecord & {
  status: "pending" | "rejected";
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number">;
  auditLogs?: PaymentAuditLog[];
};

type ManagedAnnouncement = AnnouncementRecord;

function createWarningMessage(scope: string, message: string) {
  return `${scope}: ${message}`;
}

function getDisplayStatus(
  status: PaymentRecord["status"] | null | undefined,
  month: string,
  dueDay: number,
): DisplayPaymentStatus {
  const resolvedStatus = status ?? "unpaid";

  if (resolvedStatus === "paid" || resolvedStatus === "pending" || resolvedStatus === "rejected") {
    return resolvedStatus;
  }

  return new Date() > getDueDateForMonth(month, dueDay) ? "overdue" : resolvedStatus;
}

function enrichPaymentRecord(
  payment: PaymentRecord | null,
  month: string,
  dueDay: number,
): ResidentPaymentRecord | null {
  if (!payment) {
    const displayStatus = getDisplayStatus("unpaid", month, dueDay);

    return {
      id: `virtual-${month}`,
      user_id: "",
      month,
      status: "unpaid",
      proof_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      payment_method: "online",
      notes: null,
      reject_reason: null,
      display_status: displayStatus,
      is_overdue: displayStatus === "overdue",
    };
  }

  const displayStatus = getDisplayStatus(payment.status, payment.month, dueDay);

  return {
    ...payment,
    display_status: displayStatus,
    is_overdue: displayStatus === "overdue",
  };
}

export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, house_number, name, address, phone_number, role, must_change_password")
    .eq("id", user.id)
    .single();

  if (error) {
    return null;
  }

  return (data as UserProfile | null) ?? null;
});

export async function requireUserProfile() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function ensureCurrentMonthPayment(userId: string) {
  const supabase = await createClient();
  const month = getMonthKey();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (!existing) {
    await supabase.from("payments").insert({
      user_id: userId,
      month,
      status: "unpaid",
      payment_method: "online",
    });
  }
}

export async function getUserDashboardData() {
  const profile = await requireUserProfile();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  await ensureCurrentMonthPayment(profile.id);

  const supabase = await createClient();
  const settings = await getAppSettings();
  const currentMonth = getMonthKey();
  const warnings: string[] = [];
  const { data: currentPayment, error: currentPaymentError } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
    )
    .eq("user_id", profile.id)
    .eq("month", currentMonth)
    .single();
  if (currentPaymentError) {
    warnings.push(createWarningMessage("Current payment", currentPaymentError.message));
  }

  const { data: history, error: historyError } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
    )
    .eq("user_id", profile.id)
    .order("month", { ascending: false });
  if (historyError) {
    warnings.push(createWarningMessage("Payment history", historyError.message));
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select("id, user_id, payment_id, message, is_read, scope, created_at")
    .eq("user_id", profile.id)
    .eq("scope", "resident")
    .order("created_at", { ascending: false })
    .limit(8);
  if (notificationsError) {
    warnings.push(createWarningMessage("Notifications", notificationsError.message));
  }

  const signedProof = currentPayment?.proof_url
    ? await getSignedReceiptUrl(currentPayment.proof_url)
    : null;
  const resolvedCurrentPayment = enrichPaymentRecord(
    (currentPayment as PaymentRecord | null) ?? null,
    currentMonth,
    settings.due_day,
  ) as ResidentPaymentRecord;

  const { data: auditLogs, error: auditError } = await supabase
    .from("payment_audit_logs")
    .select("id, payment_id, user_id, actor_id, action, message, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);
  if (auditError) {
    warnings.push(createWarningMessage("Activity log", auditError.message));
  }

  const announcements = await getAnnouncements({
    audience: "residents",
    limit: 4,
  });

  return {
    currentMonth,
    currentMonthLabel: formatMonthLabel(currentMonth),
    dueDateLabel: formatDateLabel(getDueDateForMonth(currentMonth, settings.due_day)),
    currentPayment: resolvedCurrentPayment,
    currentProofUrl: signedProof,
    history: ((history as PaymentRecord[] | null) ?? []).map((payment) =>
      enrichPaymentRecord(payment, payment.month, settings.due_day),
    ) as ResidentPaymentRecord[],
    notifications: (notifications as NotificationRecord[] | null) ?? [],
    auditLogs: (auditLogs as PaymentAuditLog[] | null) ?? [],
    announcements,
    settings,
    profile,
    warnings,
  };
}

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
      .select("id, house_number, name, address, phone_number, role, must_change_password")
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
  const warnings: string[] = [];

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
    (((pendingPayments as Array<
      PendingApprovalPayment
    > | null) ?? [])).map(async (payment) => ({
      ...payment,
      display_status: payment.status,
      is_overdue: false,
      signedProofUrl: payment.proof_url
        ? await getSignedReceiptUrl(payment.proof_url)
        : null,
      auditLogs: await getPaymentAuditLogs(payment.id),
    })),
  );

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
    warnings,
  };
}

export async function getAnnouncements({
  audience = "all",
  limit = 8,
}: {
  audience?: AnnouncementAudience;
  limit?: number;
}) {
  const supabase = await createClient();
  const audiences =
    audience === "all" ? ["all", "residents", "admins"] : ["all", audience];

  const { data, error } = await supabase
    .from("announcements")
    .select(
      "id, title, body, audience, is_pinned, created_by, published_at, created_at, updated_at",
    )
    .in("audience", audiences)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data as ManagedAnnouncement[] | null) ?? [];
}

export async function getResidentNotifications(userId: string, limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, payment_id, message, is_read, scope, created_at")
    .eq("user_id", userId)
    .eq("scope", "resident")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data as NotificationRecord[] | null) ?? [];
}

export async function getPaymentAuditLogs(paymentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_audit_logs")
    .select("id, payment_id, user_id, actor_id, action, message, created_at")
    .eq("payment_id", paymentId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data as PaymentAuditLog[] | null) ?? [];
}

export async function getAppSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select(
      "community_name, bank_name, bank_account_name, bank_account_number, payment_qr_url, monthly_fee, due_day",
    )
    .eq("id", true)
    .maybeSingle();

  return ((data as AppSettings | null) ?? {
    community_name: "Desa Tanjung",
    bank_name: process.env.NEXT_PUBLIC_BANK_NAME ?? "Maybank",
    bank_account_name:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Persatuan Penduduk Desa Tanjung",
    bank_account_number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "1234567890",
    payment_qr_url:
      process.env.NEXT_PUBLIC_PAYMENT_QR_URL ??
      "https://placehold.co/600x600/png?text=QR+Payment",
    monthly_fee: null,
    due_day: 7,
  }) as AppSettings;
}

export async function getAdminSettingsData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  return {
    profile,
    settings: await getAppSettings(),
  };
}

export async function getAdminUserManagementData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const [{ data: users }, { data: activityLogs }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, house_number, email, name, address, phone_number, role, must_change_password, created_at, last_login_at, last_logout_at",
      )
      .order("role", { ascending: false })
      .order("house_number", { ascending: true }),
    supabase
      .from("user_activity_logs")
      .select("id, user_id, action, message, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const logsByUser = new Map<string, UserActivityLog[]>();

  for (const log of ((activityLogs as UserActivityLog[] | null) ?? [])) {
    const current = logsByUser.get(log.user_id) ?? [];

    if (current.length < 6) {
      current.push(log);
      logsByUser.set(log.user_id, current);
    }
  }

  return {
    profile,
    users: (((users as ManagedUser[] | null) ?? []).map((user) => ({
      ...user,
      activityLogs: logsByUser.get(user.id) ?? [],
    }))),
  };
}

export async function getAdminActivityLogData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_activity_logs")
    .select("id, user_id, action, message, created_at, users(house_number, name, role)")
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    profile,
    activityLogs: (data as UserActivityWithUser[] | null) ?? [],
    warnings: error ? [createWarningMessage("Activity log", error.message)] : [],
  };
}

export async function getAdminAnnouncementsData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  return {
    profile,
    announcements: await getAnnouncements({ audience: "all", limit: 20 }),
    warnings: [] as string[],
  };
}

export async function getAdminReportData(filterMonth?: string) {
  const adminData = await getAdminDashboardData(filterMonth);
  const { residents, currentMonth, settings } = adminData;

  const paidResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "paid",
  );
  const pendingResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "pending",
  );
  const overdueResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "overdue",
  );
  const rejectedResidents = residents.filter(
    (resident) => resident.currentPayment?.status === "rejected",
  );
  const unpaidResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "unpaid",
  );
  const unsettledResidents = residents.filter((resident) => {
    const displayStatus = resident.currentPayment?.display_status ?? "unpaid";
    return !["paid", "pending"].includes(displayStatus);
  });
  const monthlyFee = settings.monthly_fee ?? 0;

  return {
    ...adminData,
    totals: {
      totalResidents: residents.length,
      paidCount: paidResidents.length,
      pendingCount: pendingResidents.length,
      overdueCount: overdueResidents.length,
      rejectedCount: rejectedResidents.length,
      unpaidCount: unpaidResidents.length,
      expectedCollection: monthlyFee * residents.length,
      collectedAmount: monthlyFee * paidResidents.length,
      unsettledCount: unsettledResidents.length,
      outstandingAmount: monthlyFee * unsettledResidents.length,
    },
    currentMonth,
  };
}

export async function getAdminResidentDetailData(residentId: string, filterMonth?: string) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const month = filterMonth ?? getMonthKey();
  const supabase = await createClient();
  const settings = await getAppSettings();

  const [{ data: resident }, { data: history }, { data: payment }, { data: auditLogs }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, house_number, email, name, address, phone_number, role, must_change_password")
        .eq("id", residentId)
        .single(),
      supabase
        .from("payments")
        .select(
          "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
        )
        .eq("user_id", residentId)
        .order("month", { ascending: false }),
      supabase
        .from("payments")
        .select(
          "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
        )
        .eq("user_id", residentId)
        .eq("month", month)
        .maybeSingle(),
      supabase
        .from("payment_audit_logs")
        .select("id, payment_id, user_id, actor_id, action, message, created_at")
        .eq("user_id", residentId)
        .order("created_at", { ascending: false })
        .limit(16),
    ]);
  const warnings: string[] = [];

  if (!resident) {
    redirect("/admin/residents");
  }

  const resolvedPayment = enrichPaymentRecord(
    (payment as PaymentRecord | null) ?? null,
    month,
    settings.due_day,
  );
  const signedProof = payment?.proof_url ? await getSignedReceiptUrl(payment.proof_url) : null;

  return {
    profile,
    resident: resident as ManagedUser,
    currentMonth: month,
    currentMonthLabel: formatMonthLabel(month),
    dueDateLabel: formatDateLabel(getDueDateForMonth(month, settings.due_day)),
    currentPayment: resolvedPayment,
    currentProofUrl: signedProof,
    history: ((history as PaymentRecord[] | null) ?? []).map((entry) =>
      enrichPaymentRecord(entry, entry.month, settings.due_day),
    ) as ResidentPaymentRecord[],
    auditLogs: (auditLogs as PaymentAuditLog[] | null) ?? [],
    settings,
    warnings,
  };
}

export async function getSignedReceiptUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}
