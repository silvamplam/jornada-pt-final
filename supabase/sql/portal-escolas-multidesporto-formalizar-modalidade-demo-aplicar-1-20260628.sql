-- Portal das Escolas - MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-APLICAR-1.
-- Formaliza a modalidade demo no modelo multidesporto novo.
-- Altera apenas dados demo controlados.
-- Mantém portal_competitions.modality legacy intacto.
-- Não altera schema, UI, RLS, policies ou grants.

begin;

do $$
begin
  if not exists (
    select 1
    from public.portal_modality_catalog
    where code = 'multi_sport'
      and status = 'active'
  ) then
    raise exception 'Preflight failed: missing active portal_modality_catalog code=multi_sport';
  end if;

  if not exists (
    select 1
    from public.portal_competitions
    where id = '12000000-0000-0000-0000-000000000001'
      and name = 'Torneio Demo Interturmas'
  ) then
    raise exception 'Preflight failed: missing target demo competition';
  end if;

  if exists (
    select 1
    from public.portal_competitions c
    left join public.portal_modalities pm
      on pm.id = c.portal_modality_id
    left join public.portal_modality_catalog mc
      on mc.id = pm.catalog_modality_id
    where c.id = '12000000-0000-0000-0000-000000000001'
      and c.portal_modality_id is not null
      and coalesce(mc.code, '') <> 'multi_sport'
  ) then
    raise exception 'Preflight failed: target competition already points to a different formal modality';
  end if;
end $$;

-- 1. Criar a modalidade formal demo, se ainda não existir.
insert into public.portal_modalities (
  portal_entity_id,
  portal_context_id,
  catalog_modality_id,
  name,
  slug,
  local_code,
  display_order,
  status,
  notes,
  metadata
)
select
  c.portal_entity_id,
  c.portal_context_id,
  mc.id,
  mc.name,
  'multidesporto',
  'demo-multi-sport',
  10,
  'active',
  'Modalidade formal demo criada pela fase PORTAL-ESCOLAS-MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-1.',
  jsonb_build_object(
    'phase', 'PORTAL-ESCOLAS-MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-1',
    'source', 'legacy_demo_formalization',
    'legacy_modality', c.modality,
    'competition_id', c.id
  )
from public.portal_competitions c
join public.portal_modality_catalog mc
  on mc.code = 'multi_sport'
 and mc.status = 'active'
where c.id = '12000000-0000-0000-0000-000000000001'
  and not exists (
    select 1
    from public.portal_modalities pm
    where pm.portal_entity_id = c.portal_entity_id
      and pm.portal_context_id = c.portal_context_id
      and pm.catalog_modality_id = mc.id
  );

-- 2. Ligar a competição demo à modalidade formal.
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
)
update public.portal_competitions c
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where c.id = '12000000-0000-0000-0000-000000000001'
  and (c.portal_modality_id is null or c.portal_modality_id = tm.portal_modality_id);

-- 3. Propagar a modalidade formal para os formatos materializados da competição demo.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_competition_formats f
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where f.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (f.portal_modality_id is null or f.portal_modality_id = tm.portal_modality_id);

-- 4. Propagar para categorias, se existirem.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_competition_categories cat
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where cat.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (cat.portal_modality_id is null or cat.portal_modality_id = tm.portal_modality_id);

-- 5. Propagar para eventos.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_events e
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (e.portal_modality_id is null or e.portal_modality_id = tm.portal_modality_id);

-- 6. Propagar para participantes de evento.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_event_participants ep
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where ep.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (ep.portal_modality_id is null or ep.portal_modality_id = tm.portal_modality_id);

-- 7. Propagar para entradas de resultado.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_result_entries re
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (re.portal_modality_id is null or re.portal_modality_id = tm.portal_modality_id);

-- 8. Propagar para rankings.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_rankings r
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where r.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (r.portal_modality_id is null or r.portal_modality_id = tm.portal_modality_id);

-- 9. Propagar para linhas de ranking.
with target_modality as (
  select c.portal_modality_id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'
    and c.portal_modality_id is not null
)
update public.portal_ranking_entries re
set
  portal_modality_id = tm.portal_modality_id,
  updated_at = now()
from target_modality tm
where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
  and (re.portal_modality_id is null or re.portal_modality_id = tm.portal_modality_id);

commit;
