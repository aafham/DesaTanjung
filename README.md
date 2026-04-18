# Desa Tanjung Payment Portal

Portal bayaran bulanan untuk penduduk taman yang dibina menggunakan `Next.js App Router`, `Tailwind CSS`, `Supabase`, dan sesuai untuk deployment di `Vercel`.

Sistem ini direka untuk dua jenis pengguna:

- `Resident / Penduduk`
- `Admin / Jawatankuasa`

Tujuan utama portal ini:

- semak status bayaran bulanan
- muat naik resit bayaran
- semakan dan kelulusan oleh jawatankuasa
- rekod aktiviti pengguna
- notifikasi yang jelas untuk admin dan resident
- pengurusan data penduduk yang lebih teratur

## Tech stack

- `Next.js 15`
- `React 19`
- `Tailwind CSS`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Vercel`

## Ringkasan fungsi

### Resident

- log masuk guna nombor rumah
- tukar kata laluan pada login pertama
- lihat status bayaran bulan semasa
- lihat due date dan jumlah yuran bulanan
- lihat nombor akaun bank dan QR pembayaran
- muat naik resit bayaran
- lihat notifikasi resident
- lihat timeline aktiviti bayaran
- lihat sejarah bayaran
- kemas kini profil:
  - nombor rumah
  - nama pemilik
  - alamat
  - nombor telefon

### Admin

- log masuk guna username `admin`
- dashboard kutipan bulanan
- approval queue untuk semak resit
- approve / reject payment proof
- simpan sebab reject
- simpan nota admin pada bayaran
- tanda bayaran cash secara manual
- bulk mark cash paid
- urus resident dan user:
  - tambah user
  - edit user
  - reset password
  - delete user
  - lihat last login / last logout
  - lihat log aktiviti resident
- global search admin
- halaman reports
- halaman activity log
- halaman notices / announcements
- halaman settings:
  - nama komuniti
  - bank
  - nama pemegang akaun
  - nombor akaun
  - jumlah yuran bulanan
  - hari due date
  - upload QR image

## Cara login

Walaupun pengguna nampak login dengan `username`, Supabase Auth sebenarnya menggunakan `email + password`.

Project ini map username kepada email dalaman:

- `admin` -> `admin@desatanjung.local`
- `A-12` -> `a-12@desatanjung.local`
- `B-08` -> `b-08@desatanjung.local`

Pengguna tetap hanya perlu masukkan:

- `username / nombor rumah`
- `password`

## Default login

### Admin

- username: `admin`
- password: `passwordadmin`

### Resident

- username: contoh `A-12`
- password: `password`

Nota:

- semua akaun seed akan dipaksa tukar kata laluan pada login pertama

## Project structure

```text
.
|-- app
|   |-- (auth)
|   |   |-- change-password/page.tsx
|   |   `-- login/page.tsx
|   |-- (app)
|   |   |-- admin
|   |   |   |-- activity/page.tsx
|   |   |   |-- announcements/page.tsx
|   |   |   |-- approvals/page.tsx
|   |   |   |-- reports/page.tsx
|   |   |   |-- residents/page.tsx
|   |   |   |-- residents/[id]/page.tsx
|   |   |   |-- search/page.tsx
|   |   |   |-- settings/page.tsx
|   |   |   `-- users/page.tsx
|   |   |-- dashboard/page.tsx
|   |   |-- notifications/page.tsx
|   |   |-- payments/page.tsx
|   |   |-- profile/page.tsx
|   |   |-- layout.tsx
|   |   `-- loading.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components
|   |-- admin-activity-log.tsx
|   |-- admin-approval-card.tsx
|   |-- admin-global-search.tsx
|   |-- admin-page-header.tsx
|   |-- admin-reminder-tools.tsx
|   |-- admin-residents-table.tsx
|   |-- admin-settings-form.tsx
|   |-- admin-users-manager.tsx
|   |-- announcement-feed.tsx
|   |-- app-shell.tsx
|   |-- auth-panel.tsx
|   |-- confirm-submit-button.tsx
|   |-- contact-actions.tsx
|   |-- data-warning.tsx
|   |-- form-submit-button.tsx
|   |-- live-refresh.tsx
|   |-- login-form.tsx
|   |-- month-filter.tsx
|   |-- page-toast.tsx
|   |-- password-input.tsx
|   |-- payment-history-table.tsx
|   |-- payment-timeline.tsx
|   |-- payment-upload-form.tsx
|   |-- print-page-button.tsx
|   |-- receipt-preview-modal.tsx
|   |-- resident-notification-list.tsx
|   |-- sidebar-calendar.tsx
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
|   |-- reset-password.mjs
|   |-- seed-users.json.example
|   `-- seed-users.mjs
|-- supabase
|   `-- schema.sql
`-- middleware.ts
```

## Setup local

### 1. Install dependencies

```bash
npm install
```

### 2. Sediakan environment variables

Buat fail `.env.local` dan isi nilai ini:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Nota:

- `NEXT_PUBLIC_SUPABASE_URL` ambil dari Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ambil dari `Publishable / anon key`
- `SUPABASE_SERVICE_ROLE_KEY` ambil dari `Secret key`

## Setup Supabase

### 1. Run schema

Pergi `Supabase > SQL Editor` dan run fail ini:

- [supabase/schema.sql](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\supabase\schema.sql)

Schema ini akan cipta dan kemas kini:

- `public.users`
- `public.payments`
- `public.notifications`
- `public.payment_audit_logs`
- `public.user_activity_logs`
- `public.app_settings`
- `public.announcements`
- RLS policies
- storage bucket:
  - `payment-proofs`
  - `app-assets`

Penting:

- setiap kali schema berubah, run semula fail ini di Supabase

### 2. Seed user demo

Copy fail contoh:

```bash
copy scripts\seed-users.json.example scripts\seed-users.json
```

Kemudian edit `scripts/seed-users.json` ikut data sebenar.

Run:

```bash
npm run seed:users
```

## Run local

```bash
npm run dev
```

## Build check

```bash
npm run lint
npm run build
```

## Flow penggunaan sistem

## Flow resident

### 1. Login

Resident login guna:

- nombor rumah sebagai username
- kata laluan semasa

Jika login pertama:

- resident akan dibawa ke page `Change password`

### 2. Dashboard

Resident boleh lihat:

- status bulan semasa
- due date
- monthly fee
- nombor rumah
- nama pemilik
- alamat
- nombor telefon
- notice board
- resident inbox
- payment timeline
- payment history

### 3. Payments

Resident boleh:

- lihat nama bank
- lihat nombor akaun
- lihat nama pemegang akaun
- lihat QR pembayaran
- buka QR dalam saiz lebih besar
- lihat panduan pembayaran
- muat naik resit bayaran

Bila resit diupload:

- imej akan disimpan dalam Supabase Storage
- rekod payment akan diupdate kepada `pending`
- admin akan nampak di approval queue
- resident akan dapat notifikasi bahawa resit sedang menunggu semakan

### 4. Notifications

Resident boleh buka page `Notifications` untuk lihat semua update penting seperti:

- resit berjaya dihantar
- bayaran diluluskan
- bayaran ditolak
- bayaran ditanda cash paid

### 5. Profile

Resident boleh update:

- nama pemilik
- alamat
- nombor telefon

Semua perubahan ini direkod dalam activity log admin.

### 6. Password

Resident boleh tukar password:

- pada login pertama
- bila klik `Update password` di profile

## Flow admin

### 1. Login

Admin login guna:

- username: `admin`
- password semasa

### 2. Dashboard admin

Admin boleh lihat:

- collection rate
- total paid / pending / needs attention / overdue
- latest notifications
- latest resident activity
- pending uploaded proofs
- resident belum settle
- notice board
- reminder helper
- health warnings jika setting penting belum lengkap

### 3. Approvals

Admin boleh:

- lihat resit yang resident upload
- lihat nombor rumah, nama, alamat, phone number
- preview resit
- approve payment
- reject payment
- pilih sebab reject
- simpan nota admin
- lihat timeline payment

Bila admin approve:

- status resident jadi `paid`
- resident dapat notification `approved`

Bila admin reject:

- status resident jadi `rejected`
- reject reason disimpan
- resident dapat notification `rejected`

### 4. Residents

Admin boleh:

- search resident
- filter by status
- filter by payment method
- export CSV
- bulk mark cash paid
- mark cash paid satu per satu
- lihat notes payment
- pergi ke resident detail
- call / WhatsApp resident

### 5. Resident detail

Admin boleh lihat:

- profile resident
- phone number
- contact actions
- payment history
- payment timeline
- current month status

### 6. Users

Admin boleh:

- tambah user baru
- edit user
- reset default password
- delete user
- semak:
  - last login
  - last logout
  - activity log
  - missing phone
  - never logged in
  - inactive 30+ days

### 7. Search

Halaman `Admin Search` digunakan untuk cari maklumat dengan cepat tanpa lompat banyak page.

Admin boleh search:

- nombor rumah
- nama pemilik
- alamat
- nombor telefon
- payment bulan semasa
- activity log

### 8. Activity

Halaman `Admin Activity` digunakan untuk audit aktiviti portal.

Admin boleh:

- search ikut nama / nombor rumah
- filter ikut action
- filter ikut role
- filter ikut tempoh masa
- export CSV

Action yang direkod:

- login
- logout
- profile update
- password changed
- payment uploaded

### 9. Reports

Admin boleh lihat:

- expected collection
- collected amount
- outstanding amount
- due date
- collection rate
- meeting summary
- resident breakdown
- print report

### 10. Notices

Admin boleh:

- create announcement
- set audience:
  - all
  - residents
  - admins
- pin notice
- delete notice

### 11. Settings

Admin boleh update:

- community name
- bank name
- account holder name
- account number
- monthly fee
- due day
- payment QR image

## Log aktiviti yang direkod

Sistem sekarang merekod aktiviti resident seperti:

- resident login
- resident logout
- resident update profile
- resident tukar password
- resident upload payment proof

Admin boleh nampak aktiviti ini pada:

- dashboard admin
- page `Users`
- page `Activity`

## Notification flow

### Admin notifications

Admin akan nampak feed notifikasi untuk:

- resident submit payment proof

### Resident notifications

Resident akan nampak inbox untuk:

- payment proof submitted
- payment approved
- payment rejected
- payment marked as cash paid
- update sistem berkaitan payment semasa

## Loading states yang ada

Project sekarang ada loading state pada action penting:

- login
- logout
- change password
- save profile
- save settings
- add user
- update user
- publish announcement
- upload receipt

## Scripts yang tersedia

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run seed:users
npm run reset:password
```

### Reset password manual

Script ini berguna untuk reset password akaun dummy atau akaun auth.

Contoh:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SECRET_KEY"
$env:RESET_IDENTIFIER="admin"
$env:RESET_PASSWORD="passwordadmin"
npm run reset:password
```

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "your update"
git push origin main
```

### 2. Import repo ke Vercel

Preset:

- `Next.js`

Biarkan default:

- Root Directory: `./`
- Build Command: default
- Output Directory: default
- Install Command: default

### 3. Isi environment variables di Vercel

Isi nilai yang sama seperti `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Deploy

Selepas deploy:

- run semula `supabase/schema.sql` jika ada perubahan schema
- redeploy jika perlu

## Checklist selepas deploy

### Resident

1. login
2. tukar password
3. update profile
4. lihat QR dan bank info
5. upload resit
6. lihat status jadi `pending`
7. lihat notifikasi masuk
8. semak page notifications

### Admin

1. login
2. tengok resident upload masuk ke `Approvals`
3. approve payment
4. reject payment
5. mark cash paid
6. lihat resident activity log
7. guna global search
8. lihat reports
9. tambah user baru
10. reset password user
11. update settings
12. semak notices

## Common masalah dan cara semak

### 1. User upload tapi admin tak nampak

Semak:

- `supabase/schema.sql` dah run atau belum
- Vercel env betul atau tidak
- Supabase project yang digunakan oleh Vercel sama atau tidak

### 2. QR tak keluar di page user

Semak:

- admin dah upload QR dan tekan `Save settings`
- bucket `app-assets` wujud
- kolum `app_settings.payment_qr_url` betul

### 3. Warning live data muncul

Biasanya berpunca daripada:

- schema Supabase belum update
- relation / policy belum sama dengan code semasa
- duplicate data dalam database

### 4. Payment duplicate untuk bulan sama

Pastikan constraint ini wujud:

- `unique (user_id, month)`

Dan run semula schema jika perlu.

### 5. Lint error berkaitan `.next/types`

Kadang-kadang selepas route baru ditambah, `npm run lint` boleh tersandung sementara jika `.next/types` belum digenerate.

Biasanya selesai dengan urutan ini:

```bash
npm run build
npm run lint
```

## Files penting untuk semak dahulu

- [supabase/schema.sql](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\supabase\schema.sql)
- [lib/actions.ts](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\lib\actions.ts)
- [lib/data.ts](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\lib\data.ts)
- [lib/types.ts](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\lib\types.ts)
- [app/(app)/admin/page.tsx](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\app\(app)\admin\page.tsx)
- [app/(app)/admin/reports/page.tsx](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\app\(app)\admin\reports\page.tsx)
- [app/(app)/dashboard/page.tsx](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\app\(app)\dashboard\page.tsx)
- [app/(app)/payments/page.tsx](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\app\(app)\payments\page.tsx)
- [app/(app)/profile/page.tsx](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\app\(app)\profile\page.tsx)

## Nota keselamatan

- jangan dedahkan `SUPABASE_SERVICE_ROLE_KEY`
- kalau key pernah terdedah, rotate key di Supabase
- password tidak disimpan di `public.users`
- password diurus oleh `Supabase Auth`

## Ringkas sangat

Kalau nak paling cepat:

1. `npm install`
2. isi `.env.local`
3. run `supabase/schema.sql`
4. `npm run seed:users`
5. `npm run dev`
6. login sebagai admin dan resident
7. test flow upload -> approve -> notification
