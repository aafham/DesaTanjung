import type {
  AppSettings,
  DisplayPaymentStatus,
  PaginationMeta,
  PaymentRecord,
  ResidentPaymentRecord,
} from "@/lib/types";
import { getDueDateForMonth } from "@/lib/utils";

export function createWarningMessage(scope: string, message: string) {
  return `${scope}: ${message}`;
}

export function getSystemHealthWarnings(settings: AppSettings) {
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push("System health: NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    warnings.push("System health: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push("System health: SUPABASE_SERVICE_ROLE_KEY is missing on the server.");
  }

  if (!settings.monthly_fee || settings.monthly_fee <= 0) {
    warnings.push("System health: Monthly fee has not been configured in Settings.");
  }

  if (settings.payment_qr_url.includes("placehold.co")) {
    warnings.push("System health: Payment QR is still using the placeholder image.");
  }

  return warnings;
}

export function getDisplayStatus(
  status: PaymentRecord["status"] | null | undefined,
  month: string,
  dueDay: number,
): DisplayPaymentStatus {
  const resolvedStatus = status ?? "unpaid";

  if (resolvedStatus === "paid" || resolvedStatus === "pending" || resolvedStatus === "rejected") {
    return resolvedStatus;
  }

  return new Date() > getDueDateForMonth(month, dueDay) ? "overdue" : resolvedStatus;
}

export function enrichPaymentRecord(
  payment: PaymentRecord | null,
  month: string,
  dueDay: number,
): ResidentPaymentRecord | null {
  if (!payment) {
    const displayStatus = getDisplayStatus("unpaid", month, dueDay);

    return {
      id: `virtual-${month}`,
      user_id: "",
      month,
      status: "unpaid",
      proof_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      payment_method: "online",
      notes: null,
      reject_reason: null,
      display_status: displayStatus,
      is_overdue: displayStatus === "overdue",
    };
  }

  const displayStatus = getDisplayStatus(payment.status, payment.month, dueDay);

  return {
    ...payment,
    display_status: displayStatus,
    is_overdue: displayStatus === "overdue",
    signed_proof_url: null,
  };
}

export function createPaginationMeta(
  currentPage: number,
  pageSize: number,
  totalItems: number,
): PaginationMeta {
  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export function escapeLikeTerm(value: string) {
  return value.replaceAll(",", " ").replaceAll("%", "");
}

export function buildUserSearchClause(query: string) {
  const likeQuery = `%${escapeLikeTerm(query)}%`;

  return `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery},email.ilike.${likeQuery}`;
}

export function buildResidentSearchClause(query: string) {
  const likeQuery = `%${escapeLikeTerm(query)}%`;

  return `house_number.ilike.${likeQuery},name.ilike.${likeQuery},address.ilike.${likeQuery},phone_number.ilike.${likeQuery}`;
}
