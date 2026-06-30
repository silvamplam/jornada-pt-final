-- PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1
-- Postflight read-only.
-- Confirma que a função de criação auditada de modalidades foi criada
-- com assinatura, grant e auditoria esperados.

with function_defs as (
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
    and p.oid = to_regprocedure('public.portal_create_modality(uuid, text, text, text, text, text, text)')
),
demo_context as (
  select
    c.id as portal_context_id,
    c.portal_entity_id,
    c.status
  from public.portal_contexts c
  where c.id = '11000000-0000-0000-0000-000000000001'::uuid
),
checks as (
  select
    '01_function' as check_group,
    'portal_create_modality' as object_name,
    'function' as object_type,
    case when exists (select 1 from function_defs) then 'ok' else 'missing' end as status,
    (select signature from function_defs limit 1)::text as details

  union all

  select
    '02_signature',
    'portal_create_modality_return_type',
    'function_signature',
    case
      when exists (
        select 1
        from function_defs
        where current_returns = 'TABLE(result_modality_id uuid, result_portal_entity_id uuid, result_portal_context_id uuid, result_catalog_modality_id uuid, result_name text, result_slug text, result_status text)'
      ) then 'ok'
      else 'not_ok'
    end,
    (select current_returns from function_defs limit 1)::text

  union all

  select
    '03_function_body',
    'contains_permission_check',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%can_create%'
          and function_definition ilike '%can_edit%'
          and function_definition ilike '%portal_permissions%'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '03_function_body',
    'contains_audit_events_insert',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_audit_events%'
          and function_definition ilike '%portal_modality_created%'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '03_function_body',
    'contains_duplicate_guards',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_modality_slug_already_exists%'
          and function_definition ilike '%portal_catalog_modality_already_active_in_context%'
      ) then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '04_grants',
    'portal_create_modality_authenticated_execute',
    'grant',
    case
      when has_function_privilege(
        'authenticated',
        'public.portal_create_modality(uuid, text, text, text, text, text, text)',
        'EXECUTE'
      )
      then 'ok'
      else 'missing'
    end,
    null::text

  union all

  select
    '05_demo_context',
    'demo_context',
    'context',
    case when exists (select 1 from demo_context where status = 'active') then 'ok' else 'not_ok' end,
    (select jsonb_build_object('portal_context_id', portal_context_id, 'portal_entity_id', portal_entity_id, 'status', status)::text from demo_context limit 1)

  union all

  select
    '06_summary',
    'audited_modality_creation_ready',
    'summary',
    case
      when not exists (select 1 from function_defs) then 'not_ok'
      when not has_function_privilege(
        'authenticated',
        'public.portal_create_modality(uuid, text, text, text, text, text, text)',
        'EXECUTE'
      ) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_audit_events%'
          and function_definition ilike '%portal_modality_created%'
      ) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where function_definition ilike '%can_create%'
          and function_definition ilike '%can_edit%'
      ) then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'strategy', 'authenticated_rpc_for_modalities',
      'react_changes_needed_now', false,
      'audit_enabled', true,
      'next_ui_phase_can_call_function', true
    )::text
)
select *
from checks
order by check_group, object_name;
