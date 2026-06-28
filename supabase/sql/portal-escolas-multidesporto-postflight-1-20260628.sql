-- Portal das Escolas - MULTIDESPORTO POSTFLIGHT 1
-- Read-only validation after applying multidesporto schema proposal.
-- Safe to run in Supabase SQL Editor.

-- 1. New multidesporto tables.
select
  'new_tables' as check_group,
  expected.table_name,
  case when t.table_name is not null then 'ok' else 'missing' end as status
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

-- 2. Optional columns added to existing tables.
select
  'new_optional_columns' as check_group,
  expected.table_name,
  expected.column_name,
  c.data_type,
  case when c.column_name is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_competitions', 'portal_modality_id'),
    ('portal_content_submissions', 'portal_modality_id'),
    ('portal_content_submissions', 'portal_event_id')
) as expected(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name
order by expected.table_name, expected.column_name;

-- 3. Confirm legacy field remains available.
select
  'legacy_field_still_present' as check_group,
  c.table_name,
  c.column_name,
  c.data_type,
  case when c.column_name is not null then 'ok' else 'missing' end as status
from (select 'portal_competitions'::text as table_name, 'modality'::text as column_name) expected
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name;

-- 4. RLS status for new tables.
select
  'rls_status' as check_group,
  c.relname as table_name,
  case when c.relrowsecurity then 'enabled' else 'disabled' end as rls_status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'portal_modality_catalog',
    'portal_modalities',
    'portal_competition_categories',
    'portal_events',
    'portal_event_participants',
    'portal_result_entries'
  )
order by c.relname;

-- 5. Policies for new tables.
select
  'policies' as check_group,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'portal_modality_catalog',
    'portal_modalities',
    'portal_competition_categories',
    'portal_events',
    'portal_event_participants',
    'portal_result_entries'
  )
order by tablename, policyname;

-- 6. Canonical modality catalog seeds.
select
  'catalog_seed_count' as check_group,
  count(*) as total_rows
from public.portal_modality_catalog;

select
  'catalog_seeds' as check_group,
  code,
  name,
  modality_family,
  default_event_model,
  default_result_model,
  status
from public.portal_modality_catalog
order by code;

-- 7. Important indexes created.
select
  'important_indexes' as check_group,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and (
    tablename in (
      'portal_modality_catalog',
      'portal_modalities',
      'portal_competition_categories',
      'portal_events',
      'portal_event_participants',
      'portal_result_entries'
    )
    or indexname in (
      'portal_competitions_modality_idx',
      'portal_content_submissions_modality_idx',
      'portal_content_submissions_event_idx'
    )
  )
order by tablename, indexname;

-- 8. Foreign keys created for new objects and columns.
select
  'foreign_keys' as check_group,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'portal_competitions',
    'portal_content_submissions',
    'portal_modalities',
    'portal_competition_categories',
    'portal_events',
    'portal_event_participants',
    'portal_result_entries'
  )
  and (
    tc.table_name like 'portal_%'
  )
order by tc.table_name, tc.constraint_name, kcu.column_name;
