import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DuplicatePaymentGroup,
  HealthCheckItem,
  MissingPhoneResident,
  PaymentRecord,
  ServerActionErrorLog,
  UserProfile,
} from "@/lib/types";
import { createWarningMessage, getSystemHealthWarnings } from "@/lib/data-helpers";
import { getAppSettings, requireUserProfile } from "@/lib/data";

export async function getAdminHealthData() {
  const profile = await requireUserProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const settings = await getAppSettings();
  const warnings = getSystemHealthWarnings(settings);

  const [
    { data: residents, error: residentsError },
    { error: settingsError },
    { data: payments, error: paymentsError },
    { data: buckets, error: bucketsError },
    { data: serverActionErrors, error: serverActionErrorsError, count: serverActionErrorCount },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, house_number, name, address, phone_number, role, must_change_password")
      .eq("role", "user")
      .order("house_number", { ascending: true }),
    supabase
      .from("app_settings")
      .select("id", { count: "exact", head: true })
      .like("payment_qr_url", "%placehold.co%"),
    supabase
      .from("payments")
      .select("id, user_id, month, proof_url, status, updated_at")
      .order("updated_at", { ascending: false }),
    adminClient.storage.listBuckets(),
    supabase
      .from("server_action_errors")
      .select("id, actor_id, action, route, message, error_message, metadata, created_at", {
        count: "exact",
      })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const duplicatePayments = new Map<string, number>();
  const residentDirectory = (residents as UserProfile[] | null) ?? [];
  const residentMap = new Map(residentDirectory.map((resident) => [resident.id, resident]));
  const missingPhoneResidents: MissingPhoneResident[] = residentDirectory
    .filter((resident) => !resident.phone_number)
    .map((resident) => ({
      id: resident.id,
      house_number: resident.house_number,
      name: resident.name,
      address: resident.address,
    }));

  for (const payment of (payments as PaymentRecord[] | null) ?? []) {
    const key = `${payment.user_id}:${payment.month}`;
    duplicatePayments.set(key, (duplicatePayments.get(key) ?? 0) + 1);
  }
  const duplicateGroups: DuplicatePaymentGroup[] = Array.from(duplicatePayments.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => {
      const [userId, month] = key.split(":");
      const resident = residentMap.get(userId);

      return {
        user_id: userId,
        house_number: resident?.house_number ?? "Unknown house",
        name: resident?.name ?? "Unknown resident",
        month,
        count,
      };
    })
    .sort((left, right) => right.count - left.count || left.house_number.localeCompare(right.house_number));
  const duplicateCount = duplicateGroups.length;
  const missingPhoneCount = missingPhoneResidents.length;

  const unresolvedProofCount = ((payments as PaymentRecord[] | null) ?? []).filter(
    (payment) => !!payment.proof_url && payment.status === "pending",
  ).length;
  const recentServerActionErrors = (serverActionErrors as ServerActionErrorLog[] | null) ?? [];
  const queryErrors = [residentsError, settingsError, paymentsError, bucketsError].filter(Boolean);

  const checks: HealthCheckItem[] = [
    {
      id: "core-data-readiness",
      label: "Core data readiness",
      status: queryErrors.length === 0 ? "healthy" : "error",
      detail:
        queryErrors.length === 0
          ? "Health checks could read resident data, payment data, settings, and storage successfully."
          : "One or more health queries failed. This often means the live schema, policies, or environment values do not fully match the current code.",
      action:
        queryErrors.length === 0
          ? "No action needed."
          : "Run the latest supabase/schema.sql, then recheck Vercel and Supabase environment values.",
    },
    {
      id: "env-public-url",
      label: "Supabase public URL",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "healthy" : "error",
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "NEXT_PUBLIC_SUPABASE_URL is configured."
        : "NEXT_PUBLIC_SUPABASE_URL is missing.",
      action: "Set the value in Vercel and local .env.local if needed.",
    },
    {
      id: "env-anon-key",
      label: "Supabase anon key",
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "healthy" : "error",
      detail: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is configured. This key is public by design and is used by browser/client auth."
        : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
      action: "Set the publishable/anon key in Vercel and local .env.local.",
    },
    {
      id: "env-service-role",
      label: "Service role key",
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "healthy" : "error",
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "SUPABASE_SERVICE_ROLE_KEY is available on the server. Keep it server-only, mark it Sensitive in Vercel, and rotate it if it was exposed."
        : "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
      action: "Use a rotated Supabase secret key, mark it Sensitive in Vercel, and never prefix it with NEXT_PUBLIC_.",
    },
    {
      id: "monthly-fee",
      label: "Monthly fee",
      status: settings.monthly_fee && settings.monthly_fee > 0 ? "healthy" : "warning",
      detail:
        settings.monthly_fee && settings.monthly_fee > 0
          ? `Monthly fee is set to RM ${settings.monthly_fee.toFixed(2)}.`
          : "Monthly fee has not been configured yet.",
      action: "Open Settings and set the monthly fee before residents start paying.",
    },
    {
      id: "payment-qr",
      label: "Payment QR image",
      status: !settings.payment_qr_url.includes("placehold.co") ? "healthy" : "warning",
      detail: !settings.payment_qr_url.includes("placehold.co")
        ? "Resident payment page is using the uploaded QR image."
        : "Resident payment page is still using the placeholder QR image.",
      action: "Upload a final QR image in Settings and save the form.",
    },
    {
      id: "payment-proofs-bucket",
      label: "Storage bucket: payment-proofs",
      status: buckets?.some((bucket) => bucket.name === "payment-proofs") ? "healthy" : "error",
      detail: buckets?.some((bucket) => bucket.name === "payment-proofs")
        ? "Bucket exists for resident receipt uploads."
        : "Bucket payment-proofs was not found.",
      action: "Run supabase/schema.sql again to recreate storage policies and buckets.",
    },
    {
      id: "app-assets-bucket",
      label: "Storage bucket: app-assets",
      status: buckets?.some((bucket) => bucket.name === "app-assets") ? "healthy" : "warning",
      detail: buckets?.some((bucket) => bucket.name === "app-assets")
        ? "Bucket exists for QR image and app assets."
        : "Bucket app-assets was not found.",
      action: "Run supabase/schema.sql again so QR uploads work properly.",
    },
    {
      id: "duplicate-payments",
      label: "Duplicate monthly payments",
      status: duplicateCount === 0 ? "healthy" : "error",
      detail:
        duplicateCount === 0
          ? "No duplicate payment rows were found for the same resident and month."
          : `${duplicateCount} duplicate resident-month payment group(s) were found.`,
      action: "Clean duplicate rows and rerun schema to enforce the unique constraint.",
    },
    {
      id: "resident-phone-numbers",
      label: "Resident phone numbers",
      status: missingPhoneCount === 0 ? "healthy" : "warning",
      detail:
        missingPhoneCount === 0
          ? `All ${residentDirectory.length} resident accounts have phone numbers saved.`
          : `${missingPhoneCount} resident account(s) are missing phone numbers.`,
      action: "Open Admin Users and complete missing phone numbers for follow-up actions.",
    },
    {
      id: "pending-proofs",
      label: "Pending uploaded proofs",
      status: unresolvedProofCount === 0 ? "healthy" : "warning",
      detail:
        unresolvedProofCount === 0
          ? "No uploaded proofs are waiting for review."
          : `${unresolvedProofCount} uploaded proof(s) are waiting for committee review.`,
      action: "Open Approvals and review the latest resident uploads.",
    },
    {
      id: "server-action-errors",
      label: "Server action error monitor",
      status: serverActionErrorsError ? "warning" : (serverActionErrorCount ?? 0) === 0 ? "healthy" : "warning",
      detail: serverActionErrorsError
        ? "Could not read server action error logs. Confirm the latest schema includes server_action_errors."
        : (serverActionErrorCount ?? 0) === 0
          ? "No critical server action errors were logged in the last 7 days."
          : `${serverActionErrorCount} critical server action error(s) were logged in the last 7 days.`,
      action:
        (serverActionErrorCount ?? 0) === 0 && !serverActionErrorsError
          ? "No action needed."
          : "Review the Production error monitor section below and fix the failing action before heavy live use.",
    },
  ];

  const queryWarnings = [
    ...(residentsError ? [createWarningMessage("Resident directory", residentsError.message)] : []),
    ...(settingsError ? [createWarningMessage("QR settings", settingsError.message)] : []),
    ...(paymentsError ? [createWarningMessage("Payment scan", paymentsError.message)] : []),
    ...(bucketsError ? [createWarningMessage("Storage buckets", bucketsError.message)] : []),
    ...(serverActionErrorsError ? [createWarningMessage("Server action monitor", serverActionErrorsError.message)] : []),
  ];

  return {
    profile,
    checks,
    duplicateGroups,
    missingPhoneResidents,
    recentServerActionErrors,
    serverActionErrorCount: serverActionErrorCount ?? 0,
    warnings: [...warnings, ...queryWarnings],
  };
}
