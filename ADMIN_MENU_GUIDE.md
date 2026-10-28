# Panduan Menambahkan Menu & Tabel Baru di Admin Console — Jalanin

Dokumen ini menjelaskan langkah-langkah end-to-end untuk menambahkan **menu baru (tabel/entitas)** maupun **kolom relasi baru** ke dalam **Admin Console (`/admin`)**.

Arsitektur Admin Console Jalanin bersifat *config-driven*: rute API dinamis (`app/api/admin/[table]/route.ts` dan `app/api/admin/[table]/[id]/route.ts`) otomatis memvalidasi nama tabel berdasarkan daftar `adminTables` di `lib/admin.ts`, sehingga Anda **tidak perlu membuat file API route baru** saat menambahkan menu tabel standar.

---

## Ringkasan File yang Diubah

| Urutan | File | Peran |
| :--- | :--- | :--- |
| **1** | `prisma/schema.prisma` *(opsional)* | Jika tabel baru belum ada di database, tambahkan model Prisma lalu jalankan `npm run prisma:generate`. |
| **2** | `components/icons.tsx` *(opsional)* | Daftarkan ikon baru dari `@tabler/icons-react` ke objek `Icons` jika belum tersedia. |
| **3** | `lib/admin.ts` | Tambahkan nama tabel ke `adminTables`, fungsi query `fetch...()`, `getAdminSnapshot()`, serta handler `createAdminRecord`, `updateAdminRecord`, dan `deleteAdminRecord`. |
| **4** | `components/admin-console.tsx` | Tambahkan konfigurasi tabel ke `tableConfigs`, grup sidebar `SIDEBAR_GROUPS`, `DEFAULT_HIDDEN_COLUMNS`, serta kustomisasi label/filter/cell/form editor bila diperlukan. |

---

## Langkah 1: Pastikan Model Tersedia di Prisma (`prisma/schema.prisma`)

Jika menu baru menggunakan tabel baru di database:
1. Tambahkan `model NamaModel` di `prisma/schema.prisma`.
2. Jalankan:
   ```bash
   npm run prisma:generate
   ```
   > **Penting:** Di proyek Jalanin, `prisma:generate` wajib dijalankan setiap kali `prisma/schema.prisma` berubah karena client dihasilkan ke folder `generated/prisma/`.

---

## Langkah 2: Daftarkan Ikon Menu (`components/icons.tsx`)

Admin Console mengikuti pola registri ikon terpusat dari UI kit `next-shadcn/`.
1. Buka `components/icons.tsx`.
2. Import ikon yang diinginkan dari `@tabler/icons-react` (misalnya `IconLink`, `IconTag`, `IconTicket`).
3. Tambahkan ke objek `Icons`:
   ```tsx
   export const Icons = {
     // ...
     link: IconLink,
   };
   ```

---

## Langkah 3: Daftarkan Tabel & Operasi CRUD di Backend (`lib/admin.ts`)

Buka `lib/admin.ts` dan lakukan 5 penambahan berikut:

### 3.1. Tambahkan key tabel ke `adminTables`
Nama yang didaftarkan di `adminTables` otomatis menjadi tipe `AdminTable` dan mengaktifkan endpoint `GET/POST /api/admin/<namaTabel>` serta `PATCH/DELETE /api/admin/<namaTabel>/<id>`.

```ts
export const adminTables = [
  "users",
  "accountClaims",
  "itineraries",
  "days",
  "activities",
  "myLinks", // <-- contoh menu baru
  "saves",
  "likes",
  "sessions",
  "myLinkWhitelistDomains",
  "appSettings",
] as const;
```

### 3.2. Buat fungsi `fetch<NamaTabel>()`
Ambil data dari Prisma beserta relasi yang dibutuhkan untuk tampilan tabel (seperti informasi `user` atau `_count`):

```ts
async function fetchMyLinks() {
  return prisma.myLink.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
        },
      },
      _count: {
        select: {
          activities: true,
        },
      },
    },
    take: 200,
  });
}
```

### 3.3. Masukkan ke `getAdminSnapshot()`
1. Panggil fungsi `fetch...()` di dalam `Promise.all([...])`.
2. Serialisasikan hasilnya ke objek return `getAdminSnapshot()`.
   > **Tips Best Practice:** Pisahkan objek relasi (mis. `{ user, _count, ...record }`) dan simpan ke dalam properti `_related`. Dengan begitu, Form Editor hanya merender field skalar asli, sementara komponen tabel tetap bisa membaca data relasi dari `record._related`.

```ts
myLinks: myLinks.map(({ user, _count, ...record }) =>
  serializeRecord({
    ...record,
    _related: {
      user,
      counts: _count,
    },
  }),
),
```

### 3.4. Tambahkan `case` pada `createAdminRecord` & `updateAdminRecord`
Gunakan helper pembaca tipe data (`readString`, `readOptionalString`, `readInt`, `readBoolean`, `readDate`) agar payload dari Form Editor maupun JSON Editor selalu aman:

```ts
// Di dalam createAdminRecord(table, rawData)
case "myLinks": {
  const actualUrl = readString(data.actualUrl);
  const provider = readString(data.provider) || detectProvider(actualUrl);
  return prisma.myLink.create({
    data: {
      id: readOptionalString(data.id) ?? undefined,
      userId: readString(data.userId),
      label: readString(data.label),
      provider,
      actualUrl,
    },
  });
}

// Di dalam updateAdminRecord(table, id, rawData)
case "myLinks": {
  const actualUrl = readString(data.actualUrl);
  const provider = readString(data.provider) || detectProvider(actualUrl);
  return prisma.myLink.update({
    where: { id },
    data: {
      userId: readString(data.userId),
      label: readString(data.label),
      provider,
      actualUrl,
    },
  });
}
```

### 3.5. Tambahkan `case` pada `deleteAdminRecord`
```ts
case "myLinks":
  return prisma.myLink.delete({ where: { id } });
```

---

## Langkah 4: Tambahkan Menu & Konfigurasi Tabel di UI (`components/admin-console.tsx`)

Buka `components/admin-console.tsx` dan perbarui bagian-bagian berikut:

### 4.1. Tambahkan konfigurasi di `tableConfigs`
Tentukan `label`, `description`, `group` (`'Manajemen Pengguna' | 'Konten & Perjalanan' | 'Konfigurasi Sistem'`), `icon`, urutan `columns`, dan `template` default saat admin menekan tombol **Add New**:

```tsx
myLinks: {
  label: 'MyLinks',
  description:
    'Kelola pustaka tautan booking/affiliate MyLink milik pengguna yang disematkan pada aktivitas.',
  group: 'Konten & Perjalanan',
  icon: Icons.link,
  columns: ['label', 'provider', 'actualUrl', 'userId', 'createdAt'],
  template: {
    userId: '',
    label: 'Tiket Masuk / Booking Hotel',
    provider: 'Klook',
    actualUrl: 'https://www.klook.com/'
  }
},
```

### 4.2. Masukkan ke `SIDEBAR_GROUPS`
Agar menu muncul di navigasi sidebar kiri beserta badge jumlah record-nya, tambahkan key tabel ke grup yang sesuai di `SIDEBAR_GROUPS`:

```tsx
const SIDEBAR_GROUPS: {
  label: TableConfig['group'];
  tables: AdminTable[];
}[] = [
  {
    label: 'Manajemen Pengguna',
    tables: ['users', 'accountClaims', 'sessions']
  },
  {
    label: 'Konten & Perjalanan',
    tables: ['itineraries', 'days', 'activities', 'myLinks', 'saves', 'likes']
  },
  {
    label: 'Konfigurasi Sistem',
    tables: ['myLinkWhitelistDomains', 'appSettings']
  }
];
```

### 4.3. Atur visibilitas kolom awal di `DEFAULT_HIDDEN_COLUMNS`
Setiap `AdminTable` wajib memiliki entri di `DEFAULT_HIDDEN_COLUMNS`.
- Gunakan `{ id: false }` jika kolom `id` ingin disembunyikan secara default (admin tetap bisa menampilkannya lewat menu **View**).
- Gunakan `{}` jika semua kolom termasuk `id` ingin langsung tampil secara default.

```tsx
const DEFAULT_HIDDEN_COLUMNS: Record<AdminTable, VisibilityState> = {
  // ...
  myLinks: {},
};
```

---

## Langkah 5: Kustomisasi Lanjutan di `components/admin-console.tsx` *(Opsional)*

Jika menu baru membutuhkan fitur interaktif tambahan, Anda dapat menyesuaikan bagian-bagian berikut di `components/admin-console.tsx`:

1. **Label Kolom Kustom (`formatColumnLabel`)**
   Ubah nama field database menjadi label yang ramah pengguna (contoh: `userId` atau `authorId` ditampilkan sebagai `'Nama User'`).
2. **Resolusi Relasi User (`resolveRecordUser` & `resolveRecordUserKey`)**
   Jika tabel memiliki kolom `userId` atau `authorId`, tambahkan ke kondisi `isUserCol` agar otomatis menampilkan nama + `@username`/email pengguna serta mendukung filter per pengguna.
3. **Faceted Filter (`isFilterable` & `filterOptions`)**
   Tambahkan kondisi pada `isFilterable` dan pasangkan opsi `Option[]` (baik statis menggunakan `withOptionCounts(colName, OPTIONS)` maupun dinamis seperti `buildUserFilterOptions()`).
4. **Custom Cell Rendering (`cell: (info) => ...`)**
   Tambahkan blok `if (colName === '...' && currentTable === '...')` untuk merender `<Badge>`, tautan eksternal, format mata uang Rupiah, atau tombol salin cepat (*copy*).
5. **Custom Input di Sheet Form Editor**
   Pada bagian `formFields.map((key) => ...)`, tambahkan kondisi khusus jika field tertentu sebaiknya menggunakan komponen `<Select>` (misalnya memilih user, memilih `myLinkId`, atau memilih status/provider) alih-alih `<Input type="text">` biasa.
6. **Auto-Suggestions Pencarian (`searchSuggestions`)**
   Tambahkan kondisi `else if (currentTable === '...')` pada `searchSuggestions` untuk memberikan saran pencarian cepat di toolbar tabel.
7. **Operasi Bulk (`POST /api/admin/bulk`)**
   Secara otomatis setiap tabel baru yang terdaftar di `adminTables` sudah mendukung checkbox *row selection*, **Bulk Delete**, dan **Bulk Add (JSON Array)** melalui fungsi [`bulkDeleteAdminRecords`](file:///Users/adhadimas/Documents/maestro_dev/jalanin/lib/admin.ts), [`bulkCreateAdminRecords`](file:///Users/adhadimas/Documents/maestro_dev/jalanin/lib/admin.ts), dan [`bulkUpdateAdminRecords`](file:///Users/adhadimas/Documents/maestro_dev/jalanin/lib/admin.ts) di [`app/api/admin/bulk/route.ts`](file:///Users/adhadimas/Documents/maestro_dev/jalanin/app/api/admin/bulk/route.ts). Jika Anda ingin menambahkan form *Bulk Add* atau tombol *Bulk Edit* kustom untuk tabel baru, tambahkan kondisinya pada tab `Bulk Add` dan `actionBar` di [`components/admin-console.tsx`](file:///Users/adhadimas/Documents/maestro_dev/jalanin/components/admin-console.tsx).

---

## Langkah 6: Verifikasi Perubahan

Setelah selesai menambahkan menu baru, selalu jalankan perintah verifikasi berikut sebelum melakukan commit:

```bash
# 1. Pastikan tidak ada error TypeScript (Record<AdminTable, ...> akan mengecek kelengkapan key)
npx tsc --noEmit

# 2. (Opsional) Uji build produksi penuh
npm run build
```

