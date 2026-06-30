-- PORTAL-ESCOLAS-RANKING-AUTO-RECALCULO-DEMO-1
-- Preflight read-only.
-- Confirma se a função de escrita existe, se a função de recálculo existe,
-- se a competição demo/ranking demo continuam íntegros,
-- e se portal_upsert_result_entry ainda não chama automaticamente o recálculo.
--
-- Não altera dados, schema, policies, grants ou funções.

with function_checks as (
  select
    'portal_upsert_result_entry' as object_name,
    to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)') as function_regprocedure
  union all
  select
    'portal_recalculate_demo_competition_ranking',
    to_regprocedure('public.portal_recalculate_demo_competition_ranking()')
),
function_defs as (
  select
    p.proname,
    pg_get_functiondef(p.oid) as function_definition
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      p.oid = to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)')
      or p.oid = to_regprocedure('public.portal_recalculate_demo_competition_ranking()')
    )
),
demo_competition as (
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
checks as (
  select
    '01_functions' as check_group,
    fc.object_name,
    'function' as object_type,
    case when fc.function_regprocedure is not null then 'ok' else 'missing' end as status,
    fc.function_regprocedure::text as details
  from function_checks fc

  union all

  select
    '02_function_body',
    'portal_upsert_result_entry_contains_recalculate_call',
    'function_body',
    case
      when exists (
        select 1
        from function_defs fd
        where fd.proname = 'portal_upsert_result_entry'
          and fd.function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      )
      then 'already_auto_recalculates'
      else 'missing_expected'
    end,
    'Informativo: antes desta fase espera-se missing_expected.'::text

  union all

  select
    '03_demo_integrity',
    'demo_competition',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_competition

  union all

  select
    '03_demo_integrity',
    'demo_events',
    'count',
    case when count(*) = 3 then 'ok' else 'check_count' end,
    count(*)::text
  from demo_events

  union all

  select
    '03_demo_integrity',
    'demo_result_entries',
    'count',
    case when count(*) = 6 then 'ok' else 'check_count' end,
    count(*)::text
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id

  union all

  select
    '03_demo_integrity',
    'demo_ranking',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_ranking

  union all

  select
    '03_demo_integrity',
    'demo_ranking_entries',
    'count',
    case when count(*) = 6 then 'ok' else 'not_ok' end,
    count(*)::text
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id

  union all

  select
    '04_ranking_header',
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
    '05_grants',
    'portal_upsert_result_entry_authenticated_execute',
    'grant',
    case
      when has_function_privilege(
        'authenticated',
        'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)',
        'EXECUTE'
      )
      then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '05_grants',
    'portal_recalculate_demo_competition_ranking_authenticated_execute',
    'grant',
    case
      when has_function_privilege(
        'authenticated',
        'public.portal_recalculate_demo_competition_ranking()',
        'EXECUTE'
      )
      then 'has_direct_execute'
      else 'no_direct_execute_expected'
    end,
    'Informativo: nesta estratégia não é necessário dar execute direto a authenticated.'::text

  union all

  select
    '06_summary',
    'ready_for_auto_recalculation_sql',
    'summary',
    case
      when to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)') is null then 'not_ok'
      when to_regprocedure('public.portal_recalculate_demo_competition_ranking()') is null then 'not_ok'
      when (select count(*) from demo_competition) <> 1 then 'not_ok'
      when (select count(*) from demo_ranking) <> 1 then 'not_ok'
      when exists (
        select 1
        from function_defs fd
        where fd.proname = 'portal_upsert_result_entry'
          and fd.function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      )
      then 'already_applied'
      else 'ok'
    end,
    jsonb_build_object(
      'strategy', 'call_recalculate_inside_portal_upsert_result_entry',
      'react_changes_needed', false,
      'direct_grant_needed_for_recalculate_function', false
    )::text
)
select *
from checks
order by
  check_group,
  object_name;
