# Jornada.pt - Preparacao para API futura

Nesta fase o Jornada.pt continua manual. O objetivo deste passo e apenas impedir que a base fique presa a uma logica manual.

## Separacao principal

### Dados objetivos

Podem vir de:

- backoffice manual;
- API externa futura;
- modelo misto, quando a API alimenta a base e o administrador corrige alguns campos.

Exemplos: competicoes, epocas, jornadas, equipas, jogos, resultados, minutos, classificacoes, golos e eventos.

### Camada editorial

Continua sempre controlada pelo administrador.

Exemplos: manchetes, titulos, subtitulos, textos, imagens, videos, destaques, prioridade editorial, SEO e associacoes entre noticia, jogo, jornada e competicao.

## Campos de sincronizacao

As tabelas objetivas principais ficam preparadas com:

- `data_source`: `manual`, `api` ou `mixed`;
- `external_provider`: nome da futura API;
- `external_id`: identificador externo;
- `external_match_id`: identificador externo especifico de jogo, quando existir;
- `last_synced_at`: ultima sincronizacao;
- `sync_status`: estado tecnico da sincronizacao;
- `manual_override`: indica que uma correcao manual deve ser respeitada.

## Regras futuras

- Um jogo criado no backoffice nasce como `manual`.
- Um jogo importado por API nascera como `api`.
- Um jogo vindo da API e corrigido pelo administrador passa para `mixed`.
- Quando `manual_override = true`, a sincronizacao futura nao deve substituir os campos protegidos manualmente.

## O que ja fica preparado

- A base de dados aceita metadados de origem e sincronizacao.
- O backoffice de jogos consegue mostrar se o dado e manual, API ou misto.
- A edicao manual continua a funcionar mesmo quando houver API.
- A camada editorial permanece separada dos dados automaticos.

## O que fica para depois

- Escolher fornecedor de API.
- Criar tarefas de importacao/sincronizacao.
- Definir campo a campo o que pode ser substituido automaticamente.
- Criar historico de sincronizacoes e relatorios de conflito.
