# PORTAL-ESCOLAS-MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-1

Fase: `PORTAL-ESCOLAS-MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-1`

Branch esperada:

`portal-escolas-multidesporto-formalizar-modalidade-demo-1-20260628`

## Objetivo

Formalizar a modalidade demo no modelo multidesporto novo.

Até esta fase, a competição demo ainda podia aparecer apenas por compatibilidade legacy através de:

`portal_competitions.modality = 'Multidesporto'`

Esta fase cria uma modalidade formal em:

`portal_modalities`

ligada ao catálogo canónico:

`portal_modality_catalog.code = 'multi_sport'`

E liga formalmente a competição demo através de:

`portal_competitions.portal_modality_id`

## Ficheiros incluídos

- `README-APLICAR.md`
- `docs/portal-escolas-multidesporto-formalizar-modalidade-demo-1.md`
- `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-preflight-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-aplicar-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-postflight-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-smoke-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-rollback-1-20260628.sql`

## O que altera

Altera apenas dados demo multidesporto:

1. Garante uma linha formal em `portal_modalities` para `Multidesporto` no âmbito demo.
2. Liga `Torneio Demo Interturmas` a essa modalidade formal.
3. Propaga `portal_modality_id` para os dados multidesporto demo já materializados:
   - `portal_competition_formats`
   - `portal_competition_categories`, se existirem
   - `portal_events`
   - `portal_event_participants`
   - `portal_result_entries`
   - `portal_rankings`
   - `portal_ranking_entries`

## O que não altera

Não altera:

- UI;
- app/lib;
- schema estrutural;
- RLS/policies/grants;
- backoffice/admin;
- páginas públicas;
- páginas atuais de jogos/resultados/competições;
- `portal_competitions.modality` legacy.

O campo textual legacy é mantido intacto para compatibilidade.

## Ordem de aplicação

Antes de aplicar qualquer ficheiro/commit, confirmar no PowerShell:

```powershell
git branch --show-current
git status -sb
```

A branch tem de ser:

```txt
portal-escolas-multidesporto-formalizar-modalidade-demo-1-20260628
```

## SQL

No Supabase SQL Editor, correr por esta ordem:

1. `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-preflight-1-20260628.sql`
2. `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-aplicar-1-20260628.sql`
3. `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-postflight-1-20260628.sql`
4. `supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-smoke-1-20260628.sql`

Só correr o `aplicar` se o preflight indicar readiness OK.

O rollback fica disponível apenas se for preciso reverter esta formalização demo:

`supabase/sql/portal-escolas-multidesporto-formalizar-modalidade-demo-rollback-1-20260628.sql`

## Validação esperada

Depois do SQL:

- `/portal-escolas/modalidades` deve deixar de depender apenas de fallback por competição;
- deve existir 1 modalidade formal demo;
- a competição demo deve ficar associada à modalidade formal;
- o catálogo continua com 12 modalidades ativas;
- `/portal-escolas/multidesporto-demo` continua a mostrar 1 formato, 3 eventos, participantes, resultados e ranking.

## Regressão obrigatória

Validar:

- `/portal-escolas/modalidades`
- `/portal-escolas/competicoes`
- `/portal-escolas/multidesporto-demo`
- `/portal-escolas/painel`
- `/portal-escolas/jogos`
- `/portal-escolas/resultados`
