# PORTAL-ESCOLAS-MULTIDESPORTO-LIGACAO-PORTAL-READONLY-1

Fase: `PORTAL-ESCOLAS-MULTIDESPORTO-LIGACAO-PORTAL-READONLY-1`

Branch esperada:

`portal-escolas-multidesporto-ligacao-portal-readonly-1-20260628`

## Objetivo

Ligar a leitura multidesporto demo ao Portal das Escolas de forma discreta e controlada, sem substituir as páginas atuais de jogos/resultados.

A fase expõe a página já validada:

`/portal-escolas/multidesporto-demo`

através da navegação interna comum do Portal das Escolas.

## Ficheiros incluídos

- `README-APLICAR.md`
- `docs/portal-escolas-multidesporto-ligacao-portal-readonly-1.md`
- `app/portal-escolas/_components/PortalEscolasInternalNav.tsx`
- `app/portal-escolas/multidesporto-demo/page.tsx`
- `supabase/sql/portal-escolas-multidesporto-ligacao-portal-smoke-1-20260628.sql`

## Alterações

1. Adiciona a entrada `Multidesporto` à navegação interna do Portal das Escolas.
2. Liga essa entrada a `/portal-escolas/multidesporto-demo`.
3. Marca a página `multidesporto-demo` como item ativo quando aberta.
4. Mantém as páginas atuais de jogos/resultados/competições sem substituição.
5. Inclui SQL smoke read-only para confirmar que os dados e grants necessários continuam válidos.

## Fora do escopo

Não altera:

- schema;
- dados;
- RLS/policies;
- backoffice/admin;
- `/portal-escolas/jogos`;
- `/portal-escolas/resultados`;
- `/portal-escolas/competicoes`;
- modelo legado `portal_games` / `portal_results`.

## Ordem de validação

Antes de qualquer commit/merge, confirmar no PowerShell:

```powershell
git branch --show-current
git status -sb
```

A branch tem de ser:

```txt
portal-escolas-multidesporto-ligacao-portal-readonly-1-20260628
```

Depois de aplicar os ficheiros, confirmar que só os ficheiros desta fase mudaram.

Antes do merge, correr no Supabase:

`supabase/sql/portal-escolas-multidesporto-ligacao-portal-smoke-1-20260628.sql`

Depois do merge/Vercel Ready, validar:

- `/portal-escolas/painel`
- `/portal-escolas/competicoes`
- `/portal-escolas/jogos`
- `/portal-escolas/resultados`
- `/portal-escolas/multidesporto-demo`

## Resultado esperado

A navegação interna do Portal passa a incluir um acesso discreto a `Multidesporto`, sem alterar o comportamento das páginas atuais.
