export type Role = "user" | "admin";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "rejected";

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
