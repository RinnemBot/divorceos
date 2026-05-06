-- Server-backed Draft Forms workspaces for Divorce Agent.
-- Safe to run more than once in Supabase SQL editor.

create table if not exists public.site_form_drafts (
  id uuid primary key,
  user_id uuid not null references public.site_users(id) on delete cascade,
  title text not null default 'Draft forms workspace',
  status text not null default 'in_review',
  workspace jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_form_drafts_user_updated_at
  on public.site_form_drafts (user_id, updated_at desc);

create index if not exists idx_site_form_drafts_status
  on public.site_form_drafts (status);

alter table public.site_form_drafts enable row level security;

-- Server-side API uses the Supabase service role key, which bypasses RLS.
-- Do not add public read/write policies; draft workspaces should stay private.
