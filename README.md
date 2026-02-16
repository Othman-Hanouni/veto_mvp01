# Veto Registry MVP (Morocco)

Minimal Next.js + Supabase web app for veterinarians to manage dog microchip records.

## Features

- Vet authentication (email/password with Supabase Auth)
- Exact microchip search (fast and trimmed input)
- Create dog record with unique microchip
- Dog profile with owner details, status, and vaccine history
- Add vaccine records
- Add status events (normal/lost/stolen/found) with timestamp and notes
- Owner transfer action (primary vet only) with audit log

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres, Auth, RLS)
- Vercel deploy-ready

## Pages

- `/login`
- `/search` (default after login)
- `/dogs/new`
- `/dogs/[id]`
- `/admin`

## 1) Create Supabase project

1. Create a project in Supabase.
2. In SQL editor, run migration from:
   - `supabase/migrations/20261010120000_init_registry.sql`
3. In Authentication > Providers, keep Email enabled.

## 2) Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # only for seed script
```

## 3) Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4) Seed test data (optional)

```bash
node scripts/seed.mjs
```

Creates 2 vet users, 2 dogs, and vaccine records.

## 5) Deploy on Vercel

1. Push repo to GitHub.
2. Import project in Vercel.
3. Set env vars in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. (Optional) Confirm project settings:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: leave empty (default for Next.js)
5. Deploy.

> `SUPABASE_SERVICE_ROLE_KEY` is **not** needed in production unless you run seed/admin scripts in that environment.

## Notes on permissions (RLS)

Implemented in migration SQL:

- Only authenticated users can access data.
- Any authenticated vet can view dogs/owners/vaccines/status events.
- Only primary vet can update dog critical fields (owner/microchip/dog identity).
- Any authenticated vet can add vaccine and status entries.
- Owner transfer is initiated in app by primary vet and logged in `audit_logs`.



## Vercel configuration

This repo includes `vercel.json` to explicitly set the Next.js framework and build/install commands.
