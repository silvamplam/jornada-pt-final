-- Jornada.pt - passo 09
-- Classificacoes por competicao, epoca e jornada.
-- Mantem a gestao manual e prepara futura API.

create extension if not exists pgcrypto;

create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  matchday_id uuid references public.matchdays(id) on delete set null,
  moment_label text,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  generated_at timestamptz not null default now()
);

create table if not exists public.standing_rows (
  id uuid primary key default gen_random_uuid(),
  standing_id uuid not null references public.standings(id) on delete cascade,
  team_id uuid not null references public.teams(id),
  position integer not null,
  played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer not null default 0,
  points integer not null default 0,
  home_played integer not null default 0,
  home_wins integer not null default 0,
  home_draws integer not null default 0,
  home_losses integer not null default 0,
  away_played integer not null default 0,
  away_wins integer not null default 0,
  away_draws integer not null default 0,
  away_losses integer not null default 0,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  unique (standing_id, team_id)
);

alter table public.standings add column if not exists moment_label text;
alter table public.standings add column if not exists competition_id uuid references public.competitions(id) on delete cascade;
alter table public.standings add column if not exists season_id uuid references public.seasons(id) on delete cascade;
alter table public.standings add column if not exists matchday_id uuid references public.matchdays(id) on delete set null;
alter table public.standings add column if not exists data_source text not null default 'manual';
alter table public.standings add column if not exists external_provider text;
alter table public.standings add column if not exists external_id text;
alter table public.standings add column if not exists last_synced_at timestamptz;
alter table public.standings add column if not exists sync_status text not null default 'manual';
alter table public.standings add column if not exists manual_override boolean not null default false;
alter table public.standings add column if not exists generated_at timestamptz not null default now();

alter table public.standing_rows add column if not exists home_played integer not null default 0;
alter table public.standing_rows add column if not exists home_wins integer not null default 0;
alter table public.standing_rows add column if not exists home_draws integer not null default 0;
alter table public.standing_rows add column if not exists home_losses integer not null default 0;
alter table public.standing_rows add column if not exists away_played integer not null default 0;
alter table public.standing_rows add column if not exists away_wins integer not null default 0;
alter table public.standing_rows add column if not exists away_draws integer not null default 0;
alter table public.standing_rows add column if not exists away_losses integer not null default 0;
alter table public.standing_rows add column if not exists data_source text not null default 'manual';
alter table public.standing_rows add column if not exists external_provider text;
alter table public.standing_rows add column if not exists external_id text;
alter table public.standing_rows add column if not exists last_synced_at timestamptz;
alter table public.standing_rows add column if not exists sync_status text not null default 'manual';
alter table public.standing_rows add column if not exists manual_override boolean not null default false;

create index if not exists standings_context_idx on public.standings (competition_id, season_id, matchday_id, generated_at desc);
create index if not exists standing_rows_order_idx on public.standing_rows (standing_id, position);
create index if not exists standings_external_lookup_idx on public.standings (external_provider, external_id);
create index if not exists standing_rows_external_lookup_idx on public.standing_rows (external_provider, external_id);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.standings, public.standing_rows to service_role;
grant select on public.competitions, public.seasons, public.matchdays, public.teams to service_role;
