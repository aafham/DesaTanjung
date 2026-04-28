"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/data";
import {
  formatMonthLabel,
  getMonthKey,
  identifierToEmail,
  normalizeMalaysianPhoneNumber,
  slugifyHouseNumber,
} from "@/lib/utils";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_USER_PASSWORD } from "@/lib/constants";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";
import { canManageDestructiveAdminActions } from "@/lib/admin-permissions";

type ActionErrorLike = {
  message?: string | null;
};

async function getActionLocale() {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export async function setLocaleAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? ""));
  const cookieStore = await cookies();
  const headerStore = await headers();

  cookieStore.set(localeCookieName, locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");

  const referer = headerStore.get("referer");

  if (referer) {
    try {
      const url = new URL(referer);
      redirect(`${url.pathname}${url.search}`);
    } catch {
      redirect("/");
    }
  }
}

function redirectWithError(path: string, message: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(path: string, message: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}message=${encodeURIComponent(message)}`);
}

function getActionErrorMessage(
  fallback: string,
  error?: ActionErrorLike | null,
) {
  const message = error?.message?.trim();

  if (!message) {
    return fallback;
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("duplicate key") ||
    lower.includes("already exists") ||
    lower.includes("unique constraint")
  ) {
    return "This record already exists. Please check the current data and try again.";
  }

  if (
    lower.includes("permission denied") ||
    lower.includes("not authorized") ||
    lower.includes("forbidden") ||
    lower.includes("row-level security")
  ) {
    return "You do not have permission to complete this action.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "The request could not reach the server. Please try again.";
  }

  return fallback;
}

function getLoggedErrorMessage(error?: ActionErrorLike | null) {
  return error?.message?.trim() || null;
}

async function logServerActionError({
  actorId,
  action,
  route,
  message,
  error,
  metadata,
}: {
  actorId?: string | null;
  action: string;
  route: string;
  message: string;
  error?: ActionErrorLike | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("server_action_errors").insert({
      actor_id: actorId ?? null,
      action,
      route,
      message,
      error_message: getLoggedErrorMessage(error),
      metadata: metadata ?? null,
    });
  } catch {
    // Monitoring must never block the user action fallback path.
  }
}

function redirectWithActionError(
  path: string,
  fallback: string,
  error?: ActionErrorLike | null,
) {
  redirectWithError(path, getActionErrorMessage(fallback, error));
}

async function redirectWithLoggedActionError({
  path,
  fallback,
  error,
  actorId,
  action,
  metadata,
}: {
  path: string;
  fallback: string;
  error?: ActionErrorLike | null;
  actorId?: string | null;
  action: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const message = getActionErrorMessage(fallback, error);
  await logServerActionError({
    actorId,
    action,
    route: path,
    message,
    error,
    metadata,
  });
  redirectWithError(path, message);
}

function getRelatedHouseNumber(
  relation:
    | { house_number?: string | null }
    | Array<{ house_number?: string | null }>
    | null
    | undefined,
) {
  if (Array.isArray(relation)) {
    return relation[0]?.house_number ?? null;
  }

  return relation?.house_number ?? null;
}

async function logUserActivity(
  userId: string,
  action: string,
  message: string,
) {
  const supabase = await createClient();
  await supabase.from("user_activity_logs").insert({
    user_id: userId,
    action,
    message,
  });
}

async function logAdminAudit(
  adminId: string,
  action: string,
  message: string,
) {
  await logUserActivity(adminId, action, message);
}

async function createNotification({
  userId,
  paymentId = null,
  message,
  scope,
}: {
  userId: string;
  paymentId?: string | null;
  message: string;
  scope: "admin" | "resident";
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    payment_id: paymentId,
    message,
    scope,
  });
}

export async function loginAction(formData: FormData) {
  const locale = await getActionLocale();
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(identifier),
    password,
  });

  if (error) {
    redirectWithError(
      "/login",
      locale === "ms" ? "Username atau kata laluan tidak betul." : "Username or password is incorrect.",
    );
  }

  const profile = await requireUserProfile();

  const loginTime = new Date().toISOString();
  await supabase
    .from("users")
    .update({ last_login_at: loginTime })
    .eq("id", profile.id);
  await logUserActivity(
    profile.id,
    "login",
    `${profile.house_number} signed in to the portal.`,
  );

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}

export async function changePasswordAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirectWithError(
      "/change-password",
      locale === "ms" ? "Kata laluan mesti sekurang-kurangnya 8 aksara." : "Password must be at least 8 characters.",
    );
  }

  if (password !== confirmPassword) {
    redirectWithError(
      "/change-password",
      locale === "ms"
        ? "Kata laluan baharu dan pengesahan mesti sama."
        : "New password and confirmation must match.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithActionError(
      "/change-password",
      locale === "ms"
        ? "Kata laluan tidak dapat dikemas kini sekarang. Sila cuba lagi."
        : "Password could not be updated right now. Please try again.",
      error,
    );
  }

  await supabase.from("users").update({ must_change_password: false }).eq("id", profile.id);
  await logUserActivity(
    profile.id,
    "password_changed",
    `${profile.house_number} changed the account password.`,
  );

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}

export async function updateProfileAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phoneNumberInput = String(formData.get("phone_number") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhoneNumber(phoneNumberInput);

  if (!name || !address || !phoneNumberInput) {
    redirectWithError(
      "/profile",
      locale === "ms"
        ? "Sila lengkapkan nama, alamat, dan nombor telefon."
        : "Please complete your name, address, and phone number.",
    );
  }

  if (!phoneNumber) {
    redirectWithError(
      "/profile",
      locale === "ms"
        ? "Sila masukkan nombor telefon Malaysia yang sah."
        : "Please enter a valid Malaysian phone number.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      name,
      address,
      phone_number: phoneNumber,
    })
    .eq("id", profile.id);

  if (error) {
    redirectWithActionError(
      "/profile",
      "Unable to save the profile right now. Please try again.",
      error,
    );
  }

  const changedFields = [
    profile.name !== name ? "owner name" : null,
    profile.address !== address ? "address" : null,
    profile.phone_number !== phoneNumber ? "phone number" : null,
  ].filter(Boolean);

  await logUserActivity(
    profile.id,
    "profile_updated",
    changedFields.length > 0
      ? `${profile.house_number} updated ${changedFields.join(", ")}.`
      : `${profile.house_number} saved the profile without changing details.`,
  );

  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/profile");
  redirectWithMessage(
    "/profile",
    locale === "ms" ? "Profil berjaya dikemas kini." : "Profile updated successfully.",
  );
}

export async function signOutAction() {
  const profile = await requireUserProfile();
  const supabase = await createClient();
  const logoutTime = new Date().toISOString();

  await supabase
    .from("users")
    .update({ last_logout_at: logoutTime })
    .eq("id", profile.id);
  await logUserActivity(
    profile.id,
    "logout",
    `${profile.house_number} signed out of the portal.`,
  );
  await supabase.auth.signOut();

  redirect("/login");
}

export async function approvePaymentAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const paymentId = String(formData.get("payment_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, user_id, month, users!payments_user_id_fkey(house_number)")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    await redirectWithLoggedActionError({
      path: `/admin/approvals?month=${month}`,
      fallback: "Unable to find the selected payment proof.",
      error: paymentError,
      actorId: profile.id,
      action: "approve_payment_lookup_failed",
      metadata: { paymentId, month },
    });
  }

  const { error: reviewError } = await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "paid",
    p_notes: notes || null,
  });

  if (reviewError) {
    await redirectWithLoggedActionError({
      path: `/admin/approvals?month=${month}`,
      fallback: "Unable to approve the payment right now. Please try again.",
      error: reviewError,
      actorId: profile.id,
      action: "approve_payment_failed",
      metadata: { paymentId, month },
    });
  }

  await supabase.from("notifications").update({ is_read: true }).eq("payment_id", paymentId).eq("scope", "admin");
  if (payment?.user_id) {
    await createNotification({
      userId: payment.user_id,
      paymentId,
      scope: "resident",
      message:
        locale === "ms"
          ? `Bayaran untuk ${formatMonthLabel(payment.month)} sudah disahkan oleh jawatankuasa.`
          : `Payment for ${formatMonthLabel(payment.month)} has been approved by the committee.`,
    });
  }
  await logAdminAudit(
    profile.id,
    "payment_approved",
    `Admin approved payment for ${getRelatedHouseNumber(payment?.users) ?? "the selected resident"} for ${formatMonthLabel(payment?.month ?? month)}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  redirectWithMessage(
    `/admin/approvals?month=${month}`,
    "Payment approved successfully.",
  );
}

export async function rejectPaymentAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const paymentId = String(formData.get("payment_id") ?? "");
  const rejectReason = String(formData.get("reject_reason") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, user_id, month, users!payments_user_id_fkey(house_number)")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    await redirectWithLoggedActionError({
      path: `/admin/approvals?month=${month}`,
      fallback: "Unable to find the selected payment proof.",
      error: paymentError,
      actorId: profile.id,
      action: "reject_payment_lookup_failed",
      metadata: { paymentId, month },
    });
  }

  const { error: reviewError } = await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "rejected",
    p_reject_reason: rejectReason || "Payment proof needs correction.",
    p_notes: notes || null,
  });

  if (reviewError) {
    await redirectWithLoggedActionError({
      path: `/admin/approvals?month=${month}`,
      fallback: "Unable to reject the payment proof right now. Please try again.",
      error: reviewError,
      actorId: profile.id,
      action: "reject_payment_failed",
      metadata: { paymentId, month },
    });
  }

  if (payment?.user_id) {
    await createNotification({
      userId: payment.user_id,
      paymentId,
      scope: "resident",
      message:
        locale === "ms"
          ? `Resit bayaran untuk ${formatMonthLabel(payment.month)} ditolak. Sebab: ${
              rejectReason || "Resit bayaran perlu dibetulkan."
            }`
          : `Payment proof for ${formatMonthLabel(payment.month)} was rejected. Reason: ${
              rejectReason || "Payment proof needs correction."
            }`,
    });
  }
  await logAdminAudit(
    profile.id,
    "payment_rejected",
    `Admin rejected payment proof for ${getRelatedHouseNumber(payment?.users) ?? "the selected resident"} for ${formatMonthLabel(payment?.month ?? month)}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  redirectWithMessage(
    `/admin/approvals?month=${month}`,
    "Payment proof rejected with reason saved.",
  );
}

export async function markAllNotificationsReadAction() {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("is_read", false).eq("scope", "admin");

  revalidatePath("/admin");
  redirectWithMessage("/admin", "All notifications marked as read.");
}

export async function markResidentNotificationsReadAction() {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profile.id)
    .eq("scope", "resident")
    .eq("is_read", false);

  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/notifications");
  revalidatePath("/profile");
  redirectWithMessage("/dashboard", "Notifikasi ditanda sebagai dibaca.");
}

export async function markSingleResidentNotificationReadAction(formData: FormData) {
  const profile = await requireUserProfile();
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  const redirectPath = String(formData.get("redirect_path") ?? "/notifications").trim() || "/notifications";

  if (!notificationId) {
    redirectWithError(redirectPath, "Notifikasi yang dipilih tidak sah.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", profile.id)
    .eq("scope", "resident");

  if (error) {
    redirectWithError(redirectPath, error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/notifications");
  revalidatePath("/profile");
  redirectWithMessage(redirectPath, "Notification marked as read.");
}

export async function markCashPaymentAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const residentId = String(formData.get("resident_id") ?? "");
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();
  const { data: resident } = await supabase
    .from("users")
    .select("house_number")
    .eq("id", residentId)
    .maybeSingle();

  const { error } = await supabase.rpc("admin_mark_cash_payment", {
    p_user_id: residentId,
    p_month: month,
  });

  if (error) {
    await redirectWithLoggedActionError({
      path: `/admin/residents?month=${month}`,
      fallback: "Unable to mark the cash payment right now. Please try again.",
      error,
      actorId: profile.id,
      action: "mark_cash_payment_failed",
      metadata: { residentId, month },
    });
  }
  await createNotification({
    userId: residentId,
    scope: "resident",
    message:
      locale === "ms"
        ? `Bayaran untuk ${formatMonthLabel(month)} ditanda selesai secara tunai.`
        : `Payment for ${formatMonthLabel(month)} was marked as paid by cash.`,
  });
  await logAdminAudit(
    profile.id,
    "cash_paid",
    `Admin marked ${resident?.house_number ?? "the selected resident"} as cash paid for ${formatMonthLabel(month)}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  redirectWithMessage(`/admin/residents?month=${month}`, "Cash payment marked successfully.");
}

export async function bulkMarkCashPaymentAction(formData: FormData) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const residentIds = formData.getAll("resident_ids").map((value) => String(value));
  const month = String(formData.get("month") ?? getMonthKey());

  if (residentIds.length === 0) {
    redirectWithError(`/admin/residents?month=${month}`, "Please select at least one resident.");
  }

  const supabase = await createClient();
  for (const residentId of residentIds) {
    const { error } = await supabase.rpc("admin_mark_cash_payment", {
      p_user_id: residentId,
      p_month: month,
    });

    if (error) {
      await redirectWithLoggedActionError({
        path: `/admin/residents?month=${month}`,
        fallback: "Unable to mark one or more cash payments right now. Please try again.",
        error,
        actorId: profile.id,
        action: "bulk_mark_cash_payment_failed",
        metadata: { residentId, month, selectedCount: residentIds.length },
      });
    }

    await createNotification({
      userId: residentId,
      scope: "resident",
      message:
        locale === "ms"
          ? `Bayaran untuk ${formatMonthLabel(month)} ditanda selesai secara tunai.`
          : `Payment for ${formatMonthLabel(month)} was marked as paid by cash.`,
    });
  }
  await logAdminAudit(
    profile.id,
    "bulk_cash_paid",
    `Admin marked ${residentIds.length} resident payment(s) as cash paid for ${formatMonthLabel(month)}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  redirectWithMessage(
    `/admin/residents?month=${month}`,
    `${residentIds.length} resident payments marked as cash paid.`,
  );
}

export async function updatePaymentNotesAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const paymentId = String(formData.get("payment_id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!paymentId) {
    redirectWithError("/admin/residents", "Invalid payment selected.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ notes }).eq("id", paymentId);

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/residents",
      fallback: "Unable to update the payment note right now. Please try again.",
      error,
      actorId: profile.id,
      action: "payment_note_update_failed",
      metadata: { paymentId },
    });
  }

  await supabase.from("payment_audit_logs").insert({
    payment_id: paymentId,
    actor_id: profile.id,
    action: "note_updated",
    message: notes ? `Admin note updated: ${notes}` : "Admin note cleared.",
  });
  await logAdminAudit(
    profile.id,
    "payment_note_updated",
    notes
      ? "Admin updated a payment note from the residents page."
      : "Admin cleared a payment note from the residents page.",
  );

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/residents", "Payment note updated.");
}

export async function updateAppSettingsAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const communityName = String(formData.get("community_name") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const bankAccountName = String(formData.get("bank_account_name") ?? "").trim();
  const bankAccountNumber = String(formData.get("bank_account_number") ?? "").trim();
  const existingPaymentQrUrl = String(formData.get("existing_payment_qr_url") ?? "").trim();
  const monthlyFeeValue = String(formData.get("monthly_fee") ?? "").trim();
  const monthlyFee = monthlyFeeValue ? Number(monthlyFeeValue) : null;
  const dueDayValue = String(formData.get("due_day") ?? "").trim();
  const dueDay = Number(dueDayValue || "7");
  const qrImage = formData.get("payment_qr_image");
  const qrUploaded = qrImage instanceof File && qrImage.size > 0;

  if (!communityName || !bankName || !bankAccountName || !bankAccountNumber) {
    redirectWithError("/admin/settings", "Please fill in all required settings.");
  }

  if (monthlyFeeValue && Number.isNaN(monthlyFee)) {
    redirectWithError("/admin/settings", "Monthly fee must be a number.");
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    redirectWithError("/admin/settings", "Due day must be between 1 and 28.");
  }

  let paymentQrUrl = existingPaymentQrUrl;

  if (qrImage instanceof File && qrImage.size > 0) {
    if (!qrImage.type.startsWith("image/")) {
      redirectWithError("/admin/settings", "QR image must be a valid image file.");
    }

    const adminClient = createAdminClient();
    const extension = qrImage.name.split(".").pop()?.toLowerCase() || "png";
    const path = `qr/payment-qr-${Date.now()}.${extension}`;
    const bytes = Buffer.from(await qrImage.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("app-assets")
      .upload(path, bytes, {
        contentType: qrImage.type,
        upsert: true,
      });

    if (uploadError) {
      await redirectWithLoggedActionError({
        path: "/admin/settings",
        fallback: "Unable to upload the QR image right now. Please try again.",
        error: uploadError,
        actorId: profile.id,
        action: "settings_qr_upload_failed",
        metadata: { fileType: qrImage.type, fileSize: qrImage.size },
      });
    }

    const { data: publicUrlData } = adminClient.storage.from("app-assets").getPublicUrl(path);
    paymentQrUrl = publicUrlData.publicUrl;
  }

  if (!paymentQrUrl) {
    redirectWithError("/admin/settings", "Please upload a QR image first.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert({
    id: true,
    community_name: communityName,
    bank_name: bankName,
    bank_account_name: bankAccountName,
    bank_account_number: bankAccountNumber,
    payment_qr_url: paymentQrUrl,
    monthly_fee: monthlyFee,
    due_day: dueDay,
  });

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/settings",
      fallback: "Unable to save the payment settings right now. Please try again.",
      error,
      actorId: profile.id,
      action: "settings_save_failed",
      metadata: { qrUploaded, dueDay, hasMonthlyFee: monthlyFee !== null },
    });
  }
  await logAdminAudit(
    profile.id,
    "settings_updated",
    `Admin updated payment settings${qrUploaded ? " and uploaded a new QR image" : ""}.`,
  );

  revalidatePath("/admin/settings");
  revalidatePath("/payments");
  redirectWithMessage("/admin/settings", "Payment settings updated successfully.");
}

export async function createAnnouncementAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all").trim();
  const isPinned = String(formData.get("is_pinned") ?? "") === "on";

  if (!title || !body) {
    redirectWithError("/admin/announcements", "Please fill in the announcement title and message.");
  }

  if (!["all", "residents", "admins"].includes(audience)) {
    redirectWithError("/admin/announcements", "Invalid announcement audience.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    audience,
    is_pinned: isPinned,
    created_by: profile.id,
  });

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/announcements",
      fallback: "Unable to publish the announcement right now. Please try again.",
      error,
      actorId: profile.id,
      action: "announcement_publish_failed",
      metadata: { audience, isPinned },
    });
  }
  await logAdminAudit(
    profile.id,
    "announcement_published",
    `Admin published an announcement for ${audience}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/admin/announcements");
  redirectWithMessage("/admin/announcements", "Announcement published successfully.");
}

export async function deleteAnnouncementAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const announcementId = String(formData.get("announcement_id") ?? "").trim();

  if (!announcementId) {
    redirectWithError("/admin/announcements", "Invalid announcement selected.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", announcementId);

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/announcements",
      fallback: "Unable to remove the announcement right now. Please try again.",
      error,
      actorId: profile.id,
      action: "announcement_delete_failed",
      metadata: { announcementId },
    });
  }
  await logAdminAudit(
    profile.id,
    "announcement_deleted",
    "Admin removed an announcement.",
  );

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/admin/announcements");
  redirectWithMessage("/admin/announcements", "Announcement removed.");
}

export async function submitPaymentProofAction(
  proofPath: string,
  houseNumber: string,
  month: string,
) {
  const locale = await getActionLocale();
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: paymentId, error } = await supabase.rpc("submit_payment_proof", {
    p_month: month,
    p_proof_url: proofPath,
  });

  if (error || !paymentId) {
    await logServerActionError({
      actorId: profile.id,
      action: "submit_payment_proof_failed",
      route: "/payments",
      message: getActionErrorMessage(
        "Unable to save the payment proof right now. Please try again.",
        error,
      ),
      error,
      metadata: { houseNumber, month },
    });
    throw new Error(
      getActionErrorMessage(
        "Unable to save the payment proof right now. Please try again.",
        error,
      ),
    );
  }

  await createNotification({
    userId: profile.id,
    paymentId,
    scope: "admin",
    message: `House ${houseNumber} submitted payment for ${formatMonthLabel(month)}.`,
  });
  await createNotification({
    userId: profile.id,
    paymentId,
    scope: "resident",
    message:
      locale === "ms"
        ? `Resit bayaran untuk ${formatMonthLabel(month)} sudah dihantar dan sedang menunggu semakan jawatankuasa.`
        : `Payment receipt for ${formatMonthLabel(month)} has been submitted and is waiting for committee review.`,
  });
  await logUserActivity(
    profile.id,
    "payment_uploaded",
    `${houseNumber} uploaded payment proof for ${formatMonthLabel(month)}.`,
  );

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
}

function requireAdmin(profile: Awaited<ReturnType<typeof requireUserProfile>>) {
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
}

export async function createManagedUserAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const houseNumber = String(formData.get("house_number") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phoneNumberInput = String(formData.get("phone_number") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhoneNumber(phoneNumberInput);
  const role = String(formData.get("role") ?? "user").trim();

  if (!houseNumber || !name || !address || !phoneNumberInput || !["user", "admin"].includes(role)) {
    redirectWithError("/admin/users", "Please fill in all user fields correctly.");
  }

  if (!phoneNumber) {
    redirectWithError("/admin/users", "Please enter a valid Malaysian mobile number.");
  }

  const adminClient = createAdminClient();
  const email = identifierToEmail(houseNumber);
  const defaultPassword = role === "admin" ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      house_number: houseNumber,
      role,
      slug: slugifyHouseNumber(houseNumber),
    },
  });

  if (error || !data.user) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to create the user right now. Please check the details and try again.",
      error,
      actorId: profile.id,
      action: "create_user_auth_failed",
      metadata: { houseNumber, role },
    });
  }

  const createdUser = data.user!;

  const { error: upsertError } = await adminClient.from("users").upsert({
    id: createdUser.id,
    house_number: houseNumber,
    email,
    name,
    address,
    phone_number: phoneNumber,
    role,
    must_change_password: true,
  });

  if (upsertError) {
    await adminClient.auth.admin.deleteUser(createdUser.id);
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "User login was created, but the resident record could not be saved. Please try again.",
      error: upsertError,
      actorId: profile.id,
      action: "create_user_profile_failed",
      metadata: { houseNumber, role },
    });
  }
  await logAdminAudit(
    profile.id,
    "user_created",
    `Admin created resident account ${houseNumber}.`,
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/residents");
  redirectWithMessage("/admin/users", `User ${houseNumber} created successfully.`);
}

export async function updateManagedUserAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const userId = String(formData.get("user_id") ?? "").trim();
  const houseNumber = String(formData.get("house_number") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phoneNumberInput = String(formData.get("phone_number") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhoneNumber(phoneNumberInput);
  const role = String(formData.get("role") ?? "user").trim();

  if (
    !userId ||
    !houseNumber ||
    !name ||
    !address ||
    !phoneNumberInput ||
    !["user", "admin"].includes(role)
  ) {
    redirectWithError("/admin/users", "Please fill in all user fields correctly.");
  }

  if (!phoneNumber) {
    redirectWithError("/admin/users", "Please enter a valid Malaysian mobile number.");
  }

  const adminClient = createAdminClient();
  const email = identifierToEmail(houseNumber);

  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    email,
    user_metadata: {
      house_number: houseNumber,
      role,
      slug: slugifyHouseNumber(houseNumber),
    },
  });

  if (authError) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to update the user login details right now. Please try again.",
      error: authError,
      actorId: profile.id,
      action: "update_user_auth_failed",
      metadata: { userId, houseNumber, role },
    });
  }

  const { error: profileError } = await adminClient
    .from("users")
    .update({
      house_number: houseNumber,
      email,
      name,
      address,
      phone_number: phoneNumber,
      role,
    })
    .eq("id", userId);

  if (profileError) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to update the resident profile right now. Please try again.",
      error: profileError,
      actorId: profile.id,
      action: "update_user_profile_failed",
      metadata: { userId, houseNumber, role },
    });
  }
  await logAdminAudit(
    profile.id,
    "user_updated",
    `Admin updated account details for ${houseNumber}.`,
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/residents");
  redirectWithMessage("/admin/users", `User ${houseNumber} updated successfully.`);
}

export async function resetManagedUserPasswordAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "user").trim();
  const houseNumber = String(formData.get("house_number") ?? "").trim();
  const confirmationText = String(formData.get("_confirmation_text") ?? "").trim();

  if (!userId || !["user", "admin"].includes(role)) {
    redirectWithError("/admin/users", "Invalid user for password reset.");
  }

  if (confirmationText !== houseNumber) {
    redirectWithError(
      "/admin/users",
      `Password reset cancelled. Type ${houseNumber} exactly to confirm this action.`,
    );
  }

  const defaultPassword = role === "admin" ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;
  const adminClient = createAdminClient();

  const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
    password: defaultPassword,
  });

  if (resetError) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to reset the password right now. Please try again.",
      error: resetError,
      actorId: profile.id,
      action: "reset_user_password_failed",
      metadata: { userId, houseNumber, role },
    });
  }

  const { error: profileError } = await adminClient
    .from("users")
    .update({ must_change_password: true })
    .eq("id", userId);

  if (profileError) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Password was reset, but the reset flag could not be updated. Please try again.",
      error: profileError,
      actorId: profile.id,
      action: "reset_user_flag_failed",
      metadata: { userId, houseNumber, role },
    });
  }
  await logAdminAudit(
    profile.id,
    "user_password_reset",
    `Admin reset the password for ${houseNumber}.`,
  );

  revalidatePath("/admin/users");
  redirectWithMessage(
    "/admin/users",
    `Password for ${houseNumber} was reset to the default password.`,
  );
}

export async function deleteManagedUserAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  if (!canManageDestructiveAdminActions(profile)) {
    redirectWithError(
      "/admin/users",
      "Only the configured lead admin can delete user accounts. Ask the lead admin to complete this action.",
    );
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const houseNumber = String(formData.get("house_number") ?? "").trim();
  const confirmationText = String(formData.get("_confirmation_text") ?? "").trim();

  if (!userId) {
    redirectWithError("/admin/users", "Invalid user selected for deletion.");
  }

  if (confirmationText !== `DELETE ${houseNumber}`) {
    redirectWithError(
      "/admin/users",
      `Deletion cancelled. Type DELETE ${houseNumber} exactly to confirm this action.`,
    );
  }

  if (userId === profile.id) {
    redirectWithError("/admin/users", "You cannot delete the currently signed-in admin.");
  }

  const adminClient = createAdminClient();
  const { data: targetUser, error: targetUserError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetUserError || !targetUser) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to confirm this user before deletion. Please refresh and try again.",
      error: targetUserError,
      actorId: profile.id,
      action: "delete_user_lookup_failed",
      metadata: { userId, houseNumber },
    });
  }

  const targetRole = targetUser?.role;

  if (!targetRole) {
    redirectWithError("/admin/users", "Unable to confirm the selected user role before deletion.");
  }

  if (targetRole === "admin") {
    const { count: adminCount, error: adminCountError } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (adminCountError) {
      await redirectWithLoggedActionError({
        path: "/admin/users",
        fallback: "Unable to confirm admin account coverage before deletion. Please try again.",
        error: adminCountError,
        actorId: profile.id,
        action: "delete_user_admin_count_failed",
        metadata: { userId, houseNumber },
      });
    }

    if ((adminCount ?? 0) <= 1) {
      redirectWithError(
        "/admin/users",
        "You cannot delete the last admin account. Create another admin first.",
      );
    }
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/users",
      fallback: "Unable to delete the user right now. Please try again.",
      error,
      actorId: profile.id,
      action: "delete_user_failed",
      metadata: { userId, houseNumber },
    });
  }
  await logAdminAudit(
    profile.id,
    "user_deleted",
    `Admin deleted account ${houseNumber}.`,
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/residents");
  redirectWithMessage("/admin/users", `User ${houseNumber} deleted successfully.`);
}

export async function pruneActivityLogsAction() {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prune_user_activity_logs", {
    p_keep_days: 90,
  });

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/health",
      fallback: "Unable to prune old activity logs right now. Please confirm the latest Supabase schema has been applied.",
      error,
      actorId: profile.id,
      action: "prune_activity_logs_failed",
      metadata: { keepDays: 90 },
    });
  }

  await logAdminAudit(
    profile.id,
    "activity_logs_pruned",
    `Admin pruned ${data ?? 0} old global activity log row${data === 1 ? "" : "s"}.`,
  );

  revalidatePath("/admin/health");
  revalidatePath("/admin/activity");
  redirectWithMessage(
    "/admin/health",
    `Activity log maintenance completed. ${data ?? 0} old row${data === 1 ? "" : "s"} removed.`,
  );
}

export async function pruneServerActionErrorsAction() {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prune_server_action_errors", {
    p_keep_days: 30,
  });

  if (error) {
    await redirectWithLoggedActionError({
      path: "/admin/health",
      fallback: "Unable to prune old server action error logs right now. Please confirm the latest Supabase schema has been applied.",
      error,
      actorId: profile.id,
      action: "prune_server_action_errors_failed",
      metadata: { keepDays: 30 },
    });
  }

  await logAdminAudit(
    profile.id,
    "server_action_errors_pruned",
    `Admin pruned ${data ?? 0} old server action error row${data === 1 ? "" : "s"}.`,
  );

  revalidatePath("/admin/health");
  redirectWithMessage(
    "/admin/health",
    `Server action error maintenance completed. ${data ?? 0} old row${data === 1 ? "" : "s"} removed.`,
  );
}
