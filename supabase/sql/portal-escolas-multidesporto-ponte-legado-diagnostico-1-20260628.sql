-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DIAGNOSTICO-1.
-- Diagnostico read-only da ponte entre modelo legado e modelo multidesporto.
-- Nao altera dados, schema, policies ou grants.

with required_tables as (
  select *
  from (
    values
      ('portal_competitions'),
      ('portal_stages'),
      ('portal_games'),
      ('portal_results'),
      ('portal_participants'),
      ('portal_competition_participants'),
      ('portal_modalities'),
      ('portal_modality_catalog'),
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
      ('portal_competitions', 'modality'),
      ('portal_competitions', 'format'),
      ('portal_competitions', 'portal_modality_id'),
      ('portal_stages', 'portal_competition_id'),
      ('portal_games', 'portal_stage_id'),
      ('portal_games', 'home_participant_id'),
      ('portal_games', 'away_participant_id'),
      ('portal_results', 'portal_game_id'),
      ('portal_results', 'home_score'),
      ('portal_results', 'away_score'),
      ('portal_content_submissions', 'portal_modality_id'),
      ('portal_content_submissions', 'portal_event_id'),
      ('portal_competition_formats', 'catalog_format_id'),
      ('portal_competition_formats', 'portal_competition_id'),
      ('portal_events', 'portal_stage_id'),
      ('portal_events', 'metadata'),
      ('portal_event_participants', 'portal_event_id'),
      ('portal_event_participants', 'portal_participant_id'),
      ('portal_event_participants', 'role'),
      ('portal_result_entries', 'portal_event_id'),
      ('portal_result_entries', 'portal_participant_id'),
      ('portal_rankings', 'portal_competition_id'),
      ('portal_ranking_entries', 'portal_ranking_id'),
      ('portal_ranking_entries', 'portal_participant_id')
  ) as expected(table_name, column_name)
),
competition_summary as (
  select
    c.id,
    c.name,
    c.slug,
    c.modality,
    c.format,
    c.portal_modality_id,
    count(distinct s.id) as stage_count,
    count(distinct g.id) as game_count,
    count(distinct r.id) as result_count,
    count(distinct case when r.home_score is not null and r.away_score is not null then r.id end) as complete_result_count,
    count(distinct cpf.id) as configured_format_count,
    case
      when count(distinct g.id) > 0 and count(distinct s.id) > 0 then 'matchdays_table'
      when c.format ilike '%jornada%' then 'matchdays_table'
      when c.format ilike '%liga%' then 'round_robin_league'
      when c.format ilike '%taça%' or c.format ilike '%taca%' or c.format ilike '%elimin%' then 'knockout_cup'
      when c.format ilike '%suíço%' or c.format ilike '%suico%' then 'swiss_tournament'
      when c.format ilike '%tempo%' then 'race_ranking'
      when c.format ilike '%marca%' then 'field_event_ranking'
      when c.format ilike '%pontos%' then 'points_ranking'
      else null
    end as suggested_format_code
  from public.portal_competitions c
  left join public.portal_stages s
    on s.portal_competition_id = c.id
  left join public.portal_games g
    on g.portal_competition_id = c.id
  left join public.portal_results r
    on r.portal_competition_id = c.id
  left join public.portal_competition_formats cpf
    on cpf.portal_competition_id = c.id
  group by c.id, c.name, c.slug, c.modality, c.format, c.portal_modality_id
),
checks as (
  select
    '01_required_tables' as check_group,
    table_name as object_name,
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
    '03_row_counts' as check_group,
    'portal_competitions' as object_name,
    'count' as object_type,
    'ok' as status,
    count(*)::text as details
  from public.portal_competitions

  union all

  select '03_row_counts', 'portal_stages', 'count', 'ok', count(*)::text
  from public.portal_stages

  union all

  select '03_row_counts', 'portal_games', 'count', 'ok', count(*)::text
  from public.portal_games

  union all

  select '03_row_counts', 'portal_results', 'count', 'ok', count(*)::text
  from public.portal_results

  union all

  select '03_row_counts', 'portal_competition_formats', 'count', 'ok', count(*)::text
  from public.portal_competition_formats

  union all

  select '03_row_counts', 'portal_events', 'count', 'ok', count(*)::text
  from public.portal_events

  union all

  select '03_row_counts', 'portal_event_participants', 'count', 'ok', count(*)::text
  from public.portal_event_participants

  union all

  select '03_row_counts', 'portal_result_entries', 'count', 'ok', count(*)::text
  from public.portal_result_entries

  union all

  select '03_row_counts', 'portal_rankings', 'count', 'ok', count(*)::text
  from public.portal_rankings

  union all

  select '03_row_counts', 'portal_ranking_entries', 'count', 'ok', count(*)::text
  from public.portal_ranking_entries

  union all

  select
    '04_format_catalog_required' as check_group,
    expected.code as object_name,
    'format_code' as object_type,
    case when f.code is null then 'missing' else 'ok' end as status,
    f.name as details
  from (
    values
      ('matchdays_table'),
      ('round_robin_league'),
      ('knockout_cup'),
      ('groups_then_knockout'),
      ('swiss_tournament'),
      ('event_meeting'),
      ('race_ranking'),
      ('field_event_ranking'),
      ('points_ranking'),
      ('multi_event_points')
  ) as expected(code)
  left join public.portal_competition_format_catalog f
    on lower(f.code) = expected.code

  union all

  select
    '05_competition_bridge_candidate' as check_group,
    cs.name as object_name,
    'competition' as object_type,
    case
      when cs.suggested_format_code is null then 'needs_decision'
      when f.code is null then 'missing_format_catalog'
      when cs.configured_format_count > 0 then 'already_has_configured_format'
      else 'candidate_ok'
    end as status,
    jsonb_build_object(
      'competition_id', cs.id,
      'slug', cs.slug,
      'legacy_modality', cs.modality,
      'legacy_format', cs.format,
      'portal_modality_id', cs.portal_modality_id,
      'stage_count', cs.stage_count,
      'game_count', cs.game_count,
      'result_count', cs.result_count,
      'complete_result_count', cs.complete_result_count,
      'configured_format_count', cs.configured_format_count,
      'suggested_format_code', cs.suggested_format_code,
      'suggested_format_name', f.name
    )::text as details
  from competition_summary cs
  left join public.portal_competition_format_catalog f
    on lower(f.code) = lower(cs.suggested_format_code)

  union all

  select
    '06_legacy_mapping_readiness' as check_group,
    cs.name as object_name,
    'competition' as object_type,
    case
      when cs.game_count = 0 then 'no_games_to_map'
      when cs.complete_result_count = 0 then 'games_without_complete_results'
      else 'ready_for_readonly_preview'
    end as status,
    jsonb_build_object(
      'stage_count', cs.stage_count,
      'game_count', cs.game_count,
      'result_count', cs.result_count,
      'complete_result_count', cs.complete_result_count,
      'future_event_type', 'match',
      'future_ranking_type', 'league_table'
    )::text as details
  from competition_summary cs
)
select *
from checks
order by check_group, object_name;
