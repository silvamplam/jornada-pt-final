-- Portal das Escolas - MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-PREFLIGHT-1.
-- Diagnóstico read-only antes de formalizar a modalidade demo.
-- Não altera dados, schema, RLS, policies ou grants.

-- 1. Tabelas necessárias.
select
  'tables' as check_group,
  expected.table_name,
  case when to_regclass('public.' || expected.table_name) is not null then 'ok' else 'missing' end as status
from (
  values
    ('portal_entities'),
    ('portal_contexts'),
    ('portal_modality_catalog'),
    ('portal_modalities'),
    ('portal_competitions'),
    ('portal_competition_formats'),
    ('portal_competition_categories'),
    ('portal_events'),
    ('portal_event_participants'),
    ('portal_result_entries'),
    ('portal_rankings'),
    ('portal_ranking_entries')
) as expected(table_name)
order by expected.table_name;

-- 2. Colunas necessárias.
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
    ('portal_modalities', 'notes'),
    ('portal_modalities', 'metadata'),
    ('portal_competitions', 'id'),
    ('portal_competitions', 'portal_entity_id'),
    ('portal_competitions', 'portal_context_id'),
    ('portal_competitions', 'portal_modality_id'),
    ('portal_competitions', 'name'),
    ('portal_competitions', 'modality'),
    ('portal_competitions', 'updated_at'),
    ('portal_competition_formats', 'portal_modality_id'),
    ('portal_competition_categories', 'portal_modality_id'),
    ('portal_events', 'portal_modality_id'),
    ('portal_event_participants', 'portal_modality_id'),
    ('portal_result_entries', 'portal_modality_id'),
    ('portal_rankings', 'portal_modality_id'),
    ('portal_ranking_entries', 'portal_modality_id')
) as required(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = required.table_name
 and c.column_name = required.column_name
order by required.table_name, required.column_name;

-- 3. Catálogo canónico esperado.
select
  'catalog' as check_group,
  id,
  code,
  name,
  status,
  case when code = 'multi_sport' and status = 'active' then 'ok' else 'not_ok' end as readiness
from public.portal_modality_catalog
where code = 'multi_sport';

-- 4. Competição demo alvo.
select
  'target_competition' as check_group,
  c.id,
  c.name,
  c.modality as legacy_modality,
  c.portal_modality_id,
  case
    when c.id is null then 'missing_competition'
    when c.name <> 'Torneio Demo Interturmas' then 'unexpected_competition_name'
    when coalesce(c.modality, '') <> 'Multidesporto' then 'unexpected_legacy_modality'
    when c.portal_modality_id is null then 'ready_to_create_formal_link'
    when mc.code = 'multi_sport' then 'already_formalized'
    else 'blocked_conflicting_formal_modality'
  end as readiness
from public.portal_competitions c
left join public.portal_modalities pm
  on pm.id = c.portal_modality_id
left join public.portal_modality_catalog mc
  on mc.id = pm.catalog_modality_id
where c.id = '12000000-0000-0000-0000-000000000001';

-- 5. Modalidade formal demo já existente, se houver.
select
  'existing_formal_modality' as check_group,
  pm.id,
  pm.name,
  pm.slug,
  pm.local_code,
  pm.status,
  mc.code as catalog_code
from public.portal_modalities pm
join public.portal_modality_catalog mc
  on mc.id = pm.catalog_modality_id
where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
  and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
  and mc.code = 'multi_sport'
order by pm.created_at;

-- 6. Contagens atuais nas tabelas multidesporto demo.
select
  'current_counts' as check_group,
  item,
  total
from (
  select 'formal_modalities_demo_multi_sport' as item, count(*)::integer as total
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'

  union all
  select 'competition_formats', count(*)::integer
  from public.portal_competition_formats
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'competition_categories', count(*)::integer
  from public.portal_competition_categories
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'events', count(*)::integer
  from public.portal_events
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'event_participants', count(*)::integer
  from public.portal_event_participants
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'result_entries', count(*)::integer
  from public.portal_result_entries
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'rankings', count(*)::integer
  from public.portal_rankings
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'ranking_entries', count(*)::integer
  from public.portal_ranking_entries
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'
) counts
order by item;

-- 7. Verificação final de problemas bloqueantes.
with missing_tables as (
  select expected.table_name
  from (
    values
      ('portal_modality_catalog'),
      ('portal_modalities'),
      ('portal_competitions'),
      ('portal_competition_formats'),
      ('portal_events'),
      ('portal_event_participants'),
      ('portal_result_entries'),
      ('portal_rankings'),
      ('portal_ranking_entries')
  ) as expected(table_name)
  where to_regclass('public.' || expected.table_name) is null
), missing_catalog as (
  select 'portal_modality_catalog.multi_sport' as item
  where not exists (
    select 1
    from public.portal_modality_catalog
    where code = 'multi_sport'
      and status = 'active'
  )
), missing_competition as (
  select 'portal_competitions.demo' as item
  where not exists (
    select 1
    from public.portal_competitions
    where id = '12000000-0000-0000-0000-000000000001'
      and name = 'Torneio Demo Interturmas'
  )
), conflicting_competition as (
  select 'portal_competitions.portal_modality_id' as item
  from public.portal_competitions c
  left join public.portal_modalities pm
    on pm.id = c.portal_modality_id
  left join public.portal_modality_catalog mc
    on mc.id = pm.catalog_modality_id
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
    and coalesce(mc.code, '') <> 'multi_sport'
)
select 'missing_table' as problem_type, table_name as item from missing_tables
union all
select 'missing_catalog' as problem_type, item from missing_catalog
union all
select 'missing_competition' as problem_type, item from missing_competition
union all
select 'conflicting_formal_modality' as problem_type, item from conflicting_competition
order by problem_type, item;
