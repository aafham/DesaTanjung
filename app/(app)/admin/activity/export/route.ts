import { createClient } from "@/lib/supabase/server";
import { formatTimestamp } from "@/lib/utils";

const EXPORT_LIMIT = 5000;
const DATE_FILTERS = ["today", "7d", "14d"] as const;
const ROLE_FILTERS = ["all", "user", "admin"] as const;

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeLikeTerm(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function sanitizeFilter<T extends readonly string[]>(
  value: string | null,
  allowedValues: T,
  fallback: T[number],
): T[number] {
  return allowedValues.includes(value ?? "") ? (value as T[number]) : fallback;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Login required.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, must_change_password")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.must_change_password) {
    return new Response("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const actionFilter = url.searchParams.get("action") ?? "all";
  const roleFilter = sanitizeFilter(url.searchParams.get("role"), ROLE_FILTERS, "all");
  const dateFilter = sanitizeFilter(url.searchParams.get("date"), DATE_FILTERS, "14d");
  const recentCutoff = new Date();
  recentCutoff.setDate(
    recentCutoff.getDate() - (dateFilter === "today" ? 1 : dateFilter === "7d" ? 7 : 14),
  );

  const likeQuery = query ? `%${escapeLikeTerm(query)}%` : "";
  const matchedUserIds =
    query
      ? (
          await supabase
            .from("users")
            .select("id")
            .or(`house_number.ilike.${likeQuery},name.ilike.${likeQuery}`)
        ).data?.map((matchedUser) => matchedUser.id) ?? []
      : [];

  let activityQuery = supabase
    .from("user_activity_logs")
    .select("id, user_id, action, message, created_at, users!inner(house_number, name, role)")
    .gte("created_at", recentCutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT);

  if (actionFilter !== "all") {
    activityQuery = activityQuery.eq("action", actionFilter);
  }

  if (roleFilter !== "all") {
    activityQuery = activityQuery.eq("users.role", roleFilter);
  }

  if (query) {
    const orParts = [`message.ilike.${likeQuery}`, `action.ilike.${likeQuery}`];

    if (matchedUserIds.length > 0) {
      orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
    }

    activityQuery = activityQuery.or(orParts.join(","));
  }

  const { data, error } = await activityQuery;

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = [
    ["Date", "House", "Resident", "Role", "Action", "Message"],
    ...((data ?? []) as Array<{
      action: string;
      message: string;
      created_at: string;
      users?: { house_number?: string | null; name?: string | null; role?: string | null };
    }>).map((activity) => [
      formatTimestamp(activity.created_at),
      activity.users?.house_number ?? "",
      activity.users?.name ?? "",
      activity.users?.role ?? "",
      activity.action,
      activity.message,
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const filename = `desa-tanjung-activity-${dateFilter}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
