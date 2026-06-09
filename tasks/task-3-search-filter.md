# Task 3: Integrasi Pencarian dan Filter Gaya Travel

Tugas ini memastikan bar pencarian di topbar dan chip filter gaya perjalanan terintegrasi penuh secara visual dengan grid feed di dalam dashboard `JalaninApp`.

## Sub-Tasks

- [ ] **Koneksi Chip Filter ke State**
  - Tampilkan deretan chip filter secara dinamis menggunakan variabel `filter` dan fungsi `setFilter` yang sudah tersedia di state `JalaninApp`.
  - Berikan gaya visual aktif (`.chip.active`) pada tombol yang kategorinya cocok dengan filter aktif saat ini.
  - Opsi filter yang didukung: `["Semua", "Budget trip", "Kuliner", "Nature", "Family", "City tour"]`.

- [ ] **Tampilan Hasil Kosong (Empty Search State)**
  - Pastikan pencarian menggunakan kata kunci `query` memperbarui daftar kartu secara instan.
  - Jika pencarian atau filter menghasilkan kecocokan kosong (`filteredItems.length === 0`), tampilkan kontainer `.empty-state` yang bersih dan ramah pengguna dengan pesan: *"Tidak ada itinerary yang cocok dengan pencarian ini."*

- [ ] **Optimasi Logika Pencarian**
  - Pastikan pencarian bersifat tidak sensitif terhadap huruf besar/kecil (*case-insensitive*).
  - Cari kecocokan kata kunci pada judul itinerary (`item.title`), nama destinasi (`item.destination`), dan gaya perjalanan (`item.travelStyle`).
