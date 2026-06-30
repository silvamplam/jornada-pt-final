-- PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1
-- Postflight read-only.
-- Confirma que o ranking guardado em portal_ranking_entries
-- corresponde ao ranking calculado a partir de portal_result_entries.
-- Não altera dados, schema, policies, grants ou funções.

with demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
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
      order by
        rb.points desc,
        rb.score_difference desc,
        rb.score_for desc,
        rb.portal_participant_id asc
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
      when sr.stored_position_label is distinct from cr.proposed_rank::text then 'mismatch'
      when sr.stored_points is distinct from cr.points then 'mismatch'
      when sr.stored_played is distinct from cr.played then 'mismatch'
      when sr.stored_wins is distinct from cr.wins then 'mismatch'
      when sr.stored_draws is distinct from cr.draws then 'mismatch'
      when sr.stored_losses is distinct from cr.losses then 'mismatch'
      when sr.stored_score_for is distinct from cr.score_for then 'mismatch'
      when sr.stored_score_against is distinct from cr.score_against then 'mismatch'
      when sr.stored_score_difference is distinct from cr.score_difference then 'mismatch'
      when sr.stored_status is distinct from 'active' then 'mismatch'
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
    '01_function' as check_group,
    'portal_recalculate_demo_competition_ranking' as object_name,
    'function' as object_type,
    case
      when to_regprocedure('public.portal_recalculate_demo_competition_ranking()') is not null then 'ok'
      else 'missing'
    end as status,
    null::text as details

  union all

  select
    '02_ranking_header',
    'legacy-demo-league-table',
    'ranking',
    case
      when count(*) = 1
       and min(calculation_mode) = 'derived_from_result_entries'
       and min(source) = 'portal_result_entries_demo_recalculation'
       and min(status) = 'active'
      then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'count', count(*),
      'calculation_mode', min(calculation_mode),
      'source', min(source),
      'status', min(status),
      'generated_at', min(generated_at)
    )::text
  from demo_ranking

  union all

  select
    '03_counts',
    'computed_ranking_rows',
    'count',
    case when count(*) = 6 then 'ok' else 'not_ok' end,
    count(*)::text
  from computed_ranking

  union all

  select
    '03_counts',
    'stored_ranking_rows',
    'count',
    case when count(*) = 6 then 'ok' else 'not_ok' end,
    count(*)::text
  from stored_ranking

  union all

  select
    '04_computed_vs_stored',
    coalesce(participant_name, portal_participant_id::text),
    'ranking_entry',
    comparison_status,
    jsonb_build_object(
      'computed', jsonb_build_object(
        'rank', proposed_rank,
        'points', points,
        'played', played,
        'wins', wins,
        'draws', draws,
        'losses', losses,
        'score_for', score_for,
        'score_against', score_against,
        'score_difference', score_difference
      ),
      'stored', jsonb_build_object(
        'rank', stored_rank,
        'position_label', stored_position_label,
        'points', stored_points,
        'played', stored_played,
        'wins', stored_wins,
        'draws', stored_draws,
        'losses', stored_losses,
        'score_for', stored_score_for,
        'score_against', stored_score_against,
        'score_difference', stored_score_difference,
        'status', stored_status
      )
    )::text
  from ranking_comparison

  union all

  select
    '05_summary',
    'ranking_matches_portal_result_entries',
    'summary',
    case
      when exists (
        select 1
        from ranking_comparison
        where comparison_status <> 'ok'
      )
      then 'not_ok'
      when (select count(*) from computed_ranking) <> 6 then 'not_ok'
      when (select count(*) from stored_ranking) <> 6 then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'ok_rows', (
        select count(*)
        from ranking_comparison
        where comparison_status = 'ok'
      ),
      'problem_rows', (
        select count(*)
        from ranking_comparison
        where comparison_status <> 'ok'
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
order by
  check_group,
  object_name;
