# PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-READONLY-1

Este pacote faz uma fase **read-only** para diagnosticar a ponte entre o modelo atual do Portal das Escolas e a camada multidesporto nova.

Não altera páginas.
Não altera UI.
Não altera helpers.
Não mexe no backoffice principal.
Não cria tabelas.
Não altera schema.
Não altera policies.
Não altera dados.
Não substitui `portal_games` / `portal_results`.

## Fase

`PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-READONLY-1`

## Branch

`portal-escolas-multidesporto-ponte-legado-readonly-1-20260628`

## Ficheiros incluídos

- `docs/portal-escolas-multidesporto-ponte-legado-readonly-1.md`
- `supabase/sql/portal-escolas-multidesporto-ponte-legado-diagnostico-1-20260628.sql`
- `supabase/sql/portal-escolas-multidesporto-ponte-legado-preview-1-20260628.sql`

## Ordem/timing recomendado

### 1. Confirmar branch local antes de aplicar o ZIP

Na pasta correta:

```powershell
cd C:\Users\silva\Documents\Codex\jornada-pt-final-auth-login-1-git
git branch --show-current
git status -sb
```

A branch tem de ser:

```text
portal-escolas-multidesporto-ponte-legado-readonly-1-20260628
```

O GitHub/browser mostrar a branch certa não chega. A branch local no PowerShell também tem de estar certa.

### 2. Aplicar ficheiros no projeto

Copiar os ficheiros para a raiz do projeto, mantendo os caminhos.

Confirmar antes de qualquer commit:

```powershell
git status --short -uall
git diff --stat
git diff --check
```

O esperado é aparecerem apenas estes ficheiros:

```text
README-APLICAR.md
docs/portal-escolas-multidesporto-ponte-legado-readonly-1.md
supabase/sql/portal-escolas-multidesporto-ponte-legado-diagnostico-1-20260628.sql
supabase/sql/portal-escolas-multidesporto-ponte-legado-preview-1-20260628.sql
```

### 3. Rever o diagnóstico/desenho

Ler primeiro:

```text
docs/portal-escolas-multidesporto-ponte-legado-readonly-1.md
```

Esta fase só deve confirmar a ponte conceptual/técnica. Não deve criar dados definitivos.

### 4. Executar diagnóstico read-only no Supabase

No Supabase SQL Editor, correr:

```text
supabase/sql/portal-escolas-multidesporto-ponte-legado-diagnostico-1-20260628.sql
```

Este SQL devolve verificações unificadas sobre:

- tabelas antigas;
- tabelas multidesporto novas;
- colunas necessárias;
- contagens;
- estado atual das tabelas novas;
- sugestão de formato para as competições existentes;
- prontidão para gerar eventos/resultados/rankings numa fase futura.

### 5. Executar preview read-only

Se o diagnóstico estiver coerente, correr:

```text
supabase/sql/portal-escolas-multidesporto-ponte-legado-preview-1-20260628.sql
```

Este SQL não escreve nada. Apenas mostra uma pré-visualização de ponte:

- competição antiga -> formato novo sugerido;
- `portal_games` -> candidatos a `portal_events`;
- participantes home/away -> candidatos a `portal_event_participants`;
- `portal_results` -> candidatos a `portal_result_entries`;
- resultados A/B -> preview de `portal_ranking_entries`.

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

```powershell
git status --short -uall
git diff --stat
git diff --cached --stat
git diff --cached --check
```

Não incluir ZIP no commit.

## Critério de paragem

Parar se acontecer qualquer uma destas situações:

- a branch local não é a branch desta fase;
- aparecem ZIPs na raiz do repositório;
- aparecem alterações fora dos ficheiros desta fase;
- algum SQL tenta executar `insert`, `update`, `delete`, `alter`, `create` ou `drop`;
- o diagnóstico mostra tabelas base em falta;
- a app visual muda sem ser esperado;
- o GitHub “Files changed” mostra ficheiros fora do escopo.

## Depois de produção validada

Só depois de PR merged, Vercel Ready e produção validada, criar manualmente o safe-main/checkpoint.

Sugestão de nome, apenas se tudo estiver validado:

```text
safe-main-portal-ponte-legado-readonly-20260628
```
