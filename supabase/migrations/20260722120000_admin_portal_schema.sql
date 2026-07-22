-- Admin Portal (S028) schema — Supabase backing store for the app when
-- VITE_ADMIN_DATA_SOURCE=supabase. Mirrors the domain types in
-- apps/web/src/types/*. Columns are snake_case; the frontend Supabase
-- repositories (apps/web/src/data/*/supabase.ts) map them to the camelCase
-- domain shapes.
--
-- ============================ SECURITY (TESTING) ============================
-- RLS is ENABLED, but the policy loop at the bottom grants the public `anon`
-- role full READ + WRITE on every table. This is deliberate for a TESTING
-- seed: the app authenticates users via ZITADEL (not Supabase Auth) and calls
-- Supabase with the public anon key, so without a permissive policy the app
-- could not exercise its write flows.
--
-- This is NOT production-safe — the anon key is public, so these policies let
-- anyone read and write every table. Before any real deployment: restrict anon
-- to SELECT (or nothing), and move writes behind an Edge Function that verifies
-- a ZITADEL token (see supabase/functions/send-email for the key-holding
-- pattern). Documented in supabase/README.md.
-- ===========================================================================

-- ---- Notifications (SA.08) -------------------------------------------------

create table if not exists public.notification_categories (
  id text primary key,
  name text not null,
  description text not null,
  statutory boolean not null default false,
  -- The four G-02 baseline categories ship locked (no delete, no opt-down).
  baseline boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_templates (
  id text primary key,
  category_id text not null references public.notification_categories(id) on delete restrict,
  name text not null,
  push_title text not null,
  push_body text not null,
  inbox_body text not null,
  updated_at timestamptz not null default now()
);
create index if not exists notification_templates_category_id_idx
  on public.notification_templates(category_id);

-- ---- Welfare routing (SA.12) — routing config ONLY, never case data --------

create table if not exists public.welfare_routing_rules (
  id text primary key,
  category text not null
    check (category in ('counselling','safety','financial-hardship','accommodation','other')),
  route_to text not null,
  escalate_to text not null,
  escalate_after_hours integer not null check (escalate_after_hours >= 0),
  priority text not null check (priority in ('standard','crisis')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---- Hostel allocation rules (SA.10) ---------------------------------------

create table if not exists public.hostel_allocation_rules (
  id text primary key,
  name text not null,
  description text not null,
  priority integer not null,
  applies_to text not null check (applies_to in ('first-year','continuing','all')),
  strategy text not null
    check (strategy in ('random-ballot','first-come-first-served','need-based','merit-based')),
  reserved_share_percent integer not null check (reserved_share_percent between 0 and 100),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---- Scholarship windows (SA.13) -------------------------------------------

create table if not exists public.scholarship_windows (
  id text primary key,
  name text not null,
  description text not null,
  min_standing text not null check (min_standing in ('any','satisfactory','good_standing')),
  programmes text[] not null,
  years_of_study integer[] not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ---- Admissions workflow presentation (SA.01) — S027-owned stage set -------

create table if not exists public.admissions_workflow_stages (
  id text primary key,
  staff_status_key text not null,
  applicant_label text not null,
  applicant_description text not null,
  stage_order integer not null,
  notify_on_enter boolean not null default true,
  terminal boolean not null default false,
  rejection_branch boolean not null default false,
  shows_appeal_rights boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---- App-store releases (governance) ---------------------------------------

create table if not exists public.app_releases (
  id text primary key,
  version text not null,
  summary text not null,
  platforms text[] not null,
  statutory_impacting boolean not null default false,
  status text not null check (status in
    ('draft','wcag-audit','awaiting-approval','approved','submitted','released','rejected')),
  -- wcagAudit flattened; the repository reconstructs the nested object.
  wcag_status text not null default 'pending' check (wcag_status in ('pending','passed','failed')),
  wcag_auditor text,
  wcag_report_ref text,
  wcag_completed_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- S003 audit trail (config changes + release events; no student data) ---

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor text not null,
  area text not null check (area in
    ('notifications','scholarships','welfare-routing','hostel-rules',
     'admissions-workflow','analytics','audit','releases')),
  action text not null,
  summary text not null,
  reference text
);
create index if not exists audit_events_occurred_at_idx
  on public.audit_events(occurred_at desc);

-- ---- Aggregate-only analytics (§2.3/§2.6: counts only, no identities) -------

create table if not exists public.analytics_summary_metrics (
  key text primary key,
  label text not null,
  value bigint not null,
  description text not null,
  sort_order integer not null default 0
);
create table if not exists public.analytics_module_usage (
  module text primary key,
  label text not null,
  sessions_30d bigint not null,
  sort_order integer not null default 0
);
create table if not exists public.analytics_category_delivery (
  category text primary key,
  delivered_30d bigint not null,
  sort_order integer not null default 0
);
create table if not exists public.analytics_weekly_active (
  week_start date primary key,
  active_students bigint not null
);

-- ---- RLS: enable + testing-permissive policy on every table ----------------
-- See the SECURITY (TESTING) banner at the top before shipping this anywhere.

do $$
declare
  t text;
  tables text[] := array[
    'notification_categories','notification_templates','welfare_routing_rules',
    'hostel_allocation_rules','scholarship_windows','admissions_workflow_stages',
    'app_releases','audit_events','analytics_summary_metrics','analytics_module_usage',
    'analytics_category_delivery','analytics_weekly_active'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_testing_all', t);
    -- TESTING ONLY: anon read + write. Lock down before production.
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true);',
      t || '_testing_all', t
    );
  end loop;
end $$;
