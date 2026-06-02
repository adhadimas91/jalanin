# Alternatif Map Gratis untuk Feature Aktivitas Jalanin

## Tujuan

Feature input aktivitas membutuhkan tiga kemampuan utama:

- User bisa memasukkan jam, nama aktivitas, dan lokasi.
- User bisa mencari lokasi dari data map publik.
- User bisa memilih titik manual di peta jika lokasi belum tersedia, sehingga aktivitas tetap punya latitude dan longitude untuk map route.

## Rekomendasi MVP

Gunakan stack berbasis OpenStreetMap:

- Map UI: MapLibre GL JS
- Map tiles: OpenFreeMap
- Search/geocoding: Geoapify free tier
- Routing: Geoapify Routing API atau openrouteservice
- Manual location: klik titik di peta, lalu simpan nama custom + latitude/longitude

Alasan memilih ini untuk MVP:

- Tidak tergantung Google Maps.
- Bisa render peta interaktif di frontend.
- Bisa tetap punya autocomplete/search lokasi.
- Bisa menyimpan koordinat di database agar itinerary tidak perlu geocode ulang saat dibuka.
- Jika lokasi belum ada di provider, user tetap bisa membuat lokasi custom dari point picker.

## Catatan Layanan Gratis

OpenStreetMap menyediakan data terbuka, tetapi server publik OSM bukan untuk penggunaan produk skala besar tanpa batas. Untuk tile map, gunakan provider seperti OpenFreeMap, MapTiler free tier, atau self-host tile server jika traffic besar.

Nominatim publik kurang cocok untuk autocomplete aktif karena ada policy rate limit dan larangan heavy use. Untuk MVP, Geoapify lebih praktis karena menyediakan free tier untuk geocoding/place search dan routing.

## Data yang Perlu Disimpan

Setiap aktivitas perlu menyimpan:

- `time`: jam aktivitas
- `title`: nama aktivitas
- `locationName`: nama lokasi yang ditampilkan
- `formattedAddress`: alamat lengkap dari provider jika ada
- `latitude`: koordinat lintang
- `longitude`: koordinat bujur
- `mapProvider`: provider data lokasi, misalnya `geoapify` atau `custom`
- `mapPlaceId`: id lokasi dari provider jika ada
- `customLocation`: true jika lokasi dibuat manual oleh user

## Flow Input Aktivitas

1. User membuat itinerary.
2. User menambah aktivitas.
3. User mengisi jam dan nama aktivitas.
4. User mencari lokasi.
5. Jika lokasi ditemukan, user memilih hasil search.
6. App menyimpan nama lokasi, alamat, place id, latitude, longitude.
7. Jika lokasi tidak ditemukan, user memilih titik manual di peta.
8. App menyimpan nama lokasi custom dan koordinat.
9. Map view itinerary membaca aktivitas yang punya koordinat dan menampilkan marker sesuai urutan.

## Scope Implementasi Awal

MVP awal cukup untuk aktivitas hari pertama, mengikuti form yang sudah ada di Jalanin saat ini. Setelah stabil, activity builder bisa diperluas untuk multi-day itinerary.

Prioritas:

1. Migrasi schema `Activity` untuk field lokasi.
2. Ubah serializer dan clone route agar field lokasi ikut terbawa.
3. Ubah create form dari textarea menjadi activity builder.
4. Tambah endpoint search Geoapify.
5. Tambah map picker dan route preview.
6. Simpan aktivitas sebagai JSON terstruktur ke `/api/itineraries`.

