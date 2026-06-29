-- PORTAL-ESCOLAS-RESULTADOS-INSERCAO-DEMO-1
-- Smoke read-only. Confirma candidatos editaveis e evento sem resultado.

with editable_scope as (
  select distinct
    p.portal_entity_id,
    p.portal_context_id,
    p.portal_competition_id
  from public.portal_permissions p
  where p.status = 'active'
    and p.can_view = true
    and p.can_edit = true
), event_rows as (
  select
    e.id as event_id,
    e.name as event_name,
    e.portal_entity_id,
    e.portal_context_id,
    e.portal_competition_id
  from public.portal_events e
  join editable_scope s
    on s.portal_entity_id = e.portal_entity_id
   and (s.portal_context_id is null or s.portal_context_id = e.portal_context_id)
   and (s.portal_competition_id is null or s.portal_competition_id = e.portal_competition_id)
), participant_rows as (
  select
    ep.portal_event_id,
    count(*) as participants,
    count(re.id) as result_entries,
    count(*) filter (where re.id is null) as missing_results
  from public.portal_event_participants ep
  join event_rows e on e.event_id = ep.portal_event_id
  left join public.portal_result_entries re
    on re.portal_event_id = ep.portal_event_id
   and re.portal_participant_id = ep.portal_participant_id
  group by ep.portal_event_id
)
select
  e.event_name,
  pr.participants,
  pr.result_entries,
  pr.missing_results
from event_rows e
join participant_rows pr on pr.portal_event_id = e.event_id
order by e.event_name;
