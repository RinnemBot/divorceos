create table if not exists public.site_user_memory (
  user_id uuid primary key references public.site_users(id) on delete cascade,
  summary text,
  facts jsonb not null default '{}'::jsonb,
  memory_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_user_memory_updated_at
  on public.site_user_memory (updated_at desc);
