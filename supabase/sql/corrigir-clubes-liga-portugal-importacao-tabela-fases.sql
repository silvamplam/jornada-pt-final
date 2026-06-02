-- Jornada.pt - corrigir clubes da Liga Portugal importados como linhas de tabela.
-- Executar por blocos separados no Supabase. Cada bloco tem menos de 100 linhas.
-- Nao usa temporary tables. As tabelas auxiliares sao criadas e removidas no fim.

-- BLOCO 1 - Preparar campos e tabelas auxiliares
alter table public.teams
  add column if not exists code text;

alter table public.teams
  add column if not exists secondary_color text;

alter table public.teams
  add column if not exists country_id uuid references public.countries(id) on delete set null;

drop table if exists public._liga_portugal_team_import_fix_map;
drop table if exists public._liga_portugal_team_import_fix;

create table public._liga_portugal_team_import_fix (
  malformed_team_id uuid primary key,
  fixed_name text not null,
  fixed_slug text not null,
  fixed_short_name text not null,
  fixed_code text,
  fixed_primary_color text,
  fixed_secondary_color text,
  preserved_logo_url text,
  fixed_country_id uuid,
  fixed_country text
);

create table public._liga_portugal_team_import_fix_map (
  malformed_team_id uuid primary key,
  canonical_team_id uuid not null
);

-- BLOCO 2 - Extrair campos dos registos mal importados
with candidate_texts as (
  select t.id, t.logo_url, t.country, t.country_id, v.source_text
  from public.teams t
  cross join lateral (
    values (t.name), (t.slug), (t.short_name),
           (t.primary_color), (t.secondary_color), (t.logo_url)
  ) as v(source_text)
  where v.source_text like '%|%'
),
parsed as (
  select
    c.id as malformed_team_id,
    c.logo_url,
    c.country,
    c.country_id,
    regexp_match(
      c.source_text,
      '^\s*\|\s*([^|`]+?)\s*\|\s*`?([^|`]+?)`?\s*\|\s*([^|`]+?)\s*\|\s*([^|`]+?)\s*\|\s*`?(#[0-9A-Fa-f]{6})`?\s*\|\s*`?(#[0-9A-Fa-f]{6})`?\s*\|?\s*$'
    ) as fields
  from candidate_texts c
),
deduped as (
  select distinct on (malformed_team_id)
    malformed_team_id, logo_url, country, country_id, fields
  from parsed
  where fields is not null
  order by malformed_team_id
)
insert into public._liga_portugal_team_import_fix (
  malformed_team_id, fixed_name, fixed_slug, fixed_short_name, fixed_code,
  fixed_primary_color, fixed_secondary_color, preserved_logo_url,
  fixed_country_id, fixed_country
)
select
  d.malformed_team_id,
  trim(d.fields[1]),
  trim(d.fields[2]),
  trim(d.fields[3]),
  trim(d.fields[4]),
  upper(trim(d.fields[5])),
  upper(trim(d.fields[6])),
  case when d.logo_url not like '%|%' then nullif(trim(d.logo_url), '') end,
  coalesce(d.country_id, portugal.id),
  case when d.country not like '%|%' then coalesce(nullif(trim(d.country), ''), 'Portugal') else 'Portugal' end
from deduped d
left join lateral (
  select id
  from public.countries
  where slug = 'portugal' or lower(name) = 'portugal' or lower(iso2) = 'pt'
  limit 1
) portugal on true
on conflict (malformed_team_id) do update
set fixed_name = excluded.fixed_name,
    fixed_slug = excluded.fixed_slug,
    fixed_short_name = excluded.fixed_short_name,
    fixed_code = excluded.fixed_code,
    fixed_primary_color = excluded.fixed_primary_color,
    fixed_secondary_color = excluded.fixed_secondary_color,
    preserved_logo_url = excluded.preserved_logo_url,
    fixed_country_id = excluded.fixed_country_id,
    fixed_country = excluded.fixed_country;

-- BLOCO 3 - Verificar o que foi extraido antes de alterar clubes
select
  malformed_team_id,
  fixed_name,
  fixed_slug,
  fixed_short_name,
  fixed_code,
  fixed_primary_color,
  fixed_secondary_color
from public._liga_portugal_team_import_fix
order by fixed_name;

-- BLOCO 4 - Criar ou atualizar os clubes corretos preservando logos existentes
insert into public.teams (
  name, slug, short_name, code, primary_color, secondary_color,
  logo_url, country_id, country, data_source, sync_status, manual_override
)
select
  fixed_name,
  fixed_slug,
  fixed_short_name,
  fixed_code,
  fixed_primary_color,
  fixed_secondary_color,
  preserved_logo_url,
  fixed_country_id,
  fixed_country,
  'manual',
  'manual',
  true
from public._liga_portugal_team_import_fix
on conflict (slug) do update
set name = excluded.name,
    short_name = excluded.short_name,
    code = excluded.code,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_url = coalesce(nullif(public.teams.logo_url, ''), nullif(excluded.logo_url, '')),
    country_id = coalesce(public.teams.country_id, excluded.country_id),
    country = coalesce(nullif(public.teams.country, ''), excluded.country),
    manual_override = true,
    sync_status = 'manual';

-- BLOCO 5 - Criar mapa entre registo errado e clube correto
insert into public._liga_portugal_team_import_fix_map (
  malformed_team_id,
  canonical_team_id
)
select
  f.malformed_team_id,
  t.id
from public._liga_portugal_team_import_fix f
join public.teams t on t.slug = f.fixed_slug
where f.malformed_team_id <> t.id
on conflict (malformed_team_id) do update
set canonical_team_id = excluded.canonical_team_id;

select
  f.fixed_name,
  f.fixed_slug,
  m.malformed_team_id,
  m.canonical_team_id
from public._liga_portugal_team_import_fix f
left join public._liga_portugal_team_import_fix_map m
  on m.malformed_team_id = f.malformed_team_id
order by f.fixed_name;

-- BLOCO 6 - Migrar referencias principais antes de apagar registos errados
update public.matches m
set home_team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where m.home_team_id = map.malformed_team_id;

update public.matches m
set away_team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where m.away_team_id = map.malformed_team_id;

update public.players p
set team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where p.team_id = map.malformed_team_id;

update public.match_events e
set team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where e.team_id = map.malformed_team_id;

update public.goals g
set team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where g.team_id = map.malformed_team_id;

-- BLOCO 7 - Migrar participantes da epoca sem quebrar unique(season_id, team_id)
insert into public.season_teams (
  season_id, team_id, display_order, status, data_source, external_provider,
  external_id, last_synced_at, sync_status, manual_override, created_at, updated_at
)
select
  st.season_id,
  map.canonical_team_id,
  st.display_order,
  st.status,
  st.data_source,
  st.external_provider,
  st.external_id,
  st.last_synced_at,
  st.sync_status,
  st.manual_override,
  st.created_at,
  st.updated_at
from public.season_teams st
join public._liga_portugal_team_import_fix_map map
  on st.team_id = map.malformed_team_id
on conflict (season_id, team_id) do update
set display_order = least(public.season_teams.display_order, excluded.display_order),
    status = excluded.status,
    manual_override = public.season_teams.manual_override or excluded.manual_override,
    updated_at = greatest(public.season_teams.updated_at, excluded.updated_at);

delete from public.season_teams st
using public._liga_portugal_team_import_fix_map map
where st.team_id = map.malformed_team_id;

-- BLOCO 8 - Migrar classificacoes sem quebrar unique(standing_id, team_id)
delete from public.standing_rows sr
using public._liga_portugal_team_import_fix_map map
where sr.team_id = map.malformed_team_id
  and exists (
    select 1
    from public.standing_rows canonical_sr
    where canonical_sr.standing_id = sr.standing_id
      and canonical_sr.team_id = map.canonical_team_id
  );

update public.standing_rows sr
set team_id = map.canonical_team_id
from public._liga_portugal_team_import_fix_map map
where sr.team_id = map.malformed_team_id;

-- BLOCO 9 - Verificar se ainda ha referencias aos registos errados
select
  m.malformed_team_id,
  m.canonical_team_id,
  exists (select 1 from public.matches x where x.home_team_id = m.malformed_team_id) as used_home,
  exists (select 1 from public.matches x where x.away_team_id = m.malformed_team_id) as used_away,
  exists (select 1 from public.players x where x.team_id = m.malformed_team_id) as used_players,
  exists (select 1 from public.match_events x where x.team_id = m.malformed_team_id) as used_events,
  exists (select 1 from public.goals x where x.team_id = m.malformed_team_id) as used_goals,
  exists (select 1 from public.season_teams x where x.team_id = m.malformed_team_id) as used_seasons,
  exists (select 1 from public.standing_rows x where x.team_id = m.malformed_team_id) as used_standings
from public._liga_portugal_team_import_fix_map m
order by m.malformed_team_id;

-- BLOCO 10 - Apagar apenas registos errados ja migrados e sem referencias
delete from public.teams t
using public._liga_portugal_team_import_fix_map map
where t.id = map.malformed_team_id
  and not exists (select 1 from public.matches x where x.home_team_id = t.id)
  and not exists (select 1 from public.matches x where x.away_team_id = t.id)
  and not exists (select 1 from public.players x where x.team_id = t.id)
  and not exists (select 1 from public.match_events x where x.team_id = t.id)
  and not exists (select 1 from public.goals x where x.team_id = t.id)
  and not exists (select 1 from public.season_teams x where x.team_id = t.id)
  and not exists (select 1 from public.standing_rows x where x.team_id = t.id);

-- BLOCO 11 - Validacao final: idealmente deve devolver zero linhas
select
  id,
  name,
  slug,
  short_name,
  code,
  primary_color,
  secondary_color,
  logo_url
from public.teams
where name like '|%'
   or slug like '|%'
   or short_name like '|%'
   or name like '%| `%'
   or slug like '%| `%'
   or short_name like '%| `%'
order by created_at desc;

-- BLOCO 12 - Limpar tabelas auxiliares e recarregar cache PostgREST
drop table if exists public._liga_portugal_team_import_fix_map;
drop table if exists public._liga_portugal_team_import_fix;

notify pgrst, 'reload schema';
