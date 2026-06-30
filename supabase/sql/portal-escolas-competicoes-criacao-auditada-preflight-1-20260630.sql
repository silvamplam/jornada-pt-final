-- PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1
-- SQL 1/5 — PREFLIGHT READ-ONLY
--
-- Objetivo:
-- Confirmar se o modelo atual permite criar uma competição formal,
-- associada a uma modalidade existente, de forma autenticada, autorizada e auditada.
--
-- Não altera dados.
-- Não cria função.
-- Não cria tabelas.
-- Não faz inserts/updates/deletes.

with required_tables as (
  select *
  from (values
    ('portal_users'),
    ('portal_permissions'),
    ('portal_contexts'),
    ('portal_modalities'),
    ('portal_competitions'),
    ('portal_audit_events')
  ) as t(table_name)
),
required_columns as (
  select *
  from (values
    ('portal_users', 'id'),
    ('portal_users', 'auth_user_id'),
    ('portal_users', 'status'),

    ('portal_permissions', 'id'),
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

    ('portal_modalities', 'id'),
    ('portal_modalities', 'portal_entity_id'),
    ('portal_modalities', 'portal_context_id'),
    ('portal_modalities', 'catalog_modality_id'),
    ('portal_modalities', 'name'),
    ('portal_modalities', 'slug'),
    ('portal_modalities', 'status'),

    ('portal_competitions', 'id'),
    ('portal_competitions', 'portal_entity_id'),
    ('portal_competitions', 'portal_context_id'),
    ('portal_competitions', 'portal_modality_id'),
    ('portal_competitions', 'name'),
    ('portal_competitions', 'slug'),
    ('portal_competitions', 'modality'),
    ('portal_competitions', 'scope'),
    ('portal_competitions', 'format'),
    ('portal_competitions', 'status'),
    ('portal_competitions', 'created_at'),
    ('portal_competitions', 'updated_at'),

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
    ('portal_competitions_local_slug_unique_idx'),
    ('portal_competitions_entity_idx'),
    ('portal_competitions_context_idx'),
    ('portal_competitions_status_idx'),
    ('portal_competitions_modality_idx'),
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
    and p.proname in ('portal_create_competition')
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
    and p.portal_competition_id is null
    and (p.portal_context_id is null or p.portal_context_id = dc.portal_context_id)
),
demo_modalities as (
  select
    pm.id,
    pm.portal_entity_id,
    pm.portal_context_id,
    pm.catalog_modality_id,
    pm.name,
    pm.slug,
    pm.status
  from public.portal_modalities pm
  join demo_context dc
    on dc.portal_context_id = pm.portal_context_id
   and dc.portal_entity_id = pm.portal_entity_id
  where pm.status in ('draft', 'active')
),
demo_competitions_linked_to_modalities as (
  select
    c.id,
    c.name,
    c.slug,
    c.status,
    c.portal_modality_id
  from public.portal_competitions c
  join demo_modalities dm
    on dm.id = c.portal_modality_id
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
    'portal_create_competition',
    'function',
    case
      when exists (select 1 from function_defs) then 'already_exists_stop_and_review'
      else 'missing_expected'
    end,
    'Nesta fase espera-se missing_expected. Se já existir, parar e rever antes de substituir.'::text

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
    'demo_can_create_competition_scope',
    'permission',
    case
      when exists (select 1 from demo_permissions) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'matching_permissions', (select count(*) from demo_permissions),
      'requires', 'active portal_user + active structural permission + can_view + can_create + can_edit + portal_competition_id null'
    )::text

  union all

  select
    '08_demo_modalities',
    'formal_modalities_available_for_competition_creation',
    'count',
    case when count(*) >= 1 then 'ok' else 'not_ok' end,
    jsonb_build_object(
      'count', count(*),
      'samples', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'status', status,
            'catalog_modality_id', catalog_modality_id
          )
          order by name
        ) filter (where id is not null),
        '[]'::jsonb
      )
    )::text
  from demo_modalities

  union all

  select
    '09_existing_competitions_linked_to_modalities',
    'competitions_already_linked_to_formal_modalities',
    'count',
    'info',
    jsonb_build_object(
      'count', count(*),
      'samples', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'status', status,
            'portal_modality_id', portal_modality_id
          )
          order by name
        ) filter (where id is not null),
        '[]'::jsonb
      )
    )::text
  from demo_competitions_linked_to_modalities

  union all

  select
    '10_summary',
    'ready_for_audited_competition_creation_sql',
    'summary',
    case
      when exists (
        select 1
        from required_tables rt
        where to_regclass('public.' || rt.table_name) is null
      ) then 'not_ok_missing_table'

      when exists (
        select 1
        from required_columns rc
        left join information_schema.columns c
          on c.table_schema = 'public'
         and c.table_name = rc.table_name
         and c.column_name = rc.column_name
        where c.column_name is null
      ) then 'not_ok_missing_column'

      when exists (
        select 1
        from required_indexes ri
        where to_regclass('public.' || ri.index_name) is null
      ) then 'not_ok_missing_index'

      when exists (select 1 from function_defs) then 'not_ok_existing_function_review_first'

      when not exists (
        select 1
        from demo_user
        where status = 'active'
          and auth_user_id is not null
      ) then 'not_ok_demo_user'

      when not exists (
        select 1
        from demo_context
        where status = 'active'
      ) then 'not_ok_demo_context'

      when not exists (
        select 1
        from demo_permissions
      ) then 'not_ok_demo_permission'

      when not exists (
        select 1
        from demo_modalities
      ) then 'not_ok_no_formal_modality'

      else 'ok'
    end,
    jsonb_build_object(
      'expected_next_step_if_ok', 'aplicar function public.portal_create_competition(...)',
      'expected_status_for_new_competitions', 'draft',
      'expected_audit_action_type', 'portal_competition_created',
      'expected_audit_object_type', 'portal_competitions',
      'safe_to_apply_now', false,
      'note', 'Este preflight não autoriza aplicação automática. Enviar resultado para validação antes do SQL aplicar.'
    )::text
)
select
  check_group,
  object_name,
  object_type,
  status,
  details
from checks
order by
  check_group,
  object_name;
