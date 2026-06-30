-- PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1
-- Rollback guardado. NÃO EXECUTAR salvo ordem expressa.
--
-- Efeito:
-- - remove a função de criação auditada de modalidades;
-- - não remove modalidades reais eventualmente criadas depois da fase;
-- - não apaga eventos de auditoria já produzidos.

begin;

drop function if exists public.portal_create_modality(uuid, text, text, text, text, text, text);

commit;
