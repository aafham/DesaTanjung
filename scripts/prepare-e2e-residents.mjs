import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.e2e.local", override: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env.e2e.local first.",
  );
}

function slugifyHouseNumber(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function identifierToEmail(rawIdentifier) {
  const normalized = rawIdentifier.trim().toLowerCase();
  return normalized === "admin"
    ? "admin@desatanjung.local"
    : `${slugifyHouseNumber(normalized)}@desatanjung.local`;
}

function getPreparedAccounts() {
  const accounts = [
    {
      identifier: process.env.E2E_RESIDENT_IDENTIFIER,
      password: process.env.E2E_RESIDENT_PASSWORD,
      name: "E2E Resident",
      address: "Disposable E2E resident account",
    },
    {
      identifier: process.env.E2E_PAYMENT_RESIDENT_IDENTIFIER,
      password: process.env.E2E_PAYMENT_RESIDENT_PASSWORD,
      name: "E2E Payment Resident",
      address: "Disposable E2E payment account",
    },
    {
      identifier: process.env.E2E_PRIVACY_RESIDENT_IDENTIFIER ?? process.env.E2E_CASH_RESIDENT_HOUSE_NUMBER,
      password:
        process.env.E2E_PRIVACY_RESIDENT_PASSWORD ??
        process.env.E2E_RESIDENT_PASSWORD ??
        "password",
      name: "E2E Privacy Resident",
      address: "Disposable E2E privacy account",
    },
  ].filter((account) => account.identifier && account.password);

  const uniqueAccounts = new Map();

  for (const account of accounts) {
    uniqueAccounts.set(account.identifier.toLowerCase(), account);
  }

  return Array.from(uniqueAccounts.values());
}

const accounts = getPreparedAccounts();

if (accounts.length === 0) {
  throw new Error(
    "Set E2E_RESIDENT_IDENTIFIER/E2E_RESIDENT_PASSWORD or E2E_PAYMENT_RESIDENT_IDENTIFIER/E2E_PAYMENT_RESIDENT_PASSWORD first.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  throw listError;
}

for (const account of accounts) {
  const email = identifierToEmail(account.identifier);
  let authUser = (listedUsers?.users ?? []).find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  if (authUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        house_number: account.identifier,
        role: "user",
      },
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        house_number: account.identifier,
        role: "user",
      },
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: authUser.id,
    house_number: account.identifier,
    email,
    name: account.name,
    address: account.address,
    phone_number: "0123456789",
    role: "user",
    must_change_password: false,
  });

  if (profileError) {
    throw profileError;
  }

  console.log(`Prepared E2E resident "${account.identifier}".`);
}
