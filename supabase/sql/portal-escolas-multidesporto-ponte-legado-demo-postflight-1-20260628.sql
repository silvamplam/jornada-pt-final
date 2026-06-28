-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-POSTFLIGHT-1.
-- Verificação read-only depois de materializar a ponte demo.
-- Não altera dados, schema, policies ou grants.

with demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
target_counts as (
  select
    'portal_competition_formats' as object_name,
    count(*) as actual_count,
    1 as expected_count
  from public.portal_competition_formats cpf
  join demo_competition dc
    on dc.id = cpf.portal_competition_id
  where lower(cpf.code) = 'legacy-demo-matchdays-table'

  union all

  select
    'portal_events',
    count(*),
    3
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select
    'portal_event_participants',
    count(*),
    6
  from public.portal_event_participants ep
  join public.portal_events e
    on e.id = ep.portal_event_id
  join demo_competition dc
    on dc.id = ep.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select
    'portal_result_entries',
    count(*),
    4
  from public.portal_result_entries re
  join public.portal_events e
    on e.id = re.portal_event_id
  join demo_competition dc
    on dc.id = re.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select
    'portal_rankings',
    count(*),
    1
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'

  union all

  select
    'portal_ranking_entries',
    count(*),
    4
  from public.portal_ranking_entries pre
  join public.portal_rankings pr
    on pr.id = pre.portal_ranking_id
  join demo_competition dc
    on dc.id = pre.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
),
integrity_checks as (
  select
    'events_without_2_participants' as object_name,
    count(*) as actual_count,
    0 as expected_count
  from (
    select e.id, count(ep.id) as participant_count
    from public.portal_events e
    join demo_competition dc
      on dc.id = e.portal_competition_id
    left join public.portal_event_participants ep
      on ep.portal_event_id = e.id
    where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
    group by e.id
    having count(ep.id) <> 2
  ) bad

  union all

  select
    'result_entries_without_event_participant',
    count(*),
    0
  from public.portal_result_entries re
  join demo_competition dc
    on dc.id = re.portal_competition_id
  join public.portal_events e
    on e.id = re.portal_event_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
    and re.portal_event_participant_id is null

  union all

  select
    'ranking_entries_without_rank',
    count(*),
    0
  from public.portal_ranking_entries pre
  join public.portal_rankings pr
    on pr.id = pre.portal_ranking_id
  join demo_competition dc
    on dc.id = pre.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
    and pre.rank is null
),
legacy_counts as (
  select
    'legacy_portal_games_still_present' as object_name,
    count(*) as actual_count,
    3 as expected_count
  from public.portal_games g
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join demo_competition dc
    on dc.id = s.portal_competition_id

  union all

  select
    'legacy_portal_results_still_present',
    count(*),
    2
  from public.portal_results r
  join public.portal_games g
    on g.id = r.portal_game_id
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join demo_competition dc
    on dc.id = s.portal_competition_id
),
checks as (
  select
    '01_target_counts' as check_group,
    tc.object_name,
    'count' as object_type,
    case when tc.actual_count = tc.expected_count then 'ok' else 'not_ok' end as status,
    jsonb_build_object('actual', tc.actual_count, 'expected', tc.expected_count)::text as details
  from target_counts tc

  union all

  select
    '02_integrity_checks' as check_group,
    ic.object_name,
    'integrity' as object_type,
    case when ic.actual_count = ic.expected_count then 'ok' else 'not_ok' end as status,
    jsonb_build_object('actual', ic.actual_count, 'expected', ic.expected_count)::text as details
  from integrity_checks ic

  union all

  select
    '03_legacy_preserved' as check_group,
    lc.object_name,
    'legacy_count' as object_type,
    case when lc.actual_count = lc.expected_count then 'ok' else 'check_counts' end as status,
    jsonb_build_object('actual', lc.actual_count, 'expected', lc.expected_count)::text as details
  from legacy_counts lc
)
select *
from checks
order by check_group, object_name;
