import { cache } from "react";
import { redirect } from "next/navigation";
import { PAYMENT_BUCKET } from "@/lib/constants";
import type {
  ManagedUser,
  NotificationRecord,
  PaymentRecord,
  UserProfile,
} from "@/lib/types";
import { formatMonthLabel, getMonthKey } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type PendingApprovalPayment = PaymentRecord & {
  status: "pending" | "rejected";
  users: Pick<UserProfile, "house_number" | "name" | "address">;
};

export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("id, house_number, name, address, role, must_change_password")
    .eq("id", user.id)
    .single();

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
  const currentMonth = getMonthKey();
  const { data: currentPayment } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes",
    )
    .eq("user_id", profile.id)
    .eq("month", currentMonth)
    .single();

  const { data: history } = await supabase
    .from("payments")
    .select(
      "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes",
    )
    .eq("user_id", profile.id)
    .order("month", { ascending: false });

  const signedProof = currentPayment?.proof_url
    ? await getSignedReceiptUrl(currentPayment.proof_url)
    : null;
  const resolvedCurrentPayment =
    (currentPayment as PaymentRecord | null) ?? {
      id: `${profile.id}-${currentMonth}`,
      user_id: profile.id,
      month: currentMonth,
      status: "unpaid",
      proof_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      payment_method: "online",
      notes: null,
    };

  return {
    currentMonth,
    currentMonthLabel: formatMonthLabel(currentMonth),
    currentPayment: resolvedCurrentPayment,
    currentProofUrl: signedProof,
    history: (history as PaymentRecord[] | null) ?? [],
    profile,
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
    { data: pendingPayments },
    { data: notifications },
    { data: residents },
    { data: monthlyRecords },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes, users!inner(house_number, name, address)",
      )
      .eq("month", month)
      .in("status", ["pending", "rejected"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, user_id, payment_id, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("users")
      .select("id, house_number, name, address, role, must_change_password")
      .eq("role", "user")
      .order("house_number", { ascending: true }),
    supabase
      .from("payments")
      .select(
        "id, user_id, month, status, proof_url, created_at, updated_at, reviewed_at, payment_method, notes",
      )
      .eq("month", month),
  ]);

  const residentRows = ((residents as UserProfile[] | null) ?? []).map((resident) => ({
    ...resident,
    currentPayment:
      (monthlyRecords as PaymentRecord[] | null)?.find(
        (payment) => payment.user_id === resident.id,
      ) ?? null,
  }));

  const pendingWithReceipts = await Promise.all(
    (((pendingPayments as Array<
      PendingApprovalPayment
    > | null) ?? [])).map(async (payment) => ({
      ...payment,
      signedProofUrl: payment.proof_url
        ? await getSignedReceiptUrl(payment.proof_url)
        : null,
    })),
  );

  return {
    currentMonth: month,
    currentMonthLabel: formatMonthLabel(month),
    profile,
    pendingPayments: pendingWithReceipts,
    notifications: (notifications as NotificationRecord[] | null) ?? [],
    residents: residentRows,
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
  const { data: users } = await supabase
    .from("users")
    .select("id, house_number, email, name, address, role, must_change_password, created_at")
    .order("role", { ascending: false })
    .order("house_number", { ascending: true });

  return {
    profile,
    users: (users as ManagedUser[] | null) ?? [],
  };
}

export async function getSignedReceiptUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}
