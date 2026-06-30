-- PORTAL-ESCOLAS-RANKING-AUTO-RECALCULO-DEMO-1
-- Postflight read-only.
-- Confirma que portal_upsert_result_entry(...) passou a chamar
-- portal_recalculate_demo_competition_ranking()
-- preservando a assinatura/retorno anterior.
--
-- Não altera dados, schema, policies, grants ou funções.

with upsert_function as (
  select
    p.oid,
    p.proname,
    p.oid::regprocedure::text as signature,
    pg_get_function_arguments(p.oid) as current_arguments,
    pg_get_function_result(p.oid) as current_returns,
    pg_get_functiondef(p.oid) as function_definition
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure(
      'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)'
    )
),
recalc_function as (
  select
    p.oid,
    p.proname,
    p.oid::regprocedure::text as signature
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure(
      'public.portal_recalculate_demo_competition_ranking()'
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
    'portal_upsert_result_entry' as object_name,
    'function' as object_type,
    case when exists (select 1 from upsert_function) then 'ok' else 'missing' end as status,
    (select signature from upsert_function limit 1)::text as details

  union all

  select
    '01_functions',
    'portal_recalculate_demo_competition_ranking',
    'function',
    case when exists (select 1 from recalc_function) then 'ok' else 'missing' end,
    (select signature from recalc_function limit 1)::text

  union all

  select
    '02_signature',
    'portal_upsert_result_entry_return_type',
    'function_signature',
    case
      when exists (
        select 1
        from upsert_function
        where current_returns = 'TABLE(result_entry_id uuid, result_event_id uuid, result_participant_id uuid, saved_result_status text)'
      )
      then 'ok'
      else 'not_ok'
    end,
    (select current_returns from upsert_function limit 1)::text

  union all

  select
    '03_function_body',
    'contains_recalculate_call',
    'function_body',
    case
      when exists (
        select 1
        from upsert_function
        where function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      )
      then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '03_function_body',
    'contains_demo_scope_guard',
    'function_body',
    case
      when exists (
        select 1
        from upsert_function
        where function_definition ilike '%12000000-0000-0000-0000-000000000001%'
      )
      then 'ok'
      else 'missing'
    end,
    'Confirma que o recálculo automático está limitado à competição demo.'::text

  union all

  select
    '03_function_body',
    'contains_auto_recalculate_phase_metadata',
    'function_body',
    case
      when exists (
        select 1
        from upsert_function
        where function_definition ilike '%PORTAL-ESCOLAS-RANKING-AUTO-RECALCULO-DEMO-1%'
      )
      then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '04_grants',
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
    '04_grants',
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
    '05_demo_integrity',
    'demo_competition',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_competition

  union all

  select
    '05_demo_integrity',
    'demo_result_entries',
    'count',
    case when count(*) = 6 then 'ok' else 'check_count' end,
    count(*)::text
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id

  union all

  select
    '05_demo_integrity',
    'demo_ranking_entries',
    'count',
    case when count(*) = 6 then 'ok' else 'not_ok' end,
    count(*)::text
  from public.portal_ranking_entries pre
  join demo_ranking pr
    on pr.id = pre.portal_ranking_id

  union all

  select
    '06_summary',
    'auto_recalculation_ready',
    'summary',
    case
      when not exists (select 1 from upsert_function) then 'not_ok'
      when not exists (select 1 from recalc_function) then 'not_ok'
      when not exists (
        select 1
        from upsert_function
        where current_returns = 'TABLE(result_entry_id uuid, result_event_id uuid, result_participant_id uuid, saved_result_status text)'
      ) then 'not_ok'
      when not exists (
        select 1
        from upsert_function
        where function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      ) then 'not_ok'
      when not exists (
        select 1
        from upsert_function
        where function_definition ilike '%12000000-0000-0000-0000-000000000001%'
      ) then 'not_ok'
      when not has_function_privilege(
        'authenticated',
        'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)',
        'EXECUTE'
      ) then 'not_ok'
      when (select count(*) from demo_competition) <> 1 then 'not_ok'
      when (
        select count(*)
        from public.portal_ranking_entries pre
        join demo_ranking pr
          on pr.id = pre.portal_ranking_id
      ) <> 6 then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'strategy', 'auto_recalculate_inside_portal_upsert_result_entry',
      'react_changes_needed', false,
      'demo_only', true,
      'return_type_preserved', true
    )::text
)
select *
from checks
order by
  check_group,
  object_name;
