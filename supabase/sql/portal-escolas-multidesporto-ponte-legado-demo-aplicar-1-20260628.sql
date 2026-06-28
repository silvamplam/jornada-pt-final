-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-APLICAR-1.
-- Materializa dados demo da ponte legado -> multidesporto.
-- Escopo: apenas Torneio Demo Interturmas.
-- Não altera schema, RLS, policies, grants, UI ou dados legados.
-- Idempotente: pode ser corrido mais do que uma vez sem criar duplicados esperados.

begin;

-- 1. Formato configurado demo para a competição.
insert into public.portal_competition_formats (
  portal_entity_id,
  portal_context_id,
  portal_modality_id,
  portal_competition_id,
  catalog_format_id,
  name,
  code,
  format_scope,
  format_family,
  event_model,
  result_model,
  ranking_model,
  scoring_rules,
  tie_breakers,
  settings,
  status,
  notes
)
select
  c.portal_entity_id,
  c.portal_context_id,
  c.portal_modality_id,
  c.id,
  f.id,
  'Formato demo - ponte legado: ' || c.name,
  'legacy-demo-matchdays-table',
  'competition',
  f.format_family,
  f.default_event_model,
  f.default_result_model,
  f.default_ranking_model,
  jsonb_build_object(
    'win_points', 3,
    'draw_points', 1,
    'loss_points', 0,
    'source', 'legacy portal_results home_score/away_score'
  ),
  jsonb_build_array('points', 'score_difference', 'score_for', 'portal_participant_id'),
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'legacy_competition_id', c.id,
    'demo_only', true
  ),
  'active',
  'Formato demo criado para materializar a ponte read-only entre jogos/resultados legados e eventos/rankings multidesporto.'
from public.portal_competitions c
join public.portal_competition_format_catalog f
  on lower(f.code) = 'matchdays_table'
where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
  and not exists (
    select 1
    from public.portal_competition_formats existing
    where existing.portal_entity_id = c.portal_entity_id
      and existing.portal_context_id = c.portal_context_id
      and existing.portal_competition_id = c.id
      and lower(existing.code) = 'legacy-demo-matchdays-table'
  );

-- 2. Eventos demo derivados de portal_games.
with game_candidates as (
  select
    g.id as legacy_portal_game_id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.id as portal_competition_id,
    s.id as portal_stage_id,
    g.scheduled_at,
    g.venue,
    coalesce(nullif(g.status, ''), 'active') as legacy_status,
    (row_number() over (
      partition by c.id
      order by coalesce(s.stage_order, 999999), coalesce(g.scheduled_at, g.created_at), g.id
    ))::integer as event_order,
    coalesce(home.name, g.home_participant_id::text, 'Participante casa') || ' vs ' || coalesce(away.name, g.away_participant_id::text, 'Participante fora') as proposed_name,
    'legacy-game-' || replace(g.id::text, '-', '') as proposed_slug
  from public.portal_games g
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join public.portal_competitions c
    on c.id = s.portal_competition_id
  left join public.portal_participants home
    on home.id = g.home_participant_id
  left join public.portal_participants away
    on away.id = g.away_participant_id
  where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
)
insert into public.portal_events (
  portal_entity_id,
  portal_context_id,
  portal_modality_id,
  portal_competition_id,
  portal_stage_id,
  name,
  slug,
  type,
  event_order,
  scheduled_at,
  venue,
  status,
  notes,
  metadata
)
select
  gc.portal_entity_id,
  gc.portal_context_id,
  gc.portal_modality_id,
  gc.portal_competition_id,
  gc.portal_stage_id,
  gc.proposed_name,
  gc.proposed_slug,
  'match',
  gc.event_order,
  gc.scheduled_at,
  gc.venue,
  gc.legacy_status,
  'Evento demo criado a partir de portal_games para validar a ponte legado -> multidesporto.',
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'legacy_source_table', 'portal_games',
    'legacy_portal_game_id', gc.legacy_portal_game_id,
    'demo_only', true
  )
from game_candidates gc
where not exists (
  select 1
  from public.portal_events existing
  where existing.portal_entity_id = gc.portal_entity_id
    and existing.portal_context_id = gc.portal_context_id
    and existing.portal_competition_id = gc.portal_competition_id
    and existing.slug = gc.proposed_slug
);

-- 3. Participantes de evento derivados de home/away.
with event_participant_candidates as (
  select
    e.id as portal_event_id,
    g.id as legacy_portal_game_id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.id as portal_competition_id,
    s.id as portal_stage_id,
    side.portal_participant_id,
    side.role,
    side.seed_order
  from public.portal_games g
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join public.portal_competitions c
    on c.id = s.portal_competition_id
  join public.portal_events e
    on e.portal_competition_id = c.id
   and e.slug = 'legacy-game-' || replace(g.id::text, '-', '')
  cross join lateral (
    values
      (g.home_participant_id, 'home'::text, 1),
      (g.away_participant_id, 'away'::text, 2)
  ) as side(portal_participant_id, role, seed_order)
  where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
    and side.portal_participant_id is not null
)
insert into public.portal_event_participants (
  portal_entity_id,
  portal_context_id,
  portal_modality_id,
  portal_competition_id,
  portal_stage_id,
  portal_event_id,
  portal_participant_id,
  role,
  seed_order,
  status,
  metadata
)
select
  epc.portal_entity_id,
  epc.portal_context_id,
  epc.portal_modality_id,
  epc.portal_competition_id,
  epc.portal_stage_id,
  epc.portal_event_id,
  epc.portal_participant_id,
  epc.role,
  epc.seed_order,
  'active',
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'legacy_source_table', 'portal_games',
    'legacy_portal_game_id', epc.legacy_portal_game_id,
    'legacy_role', epc.role,
    'demo_only', true
  )
from event_participant_candidates epc
where not exists (
  select 1
  from public.portal_event_participants existing
  where existing.portal_event_id = epc.portal_event_id
    and existing.portal_participant_id = epc.portal_participant_id
);

-- 4. Entradas de resultado por participante derivadas de portal_results.
with result_entry_candidates as (
  select
    r.id as legacy_portal_result_id,
    g.id as legacy_portal_game_id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.id as portal_competition_id,
    s.id as portal_stage_id,
    e.id as portal_event_id,
    ep.id as portal_event_participant_id,
    side.portal_participant_id,
    side.role,
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
    side.score_for - side.score_against as score_difference,
    r.submitted_at,
    r.validated_at
  from public.portal_results r
  join public.portal_games g
    on g.id = r.portal_game_id
  join public.portal_stages s
    on s.id = g.portal_stage_id
  join public.portal_competitions c
    on c.id = s.portal_competition_id
  join public.portal_events e
    on e.portal_competition_id = c.id
   and e.slug = 'legacy-game-' || replace(g.id::text, '-', '')
  cross join lateral (
    values
      (g.home_participant_id, 'home'::text, r.home_score::numeric, r.away_score::numeric),
      (g.away_participant_id, 'away'::text, r.away_score::numeric, r.home_score::numeric)
  ) as side(portal_participant_id, role, score_for, score_against)
  left join public.portal_event_participants ep
    on ep.portal_event_id = e.id
   and ep.portal_participant_id = side.portal_participant_id
  where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
    and side.portal_participant_id is not null
    and side.score_for is not null
    and side.score_against is not null
)
insert into public.portal_result_entries (
  portal_entity_id,
  portal_context_id,
  portal_modality_id,
  portal_competition_id,
  portal_stage_id,
  portal_event_id,
  portal_event_participant_id,
  portal_participant_id,
  result_status,
  score_numeric,
  score_text,
  points,
  outcome,
  is_winner,
  submitted_at,
  validated_at,
  metadata
)
select
  rec.portal_entity_id,
  rec.portal_context_id,
  rec.portal_modality_id,
  rec.portal_competition_id,
  rec.portal_stage_id,
  rec.portal_event_id,
  rec.portal_event_participant_id,
  rec.portal_participant_id,
  'validated',
  rec.score_for,
  rec.score_for::text,
  rec.points,
  rec.outcome,
  case when rec.outcome = 'win' then true else false end,
  rec.submitted_at,
  rec.validated_at,
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'legacy_source_table', 'portal_results',
    'legacy_portal_result_id', rec.legacy_portal_result_id,
    'legacy_portal_game_id', rec.legacy_portal_game_id,
    'legacy_role', rec.role,
    'score_against', rec.score_against,
    'score_difference', rec.score_difference,
    'demo_only', true
  )
from result_entry_candidates rec
where not exists (
  select 1
  from public.portal_result_entries existing
  where existing.portal_event_id = rec.portal_event_id
    and existing.portal_participant_id = rec.portal_participant_id
);

-- 5. Ranking demo da competição.
insert into public.portal_rankings (
  portal_entity_id,
  portal_context_id,
  portal_modality_id,
  portal_competition_id,
  portal_format_id,
  name,
  slug,
  ranking_scope,
  ranking_type,
  calculation_mode,
  source,
  status,
  generated_at,
  published_at,
  rules_snapshot,
  notes,
  metadata
)
select
  c.portal_entity_id,
  c.portal_context_id,
  c.portal_modality_id,
  c.id,
  cpf.id,
  'Classificação demo - ' || c.name,
  'legacy-demo-league-table',
  'competition',
  'league_table',
  'derived_from_legacy_snapshot',
  'legacy_bridge_demo',
  'active',
  now(),
  now(),
  jsonb_build_object(
    'win_points', 3,
    'draw_points', 1,
    'loss_points', 0,
    'tie_breakers', jsonb_build_array('points', 'score_difference', 'score_for', 'portal_participant_id')
  ),
  'Ranking demo calculado a partir de portal_results para validar a ponte legado -> multidesporto.',
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'legacy_competition_id', c.id,
    'demo_only', true
  )
from public.portal_competitions c
left join public.portal_competition_formats cpf
  on cpf.portal_competition_id = c.id
 and lower(cpf.code) = 'legacy-demo-matchdays-table'
where (c.id = '12000000-0000-0000-0000-000000000001'::uuid or c.slug = 'demo-torneio-interturmas')
  and not exists (
    select 1
    from public.portal_rankings existing
    where existing.portal_entity_id = c.portal_entity_id
      and existing.portal_context_id = c.portal_context_id
      and existing.portal_competition_id = c.id
      and existing.slug = 'legacy-demo-league-table'
  );

-- 6. Linhas de ranking demo calculadas a partir dos resultados completos.
with legacy_entries as (
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
    coalesce(sum(le.points), 0) as points,
    coalesce(sum(le.score_for), 0) as score_for,
    coalesce(sum(le.score_against), 0) as score_against,
    coalesce(sum(le.score_difference), 0) as score_difference
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
ranking_rows as (
  select
    pr.id as portal_ranking_id,
    ro.*
  from ranking_ordered ro
  join public.portal_rankings pr
    on pr.portal_competition_id = ro.portal_competition_id
   and pr.slug = 'legacy-demo-league-table'
)
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
  metadata
)
select
  rr.portal_entity_id,
  rr.portal_context_id,
  rr.portal_modality_id,
  rr.portal_competition_id,
  rr.portal_ranking_id,
  rr.portal_participant_id,
  rr.proposed_rank,
  rr.proposed_rank::text,
  rr.points,
  rr.played,
  rr.wins,
  rr.draws,
  rr.losses,
  rr.score_for,
  rr.score_against,
  rr.score_difference,
  jsonb_build_object(
    'points', rr.points,
    'score_difference', rr.score_difference,
    'score_for', rr.score_for,
    'portal_participant_id', rr.portal_participant_id
  ),
  'active',
  jsonb_build_object(
    'legacy_bridge_phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1',
    'source', 'legacy portal_results aggregate',
    'demo_only', true
  )
from ranking_rows rr
where not exists (
  select 1
  from public.portal_ranking_entries existing
  where existing.portal_ranking_id = rr.portal_ranking_id
    and existing.portal_participant_id = rr.portal_participant_id
);

commit;
