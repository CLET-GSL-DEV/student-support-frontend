# Supabase — Admin Portal backing store

This directory holds the Supabase project for the GSL Student Support Admin Portal:

- `functions/send-email` — transactional email via Resend (see its own README).
- `migrations/` + `seed.sql` — the Postgres schema and test data that back the app when
  `VITE_ADMIN_DATA_SOURCE=supabase`.

The web app (`apps/web`) is a client-only Vite SPA with a repository seam: every domain resolves to
a `mock` (default), `api` (gateway stub), or **`supabase`** implementation via
`src/data/dataSource.ts`. The Supabase repositories live in `src/data/<domain>/supabase.ts` and
read/write the tables defined here.

## What gets seeded

`seed.sql` populates all eight domains (spec-accurate, expanded from the mock data): notification
categories + templates, welfare routing rules, hostel allocation rules, scholarship windows,
admissions workflow stages, app releases, audit events, and aggregate analytics. It is idempotent
(`on conflict do nothing`), so re-running is safe.

> Note: this admin portal holds **no student-level PII by design** (SRS §2.3). There are no
> "student" rows — "active students" is an aggregate count in `analytics_summary_metrics`, welfare
> rows are routing _rules_ (not cases), and scholarship rows are _windows_ (not applications).

## One-time setup (interactive — run in a real terminal)

```bash
supabase login
supabase link --project-ref uespikqmsjwenkbokyjh
```

## Push the schema + seed

```bash
# Applies migrations/ to the linked remote database (schema + RLS only —
# `db push` does NOT run seed.sql on the remote):
supabase db push
```

Then load `seed.sql` on the remote by one of:

- **Dashboard**: paste `supabase/seed.sql` into the SQL Editor and run it.
- **psql**: `psql "$DATABASE_URL" -f supabase/seed.sql` (connection string from Project Settings >
  Database).

Local alternative (needs Docker): `supabase start` then `supabase db reset` applies migrations
**and** runs `seed.sql` automatically against the local db.

> The remote tables for project `uespikqmsjwenkbokyjh` were already seeded once (2026-07-22) via the
> PostgREST API, so no manual seed load is needed for it. Re-running `seed.sql` is safe
> (idempotent).

## Point the app at Supabase

In `apps/web/.env`:

```bash
VITE_SUPABASE_URL=https://uespikqmsjwenkbokyjh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key from Supabase > Project Settings > API>
VITE_ADMIN_DATA_SOURCE=supabase
```

Restart the dev server. Every screen now reads and writes the Supabase tables; config writes also
append rows to `audit_events`.

## ⚠️ Security — read before deploying

The migration enables RLS but adds a **testing-permissive policy** that lets the public `anon` role
read AND write every table. That is deliberate so the app — which authenticates via ZITADEL, not
Supabase Auth, and uses the public anon key — can exercise all flows during testing. It is **not
production-safe**: the anon key is public, so anyone could read or modify the data.

Before any real deployment:

- Restrict `anon` to `select` (or nothing) and move writes behind an Edge Function that verifies a
  ZITADEL token (see `functions/send-email` for the key-holding pattern).
- Add rate limiting / stricter policies per table.

See the `[functions.send-email]` note in `config.toml` and the SECURITY banner at the top of
`migrations/20260722120000_admin_portal_schema.sql`.
