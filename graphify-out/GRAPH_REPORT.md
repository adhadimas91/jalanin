# Graph Report - jalanin  (2026-06-14)

## Corpus Check
- 87 files · ~42,432 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 700 nodes · 1151 edges · 81 communities (57 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ec3242c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Interactive UI Components|Interactive UI Components]]
- [[_COMMUNITY_API Routes & User Sessions|API Routes & User Sessions]]
- [[_COMMUNITY_Admin Panel & Console Operations|Admin Panel & Console Operations]]
- [[_COMMUNITY_Project Configurations|Project Configurations]]
- [[_COMMUNITY_Itinerary Creation & Forms|Itinerary Creation & Forms]]
- [[_COMMUNITY_Client-Side Prototype Logic|Client-Side Prototype Logic]]
- [[_COMMUNITY_Supabase Authentication Flow|Supabase Authentication Flow]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Google Maps URL Parser|Google Maps URL Parser]]
- [[_COMMUNITY_Time Inputs & Calculations|Time Inputs & Calculations]]
- [[_COMMUNITY_Supabase Storage Integration|Supabase Storage Integration]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_Budget Fields|Budget Fields]]
- [[_COMMUNITY_OSM Mapping Alternatives|OSM Mapping Alternatives]]
- [[_COMMUNITY_MyLink Affiliate Settings|MyLink Affiliate Settings]]
- [[_COMMUNITY_Development Checklists|Development Checklists]]
- [[_COMMUNITY_MyLink Architecture Docs|MyLink Architecture Docs]]
- [[_COMMUNITY_App Layout Setup|App Layout Setup]]
- [[_COMMUNITY_Geoapify Search Endpoint|Geoapify Search Endpoint]]
- [[_COMMUNITY_Brand Cover Templates|Brand Cover Templates]]
- [[_COMMUNITY_Database Migrations - Itineraries|Database Migrations - Itineraries]]
- [[_COMMUNITY_Database Migrations - Users|Database Migrations - Users]]
- [[_COMMUNITY_Database Migrations - Activities|Database Migrations - Activities]]
- [[_COMMUNITY_Cursor MCP Setup|Cursor MCP Setup]]
- [[_COMMUNITY_NextJS Configuration|NextJS Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]
- [[_COMMUNITY_Tailwind CSS Setup|Tailwind CSS Setup]]
- [[_COMMUNITY_Database Migrations - Likes|Database Migrations - Likes]]
- [[_COMMUNITY_Database Migrations - Saved Routes|Database Migrations - Saved Routes]]
- [[_COMMUNITY_Database Migrations - Sessions|Database Migrations - Sessions]]
- [[_COMMUNITY_Monetization MVP|Monetization MVP]]
- [[_COMMUNITY_Authentication Cookie Constants|Authentication Cookie Constants]]
- [[_COMMUNITY_Project Roadmap|Project Roadmap]]
- [[_COMMUNITY_Visual Design Guidelines|Visual Design Guidelines]]
- [[_COMMUNITY_Default Avatar Asset|Default Avatar Asset]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser()` - 55 edges
2. `prisma` - 25 edges
3. `MVP Product Brief — Jalanin` - 25 edges
4. `isAdminUser()` - 22 edges
5. `Icon()` - 20 edges
6. `compilerOptions` - 20 edges
7. `Jalanin Development Roadmap` - 19 edges
8. `JalaninApp()` - 18 edges
9. `formatRupiah()` - 17 edges
10. `Jalanin` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --implements--> `App-first Design Principle`  [INFERRED]
  app/page.tsx → UI_GUIDE.md
- `Home()` --semantically_similar_to--> `render()`  [INFERRED] [semantically similar]
  app/page.tsx → script.js
- `render()` --implements--> `Scan Before Read`  [INFERRED]
  script.js → UI_GUIDE.md
- `selectItinerary()` --implements--> `Simpan Rute (Save Itinerary)`  [INFERRED]
  script.js → jalanin_mvp.md
- `DELETE()` --calls--> `getCurrentUser()`  [INFERRED]
  app/api/admin/[table]/[id]/route.ts → lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Admin API Table & Record Endpoints** — table_route_get, table_route_post, id_route_patch, id_route_delete [EXTRACTED 1.00]
- **Prototype UI State & Render Handlers** — script_render, script_rendertab, script_rendersidebar, script_renderfeed, script_selectitinerary, script_createfromform [EXTRACTED 1.00]
- **OpenStreetMap Free Mapping Components** — map_free_alternatives_maplibre_ui, map_free_alternatives_openfreemap_tiles, map_free_alternatives_geoapify_geocoding, map_free_alternatives_manual_location [EXTRACTED 1.00]
- **Authentication Route Handlers** — login_route_post, logout_route_post, register_route_post [EXTRACTED 1.00]
- **Itinerary API Endpoints** — itineraries_route_post, _id__route_put, _id__route_delete, clone_route_post, like_route_post, save_route_post [EXTRACTED 1.00]
- **Authentication Checks** — lib_auth_getcurrentuser, lib_auth_requirecurrentuser, lib_auth_requireadminuser [INFERRED 0.85]
- **Itinerary JSON and Array Parsing** — lib_itinerary_form_parseactivityarray, lib_itinerary_form_parseactivitiesjson, lib_itinerary_form_parsedaysjson [INFERRED 0.85]
- **Geocoding and Maps Parsing Helpers** — lib_maps_parser_geocodeplacequery, lib_maps_parser_geocodewithgeoapify, lib_maps_parser_geocodewithnominatim [INFERRED 0.85]
- **MyLink Validation System** — lib_mylink_validator_validatemylinkurl, lib_mylink_validator_matchdomain, lib_mylink_validator_gethostname, lib_mylink_validator_detectprovider [EXTRACTED 1.00]
- **Supabase REST API Integration Pattern** — lib_supabase_auth_requestsupabaseauth, lib_supabase_storage_ensuresupabasestoragebucket, lib_supabase_storage_uploadimagetosupabasestorage [INFERRED 0.95]
- **Explore Feed UI/UX Redesign Tasks** — tasks_task_1_grid_layout_grid_layout_task, tasks_task_2_hover_overlays_hover_overlays_task, tasks_task_3_search_filter_search_filter_task, tasks_task_4_card_click_card_click_task, tasks_task_5_mobile_nav_mobile_nav_task [EXTRACTED 1.00]

## Communities (81 total, 24 thin omitted)

### Community 0 - "Interactive UI Components"
Cohesion: 0.13
Nodes (16): ActivityDraft, createBlankActivity(), createBlankDay(), createLocationQueryMap(), DayDraft, defaultMapCenter, filters, fromDay() (+8 more)

### Community 1 - "API Routes & User Sessions"
Cohesion: 0.06
Nodes (65): ItineraryDetailPage Component, DELETE (Itinerary Detail Route), PUT (Itinerary Detail Route), DELETE(), Home(), POST(), CreatePage(), envStatus() (+57 more)

### Community 2 - "Admin Panel & Console Operations"
Cohesion: 0.10
Nodes (38): AdminPage(), DELETE(), Props, TableConfig, DELETE /api/admin/[table]/[id], isAdminTable(), PATCH(), AdminRecord (+30 more)

### Community 3 - "Project Configurations"
Cohesion: 0.05
Nodes (38): dependencies, dotenv, maplibre-gl, next, pg, @prisma/adapter-pg, @prisma/client, react (+30 more)

### Community 5 - "Client-Side Prototype Logic"
Cohesion: 0.14
Nodes (27): Clone Rate Metric, Instagram untuk Itinerary Perjalanan, Jalanin Rute Ini (Clone Itinerary), Save Rate Metric, Simpan Rute (Save Itinerary), $(), Creator Revenue Protection, allItineraries() (+19 more)

### Community 6 - "Supabase Authentication Flow"
Cohesion: 0.13
Nodes (17): createSession(), Custom Supabase REST API Integration, getSupabaseAuthConfig(), requestSupabaseAuth(), signInWithSupabaseAuth(), signUpWithSupabaseAuth(), SupabaseAuthError, SupabaseAuthResponse (+9 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.08
Nodes (23): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, ignoreDeprecations, incremental, isolatedModules (+15 more)

### Community 8 - "Google Maps URL Parser"
Cohesion: 0.27
Nodes (13): buildGeocodeCandidates(), extractCoordsFromGoogleMapsUrl(), extractGoogleMapsUrl(), extractPlacePinCoords(), extractPlaceQueryFromGoogleMapsUrl(), geocodePlaceQuery(), geocodeWithGeoapify(), geocodeWithNominatim() (+5 more)

### Community 9 - "Time Inputs & Calculations"
Cohesion: 0.38
Nodes (8): HOURS, MINUTES, Props, TimeInput(), clampHour(), clampMinute(), formatActivityTime(), parseActivityTime()

### Community 10 - "Supabase Storage Integration"
Cohesion: 0.04
Nodes (46): 10. Responsive Rules, 11. Content Rules, 12. Accessibility, 13. Current Prototype Files, 14. Next UI Improvements, 1. Product Feel, 2. Design Principles, 3. Visual Direction (+38 more)

### Community 11 - "Database Seeding"
Cohesion: 0.32
Nodes (7): adapter, ensureItinerary(), itineraries, main(), prisma, SeedActivity, SeedItinerary

### Community 12 - "Budget Fields"
Cohesion: 0.19
Nodes (14): AdminConsole(), CloneItineraryButton(), Icon(), IconSprite(), JalaninItinerary, JalaninLanding(), Props, SavedItinerary (+6 more)

### Community 13 - "OSM Mapping Alternatives"
Cohesion: 0.40
Nodes (5): Geocoding/Search (Geoapify), Manual Location Selection, Map UI (MapLibre GL JS), Map Tiles (OpenFreeMap), OSM Map Stack

### Community 14 - "MyLink Affiliate Settings"
Cohesion: 0.50
Nodes (4): getProviderNameFromPattern(), MyLink, MyLinkSettingsPage(), WhitelistDomain

### Community 15 - "Development Checklists"
Cohesion: 0.40
Nodes (5): Task 1: Grid Layout, Task 2: Hover Overlays, Task 3: Search and Filter, Task 4: Card Click Interaction, Task 5: Mobile Navigation

### Community 16 - "MyLink Architecture Docs"
Cohesion: 0.50
Nodes (4): Dynamic Domain Validation, Centralized MyLink Library, MyLink Database Model, MyLinkWhitelistDomain Database Model

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (15): tableConfigs, ActivityDraft, createBlankActivity(), createBlankDay(), createDrafts(), createLocationQueryMap(), DayDraft, defaultMapCenter (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (15): API Routes, Auth Flow, Current Gaps, Database, Demo Account, Development, Environment, Install (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (14): 1. Ringkasan Produk, 20. Versi MVP Paling Sederhana, 21. One-Liner Pitch, 22. Next Step Setelah MVP, 23. MVP Priority Summary, 24. Definisi MVP Berhasil, 2. Masalah yang Ingin Diselesaikan, 3. Solusi (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (14): 1. Arsitektur Basis Data (Prisma Schema), 2. Sistem Validasi Domain Dinamis (`lib/mylink-validator.ts`), 3. Rute API (Next.js App Router API Routes), 4. Perlindungan Pendapatan Kreator pada Kloning Itinerary, 5. Komponen & Alur Kerja Antarmuka (UI/UX), A. Halaman Pustaka Link (`app/settings/mylink/page.tsx`), A. Manajemen Link MyLink (`app/api/mylink/links/route.ts`), B. Form Builder Rute Perjalanan (`components/jalanin-app.tsx`) (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (9): 7.1 Authentication, 7.2 Feed Itinerary, 7.3 Detail Itinerary, 7.4 Create Itinerary, 7.5 Save Itinerary, 7.6 Use This Itinerary, 7.7 User Profile, 7.8 Search & Explore (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.28
Nodes (8): ACTIVITY_TYPE_COLORS, ActivityCost, ActivityType, computeTripInsights(), isKnownActivityType(), normalizeActivityType(), TripDay, TripInsightLine

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): Jalanin Development Roadmap, MVP Goal, MVP Release Criteria, Recommended Stack, Required Per Itinerary, Seed Content Checklist, Status Saat Ini, Suggested Seed Topics

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (9): Acceptance Criteria, Activity, Checklist, Itinerary, Itinerary Day, Phase 2 - Database & Data Model, Recommended Fields, Required Models (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (8): 13. Rekomendasi Tech Stack MVP, Authentication, Backend, Database, Deployment, Frontend, ORM, Storage

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): Alternatif Map Gratis untuk Feature Aktivitas Jalanin, Catatan Layanan Gratis, Data yang Perlu Disimpan, Flow Input Aktivitas, Rekomendasi MVP, Scope Implementasi Awal, Tujuan

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (9): ProfilePage Component, ItineraryInteractiveView(), RouteMap(), SerializedActivity, SerializedDay, SerializedItinerary, activityIcon(), formatRupiah() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (7): 11. Data Model Awal, Activity, Itinerary, Itinerary Day, Like, Saved Itinerary, User

### Community 49 - "Community 49"
Cohesion: 0.36
Nodes (6): BudgetField(), Props, PriceInput(), Props, formatPriceInput(), parsePriceInput()

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (5): 12. Prioritas Development, Phase 1 — Foundation, Phase 2 — Social Discovery, Phase 3 — Core Differentiator, Phase 4 — Polish MVP

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (5): 14. MVP Success Metrics, Activation, Core Validation, Creator Validation, Engagement

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (5): 18. Brand Direction, Brand Keywords, Nama Produk, Tagline, Tone of Voice

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (5): 19. Risiko MVP, Risiko 1 — User malas membuat itinerary, Risiko 2 — Feed kosong saat awal launch, Risiko 3 — Itinerary terlalu panjang untuk dibaca, Risiko 4 — Sulit bersaing dengan Instagram/TikTok

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (5): Acceptance Criteria, Checklist, Detail Data, Feed Card Data, Phase 4 - Feed & Detail Itinerary

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (5): Acceptance Criteria, Jalanin Rute Ini, Like Itinerary, Phase 6 - Save, Like, and Clone, Save Itinerary

### Community 56 - "Community 56"
Cohesion: 0.40
Nodes (5): Data, Functional, QA Checklist, Security, UI

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (5): Sprint 1 - Foundation, Sprint 2 - Auth & Creation, Sprint 3 - Core Differentiator, Sprint 4 - Discovery & Validation, Suggested Sprint Plan

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (4): 15. Hipotesis yang Diuji, Hipotesis 1, Hipotesis 2, Hipotesis 3

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (4): 17. Landing Page Copy, Benefit Section, CTA, Hero Section

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (4): 9. User Flow MVP, Flow 1 — User Menemukan Itinerary, Flow 2 — User Menggunakan Itinerary Orang Lain, Flow 3 — User Membuat Itinerary

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): Answer, Q: Why does getCurrentUser() connect API Routes & User Sessions to Interactive UI Components, Admin Panel & Console Operations, Itinerary Creation & Forms, Budget Fields?, Source Nodes

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): Answer, Q: Explain lib_auth_isadminuser, Source Nodes

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): Answer, Q: Path from login to register, Source Nodes

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (4): Acceptance Criteria, Checklist, Pages, Phase 1 - App Scaffold

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (4): Acceptance Criteria, Checklist, Pages, Phase 3 - Authentication & Profile

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (4): Acceptance Criteria, Checklist, Form Fields, Phase 5 - Create & Edit Itinerary

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (4): Acceptance Criteria, Events, Metrics, Phase 8 - Analytics & Validation

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (3): Contoh Potongan Kode CSS yang Direkomendasikan, Sub-Tasks, Task 1: Tata Letak Grid Mosaik (Instagram Explore-style)

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (3): Contoh Potongan Kode CSS yang Direkomendasikan, Sub-Tasks, Task 2: Interaksi Hover & Tampilan Overlay Informasi

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (3): 10. Struktur Halaman MVP, Logged-in User, Public / Guest

### Community 71 - "Community 71"
Cohesion: 0.67
Nodes (3): 16. MVP Content Strategy, Format Konten, Target Seed Content

### Community 72 - "Community 72"
Cohesion: 0.67
Nodes (3): 4. Target User MVP, Primary User, Secondary User

### Community 73 - "Community 73"
Cohesion: 0.67
Nodes (3): Acceptance Criteria, Checklist, Phase 0 - Product & Technical Foundation

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): Acceptance Criteria, Checklist, Phase 7 - Search & Explore

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (3): Acceptance Criteria, Checklist, Phase 9 - Polish MVP

### Community 76 - "Community 76"
Cohesion: 0.67
Nodes (3): Acceptance Criteria, Checklist, Phase 10 - Deployment

## Knowledge Gaps
- **331 isolated node(s):** `Prisma-Remote`, `GeoapifyFeature`, `metadata`, `Props`, `MyLink` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Home()` connect `API Routes & User Sessions` to `Client-Side Prototype Logic`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `render()` connect `Client-Side Prototype Logic` to `API Routes & User Sessions`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `API Routes & User Sessions` to `Community 49`, `Admin Panel & Console Operations`, `Budget Fields`, `Community 47`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getCurrentUser()` (e.g. with `DELETE()` and `DELETE()`) actually correct?**
  _`getCurrentUser()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `isAdminUser()` (e.g. with `DELETE()` and `DELETE()`) actually correct?**
  _`isAdminUser()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Prisma-Remote`, `GeoapifyFeature`, `metadata` to the rest of the system?**
  _332 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interactive UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._