-- Filing integration schema
-- Run in the Supabase SQL editor after concierge-queue.sql

create extension if not exists "pgcrypto";

create table if not exists public.filing_matters (
  id text primary key,
  user_id text not null,
  case_type text not null,
  county text not null,
  court text,
  status text not null default 'draft',
  provider text not null default 'manual',
  provider_matter_id text,
  party_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_filing_matters_user_id
  on public.filing_matters (user_id);

create index if not exists idx_filing_matters_status
  on public.filing_matters (status);

create index if not exists idx_filing_matters_provider
  on public.filing_matters (provider);

create table if not exists public.filing_submissions (
  id text primary key,
  matter_id text not null references public.filing_matters(id) on delete cascade,
  provider text not null,
  status text not null,
  submission_type text not null,
  provider_submission_id text,
  envelope_id text,
  submitted_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  stamped_documents jsonb not null default '[]'::jsonb,
  raw_provider_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_filing_submissions_matter_id
  on public.filing_submissions (matter_id);

create index if not exists idx_filing_submissions_status
  on public.filing_submissions (status);

create index if not exists idx_filing_submissions_provider_submission_id
  on public.filing_submissions (provider_submission_id);

create table if not exists public.filing_documents (
  id text primary key,
  matter_id text not null references public.filing_matters(id) on delete cascade,
  submission_id text references public.filing_submissions(id) on delete set null,
  provider_document_id text,
  kind text not null default 'court_form',
  title text not null,
  file_url text not null,
  mime_type text not null,
  status text not null default 'draft',
  court_form_code text,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_filing_documents_matter_id
  on public.filing_documents (matter_id);

create index if not exists idx_filing_documents_submission_id
  on public.filing_documents (submission_id);

create table if not exists public.service_requests (
  id text primary key,
  matter_id text not null references public.filing_matters(id) on delete cascade,
  provider text not null,
  provider_service_id text,
  status text not null,
  recipient_name text not null,
  address text not null,
  due_date timestamptz,
  proof_of_service_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_service_requests_matter_id
  on public.service_requests (matter_id);

create index if not exists idx_service_requests_status
  on public.service_requests (status);

create table if not exists public.filing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_filing_webhook_events_provider
  on public.filing_webhook_events (provider);

create index if not exists idx_filing_webhook_events_external_id
  on public.filing_webhook_events (external_id);

create or replace function public.set_filing_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists filing_matters_set_updated on public.filing_matters;
create trigger filing_matters_set_updated
before update on public.filing_matters
for each row execute function public.set_filing_updated_at();

drop trigger if exists filing_submissions_set_updated on public.filing_submissions;
create trigger filing_submissions_set_updated
before update on public.filing_submissions
for each row execute function public.set_filing_updated_at();

drop trigger if exists filing_documents_set_updated on public.filing_documents;
create trigger filing_documents_set_updated
before update on public.filing_documents
for each row execute function public.set_filing_updated_at();

drop trigger if exists service_requests_set_updated on public.service_requests;
create trigger service_requests_set_updated
before update on public.service_requests
for each row execute function public.set_filing_updated_at();
