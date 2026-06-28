-- Portal das Escolas - MULTIDESPORTO-MODALIDADES-SMOKE-1.
-- Smoke test read-only para a página /portal-escolas/modalidades.
-- Não altera dados, schema, RLS ou policies.

-- 1. Tabelas esperadas.
select
  'tables' as check_group,
  expected.table_name,
  case when to_regclass('public.' || expected.table_name) is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_modality_catalog'),
    ('portal_modalities'),
    ('portal_competitions'),
    ('portal_competition_formats'),
    ('portal_entities'),
    ('portal_contexts')
) as expected(table_name)
order by expected.table_name;

-- 2. Colunas usadas pela leitura de modalidades.
select
  'columns' as check_group,
  required.table_name,
  required.column_name,
  case when c.column_name is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_modality_catalog', 'id'),
    ('portal_modality_catalog', 'code'),
    ('portal_modality_catalog', 'name'),
    ('portal_modality_catalog', 'modality_family'),
    ('portal_modality_catalog', 'default_event_model'),
    ('portal_modality_catalog', 'default_result_model'),
    ('portal_modality_catalog', 'status'),
    ('portal_modalities', 'id'),
    ('portal_modalities', 'portal_entity_id'),
    ('portal_modalities', 'portal_context_id'),
    ('portal_modalities', 'catalog_modality_id'),
    ('portal_modalities', 'name'),
    ('portal_modalities', 'slug'),
    ('portal_modalities', 'local_code'),
    ('portal_modalities', 'display_order'),
    ('portal_modalities', 'status'),
    ('portal_competitions', 'portal_modality_id'),
    ('portal_competitions', 'modality'),
    ('portal_competitions', 'format'),
    ('portal_competition_formats', 'portal_modality_id'),
    ('portal_competition_formats', 'portal_competition_id'),
    ('portal_competition_formats', 'event_model'),
    ('portal_competition_formats', 'result_model'),
    ('portal_competition_formats', 'ranking_model')
) as required(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = required.table_name
 and c.column_name = required.column_name
order by required.table_name, required.column_name;

-- 3. Grants necessários para leitura autenticada das tabelas formais de modalidade.
select
  'grants' as check_group,
  checks.table_name,
  case when exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = checks.table_name
      and g.grantee = 'authenticated'
      and g.privilege_type = 'SELECT'
  ) then 'ok' else 'missing' end as status
from (
  values
    ('portal_modality_catalog'),
    ('portal_modalities')
) as checks(table_name)
order by checks.table_name;

-- 4. Policies SELECT esperadas.
select
  'policies' as check_group,
  expected.table_name,
  expected.policy_name,
  case when p.policyname is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_modality_catalog', 'portal_modality_catalog_select_authenticated'),
    ('portal_modalities', 'portal_modalities_select_by_scope')
) as expected(table_name, policy_name)
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename = expected.table_name
 and p.policyname = expected.policy_name
order by expected.table_name, expected.policy_name;

-- 5. Contagens de leitura usadas pela página.
select
  'counts' as check_group,
  'catalog_active' as item,
  count(*)::integer as total
from public.portal_modality_catalog
where status = 'active'
union all
select
  'counts' as check_group,
  'formal_modalities' as item,
  count(*)::integer as total
from public.portal_modalities
union all
select
  'counts' as check_group,
  'competitions_with_legacy_modality_text' as item,
  count(*)::integer as total
from public.portal_competitions
where nullif(btrim(coalesce(modality, '')), '') is not null
union all
select
  'counts' as check_group,
  'competitions_with_formal_modality_id' as item,
  count(*)::integer as total
from public.portal_competitions
where portal_modality_id is not null;

-- 6. Preview das modalidades que a página consegue agrupar por compatibilidade legacy.
select
  'legacy_modality_preview' as check_group,
  coalesce(nullif(btrim(c.modality), ''), 'Modalidade por definir') as modality_label,
  count(*)::integer as competitions
from public.portal_competitions c
group by coalesce(nullif(btrim(c.modality), ''), 'Modalidade por definir')
order by modality_label;
