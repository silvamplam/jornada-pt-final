-- Jornada.pt - permissoes do backoffice
-- Executar no Supabase SQL Editor quando o backoffice devolver
-- "permission denied for table teams", "permission denied for table competitions",
-- "permission denied for table seasons" ou "permission denied for table broadcast_channels".

grant usage on schema public to service_role;

grant select, insert, update, delete on public.countries to service_role;
grant select, insert, update, delete on public.teams to service_role;
grant select, insert, update, delete on public.broadcast_channels to service_role;
grant select, insert, update, delete on public.matches to service_role;
grant select, insert, update, delete on public.competitions to service_role;
grant select, insert, update, delete on public.seasons to service_role;
grant select, insert, update, delete on public.matchdays to service_role;
grant select, insert, update, delete on public.season_teams to service_role;
-- Classificacoes: fotografias da tabela ligadas a competicao, epoca e jornada.
grant select, insert, update, delete on public.standings to service_role;
grant select, insert, update, delete on public.standing_rows to service_role;
grant select on public.articles to service_role;
grant select on public.headlines to service_role;

-- Opcional para manter novas tabelas acessiveis ao backoffice no futuro.
alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;
