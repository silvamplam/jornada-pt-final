-- Jornada.pt - Fase Editorial A
-- Acrescenta cor opcional para o titulo da manchete da jornada.

alter table public.matchday_editorials
add column if not exists title_color text;
