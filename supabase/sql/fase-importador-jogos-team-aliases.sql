-- Jornada.pt - aliases de clubes para o importador de jogos.
-- Permite que nomes oficiais/completos sejam reconhecidos como o clube canonico
-- sem alterar o nome editorial do participante da epoca.

alter table public.teams
  add column if not exists code text;

create table if not exists public.team_aliases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  unique (normalized_alias)
);

create index if not exists team_aliases_team_id_idx
  on public.team_aliases (team_id);

grant select, insert, update, delete on public.team_aliases to service_role;
grant select on public.team_aliases to anon, authenticated;

insert into public.team_aliases (team_id, alias, normalized_alias)
select t.id, aliases.alias, aliases.normalized_alias
from (
  values
    ('nacional', 'CD Nacional', 'cd-nacional'),
    ('benfica', 'SL Benfica', 'sl-benfica'),
    ('sporting', 'Sporting CP', 'sporting-cp'),
    ('braga', 'SC Braga', 'sc-braga'),
    ('maritimo', 'CS Marítimo', 'cs-maritimo'),
    ('famalicao', 'FC Famalicão', 'fc-famalicao'),
    ('arouca', 'FC Arouca', 'fc-arouca'),
    ('casa-pia', 'Casa Pia AC', 'casa-pia-ac')
) as aliases(team_slug, alias, normalized_alias)
join public.teams t
  on t.slug = aliases.team_slug
on conflict (normalized_alias) do update
set team_id = excluded.team_id,
    alias = excluded.alias;

notify pgrst, 'reload schema';
