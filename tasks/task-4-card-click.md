# Task 4: Navigasi Klik Kartu dan Smooth Scroll ke Atas

Tugas ini berfokus pada transisi interaksi saat pengguna mengeklik salah satu itinerary di halaman feed untuk memuatnya sebagai itinerary detail yang aktif di bagian atas workspace.

## Sub-Tasks

- [ ] **Event Handler Klik Kartu pada `JalaninApp`**
  - Pada elemen tombol di dalam `.feed-card`, tambahkan properti `onClick`.
  - Di dalam fungsi penangan klik tersebut, jalankan pembaruan state berikut:
    1. Hubungkan ID itinerary yang dipilih ke state `currentId`: `setCurrentId(item.id)`.
    2. Reset indeks hari aktif kembali ke hari pertama: `setDayIndex(0)`.
    3. Kembalikan tab panel detail ke tab default (Hari demi Hari): `setTab("days")`.

- [ ] **Efek Auto-Scroll ke Atas Halaman**
  - Setelah state diperbarui, jalankan fungsi pemindahan layar secara halus kembali ke bagian atas workspace:
    ```typescript
    window.scrollTo({ top: 0, behavior: "smooth" });
    ```
  - Hal ini diperlukan agar pengguna langsung melihat perubahan detail rute baru (peta, jadwal per hari, dan ringkasan budget) yang baru saja dipilih dari feed di bawah.
