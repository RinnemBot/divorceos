create extension if not exists pgcrypto;

create table if not exists public.site_support_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.site_users(id) on delete cascade,
  title text not null,
  child_support numeric not null default 0,
  spousal_support numeric not null default 0,
  combined_support numeric not null default 0,
  estimate_payer text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists site_support_scenarios_user_id_idx on public.site_support_scenarios(user_id, created_at desc);
