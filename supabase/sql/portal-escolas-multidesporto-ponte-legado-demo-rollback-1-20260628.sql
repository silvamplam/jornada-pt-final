-- Portal das Escolas - MULTIDESPORTO-PONTE-LEGADO-DEMO-ROLLBACK-1.
-- Rollback opcional: remove apenas dados demo criados pela fase
-- PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1.
-- Não altera schema, RLS, policies, grants, UI ou dados legados.
-- Não correr em fluxo normal.

begin;

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
target_rankings as (
  select pr.id
  from public.portal_rankings pr
  join demo_competition dc
    on dc.id = pr.portal_competition_id
  where pr.slug = 'legacy-demo-league-table'
)
delete from public.portal_ranking_entries pre
using target_rankings tr
where pre.portal_ranking_id = tr.id;

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
)
delete from public.portal_rankings pr
using demo_competition dc
where pr.portal_competition_id = dc.id
  and pr.slug = 'legacy-demo-league-table';

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
target_events as (
  select e.id
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
)
delete from public.portal_result_entries re
using target_events te
where re.portal_event_id = te.id;

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
),
target_events as (
  select e.id
  from public.portal_events e
  join demo_competition dc
    on dc.id = e.portal_competition_id
  where e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1'
)
delete from public.portal_event_participants ep
using target_events te
where ep.portal_event_id = te.id;

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
)
delete from public.portal_events e
using demo_competition dc
where e.portal_competition_id = dc.id
  and e.metadata ->> 'legacy_bridge_phase' = 'PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1';

with demo_competition as (
  select c.id
  from public.portal_competitions c
  where c.id = '12000000-0000-0000-0000-000000000001'::uuid
     or c.slug = 'demo-torneio-interturmas'
)
delete from public.portal_competition_formats cpf
using demo_competition dc
where cpf.portal_competition_id = dc.id
  and lower(cpf.code) = 'legacy-demo-matchdays-table';

commit;
