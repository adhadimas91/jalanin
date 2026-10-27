# Graph Report - jalanin  (2026-10-27)

## Corpus Check
- 113 files · ~57,501 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 607 nodes · 1199 edges · 47 communities (27 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e6fb707`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Interactive UI Components
- API Routes & User Sessions
- Admin Panel & Console Operations
- Project Configurations
- Community 4
- Client-Side Prototype Logic
- Supabase Authentication Flow
- TypeScript Configuration
- Google Maps URL Parser
- Time Inputs & Calculations
- Supabase Storage Integration
- Community 11
- Budget Fields
- OSM Mapping Alternatives
- MyLink Affiliate Settings
- Development Checklists
- MyLink Architecture Docs
- Community 17
- Geoapify Search Endpoint
- Brand Cover Templates
- Database Migrations - Itineraries
- Database Migrations - Users
- Database Migrations - Activities
- Cursor MCP Setup
- NextJS Configuration
- PostCSS Configuration
- Tailwind CSS Setup
- Database Migrations - Likes
- Database Migrations - Saved Routes
- Database Migrations - Sessions
- Monetization MVP
- Authentication Cookie Constants
- Project Roadmap
- Visual Design Guidelines
- Default Avatar Asset
- graphify.md
- Community 37
- Community 38
- email.ts
- page.tsx
- Jalanin — AGENTS.md
- Icon
- isAdminUser

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser()` - 55 edges
2. `prisma` - 34 edges
3. `isAdminUser()` - 28 edges
4. `Icon()` - 21 edges
5. `JalaninApp()` - 20 edges
6. `compilerOptions` - 20 edges
7. `formatRupiah()` - 19 edges
8. `getImpersonatorUser()` - 15 edges
9. `Jalanin` - 15 edges
10. `getAdminSnapshot()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --implements--> `App-first Design Principle`  [INFERRED]
  app/page.tsx → UI_GUIDE.md
- `Home()` --semantically_similar_to--> `render()`  [INFERRED] [semantically similar]
  app/page.tsx → script.js
- `selectItinerary()` --implements--> `Simpan Rute (Save Itinerary)`  [INFERRED]
  script.js → jalanin_mvp.md
- `ProfileSettingsPage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/settings/profile/page.tsx → lib/auth.ts
- `validateMyLinkUrl()` --shares_data_with--> `main()`  [INFERRED]
  lib/mylink-validator.ts → prisma/seed.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Prototype UI State & Render Handlers** — script_render, script_rendertab, script_rendersidebar, script_renderfeed, script_selectitinerary, script_createfromform [EXTRACTED 1.00]
- **OpenStreetMap Free Mapping Components** — map_free_alternatives_maplibre_ui, map_free_alternatives_openfreemap_tiles, map_free_alternatives_geoapify_geocoding, map_free_alternatives_manual_location [EXTRACTED 1.00]
- **Authentication Checks** — lib_auth_getcurrentuser, lib_auth_requirecurrentuser, lib_auth_requireadminuser [INFERRED 0.85]
- **Itinerary JSON and Array Parsing** — lib_itinerary_form_parseactivityarray, lib_itinerary_form_parseactivitiesjson, lib_itinerary_form_parsedaysjson [INFERRED 0.85]
- **Geocoding and Maps Parsing Helpers** — lib_maps_parser_geocodeplacequery, lib_maps_parser_geocodewithgeoapify, lib_maps_parser_geocodewithnominatim [INFERRED 0.85]
- **MyLink Validation System** — lib_mylink_validator_validatemylinkurl, lib_mylink_validator_matchdomain, lib_mylink_validator_gethostname, lib_mylink_validator_detectprovider [EXTRACTED 1.00]
- **Explore Feed UI/UX Redesign Tasks** — tasks_task_1_grid_layout_grid_layout_task, tasks_task_2_hover_overlays_hover_overlays_task, tasks_task_3_search_filter_search_filter_task, tasks_task_4_card_click_card_click_task, tasks_task_5_mobile_nav_mobile_nav_task [EXTRACTED 1.00]

## Communities (47 total, 20 thin omitted)

### Community 0 - "Interactive UI Components"
Cohesion: 0.11
Nodes (28): BudgetField(), Props, ActivityDraft, createBlankActivity(), createBlankDay(), createDrafts(), createLocationQueryMap(), DayDraft (+20 more)

### Community 1 - "API Routes & User Sessions"
Cohesion: 0.12
Nodes (30): envStatus(), GET(), POST(), DELETE(), PUT(), POST(), POST(), generateMetadata() (+22 more)

### Community 2 - "Admin Panel & Console Operations"
Cohesion: 0.09
Nodes (44): AdminPage(), DELETE(), isAdminTable(), PATCH(), GET(), isAdminTable(), POST(), AdminConsole() (+36 more)

### Community 3 - "Project Configurations"
Cohesion: 0.05
Nodes (41): autoprefixer, devDependencies, autoprefixer, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (59): ItineraryDetailPage(), ProfilePage(), Props, RegisterFormClient(), ProfileSettingsPage(), CloneItineraryButton(), Icon(), IconSprite() (+51 more)

### Community 5 - "Client-Side Prototype Logic"
Cohesion: 0.14
Nodes (24): Clone Rate Metric, Instagram untuk Itinerary Perjalanan, Jalanin Rute Ini (Clone Itinerary), Save Rate Metric, Simpan Rute (Save Itinerary), Creator Revenue Protection, allItineraries(), closeDrawer() (+16 more)

### Community 6 - "Supabase Authentication Flow"
Cohesion: 0.15
Nodes (12): 1. Setup Environment & AI Provider, 2. Backend API Endpoint (`/api/admin/ai/extract-youtube`), 3. Ekstraksi AI & Structured Prompting, 4. Auto-Geocoding & Normalisasi Lokasi, 5. Penanganan Cover Image & Thumbnail, 6. Integrasi UI di Halaman Buat Itinerary (`app/create/page.tsx`), 7. Verifikasi, Keamanan & Batasan Kuota, 🎯 Objektif & Kebutuhan Fitur (+4 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.06
Nodes (32): DOM, DOM.Iterable, ES2022, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node, node_modules (+24 more)

### Community 8 - "Google Maps URL Parser"
Cohesion: 0.27
Nodes (13): POST(), buildGeocodeCandidates(), extractCoordsFromGoogleMapsUrl(), extractGoogleMapsUrl(), extractPlacePinCoords(), extractPlaceQueryFromGoogleMapsUrl(), geocodePlaceQuery(), geocodeWithGeoapify() (+5 more)

### Community 9 - "Time Inputs & Calculations"
Cohesion: 0.08
Nodes (25): dotenv, maplibre-gl, next, nodemailer, dependencies, dotenv, maplibre-gl, next (+17 more)

### Community 10 - "Supabase Storage Integration"
Cohesion: 0.10
Nodes (10): detectProvider(), formatDate(), getHostname(), getProviderMeta(), getProviderNameFromPattern(), MyLink, MyLinkSettingsPage(), PROVIDER_META (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.50
Nodes (3): Answer, Q: Why does getCurrentUser() connect API Routes & User Sessions to Interactive UI Components, Admin Panel & Console Operations, Itinerary Creation & Forms, Budget Fields?, Source Nodes

### Community 12 - "Budget Fields"
Cohesion: 0.07
Nodes (31): DELETE(), POST(), DELETE(), POST(), DELETE(), GET(), POST(), PUT() (+23 more)

### Community 13 - "OSM Mapping Alternatives"
Cohesion: 0.40
Nodes (5): Geocoding/Search (Geoapify), Manual Location Selection, Map UI (MapLibre GL JS), Map Tiles (OpenFreeMap), OSM Map Stack

### Community 14 - "MyLink Affiliate Settings"
Cohesion: 0.50
Nodes (3): Answer, Q: Explain lib_auth_isadminuser, Source Nodes

### Community 15 - "Development Checklists"
Cohesion: 0.40
Nodes (5): Task 1: Grid Layout, Task 2: Hover Overlays, Task 3: Search and Filter, Task 4: Card Click Interaction, Task 5: Mobile Navigation

### Community 16 - "MyLink Architecture Docs"
Cohesion: 0.50
Nodes (4): Dynamic Domain Validation, Centralized MyLink Library, MyLink Database Model, MyLinkWhitelistDomain Database Model

### Community 17 - "Community 17"
Cohesion: 0.50
Nodes (3): Answer, Q: Path from login to register, Source Nodes

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (15): API Routes, Auth Flow, Current Gaps, Database, Development, Environment, Initial Seed Data, Install (+7 more)

### Community 41 - "email.ts"
Cohesion: 0.38
Nodes (11): hashToken(), POST(), POST(), getBaseUrl(), getDefaultFrom(), getTransporter(), renderEmailTemplate(), sendClaimApprovedEmail() (+3 more)

### Community 43 - "Jalanin — AGENTS.md"
Cohesion: 0.33
Nodes (5): Architecture, Env truth, Gotchas, Jalanin — AGENTS.md, Verify changes (no lint/test scripts exist)

### Community 44 - "Icon"
Cohesion: 0.12
Nodes (27): POST(), GET(), POST(), POST(), POST(), GET(), POST(), POST() (+19 more)

### Community 45 - "isAdminUser"
Cohesion: 0.14
Nodes (18): POST(), PATCH(), CreatePage(), metadata, AiYoutubeImporter(), AiYoutubeImporterProps, CreateItineraryForm(), CreateItineraryFormProps (+10 more)

## Knowledge Gaps
- **192 isolated node(s):** `Prisma-Remote`, `GeoapifyFeature`, `Props`, `metadata`, `Props` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `extractItineraryFromYouTube()` connect `isAdminUser` to `API Routes & User Sessions`, `Time Inputs & Calculations`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Time Inputs & Calculations` to `Project Configurations`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `youtube-transcript` connect `Time Inputs & Calculations` to `isAdminUser`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `Prisma-Remote`, `GeoapifyFeature`, `Props` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interactive UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.10795454545454546 - nodes in this community are weakly interconnected._
- **Should `API Routes & User Sessions` be split into smaller, more focused modules?**
  _Cohesion score 0.11951219512195121 - nodes in this community are weakly interconnected._
- **Should `Admin Panel & Console Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.09013605442176871 - nodes in this community are weakly interconnected._