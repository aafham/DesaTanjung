import { cache } from "react";
import { redirect } from "next/navigation";
import { PAYMENT_BUCKET } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnnouncementAudience,
  AnnouncementRecord,
  AppSettings,
  DisplayPaymentStatus,
  DuplicatePaymentGroup,
  HealthCheckItem,
  ManagedUser,
  MissingPhoneResident,
  NotificationRecord,
  PaginationMeta,
  PaymentAuditLog,
  PaymentRecord,
  PaymentStatus,
  ResidentPaymentRecord,
  ResidentWithPayment,
  ServerActionErrorLog,
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

type SearchPaymentRecord = PaymentRecord & {
  users: Pick<UserProfile, "house_number" | "name" | "address" | "phone_number"> | null;
};

type ManagedAnnouncement = AnnouncementRecord;

type AdminResidentPaymentRow = {
  id: string;
  house_number: string;
  name: string;
  address: string;
  phone_number: string | null;
  role: UserProfile["role"];
  must_change_password: boolean;
  payment_id: string | null;
  payment_user_id: string | null;
  payment_month: string | null;
  payment_status: PaymentStatus | null;
  proof_url: string | null;
  payment_created_at: string | null;
  payment_updated_at: string | null;
  reviewed_at: string | null;
  payment_method: "online" | "cash" | null;
  notes: string | null;
  reject_reason: string | null;
  display_status: DisplayPaymentStatus;
  total_count: number;
  settled_count: number;
  reviewed_count: number;
  follow_up_count: number;
};

function createWarningMessage(scope: string, message: string) {
  return `${scope}: ${message}`;
}

function getSystemHealthWarnings(settings: AppSettings) {
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push("System health: NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    warnings.push("System health: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push("System health: SUPABASE_SERVICE_ROLE_KEY is missing on the server.");
  }

  if (!settings.monthly_fee || settings.monthly_fee <= 0) {
    warnings.push("System health: Monthly fee has not been configured in Settings.");
  }

  if (settings.payment_qr_url.includes("placehold.co")) {
    warnings.push("System health: Payment QR is still using the placeholder image.");
  }

  return warnings;
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
    signed_proof_url: null,
  };
}

function createPaginationMeta(
  currentPage: number,
  pageSize: number,
  totalItems: number,
): PaginationMeta {
  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

function escapeLikeTerm(value: string) {
  return value.replaceAll(",", " ").replaceAll("%", "");
}

function buildUserSearchClause(query: string) {
  const likeQuery = `%${escapeLikeTerm(query)}%`;

  return `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery},email.ilike.${likeQuery}`;
}

function buildResidentSearchClause(query: string) {
  const likeQuery = `%${escapeLikeTerm(query)}%`;

  return `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery}`;
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

export async function getAppShellBadgeCounts(profile: UserProfile) {
  const supabase = await createClient();

  if (profile.role === "user") {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("scope", "resident")
      .eq("is_read", false);

    return {
      notifications: count ?? 0,
    };
  }

  const { count } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    approvals: count ?? 0,
  };
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

export async function getResidentNotificationsPage(userId: string, page = 1, pageSize = 10) {
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

export const getAppSettings = cache(async () => {
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
});

export async function getAdminSettingsData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const settings = await getAppSettings();

  return {
    profile,
    settings,
    warnings: getSystemHealthWarnings(settings),
  };
}

export async function getAdminResidentsData({
  filterMonth,
  page = 1,
  pageSize = 5,
  query = "",
  statusFilter = "all",
  methodFilter = "all",
}: {
  filterMonth?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  statusFilter?: "all" | PaymentStatus | "overdue";
  methodFilter?: "all" | "online" | "cash";
}) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const settings = await getAppSettings();
  const month = filterMonth ?? getMonthKey();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const normalizedQuery = query.trim().toLowerCase();
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const hasPaymentFilters = statusFilter !== "all" || methodFilter !== "all";

  if (!hasPaymentFilters) {
    let residentsCountQuery = supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "user");
    let residentsPageQuery = supabase
      .from("users")
      .select("id, house_number, name, address, phone_number, role, must_change_password")
      .eq("role", "user")
      .order("house_number", { ascending: true })
      .range(from, to);

    if (normalizedQuery) {
      const residentSearchClause = buildResidentSearchClause(query);
      residentsCountQuery = residentsCountQuery.or(residentSearchClause);
      residentsPageQuery = residentsPageQuery.or(residentSearchClause);
    }

    const [{ count: residentCount, error: residentsCountError }, { data: residents, error: residentsError }] =
      await Promise.all([residentsCountQuery, residentsPageQuery]);
    const residentIds = ((residents as UserProfile[] | null) ?? []).map((resident) => resident.id);
    const { data: monthlyRecords, error: monthlyRecordsError } = residentIds.length
      ? await supabase
          .from("payments")
          .select(
            "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
          )
          .eq("month", month)
          .in("user_id", residentIds)
      : { data: [], error: null };

    const summaryUserIds =
      normalizedQuery
        ? (
            await supabase
              .from("users")
              .select("id")
              .eq("role", "user")
              .or(buildResidentSearchClause(query))
          ).data?.map((resident) => resident.id) ?? []
        : [];

    const buildPaymentsSummaryQuery = (status?: "paid" | "pending" | "rejected") => {
      let paymentQuery = supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("month", month);

      if (status) {
        paymentQuery = paymentQuery.eq("status", status);
      }

      if (normalizedQuery) {
        if (summaryUserIds.length === 0) {
          return null;
        }

        paymentQuery = paymentQuery.in("user_id", summaryUserIds);
      }

      return paymentQuery;
    };

    const [paidSummary, pendingSummary, rejectedSummary] = await Promise.all([
      buildPaymentsSummaryQuery("paid"),
      buildPaymentsSummaryQuery("pending"),
      buildPaymentsSummaryQuery("rejected"),
    ]);

    const [paidCountResponse, pendingCountResponse, rejectedCountResponse] = await Promise.all([
      paidSummary ?? Promise.resolve({ count: 0 }),
      pendingSummary ?? Promise.resolve({ count: 0 }),
      rejectedSummary ?? Promise.resolve({ count: 0 }),
    ]);

    const warnings = [
      ...getSystemHealthWarnings(settings),
      ...(residentsCountError ? [createWarningMessage("Resident count", residentsCountError.message)] : []),
      ...(residentsError ? [createWarningMessage("Residents", residentsError.message)] : []),
      ...(monthlyRecordsError ? [createWarningMessage("Monthly records", monthlyRecordsError.message)] : []),
    ];

    const pagination = createPaginationMeta(safePage, safePageSize, residentCount ?? 0);
    const paginatedResidents = ((residents as UserProfile[] | null) ?? []).map((resident) => {
      const currentPayment =
        (monthlyRecords as PaymentRecord[] | null)?.find((payment) => payment.user_id === resident.id) ?? null;

      return {
        ...resident,
        currentPayment: enrichPaymentRecord(currentPayment, month, settings.due_day),
      } satisfies ResidentWithPayment;
    });
    const paidCount = paidCountResponse.count ?? 0;
    const pendingCount = pendingCountResponse.count ?? 0;
    const rejectedCount = rejectedCountResponse.count ?? 0;

    return {
      profile,
      currentMonth: month,
      currentMonthLabel: formatMonthLabel(month),
      residents: paginatedResidents,
      warnings,
      filters: {
        query,
        statusFilter,
        methodFilter,
      },
      pagination,
      summary: {
        settledCount: paidCount,
        reviewedCount: paidCount + rejectedCount,
        followUpCount: Math.max(0, (residentCount ?? 0) - paidCount - pendingCount),
      },
    };
  }

  const { data: residentPaymentRows, error: residentPaymentRowsError } = await supabase.rpc(
    "admin_resident_payment_rows",
    {
      p_month: month,
      p_query: query,
      p_status: statusFilter,
      p_method: methodFilter,
      p_limit: safePageSize,
      p_offset: from,
    },
  );

  if (!residentPaymentRowsError) {
    const rows = (residentPaymentRows as AdminResidentPaymentRow[] | null) ?? [];
    const totalCount = rows[0]?.total_count ?? 0;
    const pagination = createPaginationMeta(safePage, safePageSize, totalCount);
    const paginatedResidents = rows.map((row) => {
      const currentPayment =
        row.payment_id && row.payment_user_id && row.payment_month && row.payment_status
          ? ({
              id: row.payment_id,
              user_id: row.payment_user_id,
              month: row.payment_month,
              status: row.payment_status,
              proof_url: row.proof_url,
              created_at: row.payment_created_at ?? new Date().toISOString(),
              updated_at: row.payment_updated_at ?? new Date().toISOString(),
              reviewed_at: row.reviewed_at,
              payment_method: row.payment_method ?? "online",
              notes: row.notes,
              reject_reason: row.reject_reason,
              display_status: row.display_status,
              is_overdue: row.display_status === "overdue",
              signed_proof_url: null,
            } satisfies ResidentPaymentRecord)
          : enrichPaymentRecord(null, month, settings.due_day);

      return {
        id: row.id,
        house_number: row.house_number,
        name: row.name,
        address: row.address,
        phone_number: row.phone_number,
        role: row.role,
        must_change_password: row.must_change_password,
        currentPayment,
      } satisfies ResidentWithPayment;
    });

    return {
      profile,
      currentMonth: month,
      currentMonthLabel: formatMonthLabel(month),
      residents: paginatedResidents,
      warnings: getSystemHealthWarnings(settings),
      filters: {
        query,
        statusFilter,
        methodFilter,
      },
      pagination,
      summary: {
        settledCount: rows[0]?.settled_count ?? 0,
        reviewedCount: rows[0]?.reviewed_count ?? 0,
        followUpCount: rows[0]?.follow_up_count ?? 0,
      },
    };
  }

  const { data: residents, error: residentsError } = await supabase
    .from("users")
    .select("id, house_number, name, address, phone_number, role, must_change_password")
    .eq("role", "user")
    .order("house_number", { ascending: true });
  const { data: monthlyRecords, error: monthlyRecordsError } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason",
    )
    .eq("month", month);

  const warnings = [
    ...getSystemHealthWarnings(settings),
    createWarningMessage("Resident payment filter RPC fallback", residentPaymentRowsError.message),
    ...(residentsError ? [createWarningMessage("Residents", residentsError.message)] : []),
    ...(monthlyRecordsError ? [createWarningMessage("Monthly records", monthlyRecordsError.message)] : []),
  ];

  const allResidents = ((residents as UserProfile[] | null) ?? []).map((resident) => {
    const currentPayment =
      (monthlyRecords as PaymentRecord[] | null)?.find((payment) => payment.user_id === resident.id) ?? null;

    return {
      ...resident,
      currentPayment: enrichPaymentRecord(currentPayment, month, settings.due_day),
    } satisfies ResidentWithPayment;
  });

  const filteredResidents = allResidents.filter((resident) => {
    const residentStatus = resident.currentPayment?.status ?? "unpaid";
    const displayStatus = resident.currentPayment?.display_status ?? "unpaid";
    const matchesStatus =
      statusFilter === "all" || residentStatus === statusFilter || displayStatus === statusFilter;
    const matchesMethod =
      methodFilter === "all" || resident.currentPayment?.payment_method === methodFilter;
    const matchesQuery =
      !normalizedQuery ||
      resident.house_number.toLowerCase().includes(normalizedQuery) ||
      resident.name.toLowerCase().includes(normalizedQuery) ||
      resident.address.toLowerCase().includes(normalizedQuery) ||
      resident.phone_number?.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesMethod && matchesQuery;
  });

  const pagination = createPaginationMeta(safePage, safePageSize, filteredResidents.length);
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const paginatedResidents = filteredResidents.slice(startIndex, startIndex + pagination.pageSize);

  return {
    profile,
    currentMonth: month,
    currentMonthLabel: formatMonthLabel(month),
    residents: paginatedResidents,
    warnings,
    filters: {
      query,
      statusFilter,
      methodFilter,
    },
    pagination,
    summary: {
      settledCount: filteredResidents.filter((resident) => resident.currentPayment?.display_status === "paid").length,
      reviewedCount: filteredResidents.filter((resident) =>
        ["paid", "rejected"].includes(resident.currentPayment?.status ?? "unpaid"),
      ).length,
      followUpCount: filteredResidents.filter((resident) =>
        ["unpaid", "overdue", "rejected"].includes(resident.currentPayment?.display_status ?? "unpaid"),
      ).length,
    },
  };
}

export async function getAdminUserManagementData({
  page = 1,
  pageSize = 5,
  query = "",
  roleFilter = "all",
  followUpFilter = "all",
}: {
  page?: number;
  pageSize?: number;
  query?: string;
  roleFilter?: "all" | "admin" | "user";
  followUpFilter?: "all" | "missing-phone" | "never-logged-in" | "inactive";
} = {}) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const inactivityCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const normalizedQuery = query.trim();
  const userSearchClause = normalizedQuery ? buildUserSearchClause(query) : null;

  const applyUserDirectoryFilters = (queryBuilder: any) => {
    let scopedQuery = queryBuilder;

    if (roleFilter !== "all") {
      scopedQuery = scopedQuery.eq("role", roleFilter);
    }

    if (followUpFilter === "missing-phone") {
      scopedQuery = scopedQuery.is("phone_number", null);
    } else if (followUpFilter === "never-logged-in") {
      scopedQuery = scopedQuery.is("last_login_at", null);
    } else if (followUpFilter === "inactive") {
      scopedQuery = scopedQuery.not("last_login_at", "is", null).lte("last_login_at", inactivityCutoff.toISOString());
    }

    if (userSearchClause) {
      scopedQuery = scopedQuery.or(userSearchClause);
    }

    return scopedQuery;
  };

  const [{ count: filteredCount, error: usersCountError }, { data: users, error: usersError }] =
    await Promise.all([
      applyUserDirectoryFilters(
        supabase.from("users").select("id", { count: "exact", head: true }),
      ),
      applyUserDirectoryFilters(
        supabase
          .from("users")
          .select(
            "id, house_number, email, name, address, phone_number, role, must_change_password, created_at, last_login_at, last_logout_at",
          )
          .order("role", { ascending: false })
          .order("house_number", { ascending: true })
          .range(from, to),
      ),
    ]);

  const pagination = createPaginationMeta(safePage, safePageSize, filteredCount ?? 0);
  const pagedUsers = (users as ManagedUser[] | null) ?? [];
  const pagedUserIds = pagedUsers.map((user) => user.id);

  const { data: activityLogs } = pagedUserIds.length
    ? await supabase
        .from("user_activity_logs")
        .select("id, user_id, action, message, created_at")
        .in("user_id", pagedUserIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const logsByUser = new Map<string, UserActivityLog[]>();

  for (const log of ((activityLogs as UserActivityLog[] | null) ?? [])) {
    const current = logsByUser.get(log.user_id) ?? [];

    if (current.length < 6) {
      current.push(log);
      logsByUser.set(log.user_id, current);
    }
  }

  const [
    totalUsersResponse,
    adminCountResponse,
    residentCountResponse,
    passwordResetCountResponse,
    missingPhoneCountResponse,
    inactiveCountResponse,
    neverLoggedInCountResponse,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("must_change_password", true),
    supabase.from("users").select("id", { count: "exact", head: true }).is("phone_number", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .not("last_login_at", "is", null)
      .lte("last_login_at", inactivityCutoff.toISOString()),
    supabase.from("users").select("id", { count: "exact", head: true }).is("last_login_at", null),
  ]);

  return {
    profile,
    users: (pagedUsers.map((user) => ({
      ...user,
      activityLogs: logsByUser.get(user.id) ?? [],
    }))),
    warnings: [
      ...(usersCountError ? [createWarningMessage("User count", usersCountError.message)] : []),
      ...(usersError ? [createWarningMessage("Users", usersError.message)] : []),
    ],
    filters: {
      query,
      roleFilter,
      followUpFilter,
    },
    pagination,
    summary: {
      totalUsers: totalUsersResponse.count ?? 0,
      adminCount: adminCountResponse.count ?? 0,
      residentCount: residentCountResponse.count ?? 0,
      passwordResetCount: passwordResetCountResponse.count ?? 0,
      missingPhoneCount: missingPhoneCountResponse.count ?? 0,
      inactiveCount: inactiveCountResponse.count ?? 0,
      neverLoggedInCount: neverLoggedInCountResponse.count ?? 0,
    },
  };
}

export async function getAdminActivityLogData({
  page = 1,
  pageSize = 5,
  query = "",
  actionFilter = "all",
  roleFilter = "all",
  dateFilter = "14d",
}: {
  page?: number;
  pageSize?: number;
  query?: string;
  actionFilter?: string;
  roleFilter?: "all" | "user" | "admin";
  dateFilter?: "today" | "7d" | "14d";
} = {}) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const normalizedQuery = query.trim();
  const recentCutoff = new Date();
  recentCutoff.setDate(
    recentCutoff.getDate() - (dateFilter === "today" ? 1 : dateFilter === "7d" ? 7 : 14),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const likeQuery = normalizedQuery ? `%${escapeLikeTerm(query)}%` : "";
  const matchedUserIds =
    normalizedQuery
      ? (
          await supabase
            .from("users")
            .select("id")
            .or(`house_number.ilike.${likeQuery},name.ilike.${likeQuery}`)
        ).data?.map((user) => user.id) ?? []
      : [];

  const applyActivityFilters = (queryBuilder: any) => {
    let scopedQuery = queryBuilder.gte("created_at", recentCutoff.toISOString());

    if (actionFilter !== "all") {
      scopedQuery = scopedQuery.eq("action", actionFilter);
    }

    if (roleFilter !== "all") {
      scopedQuery = scopedQuery.eq("users.role", roleFilter);
    }

    if (normalizedQuery) {
      const orParts = [`message.ilike.${likeQuery}`, `action.ilike.${likeQuery}`];

      if (matchedUserIds.length > 0) {
        orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
      }

      scopedQuery = scopedQuery.or(orParts.join(","));
    }

    return scopedQuery;
  };

  const [{ count: filteredCount, error: filteredCountError }, { data, error }] = await Promise.all([
    applyActivityFilters(
      supabase
        .from("user_activity_logs")
        .select("id, users!inner(role)", { count: "exact", head: true }),
    ),
    applyActivityFilters(
      supabase
        .from("user_activity_logs")
        .select("id, user_id, action, message, created_at, users!inner(house_number, name, role)")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
  ]);
  const paginatedActivityLogs = (data as UserActivityWithUser[] | null) ?? [];
  const pagination = createPaginationMeta(safePage, safePageSize, filteredCount ?? 0);

  const [totalCountResponse, adminCountResponse, residentCountResponse, paymentCountResponse] = await Promise.all([
    supabase
      .from("user_activity_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", recentCutoff.toISOString()),
    supabase
      .from("user_activity_logs")
      .select("id, users!inner(role)", { count: "exact", head: true })
      .gte("created_at", recentCutoff.toISOString())
      .eq("users.role", "admin"),
    supabase
      .from("user_activity_logs")
      .select("id, users!inner(role)", { count: "exact", head: true })
      .gte("created_at", recentCutoff.toISOString())
      .eq("users.role", "user"),
    supabase
      .from("user_activity_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", recentCutoff.toISOString())
      .in("action", [
        "payment_uploaded",
        "payment_approved",
        "payment_rejected",
        "cash_paid",
        "bulk_cash_paid",
        "payment_note_updated",
      ]),
  ]);

  return {
    profile,
    activityLogs: paginatedActivityLogs,
    warnings: [
      ...(filteredCountError ? [createWarningMessage("Activity count", filteredCountError.message)] : []),
      ...(error ? [createWarningMessage("Activity log", error.message)] : []),
    ],
    filters: {
      query,
      actionFilter,
      roleFilter,
      dateFilter,
    },
    pagination,
    summary: {
      total: totalCountResponse.count ?? 0,
      adminActions: adminCountResponse.count ?? 0,
      residentActions: residentCountResponse.count ?? 0,
      paymentActions: paymentCountResponse.count ?? 0,
      filtered: filteredCount ?? 0,
    },
  };
}

export async function getAdminAnnouncementsData(page = 1, pageSize = 6) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const [
    announcementsResponse,
    totalResponse,
    pinnedResponse,
    residentAudienceResponse,
    adminAudienceResponse,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select(
        "id, title, body, audience, is_pinned, created_by, published_at, created_at, updated_at",
      )
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .range(from, to),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("is_pinned", true),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("audience", "residents"),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("audience", "admins"),
  ]);

  return {
    profile,
    announcements: (announcementsResponse.data as ManagedAnnouncement[] | null) ?? [],
    warnings: [] as string[],
    summary: {
      total: totalResponse.count ?? 0,
      pinned: pinnedResponse.count ?? 0,
      residentsOnly: residentAudienceResponse.count ?? 0,
      adminsOnly: adminAudienceResponse.count ?? 0,
    },
    pagination: {
      currentPage: safePage,
      pageSize: safePageSize,
      totalItems: totalResponse.count ?? 0,
      totalPages: Math.max(1, Math.ceil((totalResponse.count ?? 0) / safePageSize)),
    },
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

export async function getAdminHealthData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const settings = await getAppSettings();
  const warnings = getSystemHealthWarnings(settings);

  const [
    { data: residents, error: residentsError },
    { error: settingsError },
    { data: payments, error: paymentsError },
    { data: buckets, error: bucketsError },
    { data: serverActionErrors, error: serverActionErrorsError, count: serverActionErrorCount },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, house_number, name, address, phone_number, role, must_change_password")
      .eq("role", "user")
      .order("house_number", { ascending: true }),
    supabase
      .from("app_settings")
      .select("id", { count: "exact", head: true })
      .like("payment_qr_url", "%placehold.co%"),
    supabase
      .from("payments")
      .select("id, user_id, month, proof_url, status, updated_at")
      .order("updated_at", { ascending: false }),
    adminClient.storage.listBuckets(),
    supabase
      .from("server_action_errors")
      .select("id, actor_id, action, route, message, error_message, metadata, created_at", { count: "exact" })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const duplicatePayments = new Map<string, number>();
  const residentDirectory = ((residents as UserProfile[] | null) ?? []);
  const residentMap = new Map(residentDirectory.map((resident) => [resident.id, resident]));
  const missingPhoneResidents: MissingPhoneResident[] = residentDirectory
    .filter((resident) => !resident.phone_number)
    .map((resident) => ({
      id: resident.id,
      house_number: resident.house_number,
      name: resident.name,
      address: resident.address,
    }));

  for (const payment of ((payments as PaymentRecord[] | null) ?? [])) {
    const key = `${payment.user_id}:${payment.month}`;
    duplicatePayments.set(key, (duplicatePayments.get(key) ?? 0) + 1);
  }
  const duplicateGroups: DuplicatePaymentGroup[] = Array.from(duplicatePayments.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => {
      const [userId, month] = key.split(":");
      const resident = residentMap.get(userId);

      return {
        user_id: userId,
        house_number: resident?.house_number ?? "Unknown house",
        name: resident?.name ?? "Unknown resident",
        month,
        count,
      };
    })
    .sort((left, right) => right.count - left.count || left.house_number.localeCompare(right.house_number));
  const duplicateCount = duplicateGroups.length;
  const missingPhoneCount = missingPhoneResidents.length;

  const unresolvedProofCount = ((payments as PaymentRecord[] | null) ?? []).filter(
    (payment) => !!payment.proof_url && payment.status === "pending",
  ).length;
  const recentServerActionErrors = (serverActionErrors as ServerActionErrorLog[] | null) ?? [];
  const queryErrors = [residentsError, settingsError, paymentsError, bucketsError].filter(Boolean);

  const checks: HealthCheckItem[] = [
    {
      id: "core-data-readiness",
      label: "Core data readiness",
      status: queryErrors.length === 0 ? "healthy" : "error",
      detail:
        queryErrors.length === 0
          ? "Health checks could read resident data, payment data, settings, and storage successfully."
          : "One or more health queries failed. This often means the live schema, policies, or environment values do not fully match the current code.",
      action:
        queryErrors.length === 0
          ? "No action needed."
          : "Run the latest supabase/schema.sql, then recheck Vercel and Supabase environment values.",
    },
    {
      id: "env-public-url",
      label: "Supabase public URL",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "healthy" : "error",
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "NEXT_PUBLIC_SUPABASE_URL is configured."
        : "NEXT_PUBLIC_SUPABASE_URL is missing.",
      action: "Set the value in Vercel and local .env.local if needed.",
    },
    {
      id: "env-anon-key",
      label: "Supabase anon key",
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "healthy" : "error",
      detail: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is configured. This key is public by design and is used by browser/client auth."
        : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
      action: "Set the publishable/anon key in Vercel and local .env.local.",
    },
    {
      id: "env-service-role",
      label: "Service role key",
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "healthy" : "error",
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "SUPABASE_SERVICE_ROLE_KEY is available on the server. Keep it server-only, mark it Sensitive in Vercel, and rotate it if it was exposed."
        : "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
      action: "Use a rotated Supabase secret key, mark it Sensitive in Vercel, and never prefix it with NEXT_PUBLIC_.",
    },
    {
      id: "monthly-fee",
      label: "Monthly fee",
      status: settings.monthly_fee && settings.monthly_fee > 0 ? "healthy" : "warning",
      detail:
        settings.monthly_fee && settings.monthly_fee > 0
          ? `Monthly fee is set to RM ${settings.monthly_fee.toFixed(2)}.`
          : "Monthly fee has not been configured yet.",
      action: "Open Settings and set the monthly fee before residents start paying.",
    },
    {
      id: "payment-qr",
      label: "Payment QR image",
      status: !settings.payment_qr_url.includes("placehold.co") ? "healthy" : "warning",
      detail: !settings.payment_qr_url.includes("placehold.co")
        ? "Resident payment page is using the uploaded QR image."
        : "Resident payment page is still using the placeholder QR image.",
      action: "Upload a final QR image in Settings and save the form.",
    },
    {
      id: "payment-proofs-bucket",
      label: "Storage bucket: payment-proofs",
      status: buckets?.some((bucket) => bucket.name === "payment-proofs") ? "healthy" : "error",
      detail: buckets?.some((bucket) => bucket.name === "payment-proofs")
        ? "Bucket exists for resident receipt uploads."
        : "Bucket payment-proofs was not found.",
      action: "Run supabase/schema.sql again to recreate storage policies and buckets.",
    },
    {
      id: "app-assets-bucket",
      label: "Storage bucket: app-assets",
      status: buckets?.some((bucket) => bucket.name === "app-assets") ? "healthy" : "warning",
      detail: buckets?.some((bucket) => bucket.name === "app-assets")
        ? "Bucket exists for QR image and app assets."
        : "Bucket app-assets was not found.",
      action: "Run supabase/schema.sql again so QR uploads work properly.",
    },
    {
      id: "duplicate-payments",
      label: "Duplicate monthly payments",
      status: duplicateCount === 0 ? "healthy" : "error",
      detail:
        duplicateCount === 0
          ? "No duplicate payment rows were found for the same resident and month."
          : `${duplicateCount} duplicate resident-month payment group(s) were found.`,
      action: "Clean duplicate rows and rerun schema to enforce the unique constraint.",
    },
    {
      id: "resident-phone-numbers",
      label: "Resident phone numbers",
      status: missingPhoneCount === 0 ? "healthy" : "warning",
      detail:
        missingPhoneCount === 0
          ? `All ${residentDirectory.length} resident accounts have phone numbers saved.`
          : `${missingPhoneCount} resident account(s) are missing phone numbers.`,
      action: "Open Admin Users and complete missing phone numbers for follow-up actions.",
    },
    {
      id: "pending-proofs",
      label: "Pending uploaded proofs",
      status: unresolvedProofCount === 0 ? "healthy" : "warning",
      detail:
        unresolvedProofCount === 0
          ? "No uploaded proofs are waiting for review."
          : `${unresolvedProofCount} uploaded proof(s) are waiting for committee review.`,
      action: "Open Approvals and review the latest resident uploads.",
    },
    {
      id: "server-action-errors",
      label: "Server action error monitor",
      status: serverActionErrorsError ? "warning" : (serverActionErrorCount ?? 0) === 0 ? "healthy" : "warning",
      detail: serverActionErrorsError
        ? "Could not read server action error logs. Confirm the latest schema includes server_action_errors."
        : (serverActionErrorCount ?? 0) === 0
          ? "No critical server action errors were logged in the last 7 days."
          : `${serverActionErrorCount} critical server action error(s) were logged in the last 7 days.`,
      action:
        (serverActionErrorCount ?? 0) === 0 && !serverActionErrorsError
          ? "No action needed."
          : "Review the Production error monitor section below and fix the failing action before heavy live use.",
    },
  ];

  const queryWarnings = [
    ...(residentsError ? [createWarningMessage("Resident directory", residentsError.message)] : []),
    ...(settingsError ? [createWarningMessage("QR settings", settingsError.message)] : []),
    ...(paymentsError ? [createWarningMessage("Payment scan", paymentsError.message)] : []),
    ...(bucketsError ? [createWarningMessage("Storage buckets", bucketsError.message)] : []),
    ...(serverActionErrorsError ? [createWarningMessage("Server action monitor", serverActionErrorsError.message)] : []),
  ];

  return {
    profile,
    checks,
    duplicateGroups,
    missingPhoneResidents,
    recentServerActionErrors,
    serverActionErrorCount: serverActionErrorCount ?? 0,
    warnings: [...warnings, ...queryWarnings],
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
  const normalizedQuery = query.toLowerCase();
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

  const fetchPaymentsByText = async () => {
    if (!query) {
      return supabase
        .from("payments")
        .select("id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason, users!payments_user_id_fkey(house_number, name, address, phone_number)")
        .eq("month", month)
        .order("updated_at", { ascending: false });
    }

    return supabase
      .from("payments")
      .select("id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason, users!payments_user_id_fkey(house_number, name, address, phone_number)")
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
      .select("id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, reject_reason, users!payments_user_id_fkey(house_number, name, address, phone_number)")
      .eq("month", month)
      .in("user_id", matchedResidentIds)
      .order("updated_at", { ascending: false })
      .limit(24);
  };

  const fetchActivityByText = async () => {
    if (!query) {
      return supabase
        .from("user_activity_logs")
        .select("id, user_id, action, message, created_at, users(house_number, name, role)")
        .order("created_at", { ascending: false })
        .limit(60);
    }

    return supabase
      .from("user_activity_logs")
      .select("id, user_id, action, message, created_at, users(house_number, name, role)")
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
      .select("id, user_id, action, message, created_at, users(house_number, name, role)")
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
      ...(((paymentsByResident as SearchPaymentRecord[] | null) ?? [])),
      ...(((paymentsByText as SearchPaymentRecord[] | null) ?? [])),
    ],
  ).sort((left, right) => right.updated_at.localeCompare(left.updated_at));
  const mergedActivityLogs = dedupeById(
    [
      ...(((activityByResident as UserActivityWithUser[] | null) ?? [])),
      ...(((activityByText as UserActivityWithUser[] | null) ?? [])),
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
      ((((mergedPayments as Array<
        SearchPaymentRecord
      > | null) ?? [])).map((payment) => ({
          ...payment,
          display_status: getDisplayStatus(payment.status, payment.month, settings.due_day),
          is_overdue: getDisplayStatus(payment.status, payment.month, settings.due_day) === "overdue",
        }))) ?? [],
    activityLogs: mergedActivityLogs,
    warnings,
  };
}

export async function getAdminResidentDetailData(
  residentId: string,
  filterMonth?: string,
  auditPage = 1,
  auditPageSize = 4,
) {
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
  const safeAuditPage = Math.max(1, auditPage);
  const safeAuditPageSize = Math.min(Math.max(1, auditPageSize), 12);
  const auditFrom = (safeAuditPage - 1) * safeAuditPageSize;
  const auditTo = auditFrom + safeAuditPageSize - 1;

  let [{ data: resident }, { data: history }, { data: payment }, auditLogPage] =
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
        .select("id, payment_id, user_id, actor_id, action, message, created_at", { count: "exact" })
        .eq("user_id", residentId)
        .order("created_at", { ascending: false })
        .range(auditFrom, auditTo),
    ]);
  const warnings: string[] = [];
  let resolvedAuditPage = safeAuditPage;
  let auditLogs = auditLogPage.data;
  let auditError = auditLogPage.error;
  let auditCount = auditLogPage.count;
  const auditTotalPages = Math.max(1, Math.ceil((auditCount ?? 0) / safeAuditPageSize));

  if (!auditError && (auditCount ?? 0) > 0 && safeAuditPage > auditTotalPages) {
    resolvedAuditPage = auditTotalPages;
    const correctedFrom = (resolvedAuditPage - 1) * safeAuditPageSize;
    const correctedTo = correctedFrom + safeAuditPageSize - 1;
    auditLogPage = await supabase
      .from("payment_audit_logs")
      .select("id, payment_id, user_id, actor_id, action, message, created_at", { count: "exact" })
      .eq("user_id", residentId)
      .order("created_at", { ascending: false })
      .range(correctedFrom, correctedTo);

    auditLogs = auditLogPage.data;
    auditError = auditLogPage.error;
    auditCount = auditLogPage.count;
  }

  if (auditError) {
    warnings.push(createWarningMessage("Resident payment activity", auditError.message));
  }

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
    history: await Promise.all(
      (((history as PaymentRecord[] | null) ?? []).map(async (entry) => ({
        ...(enrichPaymentRecord(entry, entry.month, settings.due_day) as ResidentPaymentRecord),
        signed_proof_url: entry.proof_url ? await getSignedReceiptUrl(entry.proof_url) : null,
      }))),
    ),
    auditLogs: (auditLogs as PaymentAuditLog[] | null) ?? [],
    auditPagination: createPaginationMeta(resolvedAuditPage, safeAuditPageSize, auditCount ?? 0),
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
