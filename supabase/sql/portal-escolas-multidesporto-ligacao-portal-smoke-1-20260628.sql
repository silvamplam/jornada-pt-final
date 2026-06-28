-- Portal das Escolas - MULTIDESPORTO-LIGACAO-PORTAL-SMOKE-1.
-- Smoke test read-only para validar que os dados/grants necessários à página ligada ao Portal continuam disponíveis.
-- Não altera dados, schema, policies ou grants.

with target_grants as (
  select *
  from (
    values
      ('portal_competition_formats'),
      ('portal_events'),
      ('portal_event_participants'),
      ('portal_result_entries'),
      ('portal_rankings'),
      ('portal_ranking_entries')
  ) as t(table_name)
),
demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
demo_format as (
  select cpf.*
  from public.portal_competition_formats cpf
  join demo_competition dc
    on dc.id = cpf.portal_competition_id
  where lower(cpf.code) = 'legacy-demo-matchdays-table'
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
    e.id,
    e.name,
    count(distinct ep.id) as participant_count,
    count(distinct re.id) as result_entry_count
  from demo_events e
  left join public.portal_event_participants ep
    on ep.portal_event_id = e.id
  left join public.portal_result_entries re
    on re.portal_event_id = e.id
  group by e.id, e.name
),
ranking_rows as (
  select pre.*
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id
),
checks as (
  select
    '01_select_grants_authenticated' as check_group,
    tg.table_name as object_name,
    'grant' as object_type,
    case when exists (
      select 1
      from information_schema.role_table_grants g
      where g.table_schema = 'public'
        and g.table_name = tg.table_name
        and g.grantee = 'authenticated'
        and g.privilege_type = 'SELECT'
    ) then 'ok' else 'missing' end as status,
    null::text as details
  from target_grants tg

  union all

  select
    '02_demo_format' as check_group,
    'legacy-demo-matchdays-table' as object_name,
    'format' as object_type,
    case when count(*) = 1 then 'ok' else 'not_ok' end as status,
    count(*)::text as details
  from demo_format

  union all

  select
    '03_demo_events' as check_group,
    er.name as object_name,
    'event' as object_type,
    case
      when er.participant_count = 2
       and er.result_entry_count in (0, 2)
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'participant_count', er.participant_count,
      'result_entry_count', er.result_entry_count
    )::text as details
  from event_rows er

  union all

  select
    '04_demo_ranking' as check_group,
    'legacy-demo-league-table' as object_name,
    'ranking' as object_type,
    case when count(*) = 1 then 'ok' else 'not_ok' end as status,
    count(*)::text as details
  from demo_ranking

  union all

  select
    '05_demo_ranking_entries' as check_group,
    rr.id::text as object_name,
    'ranking_entry' as object_type,
    case
      when rr.rank is not null
       and rr.points is not null
       and rr.played is not null
       and rr.wins is not null
       and rr.draws is not null
       and rr.losses is not null
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
    '06_expected_totals' as check_group,
    'demo_multisport_linked_read_model' as object_name,
    'summary' as object_type,
    case
      when (select count(*) from demo_format) = 1
       and (select count(*) from demo_events) = 3
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
       and (select count(*) from demo_ranking) = 1
       and (select count(*) from ranking_rows) = 4
      then 'ok'
      else 'not_ok'
    end as status,
    jsonb_build_object(
      'formats', (select count(*) from demo_format),
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
      'rankings', (select count(*) from demo_ranking),
      'ranking_entries', (select count(*) from ranking_rows)
    )::text as details
)
select *
from checks
order by check_group, object_name;
