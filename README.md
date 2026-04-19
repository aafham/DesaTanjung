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
- `Playwright`
- `Vercel`

## Test automation

Playwright telah disediakan untuk regression test asas auth flow dan smoke test dashboard.

1. Salin `.env.e2e.example` ke `.env.e2e.local`
2. Isi account yang sesuai untuk test:
   - `E2E_ADMIN_IDENTIFIER` + `E2E_ADMIN_PASSWORD`
   - `E2E_RESIDENT_IDENTIFIER` + `E2E_RESIDENT_PASSWORD`
   - `E2E_FIRST_LOGIN_*` hanya untuk account disposable kerana test ini akan tukar password
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

## Status checklist projek

Bahagian ini sesuai dijadikan rujukan cepat untuk tengok progress semasa project.

### Sudah siap

- [x] Login menggunakan `nombor rumah / username`
- [x] Login admin menggunakan `admin`
- [x] Paksa tukar kata laluan pada login pertama
- [x] Dashboard resident
- [x] Page pembayaran resident
- [x] Muat naik resit ke Supabase Storage
- [x] Sejarah bayaran resident
- [x] Timeline aktiviti bayaran
- [x] Resident notification inbox
- [x] Resident UI final polish:
  - [x] dashboard action flow
  - [x] payments page summary + next-step guidance
  - [x] profile layout refinement
  - [x] mobile-friendly payment history
- [x] Resident profile update:
  - [x] nama
  - [x] alamat
  - [x] nombor telefon
- [x] Dashboard admin
- [x] UI admin dikemaskan dan diseragamkan:
  - [x] dashboard
  - [x] approvals
  - [x] reports
- [x] Approval queue admin
- [x] Approve payment
- [x] Reject payment dengan sebab reject
- [x] Nota admin pada payment
- [x] Mark cash paid
- [x] Bulk mark cash paid
- [x] Residents page dengan search, filter, CSV export
- [x] Resident detail page
- [x] Users page:
  - [x] add user
  - [x] edit user
  - [x] reset password
  - [x] delete user
  - [x] last login
  - [x] last logout
- [x] Admin global search
- [x] Users page polish
- [x] Search page polish
- [x] Admin activity page
- [x] Admin reports page
- [x] Admin notices / announcements
- [x] Admin settings page
- [x] Pagination untuk senarai panjang:
  - [x] admin activity
  - [x] admin users
  - [x] admin residents
  - [x] resident notifications
- [x] Loading screen for sidebar navigation inside the portal
- [x] Upload QR image dalam settings
- [x] Dropdown bank Malaysia dalam settings
- [x] Admin health page
- [x] Activity log resident untuk:
  - [x] login
  - [x] logout
  - [x] update profile
  - [x] tukar password
  - [x] upload payment proof
- [x] Call / WhatsApp action
- [x] Bulk WhatsApp reminder draft
- [x] Preview resit lama
- [x] Loading state untuk action penting
- [x] Performance polish ringan:
  - [x] elak fetch settings berganda pada resident payments page
  - [x] cache app settings per request
  - [x] loading state lebih jelas semasa navigation dalam portal
- [x] Login page kemas
- [x] Konsistensi font seluruh app
- [x] README setup + walkthrough admin + resident

### Masih perlu dibuat / boleh dipertingkatkan

- [x] Filter admin yang lebih mendalam:
  - [x] `missing phone`
  - [x] `never logged in`
  - [x] `inactive users`
  - [x] `overdue only`
  - [x] `rejected only`
- [x] Resident upload UX lebih baik:
  - [x] preview gambar sebelum submit
  - [x] mesej saiz / jenis fail lebih jelas
  - [x] retry flow yang lebih mesra
- [x] Bulk WhatsApp ikut selection dengan pilihan template mesej:
  - [x] unpaid
  - [x] overdue
  - [x] rejected
- [x] Data health helper yang lebih action-oriented:
  - [x] duplicate payment cleanup helper
  - [x] missing phone export
  - [x] schema mismatch detector yang lebih spesifik
- [x] Report versi lebih formal untuk mesyuarat:
  - [x] layout A4 penuh
  - [x] ruang tandatangan AJK
  - [x] ruang catatan mesyuarat
  - [x] PDF-ready styling
- [x] Final polish `Users` dan `Search` untuk filter lanjutan
  - [x] statistik cepat untuk onboarding dan follow-up
  - [x] carian `Users` lebih luas:
    - [x] alamat
    - [x] email
  - [x] `clear filters` / `reset view`
  - [x] quick jump ke direktori user
  - [x] `Search` focus mode:
    - [x] all
    - [x] residents
    - [x] payments
    - [x] activity
- [x] Resident notification management:
  - [x] mark as read
  - [x] filter by type
  - [x] badge count lebih jelas
- [ ] Accessibility pass akhir:
  - [x] focus state
  - [x] skip to content link
  - [ ] contrast audit
  - [ ] keyboard flow
- [ ] Test automation untuk flow kritikal:
  - [x] Playwright config + env template
  - [x] login smoke tests:
    - [x] login page render
    - [x] invalid login error
    - [x] admin login
    - [x] resident login
    - [x] first-login password change flow
  - [ ] resident upload resit
  - [ ] admin approve / reject payment
  - [ ] admin mark cash paid
  - [ ] settings update + QR upload
- [ ] Error handling & operational hardening:
  - [ ] mesej error yang lebih konsisten pada server action utama
  - [ ] retry / rollback plan untuk upload + submit flow
  - [ ] semakan audit log untuk action kritikal admin
- [ ] Performance & scalability pass:
  - [ ] pagination / server-side narrowing untuk global search bila data makin besar
  - [ ] image compression / resize sebelum upload resit
  - [ ] semakan index database untuk query admin yang kerap
- [ ] UX polish seterusnya:
  - [ ] onboarding banner untuk admin bila ada `missing phone` atau `never logged in`
  - [ ] shortcut action pada search result untuk terus approve / follow-up
  - [ ] resident reminder copy yang boleh pilih tone mesej

### Checklist test flow utama

#### Resident

- [ ] Login guna nombor rumah
- [ ] Tukar password kali pertama
- [ ] Lihat dashboard bulan semasa
- [ ] Semak due date dan monthly fee
- [ ] Buka page payments
- [ ] Nampak bank info dan QR
- [ ] Upload resit
- [ ] Status jadi `pending`
- [ ] Notification resident masuk
- [ ] Profile update berjaya
- [ ] History payment dipaparkan
- [ ] Sign out direkod

#### Admin

- [ ] Login sebagai admin
- [ ] Nampak resident upload di approvals
- [ ] Approve payment
- [ ] Reject payment
- [ ] Mark cash paid
- [ ] Lihat update status di residents
- [ ] Lihat activity log resident
- [ ] Search resident / payment / activity
- [ ] Update settings
- [ ] Upload QR baru
- [ ] Tambah user baru
- [ ] Reset password user
- [ ] Delete user ujian
- [ ] Buka health page dan semak semua check penting
- [ ] Print report

### Checklist deployment / live environment

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

## Walkthrough penuh dari awal sampai habis

Bahagian ini sesuai untuk orang yang baru pertama kali guna sistem dan mahu ikut langkah satu per satu.

## Walkthrough resident

### A. Kali pertama log masuk

1. Buka page `Login`
2. Masukkan `nombor rumah` sebagai username
   - contoh: `A-12`
3. Masukkan password semasa
   - default awal: `password`
4. Tekan `Masuk portal`
5. Sistem akan bawa ke page `Change password`
6. Masukkan password baru dan sahkan password baru
7. Selepas berjaya, sistem akan bawa resident ke `Dashboard`

### B. Semak status bulan semasa

Di `Dashboard`, resident patut semak:

1. status bulan semasa
   - `Paid`
   - `Pending review`
   - `Awaiting payment`
   - `Rejected`
   - `Overdue`
2. due date bulan semasa
3. monthly fee
4. mesej tindakan seterusnya
5. notifikasi terbaru

Kalau status `Awaiting payment`, resident perlu pergi ke `Payments`.

### C. Buat bayaran dan upload resit

Di page `Payments`:

1. semak nama bank
2. semak nama pemegang akaun
3. semak nombor akaun
4. scan QR jika disediakan
5. buat bayaran melalui bank transfer / QR
6. pilih fail gambar resit
7. tekan submit upload resit

Selepas itu:

1. resit akan disimpan dalam Supabase Storage
2. rekod bayaran bulan semasa akan jadi `pending`
3. admin akan nampak resit itu dalam `Approvals`
4. resident akan dapat notifikasi bahawa resit telah dihantar

### D. Tunggu semakan admin

Selepas upload:

1. resident boleh buka `Dashboard`
2. atau buka `Notifications`
3. tunggu status berubah

Kemungkinan hasil:

- `Approved` -> bayaran diterima
- `Rejected` -> perlu upload semula resit yang betul atau lebih jelas

### E. Kalau resit ditolak

Jika admin reject:

1. resident akan nampak status `Rejected`
2. resident akan nampak sebab reject
3. resident pergi semula ke `Payments`
4. upload resit baru
5. status akan kembali `Pending review`

### F. Kemas kini profil

Resident boleh buka `Profile` untuk:

1. semak nombor rumah
2. semak nama pemilik
3. semak alamat rumah
4. semak nombor telefon
5. update nama, alamat, dan nombor telefon jika perlu

Setiap update ini akan masuk ke activity log admin.

### G. Semak rekod lama

Resident boleh:

1. buka `Dashboard`
2. lihat `Payment history`
3. lihat status bagi bulan-bulan lepas
4. buka semula resit lama jika ada

### H. Akhir sekali

Bila selesai:

1. semak notifikasi terakhir
2. pastikan status bulan semasa betul
3. tekan `Sign out`

## Walkthrough admin

### A. Setup awal sebelum resident guna

Sebelum mula guna sistem secara sebenar, admin patut buat ini dahulu:

1. login sebagai `admin`
2. buka `Settings`
3. isi / semak:
   - community name
   - bank name
   - account holder name
   - account number
   - monthly fee
   - due day
   - payment QR image
4. save settings
5. buka page `Health`
6. semak semua check penting
   - QR bukan placeholder
   - monthly fee sudah diisi
   - bucket storage wujud
   - tiada duplicate payment
   - env penting wujud

### B. Tambah resident baru

Di page `Users`:

1. isi nombor rumah
2. isi nama pemilik
3. isi alamat
4. isi nombor telefon
5. tekan `Add user`

Selepas itu:

- resident boleh login guna nombor rumah
- password awal resident ialah `password`

### C. Pantau dashboard admin

Di `Admin Dashboard`, admin boleh semak:

1. collection rate
2. jumlah paid / pending / needs attention / overdue
3. latest submissions
4. resident activity
5. uploaded proofs
6. notice board
7. reminder helper

Ini biasanya page utama untuk semakan harian.

### D. Semak resit yang baru dihantar

Bila resident upload resit:

1. admin buka `Approvals`
2. cari payment untuk bulan semasa
3. buka gambar resit
4. semak maklumat rumah, nama, phone number
5. semak timeline / nota jika perlu

Kemudian pilih salah satu:

- `Approve`
- `Reject`

### E. Approve payment

Jika resit betul:

1. admin tekan `Approve`
2. status payment akan jadi `paid`
3. resident akan dapat notification `approved`
4. page `Residents`, `Reports`, dan `Dashboard` akan update

### F. Reject payment

Jika resit tak jelas atau salah:

1. admin pilih sebab reject
2. admin boleh tambah nota jika perlu
3. admin tekan `Reject`
4. status payment akan jadi `rejected`
5. resident akan dapat notification dengan sebab reject

### G. Mark cash paid

Jika bayaran dibuat secara tunai:

1. admin buka `Residents`
2. cari resident
3. tekan `Mark paid cash`
4. jika ramai resident sekali, pilih beberapa resident
5. guna `Bulk action`

Selepas itu:

- rekod payment akan jadi `paid`
- payment method akan jadi `cash`
- resident akan dapat notification `cash paid`

### H. Guna Residents page untuk follow-up

Di `Residents`, admin boleh:

1. search nama / nombor rumah / alamat / phone
2. filter status
3. filter payment method
4. export CSV
5. buka resident detail
6. copy reminder text
7. call resident
8. WhatsApp resident
9. simpan payment note

### I. Guna Users page untuk urus akaun

Di `Users`, admin boleh:

1. tambah resident baru
2. edit data resident
3. reset password resident
4. delete user
5. semak:
   - last login
   - last logout
   - missing phone
   - never logged in
   - inactive 30+ days
   - resident activity log

### J. Guna Search page

Di `Search`, admin boleh cari maklumat dengan cepat:

1. nama resident
2. nombor rumah
3. nombor telefon
4. payment bulan semasa
5. activity log

Sesuai untuk semakan cepat tanpa lompat banyak page.

### K. Guna Activity page

Di `Activity`, admin boleh audit apa yang resident telah buat:

1. login
2. logout
3. update profile
4. change password
5. upload payment proof

Sesuai untuk semakan dalaman dan troubleshooting.

### L. Guna Reports page

Di `Reports`, admin boleh:

1. semak expected collection
2. semak collected amount
3. semak outstanding amount
4. semak collection rate
5. semak breakdown setiap rumah
6. tekan `Print report`

Sesuai untuk mesyuarat AJK atau semakan bulanan.

### M. Guna Notices page

Di `Notices`, admin boleh:

1. create announcement
2. pilih audience
3. pin notice jika penting
4. publish

Resident akan nampak notice itu di dashboard / notifications flow yang berkaitan.

### N. Guna Health page

Di `Health`, admin boleh semak keadaan sistem:

1. env penting cukup atau tidak
2. QR placeholder masih ada atau tidak
3. monthly fee sudah lengkap atau tidak
4. bucket storage wujud atau tidak
5. duplicate payment wujud atau tidak
6. resident yang tiada phone number
7. pending proof yang belum direview
8. export senarai resident yang belum ada phone number
9. export duplicate payment report
10. salin SQL cleanup helper jika perlu bersihkan duplicate payment

Ini page terbaik bila rasa sistem “tak sync” atau nampak warning.

### O. Guna pagination pada senarai panjang

Untuk elak scroll terlalu panjang, sistem sekarang pecahkan senarai besar kepada beberapa page.

Admin boleh guna pagination pada:

1. `Activity`
2. `Users`
3. `Residents`

Resident pula ada pagination pada:

1. `Notifications`

Setiap page guna format:

- `<` untuk page sebelum
- nombor page seperti `1 2 3 4`
- `>` untuk page seterusnya

### P. Tutup kitaran bulanan

Pada hujung bulan atau selepas due date, admin biasanya akan buat:

1. buka `Dashboard`
2. semak siapa yang belum settle
3. guna reminder helper / WhatsApp
4. review semua pending proof
5. mark cash paid jika ada bayaran tunai
6. buka `Reports`
7. print report
8. simpan rekod untuk mesyuarat

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
- buka notifikasi ikut page jika senarai sudah banyak

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
- guna pagination 5 log satu page
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

### 12. Pagination untuk page panjang

Admin kini boleh guna pagination di:

- `Activity`
- `Users`
- `Residents`

Resident pula boleh guna pagination di:

- `Notifications`

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
