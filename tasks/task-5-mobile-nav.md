# Task 5: Perbaikan Aksi Scroll Navigasi Mobile

Tugas ini berfokus pada sinkronisasi navigasi bawah pada tampilan mobile agar tombol "Jelajah" dapat menggulir layar secara akurat ke lokasi feed yang telah kita aktifkan kembali.

## Sub-Tasks

- [ ] **Koreksi Selektor Scroll pada Tombol Navigasi Mobile**
  - Pada file [jalanin-app.tsx](file:///Users/adhadimas/Documents/maestro_dev/jalanin/components/jalanin-app.tsx), periksa struktur navigasi mobile (`mobile-nav` di bagian bawah JSX).
  - Pastikan tombol dengan ikon `compass` memiliki kode scroll yang valid dan mengarah ke ID kontainer explore feed (`#exploreSection` atau `.feed-section`):
    ```typescript
    document.querySelector("#exploreSection")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    ```
  - Verifikasi bahwa performa pemindahan fokus layar ini berjalan mulus tanpa membuat tata letak terlipat atau tersembunyi di bawah bilah navigasi lainnya.
