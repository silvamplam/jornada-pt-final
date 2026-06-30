-- PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1
-- SQL 5/5 — ROLLBACK GUARDADO
--
-- NÃO EXECUTAR sem ordem expressa.
--
-- Objetivo:
-- Reverter a função criada nesta fase:
-- public.portal_create_competition_structure(uuid, text, text, integer, date, text)
--
-- Nota:
-- Este rollback remove apenas a RPC desta fase.
-- Não remove estruturas reais que venham a ser criadas por ela.
-- Não altera portal_stages.
-- Não altera portal_audit_events.
-- Não altera competições, formatos, modalidades, contextos ou entidades.

begin;

drop function if exists public.portal_create_competition_structure(
  uuid,
  text,
  text,
  integer,
  date,
  text
);

commit;
