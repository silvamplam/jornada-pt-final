# Jornada.pt - Fontes e dados

Esta pagina define como o Jornada.pt deve lidar com informacao externa.

## Dados objetivos

Para resultados, calendarios, classificacoes e eventos, o ideal e usar APIs.

Tipos de dados:

- calendario de jogos;
- resultados;
- estado do jogo;
- marcadores;
- classificacoes;
- estatisticas;
- canais TV, quando disponiveis.

## Conteudo editorial

Noticias de outros sites nao devem ser copiadas.

O processo correto:

- guardar link da fonte;
- escrever titulo proprio;
- escrever resumo proprio;
- associar ao jogo/jornada/competicao;
- usar imagem com permissao ou imagem propria;
- publicar como contexto do Jornada.pt.

## Politica recomendada

- Nunca copiar artigos completos.
- Nunca usar imagens sem direito claro.
- Usar fontes como referencia, nao como copia.
- Guardar sempre URL da fonte.
- Separar dado objetivo de opiniao/editorial.

## Primeira fase pratica

Antes de pagar uma API, testar com:

- dados simulados;
- atualizacao manual no backoffice;
- uma API gratuita ou barata para uma competicao;
- validacao do fluxo editorial.

## Preparacao para API futura

Mesmo na fase manual, os dados objetivos devem guardar a sua origem.

Regras:

- `data_source = manual`: criado ou mantido no backoffice.
- `data_source = api`: importado diretamente de uma API futura.
- `data_source = mixed`: veio de API, mas foi corrigido ou completado manualmente.
- `manual_override = true`: a sincronizacao futura nao deve apagar a correcao manual.

A API futura deve alimentar apenas dados objetivos. A decisao editorial continua no Jornada.pt.
