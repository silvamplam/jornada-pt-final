# Portal das Escolas — Formatos de Competição e Classificações 1

## Fase

`PORTAL-ESCOLAS-MULTIDESPORTO-FORMATOS-COMPETICAO-1`

## Objetivo

Desenhar e preparar a camada formal de **formatos de competição** e **classificações/rankings** antes de ligar as páginas do Portal das Escolas às novas tabelas multidesporto.

Esta fase não deve mexer em UI.
Esta fase não deve substituir `portal_games` / `portal_results`.
Esta fase não deve alterar o backoffice principal da Jornada.pt.

## Diagnóstico read-only feito sobre a branch

A branch já contém a fundação multidesporto anterior:

- `portal_modality_catalog`
- `portal_modalities`
- `portal_competition_categories`
- `portal_events`
- `portal_event_participants`
- `portal_result_entries`

Também mantém o modelo antigo/intacto:

- `portal_competitions.modality`
- `portal_competitions.format`
- `portal_stages`
- `portal_games`
- `portal_results`

As páginas atuais do Portal continuam assentes no modelo antigo:

- `lib/portal-escolas/readPortalCompetitions.ts` lê `portal_competitions.modality` e `portal_competitions.format` como texto;
- `lib/portal-escolas/readPortalStages.ts` lê `portal_stages`;
- `lib/portal-escolas/readPortalGames.ts` lê `portal_games` e `portal_results`;
- `lib/portal-escolas/readPortalResults.ts` lê `portal_games` e `portal_results`;
- `lib/portal-escolas/readPortalDashboard.ts` resume competições, jornadas/fases, jogos, resultados e conteúdos do modelo atual.

Conclusão do diagnóstico:

```text
A base já suporta modalidade/evento/resultado genérico, mas ainda não tem uma camada formal para explicar que tipo de competição está a ser disputada nem uma camada agregada de classificação/ranking.
```

## Problema a resolver

Modalidade não é formato.
Resultado de evento não é classificação.

Exemplo:

```text
Modalidade: Atletismo
Competição: Corta-mato Escolar
Formato: prova + tempos + ranking por escalão
Evento: Prova Infantil Masculina
Resultado: tempo/posição por aluno
Classificação: ranking final por aluno ou por escola
```

Outro exemplo:

```text
Modalidade: Andebol
Competição: Campeonato Interturmas
Formato: jornadas + jogos + classificação por pontos
Evento: 8.º A vs 8.º B
Resultado: marcador A/B
Classificação: tabela com pontos, vitórias, empates, derrotas, golos
```

Sem a camada de formatos/classificações, a app fica com duas limitações:

1. sabe guardar eventos/resultados genéricos, mas não sabe que regras organizam a competição;
2. sabe guardar resultados por evento, mas não tem onde guardar uma classificação agregada, validada e publicável.

## Decisão conceptual

A estrutura correta deve passar a ser:

```text
Entidade
→ Contexto
→ Modalidade
→ Competição
→ Formato de competição
→ Categoria/Escalão
→ Fase/Jornada/Ronda/Prova
→ Evento
→ Participantes do evento
→ Resultados do evento
→ Classificação/Ranking
```

## O que continua igual

Continuam válidos e necessários:

- jornadas;
- jogos frente-a-frente;
- resultados A/B;
- classificações por pontos;
- vitórias/empates/derrotas;
- golos/cestos/marcadores;
- jogos casa/fora quando fizer sentido.

Mas isto passa a ser um formato oficial entre vários, não a base universal.

## Camada 1 — Catálogo de formatos

Tabela proposta:

```text
portal_competition_format_catalog
```

Serve para guardar formatos canónicos reutilizáveis:

- campeonato por jornadas;
- liga todos contra todos;
- eliminatória/taça;
- grupos + eliminatórias;
- torneio suíço;
- meeting de provas;
- prova única por tempos/marcas;
- ranking por pontos;
- competição multi-evento.

Esta tabela é catálogo. Não representa uma competição concreta de uma escola.

## Camada 2 — Formato aplicado a uma competição

Tabela proposta:

```text
portal_competition_formats
```

Representa o formato configurado para uma competição concreta.

Pode estar ligado a:

- competição inteira;
- categoria/escalão;
- fase/jornada/ronda;
- modalidade;
- contexto.

Isto permite casos simples e complexos.

Exemplo simples:

```text
Competição: Campeonato Interturmas de Futsal
Formato: jornadas + jogos + classificação por pontos
Escopo: competition
```

Exemplo complexo:

```text
Competição: Torneio Escolar
Fase 1: grupos
Fase 2: eliminatórias
```

Neste caso podem existir várias linhas em `portal_competition_formats`, uma por fase/formato.

## Camada 3 — Classificação/Ranking

Tabela proposta:

```text
portal_rankings
```

É o cabeçalho de uma classificação/ranking.

Exemplos:

- Classificação geral do campeonato;
- Ranking final do corta-mato;
- Ranking por prova;
- Classificação por equipas/escolas;
- Classificação de grupo;
- Tabela de fase;
- Ranking individual por pontos.

A palavra `ranking` foi escolhida por ser mais neutra do que `standing`.

Em português, isto continua a aparecer como:

```text
Classificação
Ranking
Tabela
```

conforme o contexto.

## Camada 4 — Linhas da classificação/ranking

Tabela proposta:

```text
portal_ranking_entries
```

Cada linha representa um participante dentro de uma classificação.

Pode conter métricas de desportos coletivos:

- jogos;
- vitórias;
- empates;
- derrotas;
- pontos;
- golos/pontos marcados;
- golos/pontos sofridos;
- diferença;
- sets;
- cestos;
- penalizações.

E também métricas de provas individuais:

- posição;
- tempo;
- marca;
- distância;
- medalha;
- pontos;
- desempates;
- resultado textual.

## Porque não usar só `portal_result_entries`

`portal_result_entries` é resultado de evento.

Exemplos:

```text
Aluno A correu 1000m em 03:42.120
Equipa A venceu Equipa B por 4-2
Jogador A venceu Jogador B por 1-0
```

`portal_rankings` / `portal_ranking_entries` são agregação/classificação.

Exemplos:

```text
1.º lugar — Aluno A — 03:42.120
1.º lugar — Turma 8.º A — 12 pontos
1.º lugar — Escola X — 48 pontos
```

Separar estas camadas evita misturar resultados brutos com classificações calculadas, corrigidas ou validadas.

## Relação com `portal_games` / `portal_results`

O modelo antigo continua válido para o formato:

```text
jornadas + jogos frente-a-frente + resultado A/B
```

A camada nova permite duas estratégias futuras:

### Estratégia A — convivência

O Portal continua a ler `portal_games` / `portal_results` para jogos A/B.

As classificações podem ser guardadas em `portal_rankings` / `portal_ranking_entries`.

### Estratégia B — convergência gradual

No futuro, jogos A/B também podem ser representados como:

```text
portal_events.type = match
portal_event_participants.role = home / away
portal_result_entries = resultado por equipa
```

Mas isto não deve ser feito nesta fase.

## Relação com permissões/RLS

As permissões atuais estão baseadas em:

```text
portal_entity_id
portal_context_id
portal_competition_id
```

A proposta mantém essa lógica.

As novas tabelas de formatos e rankings ficam protegidas por `portal_can_select_scope`, tal como as tabelas anteriores do Portal.

Não se cria permissão por modalidade nesta fase.

## Seeds de formatos propostos

A proposta SQL inclui formatos canónicos mínimos:

- `matchdays_table`
- `round_robin_league`
- `knockout_cup`
- `groups_then_knockout`
- `swiss_tournament`
- `event_meeting`
- `race_ranking`
- `field_event_ranking`
- `points_ranking`
- `multi_event_points`

Estes códigos não são dados de uma escola. São catálogo canónico.

## Riscos identificados

### Risco 1 — duplicar conceitos

Já existe `portal_competitions.format` como texto.

Mitigação:

- não remover;
- não alterar;
- tratar como legado/fallback;
- criar camada formal paralela.

### Risco 2 — confundir evento com classificação

`portal_result_entries.rank` pode guardar posição dentro de um evento.

Mas não deve substituir rankings agregados.

Mitigação:

- `portal_result_entries` fica para resultado bruto/validado do evento;
- `portal_rankings` / `portal_ranking_entries` ficam para classificação agregada.

### Risco 3 — impor formato futebol a modalidades individuais

Mitigação:

- `portal_competition_formats` permite `event_meeting`, `race_ranking`, `field_event_ranking`, `multi_event_points`;
- `portal_ranking_entries` aceita tempo, distância, marca textual, pontos, medalha e métricas específicas em JSON.

### Risco 4 — mexer cedo demais na UI

Mitigação:

- esta fase não altera páginas;
- a ligação visual fica para fase própria depois do schema validado.

## Próximas fases recomendadas

### Fase seguinte A — validação do schema de formatos/rankings

Executar preflight, schema e postflight.

Sem app.
Sem UI.

### Fase seguinte B — leitura read-only de formatos

Criar helper e talvez página interna apenas depois do schema estar validado:

```text
lib/portal-escolas/readPortalCompetitionFormats.ts
```

Possível página futura:

```text
app/portal-escolas/formatos/page.tsx
```

### Fase seguinte C — leitura read-only de classificações/rankings

Criar helper e página read-only:

```text
lib/portal-escolas/readPortalRankings.ts
app/portal-escolas/classificacoes/page.tsx
```

### Fase seguinte D — ligação gradual a competições/resultados

Só depois das leituras read-only estarem estáveis.

## Conclusão

A próxima camada necessária é mesmo formatos + classificações/rankings.

O schema multidesporto anterior criou a fundação de modalidades, eventos e resultados genéricos.

Esta fase acrescenta a peça que faltava:

```text
como a competição funciona
+
como se apresenta a classificação final/intermédia
```

Isto preserva futebol/futsal/andebol/basquetebol/voleibol com jornadas e jogos, mas permite também atletismo, natação, xadrez, ginástica, corta-mato e rankings por tempos/marcas/pontos sem remendos.
