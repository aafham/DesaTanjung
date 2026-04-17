import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const identifier = process.env.RESET_IDENTIFIER ?? "admin";
const nextPassword = process.env.RESET_PASSWORD ?? "passwordadmin";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before resetting passwords.");
}

if (!identifier || !nextPassword) {
  throw new Error("Set RESET_IDENTIFIER and RESET_PASSWORD.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function slugifyHouseNumber(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function identifierToEmail(rawIdentifier) {
  const normalized = rawIdentifier.trim().toLowerCase();
  return normalized === "admin"
    ? "admin@desatanjung.local"
    : `${slugifyHouseNumber(normalized)}@desatanjung.local`;
}

const email = identifierToEmail(identifier);
const { data, error } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (error) {
  throw error;
}

const matchedUser = (data?.users ?? []).find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);

if (!matchedUser) {
  throw new Error(`User not found for identifier "${identifier}" (${email}).`);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(matchedUser.id, {
  password: nextPassword,
});

if (updateError) {
  throw updateError;
}

const { error: profileError } = await supabase
  .from("users")
  .update({ must_change_password: true })
  .eq("id", matchedUser.id);

if (profileError) {
  throw profileError;
}

console.log(`Password reset for ${identifier} (${email}).`);
