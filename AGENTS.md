# Jalanin — AGENTS.md

Next.js App Router app (Instagram-for-itineraries). React + TS strict, Prisma 6 with adapter-pg, Tailwind.

## Verify changes (no lint/test scripts exist)
- Typecheck: `npx tsc --noEmit` (TypeScript 6.0.3; tsconfig has `ignoreDeprecations: "6.0"`)
- Full check: `npm run build` (runs `prisma:generate` first, then `next build --webpack`)
- Quick DB check: `npm run prisma:verify` → expect `✅ Connected`

## Gotchas
- `prisma:generate` is NOT optional: generated client lives in `generated/prisma/` (gitignored), imports use `../generated/prisma/client.js`. Re-run it after pulling or changing `prisma/schema.prisma`. It shells out to `tsc` via the `prisma:compile` script to emit `.js` next to `.ts`.
- Dev/build use the `--webpack` flag (`next dev --webpack`, `next build --webpack`) — do not remove it or switch to turbopack without checking.
- `lib/prisma.ts` throws if `DATABASE_URL` is missing at runtime; importing it in a script requires `dotenv/config` (it imports it itself).
- Seed: `npm run prisma:seed` (tsx, `prisma/seed.ts`) seeds initial MyLink whitelist domains and app settings.
- npm may need `PATH=/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH` (per README).

## Env truth
- Trust `.env.example`, not README: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob), `ADMIN_EMAILS` (comma-separated admin gate), `GEOAPIFY_API_KEY`.
- README sections on Supabase Auth/Storage are stale; auth is a custom session cookie (`jalanin_session`, lib/auth.ts), uploads go through Vercel Blob (`lib/blob-storage.ts`). Supabase env vars still referenced in `app/page.tsx` — likely leftover.
- `SUPABASE_SERVICE_ROLE_KEY`-style server secrets must never get a `NEXT_PUBLIC_` prefix.

## Architecture
- Entry: `app/` routes (feed `/`, `/login`, `/register`, `/create`, `/saved`, `/itinerary/[id]`, `/profile/[username]`, plus `/admin`, `/settings`, `/claim`, `/setup-password`...). API in `app/api/`.
- Shared logic in `lib/` (`auth.ts`, `prisma.ts`, `itineraries.ts`, `analytics.ts`, `maps-parser.ts`, `mylink-validator.ts`...). Path alias `@/*` → repo root.
- Root-level `index.html`, `script.js`, `styles.css` are the pre-migration UI prototype leftovers — the real UI is `app/` + `components/`.
- **Admin UI Kit (`next-shadcn/`)**: Always use `next-shadcn/` as the canonical UI kit and design/component reference for all Admin UI work (`/admin`, `components/admin-*`, tables, forms, layouts, charts). Inspect and port/adapt components from `next-shadcn/src/components/` and `next-shadcn/src/features/` rather than creating custom ad-hoc admin styles (see `.agents/rules/admin-ui.md`).
- `graphify-out/graph.json` exists: for architecture questions run `graphify query "<q>"` first; after modifying code run `graphify update .` (see `.agents/rules/graphify.md`).
