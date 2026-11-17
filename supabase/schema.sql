-- Run once in Supabase → SQL Editor
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  brand       text not null check (char_length(brand) between 1 and 160),
  phone       text not null check (char_length(phone) between 5 and 40),
  email       text check (email is null or char_length(email) <= 200),
  needs       text[] not null default '{}',
  budget      text,
  currency    text default 'INR',
  source      text default 'website',
  user_agent  text,
  status      text not null default 'new' check (status in ('new','contacted','won','lost'))
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Lock the table: no anonymous access. The website writes with the service role key (server only).
alter table public.leads enable row level security;
