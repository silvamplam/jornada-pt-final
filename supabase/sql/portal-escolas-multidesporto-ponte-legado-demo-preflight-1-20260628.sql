-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-PREFLIGHT-1.
-- Diagnóstico read-only antes de materializar a ponte legado -> multidesporto para dados demo.
-- Não altera dados, schema, policies ou grants.

with required_tables as (
  select *
  from (
    values
      ('portal_competitions'),
      ('portal_stages'),
      ('portal_games'),
      ('portal_results'),
      ('portal_participants'),
      ('portal_competition_format_catalog'),
      ('portal_competition_formats'),
      ('portal_events'),
      ('portal_event_participants'),
      ('portal_result_entries'),
      ('portal_rankings'),
      ('portal_ranking_entries')
  ) as expected(table_name)
),
required_columns as (
  select *
  from (
    values
      ('portal_competitions', 'id'),
      ('portal_competitions', 'portal_entity_id'),
      ('portal_competitions', 'portal_context_id'),
      ('portal_competitions', 'portal_modality_id'),
      ('portal_competitions', 'name'),
      ('portal_competitions', 'slug'),
      ('portal_competitions', 'modality'),
      ('portal_competitions', 'format'),
      ('portal_stages', 'id'),
      ('portal_stages', 'portal_competition_id'),
      ('portal_stages', 'name'),
      ('portal_stages', 'stage_order'),
      ('portal_games', 'id'),
      ('portal_games', 'portal_stage_id'),
      ('portal_games', 'home_participant_id'),
      ('portal_games', 'away_participant_id'),
      ('portal_games', 'scheduled_at'),
      ('portal_games', 'venue'),
      ('portal_games', 'status'),
      ('portal_results', 'id'),
      ('portal_results', 'portal_game_id'),
      ('portal_results', 'home_score'),
      ('portal_results', 'away_score'),
      ('portal_results', 'result_status'),
      ('portal_results', 'submitted_at'),
      ('portal_results', 'validated_at'),
      ('portal_participants', 'id'),
      ('portal_participants', 'name'),
      ('portal_competition_format_catalog', 'id'),
      ('portal_competition_format_catalog', 'code'),
      ('portal_competition_formats', 'code'),
      ('portal_events', 'slug'),
      ('portal_events', 'metadata'),
      ('portal_event_participants', 'portal_event_id'),
      ('portal_event_participants', 'portal_participant_id'),
      ('portal_result_entries', 'portal_event_id'),
      ('portal_result_entries', 'portal_participant_id'),
      ('portal_rankings', 'slug'),
      ('portal_ranking_entries', 'portal_ranking_id'),
      ('portal_ranking_entries', 'portal_participant_id')
  ) as expected(table_name, column_name)
),
demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
legacy_counts as (
  select
    dc.id as portal_competition_id,
    dc.name as competition_name,
    count(distinct s.id) as stage_count,
    count(distinct g.id) as game_count,
    count(distinct r.id) as result_count,
    count(distinct case when r.home_score is not null and r.away_score is not null then r.id end) as complete_result_count,
    count(distinct g.id) filter (where g.home_participant_id is not null and g.away_participant_id is not null) as games_with_two_participants
  from demo_competition dc
  left join public.portal_stages s
    on s.portal_competition_id = dc.id
  left join public.portal_games g
    on g.portal_stage_id = s.id
  left join public.portal_results r
    on r.portal_game_id = g.id
  group by dc.id, dc.name
),
materialized_counts as (
  select
    'portal_competition_formats' as object_name,
    count(*)::text as details
  from public.portal_competition_formats cpf
  join demo_competition dc
    on dc.id = cpf.portal_competition_id
  where lower(cpf.code) = 'legacy-demo-matchdays-table'

  union all

  select 'portal_events', count(*)::text
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select 'portal_event_participants', count(*)::text
  from public.portal_event_participants ep
  join public.portal_events e
    on e.id = ep.portal_event_id
  join demo_competition dc
    on dc.id = ep.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select 'portal_result_entries', count(*)::text
  from public.portal_result_entries re
  join public.portal_events e
    on e.id = re.portal_event_id
  join demo_competition dc
    on dc.id = re.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'

  union all

  select 'portal_rankings', count(*)::text
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'

  union all

  select 'portal_ranking_entries', count(*)::text
  from public.portal_ranking_entries pre
  join public.portal_rankings pr
    on pr.id = pre.portal_ranking_id
  join demo_competition dc
    on dc.id = pre.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
),
checks as (
  select
    '01_required_tables' as check_group,
    rt.table_name as object_name,
    'table' as object_type,
    case when t.table_name is null then 'missing' else 'ok' end as status,
    null::text as details
  from required_tables rt
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = rt.table_name

  union all

  select
    '02_required_columns' as check_group,
    rc.table_name || '.' || rc.column_name as object_name,
    'column' as object_type,
    case when c.column_name is null then 'missing' else 'ok' end as status,
    null::text as details
  from required_columns rc
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = rc.table_name
   and c.column_name = rc.column_name

  union all

  select
    '03_demo_competition' as check_group,
    'Torneio Demo Interturmas' as object_name,
    'competition' as object_type,
    case when exists (select 1 from demo_competition) then 'ok' else 'missing' end as status,
    coalesce((select jsonb_build_object('id', id, 'slug', slug, 'name', name, 'legacy_modality', modality, 'legacy_format', format)::text from demo_competition limit 1), null) as details

  union all

  select
    '04_format_catalog' as check_group,
    'matchdays_table' as object_name,
    'format_code' as object_type,
    case when exists (select 1 from public.portal_competition_format_catalog f where lower(f.code) = 'matchdays_table') then 'ok' else 'missing' end as status,
    (select f.name from public.portal_competition_format_catalog f where lower(f.code) = 'matchdays_table' limit 1) as details

  union all

  select
    '05_legacy_counts' as check_group,
    lc.competition_name as object_name,
    'legacy_summary' as object_type,
    case
      when lc.stage_count = 2 and lc.game_count = 3 and lc.complete_result_count = 2 and lc.games_with_two_participants = 3 then 'ok'
      else 'check_counts'
    end as status,
    jsonb_build_object(
      'stage_count', lc.stage_count,
      'game_count', lc.game_count,
      'result_count', lc.result_count,
      'complete_result_count', lc.complete_result_count,
      'games_with_two_participants', lc.games_with_two_participants
    )::text as details
  from legacy_counts lc

  union all

  select
    '06_existing_materialized_demo_rows' as check_group,
    mc.object_name,
    'count_before_apply' as object_type,
    case when mc.details = '0' then 'not_created_yet' else 'already_exists' end as status,
    mc.details
  from materialized_counts mc
)
select *
from checks
order by check_group, object_name;
