import { redirect } from "next/navigation";
import {
  formatDateLabel,
  formatMonthLabel,
  getDueDateForMonth,
  getMonthKey,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type {
  NotificationRecord,
  PaymentAuditLog,
  PaymentRecord,
  ResidentPaymentRecord,
} from "@/lib/types";
import {
  createWarningMessage,
  enrichPaymentRecord,
  getSystemHealthWarnings,
} from "@/lib/data-helpers";
import {
  ensureCurrentMonthPayment,
  getAnnouncements,
  getAppSettings,
  getSignedReceiptUrl,
  requireUserProfile,
} from "@/lib/data";

export async function getUserDashboardData(historyPage = 1, historyPageSize = 6) {
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
  const warnings: string[] = [...getSystemHealthWarnings(settings)];
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

  const safeHistoryPage = Math.max(1, historyPage);
  const safeHistoryPageSize = Math.min(Math.max(1, historyPageSize), 12);
  const historyFrom = (safeHistoryPage - 1) * safeHistoryPageSize;
  const historyTo = historyFrom + safeHistoryPageSize - 1;
  let { data: history, error: historyError, count: historyCount } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
      { count: "exact" },
    )
    .eq("user_id", profile.id)
    .order("month", { ascending: false })
    .range(historyFrom, historyTo);
  let resolvedHistoryPage = safeHistoryPage;
  const historyTotalPages = Math.max(1, Math.ceil((historyCount ?? 0) / safeHistoryPageSize));

  if (!historyError && (historyCount ?? 0) > 0 && safeHistoryPage > historyTotalPages) {
    resolvedHistoryPage = historyTotalPages;
    const correctedFrom = (resolvedHistoryPage - 1) * safeHistoryPageSize;
    const correctedTo = correctedFrom + safeHistoryPageSize - 1;
    const correctedHistory = await supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
        { count: "exact" },
      )
      .eq("user_id", profile.id)
      .order("month", { ascending: false })
      .range(correctedFrom, correctedTo);

    history = correctedHistory.data;
    historyError = correctedHistory.error;
    historyCount = correctedHistory.count;
  }
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
    history: await Promise.all(
      (((history as PaymentRecord[] | null) ?? []).map(async (payment) => ({
        ...(enrichPaymentRecord(payment, payment.month, settings.due_day) as ResidentPaymentRecord),
        signed_proof_url: payment.proof_url
          ? await getSignedReceiptUrl(payment.proof_url)
          : null,
      }))),
    ),
    historyPagination: {
      currentPage: resolvedHistoryPage,
      pageSize: safeHistoryPageSize,
      totalItems: historyCount ?? 0,
      totalPages: Math.max(1, Math.ceil((historyCount ?? 0) / safeHistoryPageSize)),
    },
    notifications: (notifications as NotificationRecord[] | null) ?? [],
    auditLogs: (auditLogs as PaymentAuditLog[] | null) ?? [],
    announcements,
    settings,
    profile,
    warnings,
  };
}

export async function getResidentPaymentPageData() {
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
  const warnings: string[] = [...getSystemHealthWarnings(settings)];

  const [
    { data: currentPayment, error: currentPaymentError },
    { data: notifications, error: notificationsError },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
      )
      .eq("user_id", profile.id)
      .eq("month", currentMonth)
      .single(),
    supabase
      .from("notifications")
      .select("id, user_id, payment_id, message, is_read, scope, created_at")
      .eq("user_id", profile.id)
      .eq("scope", "resident")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (currentPaymentError) {
    warnings.push(createWarningMessage("Current payment", currentPaymentError.message));
  }

  if (notificationsError) {
    warnings.push(createWarningMessage("Notifications", notificationsError.message));
  }

  return {
    currentMonth,
    currentMonthLabel: formatMonthLabel(currentMonth),
    dueDateLabel: formatDateLabel(getDueDateForMonth(currentMonth, settings.due_day)),
    currentPayment: enrichPaymentRecord(
      (currentPayment as PaymentRecord | null) ?? null,
      currentMonth,
      settings.due_day,
    ) as ResidentPaymentRecord,
    notifications: (notifications as NotificationRecord[] | null) ?? [],
    profile,
    settings,
    warnings,
  };
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

async function getResidentNotificationsPage(userId: string, page = 1, pageSize = 10) {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 20);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  let { data, error, count } = await supabase
    .from("notifications")
    .select("id, user_id, payment_id, message, is_read, scope, created_at", { count: "exact" })
    .eq("user_id", userId)
    .eq("scope", "resident")
    .order("created_at", { ascending: false })
    .range(from, to);
  let resolvedPage = safePage;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / safePageSize));

  if (!error && (count ?? 0) > 0 && safePage > totalPages) {
    resolvedPage = totalPages;
    const correctedFrom = (resolvedPage - 1) * safePageSize;
    const correctedTo = correctedFrom + safePageSize - 1;
    const correctedPage = await supabase
      .from("notifications")
      .select("id, user_id, payment_id, message, is_read, scope, created_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("scope", "resident")
      .order("created_at", { ascending: false })
      .range(correctedFrom, correctedTo);

    data = correctedPage.data;
    error = correctedPage.error;
    count = correctedPage.count;
  }

  if (error) {
    return {
      notifications: [],
      pagination: {
        currentPage: resolvedPage,
        pageSize: safePageSize,
        totalItems: 0,
        totalPages: 1,
      },
      warning: createWarningMessage("Notifications", error.message),
    };
  }

  return {
    notifications: (data as NotificationRecord[] | null) ?? [],
    pagination: {
      currentPage: resolvedPage,
      pageSize: safePageSize,
      totalItems: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)),
    },
    warning: null,
  };
}

export async function getResidentNotificationsPageData(page = 1) {
  const profile = await requireUserProfile();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const [notificationPage, announcements, settings] = await Promise.all([
    getResidentNotificationsPage(profile.id, page, 10),
    getAnnouncements({ audience: "residents", limit: 6 }),
    getAppSettings(),
  ]);

  return {
    profile,
    notifications: notificationPage.notifications,
    notificationPagination: notificationPage.pagination,
    announcements,
    warnings: [
      ...getSystemHealthWarnings(settings),
      ...(notificationPage.warning ? [notificationPage.warning] : []),
    ],
  };
}
