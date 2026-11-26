-- Run once in Supabase → SQL Editor.
-- If you already have the old table, the ALTER statements add the new columns safely.

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  brand       text not null check (char_length(brand) between 1 and 160),
  phone       text not null check (char_length(phone) between 5 and 40),
  email       text check (email is null or char_length(email) <= 200),
  needs       text[] not null default '{}',
  budget      text,
  region      text,
  message     text,
  currency    text default 'INR',
  source      text default 'website',
  user_agent  text,
  status      text not null default 'new' check (status in ('new','contacted','won','lost'))
);

alter table public.leads add column if not exists region text;
alter table public.leads add column if not exists message text;

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Lock the table: no anonymous access. The website writes with the service role key (server only).
alter table public.leads enable row level security;

-- ── Dashboard content ──────────────────────────────────────────────
-- One row per editable collection: services, work, clients, journey, faqs, about, site, legal.
-- The site reads these at request time, so dashboard saves go live immediately.
create table if not exists public.site_content (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- ── Journey illustrations ─────────────────────────────────────────
-- Transparent PNGs uploaded from /admin → Journey live in this public
-- Storage bucket; the content records only store the public URL. The
-- dashboard creates the bucket on first upload, this keeps it reproducible.
insert into storage.buckets (id, name, public)
values ('journey', 'journey', true)
on conflict (id) do nothing;
