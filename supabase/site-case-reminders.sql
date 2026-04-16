create table if not exists public.site_case_reminders (
  id uuid primary key,
  user_id uuid not null references public.site_users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  forms jsonb not null default '[]'::jsonb,
  action_tab text,
  email_enabled boolean not null default false,
  last_emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_case_reminders_user_due_at
  on public.site_case_reminders (user_id, due_at asc);
