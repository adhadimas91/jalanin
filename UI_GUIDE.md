# Jalanin UI Guide

Panduan ini merangkum arah UI untuk MVP Jalanin berdasarkan product brief dan prototype awal.

## 1. Product Feel

Jalanin adalah platform sosial travel untuk menemukan, menyimpan, dan menggunakan itinerary.

Kesan utama UI:

- Praktis dan cepat discan.
- Sosial, tetapi tetap terstruktur seperti planner.
- Bersih, ringan, dan mobile-friendly.
- Fokus pada itinerary sebagai konten utama, bukan landing page marketing.

Tagline produk:

> Temukan trip. Simpan rute. Jalanin.

## 2. Design Principles

### App-first

Layar pertama sebaiknya langsung menampilkan pengalaman produk: itinerary detail, feed, search, dan aksi simpan. Landing page boleh ada, tetapi bukan pusat MVP.

### Itinerary as Content

Setiap itinerary diperlakukan seperti post sosial, tetapi dengan struktur yang bisa dipakai:

- Cover image.
- Judul trip.
- Destinasi.
- Durasi.
- Budget.
- Creator.
- Jadwal per hari.
- Rute dan aktivitas.

### Scan Before Read

User harus bisa memahami itinerary dalam beberapa detik lewat:

- Hero visual.
- Meta ringkas.
- Budget summary.
- Tag travel style.
- Timeline aktivitas.

### Copy and Reuse

Aksi utama produk adalah menggunakan itinerary orang lain sebagai template. Tombol `Jalanin Rute Ini` harus selalu terasa lebih penting daripada aksi sekunder.

## 3. Visual Direction

### Style

- Clean dashboard travel.
- White cards on soft blue-gray background.
- Small radius cards, max 8px.
- Subtle shadows.
- Dense but readable spacing.
- Real travel photos as primary visual asset.

### Avoid

- Hero marketing besar tanpa fungsi.
- Decorative gradient blobs or abstract illustrations.
- UI yang terlalu kosong seperti landing page SaaS.
- Card inside card.
- Overly rounded pill-heavy composition.

## 4. Color System

Current prototype tokens:

| Token | Value | Usage |
|---|---:|---|
| `--bg` | `#eaf1f6` | App background |
| `--surface` | `#ffffff` | Main cards and panels |
| `--surface-soft` | `#f7fafc` | Soft card backgrounds |
| `--line` | `#dfe8ef` | Borders |
| `--line-strong` | `#cbd9e4` | Strong input borders |
| `--text` | `#26323d` | Main text |
| `--ink` | `#17212b` | Headings and strong text |
| `--muted` | `#6f7e8c` | Secondary text |
| `--blue` | `#2093dc` | Primary action and active state |
| `--blue-soft` | `#e5f4ff` | Active soft background |
| `--green` | `#20b779` | Positive/budget route accent |
| `--coral` | `#ee6b5e` | Map marker accent |
| `--amber` | `#e7a23a` | Map marker accent |

Primary accent is blue. Supporting accents should be used sparingly for map markers, budget progress, and activity categories.

## 5. Typography

Use system sans-serif stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Guidelines:

- H1 on itinerary hero: 23px to 34px.
- Section headings: 20px to 24px.
- Card headings: 15px to 17px.
- Body text: 13px to 15px.
- Buttons: 13px to 14px, bold.
- Letter spacing: `0`.
- Do not scale type directly with viewport width except controlled hero clamp.

## 6. Layout

### Desktop

Main app shell:

- Max width around 1180px.
- Topbar with brand, search, navigation actions, profile avatar.
- Two-column workspace:
  - Main column: hero, meta, actions, tabs, feed.
  - Sidebar: budget, tags, author, map, saved collection.

Recommended grid:

```css
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
}
```

### Tablet

- Collapse workspace to one column.
- Sidebar cards become two-column where space allows.
- Map and saved collection can span full width.

### Mobile

- Single-column layout.
- Header keeps brand, create icon, and avatar.
- Search moves below brand row.
- Hero image becomes taller for visual impact.
- Sidebar sections move below feed.
- Bottom navigation appears as a normal page element at the end, not fixed over content.

## 7. Core Screens

### Home / Detail Itinerary

This is the primary MVP screen.

Required sections:

- Header/topbar.
- Cover image hero.
- Title and creator overlay.
- Quick meta row.
- Main action row.
- Content tabs.
- Sidebar summary.
- Explore feed.

Primary actions:

- `Suka`
- `Simpan Rute`
- `Jalanin Rute Ini`
- `Bagikan`

### Explore Feed

Feed cards should show:

- Cover image.
- Title.
- Destination.
- Duration.
- Budget.

Cards should be compact and scannable. Avoid long descriptions inside feed cards.

### Create Itinerary

MVP form fields:

- Title.
- Destination.
- Duration.
- Cover image.
- Budget.
- Travel style.
- Description.
- Activities.

Use a drawer or focused page. The drawer works well for prototype and quick creation.

### Saved Itinerary

Saved routes should appear as compact list items:

- Thumbnail.
- Title.
- Duration.
- Budget.

Empty state should explain that saved itineraries will appear here.

### Profile

Profile MVP should include:

- Avatar.
- Name.
- Username.
- City or short bio.
- Count of created itineraries.
- Count of saved itineraries.
- Count of liked itineraries.

## 8. Components

### Topbar

Purpose:

- Brand recognition.
- Search access.
- Fast create action.
- Profile access.

Rules:

- Brand must be visible.
- Search should be prominent on desktop.
- `Buat Itinerary` should use primary button style.
- Icons should be used for compact actions.

### Hero Card

Purpose:

- Make the trip immediately recognizable.
- Use real destination imagery.

Rules:

- Full-width image within main column.
- Overlay contains destination, title, creator.
- Overlay should be readable over all image brightness.

### Meta Pills

Use for compact facts:

- Duration.
- Total budget.
- Cost per day.
- Travel style.
- Destination.

Meta pills should be small and secondary, not competing with primary actions.

### Action Buttons

Hierarchy:

1. `Jalanin Rute Ini` as strongest action.
2. `Simpan Rute` as important secondary action.
3. `Suka` and `Bagikan` as lighter actions.

Active saved/liked states should be visibly different.

### Tabs

Current tabs:

- `Ringkasan`
- `Hari demi Hari`
- `Peta`

Tabs should not navigate away from the itinerary context. They switch local content.

### Activity Card

Each activity should show:

- Time.
- Category icon.
- Activity title.
- Type or location.
- Estimated cost.

Timeline cards should be dense enough for real itineraries but still readable on mobile.

### Budget Card

Budget card should show:

- Total budget.
- Travel style.
- Progress/meter visual.
- Breakdown by category.

Categories:

- Transport.
- Makan.
- Tiket.
- Stay or Lain-lain.

### Map Preview

For MVP, map can be a visual route preview.

Later versions can replace it with a real map integration.

Rules:

- Show route-like path.
- Show numbered pins.
- Keep it compact in sidebar.

## 9. Interaction Rules

### Search

Search should filter feed cards by:

- Title.
- Destination.
- Travel style.
- Tags.

### Save Route

When user clicks `Simpan Rute`:

- Toggle saved state.
- Update saved collection.
- Show toast feedback.

Copy:

- Saved: `Rute berhasil disimpan.`
- Unsaved: `Rute dihapus dari koleksi.`

### Jalanin Rute Ini

When user clicks `Jalanin Rute Ini`:

- Copy itinerary into create/edit form.
- Pre-fill core fields.
- Let user edit before publishing.
- Show toast feedback.

Copy:

- `Template rute disalin ke form kamu.`

### Share

For prototype:

- Copy URL/hash to clipboard.
- Show toast feedback.

Copy:

- `Tautan itinerary berhasil disalin.`

## 10. Responsive Rules

### Desktop

- Keep sidebar visible.
- Use 3-column feed cards.
- Use 3 summary cards.

### Tablet

- Use 2-column cards.
- Stack sidebar below main content.

### Mobile

- Use 1-column cards.
- Avoid fixed controls that cover content.
- Keep touch targets at least 42px high.
- Let long content stack naturally.
- Do not truncate essential itinerary information.

## 11. Content Rules

### Tone

Jalanin voice:

- Santai.
- Praktis.
- Inspiratif.
- Anak muda.
- Tidak terlalu formal.

### Labels

Use Indonesian product language:

- `Simpan Rute`
- `Jalanin Rute Ini`
- `Buat Itinerary`
- `Hari demi Hari`
- `Ringkasan Biaya`
- `Koleksi Kamu`

### Itinerary Titles

Good title patterns:

- `Bali 4D3N Sawah & Pantai`
- `Jogja 3D2N Kuliner Klasik`
- `7 Hari Kansai Budget`
- `Singapore 3D2N Family Easy`

Titles should include duration or clear trip type when possible.

## 12. Accessibility

Minimum expectations:

- Buttons use clear labels or `aria-label`.
- Images have descriptive alt text.
- Form inputs have labels.
- Focus states are visible.
- Color is not the only state indicator.
- Text contrast remains readable on cards and overlays.

## 13. Current Prototype Files

Main implementation files:

- `index.html`
- `styles.css`
- `script.js`

Supporting spec:

- `jalanin_mvp.md`

Visual verification screenshots:

- `jalanin-desktop-check.png`
- `jalanin-mobile-check.png`

## 14. Next UI Improvements

Recommended next steps:

1. Add a dedicated landing page after the app-first prototype is stable.
2. Add real edit itinerary page for copied routes.
3. Add empty, loading, and error states for all main screens.
4. Add auth screens with the same visual system.
5. Replace map preview with real map integration when backend/location data exists.
6. Move seed data into a structured JSON file when the app grows.
7. Convert static prototype to Next.js once package manager and app scaffold are available.

