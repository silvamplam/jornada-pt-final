-- Jornada.pt - Fase 1 limpa: Pais -> Competicao -> Epoca.
-- Este passo consolida apenas a estrutura manual da Fase 1.
-- Nao faz backfill por nome e nao cria ligacoes por inferencia.

create extension if not exists pgcrypto;

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  iso2 text,
  flag_emoji text,
  is_active boolean not null default true,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country_id uuid references public.countries(id) on delete set null,
  country text,
  logo_url text,
  accent_color text,
  is_active boolean not null default true,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  label text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.competitions
  add column if not exists country_id uuid references public.countries(id) on delete set null;

create index if not exists countries_slug_idx on public.countries (slug);
create index if not exists competitions_country_id_idx on public.competitions (country_id);
create index if not exists seasons_competition_id_idx on public.seasons (competition_id);

grant select on public.countries to anon, authenticated;
grant select on public.competitions to anon, authenticated;
grant select on public.seasons to anon, authenticated;

grant select, insert, update, delete on public.countries to service_role;
grant select, insert, update, delete on public.competitions to service_role;
grant select, insert, update, delete on public.seasons to service_role;
