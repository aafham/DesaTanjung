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
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(path: string, message: string) {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
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
  const supabase = await createClient();

  await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "paid",
  });

  await supabase.from("notifications").update({ is_read: true }).eq("payment_id", paymentId);

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
}

export async function rejectPaymentAction(formData: FormData) {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const paymentId = String(formData.get("payment_id") ?? "");
  const supabase = await createClient();

  await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_status: "rejected",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/residents");
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

  const { error: upsertError } = await adminClient.from("users").upsert({
    id: data.user.id,
    house_number: houseNumber,
    email,
    name,
    address,
    role,
    must_change_password: true,
  });

  if (upsertError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
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
