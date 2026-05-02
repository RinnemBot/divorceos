create table if not exists public.site_filing_trackers (
  user_id uuid primary key references public.site_users(id) on delete cascade,
  completed jsonb not null default '{}'::jsonb,
  updated_at_by_step jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_filing_trackers_updated_at
  on public.site_filing_trackers (updated_at desc);
