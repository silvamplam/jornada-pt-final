# Portal das Escolas — Multidesporto — Schema Validação 1

## Objetivo

Validar de forma controlada a introdução da fundação multidesporto no Supabase, antes de qualquer alteração visual ou funcional no Portal das Escolas.

Esta fase existe para confirmar que o schema proposto na fase anterior pode ser aplicado com segurança e que os objetos criados ficam visíveis/consistentes.

## Fora do escopo

Esta fase não altera:

- páginas do Portal das Escolas;
- helpers de leitura;
- APIs;
- backoffice;
- middleware;
- autenticação global;
- RLS existente das tabelas antigas;
- páginas públicas;
- dados competitivos existentes;
- `portal_games`;
- `portal_results`.

Também não remove nem substitui:

- `portal_competitions.modality`;
- `portal_games.home_participant_id`;
- `portal_games.away_participant_id`;
- `portal_results.home_score`;
- `portal_results.away_score`.

## Ficheiro de schema a aplicar

O ficheiro a aplicar no Supabase é o já introduzido na fase anterior:

```text
supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql
```

Este ficheiro é idempotente e não destrutivo na intenção:

- cria tabelas novas se não existirem;
- adiciona colunas opcionais se não existirem;
- cria índices se não existirem;
- ativa RLS nas tabelas novas;
- cria policies de leitura para utilizadores autenticados/autorizados;
- insere catálogo canónico de modalidades com `on conflict do nothing`.

## Ordem de validação no Supabase

### 1. Preflight

Correr:

```text
supabase/sql/portal-escolas-multidesporto-preflight-1-20260628.sql
```

Confirmar:

- tabelas base do Portal existem;
- `portal_can_select_scope` existe;
- `portal_competitions.modality` existe;
- ainda não existem, ou podem já existir por aplicação anterior, as novas tabelas multidesporto;
- não há erro de permissões no SQL Editor.

### 2. Aplicação do schema proposto

Correr:

```text
supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql
```

Se houver erro, parar. Não avançar para app.

### 3. Postflight

Correr:

```text
supabase/sql/portal-escolas-multidesporto-postflight-1-20260628.sql
```

Confirmar:

- as tabelas novas existem;
- as colunas opcionais foram adicionadas;
- RLS está ativo nas tabelas novas;
- policies de leitura existem;
- o catálogo canónico tem modalidades base;
- os índices principais existem;
- `portal_competitions.modality` continua presente.

## Objetos esperados após aplicação

### Tabelas novas

```text
portal_modality_catalog
portal_modalities
portal_competition_categories
portal_events
portal_event_participants
portal_result_entries
```

### Colunas novas opcionais

```text
portal_competitions.portal_modality_id
portal_content_submissions.portal_modality_id
portal_content_submissions.portal_event_id
```

### Catálogo inicial esperado

```text
football
futsal
basketball
handball
volleyball
athletics
swimming
table_tennis
badminton
chess
gymnastics
multi_sport
```

## Critério de aceitação

A fase pode ser considerada validada se:

1. O preflight não levantar bloqueios.
2. O schema proposto correr sem erro.
3. O postflight confirmar tabelas, colunas, policies, RLS, índices e seeds.
4. A aplicação existente continuar operacional.
5. O Portal das Escolas continuar a abrir normalmente.
6. Não houver alterações visuais inesperadas.

## Critério de paragem

Parar se ocorrer qualquer um destes pontos:

- erro ao criar FK;
- tabela base ausente;
- função `portal_can_select_scope` ausente;
- policy esperada ausente depois do postflight;
- `portal_competitions.modality` desaparece ou é alterado;
- app deixa de abrir;
- erro de build inesperado;
- alteração visual inesperada.

## Próxima fase depois desta

Só depois desta validação faz sentido avançar para leitura read-only na app:

```text
PORTAL-ESCOLAS-MULTIDESPORTO-READONLY-1
```

Essa próxima fase deve ler e mostrar a camada formal de modalidades, mas ainda sem edição.
