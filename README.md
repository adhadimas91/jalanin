# Jalanin

Jalanin adalah platform sosial travel untuk menemukan, menyimpan, dan menggunakan itinerary perjalanan.

Konsep produk:

> Instagram untuk itinerary perjalanan.

## Status

Saat ini project sudah berisi:

- Next.js App Router.
- React + TypeScript.
- Prisma ORM.
- Prisma Postgres database.
- Supabase Auth untuk register/login.
- API MVP untuk itinerary, save, like, clone, upload.
- UI prototype yang sudah dimigrasikan ke app.
- Seed data awal.

App lokal berjalan di:

```bash
http://localhost:3000
```

## Prerequisites

- Node.js.
- npm.
- PostgreSQL connection string dari Prisma Postgres.
- Supabase project URL dan publishable key.

Catatan lokal: di mesin ini npm bisa perlu dipanggil dengan PATH berikut:

```bash
PATH=/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH
```

## Environment

Buat `.env` dari `.env.example`.

```bash
cp .env.example .env
```

Isi nilai berikut:

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_or_anon_key"
```

Jangan commit `.env`.

## Install

```bash
npm install
```

## Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migration:

```bash
./node_modules/.bin/prisma migrate dev
```

Seed database:

```bash
npm run prisma:seed
```

Verify connection:

```bash
npm run prisma:verify
```

Expected output:

```bash
✅ Connected
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

## Development

Run dev server:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

Build production:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## Vercel Deployment

Set environment variables in Vercel Project Settings:

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_or_anon_key"
```

Use the default build command:

```bash
npm run build
```

The build script runs `npm run prisma:generate` before `next build`. This is required because the generated Prisma client is ignored by git and must be created during Vercel build.

## Demo Account

Seed account:

```text
Email: risa@jalanin.local
Password: jalanin123
```

## Main Routes

- `/` - app feed and itinerary detail experience.
- `/login` - login page.
- `/register` - register page using Supabase Auth.
- `/create` - create itinerary page.
- `/saved` - saved itineraries.
- `/itinerary/[id]` - itinerary detail.
- `/profile/[username]` - profile page.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/itineraries`
- `POST /api/itineraries/[id]/save`
- `DELETE /api/itineraries/[id]/save`
- `POST /api/itineraries/[id]/like`
- `DELETE /api/itineraries/[id]/like`
- `POST /api/itineraries/[id]/clone`
- `POST /api/upload`

## Auth Flow

Register:

1. User submits name, email, and password.
2. App creates user in Supabase Auth.
3. App creates matching profile in Prisma.
4. If Supabase returns an active session, user is logged in.
5. If email confirmation is enabled, user is redirected to login and must confirm email first.

Login:

1. App tries Supabase Auth password login.
2. If Supabase login succeeds and Prisma profile is missing, app creates the profile.
3. App creates local app session cookie.
4. Seed users can still login with local fallback password.

## Uploads

Current MVP upload stores files locally in:

```text
public/uploads
```

Local uploads are ignored by git except:

```text
public/uploads/default-cover.svg
```

Production should move uploads to Supabase Storage or Cloudinary.

## Project Docs

- `jalanin_mvp.md` - product brief.
- `UI_GUIDE.md` - UI direction and design system guide.
- `ROADMAP.md` - development roadmap and checklist.

## Current Gaps

- Production deployment is not configured yet.
- Supabase Storage/Cloudinary not connected yet.
- Edit profile page is not built yet.
- Edit itinerary ownership flow is not complete yet.
- Analytics events are not implemented yet.
- Seed content is still below the target of 30 itineraries.
