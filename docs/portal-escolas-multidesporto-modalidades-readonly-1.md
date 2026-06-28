# PORTAL-ESCOLAS-MULTIDESPORTO-MODALIDADES-READONLY-1

## Objetivo

Criar a primeira entrada read-only por modalidade no Portal das Escolas.

A página nova é:

`/portal-escolas/modalidades`

Esta fase deixa de tratar o multidesporto apenas como uma página demo e introduz uma organização por modalidade, sem substituir as páginas atuais de competições, jogos ou resultados.

## Princípio de arquitetura

A modalidade não é o formato.

A modalidade define o universo desportivo:

- Futebol
- Futsal
- Atletismo
- Natação
- Xadrez
- Voleibol
- Multidesporto

O formato define a mecânica competitiva:

- campeonato por jornadas;
- prova por tempos;
- prova por marcas;
- torneio suíço;
- ranking por pontos;
- séries e finais.

Esta fase respeita essa separação.

## Alterações feitas

1. Criada a página isolada `/portal-escolas/modalidades`.
2. Criado helper server-only `readPortalModalities`.
3. Adicionada entrada `Modalidades` à navegação interna do Portal.
4. A página lê modalidades formais quando existirem em `portal_modalities`.
5. Enquanto a ligação formal ainda não estiver completa, a página usa fallback controlado por `portal_competitions.modality`.
6. A página mostra ligação modalidade -> competições -> formato.
7. A página mostra o catálogo canónico de modalidades, quando disponível para leitura autenticada.

## Compatibilidade

A fase não remove nem substitui:

- `/portal-escolas/competicoes`
- `/portal-escolas/jogos`
- `/portal-escolas/resultados`
- `/portal-escolas/multidesporto-demo`

O modelo legado continua intacto.

## SQL incluído

### Grants

`supabase/sql/portal-escolas-multidesporto-modalidades-grants-1-20260628.sql`

Garante SELECT autenticado em:

- `portal_modality_catalog`
- `portal_modalities`

Isto é necessário porque o schema multidesporto criou RLS/policies para estas tabelas, mas a leitura autenticada precisa também do grant explícito.

### Smoke

`supabase/sql/portal-escolas-multidesporto-modalidades-smoke-1-20260628.sql`

Confirma read-only:

- tabelas esperadas;
- colunas usadas pela app;
- grants SELECT autenticados;
- policies SELECT;
- contagens de catálogo/modalidades/competições;
- preview de agrupamento por modalidade legacy.

## Fora do escopo

Não altera:

- dados;
- schema estrutural;
- RLS/policies;
- backoffice/admin;
- páginas públicas;
- páginas atuais de jogos/resultados/competições;
- criação/edição pelos utilizadores do Portal.

## Resultado esperado

Depois de aplicar, o Portal passa a ter uma entrada `Modalidades`.

A página deve mostrar:

- o âmbito ativo;
- as modalidades visíveis;
- se cada modalidade vem de ligação formal ou de fallback por competição;
- competições associadas a cada modalidade;
- formato legacy e formato formal, quando existir;
- catálogo canónico de modalidades.
