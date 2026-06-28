-- Portal das Escolas - MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-SMOKE-1.
-- Smoke test read-only final.
-- Não altera dados, schema, RLS, policies ou grants.

-- 1. Resumo esperado da formalização.
select
  'summary' as check_group,
  item,
  total
from (
  select 'catalog_active' as item, count(*)::integer as total
  from public.portal_modality_catalog
  where status = 'active'

  union all
  select 'formal_modalities_demo_multi_sport', count(*)::integer
  from public.portal_modalities pm
  join public.portal_modality_catalog mc
    on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'

  union all
  select 'demo_competition_with_formal_modality', count(*)::integer
  from public.portal_competitions c
  join public.portal_modalities pm
    on pm.id = c.portal_modality_id
  join public.portal_modality_catalog mc
    on mc.id = pm.catalog_modality_id
  where c.id = '12000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'

  union all
  select 'demo_competition_legacy_text_preserved', count(*)::integer
  from public.portal_competitions
  where id = '12000000-0000-0000-0000-000000000001'
    and modality = 'Multidesporto'

  union all
  select 'demo_events', count(*)::integer
  from public.portal_events
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'

  union all
  select 'demo_rankings', count(*)::integer
  from public.portal_rankings
  where portal_competition_id = '12000000-0000-0000-0000-000000000001'
) summary
order by item;

-- 2. Esta query deve devolver 0 linhas.
-- Se devolver linhas, ainda há dados demo materializados sem a modalidade formal esperada.
with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc
    on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
  order by pm.created_at
  limit 1
), problems as (
  select 'portal_competitions' as table_name, c.id::text as record_id
  from public.portal_competitions c
  cross join target_modality tm
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_competition_formats', f.id::text
  from public.portal_competition_formats f
  cross join target_modality tm
  where f.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and f.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_competition_categories', cat.id::text
  from public.portal_competition_categories cat
  cross join target_modality tm
  where cat.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and cat.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_events', e.id::text
  from public.portal_events e
  cross join target_modality tm
  where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and e.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_event_participants', ep.id::text
  from public.portal_event_participants ep
  cross join target_modality tm
  where ep.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and ep.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_result_entries', re.id::text
  from public.portal_result_entries re
  cross join target_modality tm
  where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and re.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_rankings', r.id::text
  from public.portal_rankings r
  cross join target_modality tm
  where r.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and r.portal_modality_id is distinct from tm.portal_modality_id

  union all
  select 'portal_ranking_entries', re.id::text
  from public.portal_ranking_entries re
  cross join target_modality tm
  where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    and re.portal_modality_id is distinct from tm.portal_modality_id
)
select
  'formalization_problem' as check_group,
  table_name,
  record_id
from problems
order by table_name, record_id;

-- 3. Preview da modalidade como deve surgir na página /portal-escolas/modalidades.
select
  'modalities_page_preview' as check_group,
  pm.name as formal_modality,
  pm.slug,
  mc.code as catalog_code,
  mc.name as catalog_name,
  count(c.id)::integer as competitions
from public.portal_modalities pm
join public.portal_modality_catalog mc
  on mc.id = pm.catalog_modality_id
left join public.portal_competitions c
  on c.portal_modality_id = pm.id
where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
  and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
  and mc.code = 'multi_sport'
group by pm.name, pm.slug, mc.code, mc.name;
