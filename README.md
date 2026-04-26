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
- Wiring suite telah disemak semula dan Playwright mengesan semua `15` test dengan betul.
- Suite disposable terkini berjaya dengan `14 passed, 1 skipped`; skip yang tinggal ialah settings mutation bila `E2E_ALLOW_SETTINGS_MUTATION` tidak dihidupkan.
- First-login resident kini boleh disediakan/reset dengan `npm run setup:e2e:first-login` sebelum full suite dijalankan.
- Mobile smoke coverage ditambah untuk page penting user dan admin melalui projek Playwright `mobile-smoke`.
- Flow admin mutation yang telah disahkan secara E2E: `approve`, `reject`, `cash paid`, `settings update`, dan `QR upload`.
- Flow user yang telah disahkan secara E2E: resident login, first-login change password, upload resit, profile update, notification selepas approve, dan notification selepas reject.
- Next dev origin warning untuk Playwright/localhost sudah dikemaskan melalui `allowedDevOrigins` di `next.config.ts`.
- Playwright config kini dijalankan secara serial untuk kurangkan flaky login pada environment Supabase remote.

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
npm run setup:e2e:first-login
npm run test:e2e
```

Command tambahan:

```bash
npm run test:e2e:ui
npm run test:e2e:headed
```

Nota: `npm run setup:e2e:first-login` menggunakan service role local untuk cipta/reset akaun disposable `E2E_FIRST_LOGIN_*`, kemudian mengemas kini `.env.e2e.local`. Jalankan semula command ini sebelum full suite jika test first-login baru sahaja menukar password account tersebut.

### Cadangan setup disposable untuk flow admin

Kalau nak habiskan checklist `mutation flow admin`, sediakan set minimum ini dalam `.env.e2e.local`:

- `E2E_ADMIN_IDENTIFIER` + `E2E_ADMIN_PASSWORD`
  - akaun admin sebenar untuk buka page admin dan sahkan action
- `E2E_PAYMENT_RESIDENT_IDENTIFIER` + `E2E_PAYMENT_RESIDENT_PASSWORD`
  - resident disposable untuk flow `upload -> approve / reject`
- `E2E_CASH_RESIDENT_HOUSE_NUMBER`
  - nombor rumah resident disposable untuk flow `mark cash paid`
- `E2E_ALLOW_SETTINGS_MUTATION=true`
  - hidupkan hanya pada environment disposable untuk test `settings + QR upload`

Cadangan amalan selamat:

- guna resident khas yang tidak dipakai untuk data sebenar komuniti
- guna month semasa sahaja untuk mutation test
- reset semula status account disposable selepas test jika perlu
- jangan hidupkan `E2E_ALLOW_SETTINGS_MUTATION=true` pada environment live sebenar

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
- [x] Pilihan bahasa `BM / English` disimpan dalam cookie supaya resident boleh tukar bahasa sendiri
- [x] Copy utama resident portal boleh bertukar BM/English untuk dashboard, bayaran, notifikasi, profil, upload resit, timeline, dan history
- [x] Upload resit ke Supabase Storage
- [x] Upload UX yang lebih baik:
  - [x] preview gambar
  - [x] semakan saiz / jenis fail
  - [x] optimize / resize ringan sebelum upload
  - [x] progress state semasa preparing / uploading / saving / refreshing
  - [x] retry / rollback flow jika submit gagal
- [x] Timeline aktiviti bayaran user
- [x] Sejarah bayaran user
- [x] Sejarah bayaran user dipage dari server supaya tidak load semua rekod lama sekali gus
- [x] Preview resit lama
- [x] Resident inbox / notification list
- [x] Notification management:
  - [x] mark single as read
  - [x] mark all as read
  - [x] filter by type
  - [x] badge count pada sidebar
  - [x] pagination untuk senarai panjang
  - [x] pagination server-side pada inbox penuh supaya notifikasi lama tidak diload semua sekali gus
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
- [x] Test automation user asas:
  - [x] login page render
  - [x] invalid login error
  - [x] resident login smoke test
- [x] Suite E2E user pada disposable/test account:
  - [x] first-login resident dengan akaun disposable yang boleh di-reset melalui script
  - [x] upload resit user
  - [x] notification selepas approve
  - [x] notification selepas reject
  - [x] profile update
- [x] Mobile smoke E2E user:
  - [x] dashboard user
  - [x] payments page
  - [x] notifications page
  - [x] profile page
- [x] Scalability user bila history makin panjang:
  - [x] payment history user guna `range` + `count` dari database
  - [x] notification inbox penuh guna `range` + `count` dari database

#### Masih perlu dibuat / boleh dipertingkatkan

- [ ] E2E user fasa seterusnya:
  - [ ] tambah mobile mutation assertions untuk upload sebenar pada disposable account khas
  - [ ] tambah assertion visual untuk layout mobile yang paling kritikal
- [ ] Tambah assertion visual / accessibility pada flow user yang paling penting:
  - [ ] upload resit
  - [ ] receipt preview modal
  - [ ] notification inbox
  - [ ] profile form
- [ ] Contrast + keyboard audit kecil yang masih berbaki pada page user:
  - [ ] login
  - [ ] payments upload
  - [ ] notifications
  - [ ] profile
- [ ] Mobile UI audit penuh untuk user:
  - [ ] `/login`
  - [ ] `/dashboard`
  - [ ] `/payments`
  - [ ] `/notifications`
  - [ ] `/profile`
- [ ] Scalability user fasa seterusnya:
  - [ ] semak query plan Supabase selepas rekod payment/notification sebenar makin banyak
  - [ ] pertimbangkan archive view berasingan jika penduduk mahu lihat rekod bertahun-tahun dalam satu carian khas

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
  - [x] export CSV penuh ikut filter semasa, bukan current page sahaja
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
  - [x] confirmation taip teks untuk reset password dan delete user
- [x] Search page dikemas semula sebagai `compact global finder`
- [x] Search features:
  - [x] focus mode `all / residents / payments / activity`
  - [x] shortcut action terus dari result
  - [x] pagination result
  - [x] server-side narrowing bila query digunakan
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
  - [x] environment security reminder untuk Vercel dan Supabase secret
  - [x] production error monitor untuk server action kritikal
- [x] Admin activity page
- [x] Admin activity dihadkan kepada log terbaru 14 hari untuk view global yang lebih ringan
- [x] Activity pagination dipadatkan dengan ellipsis supaya nombor page tidak serabut bila log banyak
- [x] Activity export CSV penuh ikut filter semasa, bukan current page sahaja
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
- [x] Pagination berpandukan server / URL untuk page admin besar:
  - [x] activity
  - [x] users
  - [x] residents
- [x] Pagination UI dipadatkan supaya hanya page penting, page semasa, ellipsis, previous, dan next dipaparkan
- [x] Query admin diperkemas lagi pada data layer:
  - [x] users guna filter + count + range terus dari database
  - [x] activity guna filter + count + range terus dari database
  - [x] residents default list dipage terus dari database bila tiada payment filter tambahan
- [x] Activity retention policy:
  - [x] global activity page kekal paparkan log terbaru 14 hari
  - [x] fungsi database `prune_user_activity_logs(90)` disediakan untuk prune log global lama
  - [x] butang maintenance di Health page untuk run prune 90 hari bila admin perlukan
  - [x] fungsi database `prune_server_action_errors(30)` disediakan untuk prune log error lama
  - [x] butang maintenance di Health page untuk run prune error 30 hari bila admin perlukan
  - [x] payment history dan payment audit kekal pada resident/payment detail
- [x] Performance / scalability admin yang sudah dibuat:
  - [x] server-side narrowing untuk global search
  - [x] semakan index database untuk query admin yang kerap
  - [x] query-plan checklist SQL disediakan di `supabase/query-plan-checklist.sql`
  - [x] pagination berpandukan server / URL untuk users, residents, dan activity
  - [x] query database diperketat lagi untuk users, activity, default residents list, dan residents payment filter
  - [x] activity retention / prune function disediakan dalam schema
  - [x] activity retention boleh dijalankan dari Admin Health sebagai maintenance action
  - [x] export CSV penuh ikut filter untuk activity
  - [x] export CSV penuh ikut filter untuk residents
  - [x] RPC admin `admin_resident_payment_rows` disediakan untuk elak load semua residents/payments bila filter status atau method aktif
- [x] Test automation tersedia untuk flow admin utama:
  - [x] admin login
  - [x] resident upload -> admin approve / reject
  - [x] mark cash paid
  - [x] settings update
  - [x] QR upload assertion
  - [x] assertion visual / accessibility asas pada flow admin penting
- [x] Error handling yang sudah dirapikan:
  - [x] mesej error yang lebih konsisten pada server action utama
  - [x] fail-safe yang lebih mesra pada flow kritikal admin
  - [x] server action error kritikal dilog ke `server_action_errors`
  - [x] log error production ada retention/cleanup 30 hari
- [x] Polisi operasi live admin yang sudah disediakan:
  - [x] elakkan kongsi satu akaun admin untuk ramai AJK
  - [x] sediakan akaun admin berasingan untuk audit yang lebih jelas
- [x] Operational readiness admin:
  - [x] SOP bulanan AJK untuk review payment, export report, backup data, dan maintenance log
  - [x] rhythm operasi bulanan dipaparkan di Health page
  - [x] go-live env security checklist dikemaskini untuk Vercel Sensitive secret dan key rotation
- [x] Safety refinement admin:
  - [x] reset password perlukan admin taip nombor rumah / username
  - [x] delete user perlukan admin taip `DELETE {nombor rumah}`
  - [x] server action validate confirmation text untuk reset password dan delete user
  - [x] delete user dilindungi supaya admin terakhir tidak boleh dipadam
  - [x] Users page ada account safety guide untuk action berisiko
  - [x] Health page ada emergency restore checklist untuk salah delete / salah update
- [x] Full admin E2E mutation flow sudah dijalankan pada disposable environment:
  - [x] approve
  - [x] reject
  - [x] cash paid
  - [x] settings update
  - [x] QR upload
- [x] Mobile smoke E2E admin:
  - [x] dashboard admin
  - [x] residents page
  - [x] activity page
  - [x] health page

#### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Performance / scalability admin fasa seterusnya:
  - [ ] run `supabase/query-plan-checklist.sql` di Supabase SQL Editor selepas data sebenar sudah banyak
  - [ ] enable PostgREST/Supabase explain plan jika mahu semak plan terus dari client
- [ ] Operational readiness admin:
  - [ ] panduan rotate admin bila jawatankuasa bertukar
- [ ] Security / permission refinement:
  - [ ] pecahkan role admin jika perlu, contoh `treasurer`, `viewer`, `super_admin`
  - [ ] hadkan action berisiko seperti delete user kepada admin tertentu
- [ ] Monitoring production fasa seterusnya:
  - [ ] semak warning deployment / runtime selepas live digunakan komuniti sebenar
  - [ ] pertimbangkan external alerting jika mahu notifikasi WhatsApp/email untuk error kritikal

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
- [x] Toggle bahasa `BM / English` ditambah untuk resident portal
- [x] Copy resident-facing diseragamkan untuk `Dashboard`, `Bayaran/Payments`, `Notifikasi/Notifications`, `Profil/Profile`, status badge, pagination, upload resit, timeline, dan history
- [x] Konsistensi font seluruh app
- [x] Focus state global diperkemas
- [x] Skip to content link disediakan
- [x] Live region untuk toast success / error
- [x] Contrast token global diperkuatkan
- [x] Mobile smoke test mengesahkan page user utama boleh dibuka pada viewport telefon

##### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Audit UI mobile penuh secara visual untuk:
  - [ ] `/login`
  - [x] `/dashboard` smoke-tested
  - [x] `/payments` smoke-tested
  - [x] `/notifications` smoke-tested
  - [x] `/profile` smoke-tested
- [ ] Contrast audit kecil pada komponen user yang masih berbaki
- [ ] Semakan visual untuk empty state, error state, dan loading state pada page user
- [ ] Screenshot audit UI untuk page user utama
- [ ] Sambung sokongan dwi-bahasa penuh untuk page auth awal seperti `Login` dan `Change password`

#### UI interface admin

##### Sudah siap

- [x] Sidebar admin diseragamkan supaya konsisten antara page
- [x] Admin dashboard dipolish semula
- [x] Approvals page dipolish semula
- [x] Residents page dipolish semula
- [x] Residents page toolbar, row action, phone warning, dan payment notes dikemaskan supaya lebih compact
- [x] Residents mobile/tablet cards diperkemas supaya action utama terus nampak tanpa perlu expand
- [x] Resident detail page dipolish semula
- [x] Resident detail `Payment activity` dihadkan kepada 4 log setiap page dengan pagination server-side
- [x] Resident detail `Payment activity` pagination dipadatkan supaya tidak serabut bila log banyak
- [x] Users page dipolish semula
- [x] Search page dipolish semula sebagai compact global finder
- [x] Announcements page dipolish semula dengan board summary, audience guide, dan pagination
- [x] Settings page dipolish semula dengan readiness summary, resident-facing preview, dan admin checklist
- [x] Health page dipolish semula dengan launch readiness summary dan follow-up buckets
- [x] Health page ditambah activity maintenance card dan monthly operation rhythm
- [x] Health page dikemas semula sebagai readiness board yang lebih mesra admin penduduk:
  - [x] action penting diletakkan di atas
  - [x] ringkasan `Live access`, `Payment setup`, `Follow-up`, dan `Data safety`
  - [x] technical checks, maintenance, security, dan SQL helper dipindahkan ke bahagian collapsible
- [x] Activity page dipolish semula dengan audit summary dan clearer filtered export workflow
- [x] Reports page dipolish semula dengan meeting highlights dan follow-up queue
- [x] Keyboard-first admin filtering diperkemas pada users, residents, search, activity, dan month filter
- [x] Contrast admin diperkemas lagi pada reminder panel gelap dan report copy yang masih borderline
- [x] Search panel sidebar issue dibetulkan supaya tidak mengecil pada page tertentu
- [x] Admin search result dipadatkan dengan pagination
- [x] Expandable admin cards ada focus hint dan keyboard style yang lebih baik
- [x] Contact actions, timeline, history, dan metadata admin diperkemas dari segi contrast
- [x] Activity page diperkemas dari segi summary filter, clear filters, dan hierarchy
- [x] Activity page pagination diperkemas supaya tidak memaparkan semua nombor page sekaligus
- [x] Activity page export CSV dipindahkan ke server route supaya ikut semua filter dan tidak bergantung pada current page
- [x] Residents page export CSV dipindahkan ke server route supaya ikut semua filter dan tidak bergantung pada current page
- [x] Mobile smoke test mengesahkan page admin utama boleh dibuka pada viewport telefon

##### Masih perlu dibuat / boleh dipertingkatkan

- [ ] Audit mobile UI admin penuh secara visual untuk:
  - [x] `/admin` smoke-tested
  - [ ] `/admin/approvals`
  - [x] `/admin/residents` smoke-tested
  - [ ] `/admin/users`
  - [ ] `/admin/search`
  - [ ] `/admin/settings`
  - [ ] `/admin/reports`
  - [x] `/admin/activity` smoke-tested
  - [x] `/admin/health` smoke-tested
- [ ] Semakan visual state admin:
  - [ ] empty state
  - [ ] success state
  - [ ] error state
  - [ ] loading state
- [ ] Screenshot audit akhir untuk desktop dan mobile selepas data sebenar dimasukkan
- [ ] Semak semula sama ada `Search` masih perlu kekal di sidebar selepas admin sebenar guna sistem beberapa minggu

### Housekeeping kod

#### Sudah dibuat

- [x] `components/auth-panel.tsx` dibuang kerana tidak lagi digunakan
- [x] helper `getWhatsAppResidents` dibuang kerana tidak lagi digunakan
- [x] server action `createCurrentMonthRecordAction` dibuang kerana tiada caller aktif
- [x] README disusun semula ikut fungsi sebenar `User` dan `Admin`
- [x] Checklist lama yang bercampur-campur diringkaskan supaya senang audit progress
- [x] ESLint diarah ignore output generated seperti `.next`, `playwright-report`, dan `test-results`
- [x] Playwright dipecahkan kepada projek `chromium` dan `mobile-smoke` supaya mutation test tidak digandakan pada viewport mobile
- [x] Script `setup:e2e:first-login` ditambah untuk cipta/reset akaun first-login disposable

#### Masih boleh dibuat

- [ ] Semakan berkala untuk dead code bila feature lama diubah atau dibuang
- [ ] Semakan semula struktur test/helper jika suite E2E terus bertambah melebihi smoke + mutation flow semasa
- [ ] Pecahkan `lib/data.ts` kepada modul lebih kecil jika data layer terus membesar:
  - [ ] user data
  - [ ] admin dashboard data
  - [ ] reports data
  - [ ] health data
  - [ ] search data
- [ ] Kuatkan typing untuk query builder helper supaya tidak bergantung pada `any`

### Checklist go-live / live environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` betul
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` betul
- [ ] `SUPABASE_SERVICE_ROLE_KEY` betul, server-only, dan ditanda `Sensitive` di Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah dirotate jika pernah terdedah di chat, screenshot, log, atau repo
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
|   |   |   |-- activity/export/route.ts
|   |   |   |-- announcements/page.tsx
|   |   |   |-- approvals/page.tsx
|   |   |   |-- health/page.tsx
|   |   |   |-- reports/page.tsx
|   |   |   |-- reports/snapshot/route.ts
|   |   |   |-- residents/page.tsx
|   |   |   |-- residents/[id]/page.tsx
|   |   |   |-- residents/export/route.ts
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
|   |-- query-plan-checklist.sql
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
- `NEXT_PUBLIC_*` memang public dan boleh dilihat browser
- `SUPABASE_SERVICE_ROLE_KEY` ialah server secret; jangan paste dalam chat, jangan commit, dan rotate jika terdedah

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
- `public.server_action_errors`
- `public.app_settings`
- `public.announcements`
- RLS policies
- storage bucket:
  - `payment-proofs`
  - `app-assets`

Penting:

- setiap kali schema berubah, run semula fail ini di Supabase
- selepas data sebenar makin banyak, run [supabase/query-plan-checklist.sql](C:\Users\aafha\OneDrive\Documents\GitHub\DesaTanjung\supabase\query-plan-checklist.sql) untuk semak plan query penting

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
5. Jika mahu, tukar bahasa melalui toggle `BM / English` di sidebar resident
6. Semak `Dashboard` untuk status bulan semasa, due date, dan notifikasi terkini
7. Buka `Bayaran / Payments` untuk lihat bank info, QR, dan muat naik resit
8. Selepas upload, status akan jadi `Dalam semakan / Under review` sehingga admin semak
9. Buka `Notifikasi / Notifications` untuk lihat update seperti approve, reject, atau cash paid
10. Buka `Profil / Profile` untuk kemas kini nama, alamat, nombor telefon, atau tukar kata laluan

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
8. Buka `Users` untuk add, edit, reset password, delete user, atau cipta akaun admin berasingan
9. Buka `Search` bila perlu cari cepat merentas resident, payment, dan activity
10. Buka `Reports` untuk print report atau download snapshot bulanan
11. Buka `Activity` untuk audit log terbaru 14 hari
12. Buka `Announcements` untuk publish notice
13. Selepas report bulanan disimpan, buka `Health` dan run `Run 90-day prune` jika mahu buang global activity log lama

Nota operasi admin:

- elakkan kongsi satu login admin untuk ramai AJK
- cipta satu akaun admin berasingan bagi setiap jawatankuasa yang perlu akses
- ini akan buat audit log lebih jelas bila ada approve, reject, settings update, atau user management
- untuk reset password, admin perlu taip nombor rumah / username sebelum confirm
- untuk delete user, admin perlu taip `DELETE {nombor rumah}` sebelum confirm
- sistem juga semak confirmation text di server action, bukan di browser sahaja
- admin terakhir tidak boleh dipadam; cipta admin baru dahulu jika jawatankuasa bertukar
- sebelum delete akaun sebenar, export laporan/backup dahulu kerana login account akan dibuang

### SOP bulanan AJK

1. Sebelum kutipan dibuka, semak `Settings` untuk QR, bank info, monthly fee, dan due day.
2. Semak `Health` untuk missing phone, duplicate payment, dan readiness sistem.
3. Semasa kutipan berjalan, guna `Approvals` untuk approve/reject resit dan `Residents` untuk cash paid atau reminder.
4. Selepas due date, export CSV dari `Residents`, print/download snapshot dari `Reports`, dan simpan backup laporan bulanan.
5. Selepas laporan disimpan, run `Run 90-day prune` di `Health` jika mahu buang global activity log lama.
6. Bila jawatankuasa bertukar, cipta akaun admin baru di `Users` dan elakkan berkongsi akaun lama.

### Emergency jika tersilap update / delete

1. Minta admin lain berhenti buat perubahan sementara.
2. Buka `Activity` untuk semak siapa buat perubahan dan masa perubahan berlaku.
3. Buka `Resident detail` untuk semak payment timeline, audit history, dan bukti bayaran lama.
4. Jika user terpadam, cipta semula akaun di `Users` dan rujuk backup CSV/report untuk isi semula profil.
5. Jika payment tersilap, guna `Residents` untuk mark cash / note semula atau semak Supabase backup sebelum update manual.
6. Selepas selesai, catat dalam notes/report supaya AJK tahu apa yang dipulihkan.

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
- schema menyediakan fungsi `public.prune_user_activity_logs(90)` untuk buang global activity log yang lebih lama daripada 90 hari
- schema menyediakan fungsi `public.prune_server_action_errors(30)` untuk buang error monitor lama selepas 30 hari
- fungsi prune ini hanya menyentuh `user_activity_logs`, bukan `payments` atau `payment_audit_logs`
- error monitor prune hanya menyentuh `server_action_errors`
- cadangan operasi live: jalankan prune sebulan sekali selepas backup atau selepas laporan bulanan disimpan

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

Nota:

- page `Notifications` guna server-side pagination, 10 rekod setiap page
- dashboard user hanya paparkan ringkasan notifikasi terbaru supaya page utama kekal ringan
- payment history user guna pagination server-side, 6 rekod setiap page

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

## Review terkini

Semakan semula codebase terkini menunjukkan sistem sudah kuat untuk flow asas admin dan user. E2E kini meliputi desktop mutation flow, first-login disposable reset, dan mobile smoke untuk page utama. Fokus penambahbaikan selepas ini patut bergerak kepada operasi live, data yang semakin besar, dan audit visual mobile sebenar.

Keutamaan seterusnya:

- jadualkan rutin `prune_user_activity_logs(90)` selepas portal live
- run `supabase/query-plan-checklist.sql` di Supabase SQL Editor selepas data sebenar sudah banyak
- `mobile UI audit` visual untuk user dan admin menggunakan screenshot sebenar telefon
- tambah mobile mutation assertions hanya untuk flow yang benar-benar kritikal supaya suite tidak terlalu berat
- pantau Production error monitor di Health selepas portal digunakan komuniti sebenar

## Scripts yang tersedia

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run setup:e2e:first-login
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

Security penting:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` boleh kekal sebagai regular env kerana ia public by design.
- `SUPABASE_SERVICE_ROLE_KEY` mesti server-only, jangan ada prefix `NEXT_PUBLIC_`.
- Di Vercel, mark `SUPABASE_SERVICE_ROLE_KEY` sebagai `Sensitive`.
- Jika key pernah terlihat dalam screenshot, chat, terminal log, atau commit, rotate key baru di Supabase dahulu.
- Selepas update env di Vercel, redeploy production supaya key baru digunakan.

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
- lepas rotate, update `SUPABASE_SERVICE_ROLE_KEY` di Vercel dan `.env.local`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` bukan secret, tapi tetap perlu guna project Supabase yang betul
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
