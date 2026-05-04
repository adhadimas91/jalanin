# Jalanin Development Roadmap

Roadmap ini memecah development Jalanin dari prototype statis menjadi MVP full-stack yang siap divalidasi.

## Status Saat Ini

Prototype saat ini:

- [x] UI prototype statis.
- [x] Detail itinerary.
- [x] Feed/explore statis.
- [x] Search/filter lokal.
- [x] Save itinerary via `localStorage`.
- [x] Like itinerary via `localStorage`.
- [x] `Jalanin Rute Ini` membuka form clone.
- [x] Create itinerary lokal.
- [x] Saved collection lokal.
- [x] Responsive desktop/mobile.
- [x] UI guide tersedia di `UI_GUIDE.md`.

Status app full-stack:

- [x] Next.js app scaffold.
- [x] Authentication MVP with Supabase Auth register/login.
- [x] Backend/API MVP.
- [x] Database PostgreSQL via Prisma Postgres.
- [x] Real image upload lokal ke `public/uploads`.
- [x] Persistent user data via Prisma.
- [x] Supabase user auto-sync ke profile Prisma saat login.
- [x] Local dev server running di `http://localhost:3000`.
- [ ] Production deployment.

## MVP Goal

Membuktikan bahwa user tertarik pada konsep:

> Melihat itinerary orang lain, menyimpan rute, dan menggunakan itinerary tersebut sebagai template perjalanan pribadi.

Metric paling penting:

- Save Rate = jumlah itinerary disimpan / jumlah itinerary dilihat.
- Clone Rate = jumlah klik `Jalanin Rute Ini` / jumlah itinerary dilihat.
- Creator Rate = jumlah user yang membuat itinerary / jumlah user aktif.

## Recommended Stack

- [x] Next.js.
- [x] React.
- [x] TypeScript.
- [ ] Tailwind CSS.
- [x] PostgreSQL.
- [x] Prisma.
- [x] Supabase Auth.
- [ ] Supabase Storage or Cloudinary.
- [ ] Vercel.

## Phase 0 - Product & Technical Foundation

Tujuan: menyiapkan fondasi project agar development tidak bercampur dengan prototype statis.

### Checklist

- [ ] Finalisasi scope MVP.
- [ ] Tentukan stack final.
- [ ] Tentukan auth provider.
- [ ] Tentukan database provider.
- [ ] Tentukan image storage provider.
- [ ] Buat repository git.
- [ ] Buat `.env.example`.
- [ ] Dokumentasikan setup lokal.
- [ ] Pindahkan prototype statis ke folder referensi jika perlu.
- [ ] Jadikan `UI_GUIDE.md` sebagai acuan design system.

### Acceptance Criteria

- [ ] Developer baru bisa menjalankan project dari README.
- [ ] Environment variable minimum terdokumentasi.
- [ ] Scope MVP tidak ambigu.

## Phase 1 - App Scaffold

Tujuan: membuat struktur aplikasi production-ready.

### Checklist

- [ ] Scaffold Next.js dengan TypeScript.
- [ ] Setup Tailwind CSS.
- [ ] Setup ESLint/formatter.
- [ ] Setup base layout.
- [ ] Setup routing.
- [ ] Setup reusable UI primitives.
- [ ] Setup responsive shell.
- [ ] Migrasikan style utama dari prototype.
- [ ] Buat komponen awal:
  - [ ] `Topbar`.
  - [ ] `SearchBar`.
  - [ ] `ItineraryCard`.
  - [ ] `ItineraryHero`.
  - [ ] `MetaPill`.
  - [ ] `ActionButton`.
  - [ ] `Tabs`.
  - [ ] `ActivityTimeline`.
  - [ ] `BudgetSummary`.
  - [ ] `AuthorBox`.
  - [ ] `MapPreview`.

### Pages

- [ ] `/`
- [ ] `/explore`
- [ ] `/itinerary/[id]`
- [ ] `/create`
- [ ] `/saved`
- [ ] `/profile/[username]`
- [ ] `/login`
- [ ] `/register`

### Acceptance Criteria

- [ ] App bisa dijalankan lokal.
- [ ] Layout desktop dan mobile tidak pecah.
- [ ] Komponen utama mengikuti `UI_GUIDE.md`.
- [ ] Tidak ada hardcoded UI besar yang sulit dipakai ulang.

## Phase 2 - Database & Data Model

Tujuan: membuat data itinerary bisa disimpan dan diambil secara persistent.

### Checklist

- [ ] Setup PostgreSQL.
- [ ] Setup Prisma.
- [ ] Buat Prisma schema.
- [ ] Buat migration pertama.
- [ ] Buat seed data.
- [ ] Buat database client/helper.

### Required Models

- [ ] `User`
- [ ] `Itinerary`
- [ ] `ItineraryDay`
- [ ] `Activity`
- [ ] `SavedItinerary`
- [ ] `Like`

### Recommended Fields

#### User

- [ ] `id`
- [ ] `name`
- [ ] `username`
- [ ] `email`
- [ ] `avatar_url`
- [ ] `bio`
- [ ] `city`
- [ ] `created_at`

#### Itinerary

- [ ] `id`
- [ ] `user_id`
- [ ] `title`
- [ ] `destination`
- [ ] `description`
- [ ] `duration_days`
- [ ] `estimated_budget`
- [ ] `travel_style`
- [ ] `cover_image_url`
- [ ] `is_published`
- [ ] `original_itinerary_id`
- [ ] `created_at`
- [ ] `updated_at`

#### Itinerary Day

- [ ] `id`
- [ ] `itinerary_id`
- [ ] `day_number`
- [ ] `title`

#### Activity

- [ ] `id`
- [ ] `itinerary_day_id`
- [ ] `time`
- [ ] `title`
- [ ] `location_name`
- [ ] `description`
- [ ] `estimated_cost`
- [ ] `category`
- [ ] `order_index`

### Acceptance Criteria

- [ ] Database migration berhasil.
- [ ] Seed data muncul di app.
- [ ] Relasi itinerary, day, dan activity berjalan.
- [ ] Query detail itinerary mengambil semua data yang dibutuhkan UI.

## Phase 3 - Authentication & Profile

Tujuan: user bisa punya akun dan data itinerary pribadi.

### Checklist

- [x] Setup auth provider.
- [x] Register via Supabase Auth.
- [x] Login via Supabase Auth.
- [x] Logout.
- [x] Session handling.
- [ ] Protected route middleware.
- [x] Create user profile after signup.
- [x] Auto-create user profile on Supabase login if missing.
- [ ] Edit profile sederhana.
- [ ] Upload/update avatar.
- [ ] Ownership check untuk edit itinerary.

### Pages

- [x] `/login`
- [x] `/register`
- [x] `/profile/[username]`
- [ ] `/settings/profile`

### Acceptance Criteria

- [x] User bisa register dan login.
- [x] User bisa logout.
- [ ] User yang belum login diarahkan saat mengakses fitur protected.
- [x] Profile menampilkan itinerary user.
- [ ] User hanya bisa edit data miliknya.

## Phase 4 - Feed & Detail Itinerary

Tujuan: user bisa menemukan dan membaca itinerary lengkap.

### Checklist

- [ ] Build feed query.
- [ ] Build explore page.
- [ ] Build itinerary detail page.
- [ ] Build hero section.
- [ ] Build quick meta.
- [ ] Build activity timeline.
- [ ] Build budget summary.
- [ ] Build author box.
- [ ] Build map preview.
- [ ] Build loading state.
- [ ] Build empty state.
- [ ] Build not-found state.

### Feed Card Data

- [ ] Cover image.
- [ ] Title.
- [ ] Destination.
- [ ] Duration.
- [ ] Budget.
- [ ] Travel style.
- [ ] Save count.
- [ ] Creator username.

### Detail Data

- [ ] Title.
- [ ] Description.
- [ ] Destination.
- [ ] Duration.
- [ ] Estimated budget.
- [ ] Cover image.
- [ ] Creator.
- [ ] Days.
- [ ] Activities.
- [ ] Notes.
- [ ] Save/like/clone state.

### Acceptance Criteria

- [ ] Guest bisa melihat feed.
- [ ] Guest bisa membuka detail itinerary.
- [ ] Data detail sesuai database.
- [ ] UI tetap rapi untuk itinerary pendek dan panjang.

## Phase 5 - Create & Edit Itinerary

Tujuan: user bisa membuat dan mengubah itinerary sendiri.

### Checklist

- [ ] Build create itinerary form.
- [ ] Build edit itinerary form.
- [ ] Add form validation.
- [ ] Add dynamic day management.
- [ ] Add dynamic activity management.
- [ ] Add activity reorder.
- [ ] Add budget input.
- [ ] Add travel style selector.
- [ ] Add cover image upload.
- [ ] Add draft/publish state.
- [ ] Add success/error feedback.

### Form Fields

- [ ] Title.
- [ ] Destination.
- [ ] Duration.
- [ ] Cover image.
- [ ] Description.
- [ ] Estimated budget.
- [ ] Travel style.
- [ ] Day title.
- [ ] Activity time.
- [ ] Activity title.
- [ ] Activity location.
- [ ] Activity estimated cost.
- [ ] Activity category.
- [ ] Additional notes.

### Acceptance Criteria

- [ ] Logged-in user bisa membuat itinerary.
- [ ] Itinerary baru muncul di feed jika published.
- [ ] User bisa edit itinerary miliknya.
- [ ] Form mencegah data minimum kosong.
- [ ] Image upload berhasil.

## Phase 6 - Save, Like, and Clone

Tujuan: membangun fitur inti pembeda Jalanin.

### Save Itinerary

- [ ] Create save API/action.
- [ ] Create unsave API/action.
- [ ] Show saved state.
- [ ] Update save count.
- [ ] Build saved itinerary page.
- [ ] Prevent duplicate save.

### Like Itinerary

- [ ] Create like API/action.
- [ ] Create unlike API/action.
- [ ] Show liked state.
- [ ] Update like count.
- [ ] Prevent duplicate like.

### Jalanin Rute Ini

- [ ] Create clone API/action.
- [ ] Duplicate itinerary.
- [ ] Duplicate itinerary days.
- [ ] Duplicate activities.
- [ ] Set `original_itinerary_id`.
- [ ] Assign copy to current user.
- [ ] Redirect user to edit copied itinerary.
- [ ] Track clone count.

### Acceptance Criteria

- [ ] Logged-in user bisa save/unsave.
- [ ] Logged-in user bisa like/unlike.
- [ ] Logged-in user bisa clone itinerary.
- [ ] Hasil clone tidak mengubah itinerary asli.
- [ ] User diarahkan ke edit page setelah clone.

## Phase 7 - Search & Explore

Tujuan: user bisa menemukan itinerary berdasarkan kebutuhan.

### Checklist

- [ ] Search by title.
- [ ] Search by destination.
- [ ] Search by travel style.
- [ ] Filter by duration.
- [ ] Filter by budget.
- [ ] Filter by travel style.
- [ ] Sort newest.
- [ ] Sort popular.
- [ ] Sort most saved.
- [ ] Add query params for shareable search.
- [ ] Add empty search state.

### Acceptance Criteria

- [ ] Search menghasilkan data relevan.
- [ ] Filter bisa digabung.
- [ ] URL mencerminkan query/filter.
- [ ] Search tetap responsif di mobile.

## Phase 8 - Analytics & Validation

Tujuan: mengukur apakah MVP berhasil memvalidasi konsep.

### Events

- [ ] `view_feed`
- [ ] `view_itinerary`
- [ ] `save_itinerary`
- [ ] `unsave_itinerary`
- [ ] `like_itinerary`
- [ ] `clone_itinerary`
- [ ] `create_itinerary_started`
- [ ] `create_itinerary_published`
- [ ] `edit_itinerary_saved`
- [ ] `search_performed`

### Metrics

- [ ] Save Rate.
- [ ] Clone Rate.
- [ ] Creator Rate.
- [ ] Detail View Rate.
- [ ] Create Completion Rate.
- [ ] Weekly Returning Users.

### Acceptance Criteria

- [ ] Event utama tercatat.
- [ ] Metric bisa dihitung.
- [ ] Dashboard/report sederhana tersedia.

## Phase 9 - Polish MVP

Tujuan: membuat MVP layak dites oleh user awal.

### Checklist

- [ ] Loading skeleton.
- [ ] Empty states.
- [ ] Error states.
- [ ] Toast feedback.
- [ ] Mobile polish.
- [ ] Form validation messages.
- [ ] Accessibility pass.
- [ ] SEO basic metadata.
- [ ] Open graph image.
- [ ] Performance pass.
- [ ] Image optimization.
- [ ] Basic rate limiting for mutation endpoints.

### Acceptance Criteria

- [ ] Core flow terasa halus di desktop dan mobile.
- [ ] Tidak ada layout overlap.
- [ ] Error utama punya feedback jelas.
- [ ] Lighthouse baseline acceptable.

## Phase 10 - Deployment

Tujuan: menyiapkan app untuk test user.

### Checklist

- [ ] Setup Vercel project.
- [ ] Setup database production.
- [ ] Setup auth production config.
- [ ] Setup storage production config.
- [ ] Setup environment variables.
- [ ] Run production migration.
- [ ] Seed initial content.
- [ ] Configure domain.
- [ ] Configure analytics.
- [ ] Smoke test production.

### Acceptance Criteria

- [ ] App production bisa dibuka.
- [ ] Auth berjalan di production.
- [ ] Image upload berjalan di production.
- [ ] Seed content tersedia.
- [ ] Core flow berhasil di production:
  - [ ] Register/login.
  - [ ] View feed.
  - [ ] View detail.
  - [ ] Save route.
  - [ ] Clone route.
  - [ ] Create itinerary.

## Seed Content Checklist

Minimal 30 itinerary awal.

### Required Per Itinerary

- [ ] Title.
- [ ] Destination.
- [ ] Duration.
- [ ] Cover image.
- [ ] Estimated budget.
- [ ] Travel style.
- [ ] Creator.
- [ ] Description.
- [ ] Notes.
- [ ] At least 2 days or realistic day structure.
- [ ] At least 5 activities.
- [ ] Cost estimate per activity.

### Suggested Seed Topics

- [ ] Bali 3D2N budget trip.
- [ ] Bali 4D3N honeymoon.
- [ ] Yogyakarta 3D2N kuliner.
- [ ] Bandung weekend trip.
- [ ] Jakarta hidden gems.
- [ ] Singapore 3D2N.
- [ ] Kuala Lumpur 3D2N.
- [ ] Bangkok 4D3N.
- [ ] Tokyo 5D4N.
- [ ] Seoul 5D4N.
- [ ] Kansai 7 hari budget.
- [ ] Lombok 4D3N nature.
- [ ] Labuan Bajo 3D2N.
- [ ] Malang-Bromo weekend.
- [ ] Penang kuliner 3D2N.

## QA Checklist

### Functional

- [ ] User can register.
- [ ] User can login.
- [ ] User can logout.
- [ ] Guest can view feed.
- [ ] Guest can view detail.
- [ ] Logged-in user can create itinerary.
- [ ] Logged-in user can edit own itinerary.
- [ ] User cannot edit others' itinerary.
- [ ] User can save itinerary.
- [ ] User can unsave itinerary.
- [ ] User can like itinerary.
- [ ] User can unlike itinerary.
- [ ] User can clone itinerary.
- [ ] Cloned itinerary preserves days and activities.
- [ ] Cloned itinerary belongs to current user.
- [ ] Search works.
- [ ] Filters work.

### UI

- [ ] Desktop layout matches UI guide.
- [ ] Tablet layout stacks correctly.
- [ ] Mobile layout has no overlap.
- [ ] Buttons have visible active states.
- [ ] Forms show validation errors.
- [ ] Empty states are helpful.
- [ ] Loading states are present.

### Data

- [ ] Save count updates correctly.
- [ ] Like count updates correctly.
- [ ] Clone relation is stored correctly.
- [ ] Deleted/draft itinerary does not appear in public feed.
- [ ] Profile counts are correct.

### Security

- [ ] Protected routes require login.
- [ ] API mutations require authenticated user.
- [ ] Ownership checks are enforced.
- [ ] Uploaded files are validated.
- [ ] Sensitive env vars are not exposed to client.

## Suggested Sprint Plan

### Sprint 1 - Foundation

- [ ] App scaffold.
- [ ] UI components.
- [ ] Database schema.
- [ ] Seed data.
- [ ] Feed and detail read-only.

### Sprint 2 - Auth & Creation

- [ ] Auth.
- [ ] Profile.
- [ ] Create itinerary.
- [ ] Edit itinerary.
- [ ] Image upload.

### Sprint 3 - Core Differentiator

- [ ] Save route.
- [ ] Like itinerary.
- [ ] `Jalanin Rute Ini`.
- [ ] Saved page.
- [ ] Clone edit flow.

### Sprint 4 - Discovery & Validation

- [ ] Search.
- [ ] Filters.
- [ ] Analytics events.
- [ ] Empty/loading/error states.
- [ ] Production deployment.

## MVP Release Criteria

MVP bisa dirilis ke test user jika:

- [x] User bisa register/login di local development.
- [ ] Feed punya minimal 30 itinerary.
- [ ] User bisa membuka detail itinerary.
- [ ] User bisa menyimpan itinerary.
- [ ] User bisa menggunakan `Jalanin Rute Ini`.
- [ ] User bisa membuat itinerary sendiri.
- [ ] Profile dan saved page berjalan.
- [ ] Core analytics tercatat.
- [ ] Mobile layout usable.
- [ ] Production deploy stabil.
