# Dokumentasi Teknis Fitur Affiliate Link Terpusat - Jalanin

Dokumen ini merangkum arsitektur, basis data, API, logika validasi, dan integrasi antarmuka untuk fitur **Pustaka Link Affiliate Terpusat** & **Validasi Domain Dinamis** pada platform Jalanin.

---

## 1. Arsitektur Basis Data (Prisma Schema)

Fitur ini menggunakan tiga entitas utama yang saling berelasi di dalam basis data PostgreSQL:
* **`AffiliateLink`**: Tempat penyimpanan link affiliate terpusat milik masing-masing pengguna.
* **`AffiliateWhitelistDomain`**: Daftar pola domain mitra resmi yang diizinkan oleh sistem (dikelola oleh Admin).
* **`Activity`**: Menghubungkan aktivitas pada rute perjalanan (*itinerary*) dengan link affiliate yang terdaftar di pustaka.

### Potongan Skema Prisma (`prisma/schema.prisma`)

```prisma
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  // ... field user lainnya
  affiliateLinks AffiliateLink[]
}

model AffiliateLink {
  id        String     @id @default(cuid())
  userId    String
  label     String     // Nama alias link (misal: "Hotel Agoda Kuta")
  provider  String     // Hasil deteksi otomatis (misal: "Agoda", "Klook", "Lainnya")
  actualUrl String     // URL tujuan affiliate asli
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  activities Activity[]

  @@index([userId])
}

model AffiliateWhitelistDomain {
  id            String   @id @default(cuid())
  domainPattern String   @unique // Contoh: "*.klook.com", "wa.me", "*.agoda.com"
  description   String?  // Keterangan singkat mitra resmi
  createdAt     DateTime @default(now())
}

model Activity {
  id               String         @id @default(cuid())
  itineraryDayId   String
  title            String
  // ... field activity lainnya
  
  affiliateLinkId  String?
  affiliateLink    AffiliateLink? @relation(fields: [affiliateLinkId], references: [id], onDelete: SetNull)

  day              ItineraryDay   @relation(fields: [itineraryDayId], references: [id], onDelete: Cascade)
}
```

---

## 2. Sistem Validasi Domain Dinamis (`lib/affiliate-validator.ts`)

Untuk mencegah penyalahgunaan link eksternal yang tidak sah, sistem melakukan validasi dinamis terhadap setiap input URL affiliate menggunakan daftar pola domain yang tersimpan di basis data (`AffiliateWhitelistDomain`).

### Mekanisme Pencocokan Pola (Pattern Matching)
* **Wildcard Subdomain**: Pola seperti `*.agoda.com` akan mendeteksi dan mengizinkan subdomain apa pun (seperti `www.agoda.com`, `partner.agoda.com`).
* **Pencocokan Persis**: Pola tanpa wildcard seperti `wa.me` harus cocok persis dengan hostname dari URL input.

### Fungsi Utama

1. **`validateAffiliateUrl(url: string)`**:
   - Memparse URL input.
   - Mengambil seluruh daftar domain di whitelist dari DB.
   - Melakukan komparasi hostname URL dengan pola domain di whitelist.
   - Mengembalikan status keabsahan `{ isValid: boolean, error?: string }`.

2. **`detectProvider(url: string)`**:
   - Menganalisis hostname URL untuk mendeteksi provider resmi (misal: Klook, Agoda, Traveloka, Tiket.com, Booking.com, WhatsApp).
   - Jika tidak cocok, mengembalikan label `"Lainnya"`.

---

## 3. Rute API (Next.js App Router API Routes)

### A. Manajemen Link Affiliate (`app/api/affiliate/links/route.ts`)
Rute ini diamankan menggunakan pemeriksaan sesi pengguna (`getCurrentUser()`).

* **`GET`**: Mengambil daftar link affiliate milik user yang sedang aktif.
  - *Pelacakan Itinerary Sendiri*: Query database secara otomatis memfilter relasi `activities` agar hanya menyertakan aktivitas yang berada pada itinerary milik pembuat link tersebut (`authorId: user.id`).
* **`POST`**: Mendaftarkan link affiliate baru ke pustaka.
  - Melakukan validasi URL menggunakan `validateAffiliateUrl`.
  - Mendeteksi provider secara otomatis menggunakan `detectProvider`.
* **`PUT`**: Memperbarui informasi label atau URL link affiliate yang sudah ada.
  - Melakukan validasi ulang sebelum memperbarui database.
* **`DELETE`**: Menghapus link affiliate.
  - Seluruh aktivitas yang menunjuk ke link ini akan otomatis diset menjadi `null` pada kolom `affiliateLinkId` (tidak memicu penghapusan aktivitas).

### B. Whitelist Mitra Resmi (`app/api/affiliate/whitelist/route.ts`)
* **`GET`**: Terbuka untuk umum/kreator agar memuat daftar mitra resmi yang didukung di sisi client.
* **`POST`/`PUT`/`DELETE`**: Dilindungi dengan pemeriksaan peran admin. Hanya pengguna berwenang yang dapat mengubah daftar whitelist secara dinamis.

---

## 4. Perlindungan Pendapatan Kreator pada Kloning Itinerary

Ketika pengguna lain menyalin (*clone*) rute perjalanan milik kreator asli melalui endpoint `/api/itineraries/[id]/clone/route.ts`:
1. Sistem **mempertahankan** referensi `affiliateLinkId` asli pada setiap aktivitas yang disalin.
2. Ketika pengunjung lain melihat rute hasil kloningan tersebut, komisi rujukan tetap masuk 100% ke kreator asli yang pertama kali menyusun rute tersebut.
3. Pengklon dapat memperbarui tautan tersebut ke link affiliate mereka sendiri secara manual kapan saja lewat halaman pengeditan rute.

---

## 5. Komponen & Alur Kerja Antarmuka (UI/UX)

### A. Halaman Pustaka Link (`app/settings/affiliate/page.tsx`)
Halaman pengaturan terpadu bagi kreator untuk mengelola pustaka affiliate mereka:
1. **Form Input**: Menambah atau mengedit alias label dan URL affiliate.
2. **Mitra Resmi**: Menampilkan daftar domain yang diizinkan berdasarkan data dinamis dari server.
3. **Pelacak Penggunaan**: Di bawah setiap item link, sistem menampilkan daftar itinerary & aktivitas milik pengguna yang menggunakan link tersebut (lengkap dengan hyperlink langsung untuk melakukan pratinjau/edit).

### B. Form Builder Rute Perjalanan (`components/jalanin-app.tsx`)
Saat menyusun rute perjalanan:
- Pada card input aktivitas, tersedia menu pilihan (*dropdown*) untuk menyematkan link affiliate dari pustaka terdaftar.
- Disediakan tombol jalan pintas cepat untuk membuka halaman manajemen link jika pengguna ingin mendaftarkan link baru.

### C. Halaman Detail Rute Perjalanan (Tampilan Publik)
Pada detail itinerary, aktivitas yang memiliki tautan affiliate akan merender tombol CTA menarik dengan ketentuan keamanan:
- Menggunakan properti `rel="noopener noreferrer nofollow"` untuk keamanan peramban dan optimasi SEO.
- Desain tombol dihiasi warna aksen sesuai dengan provider (contoh: oranye khas untuk **Klook**, biru cerah untuk **Agoda**, dll.).
