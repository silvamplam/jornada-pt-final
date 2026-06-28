-- Portal das Escolas - MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-ROLLBACK-1.
-- Reverte apenas a formalização da modalidade demo desta fase.
-- Mantém dados legacy intactos.
-- Usar apenas se for necessário reverter.

begin;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc
    on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_ranking_entries re
set portal_modality_id = null, updated_at = now()
from target_modality tm
where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and re.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_rankings r
set portal_modality_id = null, updated_at = now()
from target_modality tm
where r.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and r.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_result_entries re
set portal_modality_id = null, updated_at = now()
from target_modality tm
where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and re.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_event_participants ep
set portal_modality_id = null, updated_at = now()
from target_modality tm
where ep.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and ep.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_events e
set portal_modality_id = null, updated_at = now()
from target_modality tm
where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and e.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_competition_categories cat
set portal_modality_id = null, updated_at = now()
from target_modality tm
where cat.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and cat.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_competition_formats f
set portal_modality_id = null, updated_at = now()
from target_modality tm
where f.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and f.portal_modality_id = tm.portal_modality_id;

with target_modality as (
  select pm.id as portal_modality_id
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
  order by pm.created_at
  limit 1
)
update public.portal_competitions c
set portal_modality_id = null, updated_at = now()
from target_modality tm
where c.id = '12000000-0000-0000-0000-000000000001'
  and c.portal_modality_id = tm.portal_modality_id;

-- Remover apenas se a modalidade formal demo já não for referenciada.
delete from public.portal_modalities pm
using public.portal_modality_catalog mc
where mc.id = pm.catalog_modality_id
  and mc.code = 'multi_sport'
  and pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
  and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
  and pm.local_code = 'demo-multi-sport'
  and not exists (select 1 from public.portal_competitions c where c.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_competition_formats f where f.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_competition_categories cat where cat.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_events e where e.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_event_participants ep where ep.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_result_entries re where re.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_rankings r where r.portal_modality_id = pm.id)
  and not exists (select 1 from public.portal_ranking_entries re where re.portal_modality_id = pm.id);

commit;

-- Confirmação read-only após rollback.
select
  'rollback_check' as check_group,
  item,
  total
from (
  select 'demo_competition_with_formal_modality' as item, count(*)::integer as total
  from public.portal_competitions
  where id = '12000000-0000-0000-0000-000000000001'
    and portal_modality_id is not null

  union all
  select 'demo_formal_modality_remaining', count(*)::integer
  from public.portal_modalities pm
  join public.portal_modality_catalog mc on mc.id = pm.catalog_modality_id
  where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
    and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
    and mc.code = 'multi_sport'
    and pm.local_code = 'demo-multi-sport'
) checks
order by item;
