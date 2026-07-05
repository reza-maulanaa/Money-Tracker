# Catatan Keuangan (Expense Tracker)

Personal expense & budget tracker. Next.js 16 (App Router) + TypeScript +
Drizzle ORM + Neon Postgres. Single-user, di-gate pake 1 passcode (bukan
sistem auth multi-user) -- deploy full di Vercel Hobby (gratis).

## Stack

- Next.js 16.2 (App Router, Turbopack, `proxy.ts`)
- TypeScript
- Tailwind CSS v4
- Drizzle ORM + `@neondatabase/serverless` (neon-http driver)
- `jose` buat sign/verify session JWT
- Zod buat validasi input

## 1. Setup lokal

### Prasyarat
- Node.js 20+ dan npm
- Akun [Neon](https://neon.tech) (gratis, gak perlu kartu kredit)
- Akun [Vercel](https://vercel.com) (gratis) buat deploy nanti
- Akun GitHub (buat hubungin ke Vercel)

### Langkah

```bash
# 1. Install dependencies
npm install

# 2. Bikin project Postgres di Neon
#    - neon.tech -> New Project -> kasih nama (misal "expense-tracker")
#    - Dashboard -> Connect -> copy connection string (yang ada ?sslmode=require)

# 3. Bikin .env.local dari template
cp .env.example .env.local

# 4. Generate secret buat session JWT (WAJIB, jangan dikosongin/asal-asalan)
openssl rand -base64 32
#    -> copy hasilnya ke APP_COOKIE_SECRET di .env.local

# 5. Edit .env.local, isi 3 variabel:
#    DATABASE_URL       -> connection string dari Neon
#    APP_PASSCODE       -> passcode pilihan lo sendiri
#    APP_COOKIE_SECRET  -> hasil openssl di atas

# 6. Push schema ke Neon (bikin tabel categories/transactions/budgets)
npm run db:push

# 7. Jalanin dev server
npm run dev
```

Buka `http://localhost:3000` -> bakal di-redirect ke `/login` -> masukin
`APP_PASSCODE` yang lo set di `.env.local`.

### Urutan pemakaian pertama kali
1. Buka `/categories`, bikin minimal 1 kategori tipe "Pengeluaran" dan 1
   tipe "Pemasukan".
2. Buka `/transactions`, mulai catet.
3. Buka `/budgets`, set limit bulanan buat kategori pengeluaran yang mau
   di-track.

## 2. Kenapa schema-nya kayak gini

Detail lengkap ada di komentar `src/db/schema.ts`, ringkasannya:

- **`amount` disimpen sebagai `integer` (rupiah utuh), bukan
  `float`/`decimal`.** Float bahaya buat duit (floating point precision
  error). Decimal aman tapi Drizzle balikin sebagai string yang harus
  di-parse manual. Karena rupiah gak punya subunit yang dipakai
  sehari-hari, integer adalah solusi paling simpel yang tetep bebas bug.
- **`transactions.category_id` pake `onDelete: "restrict"`**, bukan
  cascade -- kategori yang masih punya transaksi gak bisa dihapus
  (Postgres nolak duluan), biar histori transaksi gak ke-hapus diam-diam.
- **`budgets` punya `unique(categoryId, month)`** di level DB -- constraint
  integrity dipaksa di database, bukan cuma "diinget" sama kode aplikasi.
  Semangatnya sama kayak EXCLUDE constraint di project futsal lo.
- **Gak ada tabel `users`** -- app ini single-tenant (cuma lo yang pake),
  jadi gak ada foreign key ke user manapun.

## 3. Cara kerja passcode gate

Ini BUKAN sistem auth multi-user kayak Notes-app/zazstore (gak ada tabel
`users`, gak ada bcrypt/registrasi). Cuma 1 passcode yang lo tentuin
lewat env var:

1. `src/proxy.ts` (menggantikan `middleware.ts` sejak Next.js 16 --
   [rename resmi](https://nextjs.org/docs/messages/middleware-to-proxy),
   bukan typo) cuma ngecek **keberadaan** cookie session. Cepat, murah,
   gak ada crypto check di sini.
2. `src/lib/auth.ts` -> `requireAuth()`, dipanggil di
   `src/app/(protected)/layout.tsx`, ngelakuin verifikasi JWT yang
   **otoritatif** (`jose.jwtVerify`). Ini "Thin Proxy" pattern yang
   direkomendasiin Next.js 16: proxy cuma buat routing, verifikasi berat
   dipindah ke Server Component.
3. Kenapa dipisah gini (bukan taruh semua di proxy kayak dulu): terkait
   sama CVE-2025-29927 yang udah lo temuin sebelumnya (auth bypass di
   middleware Next.js) -- restrukturisasi proxy.ts di v16 sebagian
   respons ke kelas masalah itu.

## 4. Deploy ke Vercel

```bash
# Init git & push ke GitHub (bikin repo baru dulu di github.com)
git init
git add .
git commit -m "init: expense tracker"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

Lanjut di dashboard Vercel:
1. **Add New -> Project** -> import repo GitHub yang barusan di-push.
2. Vercel otomatis detect Next.js, gak perlu ubah build settings.
3. Sebelum klik Deploy, buka **Environment Variables**, isi 3 variabel
   yang sama kayak `.env.local`:
   - `DATABASE_URL`
   - `APP_PASSCODE`
   - `APP_COOKIE_SECRET`
4. Klik **Deploy**.
5. Setelah selesai, buka domain yang dikasih Vercel
   (`nama-project.vercel.app`) dari HP -- bakal ke-redirect ke `/login`.

Karena app ini pake Neon (bukan SQLite lokal kayak ezbookkeeping) dan
gak ada proses yang perlu "nyala terus" (semua lewat Server
Actions/serverless functions yang idle di antara request), ini 100%
cocok sama model Vercel -- beda total dari masalah yang lo temuin di
awal.

**Ingat:** Vercel Hobby gak nge-protect production URL secara built-in
(itu fitur Pro $150/bulan add-on). Passcode gate di atas itu yang jadi
proteksi lo -- jangan skip langkah generate `APP_COOKIE_SECRET` yang
kuat.

## 5. Perintah penting

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build (buat cek sebelum deploy)
npm run db:generate  # generate file migrasi SQL dari perubahan schema.ts
npm run db:push      # langsung sinkronin schema ke DB (buat dev/prototype)
npm run db:studio    # buka Drizzle Studio, GUI buat liat isi tabel
```

## 6. Ide pengembangan lanjutan

- Filter transaksi per kategori/rentang tanggal
- Grafik pengeluaran per kategori (pake `recharts`)
- Export CSV
- Multi-bulan view di halaman budget (sekarang cuma nampilin bulan
  berjalan)
