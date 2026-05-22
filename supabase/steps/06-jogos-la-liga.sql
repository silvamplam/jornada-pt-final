-- Passo 6 - jogos La Liga com TV

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
