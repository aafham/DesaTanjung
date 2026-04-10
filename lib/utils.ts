export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugifyHouseNumber(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function identifierToEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized === "admin") {
    return "admin@desatanjung.local";
  }

  return `${slugifyHouseNumber(normalized)}@desatanjung.local`;
}

export function getMonthKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace("/", "-");
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
