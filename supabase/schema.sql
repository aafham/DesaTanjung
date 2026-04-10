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
  role public.user_role not null default 'user',
  must_change_password boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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
  unique (user_id, month)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

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

  insert into public.payments (user_id, month, status, proof_url, payment_method, reviewed_at, reviewed_by, notes)
  values (auth.uid(), p_month, 'pending', p_proof_url, 'online', null, null, null)
  on conflict (user_id, month)
  do update set
    status = 'pending',
    proof_url = excluded.proof_url,
    payment_method = 'online',
    reviewed_at = null,
    reviewed_by = null,
    notes = null
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

create or replace function public.admin_review_payment(p_payment_id uuid, p_status public.payment_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    reviewed_by = auth.uid()
  where id = p_payment_id;
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
    notes = 'Marked as paid manually by committee.';
end;
$$;

alter table public.users enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

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

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
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
