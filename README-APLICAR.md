# PORTAL-ESCOLAS-MULTIDESPORTO-LEITURA-DEMO-READONLY-1

Fase: `PORTAL-ESCOLAS-MULTIDESPORTO-LEITURA-DEMO-READONLY-1`

Branch: `portal-escolas-multidesporto-leitura-demo-readonly-1-20260628`

## Objetivo

Criar a primeira leitura controlada dos dados demo multidesporto já materializados, sem substituir as páginas atuais do Portal das Escolas.

Esta fase adiciona uma página isolada e read-only para confirmar que a aplicação consegue ler:

- `portal_competition_formats`
- `portal_events`
- `portal_event_participants`
- `portal_result_entries`
- `portal_rankings`
- `portal_ranking_entries`

## O que esta fase faz

- Cria um helper server-only de leitura multidesporto demo.
- Cria uma página isolada em `/portal-escolas/multidesporto-demo`.
- Mantém autenticação e autorização do Portal das Escolas.
- Usa apenas leitura através de Supabase/RLS.
- Mostra formato, eventos, participantes, resultados por participante e ranking demo.
- Adiciona um SQL read-only de smoke test para validar os dados antes/depois do deploy.

## O que esta fase não faz

- Não substitui `/portal-escolas/jogos`.
- Não substitui `/portal-escolas/resultados`.
- Não altera a navegação interna existente.
- Não altera dados.
- Não altera schema.
- Não altera RLS/policies/grants.
- Não mexe no backoffice principal.
- Não mexe no modelo legado `portal_games` / `portal_results`.

## Ordem obrigatória

1. Confirmar branch local no PowerShell:

```powershell
git branch --show-current
git status -sb
```

Tem de estar em:

```txt
portal-escolas-multidesporto-leitura-demo-readonly-1-20260628
```

2. Aplicar apenas os ficheiros desta fase.

3. Confirmar no GitHub/PR que só existem os ficheiros esperados em “Files changed”.

4. Correr no Supabase SQL Editor:

```txt
supabase/sql/portal-escolas-multidesporto-leitura-demo-smoke-1-20260628.sql
```

5. Validar que o smoke test retorna tudo `ok`.

6. Só depois fazer merge.

7. Depois de Vercel Ready, validar diretamente:

```txt
https://www.jornada.pt/portal-escolas/multidesporto-demo
```

## Ficheiros desta fase

```txt
README-APLICAR.md
docs/portal-escolas-multidesporto-leitura-demo-readonly-1.md
lib/portal-escolas/readPortalMultisportDemo.ts
app/portal-escolas/multidesporto-demo/page.tsx
supabase/sql/portal-escolas-multidesporto-leitura-demo-smoke-1-20260628.sql
```

## Validação esperada

A página nova deve abrir apenas para utilizadores autorizados do Portal das Escolas e apresentar:

- 1 formato demo;
- 3 eventos;
- 6 participantes de evento;
- 4 entradas de resultado;
- 1 ranking;
- 4 linhas de ranking.

As páginas atuais do Portal devem continuar visualmente iguais.
