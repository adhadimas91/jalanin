# MVP Product Brief — Jalanin

## 1. Ringkasan Produk

**Jalanin** adalah platform sosial travel untuk menemukan, membuat, menyimpan, dan membagikan itinerary perjalanan.

Konsep utamanya adalah:

> **Instagram untuk itinerary perjalanan.**

Pengguna tidak hanya melihat foto atau video liburan, tetapi juga bisa melihat rute perjalanan, jadwal harian, estimasi budget, lokasi, dan aktivitas yang bisa langsung disimpan atau digunakan ulang.

---

## 2. Masalah yang Ingin Diselesaikan

Banyak orang ingin liburan, tetapi sering mengalami masalah berikut:

1. Bingung menentukan destinasi dan aktivitas.
2. Harus mencari referensi dari banyak tempat seperti Instagram, TikTok, Google Maps, blog, dan YouTube.
3. Sulit menyusun jadwal perjalanan yang efisien.
4. Tidak tahu estimasi budget yang realistis.
5. Konten travel di media sosial menarik, tetapi tidak langsung bisa dijadikan itinerary.
6. Itinerary dari orang lain sulit disimpan, diedit, dan digunakan ulang.

---

## 3. Solusi

Jalanin menyediakan satu platform tempat pengguna bisa:

- Melihat inspirasi perjalanan dari traveler lain.
- Membaca itinerary lengkap di balik sebuah trip.
- Menyimpan itinerary ke koleksi pribadi.
- Menggunakan itinerary orang lain sebagai template.
- Mengedit itinerary sesuai tanggal, budget, lokasi hotel, dan jumlah peserta.
- Membagikan itinerary mereka sendiri setelah perjalanan selesai.

---

## 4. Target User MVP

### Primary User

**Traveler muda usia 18–35 tahun** yang sering mencari inspirasi liburan dari media sosial dan ingin itinerary yang praktis.

Contoh:
- Mahasiswa
- Pekerja muda
- Backpacker
- Couple traveler
- Solo traveler
- Content creator travel pemula

### Secondary User

- Keluarga muda yang ingin itinerary praktis.
- Travel planner independen.
- Local guide.
- Creator yang ingin membagikan rute perjalanan.

---

## 5. Value Proposition

> **Temukan trip. Simpan rute. Jalanin.**

Jalanin membantu pengguna mengubah inspirasi travel menjadi rencana perjalanan yang bisa langsung digunakan.

### Pembeda Utama

| Platform | Fokus Utama | Kekurangan |
|---|---|---|
| Instagram | Foto dan video | Tidak punya itinerary terstruktur |
| TikTok | Video pendek | Sulit menyimpan detail rute dan budget |
| Google Maps | Lokasi | Tidak fokus pada pengalaman perjalanan lengkap |
| Blog Travel | Artikel panjang | Kurang sosial dan kurang mudah diedit |
| Jalanin | Konten travel + itinerary | Bisa dilihat, disimpan, diedit, dan digunakan |

---

## 6. Tujuan MVP

MVP tidak perlu membangun semua fitur besar sejak awal. Fokus utama MVP adalah membuktikan bahwa pengguna tertarik pada konsep:

> **Melihat itinerary orang lain dan menyimpannya untuk digunakan sendiri.**

### Tujuan Validasi

1. Apakah user mau melihat itinerary dalam format sosial seperti feed?
2. Apakah user mau menyimpan itinerary dari orang lain?
3. Apakah user mau membuat dan membagikan itinerary sendiri?
4. Apakah itinerary berbasis konten lebih menarik dibanding itinerary kosong/manual?
5. Apakah user merasa terbantu dengan estimasi budget dan rute?

---

## 7. Fitur MVP

### 7.1 Authentication

Fitur dasar akun pengguna.

**Scope MVP:**
- Sign up
- Login
- Logout
- Edit profile sederhana

**Data profile:**
- Nama
- Username
- Foto profil
- Bio singkat
- Kota asal

---

### 7.2 Feed Itinerary

Feed utama berisi postingan perjalanan dari pengguna lain.

Setiap post berisi:
- Foto cover
- Judul trip
- Destinasi
- Durasi perjalanan
- Estimasi budget
- Travel style
- Jumlah save
- Username creator

Contoh:

```text
3D2N di Yogyakarta
Budget: Rp1.500.000
Style: Kuliner, Couple, Budget Trip
By: @nabila.travel
```

**Action:**
- View detail
- Save itinerary
- Like post

---

### 7.3 Detail Itinerary

Halaman detail untuk melihat isi itinerary secara lengkap.

Isi halaman:
- Judul itinerary
- Deskripsi singkat
- Destinasi
- Durasi
- Estimasi budget
- Foto/video
- Jadwal per hari
- Daftar tempat
- Catatan creator
- Tombol save
- Tombol use this itinerary

Contoh struktur:

```text
Hari 1
09.00 - Tiba di Yogyakarta
10.00 - Check-in hotel
12.00 - Makan siang di Gudeg Yu Djum
14.00 - Taman Sari
17.00 - Malioboro
20.00 - Alun-Alun Kidul
```

---

### 7.4 Create Itinerary

User bisa membuat itinerary sendiri.

**Field MVP:**
- Judul itinerary
- Destinasi utama
- Durasi
- Cover image
- Deskripsi
- Estimasi budget
- Travel style
- Hari perjalanan
- Aktivitas per hari
- Lokasi aktivitas
- Estimasi biaya per aktivitas
- Catatan tambahan

**Travel style options:**
- Budget trip
- Backpacker
- Couple
- Family
- Luxury
- Kuliner
- Nature
- City tour
- Hidden gems

---

### 7.5 Save Itinerary

User bisa menyimpan itinerary yang mereka suka.

**Scope MVP:**
- Save itinerary
- Unsave itinerary
- Lihat daftar itinerary yang disimpan di profile

Nama fitur:
> **Simpan Rute**

---

### 7.6 Use This Itinerary

Fitur utama pembeda Jalanin.

User bisa mengambil itinerary orang lain sebagai template.

**Scope MVP sederhana:**
- Tombol **Use This Itinerary**
- Sistem membuat duplikat itinerary ke akun user
- User bisa mengedit judul, tanggal, aktivitas, dan budget

Nama fitur:
> **Jalanin Rute Ini**

---

### 7.7 User Profile

Halaman profil seperti media sosial.

Isi:
- Foto profil
- Nama
- Username
- Bio
- Jumlah itinerary dibuat
- Jumlah itinerary disimpan
- List itinerary buatan user

---

### 7.8 Search & Explore

Pencarian sederhana untuk menemukan itinerary.

**Filter MVP:**
- Destinasi
- Durasi
- Budget
- Travel style

Contoh pencarian:
- Bali 3 hari
- Jogja budget trip
- Singapore family trip
- Bandung kuliner

---

## 8. Fitur yang Tidak Masuk MVP

Fitur berikut tidak perlu dibuat di versi awal:

- Chat antar pengguna
- Booking hotel/pesawat
- Payment
- AI itinerary generator
- Integrasi Google Maps penuh
- Reels/video pendek kompleks
- Live location sharing
- Group trip planning
- Marketplace travel guide
- Monetisasi creator
- Review tempat secara mendalam
- Tiket wisata
- Sistem MyLink

Fitur-fitur ini bisa masuk setelah validasi MVP berhasil.

---

## 9. User Flow MVP

### Flow 1 — User Menemukan Itinerary

```text
Open app
→ Lihat feed itinerary
→ Klik itinerary menarik
→ Baca detail jadwal dan budget
→ Save itinerary
→ Buka koleksi tersimpan
```

### Flow 2 — User Menggunakan Itinerary Orang Lain

```text
Open itinerary detail
→ Klik "Jalanin Rute Ini"
→ Itinerary tersalin ke akun user
→ User edit tanggal dan aktivitas
→ Simpan sebagai itinerary pribadi
```

### Flow 3 — User Membuat Itinerary

```text
Login
→ Klik Create
→ Isi judul, destinasi, durasi, budget
→ Tambah jadwal per hari
→ Upload cover image
→ Publish
→ Itinerary muncul di feed
```

---

## 10. Struktur Halaman MVP

### Public / Guest

1. Landing Page
2. Explore Itinerary
3. Detail Itinerary
4. Login
5. Register

### Logged-in User

1. Home Feed
2. Explore
3. Detail Itinerary
4. Create Itinerary
5. Edit Itinerary
6. Saved Itinerary
7. Profile
8. Edit Profile

---

## 11. Data Model Awal

### User

```json
{
  "id": "uuid",
  "name": "string",
  "username": "string",
  "email": "string",
  "password_hash": "string",
  "avatar_url": "string",
  "bio": "string",
  "city": "string",
  "created_at": "datetime"
}
```

### Itinerary

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "destination": "string",
  "description": "string",
  "duration_days": "number",
  "estimated_budget": "number",
  "travel_style": "string",
  "cover_image_url": "string",
  "is_published": "boolean",
  "original_itinerary_id": "uuid | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Itinerary Day

```json
{
  "id": "uuid",
  "itinerary_id": "uuid",
  "day_number": "number",
  "title": "string"
}
```

### Activity

```json
{
  "id": "uuid",
  "itinerary_day_id": "uuid",
  "time": "string",
  "title": "string",
  "location_name": "string",
  "description": "string",
  "estimated_cost": "number",
  "order_index": "number"
}
```

### Saved Itinerary

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "itinerary_id": "uuid",
  "created_at": "datetime"
}
```

### Like

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "itinerary_id": "uuid",
  "created_at": "datetime"
}
```

---

## 12. Prioritas Development

### Phase 1 — Foundation

- Setup project
- Authentication
- Database schema
- Basic profile
- Create itinerary
- View itinerary detail

### Phase 2 — Social Discovery

- Home feed
- Explore/search
- Like itinerary
- Save itinerary
- User profile

### Phase 3 — Core Differentiator

- Use this itinerary
- Duplicate itinerary
- Edit copied itinerary
- Saved itinerary page

### Phase 4 — Polish MVP

- Responsive UI
- Empty states
- Loading states
- Basic analytics
- Bug fixing
- Landing page

---

## 13. Rekomendasi Tech Stack MVP

### Frontend

- Next.js
- React
- Tailwind CSS
- TypeScript

### Backend

Pilihan sederhana:
- Next.js API Routes

Atau lebih scalable:
- NestJS
- Express.js

### Database

- PostgreSQL

### ORM

- Prisma

### Authentication

- NextAuth.js
- Clerk
- Supabase Auth

### Storage

- Supabase Storage
- Cloudinary
- AWS S3

### Deployment

- Vercel untuk frontend
- Supabase/Neon untuk database
- Railway/Render untuk backend jika terpisah

---

## 14. MVP Success Metrics

### Activation

- Jumlah user yang membuat akun
- Persentase user yang melihat detail itinerary
- Persentase user yang menyimpan itinerary

### Engagement

- Jumlah itinerary yang dilihat per user
- Jumlah save per itinerary
- Jumlah user yang kembali dalam 7 hari
- Jumlah itinerary yang dibuat user

### Core Validation

Metric paling penting:

> **Save Rate = jumlah itinerary disimpan / jumlah itinerary dilihat**

Jika banyak user menyimpan itinerary, berarti konsep inspirasi travel yang bisa digunakan ulang memiliki value.

### Creator Validation

Metric penting kedua:

> **Creator Rate = jumlah user yang membuat itinerary / jumlah user aktif**

Jika banyak user mau membuat itinerary, berarti platform punya potensi social content.

---

## 15. Hipotesis yang Diuji

### Hipotesis 1

User lebih tertarik pada konten travel yang punya itinerary lengkap dibanding hanya foto/video.

**Cara uji:**
- Ukur view detail itinerary
- Ukur save rate
- Tanya feedback user

### Hipotesis 2

User mau menggunakan itinerary orang lain sebagai template.

**Cara uji:**
- Ukur klik **Jalanin Rute Ini**
- Ukur jumlah itinerary hasil duplikasi
- Lihat berapa banyak yang diedit dan disimpan

### Hipotesis 3

User mau membagikan itinerary mereka sendiri setelah perjalanan.

**Cara uji:**
- Ukur jumlah itinerary yang dibuat
- Ukur completion rate form create itinerary
- Interview creator awal

---

## 16. MVP Content Strategy

Agar MVP tidak kosong saat launch, siapkan seed content terlebih dahulu.

### Target Seed Content

Minimal 30 itinerary awal.

Contoh:
- Bali 3D2N budget trip
- Bali 4D3N honeymoon
- Yogyakarta 3D2N kuliner
- Bandung weekend trip
- Jakarta hidden gems
- Singapore 3D2N
- Kuala Lumpur 3D2N
- Bangkok 4D3N
- Tokyo 5D4N
- Seoul 5D4N

### Format Konten

Setiap itinerary harus punya:
- Judul menarik
- Cover image
- Budget
- Durasi
- Jadwal harian
- Minimal 5 aktivitas
- Catatan praktis
- Travel style

---

## 17. Landing Page Copy

### Hero Section

> **Temukan trip. Simpan rute. Jalanin.**

Jalanin adalah platform sosial travel untuk menemukan inspirasi perjalanan dan menggunakan itinerary dari traveler lain.

### CTA

> Mulai Jelajah

atau

> Buat Itinerary Pertamamu

### Benefit Section

1. **Cari inspirasi perjalanan**
   Temukan itinerary dari traveler lain berdasarkan destinasi, budget, dan gaya liburan.

2. **Simpan rute favorit**
   Simpan itinerary yang kamu suka ke koleksi pribadi.

3. **Pakai dan edit**
   Gunakan itinerary orang lain sebagai template, lalu sesuaikan dengan perjalananmu.

4. **Bagikan pengalamanmu**
   Upload itinerary milikmu agar bisa membantu traveler lain.

---

## 18. Brand Direction

### Nama Produk

**Jalanin**

### Tagline

> **Temukan trip. Simpan rute. Jalanin.**

### Tone of Voice

- Santai
- Praktis
- Inspiratif
- Anak muda
- Tidak terlalu formal

### Brand Keywords

- Travel
- Social
- Itinerary
- Rute
- Simpan
- Jelajah
- Praktis
- Komunitas

---

## 19. Risiko MVP

### Risiko 1 — User malas membuat itinerary

Solusi:
- Buat form sederhana
- Berikan template
- Izinkan copy itinerary
- Mulai dari creator terpilih

### Risiko 2 — Feed kosong saat awal launch

Solusi:
- Buat 30–50 seed itinerary
- Ajak travel creator kecil
- Curate itinerary populer dari tim internal

### Risiko 3 — Itinerary terlalu panjang untuk dibaca

Solusi:
- Gunakan format card
- Buat ringkasan budget dan durasi
- Tampilkan jadwal per hari dalam accordion

### Risiko 4 — Sulit bersaing dengan Instagram/TikTok

Solusi:
- Jangan bersaing di foto/video saja
- Fokus pada itinerary yang bisa digunakan
- Jadikan konten sebagai rencana perjalanan, bukan sekadar inspirasi

---

## 20. Versi MVP Paling Sederhana

Jika ingin sangat cepat dibuat, MVP bisa hanya terdiri dari:

1. Landing page
2. Register/login
3. Feed itinerary
4. Detail itinerary
5. Create itinerary
6. Save itinerary
7. Use this itinerary
8. Profile sederhana

Fitur wajib yang tidak boleh hilang:

> **Feed itinerary + Save itinerary + Use this itinerary**

Karena tiga fitur ini adalah inti dari konsep **Instagram untuk itinerary**.

---

## 21. One-Liner Pitch

> **Jalanin adalah Instagram untuk itinerary, tempat traveler bisa menemukan inspirasi trip, menyimpan rute, dan menggunakan itinerary orang lain untuk perjalanan mereka sendiri.**

---

## 22. Next Step Setelah MVP

Setelah MVP tervalidasi, fitur berikut bisa dikembangkan:

1. AI itinerary generator
2. Collaborative trip planning
3. Google Maps integration
4. Booking integration
5. Creator monetization
6. Partner Link (MyLink) hotel/ticket
7. Community review
8. Group itinerary sharing
9. Travel expense splitter
10. Offline itinerary mode

---

## 23. MVP Priority Summary

| Priority | Feature | Reason |
|---|---|---|
| Must Have | Feed itinerary | Inti pengalaman seperti Instagram |
| Must Have | Detail itinerary | Menampilkan value utama produk |
| Must Have | Create itinerary | Membuat supply konten |
| Must Have | Save itinerary | Membuktikan user tertarik |
| Must Have | Use this itinerary | Pembeda utama |
| Should Have | Search/explore | Membantu discovery |
| Should Have | Profile | Membentuk social identity |
| Could Have | Like | Engagement tambahan |
| Later | Booking | Belum perlu untuk validasi awal |
| Later | AI generator | Bisa dibuat setelah behavior user jelas |

---

## 24. Definisi MVP Berhasil

MVP Jalanin dianggap berhasil jika dalam periode validasi awal:

- User memahami konsep produk tanpa banyak penjelasan.
- User membuka detail itinerary dari feed.
- User menyimpan itinerary yang mereka suka.
- User mencoba fitur **Jalanin Rute Ini**.
- Sebagian user mau membuat itinerary sendiri.
- Ada tanda bahwa itinerary dari user lain benar-benar berguna untuk merencanakan perjalanan.

Indikator paling kuat:

> User berkata: **“Ini lebih berguna daripada cuma lihat post liburan di Instagram.”**
