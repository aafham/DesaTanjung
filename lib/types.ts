export type Role = "user" | "admin";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "rejected";
export type DisplayPaymentStatus = PaymentStatus | "overdue";
export type AnnouncementAudience = "all" | "residents" | "admins";
export type NotificationScope = "admin" | "resident";

export type UserProfile = {
  id: string;
  house_number: string;
  email?: string;
  name: string;
  address: string;
  phone_number: string | null;
  role: Role;
  must_change_password: boolean;
};

export type PaymentRecord = {
  id: string;
  user_id: string;
  month: string;
  status: PaymentStatus;
  proof_url: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  payment_method: "online" | "cash";
  notes: string | null;
  reject_reason: string | null;
};

export type ResidentPaymentRecord = PaymentRecord & {
  display_status: DisplayPaymentStatus;
  is_overdue: boolean;
  signed_proof_url?: string | null;
};

export type PaymentAuditLog = {
  id: string;
  payment_id: string | null;
  user_id: string | null;
  actor_id: string | null;
  action: string;
  message: string;
  created_at: string;
};

export type AppSettings = {
  community_name: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  payment_qr_url: string;
  monthly_fee: number | null;
  due_day: number;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  payment_id: string | null;
  message: string;
  is_read: boolean;
  scope: NotificationScope;
  created_at: string;
};

export type ManagedUser = UserProfile & {
  email: string;
  created_at: string;
  last_login_at: string | null;
  last_logout_at: string | null;
  activityLogs?: UserActivityLog[];
};

export type UserActivityLog = {
  id: string;
  user_id: string;
  action: string;
  message: string;
  created_at: string;
};

export type UserActivityWithUser = UserActivityLog & {
  users: Pick<UserProfile, "house_number" | "name" | "role"> | null;
};

export type HealthCheckItem = {
  id: string;
  label: string;
  status: "healthy" | "warning" | "error";
  detail: string;
  action?: string;
};

export type ServerActionErrorLog = {
  id: string;
  actor_id: string | null;
  action: string;
  route: string;
  message: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type DuplicatePaymentGroup = {
  user_id: string;
  house_number: string;
  name: string;
  month: string;
  count: number;
};

export type MissingPhoneResident = {
  id: string;
  house_number: string;
  name: string;
  address: string;
};

export type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  is_pinned: boolean;
  created_by: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type ResidentWithPayment = UserProfile & {
  currentPayment: ResidentPaymentRecord | null;
};

export type PaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
