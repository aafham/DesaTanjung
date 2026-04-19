# Desa Tanjung Payment Portal

Portal bayaran bulanan untuk komuniti taman yang dibina dengan `Next.js App Router`, `Tailwind CSS`, `Supabase`, dan sesuai untuk deployment di `Vercel`.

Sistem ini ada dua kumpulan pengguna:

- `User / Penduduk`
- `Admin / Jawatankuasa`

Matlamat utama portal ini:

- semak status bayaran bulanan
- muat naik bukti bayaran
- semakan dan kelulusan oleh jawatankuasa
- pengurusan data penduduk yang lebih teratur
- rekod aktiviti portal yang lebih jelas

## Tech stack

- `Next.js 15`
- `React 19`
- `Tailwind CSS`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Playwright`
- `Vercel`

## Test automation

Playwright telah disediakan untuk regression test asas auth flow dan flow mutasi utama.

Nota penting:

- Flow `upload`, `approve/reject`, `cash paid`, dan `settings` akan mengubah data sebenar.
- Gunakan account atau environment disposable untuk mutation tests.

1. Salin `.env.e2e.example` ke `.env.e2e.local`
2. Isi account yang sesuai untuk test:
   - `E2E_ADMIN_IDENTIFIER` + `E2E_ADMIN_PASSWORD`
   - `E2E_RESIDENT_IDENTIFIER` + `E2E_RESIDENT_PASSWORD`
   - `E2E_PAYMENT_RESIDENT_IDENTIFIER` + `E2E_PAYMENT_RESIDENT_PASSWORD`
   - `E2E_CASH_RESIDENT_HOUSE_NUMBER`
   - `E2E_FIRST_LOGIN_*` hanya untuk account disposable
   - `E2E_ALLOW_SETTINGS_MUTATION=true` hanya pada environment disposable
3. Jalankan:

```bash
npm run test:e2e
```

Command tambahan:

```bash
npm run test:e2e:ui
npm run test:e2e:headed
```

## Ringkasan fungsi

### User / Penduduk

- login guna nombor rumah
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

### Admin / Jawatankuasa

- login guna username `admin`
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
- search ringkas merentas resident, payment, dan activity
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
- halaman health untuk semak readiness sistem

## Checklist semakan kod

Checklist ini disusun semula berdasarkan route, komponen, action, data layer, dan test yang memang wujud dalam codebase semasa.

### Checklist user

#### Sudah siap

- [x] Login menggunakan `nombor rumah / username`
- [x] Paksa tukar kata laluan pada login pertama
- [x] Redirect automatik ke `dashboard` atau `change-password` ikut status akaun
- [x] Dashboard user untuk bulan semasa
- [x] Paparan status bayaran semasa:
  - [x] `paid`
  - [x] `pending`
  - [x] `unpaid`
  - [x] `rejected`
  - [x] `overdue`
- [x] Payments page:
  - [x] paparan bank info
  - [x] paparan QR pembayaran
  - [x] preview QR lebih besar
  - [x] monthly fee dan due date
- [x] Upload resit ke Supabase Storage
- [x] Upload UX yang lebih baik:
  - [x] preview gambar
  - [x] semakan saiz / jenis fail
  - [x] optimize / resize ringan sebelum upload
  - [x] progress state semasa preparing / uploading / saving / refreshing
  - [x] retry / rollback flow jika submit gagal
- [x] Timeline aktiviti bayaran user
- [x] Sejarah bayaran user
- [x] Preview resit lama
- [x] Resident inbox / notification list
- [x] Notification management:
  - [x] mark single as read
  - [x] mark all as read
  - [x] filter by type
  - [x] badge count pada sidebar
  - [x] pagination untuk senarai panjang
- [x] Announcement / notice feed untuk user
- [x] Profile page:
  - [x] update nama
  - [x] update alamat
  - [x] update nombor telefon
  - [x] shortcut tukar password
- [x] Activity log user direkod untuk:
  - [x] login
  - [x] logout
  - [x] update profile
  - [x] tukar password
  - [x] upload payment proof
- [x] UI/UX user yang sudah dipolish:
  - [x] dashboard hierarchy lebih jelas
  - [x] payments page summary + next-step guidance
  - [x] profile layout refinement
  - [x] mobile-friendly payment history
- [x] Accessibility yang sudah siap pada flow user:
  - [x] skip to content
  - [x] focus state
  - [x] dialog focus restore + `Escape`
  - [x] dialog focus trap
  - [x] live region untuk toast
  - [x] auth form error state lebih jelas

#### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Contrast audit kecil yang masih berbaki pada page user tertentu
- [ ] Keyboard flow audit penuh untuk login, payments upload, notifications, dan profile
- [ ] Jalankan suite penuh E2E pada disposable environment sebenar untuk flow user
- [ ] Tambah assertion visual / accessibility pada test flow user yang penting
- [ ] Mobile UI audit penuh untuk:
  - [ ] `/login`
  - [ ] `/dashboard`
  - [ ] `/payments`
  - [ ] `/notifications`
  - [ ] `/profile`

### Checklist admin

#### Sudah siap

- [x] Login admin menggunakan `admin`
- [x] Dashboard admin
- [x] Dashboard admin dipolish semula untuk action harian dan onboarding follow-up
- [x] Approval queue admin
- [x] Approve payment
- [x] Reject payment dengan sebab reject
- [x] Payment note / committee note
- [x] Mark cash paid
- [x] Bulk mark cash paid
- [x] Residents page:
  - [x] search
  - [x] status filter
  - [x] payment method filter
  - [x] export CSV
  - [x] bulk action
  - [x] follow-up tools
- [x] Resident detail page:
  - [x] current month summary
  - [x] contact panel
  - [x] timeline payment
  - [x] history by month
  - [x] bukti pembayaran lama
- [x] Users page:
  - [x] add user
  - [x] edit user
  - [x] reset password
  - [x] delete user
  - [x] last login / last logout
  - [x] onboarding filters
- [x] Search page dikemas semula sebagai `compact global finder`
- [x] Search features:
  - [x] focus mode `all / residents / payments / activity`
  - [x] shortcut action terus dari result
  - [x] pagination result
- [x] Admin reports page
- [x] Print report
- [x] Download report snapshot tanpa bergantung pada browser print
- [x] Admin announcements / notices
- [x] Admin settings:
  - [x] nama komuniti
  - [x] bank
  - [x] nama pemegang akaun
  - [x] nombor akaun
  - [x] monthly fee
  - [x] due day
  - [x] upload QR image
  - [x] dropdown bank Malaysia
- [x] Admin health page
- [x] Health helpers:
  - [x] duplicate payment cleanup helper
  - [x] missing phone export
  - [x] quick action links ke page berkaitan
- [x] Admin activity page
- [x] Admin activity dihadkan kepada log terbaru 14 hari untuk view global yang lebih ringan
- [x] Audit log untuk action kritikal admin:
  - [x] approve / reject payment
  - [x] cash paid / bulk cash paid
  - [x] update payment note
  - [x] update settings / QR
  - [x] publish / delete announcement
  - [x] create / update / reset password / delete user
- [x] Reminder helper:
  - [x] unpaid / overdue / rejected templates
  - [x] tone `friendly / firm / formal`
  - [x] WhatsApp draft helpers
- [x] Call / WhatsApp shortcut
- [x] Pagination pada senarai panjang:
  - [x] activity
  - [x] users
  - [x] residents
- [x] Test automation tersedia untuk flow admin utama:
  - [x] admin login
  - [x] resident upload -> admin approve / reject
  - [x] mark cash paid
  - [x] settings update
  - [x] QR upload assertion
- [x] Error handling yang sudah dirapikan:
  - [x] mesej error yang lebih konsisten pada server action utama
  - [x] fail-safe yang lebih mesra pada flow kritikal admin

#### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Jalankan suite penuh E2E pada disposable environment sebenar untuk mutation flow admin
- [ ] Tambah assertion visual / accessibility pada flow admin yang paling penting
- [ ] Contrast audit kecil yang masih berbaki pada komponen admin tertentu
- [ ] Keyboard flow audit penuh untuk page admin utama
- [ ] Performance / scalability bila data makin besar:
  - [ ] server-side narrowing untuk global search
  - [ ] semakan index database untuk query admin yang kerap
- [ ] UI audit dan final polish untuk page admin yang belum disemak penuh:
  - [ ] activity
  - [ ] reports
  - [ ] announcements
  - [ ] settings
  - [ ] health
- [ ] Polisi operasi live:
  - [ ] elakkan kongsi satu akaun admin untuk ramai AJK
  - [ ] sediakan akaun admin berasingan untuk audit yang lebih jelas

### Checklist UI interface

#### UI interface user

##### Sudah siap

- [x] Login page dikemas semula
- [x] Change password page lebih jelas dan konsisten
- [x] Dashboard user dipolish semula untuk hierarchy dan action flow
- [x] Payments page dipolish semula untuk summary, next-step guidance, dan upload flow
- [x] Profile page dipolish semula untuk susun atur maklumat dan form
- [x] Payment history table lebih kemas dan lebih mudah dibaca
- [x] Payment timeline lebih jelas dari segi contrast dan hierarchy
- [x] Receipt preview modal lebih kemas dan accessible
- [x] Confirm submit dialog lebih kemas dan accessible
- [x] Konsistensi font seluruh app
- [x] Focus state global diperkemas
- [x] Skip to content link disediakan
- [x] Live region untuk toast success / error
- [x] Contrast token global diperkuatkan

##### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Audit UI mobile penuh untuk:
  - [ ] `/login`
  - [ ] `/dashboard`
  - [ ] `/payments`
  - [ ] `/notifications`
  - [ ] `/profile`
- [ ] Contrast audit kecil pada komponen user yang masih berbaki
- [ ] Semakan visual untuk empty state, error state, dan loading state pada page user
- [ ] Screenshot audit UI untuk page user utama

#### UI interface admin

##### Sudah siap

- [x] Sidebar admin diseragamkan supaya konsisten antara page
- [x] Admin dashboard dipolish semula
- [x] Approvals page dipolish semula
- [x] Residents page dipolish semula
- [x] Resident detail page dipolish semula
- [x] Users page dipolish semula
- [x] Search page dipolish semula sebagai compact global finder
- [x] Reports page dipolish semula
- [x] Search panel sidebar issue dibetulkan supaya tidak mengecil pada page tertentu
- [x] Admin search result dipadatkan dengan pagination
- [x] Expandable admin cards ada focus hint dan keyboard style yang lebih baik
- [x] Contact actions, timeline, history, dan metadata admin diperkemas dari segi contrast
- [x] Activity page diperkemas dari segi summary filter, clear filters, dan hierarchy

##### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Audit UI penuh untuk page admin yang belum disemak habis:
  - [ ] `/admin/activity`
  - [ ] `/admin/reports`
  - [ ] `/admin/announcements`
  - [ ] `/admin/settings`
  - [ ] `/admin/health`
- [ ] Audit mobile UI untuk:
  - [ ] `/admin`
  - [ ] `/admin/approvals`
  - [ ] `/admin/residents`
  - [ ] `/admin/users`
  - [ ] `/admin/search`
  - [ ] `/admin/settings`
  - [ ] `/admin/reports`
- [ ] Contrast audit kecil pada komponen admin yang masih berbaki
- [ ] Semakan visual untuk empty state, success state, error state, dan loading state pada page admin
- [ ] Screenshot audit UI untuk page admin utama yang belum cukup

### Housekeeping kod

#### Sudah dibuat

- [x] `components/auth-panel.tsx` dibuang kerana tidak lagi digunakan
- [x] README disusun semula ikut fungsi sebenar `User` dan `Admin`
- [x] Checklist lama yang bercampur-campur diringkaskan supaya senang audit progress

#### Masih boleh dibuat

- [ ] Semakan berkala untuk dead code bila feature lama diubah atau dibuang
- [ ] Semakan semula struktur test/helper jika suite E2E terus bertambah

### Checklist go-live / live environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` betul
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` betul
- [ ] `SUPABASE_SERVICE_ROLE_KEY` betul
- [ ] `supabase/schema.sql` versi terbaru sudah dirun
- [ ] bucket `payment-proofs` wujud
- [ ] bucket `app-assets` wujud
- [ ] monthly fee sudah diisi
- [ ] QR bukan placeholder
- [ ] admin user boleh login
- [ ] resident user boleh login
- [ ] upload resit berfungsi di live
- [ ] admin approve / reject berfungsi di live
- [ ] admin mark cash paid berfungsi di live

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
|   |   |   |-- health/page.tsx
|   |   |   |-- reports/page.tsx
|   |   |   |-- reports/snapshot/route.ts
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
|   |-- seed-users.json
|   |-- seed-users.json.example
|   `-- seed-users.mjs
|-- supabase
|   `-- schema.sql
`-- tests
    `-- e2e
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

## Cara guna website

### Untuk user / penduduk

1. Buka `Login`
2. Masukkan nombor rumah sebagai username
3. Masukkan password semasa
4. Jika ini login pertama, tukar kata laluan di page `Change password`
5. Semak `Dashboard` untuk status bulan semasa, due date, dan notifikasi terkini
6. Buka `Payments` untuk lihat bank info, QR, dan muat naik resit
7. Selepas upload, status akan jadi `pending` sehingga admin semak
8. Buka `Notifications` untuk lihat update seperti approve, reject, atau cash paid
9. Buka `Profile` untuk kemas kini nama, alamat, nombor telefon, atau tukar kata laluan

### Untuk admin / jawatankuasa

1. Login sebagai `admin`
2. Buka `Settings` dahulu untuk semak:
   - community name
   - bank info
   - monthly fee
   - due day
   - QR image
3. Buka `Health` untuk semak readiness sistem
4. Buka `Dashboard` untuk lihat:
   - collection rate
   - latest submissions
   - resident belum settle
   - onboarding follow-up
5. Buka `Approvals` untuk approve atau reject resit
6. Buka `Residents` untuk follow-up, cash paid, reminder, CSV export, dan payment note
7. Buka `Resident detail` untuk lihat history, timeline, dan bukti lama
8. Buka `Users` untuk add, edit, reset password, atau delete user
9. Buka `Search` bila perlu cari cepat merentas resident, payment, dan activity
10. Buka `Reports` untuk print report atau download snapshot bulanan
11. Buka `Activity` untuk audit log terbaru 14 hari
12. Buka `Announcements` untuk publish notice

## Log aktiviti yang direkod

### Aktiviti user

- resident login
- resident logout
- resident update profile
- resident tukar password
- resident upload payment proof

### Aktiviti admin

- approve / reject payment
- mark cash paid / bulk cash paid
- update payment note
- update settings / QR
- publish / delete announcement
- create / update / reset password / delete user

Nota:

- page `Admin Activity` memaparkan log terbaru 14 hari sahaja supaya view global kekal ringan
- history penting payment masih kekal pada `Resident detail`

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
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
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
