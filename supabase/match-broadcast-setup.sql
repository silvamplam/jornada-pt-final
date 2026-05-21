-- Jornada.pt - ligar canais TV aos jogos.
-- Executar no Supabase SQL Editor.
-- Cria a chave de importacao dos jogos, garante permissoes e coloca jogos de exemplo
-- ja associados aos canais TV.

alter table public.matches add column if not exists source_key text;
alter table public.matches add column if not exists broadcast_channel_id uuid references public.broadcast_channels(id) on delete set null;
create unique index if not exists matches_source_key_unique on public.matches (source_key);

grant usage on schema public to anon;
grant select on public.competitions to anon;
grant select on public.seasons to anon;
grant select on public.matchdays to anon;
grant select on public.teams to anon;
grant select on public.broadcast_channels to anon;
grant select on public.matches to anon;

grant usage on schema public to service_role;
grant select on public.competitions to service_role;
grant select on public.seasons to service_role;
grant select on public.matchdays to service_role;
grant select on public.teams to service_role;
grant select on public.broadcast_channels to service_role;
grant select, insert, update, delete on public.matches to service_role;

alter table public.seasons enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Public read seasons" on public.seasons;
drop policy if exists "Public read matchdays" on public.matchdays;
drop policy if exists "Public read matches" on public.matches;

create policy "Public read seasons"
on public.seasons
for select
using (true);

create policy "Public read matchdays"
on public.matchdays
for select
using (true);

create policy "Public read matches"
on public.matches
for select
using (true);

do $$
declare
  premier_id uuid;
  liga_id uuid;
  laliga_id uuid;
  premier_season_id uuid;
  liga_season_id uuid;
  laliga_season_id uuid;
  pl_md04_id uuid;
  pl_md05_id uuid;
  lp_md06_id uuid;
  ll_md04_id uuid;
  sport_tv_1_id uuid;
  sport_tv_2_id uuid;
  sport_tv_3_id uuid;
  dazn_1_id uuid;
begin
  select id into premier_id from public.competitions where slug = 'premier-league' limit 1;
  select id into liga_id from public.competitions where slug = 'liga-portugal' limit 1;
  select id into laliga_id from public.competitions where slug = 'la-liga' limit 1;

  select id into sport_tv_1_id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1;
  if sport_tv_1_id is null then
    insert into public.broadcast_channels (name, platform, country, logo_url)
    values ('Sport TV 1', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg')
    returning id into sport_tv_1_id;
  end if;
  update public.broadcast_channels
  set logo_url = coalesce(nullif(logo_url, ''), 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg')
  where lower(name) in ('sport tv 1', 'sporttv 1');

  select id into sport_tv_2_id from public.broadcast_channels where lower(name) = 'sport tv 2' order by created_at limit 1;
  if sport_tv_2_id is null then
    insert into public.broadcast_channels (name, platform, country, logo_url)
    values ('Sport TV 2', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg')
    returning id into sport_tv_2_id;
  end if;
  update public.broadcast_channels
  set logo_url = coalesce(nullif(logo_url, ''), 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg')
  where lower(name) in ('sport tv 2', 'sporttv 2');

  select id into sport_tv_3_id from public.broadcast_channels where lower(name) = 'sport tv 3' order by created_at limit 1;
  if sport_tv_3_id is null then
    insert into public.broadcast_channels (name, platform, country, logo_url)
    values ('Sport TV 3', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg')
    returning id into sport_tv_3_id;
  end if;
  update public.broadcast_channels
  set logo_url = coalesce(nullif(logo_url, ''), 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg')
  where lower(name) in ('sport tv 3', 'sporttv 3');

  select id into dazn_1_id from public.broadcast_channels where lower(name) = 'dazn 1' order by created_at limit 1;
  if dazn_1_id is null then
    insert into public.broadcast_channels (name, platform, country, logo_url)
    values ('DAZN 1', 'DAZN', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg')
    returning id into dazn_1_id;
  end if;
  update public.broadcast_channels
  set logo_url = coalesce(nullif(logo_url, ''), 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg')
  where lower(name) = 'dazn 1';

  if premier_id is not null then
    select id into premier_season_id from public.seasons where competition_id = premier_id and label = '2024/25' order by created_at limit 1;
    if premier_season_id is null then
      insert into public.seasons (competition_id, label, starts_on, ends_on, is_current)
      values (premier_id, '2024/25', '2024-08-01', '2025-05-31', true)
      returning id into premier_season_id;
    end if;

    insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
    values (premier_season_id, 4, 'Jornada 04', '2024-09-21', '2024-09-21', 'current', 'Jogos principais da jornada com transmissao definida.')
    on conflict (season_id, number) do update
    set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status
    returning id into pl_md04_id;

    insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
    values (premier_season_id, 5, 'Jornada 05', '2024-09-28', '2024-09-30', 'scheduled', 'Agenda seguinte com canais associados.')
    on conflict (season_id, number) do update
    set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status
    returning id into pl_md05_id;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-04-bre-whu', premier_id, premier_season_id, pl_md04_id, home.id, away.id, 'scheduled', '2024-09-21 17:30:00+01'::timestamptz, 'Gtech Community Stadium', sport_tv_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'brentford' and away.slug = 'west-ham'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-04-bha-ful', premier_id, premier_season_id, pl_md04_id, home.id, away.id, 'scheduled', '2024-09-21 20:00:00+01'::timestamptz, 'Amex Stadium', sport_tv_2_id
    from public.teams home cross join public.teams away
    where home.slug = 'brighton' and away.slug = 'fulham'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-05-new-che', premier_id, premier_season_id, pl_md05_id, home.id, away.id, 'scheduled', '2024-09-28 14:00:00+01'::timestamptz, 'St James Park', sport_tv_3_id
    from public.teams home cross join public.teams away
    where home.slug = 'newcastle' and away.slug = 'chelsea'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-05-ars-avl', premier_id, premier_season_id, pl_md05_id, home.id, away.id, 'scheduled', '2024-09-28 16:30:00+01'::timestamptz, 'Emirates Stadium', sport_tv_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'arsenal' and away.slug = 'aston-villa'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-05-mci-liv', premier_id, premier_season_id, pl_md05_id, home.id, away.id, 'scheduled', '2024-09-29 16:30:00+01'::timestamptz, 'Etihad Stadium', sport_tv_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'manchester-city' and away.slug = 'liverpool'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'pl-05-che-tot', premier_id, premier_season_id, pl_md05_id, home.id, away.id, 'scheduled', '2024-09-30 20:00:00+01'::timestamptz, 'Stamford Bridge', sport_tv_2_id
    from public.teams home cross join public.teams away
    where home.slug = 'chelsea' and away.slug = 'tottenham'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;
  end if;

  if liga_id is not null then
    select id into liga_season_id from public.seasons where competition_id = liga_id and label = '2024/25' order by created_at limit 1;
    if liga_season_id is null then
      insert into public.seasons (competition_id, label, starts_on, ends_on, is_current)
      values (liga_id, '2024/25', '2024-08-01', '2025-05-31', true)
      returning id into liga_season_id;
    end if;

    insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
    values (liga_season_id, 6, 'Jornada 06', '2024-09-22', '2024-10-12', 'current', 'Agenda portuguesa com canais associados.')
    on conflict (season_id, number) do update
    set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status
    returning id into lp_md06_id;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'lp-06-fcp-bra', liga_id, liga_season_id, lp_md06_id, home.id, away.id, 'scheduled', '2024-09-22 18:00:00+01'::timestamptz, 'Estadio do Dragao', sport_tv_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'fc-porto' and away.slug = 'braga'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'lp-06-ben-bra', liga_id, liga_season_id, lp_md06_id, home.id, away.id, 'scheduled', '2024-09-28 18:00:00+01'::timestamptz, 'Estadio da Luz', sport_tv_2_id
    from public.teams home cross join public.teams away
    where home.slug = 'benfica' and away.slug = 'braga'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'lp-06-fcp-scp', liga_id, liga_season_id, lp_md06_id, home.id, away.id, 'scheduled', '2024-09-29 20:30:00+01'::timestamptz, 'Estadio do Dragao', sport_tv_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'fc-porto' and away.slug = 'sporting'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'lp-06-bra-ben', liga_id, liga_season_id, lp_md06_id, home.id, away.id, 'scheduled', '2024-10-05 18:00:00+01'::timestamptz, 'Estadio Municipal de Braga', sport_tv_3_id
    from public.teams home cross join public.teams away
    where home.slug = 'braga' and away.slug = 'benfica'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;
  end if;

  if laliga_id is not null then
    select id into laliga_season_id from public.seasons where competition_id = laliga_id and label = '2024/25' order by created_at limit 1;
    if laliga_season_id is null then
      insert into public.seasons (competition_id, label, starts_on, ends_on, is_current)
      values (laliga_id, '2024/25', '2024-08-01', '2025-05-31', true)
      returning id into laliga_season_id;
    end if;

    insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
    values (laliga_season_id, 4, 'Jornada 04', '2024-09-21', '2024-10-06', 'current', 'Agenda espanhola com canais associados.')
    on conflict (season_id, number) do update
    set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status
    returning id into ll_md04_id;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'll-04-bar-atm', laliga_id, laliga_season_id, ll_md04_id, home.id, away.id, 'scheduled', '2024-09-21 20:00:00+01'::timestamptz, 'Montjuic', dazn_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'barcelona' and away.slug = 'atletico-madrid'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'll-04-atm-sev', laliga_id, laliga_season_id, ll_md04_id, home.id, away.id, 'scheduled', '2024-09-22 17:30:00+01'::timestamptz, 'Metropolitano', dazn_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'atletico-madrid' and away.slug = 'sevilla'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

    insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
    select 'll-04-rma-bar', laliga_id, laliga_season_id, ll_md04_id, home.id, away.id, 'scheduled', '2024-09-28 20:00:00+01'::timestamptz, 'Santiago Bernabeu', dazn_1_id
    from public.teams home cross join public.teams away
    where home.slug = 'real-madrid' and away.slug = 'barcelona'
    on conflict (source_key) do update
    set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;
  end if;
end $$;
