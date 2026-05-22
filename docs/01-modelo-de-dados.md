# Jornada.pt - Modelo de dados

Este modelo e a base para a futura base de dados. A ideia central e que cada conteudo editorial fique ligado ao evento competitivo certo.

## Entidades principais

### Competition

Representa uma competicao.

Campos principais:

- id
- nome
- slug
- pais
- logotipo
- cor
- ativo
- data_source
- external_provider
- external_id
- last_synced_at
- sync_status
- manual_override

Exemplos: Premier League, Liga Portugal, La Liga, Champions.

### Season

Representa uma epoca dentro de uma competicao.

Campos principais:

- id
- competition_id
- nome
- data_inicio
- data_fim
- atual
- data_source
- external_provider
- external_id
- last_synced_at
- sync_status
- manual_override

Exemplo: 2024/25.

### Matchday

Representa a unidade narrativa principal do Jornada.pt.

Campos principais:

- id
- season_id
- numero
- nome
- data_inicio
- data_fim
- estado
- resumo_contextual
- data_source
- external_provider
- external_id
- last_synced_at
- sync_status
- manual_override

Uma jornada deve conseguir mostrar resultados, classificacao, noticias, manchete, golos e proximos jogos daquele momento.

### Team

Representa um clube ou selecao.

Campos principais:

- id
- nome
- nome_curto
- slug
- pais
- emblema
- cor
- data_source
- external_provider
- external_id
- last_synced_at
- sync_status
- manual_override

### Match

Representa um jogo.

Campos principais:

- id
- competition_id
- season_id
- matchday_id
- home_team_id
- away_team_id
- estado
- minuto
- data_hora
- resultado_casa
- resultado_fora
- estadio
- canal_tv_id
- data_source
- external_provider
- external_id
- external_match_id
- last_synced_at
- sync_status
- manual_override

Estados possiveis:

- scheduled
- live
- halftime
- finished
- postponed
- cancelled

### Standing

Representa a classificacao num momento concreto.

Campos principais:

- id
- competition_id
- season_id
- matchday_id
- generated_at
- label_momento
- data_source
- external_provider
- external_id
- last_synced_at
- sync_status
- manual_override

### StandingRow

Linha da classificacao.

Campos principais:

- standing_id
- team_id
- posicao
- jogos
- vitorias
- empates
- derrotas
- golos_marcados
- golos_sofridos
- diferenca_golos
- pontos
- jogos_casa
- vitorias_casa
- empates_casa
- derrotas_casa
- jogos_fora
- vitorias_fora
- empates_fora
- derrotas_fora

### Article

Representa uma noticia ou texto editorial.

Campos principais:

- id
- titulo
- resumo
- corpo
- imagem
- fonte_url
- estado_publicacao
- published_at
- competition_id
- season_id
- matchday_id
- match_id

Uma noticia pode tambem ficar associada a clubes, jogadores e eventos.

### Headline

Representa a manchete principal de uma jornada, competicao ou homepage.

Campos principais:

- id
- titulo
- resumo
- imagem
- competition_id
- season_id
- matchday_id
- match_id
- article_id
- prioridade
- estado_publicacao

### Event

Representa um acontecimento competitivo.

Campos principais:

- id
- match_id
- minuto
- tipo
- titulo
- team_id
- player_id

Tipos possiveis:

- goal
- card
- substitution
- var
- injury
- context

### Goal

Representa um golo.

Campos principais:

- id
- match_id
- team_id
- player_id
- minuto
- penalty
- own_goal

### LiveUpdate

Representa uma atualizacao ao minuto.

Campos principais:

- id
- competition_id
- season_id
- matchday_id
- match_id
- minuto_label
- titulo
- tom
- created_at

### BroadcastChannel

Representa canal/plataforma onde passa o jogo.

Campos principais:

- id
- nome
- plataforma
- pais
- logotipo

## Regra de ouro

Nenhum conteudo editorial importante deve existir isolado.

Sempre que possivel, deve apontar para:

- competicao
- epoca
- jornada
- jogo
- clube
- jogador
- resultado
- classificacao daquele momento

## Jornada como entidade forte

A jornada nao deve ser tratada como um simples numero dentro de um jogo. Ela e uma entidade propria porque organiza a leitura competitiva do site.

Cada jornada pode ter:

- titulo editorial;
- resumo editorial;
- resumo contextual;
- imagem principal;
- video;
- ordem de apresentacao;
- destaque;
- memoria historica;
- SEO;
- jogos associados;
- noticias associadas;
- manchetes associadas;
- classificacao associada.

Isto permite que uma pagina de jornada explique nao so o que aconteceu, mas porque aquele conjunto de jogos teve importancia dentro da competicao.
