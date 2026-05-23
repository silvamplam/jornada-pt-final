-- Jornada.pt - Fase 2C: clubes por pais.
-- Cria a ligacao manual por ID entre clubes e paises.
-- Nao faz backfill por nome e nao infere pais a partir de texto.

alter table public.teams
  add column if not exists country_id uuid references public.countries(id) on delete set null;

create index if not exists teams_country_id_idx on public.teams (country_id);

grant select, insert, update, delete on public.teams to service_role;
grant select on public.teams to anon, authenticated;
