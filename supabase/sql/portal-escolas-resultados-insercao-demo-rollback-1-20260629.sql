-- PORTAL-ESCOLAS-RESULTADOS-INSERCAO-DEMO-1
-- Rollback guardado. Executar apenas se for necessário reverter a capacidade de escrita desta fase.
-- Nao apaga resultados inseridos; apenas remove a funcao de escrita.

drop function if exists public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text);
