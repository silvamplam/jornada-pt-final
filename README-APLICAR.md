# PORTAL-ESCOLAS-MULTIDESPORTO-FORMATOS-COMPETICAO-1

Este pacote prepara a camada de **formatos de competição** e **classificações/rankings** do Portal das Escolas.

É uma fase técnica/controlada.

Não altera páginas.
Não altera UI.
Não altera helpers.
Não mexe no backoffice principal.
Não remove nem substitui `portal_games` / `portal_results`.
Não remove nem substitui `portal_competitions.format`.

## Fase

`PORTAL-ESCOLAS-MULTIDESPORTO-FORMATOS-COMPETICAO-1`

## Branch

`portal-escolas-multidesporto-formatos-competicao-1-20260628`

## Ficheiros incluídos

- `docs/portal-escolas-multidesporto-formatos-competicao-1.md`
- `supabase/sql/portal-escolas-multidesporto-formatos-preflight-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formatos-schema-proposta-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-formatos-postflight-1-20260628.sql`

## Ordem/timing recomendado

### 1. Aplicar ficheiros no projeto

Copiar estes ficheiros para a raiz do projeto, mantendo os caminhos.

Confirmar antes de qualquer commit:

```bash
git status --short -uall
git diff --stat
```

O esperado é aparecerem apenas estes 4 ficheiros novos.

### 2. Rever o diagnóstico/desenho

Ler primeiro:

```text
docs/portal-escolas-multidesporto-formatos-competicao-1.md
```

Esta fase só faz sentido se a leitura confirmar a decisão conceptual:

```text
Modalidade -> Competição -> Formato -> Evento/Resultado -> Classificação/Ranking
```

### 3. Executar preflight no Supabase

No Supabase SQL Editor, correr:

```text
supabase/sql/portal-escolas-multidesporto-formatos-preflight-1-20260628.sql
```

Só avançar se o preflight confirmar:

- tabelas base do Portal presentes;
- tabelas multidesporto anteriores presentes;
- `portal_can_select_scope` presente;
- ausência de conflito grave com as novas tabelas.

### 4. Executar schema apenas se o preflight estiver coerente

Se o preflight estiver OK, correr:

```text
supabase/sql/portal-escolas-multidesporto-formatos-schema-proposta-1-20260628.sql
```

Este SQL é idempotente e não destrutivo.

Cria a proposta de camada formal:

- `portal_competition_format_catalog`
- `portal_competition_formats`
- `portal_rankings`
- `portal_ranking_entries`

### 5. Executar postflight

Depois do schema, correr:

```text
supabase/sql/portal-escolas-multidesporto-formatos-postflight-1-20260628.sql
```

Validar:

- tabelas criadas;
- colunas-chave presentes;
- seeds de formatos presentes;
- RLS ativo;
- policies SELECT criadas;
- grants SELECT para `authenticated`.

### 6. Teste local/preview/produção

Como esta fase não altera app visual, o teste esperado é regressivo:

- `/portal-escolas/painel`
- `/portal-escolas/competicoes`
- `/portal-escolas/jornadas`
- `/portal-escolas/jogos`
- `/portal-escolas/resultados`
- `/portal-escolas/conteudos`

Tudo deve continuar igual.

### 7. Antes de commit/push

Confirmar:

```bash
git status --short -uall
git diff --stat
git diff --cached --stat
git diff --cached --check
```

Não incluir ZIP no commit.

## Critério de paragem

Parar se acontecer qualquer uma destas situações:

- o preflight falha em tabelas base;
- `portal_can_select_scope` não existe;
- o SQL tenta remover/alterar tabelas antigas;
- aparecem alterações fora destes 4 ficheiros;
- a app visual muda sem ser esperado;
- o GitHub “Files changed” mostra ficheiros fora do escopo.

## Depois de produção validada

Só depois de PR merged, Vercel Ready e produção validada, criar manualmente o safe-main/checkpoint.

Sugestão de nome, apenas se tudo estiver validado:

```text
safe-main-portal-multidesporto-formatos-competicao-20260628
```
