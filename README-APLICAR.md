# PORTAL-ESCOLAS-MULTIDESPORTO-SCHEMA-VALIDACAO-1

Este pacote é apenas para validação controlada da fundação multidesporto no Supabase.

Não altera a aplicação visual.
Não altera páginas do Portal.
Não altera helpers.
Não altera backoffice.
Não altera auth.

## Fase

`PORTAL-ESCOLAS-MULTIDESPORTO-SCHEMA-VALIDACAO-1`

## Branch recomendada

`portal-escolas-multidesporto-schema-validacao-1-20260628`

## Ficheiros incluídos

- `docs/portal-escolas-multidesporto-schema-validacao-1.md`
- `supabase/sql/portal-escolas-multidesporto-preflight-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-postflight-1-20260628.sql`

## Ordem de trabalho

1. Criar/mudar para a branch indicada, partindo da `main` atualizada.
2. Copiar este ZIP para a raiz do projeto.
3. Confirmar que o `git status` mostra apenas estes ficheiros novos.
4. Ler `docs/portal-escolas-multidesporto-schema-validacao-1.md`.
5. No Supabase SQL Editor, correr primeiro:
   - `supabase/sql/portal-escolas-multidesporto-preflight-1-20260628.sql`
6. Se o preflight estiver coerente, correr o SQL já aprovado na fase anterior:
   - `supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql`
7. Depois correr:
   - `supabase/sql/portal-escolas-multidesporto-postflight-1-20260628.sql`
8. Guardar screenshots/resultados principais.
9. Não fazer merge se houver erro SQL, tabela inesperadamente ausente, policy ausente ou falha de permissões.

## Importante

Este pacote não inclui alterações destrutivas.
Os ficheiros `preflight` e `postflight` são apenas leitura/validação.
O SQL de schema a aplicar continua a ser o ficheiro da fase anterior:

`supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql`
