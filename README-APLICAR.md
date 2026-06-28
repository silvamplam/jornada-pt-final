# PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1

Fase: `PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1`

Branch: `portal-escolas-multidesporto-ponte-legado-demo-1-20260628`

## Objetivo

Materializar, apenas para dados demo já diagnosticados, a ponte entre o modelo legado do Portal das Escolas e a camada multidesporto nova.

Esta fase cria dados derivados nas tabelas novas a partir do `Torneio Demo Interturmas`:

- `portal_competition_formats`
- `portal_events`
- `portal_event_participants`
- `portal_result_entries`
- `portal_rankings`
- `portal_ranking_entries`

## O que esta fase não faz

- Não altera UI.
- Não mexe em `app/`.
- Não mexe em `lib/`.
- Não altera schema.
- Não altera RLS/policies/grants.
- Não remove nem substitui `portal_games`.
- Não remove nem substitui `portal_results`.
- Não mexe no backoffice principal.
- Não escreve dados fora da ponte demo.

## Ordem obrigatória

1. Confirmar branch local no PowerShell:

```powershell
git branch --show-current
git status -sb
```

Tem de estar em:

```txt
portal-escolas-multidesporto-ponte-legado-demo-1-20260628
```

2. Correr no Supabase SQL Editor:

```txt
supabase/sql/portal-escolas-multidesporto-ponte-legado-demo-preflight-1-20260628.sql
```

3. Só se o preflight estiver OK, correr:

```txt
supabase/sql/portal-escolas-multidesporto-ponte-legado-demo-aplicar-1-20260628.sql
```

4. Depois correr:

```txt
supabase/sql/portal-escolas-multidesporto-ponte-legado-demo-postflight-1-20260628.sql
```

5. Depois correr:

```txt
supabase/sql/portal-escolas-multidesporto-ponte-legado-demo-smoke-1-20260628.sql
```

6. Só depois fazer commit/PR/merge.

## Rollback opcional

Se for necessário remover apenas os dados demo materializados por esta fase, usar:

```txt
supabase/sql/portal-escolas-multidesporto-ponte-legado-demo-rollback-1-20260628.sql
```

Não correr este rollback em fluxo normal. É apenas salvaguarda.

## Validação esperada

Depois da aplicação, o postflight deve confirmar:

- 1 formato demo em `portal_competition_formats`;
- 3 eventos em `portal_events`;
- 6 participantes de evento em `portal_event_participants`;
- 4 entradas de resultado em `portal_result_entries`;
- 1 ranking em `portal_rankings`;
- 4 linhas de ranking em `portal_ranking_entries`.

As páginas atuais do Portal devem continuar visualmente iguais.
