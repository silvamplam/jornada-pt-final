-- Jornada.pt - permissoes do backoffice
-- Executar no Supabase SQL Editor quando o backoffice devolver
-- "permission denied for table teams" ou "permission denied for table broadcast_channels".

grant usage on schema public to service_role;

grant select, insert, update, delete on public.teams to service_role;
grant select, insert, update, delete on public.broadcast_channels to service_role;
grant select on public.competitions to service_role;

-- Opcional para manter novas tabelas acessiveis ao backoffice no futuro.
alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;
