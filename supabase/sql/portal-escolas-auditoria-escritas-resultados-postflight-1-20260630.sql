-- PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1
-- Postflight read-only.
-- Confirma que a função preservou assinatura/retorno, mantém recálculo automático
-- e passou a escrever em portal_audit_events.

with function_defs as (
  select
    p.oid,
    p.proname,
    p.oid::regprocedure::text as signature,
    pg_get_function_result(p.oid) as current_returns,
    pg_get_functiondef(p.oid) as function_definition
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)')
),
checks as (
  select
    '01_function' as check_group,
    'portal_upsert_result_entry' as object_name,
    'function' as object_type,
    case when exists (select 1 from function_defs) then 'ok' else 'missing' end as status,
    (select signature from function_defs limit 1) as details

  union all

  select
    '02_signature',
    'return_type_preserved',
    'function_signature',
    case
      when exists (
        select 1
        from function_defs
        where current_returns = 'TABLE(result_entry_id uuid, result_event_id uuid, result_participant_id uuid, saved_result_status text)'
      ) then 'ok'
      else 'not_ok'
    end,
    (select current_returns from function_defs limit 1)

  union all

  select
    '03_function_body',
    'contains_audit_insert',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%insert into public.portal_audit_events%'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '03_function_body',
    'contains_audit_phase_metadata',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1%'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '03_function_body',
    'contains_ranking_recalculation',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      ) then 'ok'
      else 'missing'
    end,
    'A auditoria não deve remover o recálculo automático.'

  union all

  select
    '04_grants',
    'authenticated_execute_upsert',
    'grant',
    case
      when has_function_privilege(
        'authenticated',
        'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)',
        'EXECUTE'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '05_summary',
    'result_write_audit_ready',
    'summary',
    case
      when not exists (select 1 from function_defs) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where current_returns = 'TABLE(result_entry_id uuid, result_event_id uuid, result_participant_id uuid, saved_result_status text)'
      ) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where function_definition ilike '%insert into public.portal_audit_events%'
      ) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_recalculate_demo_competition_ranking%'
      ) then 'not_ok'
      when not has_function_privilege(
        'authenticated',
        'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)',
        'EXECUTE'
      ) then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'audit_target', 'portal_audit_events',
      'audited_object_type', 'portal_result_entries',
      'react_changes_needed', false,
      'return_type_preserved', true
    )::text
)
select *
from checks
order by check_group, object_name;
