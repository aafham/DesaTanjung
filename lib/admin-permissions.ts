import type { UserProfile } from "@/lib/types";

const DEFAULT_DESTRUCTIVE_ADMIN_IDENTIFIERS = ["admin"];

function parseIdentifierList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getDestructiveAdminIdentifiers() {
  const configured = parseIdentifierList(process.env.ADMIN_DESTRUCTIVE_ACTION_IDENTIFIERS);

  return configured.length > 0 ? configured : DEFAULT_DESTRUCTIVE_ADMIN_IDENTIFIERS;
}

export function canManageDestructiveAdminActions(profile: Pick<UserProfile, "id" | "house_number" | "role">) {
  if (profile.role !== "admin") {
    return false;
  }

  const allowedIdentifiers = getDestructiveAdminIdentifiers();
  const currentIdentifiers = [profile.id, profile.house_number].map((value) => value.toLowerCase());

  return currentIdentifiers.some((identifier) => allowedIdentifiers.includes(identifier));
}
