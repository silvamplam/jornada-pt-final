-- Passo 4 - jogos Premier League com TV

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
