-- PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1
-- Rollback guardado.
-- NÃO EXECUTAR salvo ordem expressa.
--
-- Objetivo:
-- - remover a função criada nesta fase;
-- - repor o ranking demo como snapshot derivado de portal_results legacy;
-- - remover do ranking demo participantes que não existam nesse snapshot legacy.
--
-- Escopo:
-- - apenas competição demo / demo-torneio-interturmas
-- - apenas ranking slug legacy-demo-league-table
-- - não altera schema de tabelas
-- - não altera RLS/policies/grants

begin;

drop function if exists public.portal_recalculate_demo_competition_ranking();

with demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
  limit 1
),
demo_ranking as (
  select pr.*
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
  limit 1
),
legacy_entries as (
  select
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.id as portal_competition_id,
    side.portal_participant_id,
    side.score_for,
    side.score_against,
    case
      when side.score_for > side.score_against then 'win'
      when side.score_for = side.score_against then 'draw'
      else 'loss'
    end as outcome,
    case
      when side.score_for > side.score_against then 3
      when side.score_for = side.score_against then 1
      else 0
    end as points,
    side.score_for - side.score_against as score_difference
  from public.portal_results r
  join public.portal_games g
    on g.id = r.portal_game_id
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join public.portal_competitions c
    on c.id = s.portal_competition_id
  cross join lateral (
    values
      (g.home_participant_id, r.home_score::numeric, r.away_score::numeric),
      (g.away_participant_id, r.away_score::numeric, r.home_score::numeric)
  ) as side(portal_participant_id, score_for, score_against)
  where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
    and side.portal_participant_id is not null
    and side.score_for is not null
    and side.score_against is not null
),
ranking_base as (
  select
    le.portal_entity_id,
    le.portal_context_id,
    le.portal_modality_id,
    le.portal_competition_id,
    le.portal_participant_id,
    count(*)::integer as played,
    count(*) filter (where le.outcome = 'win')::integer as wins,
    count(*) filter (where le.outcome = 'draw')::integer as draws,
    count(*) filter (where le.outcome = 'loss')::integer as losses,
    coalesce(sum(le.points), 0)::numeric as points,
    coalesce(sum(le.score_for), 0)::numeric as score_for,
    coalesce(sum(le.score_against), 0)::numeric as score_against,
    coalesce(sum(le.score_difference), 0)::numeric as score_difference
  from legacy_entries le
  group by
    le.portal_entity_id,
    le.portal_context_id,
    le.portal_modality_id,
    le.portal_competition_id,
    le.portal_participant_id
),
ranking_ordered as (
  select
    (rank() over (
      partition by rb.portal_competition_id
      order by rb.points desc, rb.score_difference desc, rb.score_for desc, rb.portal_participant_id asc
    ))::integer as proposed_rank,
    rb.*
  from ranking_base rb
),
removed_non_legacy as (
  delete from public.portal_ranking_entries pre
  using demo_ranking pr
  where pre.portal_ranking_id = pr.id
    and not exists (
      select 1
      from ranking_ordered ro
      where ro.portal_participant_id = pre.portal_participant_id
    )
  returning pre.portal_participant_id
),
upserted_legacy as (
  insert into public.portal_ranking_entries (
    portal_entity_id,
    portal_context_id,
    portal_modality_id,
    portal_competition_id,
    portal_ranking_id,
    portal_participant_id,
    rank,
    position_label,
    points,
    played,
    wins,
    draws,
    losses,
    score_for,
    score_against,
    score_difference,
    tie_breaker_values,
    status,
    metadata,
    updated_at
  )
  select
    ro.portal_entity_id,
    ro.portal_context_id,
    ro.portal_modality_id,
    ro.portal_competition_id,
    pr.id,
    ro.portal_participant_id,
    ro.proposed_rank,
    ro.proposed_rank::text,
    ro.points,
    ro.played,
    ro.wins,
    ro.draws,
    ro.losses,
    ro.score_for,
    ro.score_against,
    ro.score_difference,
    jsonb_build_object(
      'points', ro.points,
      'score_difference', ro.score_difference,
      'score_for', ro.score_for,
      'portal_participant_id', ro.portal_participant_id
    ),
    'active',
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1',
      'rollback', true,
      'source', 'legacy portal_results aggregate',
      'demo_only', true,
      'rolled_back_at', now()
    ),
    now()
  from ranking_ordered ro
  join demo_ranking pr
    on pr.portal_competition_id = ro.portal_competition_id
  on conflict (portal_ranking_id, portal_participant_id)
  do update set
    portal_entity_id = excluded.portal_entity_id,
    portal_context_id = excluded.portal_context_id,
    portal_modality_id = excluded.portal_modality_id,
    portal_competition_id = excluded.portal_competition_id,
    rank = excluded.rank,
    position_label = excluded.position_label,
    points = excluded.points,
    played = excluded.played,
    wins = excluded.wins,
    draws = excluded.draws,
    losses = excluded.losses,
    score_for = excluded.score_for,
    score_against = excluded.score_against,
    score_difference = excluded.score_difference,
    tie_breaker_values = excluded.tie_breaker_values,
    status = excluded.status,
    metadata = coalesce(public.portal_ranking_entries.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now()
  returning public.portal_ranking_entries.portal_participant_id
),
updated_header as (
  update public.portal_rankings pr
  set
    calculation_mode = 'derived_from_legacy_snapshot',
    source = 'legacy_bridge_demo',
    status = 'active',
    generated_at = now(),
    rules_snapshot = jsonb_build_object(
      'win_points', 3,
      'draw_points', 1,
      'loss_points', 0,
      'tie_breakers', jsonb_build_array('points', 'score_difference', 'score_for', 'portal_participant_id')
    ),
    notes = 'Ranking demo calculado a partir de portal_results para validar a ponte legado -> multidesporto.',
    metadata = coalesce(pr.metadata, '{}'::jsonb) || jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1',
      'rollback', true,
      'restored_source', 'legacy_bridge_demo',
      'rolled_back_at', now()
    ),
    updated_at = now()
  from demo_ranking dr
  where pr.id = dr.id
  returning pr.id
)
select
  'rollback_prepared_not_executed_unless_explicitly_ordered' as note,
  (select count(*) from removed_non_legacy) as removed_non_legacy_entries,
  (select count(*) from upserted_legacy) as upserted_legacy_entries,
  (select count(*) from updated_header) as updated_ranking_headers;

commit;
