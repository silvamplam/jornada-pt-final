-- Portal das Escolas - MULTIDESPORTO PREFLIGHT 1
-- Read-only validation before applying multidesporto schema proposal.
-- Safe to run in Supabase SQL Editor.

-- 1. Base Portal tables expected before multidesporto schema.
select
  'base_tables' as check_group,
  expected.table_name,
  case when t.table_name is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_entities'),
    ('portal_contexts'),
    ('portal_competitions'),
    ('portal_participants'),
    ('portal_competition_participants'),
    ('portal_stages'),
    ('portal_games'),
    ('portal_results'),
    ('portal_content_submissions'),
    ('portal_users'),
    ('portal_permissions')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;

-- 2. Existing modality field in portal_competitions.
select
  'legacy_modality_column' as check_group,
  c.table_name,
  c.column_name,
  c.data_type,
  case when c.column_name is not null then 'ok' else 'missing' end as status
from (select 'portal_competitions'::text as table_name, 'modality'::text as column_name) expected
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name;

-- 3. Existing Portal RLS helper.
select
  'portal_can_select_scope' as check_group,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  case when p.oid is not null then 'ok' else 'missing' end as status
from (
  select p.oid, p.pronamespace, p.proname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'portal_can_select_scope'
    and pg_get_function_identity_arguments(p.oid) = 'target_portal_entity_id uuid, target_portal_context_id uuid, target_portal_competition_id uuid'
) p
join pg_namespace n on n.oid = p.pronamespace
union all
select
  'portal_can_select_scope' as check_group,
  'public' as schema_name,
  'portal_can_select_scope' as function_name,
  'target_portal_entity_id uuid, target_portal_context_id uuid, target_portal_competition_id uuid' as arguments,
  'missing' as status
where not exists (
  select 1
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'portal_can_select_scope'
    and pg_get_function_identity_arguments(p.oid) = 'target_portal_entity_id uuid, target_portal_context_id uuid, target_portal_competition_id uuid'
);

-- 4. Check whether multidesporto objects already exist.
select
  'multidesporto_tables_before' as check_group,
  expected.table_name,
  case when t.table_name is not null then 'already_exists' else 'not_yet_created' end as status
from (
  values
    ('portal_modality_catalog'),
    ('portal_modalities'),
    ('portal_competition_categories'),
    ('portal_events'),
    ('portal_event_participants'),
    ('portal_result_entries')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;

-- 5. Current portal competitions by legacy modality value.
select
  'legacy_modality_values' as check_group,
  coalesce(nullif(btrim(modality), ''), '(empty/null)') as modality_value,
  count(*) as total
from public.portal_competitions
group by coalesce(nullif(btrim(modality), ''), '(empty/null)')
order by total desc, modality_value;
