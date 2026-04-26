-- Desa Tanjung query plan checklist
-- Run this in Supabase SQL Editor after real data grows.
-- Goal: make sure common admin/user pages use indexes instead of slow full scans.

-- 1. Admin residents default page
explain analyze
select id, house_number, name, address, phone_number, role, must_change_password
from public.users
where role = 'user'
order by house_number asc
limit 5 offset 0;

-- 2. Admin residents payment filter RPC
explain analyze
select *
from public.admin_resident_payment_rows(
  to_char(timezone('utc', now()), 'YYYY-MM'),
  '',
  'all',
  'all',
  5,
  0
);

-- 3. Admin activity latest 14 days
explain analyze
select l.id, l.user_id, l.action, l.message, l.created_at
from public.user_activity_logs l
where l.created_at >= timezone('utc', now()) - interval '14 days'
order by l.created_at desc
limit 10 offset 0;

-- 4. Resident notification inbox
explain analyze
select id, user_id, payment_id, message, is_read, scope, created_at
from public.notifications
where user_id = auth.uid()
  and scope = 'resident'
order by created_at desc
limit 10 offset 0;

-- 5. Resident payment history
explain analyze
select id, user_id, month, status, proof_url, updated_at
from public.payments
where user_id = auth.uid()
order by month desc
limit 6 offset 0;

-- 6. Production server action error monitor
explain analyze
select id, actor_id, action, route, message, error_message, created_at
from public.server_action_errors
where created_at >= timezone('utc', now()) - interval '7 days'
order by created_at desc
limit 5;
