# PORTAL-ESCOLAS-MULTIDESPORTO-FORMALIZAR-MODALIDADE-DEMO-1

## Objetivo

Formalizar a primeira modalidade demo no Portal das Escolas.

A fase anterior criou a página `/portal-escolas/modalidades`, que conseguia ler modalidades formais quando existissem e, enquanto isso, usar fallback por `portal_competitions.modality`.

Esta fase deixa de depender apenas desse fallback para a competição demo.

## Decisão de arquitetura

A modalidade formal fica na camada:

`Entidade -> Contexto -> Modalidade`

A competição passa a apontar para essa modalidade:

`Modalidade -> Competição -> Formato -> Evento -> Resultado -> Ranking`

Isto confirma que o futebol não é o modelo-base. O modelo-base é multidesporto e cada modalidade pode ter formatos próprios.

## Dados demo formalizados

Âmbito demo esperado:

- Entidade: `Entidade Demo Escolar`
- Contexto: `Ano Letivo Demo 2026/27`
- Competição: `Torneio Demo Interturmas`
- Modalidade legacy: `Multidesporto`
- Catálogo formal: `multi_sport` / `Multidesporto`

## Alterações de dados

A fase:

1. cria uma linha em `portal_modalities`, se ainda não existir, para `Multidesporto` no contexto demo;
2. associa `portal_competitions.portal_modality_id` à modalidade formal;
3. propaga o mesmo `portal_modality_id` para linhas multidesporto demo já materializadas.

Tabelas abrangidas na propagação:

- `portal_competitions`
- `portal_competition_formats`
- `portal_competition_categories`, se houver linhas
- `portal_events`
- `portal_event_participants`
- `portal_result_entries`
- `portal_rankings`
- `portal_ranking_entries`

## Compatibilidade legacy

A fase não remove nem altera o valor textual:

`portal_competitions.modality = 'Multidesporto'`

Esse campo continua disponível como compatibilidade transitória.

## Fora do escopo

Não altera:

- UI;
- helpers TypeScript;
- schema estrutural;
- RLS/policies/grants;
- backoffice/admin;
- páginas públicas;
- páginas atuais de jogos/resultados/competições;
- criação/edição pelos utilizadores do Portal.

## Resultado esperado

Depois da aplicação:

- `portal_modalities` passa a ter 1 modalidade formal demo;
- a competição demo passa a ter `portal_modality_id` preenchido;
- os eventos, participantes de evento, resultados e rankings materializados passam a transportar a modalidade formal;
- `/portal-escolas/modalidades` deve passar a mostrar a modalidade como formal, não apenas como fallback legacy;
- `/portal-escolas/multidesporto-demo` deve continuar igual visualmente.
