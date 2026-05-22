-- Passo 5 - jogos Liga Portugal com TV

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
