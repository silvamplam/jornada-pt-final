-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-PREVIEW-1.
-- Preview read-only de como o modelo legado pode mapear para o modelo multidesporto.
-- Nao altera dados, schema, policies ou grants.

with competition_format_candidates as (
  select
    c.id as portal_competition_id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.name as competition_name,
    c.slug as competition_slug,
    c.modality as legacy_modality,
    c.format as legacy_format,
    count(distinct s.id) as stage_count,
    count(distinct g.id) as game_count,
    count(distinct r.id) as result_count,
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
  group by
    c.id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.name,
    c.slug,
    c.modality,
    c.format
),
game_event_candidates as (
  select
    g.id as legacy_portal_game_id,
    g.portal_entity_id,
    g.portal_context_id,
    g.portal_competition_id,
    c.name as competition_name,
    s.id as portal_stage_id,
    s.name as stage_name,
    g.home_participant_id,
    home.name as home_name,
    g.away_participant_id,
    away.name as away_name,
    g.scheduled_at,
    g.venue,
    g.status,
    coalesce(home.name, 'Participante casa') || ' vs ' || coalesce(away.name, 'Participante fora') as proposed_event_name
  from public.portal_games g
  join public.portal_competitions c
    on c.id = g.portal_competition_id
  join public.portal_stages s
    on s.id = g.portal_stage_id
  left join public.portal_participants home
    on home.id = g.home_participant_id
  left join public.portal_participants away
    on away.id = g.away_participant_id
),
event_participant_candidates as (
  select
    legacy_portal_game_id,
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_stage_id,
    home_participant_id as portal_participant_id,
    home_name as participant_name,
    'home' as proposed_role,
    1 as proposed_seed_order
  from game_event_candidates
  where home_participant_id is not null

  union all

  select
    legacy_portal_game_id,
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_stage_id,
    away_participant_id as portal_participant_id,
    away_name as participant_name,
    'away' as proposed_role,
    2 as proposed_seed_order
  from game_event_candidates
  where away_participant_id is not null
),
legacy_results as (
  select
    r.id as legacy_portal_result_id,
    r.portal_game_id as legacy_portal_game_id,
    r.portal_entity_id,
    r.portal_context_id,
    r.portal_competition_id,
    r.portal_stage_id,
    r.home_score,
    r.away_score,
    r.result_status,
    r.submitted_at,
    r.validated_at,
    g.home_participant_id,
    g.away_participant_id,
    home.name as home_name,
    away.name as away_name
  from public.portal_results r
  join public.portal_games g
    on g.id = r.portal_game_id
  left join public.portal_participants home
    on home.id = g.home_participant_id
  left join public.portal_participants away
    on away.id = g.away_participant_id
),
result_entry_candidates as (
  select
    legacy_portal_result_id,
    legacy_portal_game_id,
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_stage_id,
    home_participant_id as portal_participant_id,
    home_name as participant_name,
    'home' as proposed_role,
    home_score as score_numeric,
    case
      when home_score is null or away_score is null then null
      when home_score > away_score then 'win'
      when home_score = away_score then 'draw'
      else 'loss'
    end as proposed_outcome,
    case
      when home_score is null or away_score is null then null
      when home_score > away_score then 3
      when home_score = away_score then 1
      else 0
    end as proposed_points,
    case
      when home_score is null or away_score is null then null
      else home_score - away_score
    end as score_difference,
    result_status,
    submitted_at,
    validated_at
  from legacy_results
  where home_participant_id is not null

  union all

  select
    legacy_portal_result_id,
    legacy_portal_game_id,
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_stage_id,
    away_participant_id as portal_participant_id,
    away_name as participant_name,
    'away' as proposed_role,
    away_score as score_numeric,
    case
      when home_score is null or away_score is null then null
      when away_score > home_score then 'win'
      when away_score = home_score then 'draw'
      else 'loss'
    end as proposed_outcome,
    case
      when home_score is null or away_score is null then null
      when away_score > home_score then 3
      when away_score = home_score then 1
      else 0
    end as proposed_points,
    case
      when home_score is null or away_score is null then null
      else away_score - home_score
    end as score_difference,
    result_status,
    submitted_at,
    validated_at
  from legacy_results
  where away_participant_id is not null
),
ranking_base as (
  select
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_participant_id,
    participant_name,
    count(*) filter (where score_numeric is not null) as played,
    count(*) filter (where proposed_outcome = 'win') as wins,
    count(*) filter (where proposed_outcome = 'draw') as draws,
    count(*) filter (where proposed_outcome = 'loss') as losses,
    coalesce(sum(proposed_points), 0) as points,
    coalesce(sum(score_numeric), 0) as score_for,
    coalesce(sum(score_numeric - score_difference), 0) as score_against,
    coalesce(sum(score_difference), 0) as score_difference
  from result_entry_candidates
  where score_numeric is not null
  group by
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    portal_participant_id,
    participant_name
),
ranking_preview as (
  select
    rank() over (
      partition by portal_competition_id
      order by points desc, score_difference desc, score_for desc, participant_name asc
    ) as proposed_rank,
    *
  from ranking_base
),
preview as (
  select
    '01_competition_format_candidate' as preview_group,
    cfc.portal_competition_id::text as legacy_id,
    cfc.competition_name as label,
    case when f.code is null then 'needs_decision' else 'candidate_ok' end as status,
    jsonb_build_object(
      'legacy_modality', cfc.legacy_modality,
      'legacy_format', cfc.legacy_format,
      'stage_count', cfc.stage_count,
      'game_count', cfc.game_count,
      'result_count', cfc.result_count,
      'suggested_format_code', cfc.suggested_format_code,
      'suggested_format_name', f.name,
      'future_table', 'portal_competition_formats'
    )::text as details
  from competition_format_candidates cfc
  left join public.portal_competition_format_catalog f
    on lower(f.code) = lower(cfc.suggested_format_code)

  union all

  select
    '02_game_to_event_candidate' as preview_group,
    gec.legacy_portal_game_id::text as legacy_id,
    gec.proposed_event_name as label,
    'candidate_ok' as status,
    jsonb_build_object(
      'competition', gec.competition_name,
      'stage', gec.stage_name,
      'future_table', 'portal_events',
      'proposed_type', 'match',
      'proposed_name', gec.proposed_event_name,
      'scheduled_at', gec.scheduled_at,
      'venue', gec.venue,
      'legacy_status', gec.status,
      'metadata', jsonb_build_object('legacy_portal_game_id', gec.legacy_portal_game_id)
    )::text as details
  from game_event_candidates gec

  union all

  select
    '03_event_participant_candidate' as preview_group,
    epc.legacy_portal_game_id::text || ':' || epc.proposed_role as legacy_id,
    epc.participant_name as label,
    'candidate_ok' as status,
    jsonb_build_object(
      'future_table', 'portal_event_participants',
      'portal_participant_id', epc.portal_participant_id,
      'proposed_role', epc.proposed_role,
      'proposed_seed_order', epc.proposed_seed_order,
      'metadata', jsonb_build_object('legacy_portal_game_id', epc.legacy_portal_game_id)
    )::text as details
  from event_participant_candidates epc

  union all

  select
    '04_result_entry_candidate' as preview_group,
    rec.legacy_portal_result_id::text || ':' || rec.proposed_role as legacy_id,
    rec.participant_name as label,
    case when rec.score_numeric is null then 'score_missing' else 'candidate_ok' end as status,
    jsonb_build_object(
      'future_table', 'portal_result_entries',
      'legacy_portal_game_id', rec.legacy_portal_game_id,
      'portal_participant_id', rec.portal_participant_id,
      'proposed_role', rec.proposed_role,
      'score_numeric', rec.score_numeric,
      'proposed_outcome', rec.proposed_outcome,
      'proposed_points', rec.proposed_points,
      'result_status', rec.result_status,
      'submitted_at', rec.submitted_at,
      'validated_at', rec.validated_at
    )::text as details
  from result_entry_candidates rec

  union all

  select
    '05_ranking_entry_preview' as preview_group,
    rp.portal_competition_id::text || ':' || rp.portal_participant_id::text as legacy_id,
    rp.participant_name as label,
    'computed_preview_only' as status,
    jsonb_build_object(
      'future_table', 'portal_ranking_entries',
      'proposed_rank', rp.proposed_rank,
      'played', rp.played,
      'wins', rp.wins,
      'draws', rp.draws,
      'losses', rp.losses,
      'points', rp.points,
      'score_for', rp.score_for,
      'score_against', rp.score_against,
      'score_difference', rp.score_difference
    )::text as details
  from ranking_preview rp
)
select *
from preview
order by preview_group, label, legacy_id;
