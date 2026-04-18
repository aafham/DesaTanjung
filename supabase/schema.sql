create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('online', 'cash');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  house_number text not null unique,
  email text not null unique,
  name text not null,
  address text not null,
  phone_number text,
  role public.user_role not null default 'user',
  must_change_password boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.users
add column if not exists phone_number text;

comment on table public.users is 'Resident and committee profile data linked to Supabase Auth users.';
comment on column public.users.email is 'Synthetic login email derived from the visible username/house number.';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  status public.payment_status not null default 'unpaid',
  proof_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id),
  payment_method public.payment_method not null default 'online',
  notes text,
  reject_reason text,
  unique (user_id, month)
);

alter table public.payments
add column if not exists reject_reason text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_settings (
  id boolean primary key default true,
  community_name text not null default 'Desa Tanjung',
  bank_name text not null default 'Maybank',
  bank_account_name text not null default 'Persatuan Penduduk Desa Tanjung',
  bank_account_number text not null default '1234567890',
  payment_qr_url text not null default 'https://placehold.co/600x600/png?text=QR+Payment',
  monthly_fee numeric(10, 2),
  due_day integer not null default 7 check (due_day between 1 and 28),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint app_settings_single_row check (id = true)
);

alter table public.app_settings
add column if not exists due_day integer not null default 7;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all', 'residents', 'admins')),
  is_pinned boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.app_settings (id)
values (true)
on conflict (id) do nothing;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists users_handle_updated_at on public.users;
create trigger users_handle_updated_at
before update on public.users
for each row
execute function public.handle_updated_at();

drop trigger if exists payments_handle_updated_at on public.payments;
create trigger payments_handle_updated_at
before update on public.payments
for each row
execute function public.handle_updated_at();

drop trigger if exists app_settings_handle_updated_at on public.app_settings;
create trigger app_settings_handle_updated_at
before update on public.app_settings
for each row
execute function public.handle_updated_at();

drop trigger if exists announcements_handle_updated_at on public.announcements;
create trigger announcements_handle_updated_at
before update on public.announcements
for each row
execute function public.handle_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.submit_payment_proof(p_month text, p_proof_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.payments (user_id, month, status, proof_url, payment_method, reviewed_at, reviewed_by, notes, reject_reason)
  values (auth.uid(), p_month, 'pending', p_proof_url, 'online', null, null, null, null)
  on conflict (user_id, month)
  do update set
    status = 'pending',
    proof_url = excluded.proof_url,
    payment_method = 'online',
    reviewed_at = null,
    reviewed_by = null,
    notes = null,
    reject_reason = null
  returning id into v_payment_id;

  insert into public.payment_audit_logs (payment_id, user_id, actor_id, action, message)
  values (v_payment_id, auth.uid(), auth.uid(), 'submitted', 'Resident uploaded payment proof.');

  return v_payment_id;
end;
$$;

create or replace function public.admin_review_payment(
  p_payment_id uuid,
  p_status public.payment_status,
  p_reject_reason text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('paid', 'rejected') then
    raise exception 'Invalid review status';
  end if;

  update public.payments
  set
    status = p_status,
    reviewed_at = timezone('utc', now()),
    reviewed_by = auth.uid(),
    reject_reason = case when p_status = 'rejected' then nullif(p_reject_reason, '') else null end,
    notes = nullif(p_notes, '')
  where id = p_payment_id
  returning user_id into v_user_id;

  insert into public.payment_audit_logs (payment_id, user_id, actor_id, action, message)
  values (
    p_payment_id,
    v_user_id,
    auth.uid(),
    case when p_status = 'paid' then 'approved' else 'rejected' end,
    case
      when p_status = 'paid' then 'Committee approved payment proof.'
      else coalesce(nullif(p_reject_reason, ''), 'Committee rejected payment proof.')
    end
  );
end;
$$;

create or replace function public.admin_mark_cash_payment(p_user_id uuid, p_month text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  insert into public.payments (user_id, month, status, payment_method, reviewed_at, reviewed_by, notes)
  values (
    p_user_id,
    p_month,
    'paid',
    'cash',
    timezone('utc', now()),
    auth.uid(),
    'Marked as paid manually by committee.'
  )
  on conflict (user_id, month)
  do update set
    status = 'paid',
    payment_method = 'cash',
    reviewed_at = timezone('utc', now()),
    reviewed_by = auth.uid(),
    notes = 'Marked as paid manually by committee.',
    reject_reason = null;

  insert into public.payment_audit_logs (payment_id, user_id, actor_id, action, message)
  select id, user_id, auth.uid(), 'cash_paid', 'Committee marked this month as paid by cash.'
  from public.payments
  where user_id = p_user_id
    and month = p_month;
end;
$$;

alter table public.users enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.payment_audit_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "Users can view own profile or admins can view all" on public.users;
create policy "Users can view own profile or admins can view all"
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile or admins can update all" on public.users;
create policy "Users can update own profile or admins can update all"
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Users can view own payments or admins can view all" on public.payments;
create policy "Users can view own payments or admins can view all"
on public.payments
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments"
on public.payments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert payments" on public.payments;
create policy "Admins can insert payments"
on public.payments
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can view notifications" on public.notifications;
create policy "Admins can view notifications"
on public.notifications
for select
to authenticated
using (public.is_admin());

drop policy if exists "Authenticated users can create notifications" on public.notifications;
create policy "Authenticated users can create notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Admins can update notifications" on public.notifications;
create policy "Admins can update notifications"
on public.notifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view own audit logs or admins can view all" on public.payment_audit_logs;
create policy "Users can view own audit logs or admins can view all"
on public.payment_audit_logs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can insert audit logs" on public.payment_audit_logs;
create policy "Admins can insert audit logs"
on public.payment_audit_logs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Authenticated users can view app settings" on public.app_settings;
create policy "Authenticated users can view app settings"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "Admins can update app settings" on public.app_settings;
create policy "Admins can update app settings"
on public.app_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert app settings" on public.app_settings;
create policy "Admins can insert app settings"
on public.app_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Authenticated users can view announcements" on public.announcements;
create policy "Authenticated users can view announcements"
on public.announcements
for select
to authenticated
using (true);

drop policy if exists "Admins can insert announcements" on public.announcements;
create policy "Admins can insert announcements"
on public.announcements
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update announcements" on public.announcements;
create policy "Admins can update announcements"
on public.announcements
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete announcements" on public.announcements;
create policy "Admins can delete announcements"
on public.announcements
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

drop policy if exists "Owners and admins can read receipts" on storage.objects;
create policy "Owners and admins can read receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Owners and admins can upload receipts" on storage.objects;
create policy "Owners and admins can upload receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Owners and admins can update receipts" on storage.objects;
create policy "Owners and admins can update receipts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
