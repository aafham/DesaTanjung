# Desa Tanjung Payment Portal

Mobile-first residential monthly payment management built with Next.js App Router, Tailwind CSS, Supabase Auth/Database/Storage, and Vercel deployment in mind.

## What is included

- Resident login using visible usernames such as `A-12`
- Admin login using `admin`
- Forced password change on first login
- Resident dashboard with current-month status and payment history
- Payment page with bank details, QR display, and receipt upload
- Admin dashboard with notifications, approval queue, and residents table
- Manual cash-payment marking for committee/admin users
- Supabase SQL schema with RLS, storage policies, and RPC helpers
- Seed script for creating Supabase Auth users plus `public.users` records

## Important auth note

Supabase Auth signs users in with email/password, but your UI requirement is username = house number.

This project handles that by mapping usernames to synthetic emails internally:

- `admin` -> `admin@desatanjung.local`
- `A-12` -> `a-12@desatanjung.local`

Residents still type only their house number in the app. Passwords are stored by Supabase Auth, not duplicated in `public.users`. That is safer than keeping a second hashed password column in app tables.

## Project structure

```text
.
|-- app
|   |-- (auth)
|   |   |-- change-password/page.tsx
|   |   `-- login/page.tsx
|   |-- (app)
|   |   |-- admin
|   |   |   |-- approvals/page.tsx
|   |   |   |-- residents/page.tsx
|   |   |   `-- page.tsx
|   |   |-- dashboard/page.tsx
|   |   |-- payments/page.tsx
|   |   |-- profile/page.tsx
|   |   |-- layout.tsx
|   |   `-- loading.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components
|   |-- admin-approval-card.tsx
|   |-- app-shell.tsx
|   |-- auth-panel.tsx
|   |-- live-refresh.tsx
|   |-- month-filter.tsx
|   |-- payment-history-table.tsx
|   |-- payment-upload-form.tsx
|   |-- sign-out-button.tsx
|   `-- ui
|-- lib
|   |-- actions.ts
|   |-- constants.ts
|   |-- data.ts
|   |-- supabase
|   |-- types.ts
|   `-- utils.ts
|-- scripts
|   |-- seed-users.json.example
|   `-- seed-users.mjs
|-- supabase
|   `-- schema.sql
`-- middleware.ts
```

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BANK_ACCOUNT_NAME=Persatuan Penduduk Desa Tanjung
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=1234567890
NEXT_PUBLIC_BANK_NAME=Maybank
NEXT_PUBLIC_PAYMENT_QR_URL=https://placehold.co/600x600/png?text=Upload+Your+QR
```

3. In Supabase SQL Editor, run [`supabase/schema.sql`](/workspace/supabase/schema.sql).

4. Copy `scripts/seed-users.json.example` to `scripts/seed-users.json`, then adjust the resident/admin list.

Default local seed file included for quick testing:

- `admin` / `passwordadmin`
- `A-12` / `password`
- `B-08` / `password`

5. Seed auth users and profile rows.

```bash
npm run seed:users
```

If you get a missing file error, create `scripts/seed-users.json` first based on the example file.

6. Start the app.

```bash
npm run dev
```

## Default logins

- Resident username: any seeded house number such as `A-12`
- Resident password: `password`
- Admin username: `admin`
- Admin password: `passwordadmin`

All seeded accounts are marked `must_change_password = true`, so first login redirects to `/change-password`.

## Supabase schema summary

Core tables:

- `public.users`
  - profile and role data linked 1:1 with `auth.users`
- `public.payments`
  - one record per resident per month
  - supports `unpaid`, `pending`, `paid`, `rejected`
- `public.notifications`
  - lightweight admin feed for new submissions

Extra backend logic in SQL:

- `public.submit_payment_proof(...)`
  - safely sets a resident’s current month to `pending`
- `public.admin_review_payment(...)`
  - approves or rejects uploaded payment proofs
- `public.admin_mark_cash_payment(...)`
  - marks a resident as paid by cash/manual collection
- RLS policies
  - residents only read their own rows
  - admins can read everything
- Storage policies
  - residents upload only inside their own folder
  - admins can review all receipts

## Feature notes

- Auto monthly record creation:
  - the app ensures a current-month payment row exists when a resident opens the dashboard/payment views
- Real-time updates:
  - admin and resident dashboards auto-refresh every 30 seconds
- Upload handling:
  - receipt image goes to Supabase Storage
  - payment record is updated through a server action + SQL RPC
  - notification row is created for admin review
- Manual cash updates:
  - admins can mark any resident as paid for the selected month
- Filter by month:
  - included on admin dashboard, approvals, and residents pages

## Deployment

Deploy to Vercel with the same environment variables from `.env.local`.

Recommended production flow:

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables in the Vercel project settings.
4. Ensure your Supabase project URL is added to Vercel envs for Preview and Production.
5. Redeploy after schema changes.

## Files to check first

- [`supabase/schema.sql`](/workspace/supabase/schema.sql)
- [`lib/actions.ts`](/workspace/lib/actions.ts)
- [`lib/data.ts`](/workspace/lib/data.ts)
- [`app/(app)/dashboard/page.tsx`](/workspace/app/(app)/dashboard/page.tsx)
- [`app/(app)/payments/page.tsx`](/workspace/app/(app)/payments/page.tsx)
- [`app/(app)/admin/page.tsx`](/workspace/app/(app)/admin/page.tsx)
