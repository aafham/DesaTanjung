import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
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

function identifierToEmail(identifier) {
  const normalized = identifier.trim().toLowerCase();
  return normalized === "admin"
    ? "admin@desatanjung.local"
    : `${slugifyHouseNumber(normalized)}@desatanjung.local`;
}

const seedPath = resolve(process.cwd(), "scripts", "seed-users.json");
const raw = await readFile(seedPath, "utf8");
const users = JSON.parse(raw);

const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  throw listError;
}

const existingByEmail = new Map(
  (listedUsers?.users ?? []).map((user) => [user.email?.toLowerCase(), user]),
);

for (const entry of users) {
  const email = identifierToEmail(entry.house_number);
  let authUser = existingByEmail.get(email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: entry.password,
      email_confirm: true,
      user_metadata: {
        house_number: entry.house_number,
        role: entry.role,
      },
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  }

  const { error: upsertError } = await supabase.from("users").upsert({
    id: authUser.id,
    house_number: entry.house_number,
    email,
    name: entry.name,
    address: entry.address,
    role: entry.role,
    must_change_password: true,
  });

  if (upsertError) {
    throw upsertError;
  }

  console.log(`Seeded ${entry.house_number} (${entry.role})`);
}

console.log("Done.");
