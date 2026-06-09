# Task 1: Tata Letak Grid Mosaik (Instagram Explore-style)

Tugas ini berfokus pada perancangan tata letak grid mosaik menggunakan CSS Grid agar susunan kartu feed memiliki variasi ukuran seperti halaman Explore Instagram (ada kartu standar 1x1 dan kartu besar 2x2).

## Sub-Tasks

- [ ] **Modifikasi CSS Grid pada `styles.css`**
  - Mengubah `.feed-grid` agar menggunakan `grid-template-columns: repeat(3, minmax(0, 1fr))` dengan `grid-auto-rows: 250px` (atau tinggi baris yang disesuaikan) agar kartu dapat membentang secara vertikal dan horizontal secara teratur.
  - Menetapkan jarak antar kartu `gap: 14px` sesuai dengan token desain.
  - Membuat aturan khusus `.feed-card.large` untuk menerapkan `grid-column: span 2` dan `grid-row: span 2`.

- [ ] **Logika Seleksi Ukuran Dinamis pada `jalanin-app.tsx`**
  - Pada pemetaan `filteredItems.map((item, index) => ...)`, gunakan fungsi modular untuk menandai kartu besar.
  - Tambahkan kelas `large` ke elemen `.feed-card` jika indeks memenuhi pola pengulangan (misal: `index % 10 === 2` atau `index % 10 === 7`).
  - Pastikan proporsi visual cover image tetap rapi dengan menggunakan properti CSS `object-fit: cover` dan `height: 100%` agar gambar mengisi penuh kontainer besar maupun kecil tanpa penyok.

## Contoh Potongan Kode CSS yang Direkomendasikan
```css
.feed-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 250px;
  gap: 14px;
}

.feed-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
}

.feed-card.large {
  grid-column: span 2;
  grid-row: span 2;
}

.feed-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```
