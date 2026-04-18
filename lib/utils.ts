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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
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

export function getDueDateForMonth(monthKey: string, dueDay: number) {
  const [year, month] = monthKey.split("-");
  const safeDueDay = Math.min(Math.max(dueDay, 1), 28);

  return new Date(Number(year), Number(month) - 1, safeDueDay, 23, 59, 59, 999);
}

export function formatDateLabel(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date(value));
}

export function normalizeMalaysianPhoneNumber(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

  let localBody = "";

  if (cleaned.startsWith("+60")) {
    localBody = cleaned.slice(3);
  } else if (cleaned.startsWith("60")) {
    localBody = cleaned.slice(2);
  } else if (cleaned.startsWith("0")) {
    localBody = cleaned.slice(1);
  } else {
    return null;
  }

  if (!/^1\d{8,9}$/.test(localBody)) {
    return null;
  }

  return `+60${localBody}`;
}

export function formatMalaysianPhoneNumber(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const normalized = normalizeMalaysianPhoneNumber(value);

  if (!normalized) {
    return value;
  }

  const localNumber = `0${normalized.slice(3)}`;

  if (localNumber.length === 10) {
    return `${localNumber.slice(0, 3)}-${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
  }

  if (localNumber.length === 11) {
    return `${localNumber.slice(0, 3)}-${localNumber.slice(3, 7)} ${localNumber.slice(7)}`;
  }

  return localNumber;
}

export function getPhoneActionLinks(value: string | null | undefined) {
  const normalized = value ? normalizeMalaysianPhoneNumber(value) : null;

  if (!normalized) {
    return null;
  }

  const whatsappNumber = normalized.replace(/^\+/, "");

  return {
    tel: `tel:${normalized}`,
    whatsapp: `https://wa.me/${whatsappNumber}`,
    whatsappCompose: (text: string) =>
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
    display: formatMalaysianPhoneNumber(normalized),
  };
}
