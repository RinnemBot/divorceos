-- First-party website analytics for Divorce Agent.
-- Safe to run more than once in Supabase SQL editor.

create table if not exists public.site_analytics_sessions (
  id text primary key,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  landing_path text not null default '/',
  last_path text not null default '/',
  referrer text,
  user_agent text,
  ip_address text,
  ip_hash text,
  location_city text,
  location_region text,
  location_country text,
  latitude text,
  longitude text,
  screen text,
  language text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_analytics_pageviews (
  id bigserial primary key,
  session_id text not null references public.site_analytics_sessions(id) on delete cascade,
  visitor_id text not null,
  path text not null default '/',
  title text,
  referrer text,
  occurred_at timestamptz not null default now()
);

alter table public.site_analytics_sessions add column if not exists ip_address text;
alter table public.site_analytics_sessions add column if not exists location_city text;
alter table public.site_analytics_sessions add column if not exists location_region text;
alter table public.site_analytics_sessions add column if not exists location_country text;
alter table public.site_analytics_sessions add column if not exists latitude text;
alter table public.site_analytics_sessions add column if not exists longitude text;

create index if not exists idx_site_analytics_sessions_started_at on public.site_analytics_sessions(started_at desc);
create index if not exists idx_site_analytics_sessions_visitor_id on public.site_analytics_sessions(visitor_id);
create index if not exists idx_site_analytics_sessions_last_seen_at on public.site_analytics_sessions(last_seen_at desc);
create index if not exists idx_site_analytics_sessions_ip_address on public.site_analytics_sessions(ip_address);
create index if not exists idx_site_analytics_pageviews_occurred_at on public.site_analytics_pageviews(occurred_at desc);
create index if not exists idx_site_analytics_pageviews_path on public.site_analytics_pageviews(path);
create index if not exists idx_site_analytics_pageviews_session_id on public.site_analytics_pageviews(session_id);

create or replace function public.set_site_analytics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_site_analytics_sessions_updated_at on public.site_analytics_sessions;
create trigger set_site_analytics_sessions_updated_at
before update on public.site_analytics_sessions
for each row execute function public.set_site_analytics_updated_at();

alter table public.site_analytics_sessions enable row level security;
alter table public.site_analytics_pageviews enable row level security;

-- Server-side API uses the Supabase service role key, which bypasses RLS.
-- Do not add public read policies; analytics should stay internal.
