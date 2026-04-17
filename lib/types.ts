export type Role = "user" | "admin";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "rejected";
export type DisplayPaymentStatus = PaymentStatus | "overdue";
export type AnnouncementAudience = "all" | "residents" | "admins";

export type UserProfile = {
  id: string;
  house_number: string;
  email?: string;
  name: string;
  address: string;
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
  created_at: string;
};

export type ManagedUser = UserProfile & {
  email: string;
  created_at: string;
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
