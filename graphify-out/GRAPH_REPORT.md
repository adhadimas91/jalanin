# Graph Report - jalanin  (2026-08-15)

## Corpus Check
- 98 files · ~48,536 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 519 nodes · 1018 edges · 42 communities (23 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2fc7aefe`
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

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser()` - 50 edges
2. `prisma` - 30 edges
3. `JalaninApp()` - 21 edges
4. `Icon()` - 20 edges
5. `compilerOptions` - 20 edges
6. `isAdminUser()` - 18 edges
7. `formatRupiah()` - 16 edges
8. `Jalanin` - 15 edges
9. `getAdminSnapshot()` - 14 edges
10. `createAdminRecord()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --implements--> `App-first Design Principle`  [INFERRED]
  app/page.tsx → UI_GUIDE.md
- `Home()` --semantically_similar_to--> `render()`  [INFERRED] [semantically similar]
  app/page.tsx → script.js
- `selectItinerary()` --implements--> `Simpan Rute (Save Itinerary)`  [INFERRED]
  script.js → jalanin_mvp.md
- `CreatePage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/create/page.tsx → lib/auth.ts
- `generateMetadata()` --calls--> `getItineraryById()`  [EXTRACTED]
  app/itinerary/[id]/page.tsx → lib/itineraries.ts

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

## Communities (42 total, 19 thin omitted)

### Community 0 - "Interactive UI Components"
Cohesion: 0.07
Nodes (52): ActivityDraft, createBlankActivity(), createBlankDay(), createDrafts(), createLocationQueryMap(), DayDraft, defaultMapCenter, draftKey() (+44 more)

### Community 1 - "API Routes & User Sessions"
Cohesion: 0.14
Nodes (27): envStatus(), GET(), PUT(), POST(), Home(), DEFAULT_ACTIVITY_TYPE, allowedImageTypes, getBlobStorageStatus() (+19 more)

### Community 2 - "Admin Panel & Console Operations"
Cohesion: 0.07
Nodes (56): AdminPage(), POST(), DELETE(), isAdminTable(), PATCH(), GET(), isAdminTable(), POST() (+48 more)

### Community 3 - "Project Configurations"
Cohesion: 0.05
Nodes (41): autoprefixer, devDependencies, autoprefixer, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (35): CreatePage(), generateMetadata(), ItineraryDetailPage(), ProfilePage(), Props, RegisterFormClient(), BudgetField(), Props (+27 more)

### Community 5 - "Client-Side Prototype Logic"
Cohesion: 0.12
Nodes (25): metadata, Clone Rate Metric, Instagram untuk Itinerary Perjalanan, Jalanin Rute Ini (Clone Itinerary), Save Rate Metric, Simpan Rute (Save Itinerary), Creator Revenue Protection, allItineraries() (+17 more)

### Community 6 - "Supabase Authentication Flow"
Cohesion: 0.19
Nodes (15): POST(), POST(), usernameFromEmail(), POST(), createSession(), hashPassword(), scrypt, verifyPassword() (+7 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.06
Nodes (32): DOM, DOM.Iterable, ES2022, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node, node_modules (+24 more)

### Community 8 - "Google Maps URL Parser"
Cohesion: 0.31
Nodes (11): POST(), buildGeocodeCandidates(), extractCoordsFromGoogleMapsUrl(), extractPlacePinCoords(), extractPlaceQueryFromGoogleMapsUrl(), geocodePlaceQuery(), geocodeWithGeoapify(), geocodeWithNominatim() (+3 more)

### Community 9 - "Time Inputs & Calculations"
Cohesion: 0.09
Nodes (23): dotenv, maplibre-gl, next, nodemailer, dependencies, dotenv, maplibre-gl, next (+15 more)

### Community 10 - "Supabase Storage Integration"
Cohesion: 0.50
Nodes (4): getProviderNameFromPattern(), MyLink, MyLinkSettingsPage(), WhitelistDomain

### Community 11 - "Community 11"
Cohesion: 0.50
Nodes (3): Answer, Q: Why does getCurrentUser() connect API Routes & User Sessions to Interactive UI Components, Admin Panel & Console Operations, Itinerary Creation & Forms, Budget Fields?, Source Nodes

### Community 12 - "Budget Fields"
Cohesion: 0.08
Nodes (33): POST(), POST(), DELETE(), POST(), DELETE(), POST(), DELETE(), GET() (+25 more)

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
Nodes (15): API Routes, Auth Flow, Current Gaps, Database, Demo Account, Development, Environment, Install (+7 more)

## Knowledge Gaps
- **170 isolated node(s):** `Prisma-Remote`, `GeoapifyFeature`, `metadata`, `Props`, `MyLink` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getCurrentUser()` connect `Budget Fields` to `API Routes & User Sessions`, `Admin Panel & Console Operations`, `Community 4`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Home()` connect `API Routes & User Sessions` to `Budget Fields`, `Client-Side Prototype Logic`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `render()` connect `Client-Side Prototype Logic` to `API Routes & User Sessions`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Prisma-Remote`, `GeoapifyFeature`, `metadata` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interactive UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06892230576441102 - nodes in this community are weakly interconnected._
- **Should `API Routes & User Sessions` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._
- **Should `Admin Panel & Console Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._