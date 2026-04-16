create table if not exists public.site_chat_sessions (
  id uuid primary key,
  user_id uuid not null references public.site_users(id) on delete cascade,
  title text not null default 'New Chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_chat_sessions_user_updated_at
  on public.site_chat_sessions (user_id, updated_at desc);
