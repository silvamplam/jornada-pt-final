-- PORTAL-ESCOLAS-RANKING-RECALCULO-DEMO-1
-- Smoke.
-- Confirma que a função pode ser chamada novamente
-- e continua a devolver a classificação demo correta.
--
-- Este SQL recalcula novamente o ranking demo.
-- Não altera schema, policies, grants ou páginas.

select *
from public.portal_recalculate_demo_competition_ranking();
