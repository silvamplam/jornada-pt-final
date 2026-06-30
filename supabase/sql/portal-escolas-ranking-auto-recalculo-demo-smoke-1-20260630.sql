-- PORTAL-ESCOLAS-RANKING-AUTO-RECALCULO-DEMO-1
-- Smoke funcional sequencial com ROLLBACK.
--
-- Objetivo:
-- - simular auth.uid() com o utilizador demo;
-- - simular edição temporária de Núcleo Demo Norte vs Associação Demo Convidada para 1-1;
-- - confirmar que public.portal_upsert_result_entry(...) recalcula automaticamente o ranking;
-- - fazer ROLLBACK no fim para não deixar dados alterados.
--
-- Não deixa alterações persistidas.

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select u.auth_user_id::text
    from public.portal_users u
    where u.id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
      and u.status = 'active'
    limit 1
  ),
  true
);

select *
from public.portal_upsert_result_entry(
  (
    select e.id
    from public.portal_events e
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
    limit 1
  ),
  (
    select ep.portal_participant_id
    from public.portal_event_participants ep
    join public.portal_events e
      on e.id = ep.portal_event_id
    join public.portal_participants p
      on p.id = ep.portal_participant_id
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
      and p.name = 'Núcleo Demo Norte'
    limit 1
  ),
  '1',
  1,
  1,
  'draw',
  'submitted'
);

select *
from public.portal_upsert_result_entry(
  (
    select e.id
    from public.portal_events e
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
    limit 1
  ),
  (
    select ep.portal_participant_id
    from public.portal_event_participants ep
    join public.portal_events e
      on e.id = ep.portal_event_id
    join public.portal_participants p
      on p.id = ep.portal_participant_id
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
      and p.name = 'Associação Demo Convidada'
    limit 1
  ),
  '1',
  1,
  1,
  'draw',
  'submitted'
);

with ranking_after_auto_recalc as (
  select
    pre.rank,
    p.name as participant_name,
    pre.points,
    pre.played,
    pre.wins,
    pre.draws,
    pre.losses,
    pre.score_for,
    pre.score_against,
    pre.score_difference,
    pre.status
  from public.portal_rankings pr
  join public.portal_ranking_entries pre
    on pre.portal_ranking_id = pr.id
  join public.portal_participants p
    on p.id = pre.portal_participant_id
  where pr.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
    and pr.slug = 'legacy-demo-league-table'
),
checks as (
  select
    '01_auto_ranking' as check_group,
    'nucleo_demo_norte_after_temporary_1_1' as object_name,
    'ranking_entry' as object_type,
    case
      when exists (
        select 1
        from ranking_after_auto_recalc
        where participant_name = 'Núcleo Demo Norte'
          and points = 1
          and played = 1
          and draws = 1
          and wins = 0
          and losses = 0
          and score_for = 1
          and score_against = 1
          and score_difference = 0
      )
      then 'ok'
      else 'not_ok'
    end as status,
    (
      select to_jsonb(ranking_after_auto_recalc)::text
      from ranking_after_auto_recalc
      where participant_name = 'Núcleo Demo Norte'
      limit 1
    ) as details

  union all

  select
    '01_auto_ranking',
    'associacao_demo_convidada_after_temporary_1_1',
    'ranking_entry',
    case
      when exists (
        select 1
        from ranking_after_auto_recalc
        where participant_name = 'Associação Demo Convidada'
          and points = 1
          and played = 1
          and draws = 1
          and wins = 0
          and losses = 0
          and score_for = 1
          and score_against = 1
          and score_difference = 0
      )
      then 'ok'
      else 'not_ok'
    end,
    (
      select to_jsonb(ranking_after_auto_recalc)::text
      from ranking_after_auto_recalc
      where participant_name = 'Associação Demo Convidada'
      limit 1
    )

  union all

  select
    '02_summary',
    'auto_recalculation_smoke_sequential',
    'summary',
    case
      when not exists (
        select 1
        from ranking_after_auto_recalc
        where participant_name = 'Núcleo Demo Norte'
          and points = 1
          and draws = 1
          and score_for = 1
          and score_against = 1
      ) then 'not_ok'
      when not exists (
        select 1
        from ranking_after_auto_recalc
        where participant_name = 'Associação Demo Convidada'
          and points = 1
          and draws = 1
          and score_for = 1
          and score_against = 1
      ) then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'temporary_result', 'Núcleo Demo Norte 1 - 1 Associação Demo Convidada',
      'rollback_expected', true,
      'auto_recalculation_inside_upsert_confirmed', true,
      'execution_mode', 'sequential_statements'
    )::text
)
select *
from checks
order by
  check_group,
  object_name;

rollback;
