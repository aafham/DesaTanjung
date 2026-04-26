import { createClient } from "@supabase/supabase-js";

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for E2E database setup.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function resetCurrentMonthPaymentForHouse(houseNumber: string) {
  const supabase = getAdminClient();
  const month = getMonthKey();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("house_number", houseNumber)
    .single();

  if (userError || !user) {
    throw userError ?? new Error(`Unable to find E2E resident ${houseNumber}.`);
  }

  const { error } = await supabase.from("payments").upsert(
    {
      user_id: user.id,
      month,
      status: "unpaid",
      proof_url: null,
      reviewed_at: null,
      reviewed_by: null,
      payment_method: "online",
      notes: null,
      reject_reason: null,
    },
    { onConflict: "user_id,month" },
  );

  if (error) {
    throw error;
  }
}
