# Portal das Escolas — Ponte Legado Multidesporto Read-Only 1

## Fase

`PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-READONLY-1`

## Objetivo

Diagnosticar, sem alterar dados, schema ou UI, como o modelo atual do Portal das Escolas pode coexistir e ser mapeado para a camada multidesporto nova.

Modelo atual usado pelas páginas:

```text
portal_competitions
portal_stages
portal_games
portal_results
portal_content_submissions
```

Modelo novo já preparado:

```text
portal_modalities
portal_competition_categories
portal_events
portal_event_participants
portal_result_entries
portal_competition_formats
portal_rankings
portal_ranking_entries
```

Esta fase não executa a ponte. Apenas documenta e prepara a leitura segura.

## Diagnóstico read-only feito sobre o ZIP da branch

O ZIP da branch contém o projeto completo e continua a trazer pastas antigas/auxiliares no topo, nomeadamente:

```text
Jornada-pt-fix-classificacoes-contexto-v2
Jornada-pt-fix-classificacoes-contexto-v4
```

Essas pastas foram ignoradas para esta fase.

A análise focou-se apenas em:

```text
app/portal-escolas
lib/portal-escolas
docs
supabase/sql
```

## Estado atual da app

As páginas do Portal continuam a ler o modelo legado/controlado.

Ficheiros relevantes:

- `lib/portal-escolas/readPortalCompetitions.ts`
- `lib/portal-escolas/readPortalStages.ts`
- `lib/portal-escolas/readPortalGames.ts`
- `lib/portal-escolas/readPortalResults.ts`
- `lib/portal-escolas/readPortalParticipants.ts`
- `lib/portal-escolas/readPortalContentSubmissions.ts`
- `lib/portal-escolas/readPortalDashboard.ts`

Não foram encontradas referências diretas, nos helpers atuais do Portal, a:

```text
portal_events
portal_event_participants
portal_result_entries
portal_competition_formats
portal_rankings
portal_ranking_entries
portal_modality_id
portal_event_id
```

Conclusão:

```text
A UI atual ainda está totalmente apoiada no modelo legado de competições/jornadas/jogos/resultados. A camada multidesporto existe na base, mas ainda não é consumida pelas páginas.
```

## Ponte conceptual pretendida

A ponte deve ser feita por convivência, não por substituição brusca.

### Competição

Atual:

```text
portal_competitions
- modality text
- format text
```

Novo:

```text
portal_competitions.portal_modality_id
portal_competition_formats
portal_competition_format_catalog
```

Ponte futura provável:

```text
portal_competitions.modality/format
→ fallback textual legado

portal_competitions.portal_modality_id
→ modalidade formal

portal_competition_formats
→ formato formal da competição
```

Para o demo atual com jogos/jornadas/resultados A/B, o candidato natural é:

```text
matchdays_table
```

Mas esta fase não grava essa decisão.

### Jornada/Fase

Atual:

```text
portal_stages
```

Novo:

```text
portal_events.portal_stage_id
portal_rankings.portal_stage_id
portal_ranking_entries.portal_stage_id
```

Ponte futura:

```text
portal_stages
→ continua a representar jornada/fase/ronda
→ pode agrupar eventos
→ pode delimitar classificações parciais por fase
```

Não é necessário eliminar `portal_stages`.

### Jogo

Atual:

```text
portal_games
- home_participant_id
- away_participant_id
- scheduled_at
- venue
- status
```

Novo:

```text
portal_events
portal_event_participants
```

Ponte futura para jogos frente-a-frente:

```text
portal_games.id
→ metadata.legacy_portal_game_id em portal_events

portal_games.home_participant_id
→ portal_event_participants.role = home

portal_games.away_participant_id
→ portal_event_participants.role = away

portal_events.type
→ match
```

Esta fase não cria esses eventos. Apenas mostra o preview read-only.

### Resultado A/B

Atual:

```text
portal_results
- portal_game_id
- home_score
- away_score
- result_status
```

Novo:

```text
portal_result_entries
```

Ponte futura:

```text
resultado home
→ uma linha em portal_result_entries para o participante home

resultado away
→ uma linha em portal_result_entries para o participante away
```

Campos prováveis:

```text
score_numeric = home_score / away_score
outcome = win / draw / loss
points = 3 / 1 / 0, quando o formato for tabela por pontos
is_winner = true/false
metadata.legacy_portal_result_id
metadata.legacy_portal_game_id
```

Esta fase não grava estes resultados no modelo novo.

### Classificação

Atual:

```text
não há camada formal do Portal das Escolas para ranking agregado multidesporto
```

Novo:

```text
portal_rankings
portal_ranking_entries
```

Ponte futura para formato `matchdays_table`:

```text
portal_rankings
→ cabeçalho da classificação da competição

portal_ranking_entries
→ uma linha por participante/equipa/turma
```

Métricas possíveis:

```text
played
wins
draws
losses
points
score_for
score_against
score_difference
```

Para provas individuais, os mesmos conceitos deixam de ser tabela de jogos e passam a ranking por tempo/marca/pontos.

## Estratégia recomendada

### Fase atual

Apenas diagnóstico/read-only.

Entregar:

- documentação da ponte;
- SQL de diagnóstico;
- SQL de preview;
- nenhum dado novo;
- nenhuma alteração visual.

### Próxima fase possível

Se o diagnóstico e o preview forem validados:

```text
PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-SEED-1
```

Objetivo possível:

- criar um `portal_competition_formats` para a competição demo;
- eventualmente ligar `portal_competitions.portal_modality_id` se ainda estiver vazio;
- criar preview/seed controlado apenas para dados demo;
- ainda sem mudar UI.

### Fase posterior possível

Depois de dados ponte validados:

```text
PORTAL-ESCOLAS-MULTIDESPORTO-READERS-READONLY-1
```

Objetivo possível:

- criar helpers read-only que leem o modelo novo;
- manter fallback para o modelo antigo;
- ainda sem alterar UI de forma agressiva.

### Fase UI futura

Só depois:

```text
PORTAL-ESCOLAS-MULTIDESPORTO-UI-1
```

Objetivo possível:

- mostrar modalidade/formato formal;
- mostrar eventos/rankings quando existirem;
- manter páginas atuais a funcionar.

## Riscos identificados

### Risco 1 — duplicar dados sem rastreabilidade

Se forem criados eventos a partir de jogos, é obrigatório manter ligação ao legado em `metadata`.

Mitigação futura:

```text
metadata.legacy_portal_game_id
metadata.legacy_portal_result_id
```

### Risco 2 — quebrar páginas atuais

As páginas atuais ainda dependem de `portal_games` e `portal_results`.

Mitigação:

- não remover tabelas antigas;
- não mudar helpers atuais nesta fase;
- validar regressão visual.

### Risco 3 — aplicar formato errado

Nem toda competição com modalidade coletiva é necessariamente campeonato por jornadas.

Mitigação:

- usar `portal_competition_format_catalog`;
- guardar formato aplicado em `portal_competition_formats`;
- manter `portal_competitions.format` como fallback até migração validada.

### Risco 4 — confundir ranking com resultado

Resultado é evento.
Classificação é agregação.

Mitigação:

- `portal_result_entries` para resultado por evento;
- `portal_ranking_entries` para classificação agregada.

## Resultado esperado desta fase

No final desta fase deve ficar claro:

```text
1. Que dados legados existem.
2. Que formato novo lhes corresponde.
3. Que jogos podem ser eventos.
4. Que resultados podem ser result_entries.
5. Que classificação pode ser ranking/ranking_entries.
6. Que dados ainda faltam antes de uma seed segura.
```

## Critério de sucesso

A fase é bem-sucedida se:

- SQL de diagnóstico for read-only e devolver resultados coerentes;
- SQL de preview mostrar ponte possível;
- nada for escrito na base;
- nada mudar visualmente;
- GitHub “Files changed” mostrar apenas README, doc e SQLs da fase.
