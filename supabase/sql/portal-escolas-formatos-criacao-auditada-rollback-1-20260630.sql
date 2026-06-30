-- PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1
-- SQL 5/5 — ROLLBACK GUARDADO
--
-- NÃO EXECUTAR sem ordem expressa.
--
-- Objetivo:
-- Reverter a função criada nesta fase:
-- public.portal_create_competition_format(uuid, uuid, text, text, text, text, text, text, text, text, text)
--
-- Nota:
-- Este rollback remove apenas a RPC desta fase.
-- Não remove formatos reais que venham a ser criados por ela.
-- Não altera portal_competition_formats.
-- Não altera portal_competitions.format legacy.
-- Não altera portal_audit_events.
-- Não altera permissões, modalidades, contextos, entidades ou catálogo de formatos.

begin;

drop function if exists public.portal_create_competition_format(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

commit;
