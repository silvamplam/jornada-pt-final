-- Jornada.pt - participantes por epoca
-- Este passo cria a ligacao Competition/Season -> clubes participantes.
-- A classificacao passa a nascer destes participantes e dos resultados dos jogos.

create extension if not exists pgcrypto;

create table if not exists public.season_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  display_order integer not null default 999,
  status text not null default 'active',
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.season_teams add column if not exists season_id uuid references public.seasons(id) on delete cascade;
alter table public.season_teams add column if not exists team_id uuid references public.teams(id) on delete cascade;
alter table public.season_teams add column if not exists display_order integer not null default 999;
alter table public.season_teams add column if not exists status text not null default 'active';
alter table public.season_teams add column if not exists data_source text not null default 'manual';
alter table public.season_teams add column if not exists external_provider text;
alter table public.season_teams add column if not exists external_id text;
alter table public.season_teams add column if not exists last_synced_at timestamptz;
alter table public.season_teams add column if not exists sync_status text not null default 'manual';
alter table public.season_teams add column if not exists manual_override boolean not null default false;
alter table public.season_teams add column if not exists created_at timestamptz not null default now();
alter table public.season_teams add column if not exists updated_at timestamptz not null default now();

create unique index if not exists season_teams_season_team_idx
on public.season_teams (season_id, team_id);

create index if not exists season_teams_season_order_idx
on public.season_teams (season_id, display_order);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.season_teams to service_role;
grant select on public.season_teams to anon;
grant select on public.competitions to service_role;
grant select on public.seasons to service_role;
grant select on public.teams to service_role;
grant select on public.matches to service_role;
grant select on public.matchdays to service_role;
grant select, insert, update, delete on public.standings to service_role;
grant select, insert, update, delete on public.standing_rows to service_role;

with match_participants as (
  select season_id, home_team_id as team_id, min(kickoff_at) as first_seen
  from public.matches
  where season_id is not null and home_team_id is not null
  group by season_id, home_team_id

  union all

  select season_id, away_team_id as team_id, min(kickoff_at) as first_seen
  from public.matches
  where season_id is not null and away_team_id is not null
  group by season_id, away_team_id
),
grouped as (
  select season_id, team_id, min(first_seen) as first_seen
  from match_participants
  group by season_id, team_id
),
ranked as (
  select
    season_id,
    team_id,
    row_number() over (partition by season_id order by first_seen, team_id)::integer as display_order
  from grouped
)
insert into public.season_teams (
  season_id,
  team_id,
  display_order,
  status,
  data_source,
  sync_status,
  manual_override
)
select
  season_id,
  team_id,
  display_order,
  'active',
  'manual',
  'manual',
  false
from ranked
on conflict (season_id, team_id) do nothing;
