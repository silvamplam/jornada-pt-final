# Portal das Escolas — Arquitetura Multidesporto 1

## Estado atual diagnosticado

O Portal das Escolas já tem uma base isolada em tabelas `portal_`, mas o modelo ainda não é verdadeiramente multidesportivo.

A estrutura atual é essencialmente:

```text
Entidade
→ Contexto
→ Competição
→ Participantes
→ Fases/Jornadas
→ Jogos
→ Resultados
→ Conteúdos
```

Existe um campo simples em `portal_competitions`:

```text
modality text
```

Esse campo permite apresentar uma modalidade na competição, mas não cria uma camada formal, relacional e reutilizável.

## Limitação principal

O modelo atual de jogos e resultados está orientado para confrontos diretos:

```text
portal_games:
- home_participant_id
- away_participant_id

portal_results:
- home_score
- away_score
```

Isto serve bem para futebol, futsal, andebol, basquetebol e outros modelos frente-a-frente.

Não serve suficientemente bem para modalidades como:

- atletismo;
- natação;
- ginástica;
- corta-mato;
- provas por tempos;
- provas por marcas;
- provas com vários participantes no mesmo evento;
- provas com séries, eliminatórias e finais;
- modalidades com rankings por prova;
- estafetas;
- xadrez em formato suíço ou torneio multi-participante.

## Objetivo da arquitetura multidesporto

A arquitetura futura deve permitir:

```text
Entidade
→ Contexto
→ Modalidade
→ Competição
→ Escalão/Categoria
→ Fase
→ Evento/Prova/Jogo
→ Participantes do evento
→ Resultado por participante
→ Classificação
→ Conteúdo
```

A palavra central passa a ser **evento**.

Um evento pode ser:

- jogo de futebol;
- jogo de futsal;
- jogo de voleibol;
- partida de xadrez;
- prova de 100m;
- final de natação;
- prova de salto em comprimento;
- corrida de corta-mato;
- estafeta;
- exercício de ginástica;
- eliminatória;
- final.

## Princípio técnico

O modelo não deve obrigar todas as modalidades a caberem em `home` e `away`.

Em vez disso:

```text
portal_events
→ portal_event_participants
→ portal_result_entries
```

### Futebol/futsal

```text
portal_events.type = match
portal_event_participants = equipa A + equipa B
portal_result_entries = golos, vencedor, pontos
```

### Voleibol

```text
portal_events.type = match
portal_event_participants = equipa A + equipa B
portal_result_entries = sets, pontos por set, vencedor
```

### Atletismo

```text
portal_events.type = race / field_event
portal_event_participants = vários alunos/equipas
portal_result_entries = tempo, distância, posição, pontos
```

### Natação

```text
portal_events.type = race
portal_event_participants = vários nadadores/equipas
portal_result_entries = tempo, posição, recorde, pontos
```

### Xadrez

```text
portal_events.type = match / tournament_round
portal_event_participants = jogador A + jogador B ou vários jogadores
portal_result_entries = vitória/empate/derrota, pontos, ranking
```

## Camadas propostas

### 1. Catálogo de modalidades

Tabela proposta:

```text
portal_modality_catalog
```

Serve como catálogo canónico:

- futebol;
- futsal;
- atletismo;
- natação;
- voleibol;
- basquetebol;
- andebol;
- ténis de mesa;
- xadrez;
- badminton;
- ginástica;
- multi_sport;
- outras.

Permite manter códigos estáveis e evitar variações como:

```text
Futsal
futsal
FutSal
FUTSAL
```

### 2. Modalidades ativadas num contexto

Tabela proposta:

```text
portal_modalities
```

Esta tabela representa a modalidade ativa dentro de uma entidade/contexto.

Exemplo:

```text
Entidade: Agrupamento de Escolas de Gondomar
Contexto: Ano Letivo 2026/27
Modalidade: Atletismo
```

Isto permite que o mesmo contexto tenha várias modalidades organizadas:

```text
Ano Letivo 2026/27
- Futsal
- Atletismo
- Natação
- Xadrez
- Voleibol
```

### 3. Competição ligada à modalidade

A tabela atual `portal_competitions` mantém-se, mas ganha ligação opcional:

```text
portal_modality_id
```

O campo antigo:

```text
modality text
```

não deve ser removido já. Deve ficar como compatibilidade transitória.

Estratégia:

```text
Curto prazo:
- manter modality text;
- adicionar portal_modality_id;
- usar ambos sem quebrar UI atual.

Médio prazo:
- passar leituras para portal_modality_id;
- manter fallback em modality text.

Longo prazo:
- decidir se modality text fica só como legado ou se é removido numa migração controlada.
```

### 4. Escalões/categorias

Tabela proposta:

```text
portal_competition_categories
```

Serve para:

- sub-10;
- sub-12;
- infantis;
- iniciados;
- juvenis;
- masculinos;
- femininos;
- misto;
- 7.º ano;
- 8.º ano;
- turma;
- nível;
- grupo competitivo.

Isto é importante porque em contexto escolar as competições raramente são apenas “uma competição”. Normalmente têm escalões, sexos, anos, ciclos ou categorias.

### 5. Eventos/provas/jogos

Tabela proposta:

```text
portal_events
```

Substitui a ideia rígida de jogo como unidade universal.

O `portal_games` atual pode continuar a existir para compatibilidade e leitura das páginas já feitas.

A evolução natural é:

```text
portal_games = modelo legado/simples para A vs B
portal_events = modelo universal para multidesporto
```

### 6. Participantes por evento

Tabela proposta:

```text
portal_event_participants
```

Permite que um evento tenha:

- 2 participantes;
- 4 participantes;
- 8 participantes;
- 40 participantes;
- equipas;
- alunos individuais;
- turmas;
- escolas;
- estafetas.

### 7. Resultado por participante

Tabela proposta:

```text
portal_result_entries
```

Em vez de resultado único `home_score` / `away_score`, cada participante tem uma entrada de resultado.

Campos possíveis:

- posição;
- ranking;
- pontos;
- score numérico;
- score textual;
- tempo em milissegundos;
- distância em metros;
- marca textual;
- sets em JSON;
- tentativas em JSON;
- vencedor;
- empate;
- DNF;
- DNS;
- DQ;
- notas de validação;
- metadata JSON.

## Compatibilidade com o modelo atual

Esta fase não remove nem substitui:

- `portal_games`;
- `portal_results`;
- `portal_competitions.modality`.

O objetivo é criar uma fundação paralela e compatível.

O sistema atual continua a funcionar.

## Relação com permissões

As permissões atuais são:

```text
portal_entity_id
portal_context_id
portal_competition_id
```

Ainda não existe permissão por modalidade.

Decisão recomendada:

- não mexer já na função de autorização;
- permitir leitura de modalidades por escopo de entidade/contexto;
- tratar permissões por modalidade numa fase própria, se for mesmo necessário.

Na prática, enquanto a competição estiver ligada à modalidade, as permissões por competição continuam a funcionar.

## Relação com conteúdos

Os conteúdos atuais podem ligar-se a:

- entidade;
- contexto;
- competição;
- fase;
- jogo;
- participante.

Para multidesporto, será útil acrescentar futuramente:

- `portal_modality_id`;
- `portal_event_id`.

A proposta SQL inclui colunas opcionais para preparar essa ligação sem quebrar o modelo existente.

## Impacto futuro nas páginas

Depois de validar o schema, as páginas que terão impacto são:

```text
app/portal-escolas/competicoes/page.tsx
app/portal-escolas/participantes/page.tsx
app/portal-escolas/jogos/page.tsx
app/portal-escolas/resultados/page.tsx
app/portal-escolas/conteudos/page.tsx
app/portal-escolas/contextos/page.tsx
app/portal-escolas/funcionamento/page.tsx
```

Helpers prováveis:

```text
lib/portal-escolas/readPortalCompetitions.ts
lib/portal-escolas/readPortalParticipants.ts
lib/portal-escolas/readPortalGames.ts
lib/portal-escolas/readPortalResults.ts
lib/portal-escolas/readPortalContentSubmissions.ts
lib/portal-escolas/readPortalDashboard.ts
```

## Fases recomendadas

### Fase 1 — arquitetura e SQL proposta

Pacote atual.

Sem app. Sem UI. Sem commit de funcionalidade.

### Fase 2 — schema mínimo executado e validado

Executar SQL em ambiente controlado.

Confirmar:

- tabelas criadas;
- colunas adicionadas;
- índices;
- policies se aplicáveis;
- sem impacto nas páginas atuais.

### Fase 3 — leitura read-only de modalidades

Criar helper:

```text
lib/portal-escolas/readPortalModalities.ts
```

Criar página read-only:

```text
app/portal-escolas/modalidades/page.tsx
```

Adicionar navegação interna.

### Fase 4 — competições com modalidade formal

Atualizar `readPortalCompetitions` para ler:

```text
portal_competitions.portal_modality_id
portal_modalities.name
portal_modality_catalog.code
```

Manter fallback em:

```text
portal_competitions.modality
```

### Fase 5 — eventos/provas read-only

Criar leitura de `portal_events`, sem substituir ainda `portal_games`.

### Fase 6 — resultados multiformato read-only

Criar leitura de `portal_result_entries`.

### Fase 7 — backoffice/edição

Só depois de tudo acima estar estável.

## Conclusão

A integração multidesporto é viável e deve ser a próxima preocupação estrutural.

Não é demasiado difícil agora porque o Portal das Escolas ainda está isolado e relativamente recente.

Ficará difícil se continuarem a ser criadas funcionalidades novas em cima do modelo rígido:

```text
home_participant_id
away_participant_id
home_score
away_score
```

A recomendação é congelar novas evoluções funcionais do Portal até a fundação multidesporto estar decidida e testada.
