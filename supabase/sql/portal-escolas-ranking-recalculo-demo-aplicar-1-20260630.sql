-- PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1
-- Aplicar: cria/atualiza função controlada de recálculo do ranking demo
-- e executa um primeiro recálculo a partir de portal_result_entries.
--
-- Este ficheiro corresponde à versão final consolidada, já com o hotfix
-- que faz a função devolver imediatamente as linhas recalculadas pelo upsert.
--
-- Escopo:
-- - apenas competição demo / demo-torneio-interturmas
-- - apenas ranking slug legacy-demo-league-table
-- - não mexe em /admin
-- - não mexe no backoffice
-- - não mexe em páginas públicas antigas
-- - não altera schema de tabelas
-- - não altera RLS/policies/grants

begin;

create or replace function public.portal_recalculate_demo_competition_ranking()
returns table (
  out_rank integer,
  out_participant_name text,
  out_points numeric,
  out_played integer,
  out_wins integer,
  out_draws integer,
  out_losses integer,
  out_score_for numeric,
  out_score_against numeric,
  out_score_difference numeric,
  out_entry_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competition record;
  v_format record;
  v_ranking record;
  v_deleted_stale_entries integer := 0;
begin
  select
    c.id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.name,
    c.slug
  into v_competition
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
  limit 1;

  if not found then
    raise exception 'portal_demo_competition_not_found' using errcode = 'P0002';
  end if;

  select
    cpf.id,
    cpf.code,
    cpf.ranking_model,
    cpf.scoring_rules,
    cpf.tie_breakers
  into v_format
  from public.portal_competition_formats cpf
  where cpf.portal_competition_id = v_competition.id
    and lower(cpf.code) = 'legacy-demo-matchdays-table'
  limit 1;

  if not found then
    raise exception 'portal_demo_format_not_found' using errcode = 'P0002';
  end if;

  select
    pr.id,
    pr.portal_entity_id,
    pr.portal_context_id,
    pr.portal_modality_id,
    pr.portal_competition_id,
    pr.portal_format_id,
    pr.slug
  into v_ranking
  from public.portal_rankings pr
  where pr.portal_competition_id = v_competition.id
    and pr.slug = 'legacy-demo-league-table'
  limit 1;

  if not found then
    raise exception 'portal_demo_ranking_not_found' using errcode = 'P0002';
  end if;

  delete from public.portal_ranking_entries pre
  where pre.portal_ranking_id = v_ranking.id
    and not exists (
      select 1
      from public.portal_event_participants ep
      join public.portal_events e
        on e.id = ep.portal_event_id
      where e.portal_competition_id = v_competition.id
        and ep.portal_participant_id = pre.portal_participant_id
    );

  get diagnostics v_deleted_stale_entries = row_count;

  update public.portal_rankings pr
  set
    portal_format_id = v_format.id,
    calculation_mode = 'derived_from_result_entries',
    source = 'portal_result_entries_demo_recalculation',
    status = 'active',
    generated_at = now(),
    published_at = coalesce(pr.published_at, now()),
    rules_snapshot = jsonb_build_object(
      'source', 'portal_result_entries',
      'demo_only', true,
      'included_result_statuses', jsonb_build_array('submitted', 'validated'),
      'ranking_model', coalesce(v_format.ranking_model, 'league_table'),
      'win_points', 3,
      'draw_points', 1,
      'loss_points', 0,
      'tie_breakers', jsonb_build_array(
        'points',
        'score_difference',
        'score_for',
        'portal_participant_id'
      )
    ),
    notes = 'Ranking demo recalculado a partir de portal_result_entries.',
    metadata = coalesce(pr.metadata, '{}'::jsonb) || jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1',
      'demo_only', true,
      'recalculated_from', 'portal_result_entries',
      'last_recalculated_at', now(),
      'deleted_stale_entries', v_deleted_stale_entries
    ),
    updated_at = now()
  where pr.id = v_ranking.id;

  return query
  with demo_events as (
    select e.*
    from public.portal_events e
    where e.portal_competition_id = v_competition.id
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
  upserted as (
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
      cr.portal_entity_id,
      cr.portal_context_id,
      cr.portal_modality_id,
      cr.portal_competition_id,
      v_ranking.id,
      cr.portal_participant_id,
      cr.proposed_rank,
      cr.proposed_rank::text,
      cr.points,
      cr.played,
      cr.wins,
      cr.draws,
      cr.losses,
      cr.score_for,
      cr.score_against,
      cr.score_difference,
      jsonb_build_object(
        'points', cr.points,
        'score_difference', cr.score_difference,
        'score_for', cr.score_for,
        'portal_participant_id', cr.portal_participant_id
      ),
      'active',
      jsonb_build_object(
        'phase', 'PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1',
        'source', 'portal_result_entries',
        'demo_only', true,
        'recalculated_at', now()
      ),
      now()
    from computed_ranking cr
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
    returning
      public.portal_ranking_entries.portal_participant_id,
      public.portal_ranking_entries.rank,
      public.portal_ranking_entries.points,
      public.portal_ranking_entries.played,
      public.portal_ranking_entries.wins,
      public.portal_ranking_entries.draws,
      public.portal_ranking_entries.losses,
      public.portal_ranking_entries.score_for,
      public.portal_ranking_entries.score_against,
      public.portal_ranking_entries.score_difference,
      public.portal_ranking_entries.status
  )
  select
    u.rank as out_rank,
    p.name as out_participant_name,
    u.points as out_points,
    u.played as out_played,
    u.wins as out_wins,
    u.draws as out_draws,
    u.losses as out_losses,
    u.score_for as out_score_for,
    u.score_against as out_score_against,
    u.score_difference as out_score_difference,
    u.status as out_entry_status
  from upserted u
  join public.portal_participants p
    on p.id = u.portal_participant_id
  order by
    u.rank asc,
    p.name asc;
end;
$$;

revoke all on function public.portal_recalculate_demo_competition_ranking() from public;

comment on function public.portal_recalculate_demo_competition_ranking()
is 'Demo-only controlled recalculation of Portal das Escolas ranking entries from portal_result_entries for demo-torneio-interturmas. Returns the recalculated rows from the upsert result.';

select *
from public.portal_recalculate_demo_competition_ranking();

commit;
