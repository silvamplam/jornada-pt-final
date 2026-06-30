-- PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1
-- Preflight read-only.
-- Confirma que a função de escrita de resultados existe, que a tabela de auditoria existe
-- e que ainda não há registo automático de auditoria dentro da função.

with required_columns as (
  select *
  from (values
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
    and p.oid = to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)')
),
demo_competition as (
  select c.*
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
demo_events as (
  select e.*
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
),
checks as (
  select
    '01_required_table' as check_group,
    'portal_audit_events' as object_name,
    'table' as object_type,
    case when to_regclass('public.portal_audit_events') is not null then 'ok' else 'missing' end as status,
    null::text as details

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
    '03_function',
    'portal_upsert_result_entry',
    'function',
    case when exists (select 1 from function_defs) then 'ok' else 'missing' end,
    (select signature from function_defs limit 1)

  union all

  select
    '04_signature',
    'portal_upsert_result_entry_return_type',
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
    '05_function_body',
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
    'A fase anterior deve estar presente.'

  union all

  select
    '05_function_body',
    'contains_audit_events_insert',
    'function_body',
    case
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_audit_events%'
      ) then 'already_applied'
      else 'missing_expected'
    end,
    'Antes desta fase espera-se missing_expected.'

  union all

  select
    '06_demo_integrity',
    'demo_competition',
    'count',
    case when count(*) = 1 then 'ok' else 'not_ok' end,
    count(*)::text
  from demo_competition

  union all

  select
    '06_demo_integrity',
    'demo_events',
    'count',
    case when count(*) = 3 then 'ok' else 'check_count' end,
    count(*)::text
  from demo_events

  union all

  select
    '06_demo_integrity',
    'demo_result_entries',
    'count',
    case when count(*) = 6 then 'ok' else 'check_count' end,
    count(*)::text
  from public.portal_result_entries re
  join demo_events e
    on e.id = re.portal_event_id

  union all

  select
    '07_summary',
    'ready_for_result_write_audit',
    'summary',
    case
      when to_regclass('public.portal_audit_events') is null then 'not_ok'
      when exists (
        select 1
        from required_columns rc
        left join information_schema.columns c
          on c.table_schema = 'public'
         and c.table_name = rc.table_name
         and c.column_name = rc.column_name
        where c.column_name is null
      ) then 'not_ok'
      when not exists (select 1 from function_defs) then 'not_ok'
      when not exists (
        select 1
        from function_defs
        where current_returns = 'TABLE(result_entry_id uuid, result_event_id uuid, result_participant_id uuid, saved_result_status text)'
      ) then 'not_ok'
      when exists (
        select 1
        from function_defs
        where function_definition ilike '%portal_audit_events%'
      ) then 'already_applied'
      else 'ok'
    end,
    jsonb_build_object(
      'strategy', 'insert_audit_event_inside_portal_upsert_result_entry',
      'react_changes_needed', false,
      'demo_only', false,
      'preserve_existing_return_type', true
    )::text
)
select *
from checks
order by check_group, object_name;
