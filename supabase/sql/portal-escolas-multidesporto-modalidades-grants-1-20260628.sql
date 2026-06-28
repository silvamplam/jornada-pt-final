-- Portal das Escolas - MULTIDESPORTO-MODALIDADES-GRANTS-1.
-- Grants mínimos para leitura read-only da página /portal-escolas/modalidades.
-- Não altera dados, schema estrutural, RLS ou policies.
-- Apenas garante SELECT autenticado nas tabelas formais de modalidades.

begin;

grant select on public.portal_modality_catalog to authenticated;
grant select on public.portal_modalities to authenticated;

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
--     ('portal_modality_catalog'),
--     ('portal_modalities')
-- ) as checks(table_name)
-- order by checks.table_name;
