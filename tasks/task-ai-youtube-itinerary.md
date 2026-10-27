# Task: AI YouTube Video to Itinerary Importer

Fitur ini memungkinkan Admin/Kreator untuk memasukkan URL video travel vlog YouTube (contoh studi kasus: `https://www.youtube.com/watch?v=oNVtaHAmcSs` — *"Liburan Ke Jogja 2 Hari 1 Malam Kemana Aja Yaa"* oleh Robiana Family), kemudian AI secara otomatis mengekstrak konten video dan mengubahnya menjadi draft itinerary terstruktur di MyJalanin (`Itinerary`, `ItineraryDay`, dan `Activity`).

---

## 🎯 Objektif & Kebutuhan Fitur
1. **Ekstraksi Cerdas & Multimodal**: Mengambil metadata, transkrip, atau video feed untuk mengenali destinasi, durasi hari, aktivitas per jam, nama tempat/hotel/restoran, estimasi biaya, dan gaya perjalanan.
2. **Auto-Enrichment Geocoding**: Menggunakan integrasi Geoapify yang sudah ada di `lib/maps-parser.ts` untuk melengkapi koordinat `latitude`, `longitude`, dan nama alamat resmi secara otomatis.
3. **Penyimpanan Thumbnail Resmi**: Mengunduh thumbnail kualitas tinggi YouTube (`maxresdefault.jpg` / `hqdefault.jpg`) dan mengunggahnya ke Vercel Blob Storage (`lib/blob-storage.ts`) sebagai cover image resmi.
4. **Human-in-the-Loop Review**: Menampilkan hasil ekstraksi ke form editor sebelum disimpan ke database, sehingga admin dapat meninjau, mengoreksi, atau menambahkan detail sebelum mempublikasikan.
5. **Dukungan Akun Kurasi**: Memungkinkan admin mengaitkan itinerary hasil import langsung ke akun kurasi influencer (contoh: `@robianafamily`).

---

## 📋 Sub-Tasks Breakdown

### 1. Setup Environment & AI Provider
- [x] Daftarkan atau siapkan API Key untuk LLM multimodal:
  - **Google Gemini API** (`GEMINI_API_KEY`) via `@google/genai` atau REST API Gemini.
- [x] Tambahkan `GEMINI_API_KEY` ke `.env.example` dan `.env`.
- [x] Install dependency pendukung: `youtube-transcript`.

### 2. Backend API Endpoint (`/api/admin/ai/extract-youtube`)
- [x] Buat route handler `POST /api/admin/ai/extract-youtube/route.ts`.
- [x] Pasang proteksi autentikasi: Hanya dapat diakses oleh user dengan role `ADMIN` atau sesi kurasi aktif (`isAdminUser()`).
- [x] Validasi input URL YouTube (mendukung format `youtube.com/watch?v=...`, `youtu.be/...`, dan `youtube.com/shorts/...`).
- [x] Ambil metadata dasar video via YouTube oEmbed API (`https://www.youtube.com/oembed?url=...&format=json`) untuk mendapatkan judul asli, author/channel, dan thumbnail URL.

### 3. Ekstraksi AI & Structured Prompting
- [x] Implementasikan pipeline ekstraksi: Ambil transkrip otomatis via `youtube-transcript` + prompt terstruktur ke Gemini Flash model family (`gemini-flash-lite-latest`, `gemini-3.8-flash`, `gemini-flash-latest`).
- [x] Definisikan Prompt System & Response Schema yang menghasilkan JSON tepat sesuai `ParsedDayForm` (`lib/itinerary-form.ts`):
  - `title`, `destination`, `durationDays`, `travelStyle`, `estimatedBudget`, `description`, `notes`, serta `days` & `activities` terurut kronologis dengan jam kunjungan dan kategori.

### 4. Auto-Geocoding & Normalisasi Lokasi
- [x] Jalankan helper geocoding cepat (`quickGeocode`) dengan Geoapify (`GEOAPIFY_API_KEY`) dan fallback Nominatim dengan timeout non-blocking.
- [x] Isi otomatis properti `latitude`, `longitude`, `formattedAddress`, dan `mapProvider` pada aktivitas jika ditemukan.
- [x] Jika lokasi tidak ditemukan dengan presisi, tandai `customLocation: true` agar user dapat mengatur titik di peta secara manual.

### 5. Penanganan Cover Image & Thumbnail
- [x] Fetch thumbnail YouTube resolusi tinggi (`https://i.ytimg.com/vi/<VIDEO_ID>/maxresdefault.jpg` dengan fallback ke `hqdefault.jpg`).
- [x] Otomatis simpan ke Vercel Blob Storage jika `BLOB_READ_WRITE_TOKEN` aktif atau gunakan high-res thumbnail URL.

### 6. Integrasi UI di Halaman Buat Itinerary (`app/create/page.tsx`)
- [x] Tambahkan komponen UI interaktif: [components/ai-youtube-importer.tsx](file:///Users/adhadimas/Documents/maestro_dev/jalanin/components/ai-youtube-importer.tsx) dan [components/create-itinerary-form.tsx](file:///Users/adhadimas/Documents/maestro_dev/jalanin/components/create-itinerary-form.tsx).
- [x] Input URL YouTube dengan tombol *"🚀 Analisis & Isi Form"*.
- [x] State loading interaktif langkah demi langkah (1. Ambil transkrip -> 2. Analisis AI Gemini -> 3. Geocoding peta).
- [x] Setelah sukses, otomatis mengisi seluruh form: Judul, Destinasi, Durasi, Budget, Travel Style, Deskripsi, Catatan, Cover Image, serta hidden `daysJson` lengkap.

### 7. Verifikasi, Keamanan & Batasan Kuota
- [x] Mode Admin: Kuota di-bypass secara otomatis saat mempublikasikan itinerary yang sudah dilengkapi.
- [x] Error handling & input sanitization untuk format link YouTube dan parsing JSON AI.
- [x] Validasi TypeScript lulus dengan `npx tsc --noEmit`.

---

## 🔍 Skema JSON Target dari AI Engine

```typescript
export interface AiItineraryExtractionResult {
  title: string;
  destination: string;
  durationDays: number;
  travelStyle: "Budget trip" | "Kuliner" | "Couple" | "Nature" | "City tour" | "Family";
  estimatedBudget: number;
  description: string;
  notes: string;
  coverImageUrl?: string;
  originalVideoUrl: string;
  days: Array<{
    dayNumber: number;
    title: string;
    activities: Array<{
      time: string;
      title: string;
      locationName: string;
      formattedAddress?: string;
      latitude?: number | null;
      longitude?: number | null;
      category: string;
      estimatedCost: number;
      description: string;
    }>;
  }>;
}
```

---

## 🧪 Rencana Uji Coba (Testing Plan)
1. **Uji Validasi URL YouTube**:
   - URL: `https://www.youtube.com/watch?v=oNVtaHAmcSs` (Valid, 2H1M Jogja).
   - Pastikan terdeteksi 2 hari (`dayNumber: 1` dan `dayNumber: 2`).
   - Pastikan destinasi terdeteksi sebagai `"Yogyakarta"`.
2. **Uji Geocoding Lokasi**:
   - Tempat seperti `"Gudeg Yu Djum"` dan `"Malioboro"` harus menghasilkan koordinat lat/lng valid di Yogyakarta.
3. **Uji Review Form**:
   - Pastikan admin dapat mengubah jam atau biaya sebelum klik tombol *"Simpan Draft"* atau *"Publikasikan"*.
