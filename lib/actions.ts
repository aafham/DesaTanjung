"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCurrentMonthPayment, requireUserProfile } from "@/lib/data";
import { formatMonthLabel, getMonthKey, identifierToEmail } from "@/lib/utils";

function redirectWithError(path: string, message: string) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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
