import { cache } from "react";
import { redirect } from "next/navigation";
import { PAYMENT_BUCKET } from "@/lib/constants";
import type {
  AnnouncementAudience,
  AnnouncementRecord,
  AppSettings,
  DisplayPaymentStatus,
  ManagedUser,
  PaginationMeta,
  PaymentAuditLog,
  PaymentRecord,
  PaymentStatus,
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
import {
  buildResidentSearchClause,
  buildUserSearchClause,
  createPaginationMeta,
  createWarningMessage,
  enrichPaymentRecord,
  escapeLikeTerm,
  getSystemHealthWarnings,
} from "@/lib/data-helpers";

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

export async function getPaymentAuditLogs(paymentId: string, limit = 8) {
  const supabase = await createClient();
  const safeLimit = Math.min(Math.max(1, limit), 24);
  const { data, error } = await supabase
    .from("payment_audit_logs")
    .select("id, payment_id, user_id, actor_id, action, message, created_at")
    .eq("payment_id", paymentId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

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

  let usersCountQuery = supabase.from("users").select("id", { count: "exact", head: true });
  let usersPageQuery = supabase
    .from("users")
    .select(
      "id, house_number, email, name, address, phone_number, role, must_change_password, created_at, last_login_at, last_logout_at",
    )
    .order("role", { ascending: false })
    .order("house_number", { ascending: true })
    .range(from, to);

  if (roleFilter !== "all") {
    usersCountQuery = usersCountQuery.eq("role", roleFilter);
    usersPageQuery = usersPageQuery.eq("role", roleFilter);
  }

  if (followUpFilter === "missing-phone") {
    usersCountQuery = usersCountQuery.is("phone_number", null);
    usersPageQuery = usersPageQuery.is("phone_number", null);
  } else if (followUpFilter === "never-logged-in") {
    usersCountQuery = usersCountQuery.is("last_login_at", null);
    usersPageQuery = usersPageQuery.is("last_login_at", null);
  } else if (followUpFilter === "inactive") {
    const cutoff = inactivityCutoff.toISOString();
    usersCountQuery = usersCountQuery.not("last_login_at", "is", null).lte("last_login_at", cutoff);
    usersPageQuery = usersPageQuery.not("last_login_at", "is", null).lte("last_login_at", cutoff);
  }

  if (userSearchClause) {
    usersCountQuery = usersCountQuery.or(userSearchClause);
    usersPageQuery = usersPageQuery.or(userSearchClause);
  }

  const [{ count: filteredCount, error: usersCountError }, { data: users, error: usersError }] =
    await Promise.all([usersCountQuery, usersPageQuery]);

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

  const recentCutoffIso = recentCutoff.toISOString();
  let activityCountQuery = supabase
    .from("user_activity_logs")
    .select("id, users!inner(role)", { count: "exact", head: true })
    .gte("created_at", recentCutoffIso);
  let activityPageQuery = supabase
    .from("user_activity_logs")
    .select("id, user_id, action, message, created_at, users!inner(house_number, name, role)")
    .order("created_at", { ascending: false })
    .range(from, to)
    .gte("created_at", recentCutoffIso);

  if (actionFilter !== "all") {
    activityCountQuery = activityCountQuery.eq("action", actionFilter);
    activityPageQuery = activityPageQuery.eq("action", actionFilter);
  }

  if (roleFilter !== "all") {
    activityCountQuery = activityCountQuery.eq("users.role", roleFilter);
    activityPageQuery = activityPageQuery.eq("users.role", roleFilter);
  }

  if (normalizedQuery) {
    const orParts = [`message.ilike.${likeQuery}`, `action.ilike.${likeQuery}`];

    if (matchedUserIds.length > 0) {
      orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
    }

    const activitySearchClause = orParts.join(",");
    activityCountQuery = activityCountQuery.or(activitySearchClause);
    activityPageQuery = activityPageQuery.or(activitySearchClause);
  }

  const [{ count: filteredCount, error: filteredCountError }, { data, error }] = await Promise.all([
    activityCountQuery,
    activityPageQuery,
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
