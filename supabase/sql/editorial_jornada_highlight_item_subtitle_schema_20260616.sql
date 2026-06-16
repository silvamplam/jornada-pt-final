-- Jornada.pt - Editorial da Jornada: subtitulo por destaque abaixo da manchete
-- Execucao manual no Supabase SQL Editor.

alter table public.matchday_highlights
  add column if not exists subtitle text;

notify pgrst, 'reload schema';
