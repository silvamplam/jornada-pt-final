-- PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1
-- Preflight read-only.
-- Não altera dados, schema, policies, grants ou funções.

with demo_competition as (
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
demo_ranking as (
  select pr.*
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
),
demo_events as (
  select e.*
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
),
required_tables as (
  select *
  from (values
    ('portal_competitions'),
    ('portal_competition_formats'),
    ('portal_events'),
    ('portal_event_participants'),
    ('portal_result_entries'),
    ('portal_rankings'),
    ('portal_ranking_entries'),
    ('portal_participants')
  ) as t(table_name)
),
required_columns as (
  select *
  from (values
    ('portal_rankings', 'id'),
    ('portal_rankings', 'portal_competition_id'),
    ('portal_rankings', 'portal_format_id'),
    ('portal_rankings', 'slug'),
    ('portal_rankings', 'calculation_mode'),
    ('portal_rankings', 'source'),
    ('portal_rankings', 'generated_at'),
    ('portal_rankings', 'rules_snapshot'),
    ('portal_ranking_entries', 'portal_ranking_id'),
    ('portal_ranking_entries', 'portal_participant_id'),
    ('portal_ranking_entries', 'rank'),
    ('portal_ranking_entries', 'position_label'),
    ('portal_ranking_entries', 'points'),
    ('portal_ranking_entries', 'played'),
    ('portal_ranking_entries', 'wins'),
    ('portal_ranking_entries', 'draws'),
    ('portal_ranking_entries', 'losses'),
    ('portal_ranking_entries', 'score_for'),
    ('portal_ranking_entries', 'score_against'),
    ('portal_ranking_entries', 'score_difference'),
    ('portal_ranking_entries', 'tie_breaker_values'),
    ('portal_result_entries', 'portal_event_id'),
    ('portal_result_entries', 'portal_participant_id'),
    ('portal_result_entries', 'score_numeric'),
    ('portal_result_entries', 'score_text'),
    ('portal_result_entries', 'points'),
    ('portal_result_entries', 'outcome'),
    ('portal_result_entries', 'result_status')
  ) as c(table_name, column_name)
),
required_indexes as (
  select *
  from (values
    ('portal_rankings_slug_unique_idx'),
    ('portal_ranking_entries_participant_unique_idx'),
    ('portal_result_entries_participant_unique_idx')
  ) as i(index_name)
),
participant_pool as (
  select distinct
    ep.portal_entity_id,
    ep.portal_context_id,
    ep.portal_modality_id,
    ep.portal_competition_id,
    ep.portal_participant_id
  from public.portal_event_participants ep
  join demo_events e
    on e.id = ep.portal_event_id
),
eligible_result_entries as (
  select
    re.id,
    re.portal_entity_id,
    re.portal_context_id,
    re.portal_modality_id,
    re.portal_competition_id,
    re.portal_event_id,
    re.portal_participant_id,
    re.score_numeric,
    re.points,
    re.outcome,
    re.result_status
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id
  where re.result_status in ('submitted', 'validated')
    and re.score_numeric is not null
),
event_result_counts as (
  select
    ere.portal_event_id,
    count(*) as numeric_result_entries
  from eligible_result_entries ere
  group by ere.portal_event_id
),
computed_event_rows as (
  select
    ere.portal_entity_id,
    ere.portal_context_id,
    ere.portal_modality_id,
    ere.portal_competition_id,
    ere.portal_event_id,
    ere.portal_participant_id,
    ere.score_numeric as score_for,
    opponent.score_numeric as score_against,
    coalesce(
      ere.points,
      case
        when ere.score_numeric > opponent.score_numeric then 3
        when ere.score_numeric = opponent.score_numeric then 1
        else 0
      end
    ) as points,
    coalesce(
      ere.outcome,
      case
        when ere.score_numeric > opponent.score_numeric then 'win'
        when ere.score_numeric = opponent.score_numeric then 'draw'
        else 'loss'
      end
    ) as outcome
  from eligible_result_entries ere
  join event_result_counts erc
    on erc.portal_event_id = ere.portal_event_id
   and erc.numeric_result_entries = 2
  join eligible_result_entries opponent
    on opponent.portal_event_id = ere.portal_event_id
   and opponent.portal_participant_id <> ere.portal_participant_id
),
ranking_base as (
  select
    pp.portal_entity_id,
    pp.portal_context_id,
    pp.portal_modality_id,
    pp.portal_competition_id,
    pp.portal_participant_id,
    count(cer.portal_event_id)::integer as played,
    count(cer.portal_event_id) filter (where cer.outcome = 'win')::integer as wins,
    count(cer.portal_event_id) filter (where cer.outcome = 'draw')::integer as draws,
    count(cer.portal_event_id) filter (where cer.outcome = 'loss')::integer as losses,
    coalesce(sum(cer.points), 0)::numeric as points,
    coalesce(sum(cer.score_for), 0)::numeric as score_for,
    coalesce(sum(cer.score_against), 0)::numeric as score_against,
    coalesce(sum(cer.score_for - cer.score_against), 0)::numeric as score_difference
  from participant_pool pp
  left join computed_event_rows cer
    on cer.portal_competition_id = pp.portal_competition_id
   and cer.portal_participant_id = pp.portal_participant_id
  group by
    pp.portal_entity_id,
    pp.portal_context_id,
    pp.portal_modality_id,
    pp.portal_competition_id,
    pp.portal_participant_id
),
computed_ranking as (
  select
    (rank() over (
      partition by rb.portal_competition_id
      order by rb.points desc, rb.score_difference desc, rb.score_for desc, rb.portal_participant_id asc
    ))::integer as proposed_rank,
    rb.*
  from ranking_base rb
),
stored_ranking as (
  select
    pre.portal_participant_id,
    pre.rank as stored_rank,
    pre.position_label as stored_position_label,
    pre.points as stored_points,
    pre.played as stored_played,
    pre.wins as stored_wins,
    pre.draws as stored_draws,
    pre.losses as stored_losses,
    pre.score_for as stored_score_for,
    pre.score_against as stored_score_against,
    pre.score_difference as stored_score_difference,
    pre.status as stored_status
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id
),
ranking_comparison as (
  select
    coalesce(cr.portal_participant_id, sr.portal_participant_id) as portal_participant_id,
    p.name as participant_name,
    cr.proposed_rank,
    cr.points,
    cr.played,
    cr.wins,
    cr.draws,
    cr.losses,
    cr.score_for,
    cr.score_against,
    cr.score_difference,
    sr.stored_rank,
    sr.stored_position_label,
    sr.stored_points,
    sr.stored_played,
    sr.stored_wins,
    sr.stored_draws,
    sr.stored_losses,
    sr.stored_score_for,
    sr.stored_score_against,
    sr.stored_score_difference,
    sr.stored_status,
    case
      when sr.portal_participant_id is null then 'missing_stored_ranking_entry'
      when cr.portal_participant_id is null then 'stored_extra_entry'
      when sr.stored_rank is distinct from cr.proposed_rank then 'mismatch'
      when sr.stored_points is distinct from cr.points then 'mismatch'
      when sr.stored_played is distinct from cr.played then 'mismatch'
      when sr.stored_wins is distinct from cr.wins then 'mismatch'
      when sr.stored_draws is distinct from cr.draws then 'mismatch'
      when sr.stored_losses is distinct from cr.losses then 'mismatch'
      when sr.stored_score_for is distinct from cr.score_for then 'mismatch'
      when sr.stored_score_against is distinct from cr.score_against then 'mismatch'
      when sr.stored_score_difference is distinct from cr.score_difference then 'mismatch'
      else 'ok'
    end as comparison_status
  from computed_ranking cr
  full join stored_ranking sr
    on sr.portal_participant_id = cr.portal_participant_id
  left join public.portal_participants p
    on p.id = coalesce(cr.portal_participant_id, sr.portal_participant_id)
),
checks as (
  select
    '01_required_tables' as check_group,
    rt.table_name as object_name,
    'table' as object_type,
    case when to_regclass('public.' || rt.table_name) is not null then 'ok' else 'missing' end as status,
    null::text as details
  from required_tables rt

  union all

  select
    '02_required_columns' as check_group,
    rc.table_name || '.' || rc.column_name as object_name,
    'column' as object_type,
    case when c.column_name is not null then 'ok' else 'missing' end as status,
    null::text as details
  from required_columns rc
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = rc.table_name
   and c.column_name = rc.column_name

  union all

  select
    '03_required_indexes' as check_group,
    ri.index_name as object_name,
    'index' as object_type,
    case when to_regclass('public.' || ri.index_name) is not null then 'ok' else 'missing' end as status,
    null::text as details
  from required_indexes ri

  union all

  select
    '04_existing_functions' as check_group,
    'portal_upsert_result_entry' as object_name,
    'function' as object_type,
    case
      when to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)') is not null then 'ok'
      else 'missing'
    end as status,
    null::text as details

  union all

  select
    '04_existing_functions' as check_group,
    'portal_recalculate_demo_competition_ranking' as object_name,
    'function' as object_type,
    case
      when to_regprocedure('public.portal_recalculate_demo_competition_ranking()') is not null then 'already_exists'
      else 'missing_expected'
    end as status,
    'Informativo: esta função ainda não devia existir antes desta fase.' as details

  union all

  select
    '05_demo_counts' as check_group,
    'demo_competition' as object_name,
    'count' as object_type,
    case when count(*) = 1 then 'ok' else 'not_ok' end as status,
    count(*)::text as details
  from demo_competition

  union all

  select
    '05_demo_counts',
    'demo_format',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_format

  union all

  select
    '05_demo_counts',
    'demo_ranking',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_ranking

  union all

  select
    '05_demo_counts',
    'demo_events',
    'count',
    case when count(*) = 3 then 'ok' else 'check_count' end,
    count(*)::text
  from demo_events

  union all

  select
    '05_demo_counts',
    'demo_event_participants',
    'count',
    case when count(*) = 6 then 'ok' else 'check_count' end,
    count(*)::text
  from public.portal_event_participants ep
  join demo_events e
    on e.id = ep.portal_event_id

  union all

  select
    '05_demo_counts',
    'demo_result_entries',
    'count',
    case when count(*) >= 4 then 'ok' else 'not_ok' end,
    count(*)::text
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id

  union all

  select
    '05_demo_counts',
    'demo_ranking_entries',
    'count',
    case when count(*) = 4 then 'ok' else 'check_count' end,
    count(*)::text
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id

  union all

  select
    '06_format_rules',
    coalesce(df.code, 'sem-codigo'),
    'format',
    'info',
    jsonb_build_object(
      'ranking_model', df.ranking_model,
      'scoring_rules', df.scoring_rules,
      'tie_breakers', df.tie_breakers
    )::text
  from demo_format df

  union all

  select
    '07_current_result_entries',
    e.name || ' / ' || coalesce(p.name, re.portal_participant_id::text),
    'result_entry',
    'info',
    jsonb_build_object(
      'score_numeric', re.score_numeric,
      'score_text', re.score_text,
      'points', re.points,
      'outcome', re.outcome,
      'result_status', re.result_status
    )::text
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id
  left join public.portal_participants p
    on p.id = re.portal_participant_id

  union all

  select
    '08_computed_vs_stored_ranking',
    coalesce(rc.participant_name, rc.portal_participant_id::text),
    'ranking_entry',
    rc.comparison_status,
    jsonb_build_object(
      'computed', jsonb_build_object(
        'rank', rc.proposed_rank,
        'points', rc.points,
        'played', rc.played,
        'wins', rc.wins,
        'draws', rc.draws,
        'losses', rc.losses,
        'score_for', rc.score_for,
        'score_against', rc.score_against,
        'score_difference', rc.score_difference
      ),
      'stored', jsonb_build_object(
        'rank', rc.stored_rank,
        'position_label', rc.stored_position_label,
        'points', rc.stored_points,
        'played', rc.stored_played,
        'wins', rc.stored_wins,
        'draws', rc.stored_draws,
        'losses', rc.stored_losses,
        'score_for', rc.stored_score_for,
        'score_against', rc.stored_score_against,
        'score_difference', rc.stored_score_difference,
        'status', rc.stored_status
      )
    )::text
  from ranking_comparison rc

  union all

  select
    '09_summary',
    'ranking_matches_portal_result_entries',
    'summary',
    case
      when exists (
        select 1
        from ranking_comparison rc
        where rc.comparison_status <> 'ok'
      )
      then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'ok_rows', (
        select count(*)
        from ranking_comparison rc
        where rc.comparison_status = 'ok'
      ),
      'problem_rows', (
        select count(*)
        from ranking_comparison rc
        where rc.comparison_status <> 'ok'
      ),
      'computed_rows', (
        select count(*)
        from computed_ranking
      ),
      'stored_rows', (
        select count(*)
        from stored_ranking
      )
    )::text
)
select *
from checks
order by check_group, object_name;
