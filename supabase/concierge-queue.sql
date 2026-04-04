-- Concierge filing queue schema
-- Run in the Supabase SQL editor or via scripts/supabase.sh once that helper exists.

create extension if not exists "pgcrypto";

create table if not exists public.concierge_filing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  customer_name text not null,
  customer_email text,
  plan text,
  county_id text,
  county_name text,
  priority text not null default 'standard',
  status text not null default 'new',
  requested_service text,
  needs_efiling boolean not null default true,
  documents jsonb not null default '[]'::jsonb,
  notes text,
  internal_notes text,
  next_deadline timestamptz,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_activity_at timestamptz,
  claimed_by text,
  claimed_by_email text,
  claimed_at timestamptz,
  source text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_concierge_filing_requests_status
  on public.concierge_filing_requests (status);

create index if not exists idx_concierge_filing_requests_priority
  on public.concierge_filing_requests (priority);

create index if not exists idx_concierge_filing_requests_submitted_at
  on public.concierge_filing_requests (submitted_at desc);

-- Optional trigger to keep updated_at fresh
create or replace function public.set_concierge_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger concierge_filing_requests_set_updated
before update on public.concierge_filing_requests
for each row execute function public.set_concierge_updated_at();
