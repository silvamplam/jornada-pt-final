-- Jornada.pt - complemento de aliases de clubes portugueses.
-- Nao apaga clubes nem altera referencias existentes.

insert into public.team_aliases (team_id, alias, normalized_alias)
select t.id, aliases.alias, aliases.normalized_alias
from (
  values
    ('alverca', 'FC Alverca', 'fc-alverca'),
    ('estoril', 'Estoril Praia', 'estoril-praia'),
    ('gil-vicente', 'Gil Vicente FC', 'gil-vicente-fc'),
    ('moreirense', 'Moreirense FC', 'moreirense-fc'),
    ('rio-ave', 'Rio Ave FC', 'rio-ave-fc')
) as aliases(team_slug, alias, normalized_alias)
join public.teams t
  on t.slug = aliases.team_slug
on conflict (normalized_alias) do update
set team_id = excluded.team_id,
    alias = excluded.alias;

notify pgrst, 'reload schema';
