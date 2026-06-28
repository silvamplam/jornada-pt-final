# PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1

## Estado antes da fase

A fase anterior, `PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-READONLY-1`, validou em modo read-only que o modelo legado atual consegue ser interpretado pela camada multidesporto nova.

O diagnóstico e o preview confirmaram:

- `Torneio Demo Interturmas` como competição candidata;
- 2 fases;
- 3 jogos legados;
- 2 resultados completos;
- 6 candidatos a participantes de evento;
- 4 candidatos a entradas de resultado;
- 4 candidatos a linhas de ranking/classificação.

## Objetivo desta fase

Materializar esses dados demo nas tabelas novas, sem remover nem substituir o modelo legado.

A materialização serve para validar a coexistência real entre:

Modelo legado:

```txt
portal_competitions -> portal_stages -> portal_games -> portal_results
```

Modelo multidesporto novo:

```txt
portal_competition_formats -> portal_events -> portal_event_participants -> portal_result_entries -> portal_rankings -> portal_ranking_entries
```

## Estratégia

A fase cria apenas dados derivados e identificáveis como demo/ponte legado.

Identificadores funcionais usados:

- formato demo: `code = legacy-demo-matchdays-table`;
- eventos: `slug = legacy-game-<uuid_sem_hifens>`;
- ranking: `slug = legacy-demo-league-table`;
- metadados com `legacy_bridge_phase = PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1`.

Isto permite:

- idempotência;
- auditoria manual;
- rollback controlado;
- evitar duplicados;
- preservar o modelo antigo intacto.

## Dados criados

### `portal_competition_formats`

Cria um formato configurado para o `Torneio Demo Interturmas`, ligado ao catálogo `matchdays_table`.

### `portal_events`

Cria 3 eventos do tipo `match`, um por cada `portal_game` legado.

### `portal_event_participants`

Cria 2 participantes por evento:

- `home`;
- `away`.

### `portal_result_entries`

Cria 2 entradas por resultado completo:

- score do participante;
- score sofrido em `metadata`;
- diferença de score em `metadata`;
- outcome;
- pontos.

### `portal_rankings`

Cria um ranking demo do tipo `league_table` para a competição.

### `portal_ranking_entries`

Cria linhas de classificação calculadas a partir dos resultados completos.

Critérios usados no ranking demo:

1. pontos;
2. diferença de score;
3. score a favor;
4. id do participante como desempate estável.

## Fora do escopo

Esta fase não liga a UI às tabelas novas.

As páginas atuais continuam a ler o modelo legado. A ligação visual/funcional à camada nova deve ser feita numa fase posterior, depois desta materialização demo estar validada.

## Risco

Risco controlado porque:

- não há alterações de schema;
- não há alterações de UI;
- não há alterações em dados legados;
- os inserts são idempotentes;
- todos os dados criados são identificáveis por `slug`, `code` e `metadata`;
- existe SQL de rollback específico para os dados desta fase.
