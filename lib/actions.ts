"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureCurrentMonthPayment, requireUserProfile } from "@/lib/data";
import {
  formatMonthLabel,
  getMonthKey,
  identifierToEmail,
  slugifyHouseNumber,
} from "@/lib/utils";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_USER_PASSWORD } from "@/lib/constants";

function redirectWithError(path: string, message: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(path: string, message: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}message=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(identifier),
    password,
  });

  if (error) {
    redirectWithError("/login", "Invalid username or password.");
  }

  const profile = await requireUserProfile();

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}

export async function changePasswordAction(formData: FormData) {
  const profile = await requireUserProfile();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirectWithError("/change-password", "Password must be at least 8 characters.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithError("/change-password", error.message);
  }

  await supabase.from("users").update({ must_change_password: false }).eq("id", profile.id);

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}

export async function approvePaymentAction(formData: FormData) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const paymentId = String(formData.get("payment_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();

  await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "paid",
    p_notes: notes || null,
  });

  await supabase.from("notifications").update({ is_read: true }).eq("payment_id", paymentId);

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
  redirectWithMessage(
    `/admin/approvals?month=${month}`,
    "Payment approved successfully.",
  );
}

export async function rejectPaymentAction(formData: FormData) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const paymentId = String(formData.get("payment_id") ?? "");
  const rejectReason = String(formData.get("reject_reason") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();

  await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "rejected",
    p_reject_reason: rejectReason || "Payment proof needs correction.",
    p_notes: notes || null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
  redirectWithMessage(
    `/admin/approvals?month=${month}`,
    "Payment proof rejected with reason saved.",
  );
}

export async function markAllNotificationsReadAction() {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);

  revalidatePath("/admin");
  redirectWithMessage("/admin", "All notifications marked as read.");
}

export async function markCashPaymentAction(formData: FormData) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const residentId = String(formData.get("resident_id") ?? "");
  const month = String(formData.get("month") ?? getMonthKey());
  const supabase = await createClient();

  await supabase.rpc("admin_mark_cash_payment", {
    p_user_id: residentId,
    p_month: month,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  redirectWithMessage(`/admin/residents?month=${month}`, "Cash payment marked successfully.");
}

export async function bulkMarkCashPaymentAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const residentIds = formData.getAll("resident_ids").map((value) => String(value));
  const month = String(formData.get("month") ?? getMonthKey());

  if (residentIds.length === 0) {
    redirectWithError(`/admin/residents?month=${month}`, "Please select at least one resident.");
  }

  const supabase = await createClient();

  await Promise.all(
    residentIds.map((residentId) =>
      supabase.rpc("admin_mark_cash_payment", {
        p_user_id: residentId,
        p_month: month,
      }),
    ),
  );

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
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
    redirectWithError("/admin/residents", error.message);
  }

  await supabase.from("payment_audit_logs").insert({
    payment_id: paymentId,
    actor_id: profile.id,
    action: "note_updated",
    message: notes ? `Admin note updated: ${notes}` : "Admin note cleared.",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
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
  const qrImage = formData.get("payment_qr_image");

  if (!communityName || !bankName || !bankAccountName || !bankAccountNumber) {
    redirectWithError("/admin/settings", "Please fill in all required settings.");
  }

  if (monthlyFeeValue && Number.isNaN(monthlyFee)) {
    redirectWithError("/admin/settings", "Monthly fee must be a number.");
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
      redirectWithError("/admin/settings", uploadError.message);
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
  });

  if (error) {
    redirectWithError("/admin/settings", error.message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/payments");
  redirectWithMessage("/admin/settings", "Payment settings updated successfully.");
}

export async function createCurrentMonthRecordAction() {
  const profile = await requireUserProfile();
  await ensureCurrentMonthPayment(profile.id);
  revalidatePath("/dashboard");
  revalidatePath("/payments");
}

export async function submitPaymentProofAction(
  proofPath: string,
  houseNumber: string,
  month: string,
) {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: paymentId, error } = await supabase.rpc("submit_payment_proof", {
    p_month: month,
    p_proof_url: proofPath,
  });

  if (error || !paymentId) {
    throw new Error(error?.message ?? "Unable to save payment proof.");
  }

  await supabase.from("notifications").insert({
    user_id: profile.id,
    payment_id: paymentId,
    message: `House ${houseNumber} submitted payment for ${formatMonthLabel(month)}.`,
  });

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
  const role = "user";

  if (!houseNumber || !name || !address) {
    redirectWithError("/admin/users", "Please fill in all user fields correctly.");
  }

  const adminClient = createAdminClient();
  const email = identifierToEmail(houseNumber);
  const defaultPassword = DEFAULT_USER_PASSWORD;

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
    redirectWithError("/admin/users", error?.message ?? "Unable to create user.");
  }

  const createdUser = data.user!;

  const { error: upsertError } = await adminClient.from("users").upsert({
    id: createdUser.id,
    house_number: houseNumber,
    email,
    name,
    address,
    role,
    must_change_password: true,
  });

  if (upsertError) {
    await adminClient.auth.admin.deleteUser(createdUser.id);
    redirectWithError("/admin/users", upsertError.message);
  }

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
  const role = String(formData.get("role") ?? "user").trim();

  if (!userId || !houseNumber || !name || !address || !["user", "admin"].includes(role)) {
    redirectWithError("/admin/users", "Please fill in all user fields correctly.");
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
    redirectWithError("/admin/users", authError.message);
  }

  const { error: profileError } = await adminClient
    .from("users")
    .update({
      house_number: houseNumber,
      email,
      name,
      address,
      role,
    })
    .eq("id", userId);

  if (profileError) {
    redirectWithError("/admin/users", profileError.message);
  }

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

  if (!userId || !["user", "admin"].includes(role)) {
    redirectWithError("/admin/users", "Invalid user for password reset.");
  }

  const defaultPassword = role === "admin" ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;
  const adminClient = createAdminClient();

  const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
    password: defaultPassword,
  });

  if (resetError) {
    redirectWithError("/admin/users", resetError.message);
  }

  const { error: profileError } = await adminClient
    .from("users")
    .update({ must_change_password: true })
    .eq("id", userId);

  if (profileError) {
    redirectWithError("/admin/users", profileError.message);
  }

  revalidatePath("/admin/users");
  redirectWithMessage(
    "/admin/users",
    `Password for ${houseNumber} was reset to the default password.`,
  );
}

export async function deleteManagedUserAction(formData: FormData) {
  const profile = await requireUserProfile();
  requireAdmin(profile);

  const userId = String(formData.get("user_id") ?? "").trim();
  const houseNumber = String(formData.get("house_number") ?? "").trim();

  if (!userId) {
    redirectWithError("/admin/users", "Invalid user selected for deletion.");
  }

  if (userId === profile.id) {
    redirectWithError("/admin/users", "You cannot delete the currently signed-in admin.");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    redirectWithError("/admin/users", error.message);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/residents");
  redirectWithMessage("/admin/users", `User ${houseNumber} deleted successfully.`);
}
