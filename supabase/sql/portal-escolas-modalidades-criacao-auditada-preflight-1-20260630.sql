-- PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1
-- Preflight read-only.
-- Confirma se o modelo atual permite criar uma modalidade formal de forma autenticada,
-- autorizada e auditada, sem mexer em dados.

with required_tables as (
  select *
  from (values
    ('portal_users'),
    ('portal_permissions'),
    ('portal_contexts'),
    ('portal_modality_catalog'),
    ('portal_modalities'),
    ('portal_audit_events')
  ) as t(table_name)
),
required_columns as (
  select *
  from (values
    ('portal_users', 'id'),
    ('portal_users', 'auth_user_id'),
    ('portal_users', 'status'),
    ('portal_permissions', 'portal_user_id'),
    ('portal_permissions', 'portal_entity_id'),
    ('portal_permissions', 'portal_context_id'),
    ('portal_permissions', 'portal_competition_id'),
    ('portal_permissions', 'can_view'),
    ('portal_permissions', 'can_create'),
    ('portal_permissions', 'can_edit'),
    ('portal_permissions', 'status'),
    ('portal_contexts', 'id'),
    ('portal_contexts', 'portal_entity_id'),
    ('portal_contexts', 'status'),
    ('portal_modality_catalog', 'id'),
    ('portal_modality_catalog', 'code'),
    ('portal_modality_catalog', 'name'),
    ('portal_modality_catalog', 'status'),
    ('portal_modalities', 'id'),
    ('portal_modalities', 'portal_entity_id'),
    ('portal_modalities', 'portal_context_id'),
    ('portal_modalities', 'catalog_modality_id'),
    ('portal_modalities', 'name'),
    ('portal_modalities', 'slug'),
    ('portal_modalities', 'local_code'),
    ('portal_modalities', 'status'),
    ('portal_modalities', 'metadata'),
    ('portal_audit_events', 'id'),
    ('portal_audit_events', 'portal_entity_id'),
    ('portal_audit_events', 'portal_context_id'),
    ('portal_audit_events', 'portal_competition_id'),
    ('portal_audit_events', 'actor_reference'),
    ('portal_audit_events', 'actor_portal_user_id'),
    ('portal_audit_events', 'action_type'),
    ('portal_audit_events', 'object_type'),
    ('portal_audit_events', 'object_id'),
    ('portal_audit_events', 'previous_status'),
    ('portal_audit_events', 'new_status'),
    ('portal_audit_events', 'metadata'),
    ('portal_audit_events', 'created_at')
  ) as c(table_name, column_name)
),
required_indexes as (
  select *
  from (values
    ('portal_modality_catalog_code_unique_idx'),
    ('portal_modalities_context_slug_unique_idx'),
    ('portal_modalities_context_catalog_unique_idx'),
    ('portal_modalities_entity_idx'),
    ('portal_modalities_context_idx'),
    ('portal_modalities_catalog_idx'),
    ('portal_modalities_status_idx'),
    ('portal_audit_events_actor_portal_user_idx')
  ) as i(index_name)
),
function_defs as (
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
    and p.proname in ('portal_create_modality')
),
demo_user as (
  select
    u.id as portal_user_id,
    u.auth_user_id,
    u.status
  from public.portal_users u
  where u.id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
  limit 1
),
demo_context as (
  select
    c.id as portal_context_id,
    c.portal_entity_id,
    c.status
  from public.portal_contexts c
  where c.id = '11000000-0000-0000-0000-000000000001'::uuid
  limit 1
),
demo_permissions as (
  select
    p.*
  from public.portal_permissions p
  join demo_user du
    on du.portal_user_id = p.portal_user_id
  join demo_context dc
    on dc.portal_entity_id = p.portal_entity_id
  where p.status = 'active'
    and p.can_view = true
    and p.can_create = true
    and p.can_edit = true
    and (p.portal_context_id is null or p.portal_context_id = dc.portal_context_id)
),
checks as (
  select
    '01_required_tables' as check_group,
    rt.table_name as object_name,
    'table' as object_type,
    case when to_regclass('public.' || rt.table_name) is not null then 'ok' else 'missing' end as status,
    null::text as details
  from required_tables rt

  union all

  select
    '02_required_columns',
    rc.table_name || '.' || rc.column_name,
    'column',
    case when c.column_name is not null then 'ok' else 'missing' end,
    null::text
  from required_columns rc
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = rc.table_name
   and c.column_name = rc.column_name

  union all

  select
    '03_required_indexes',
    ri.index_name,
    'index',
    case when to_regclass('public.' || ri.index_name) is not null then 'ok' else 'missing' end,
    null::text
  from required_indexes ri

  union all

  select
    '04_existing_function',
    'portal_create_modality',
    'function',
    case
      when exists (select 1 from function_defs) then 'already_exists'
      else 'missing_expected'
    end,
    'Antes desta fase espera-se missing_expected.'::text

  union all

  select
    '05_demo_user',
    'demo_portal_user',
    'user',
    case
      when exists (select 1 from demo_user where status = 'active' and auth_user_id is not null) then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'portal_user_id', portal_user_id,
        'auth_user_id', auth_user_id,
        'status', status
      )::text
      from demo_user
    )

  union all

  select
    '06_demo_context',
    'demo_context',
    'context',
    case
      when exists (select 1 from demo_context where status = 'active') then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'portal_context_id', portal_context_id,
        'portal_entity_id', portal_entity_id,
        'status', status
      )::text
      from demo_context
    )

  union all

  select
    '07_demo_permission',
    'demo_can_create_modality_scope',
    'permission',
    case
      when exists (select 1 from demo_permissions) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'matching_permissions', (select count(*) from demo_permissions),
      'requires', 'active portal_user + active permission + can_view + can_create + can_edit in entity/context scope'
    )::text

  union all

  select
    '08_catalog',
    'active_catalog_modalities',
    'count',
    case when count(*) >= 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from public.portal_modality_catalog
  where status = 'active'

  union all

  select
    '09_current_modalities',
    'formal_modalities_in_demo_context',
    'count',
    'info',
    count(*)::text
  from public.portal_modalities pm
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid

  union all

  select
    '10_summary',
    'ready_for_audited_modality_creation',
    'summary',
    case
      when exists (
        select 1
        from required_tables rt
        where to_regclass('public.' || rt.table_name) is null
      ) then 'not_ok'
      when exists (
        select 1
        from required_columns rc
        left join information_schema.columns c
          on c.table_schema = 'public'
         and c.table_name = rc.table_name
         and c.column_name = rc.column_name
        where c.column_name is null
      ) then 'not_ok'
      when not exists (select 1 from demo_user where status = 'active' and auth_user_id is not null) then 'not_ok'
      when not exists (select 1 from demo_context where status = 'active') then 'not_ok'
      when not exists (select 1 from demo_permissions) then 'not_ok'
      when exists (select 1 from function_defs) then 'already_applied'
      else 'ok'
    end,
    jsonb_build_object(
      'strategy', 'create_public_portal_create_modality_function',
      'react_changes_needed_now', false,
      'audit_required', true,
      'permission_required', 'can_create_and_can_edit_in_entity_context_scope',
      'ui_phase_after_sql_validation', true
    )::text
)
select *
from checks
order by check_group, object_name;
