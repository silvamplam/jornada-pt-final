-- Portal das Escolas - MULTIDESPORTO-LEITURA-DEMO-GRANTS-HOTFIX-1.
-- Hotfix de permissões read-only para a página isolada /portal-escolas/multidesporto-demo.
-- Não altera dados, schema estrutural, UI, RLS ou policies.
-- Apenas garante SELECT autenticado nas tabelas multidesporto necessárias à leitura demo.

begin;

grant select on public.portal_events to authenticated;
grant select on public.portal_event_participants to authenticated;
grant select on public.portal_result_entries to authenticated;

commit;

-- Confirmação read-only opcional após aplicar:
-- select
--   checks.table_name,
--   case when exists (
--     select 1
--     from information_schema.role_table_grants g
--     where g.table_schema = 'public'
--       and g.table_name = checks.table_name
--       and g.grantee = 'authenticated'
--       and g.privilege_type = 'SELECT'
--   ) then 'ok' else 'missing' end as status
-- from (
--   values
--     ('portal_events'),
--     ('portal_event_participants'),
--     ('portal_result_entries')
-- ) as checks(table_name)
-- order by checks.table_name;
