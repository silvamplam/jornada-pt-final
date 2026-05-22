-- Passo 3 - epocas e jornadas

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
