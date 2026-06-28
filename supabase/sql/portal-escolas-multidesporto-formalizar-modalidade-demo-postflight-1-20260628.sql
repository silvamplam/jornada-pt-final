-- Portal das Escolas - MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-POSTFLIGHT-1.
-- Validação read-only após formalizar a modalidade demo.
-- Não altera dados, schema, RLS, policies ou grants.

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
), counts as (
  select
    (
      select count(*)
      from public.portal_modalities pm
      join public.portal_modality_catalog mc
        on mc.id = pm.catalog_modality_id
      where pm.portal_entity_id = '10000000-0000-0000-0000-000000000001'
        and pm.portal_context_id = '11000000-0000-0000-0000-000000000001'
        and mc.code = 'multi_sport'
    )::integer as formal_modalities,
    (
      select count(*)
      from public.portal_competitions c
      join target_modality tm
        on tm.portal_modality_id = c.portal_modality_id
      where c.id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_competitions,
    (
      select count(*)
      from public.portal_competition_formats f
      join target_modality tm
        on tm.portal_modality_id = f.portal_modality_id
      where f.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_formats,
    (
      select count(*)
      from public.portal_competition_formats f
      where f.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_formats,
    (
      select count(*)
      from public.portal_competition_categories cat
      join target_modality tm
        on tm.portal_modality_id = cat.portal_modality_id
      where cat.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_categories,
    (
      select count(*)
      from public.portal_competition_categories cat
      where cat.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_categories,
    (
      select count(*)
      from public.portal_events e
      join target_modality tm
        on tm.portal_modality_id = e.portal_modality_id
      where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_events,
    (
      select count(*)
      from public.portal_events e
      where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_events,
    (
      select count(*)
      from public.portal_event_participants ep
      join target_modality tm
        on tm.portal_modality_id = ep.portal_modality_id
      where ep.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_event_participants,
    (
      select count(*)
      from public.portal_event_participants ep
      where ep.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_event_participants,
    (
      select count(*)
      from public.portal_result_entries re
      join target_modality tm
        on tm.portal_modality_id = re.portal_modality_id
      where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_result_entries,
    (
      select count(*)
      from public.portal_result_entries re
      where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_result_entries,
    (
      select count(*)
      from public.portal_rankings r
      join target_modality tm
        on tm.portal_modality_id = r.portal_modality_id
      where r.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_rankings,
    (
      select count(*)
      from public.portal_rankings r
      where r.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_rankings,
    (
      select count(*)
      from public.portal_ranking_entries re
      join target_modality tm
        on tm.portal_modality_id = re.portal_modality_id
      where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as linked_ranking_entries,
    (
      select count(*)
      from public.portal_ranking_entries re
      where re.portal_competition_id = '12000000-0000-0000-0000-000000000001'
    )::integer as total_ranking_entries,
    (
      select count(*)
      from public.portal_competitions c
      where c.id = '12000000-0000-0000-0000-000000000001'
        and c.modality = 'Multidesporto'
    )::integer as legacy_text_preserved
)
select
  'postflight' as check_group,
  check_name,
  expected,
  actual,
  case when actual = expected then 'ok' else 'not_ok' end as status
from counts
cross join lateral (
  values
    ('formal_modalities_demo_multi_sport', 1, formal_modalities),
    ('linked_demo_competition', 1, linked_competitions),
    ('legacy_text_preserved', 1, legacy_text_preserved),
    ('linked_formats_equals_total', total_formats, linked_formats),
    ('linked_categories_equals_total', total_categories, linked_categories),
    ('linked_events_equals_total', total_events, linked_events),
    ('linked_event_participants_equals_total', total_event_participants, linked_event_participants),
    ('linked_result_entries_equals_total', total_result_entries, linked_result_entries),
    ('linked_rankings_equals_total', total_rankings, linked_rankings),
    ('linked_ranking_entries_equals_total', total_ranking_entries, linked_ranking_entries)
) as checks(check_name, expected, actual)
order by check_name;

-- Detalhe da ligação formal criada.
select
  'formal_link_detail' as check_group,
  c.name as competition_name,
  c.modality as legacy_modality,
  pm.name as formal_modality,
  pm.slug as formal_modality_slug,
  mc.code as catalog_code,
  mc.name as catalog_name
from public.portal_competitions c
left join public.portal_modalities pm
  on pm.id = c.portal_modality_id
left join public.portal_modality_catalog mc
  on mc.id = pm.catalog_modality_id
where c.id = '12000000-0000-0000-0000-000000000001';
