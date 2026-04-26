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
  last_login_at timestamptz,
  last_logout_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.users
add column if not exists phone_number text;

alter table public.users
add column if not exists last_login_at timestamptz;

alter table public.users
add column if not exists last_logout_at timestamptz;

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
  scope text not null default 'admin' check (scope in ('admin', 'resident')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.notifications
add column if not exists scope text not null default 'admin';

create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.server_action_errors (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  route text not null,
  message text not null,
  error_message text,
  metadata jsonb,
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

create index if not exists users_role_house_number_idx
on public.users (role, house_number);

create index if not exists users_role_last_login_idx
on public.users (role, last_login_at desc);

create index if not exists payments_month_status_updated_idx
on public.payments (month, status, updated_at desc);

create index if not exists payments_user_month_updated_idx
on public.payments (user_id, month, updated_at desc);

create index if not exists payments_month_method_status_updated_idx
on public.payments (month, payment_method, status, updated_at desc);

create index if not exists notifications_user_scope_created_idx
on public.notifications (user_id, scope, created_at desc);

create index if not exists notifications_scope_read_created_idx
on public.notifications (scope, is_read, created_at desc);

create index if not exists payment_audit_logs_user_created_idx
on public.payment_audit_logs (user_id, created_at desc);

create index if not exists payment_audit_logs_payment_created_idx
on public.payment_audit_logs (payment_id, created_at desc);

create index if not exists user_activity_logs_user_created_idx
on public.user_activity_logs (user_id, created_at desc);

create index if not exists user_activity_logs_created_idx
on public.user_activity_logs (created_at desc);

create index if not exists server_action_errors_created_idx
on public.server_action_errors (created_at desc);

create index if not exists server_action_errors_action_created_idx
on public.server_action_errors (action, created_at desc);

create index if not exists announcements_audience_pinned_published_idx
on public.announcements (audience, is_pinned desc, published_at desc);

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

create or replace function public.prune_user_activity_logs(p_keep_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
  v_keep_days integer := greatest(coalesce(p_keep_days, 90), 14);
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.user_activity_logs
  where created_at < timezone('utc', now()) - make_interval(days => v_keep_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function public.prune_user_activity_logs(integer) is
  'Deletes old global portal activity logs while preserving payment records and payment audit history.';

create or replace function public.admin_resident_payment_rows(
  p_month text,
  p_query text default '',
  p_status text default 'all',
  p_method text default 'all',
  p_limit integer default 5,
  p_offset integer default 0
)
returns table (
  id uuid,
  house_number text,
  name text,
  address text,
  phone_number text,
  role text,
  must_change_password boolean,
  payment_id uuid,
  payment_user_id uuid,
  payment_month text,
  payment_status public.payment_status,
  proof_url text,
  payment_created_at timestamptz,
  payment_updated_at timestamptz,
  reviewed_at timestamptz,
  payment_method text,
  notes text,
  reject_reason text,
  display_status text,
  total_count bigint,
  settled_count bigint,
  reviewed_count bigint,
  follow_up_count bigint
)
language sql
security definer
set search_path = public
as $$
  with settings as (
    select due_day
    from public.app_settings
    where id = true
  ),
  scoped as (
    select
      u.id,
      u.house_number,
      u.name,
      u.address,
      u.phone_number,
      u.role::text as role,
      u.must_change_password,
      p.id as payment_id,
      p.user_id as payment_user_id,
      p.month as payment_month,
      p.status as payment_status,
      p.proof_url,
      p.created_at as payment_created_at,
      p.updated_at as payment_updated_at,
      p.reviewed_at,
      p.payment_method::text as payment_method,
      p.notes,
      p.reject_reason,
      case
        when coalesce(p.status, 'unpaid'::public.payment_status) in ('paid', 'pending', 'rejected') then coalesce(p.status, 'unpaid'::public.payment_status)::text
        when timezone('utc', now()) > make_timestamptz(
          split_part(p_month, '-', 1)::int,
          split_part(p_month, '-', 2)::int,
          least(greatest(coalesce((select due_day from settings), 7), 1), 28),
          23,
          59,
          59.999
        ) then 'overdue'
        else 'unpaid'
      end as display_status
    from public.users u
    left join public.payments p
      on p.user_id = u.id
     and p.month = p_month
    where public.is_admin()
      and u.role = 'user'
      and (
        nullif(trim(p_query), '') is null
        or u.house_number ilike '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%' escape '\'
        or u.name ilike '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%' escape '\'
        or u.address ilike '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%' escape '\'
        or coalesce(u.phone_number, '') ilike '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%' escape '\'
      )
  ),
  filtered as (
    select *
    from scoped
    where (
      p_status = 'all'
      or coalesce(payment_status, 'unpaid'::public.payment_status)::text = p_status
      or display_status = p_status
    )
    and (
      p_method = 'all'
      or payment_method = p_method
    )
  ),
  counted as (
    select
      *,
      count(*) over() as total_count,
      count(*) filter (where display_status = 'paid') over() as settled_count,
      count(*) filter (where coalesce(payment_status, 'unpaid'::public.payment_status)::text in ('paid', 'rejected')) over() as reviewed_count,
      count(*) filter (where display_status in ('unpaid', 'overdue', 'rejected')) over() as follow_up_count
    from filtered
  )
  select *
  from counted
  order by house_number asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

comment on function public.admin_resident_payment_rows(text, text, text, text, integer, integer) is
  'Admin-only paged resident payment directory filter used to avoid loading all residents and payments in application code.';

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
alter table public.user_activity_logs enable row level security;
alter table public.server_action_errors enable row level security;
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

drop policy if exists "Users can view own resident notifications" on public.notifications;
create policy "Users can view own resident notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() and scope = 'resident');

drop policy if exists "Authenticated users can create notifications" on public.notifications;
create policy "Authenticated users can create notifications"
on public.notifications
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update notifications" on public.notifications;
create policy "Admins can update notifications"
on public.notifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can update own resident notifications" on public.notifications;
create policy "Users can update own resident notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid() and scope = 'resident')
with check (user_id = auth.uid() and scope = 'resident');

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

drop policy if exists "Users can view own activity logs or admins can view all" on public.user_activity_logs;
create policy "Users can view own activity logs or admins can view all"
on public.user_activity_logs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can insert own activity logs" on public.user_activity_logs;
create policy "Authenticated users can insert own activity logs"
on public.user_activity_logs
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can view server action errors" on public.server_action_errors;
create policy "Admins can view server action errors"
on public.server_action_errors
for select
to authenticated
using (public.is_admin());

drop policy if exists "Authenticated users can log server action errors" on public.server_action_errors;
create policy "Authenticated users can log server action errors"
on public.server_action_errors
for insert
to authenticated
with check (actor_id is null or actor_id = auth.uid() or public.is_admin());

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
