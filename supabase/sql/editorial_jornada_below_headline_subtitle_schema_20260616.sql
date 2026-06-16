-- Jornada.pt - Editorial da Jornada: subtitulo da zona abaixo da manchete
-- Execucao manual no Supabase SQL Editor.

alter table public.matchday_editorials
  add column if not exists below_headline_subtitle text;
