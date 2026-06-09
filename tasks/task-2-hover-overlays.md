# Task 2: Interaksi Hover & Tampilan Overlay Informasi

Tugas ini berfokus pada menyembunyikan detail teks bawaan di bawah kartu dan memindahkannya ke dalam overlay kaca (*backdrop-filter*) yang hanya muncul ketika pengguna melakukan *hover* pada kartu feed, memberikan kesan visual bersih khas Instagram.

## Sub-Tasks

- [ ] **Desain Struktur Overlay di JSX (`jalanin-app.tsx`)**
  - Bungkus isi dari tombol feed card dengan kontainer pembungkus gambar dan overlay.
  - Render informasi penting di dalam elemen `.feed-card-overlay`:
    - Judul itinerary (`item.title`)
    - Destinasi (`item.destination`)
    - Detail ringkas: Durasi (`item.durationDays` hari) & Budget (`formatRupiah(item.estimatedBudget)`)
    - Indikator interaksi sosial: Jumlah Suka (`likesCount`) & Simpan (`savesCount`).

- [ ] **Styling Efek Hover Kaca di CSS (`styles.css`)**
  - Terapkan posisi absolut pada `.feed-card-overlay` agar menutupi seluruh area kartu.
  - Buat overlay transparan secara default dengan `opacity: 0` dan transisi `transition: opacity 0.3s ease, backdrop-filter 0.3s ease`.
  - Pada status `:hover`, ubah `opacity: 1` dan gunakan `backdrop-filter: blur(4px) brightness(0.85)` dengan latar belakang semi-transparan hitam (`background: rgba(0, 0, 0, 0.4)`).
  - Berikan efek zoom mikro halus pada gambar: `.feed-card:hover img` menggunakan `transform: scale(1.05)`.
  - Pastikan teks di dalam overlay berwarna putih dengan bayangan tipis agar selalu terbaca jelas di atas gambar apa pun.

## Contoh Potongan Kode CSS yang Direkomendasikan
```css
.feed-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  opacity: 0;
  backdrop-filter: blur(0px);
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
  z-index: 2;
}

.feed-card:hover .feed-card-overlay {
  opacity: 1;
  backdrop-filter: blur(4px) brightness(0.8);
}

.feed-card:hover img {
  transform: scale(1.05);
}
```
