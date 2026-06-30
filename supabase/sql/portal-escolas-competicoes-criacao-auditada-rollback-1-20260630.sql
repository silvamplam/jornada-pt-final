-- PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1
-- SQL 5/5 — ROLLBACK GUARDADO
--
-- NÃO EXECUTAR sem ordem expressa.
--
-- Objetivo:
-- Reverter a função criada nesta fase:
-- public.portal_create_competition(uuid, text, text, text, text, text)
--
-- Nota:
-- Este rollback remove apenas a RPC desta fase.
-- Não remove competições reais que venham a ser criadas por ela.
-- Não altera portal_competitions.
-- Não altera portal_audit_events.
-- Não altera permissões, modalidades, contextos ou entidades.

begin;

drop function if exists public.portal_create_competition(
  uuid,
  text,
  text,
  text,
  text,
  text
);

commit;
