-- PORTAL-ESCOLAS-RESULTADOS-INSERCAO-DEMO-1
-- Preflight read-only. Nao altera dados, policies ou funcoes.

with required_tables(table_name) as (
  values
    ('portal_users'),
    ('portal_permissions'),
    ('portal_events'),
    ('portal_event_participants'),
    ('portal_result_entries')
), required_columns(table_name, column_name) as (
  values
    ('portal_permissions', 'can_edit'),
    ('portal_permissions', 'can_validate'),
    ('portal_events', 'id'),
    ('portal_events', 'portal_entity_id'),
    ('portal_events', 'portal_context_id'),
    ('portal_events', 'portal_competition_id'),
    ('portal_event_participants', 'portal_event_id'),
    ('portal_event_participants', 'portal_participant_id'),
    ('portal_result_entries', 'portal_event_id'),
    ('portal_result_entries', 'portal_event_participant_id'),
    ('portal_result_entries', 'portal_participant_id'),
    ('portal_result_entries', 'score_numeric'),
    ('portal_result_entries', 'score_text'),
    ('portal_result_entries', 'points'),
    ('portal_result_entries', 'outcome'),
    ('portal_result_entries', 'result_status')
), checks as (
  select
    'table_exists' as check_type,
    rt.table_name as target,
    case when t.table_name is not null then 'ok' else 'missing' end as status
  from required_tables rt
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = rt.table_name

  union all

  select
    'column_exists' as check_type,
    rc.table_name || '.' || rc.column_name as target,
    case when c.column_name is not null then 'ok' else 'missing' end as status
  from required_columns rc
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = rc.table_name
   and c.column_name = rc.column_name

  union all

  select
    'unique_index' as check_type,
    'portal_result_entries_participant_unique_idx' as target,
    case when to_regclass('public.portal_result_entries_participant_unique_idx') is not null then 'ok' else 'missing' end as status

  union all

  select
    'editable_permissions' as check_type,
    'active can_edit permissions' as target,
    case when count(*) > 0 then 'ok' else 'missing' end as status
  from public.portal_permissions
  where status = 'active'
    and can_view = true
    and can_edit = true
)
select *
from checks
order by check_type, target;
