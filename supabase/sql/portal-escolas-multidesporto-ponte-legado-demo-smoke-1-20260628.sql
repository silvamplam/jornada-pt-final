-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-SMOKE-1.
-- Smoke test read-only depois de materializar dados demo.
-- Nao altera dados, schema, policies ou grants.
-- Correcao: usa count(distinct ...) para evitar multiplicacao por joins.

with demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
demo_events as (
  select e.*
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
),
demo_ranking as (
  select pr.*
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
),
event_rows as (
  select
    e.name as event_name,
    e.slug as event_slug,
    count(distinct ep.id) as participant_count,
    count(distinct re.id) as result_entry_count
  from demo_events e
  left join public.portal_event_participants ep
    on ep.portal_event_id = e.id
  left join public.portal_result_entries re
    on re.portal_event_id = e.id
  group by e.id, e.name, e.slug
),
ranking_rows as (
  select
    pre.rank,
    p.name as participant_name,
    pre.points,
    pre.played,
    pre.wins,
    pre.draws,
    pre.losses,
    pre.score_for,
    pre.score_against,
    pre.score_difference
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id
  join public.portal_participants p
    on p.id = pre.portal_participant_id
),
checks as (
  select
    '01_demo_format_readable' as check_group,
    cpf.name as object_name,
    'format' as object_type,
    case
      when cpf.status = 'active'
       and lower(cpf.code) = 'legacy-demo-matchdays-table'
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'code', cpf.code,
      'format_scope', cpf.format_scope,
      'event_model', cpf.event_model,
      'result_model', cpf.result_model,
      'ranking_model', cpf.ranking_model
    )::text as details
  from public.portal_competition_formats cpf
  join demo_competition dc
    on dc.id = cpf.portal_competition_id
  where lower(cpf.code) = 'legacy-demo-matchdays-table'

  union all

  select
    '02_events_readable' as check_group,
    er.event_name as object_name,
    'event' as object_type,
    case
      when er.participant_count = 2
       and er.result_entry_count in (0, 2)
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'slug', er.event_slug,
      'participant_count', er.participant_count,
      'result_entry_count', er.result_entry_count
    )::text as details
  from event_rows er

  union all

  select
    '03_ranking_readable' as check_group,
    rr.participant_name as object_name,
    'ranking_entry' as object_type,
    case
      when rr.rank is not null
       and rr.points is not null
       and rr.played is not null
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'rank', rr.rank,
      'points', rr.points,
      'played', rr.played,
      'wins', rr.wins,
      'draws', rr.draws,
      'losses', rr.losses,
      'score_for', rr.score_for,
      'score_against', rr.score_against,
      'score_difference', rr.score_difference
    )::text as details
  from ranking_rows rr

  union all

  select
    '04_expected_totals' as check_group,
    'materialized_demo_totals' as object_name,
    'summary' as object_type,
    case
      when (select count(*) from demo_events) = 3
       and (
         select count(*)
         from public.portal_event_participants ep
         join demo_events e on e.id = ep.portal_event_id
       ) = 6
       and (
         select count(*)
         from public.portal_result_entries re
         join demo_events e on e.id = re.portal_event_id
       ) = 4
       and (
         select count(*)
         from public.portal_ranking_entries pre
         join demo_ranking pr on pr.id = pre.portal_ranking_id
       ) = 4
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'events', (select count(*) from demo_events),
      'event_participants', (
        select count(*)
        from public.portal_event_participants ep
        join demo_events e on e.id = ep.portal_event_id
      ),
      'result_entries', (
        select count(*)
        from public.portal_result_entries re
        join demo_events e on e.id = re.portal_event_id
      ),
      'ranking_entries', (
        select count(*)
        from public.portal_ranking_entries pre
        join demo_ranking pr on pr.id = pre.portal_ranking_id
      )
    )::text as details
)
select *
from checks
order by check_group, object_name;
