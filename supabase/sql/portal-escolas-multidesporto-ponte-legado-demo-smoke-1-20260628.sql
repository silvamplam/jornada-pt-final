-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-SMOKE-1.
-- Smoke test read-only dos dados materializados na camada nova.
-- Não altera dados, schema, policies ou grants.

with demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
event_rows as (
  select
    '01_events' as smoke_group,
    e.event_order,
    e.name as label,
    e.status,
    jsonb_build_object(
      'event_id', e.id,
      'slug', e.slug,
      'type', e.type,
      'portal_stage_id', e.portal_stage_id,
      'legacy_portal_game_id', e.metadata ->> 'legacy_portal_game_id'
    )::text as details
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
),
event_participant_rows as (
  select
    '02_event_participants' as smoke_group,
    coalesce(e.event_order, 999999) as event_order,
    e.name || ' / ' || ep.role || ' / ' || p.name as label,
    ep.status,
    jsonb_build_object(
      'event_id', e.id,
      'participant_id', p.id,
      'participant_name', p.name,
      'role', ep.role,
      'seed_order', ep.seed_order
    )::text as details
  from public.portal_event_participants ep
  join public.portal_events e
    on e.id = ep.portal_event_id
  join public.portal_participants p
    on p.id = ep.portal_participant_id
  join demo_competition dc
    on dc.id = ep.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
),
result_rows as (
  select
    '03_result_entries' as smoke_group,
    coalesce(e.event_order, 999999) as event_order,
    e.name || ' / ' || p.name as label,
    re.result_status as status,
    jsonb_build_object(
      'participant_id', p.id,
      'score_for', re.score_numeric,
      'score_against', re.metadata ->> 'score_against',
      'score_difference', re.metadata ->> 'score_difference',
      'outcome', re.outcome,
      'points', re.points,
      'legacy_portal_result_id', re.metadata ->> 'legacy_portal_result_id'
    )::text as details
  from public.portal_result_entries re
  join public.portal_events e
    on e.id = re.portal_event_id
  join public.portal_participants p
    on p.id = re.portal_participant_id
  join demo_competition dc
    on dc.id = re.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
),
ranking_rows as (
  select
    '04_ranking_entries' as smoke_group,
    coalesce(pre.rank, 999999) as event_order,
    pre.rank::text || '. ' || p.name as label,
    pre.status,
    jsonb_build_object(
      'ranking_id', pr.id,
      'participant_id', p.id,
      'played', pre.played,
      'wins', pre.wins,
      'draws', pre.draws,
      'losses', pre.losses,
      'points', pre.points,
      'score_for', pre.score_for,
      'score_against', pre.score_against,
      'score_difference', pre.score_difference
    )::text as details
  from public.portal_ranking_entries pre
  join public.portal_rankings pr
    on pr.id = pre.portal_ranking_id
  join public.portal_participants p
    on p.id = pre.portal_participant_id
  join demo_competition dc
    on dc.id = pre.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
)
select * from event_rows
union all
select * from event_participant_rows
union all
select * from result_rows
union all
select * from ranking_rows
order by smoke_group, event_order, label;
