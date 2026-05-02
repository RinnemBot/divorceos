-- Internal bookkeeping ledger for Divorce Agent LLC.
-- Run in Supabase SQL editor if you want manual expense/income entries.
-- Stripe revenue can still be read live from Stripe without this table.

create extension if not exists "pgcrypto";

create table if not exists public.business_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  source_id text,
  type text not null check (type in ('income', 'expense', 'fee', 'refund', 'adjustment')),
  description text not null,
  amount_cents integer not null,
  fee_cents integer not null default 0,
  net_cents integer not null,
  currency text not null default 'usd',
  occurred_at timestamptz not null default timezone('utc', now()),
  counterparty text,
  category text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_business_ledger_source_source_id
  on public.business_ledger_entries (source, source_id)
  where source_id is not null;

create index if not exists idx_business_ledger_occurred_at
  on public.business_ledger_entries (occurred_at desc);

create index if not exists idx_business_ledger_type
  on public.business_ledger_entries (type);

create or replace function public.set_business_ledger_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists business_ledger_entries_set_updated on public.business_ledger_entries;
create trigger business_ledger_entries_set_updated
before update on public.business_ledger_entries
for each row execute function public.set_business_ledger_updated_at();
