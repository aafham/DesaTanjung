import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.e2e.local", override: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const identifier = process.env.E2E_FIRST_LOGIN_IDENTIFIER || "E2E-FIRST-LOGIN";
const firstPassword = process.env.E2E_FIRST_LOGIN_PASSWORD || "password";
const newPassword =
  process.env.E2E_FIRST_LOGIN_NEW_PASSWORD ||
  `E2eNew-${randomBytes(8).toString("hex")}`;

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

async function upsertEnvFile(values) {
  const envPath = resolve(process.cwd(), ".env.e2e.local");
  const current = existsSync(envPath) ? await readFile(envPath, "utf8") : "";
  const lines = current.split(/\r?\n/);
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);

    if (!match || !(match[1] in values)) {
      return line;
    }

    seen.add(match[1]);
    return `${match[1]}=${values[match[1]]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  const normalized = nextLines.join("\n").replace(/\n*$/, "\n");
  await writeFile(envPath, normalized, "utf8");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const email = identifierToEmail(identifier);
const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  throw listError;
}

let authUser = (listedUsers?.users ?? []).find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);

if (authUser) {
  const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: firstPassword,
    email_confirm: true,
    user_metadata: {
      house_number: identifier,
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
    password: firstPassword,
    email_confirm: true,
    user_metadata: {
      house_number: identifier,
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
  house_number: identifier,
  email,
  name: "E2E First Login",
  address: "Disposable E2E account",
  phone_number: "0123456789",
  role: "user",
  must_change_password: true,
});

if (profileError) {
  throw profileError;
}

await upsertEnvFile({
  E2E_FIRST_LOGIN_IDENTIFIER: identifier,
  E2E_FIRST_LOGIN_PASSWORD: firstPassword,
  E2E_FIRST_LOGIN_NEW_PASSWORD: newPassword,
});

console.log(`Prepared first-login E2E account "${identifier}".`);
console.log("Updated .env.e2e.local with the disposable first-login credentials.");
