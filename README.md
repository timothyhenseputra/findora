# Findora

Findora adalah aplikasi sistem temu barang hilang dan barang ditemukan untuk lingkungan kampus. Proyek ini menggabungkan antarmuka web modern, backend REST API, basis data PostgreSQL, serta fitur AI matching untuk membantu mencocokkan laporan barang hilang dengan barang temuan secara lebih cepat dan akurat.

## Gambaran Umum

Findora dirancang sebagai solusi end-to-end untuk proses pelaporan, pencarian, dan pencocokan barang. Admin dapat mengelola data barang temuan, memproses laporan barang hilang, melihat hasil rekomendasi kecocokan, mengirim notifikasi, dan menindaklanjuti status barang hingga selesai.

Sistem ini memakai pendekatan hybrid matching, yaitu kombinasi filtering berbasis kata kunci dan penilaian semantik berbasis AI, sehingga hasil pencocokan lebih relevan dibanding pencarian biasa yang hanya mengandalkan teks literal.

## Fitur Utama

- Pelaporan barang hilang dengan detail identitas pelapor dan deskripsi barang.
- Manajemen barang temuan lengkap dengan foto, kategori, lokasi ditemukan, dan status.
- Admin dashboard untuk memantau data, matching, dan notifikasi.
- Halaman statistik admin untuk melihat tren barang ditemukan dan dikembalikan berdasarkan tanggal, bulan, atau rentang waktu.
- Hybrid AI matching untuk mencocokkan laporan hilang dengan item temuan.
- Skor kecocokan dan breakdown hasil matching agar keputusan lebih transparan.
- Notifikasi dan email untuk tindak lanjut match.
- Autentikasi admin berbasis JWT.
- Reset password admin.
- Database relasional dengan Prisma ORM.

## Teknologi yang Digunakan

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Hook Form

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication
- Nodemailer
- Cloudinary untuk upload aset gambar

### AI dan Matching

- Hybrid matching pipeline
- Semantic embedding dengan `@xenova/transformers`
- Keyword filtering dan semantic reranking
- Google Generative AI untuk fitur analisis tertentu pada backend

## Cara Kerja Singkat

1. Pengguna membuat laporan barang hilang atau admin memasukkan barang temuan.
2. Sistem melakukan filtering awal berdasarkan kemiripan kata kunci.
3. Kandidat yang lolos difilter kembali menggunakan semantic similarity.
4. Hasil akhir disimpan sebagai data matching dengan skor dan breakdown.
5. Admin dapat meninjau hasil, mengonfirmasi, atau menolak kecocokan.

## Struktur Proyek

```text
findora/
├─ prisma/                # Schema dan migration database
├─ public/                # Asset statis
├─ src/
│  ├─ backend/            # Express API, service layer, AI matching
│  ├─ components/         # Komponen UI reusable
│  ├─ hooks/              # Custom React hooks
│  ├─ lib/                # Utility helper
│  └─ pages/              # Halaman aplikasi
│     └─ admin/           # Dashboard, login, register, statistics, dan fitur admin lain
├─ package.json
├─ vite.config.ts
└─ tailwind.config.ts
```

## Database Model

Skema Prisma saat ini mencakup:

- Admin
- LostReport
- FoundItem
- Notification
- Matching

## Environment Variables

Buat file `.env` di root project sebelum menjalankan backend. Variabel yang digunakan di kode saat ini:

```env
DATABASE_URL=
JWT_SECRET=
PORT=8080
EMAIL_USER=
EMAIL_PASS=
GOOGLE_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Instalasi dan Menjalankan Proyek

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan database

Pastikan PostgreSQL aktif, lalu sesuaikan `DATABASE_URL` pada `.env`.

### 3. Jalankan migration Prisma

```bash
npx prisma migrate dev
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Jalankan aplikasi

```bash
npm run start
```

Perintah di atas akan menjalankan frontend Vite dan backend Express secara bersamaan.

## Script Tersedia

```bash
npm run dev        # Jalankan frontend Vite
npm run server     # Jalankan backend Express
npm run start      # Jalankan frontend + backend bersamaan
npm run build      # Build production
npm run preview    # Preview hasil build
npm run lint       # Jalankan ESLint
```

## Endpoint Utama API

- `GET /api/health`
- `POST /api/admin/register`
- `POST /api/admin/login`
- `GET /api/found-items`
- `POST /api/found-items`
- `GET /api/lost-reports`
- `POST /api/lost-reports`

## Tentang Proyek Ini

Findora dibuat untuk mendukung proses administrasi barang hilang dan ditemukan agar lebih terstruktur, cepat, dan mudah dilacak. Fokus utamanya adalah pengalaman admin yang jelas, data yang rapi, serta proses matching yang lebih cerdas berkat kombinasi filtering tradisional dan AI.

## Catatan Penting

- File `.env` tidak boleh diunggah ke GitHub.
- Folder `node_modules` dan `dist` tidak perlu dimasukkan ke repository.
- Jika Anda ingin menambahkan dokumentasi tambahan, letakkan di folder terpisah agar README tetap ringkas dan mudah dibaca.
