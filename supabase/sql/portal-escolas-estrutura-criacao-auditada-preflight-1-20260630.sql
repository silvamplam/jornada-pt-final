-- PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1
-- SQL 1/5 — PREFLIGHT READ-ONLY
--
-- Objetivo:
-- Confirmar se o modelo atual permite criar uma estrutura competitiva formal
-- em public.portal_stages, associada a uma competição que já tem formato competitivo,
-- de forma autenticada, autorizada e auditada.
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
    ('portal_competition_formats'),
    ('portal_stages'),
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
    ('portal_modalities', 'name'),
    ('portal_modalities', 'slug'),
    ('portal_modalities', 'status'),

    ('portal_competitions', 'id'),
    ('portal_competitions', 'portal_entity_id'),
    ('portal_competitions', 'portal_context_id'),
    ('portal_competitions', 'portal_modality_id'),
    ('portal_competitions', 'name'),
    ('portal_competitions', 'slug'),
    ('portal_competitions', 'status'),

    ('portal_competition_formats', 'id'),
    ('portal_competition_formats', 'portal_entity_id'),
    ('portal_competition_formats', 'portal_context_id'),
    ('portal_competition_formats', 'portal_modality_id'),
    ('portal_competition_formats', 'portal_competition_id'),
    ('portal_competition_formats', 'name'),
    ('portal_competition_formats', 'code'),
    ('portal_competition_formats', 'format_scope'),
    ('portal_competition_formats', 'format_family'),
    ('portal_competition_formats', 'event_model'),
    ('portal_competition_formats', 'result_model'),
    ('portal_competition_formats', 'ranking_model'),
    ('portal_competition_formats', 'status'),

    ('portal_stages', 'id'),
    ('portal_stages', 'portal_entity_id'),
    ('portal_stages', 'portal_context_id'),
    ('portal_stages', 'portal_competition_id'),
    ('portal_stages', 'name'),
    ('portal_stages', 'type'),
    ('portal_stages', 'stage_order'),
    ('portal_stages', 'scheduled_date'),
    ('portal_stages', 'status'),
    ('portal_stages', 'created_at'),
    ('portal_stages', 'updated_at'),

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
    ('portal_stages_entity_idx'),
    ('portal_stages_context_idx'),
    ('portal_stages_competition_idx'),
    ('portal_stages_type_idx'),
    ('portal_stages_status_idx'),
    ('portal_stages_scheduled_date_idx'),
    ('portal_competition_formats_competition_idx'),
    ('portal_competition_formats_status_idx'),
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
    and p.proname in ('portal_create_competition_structure')
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
target_competition as (
  select
    c.id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.name,
    c.slug,
    c.status
  from public.portal_competitions c
  where c.slug = 'competicao-teste-ui'
  order by c.created_at desc nulls last
  limit 1
),
target_context as (
  select
    pc.id,
    pc.portal_entity_id,
    pc.status
  from public.portal_contexts pc
  join target_competition tc
    on tc.portal_context_id = pc.id
   and tc.portal_entity_id = pc.portal_entity_id
  limit 1
),
target_modality as (
  select
    pm.id,
    pm.portal_entity_id,
    pm.portal_context_id,
    pm.name,
    pm.slug,
    pm.status
  from public.portal_modalities pm
  join target_competition tc
    on tc.portal_modality_id = pm.id
   and tc.portal_context_id = pm.portal_context_id
   and tc.portal_entity_id = pm.portal_entity_id
  limit 1
),
target_format as (
  select
    f.id,
    f.portal_entity_id,
    f.portal_context_id,
    f.portal_modality_id,
    f.portal_competition_id,
    f.name,
    f.code,
    f.format_scope,
    f.format_family,
    f.event_model,
    f.result_model,
    f.ranking_model,
    f.status,
    f.created_at
  from public.portal_competition_formats f
  join target_competition tc
    on tc.id = f.portal_competition_id
   and tc.portal_entity_id = f.portal_entity_id
   and tc.portal_context_id = f.portal_context_id
  where f.status in ('draft', 'active')
    and f.format_scope = 'competition'
  order by f.created_at desc
  limit 1
),
target_permissions as (
  select
    p.*
  from public.portal_permissions p
  join demo_user du
    on du.portal_user_id = p.portal_user_id
  join target_competition tc
    on tc.portal_entity_id = p.portal_entity_id
  where p.status = 'active'
    and p.can_view = true
    and p.can_create = true
    and p.can_edit = true
    and (
      p.portal_context_id is null
      or p.portal_context_id = tc.portal_context_id
    )
    and (
      p.portal_competition_id is null
      or p.portal_competition_id = tc.id
    )
),
target_existing_stages as (
  select
    s.id,
    s.portal_entity_id,
    s.portal_context_id,
    s.portal_competition_id,
    s.name,
    s.type,
    s.stage_order,
    s.scheduled_date,
    s.status
  from public.portal_stages s
  join target_competition tc
    on tc.id = s.portal_competition_id
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
    'portal_create_competition_structure',
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
    '06_target_competition',
    'competicao-teste-ui',
    'competition',
    case
      when exists (
        select 1
        from target_competition
        where status = 'draft'
          and portal_modality_id is not null
      ) then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'status', status,
        'portal_entity_id', portal_entity_id,
        'portal_context_id', portal_context_id,
        'portal_modality_id', portal_modality_id
      )::text
      from target_competition
    )

  union all

  select
    '07_target_context',
    'target_context',
    'context',
    case
      when exists (select 1 from target_context where status = 'active') then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'portal_context_id', id,
        'portal_entity_id', portal_entity_id,
        'status', status
      )::text
      from target_context
    )

  union all

  select
    '08_target_modality',
    'target_modality',
    'modality',
    case
      when exists (select 1 from target_modality where status in ('draft', 'active')) then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'status', status,
        'portal_entity_id', portal_entity_id,
        'portal_context_id', portal_context_id
      )::text
      from target_modality
    )

  union all

  select
    '09_target_format',
    'target_competition_format',
    'format',
    case
      when exists (
        select 1
        from target_format
        where status in ('draft', 'active')
          and format_scope = 'competition'
      ) then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'id', id,
        'name', name,
        'code', code,
        'format_scope', format_scope,
        'format_family', format_family,
        'event_model', event_model,
        'result_model', result_model,
        'ranking_model', ranking_model,
        'status', status,
        'portal_competition_id', portal_competition_id
      )::text
      from target_format
    )

  union all

  select
    '10_target_permission',
    'demo_can_create_structure_scope',
    'permission',
    case
      when exists (select 1 from target_permissions) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'matching_permissions', (select count(*) from target_permissions),
      'requires', 'active portal_user + active permission + can_view + can_create + can_edit + matching entity/context + structural or competition scope'
    )::text

  union all

  select
    '11_existing_stages_for_target_competition',
    'target_competition_stages',
    'count',
    'info',
    jsonb_build_object(
      'count', count(*),
      'samples', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'type', type,
            'stage_order', stage_order,
            'scheduled_date', scheduled_date,
            'status', status
          )
          order by stage_order nulls last, name
        ) filter (where id is not null),
        '[]'::jsonb
      )
    )::text
  from target_existing_stages

  union all

  select
    '12_summary',
    'ready_for_audited_structure_creation_sql',
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
        from target_competition
        where status = 'draft'
          and portal_modality_id is not null
      ) then 'not_ok_target_competition'

      when not exists (
        select 1
        from target_context
        where status = 'active'
      ) then 'not_ok_target_context'

      when not exists (
        select 1
        from target_modality
        where status in ('draft', 'active')
      ) then 'not_ok_target_modality'

      when not exists (
        select 1
        from target_format
        where status in ('draft', 'active')
          and format_scope = 'competition'
      ) then 'not_ok_target_format'

      when not exists (
        select 1
        from target_permissions
      ) then 'not_ok_target_permission'

      else 'ok'
    end,
    jsonb_build_object(
      'expected_next_step_if_ok', 'aplicar function public.portal_create_competition_structure(...)',
      'target_table_for_structure', 'portal_stages',
      'expected_status_for_new_structures', 'draft',
      'expected_audit_action_type', 'portal_competition_structure_created',
      'expected_audit_object_type', 'portal_stages',
      'note', 'Este preflight não autoriza aplicação automática. Enviar resultado para validação antes do SQL aplicar.',
      'safe_to_apply_now', false
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
