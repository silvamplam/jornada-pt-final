# PORTAL-ESCOLAS-MULTIDESPORTO-MODALIDADES-READONLY-1

Fase: `PORTAL-ESCOLAS-MULTIDESPORTO-MODALIDADES-READONLY-1`

Branch esperada:

`portal-escolas-multidesporto-modalidades-readonly-1-20260628`

## Objetivo

Criar a primeira entrada read-only por modalidade no Portal das Escolas.

Página nova:

`/portal-escolas/modalidades`

Esta página organiza o Portal por modalidade, sem substituir as páginas atuais de competições, jogos ou resultados.

## Ficheiros incluídos

- `README-APLICAR.md`
- `docs/portal-escolas-multidesporto-modalidades-readonly-1.md`
- `app/portal-escolas/_components/PortalEscolasInternalNav.tsx`
- `app/portal-escolas/modalidades/page.tsx`
- `lib/portal-escolas/readPortalModalities.ts`
- `supabase/sql/portal-escolas-multidesporto-modalidades-grants-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-modalidades-smoke-1-20260628.sql`

## Alterações

1. Adiciona a entrada `Modalidades` à navegação interna do Portal.
2. Cria a página `/portal-escolas/modalidades`.
3. Cria leitura server-only de modalidades formais em `portal_modalities`.
4. Mantém fallback read-only por `portal_competitions.modality`, para a fase atual em que a competição demo ainda pode estar apenas com modalidade textual.
5. Mostra modalidade -> competições -> formato.
6. Mostra catálogo canónico de modalidades quando disponível.
7. Inclui grants mínimos para leitura autenticada de `portal_modality_catalog` e `portal_modalities`.
8. Inclui smoke test read-only.

## Fora do escopo

Não altera:

- dados;
- schema estrutural;
- RLS/policies;
- backoffice/admin;
- `/portal-escolas/competicoes`;
- `/portal-escolas/jogos`;
- `/portal-escolas/resultados`;
- `/portal-escolas/multidesporto-demo`;
- modelo legado `portal_games` / `portal_results`.

## Ordem de aplicação

Antes de qualquer commit/merge, confirmar no PowerShell:

```powershell
git branch --show-current
git status -sb
```

A branch tem de ser:

```txt
portal-escolas-multidesporto-modalidades-readonly-1-20260628
```

Depois de aplicar os ficheiros, confirmar que só os ficheiros desta fase mudaram.

## SQL

No Supabase SQL Editor, correr primeiro:

`supabase/sql/portal-escolas-multidesporto-modalidades-grants-1-20260628.sql`

Depois correr:

`supabase/sql/portal-escolas-multidesporto-modalidades-smoke-1-20260628.sql`

O script de grants não altera dados nem schema estrutural. Apenas garante SELECT autenticado nas tabelas formais de modalidade.

## Validação em Preview/produção

Validar:

- `/portal-escolas/modalidades`
- `/portal-escolas/painel`
- `/portal-escolas/competicoes`
- `/portal-escolas/jogos`
- `/portal-escolas/resultados`
- `/portal-escolas/multidesporto-demo`

## Resultado esperado

A navegação interna passa a incluir `Modalidades`.

A página `/portal-escolas/modalidades` deve mostrar:

- âmbito ativo;
- modalidades visíveis;
- origem formal ou compatibilidade por competição;
- competições associadas;
- formato legacy e formato formal, quando existir;
- catálogo canónico de modalidades.
