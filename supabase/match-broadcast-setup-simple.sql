-- Jornada.pt - jogos ligados aos canais TV, versao simples.
-- Usa este ficheiro no Supabase SQL Editor se a versao com "do $$" der erro.

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

create policy "Public read seasons" on public.seasons for select using (true);
create policy "Public read matchdays" on public.matchdays for select using (true);
create policy "Public read matches" on public.matches for select using (true);

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 1', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 1', 'sporttv 1'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 2', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 2', 'sporttv 2'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 3', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 3', 'sporttv 3'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'DAZN 1', 'DAZN', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg'
where not exists (select 1 from public.broadcast_channels where lower(name) = 'dazn 1');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg'
where lower(name) in ('sport tv 1', 'sporttv 1') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg'
where lower(name) in ('sport tv 2', 'sporttv 2') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg'
where lower(name) in ('sport tv 3', 'sporttv 3') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg'
where lower(name) = 'dazn 1' and (logo_url is null or logo_url = '');

insert into public.seasons (competition_id, label, starts_on, ends_on, is_current)
select id, '2024/25', '2024-08-01', '2025-05-31', true
from public.competitions c
where c.slug in ('premier-league', 'liga-portugal', 'la-liga')
and not exists (
  select 1 from public.seasons s
  where s.competition_id = c.id and s.label = '2024/25'
);

insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
select s.id, 4, 'Jornada 04', '2024-09-21', '2024-09-21', 'current', 'Jogos principais da jornada com transmissao definida.'
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
where c.slug = 'premier-league'
on conflict (season_id, number) do update
set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status;

insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
select s.id, 5, 'Jornada 05', '2024-09-28', '2024-09-30', 'scheduled', 'Agenda seguinte com canais associados.'
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
where c.slug = 'premier-league'
on conflict (season_id, number) do update
set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status;

insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
select s.id, 6, 'Jornada 06', '2024-09-22', '2024-10-12', 'current', 'Agenda portuguesa com canais associados.'
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
where c.slug = 'liga-portugal'
on conflict (season_id, number) do update
set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status;

insert into public.matchdays (season_id, number, label, starts_on, ends_on, status, context_summary)
select s.id, 4, 'Jornada 04', '2024-09-21', '2024-10-06', 'current', 'Agenda espanhola com canais associados.'
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
where c.slug = 'la-liga'
on conflict (season_id, number) do update
set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on, status = excluded.status;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-04-bre-whu', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-21 17:30:00+01'::timestamptz, 'Gtech Community Stadium', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 4
join public.teams home on home.slug = 'brentford'
join public.teams away on away.slug = 'west-ham'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-04-bha-ful', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-21 20:00:00+01'::timestamptz, 'Amex Stadium', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 4
join public.teams home on home.slug = 'brighton'
join public.teams away on away.slug = 'fulham'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 2' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-05-new-che', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-28 14:00:00+01'::timestamptz, 'St James Park', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 5
join public.teams home on home.slug = 'newcastle'
join public.teams away on away.slug = 'chelsea'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 3' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-05-ars-avl', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-28 16:30:00+01'::timestamptz, 'Emirates Stadium', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 5
join public.teams home on home.slug = 'arsenal'
join public.teams away on away.slug = 'aston-villa'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-05-mci-liv', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-29 16:30:00+01'::timestamptz, 'Etihad Stadium', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 5
join public.teams home on home.slug = 'manchester-city'
join public.teams away on away.slug = 'liverpool'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'pl-05-che-tot', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-30 20:00:00+01'::timestamptz, 'Stamford Bridge', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 5
join public.teams home on home.slug = 'chelsea'
join public.teams away on away.slug = 'tottenham'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 2' order by created_at limit 1) ch on true
where c.slug = 'premier-league'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'lp-06-fcp-bra', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-22 18:00:00+01'::timestamptz, 'Estadio do Dragao', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 6
join public.teams home on home.slug = 'fc-porto'
join public.teams away on away.slug = 'braga'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1) ch on true
where c.slug = 'liga-portugal'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'lp-06-ben-bra', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-28 18:00:00+01'::timestamptz, 'Estadio da Luz', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 6
join public.teams home on home.slug = 'benfica'
join public.teams away on away.slug = 'braga'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 2' order by created_at limit 1) ch on true
where c.slug = 'liga-portugal'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'lp-06-fcp-scp', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-29 20:30:00+01'::timestamptz, 'Estadio do Dragao', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 6
join public.teams home on home.slug = 'fc-porto'
join public.teams away on away.slug = 'sporting'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 1' order by created_at limit 1) ch on true
where c.slug = 'liga-portugal'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'lp-06-bra-ben', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-10-05 18:00:00+01'::timestamptz, 'Estadio Municipal de Braga', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 6
join public.teams home on home.slug = 'braga'
join public.teams away on away.slug = 'benfica'
join lateral (select id from public.broadcast_channels where lower(name) = 'sport tv 3' order by created_at limit 1) ch on true
where c.slug = 'liga-portugal'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'll-04-bar-atm', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-21 20:00:00+01'::timestamptz, 'Montjuic', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 4
join public.teams home on home.slug = 'barcelona'
join public.teams away on away.slug = 'atletico-madrid'
join lateral (select id from public.broadcast_channels where lower(name) = 'dazn 1' order by created_at limit 1) ch on true
where c.slug = 'la-liga'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'll-04-atm-sev', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-22 17:30:00+01'::timestamptz, 'Metropolitano', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 4
join public.teams home on home.slug = 'atletico-madrid'
join public.teams away on away.slug = 'sevilla'
join lateral (select id from public.broadcast_channels where lower(name) = 'dazn 1' order by created_at limit 1) ch on true
where c.slug = 'la-liga'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;

insert into public.matches (source_key, competition_id, season_id, matchday_id, home_team_id, away_team_id, status, kickoff_at, venue, broadcast_channel_id)
select 'll-04-rma-bar', c.id, s.id, md.id, home.id, away.id, 'scheduled', '2024-09-28 20:00:00+01'::timestamptz, 'Santiago Bernabeu', ch.id
from public.competitions c
join public.seasons s on s.competition_id = c.id and s.label = '2024/25'
join public.matchdays md on md.season_id = s.id and md.number = 4
join public.teams home on home.slug = 'real-madrid'
join public.teams away on away.slug = 'barcelona'
join lateral (select id from public.broadcast_channels where lower(name) = 'dazn 1' order by created_at limit 1) ch on true
where c.slug = 'la-liga'
on conflict (source_key) do update set broadcast_channel_id = excluded.broadcast_channel_id, kickoff_at = excluded.kickoff_at, venue = excluded.venue;
