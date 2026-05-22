# Jornada.pt - Backoffice

O backoffice deve permitir gerir o Jornada.pt sem editar codigo.

## Objetivo

Uma pessoa deve conseguir sentar-se ao computador e:

- escolher uma competicao;
- escolher uma jornada;
- atualizar jogos e resultados;
- escolher manchete principal;
- criar ou editar noticias;
- associar noticias a jogos, clubes e jogadores;
- rever classificacao;
- publicar a pagina.

## Menus principais

### Painel inicial

Resumo do dia:

- jogos em direto;
- jogos por atualizar;
- noticias por publicar;
- manchetes em falta;
- importacoes recentes;
- alertas.

### Competicoes

Permite gerir:

- nome;
- slug;
- logo;
- cor;
- pais;
- epocas ativas.

### Jornadas

Permite gerir:

- competicao;
- epoca;
- numero da jornada;
- intervalo de datas;
- estado;
- resumo contextual;
- manchete ligada.

Nesta fase, o backoffice de jornadas tambem deve permitir gerir:

- titulo editorial;
- resumo editorial;
- imagem principal;
- video;
- ordem;
- destaque;
- memoria historica;
- SEO;
- contagem de jogos, noticias e manchetes ligadas.

A ideia e que a jornada seja o lugar onde os dados objetivos ganham leitura editorial.

### Jogos

Permite gerir:

- equipas;
- data e hora;
- estado;
- resultado;
- minuto;
- canal TV;
- eventos;
- noticias associadas.

### Noticias

Permite gerir:

- titulo;
- resumo;
- corpo;
- imagem;
- fonte;
- estado;
- competicao associada;
- jornada associada;
- jogo associado;
- clubes e jogadores associados.

### Manchetes

Permite escolher:

- destaque da homepage;
- destaque por competicao;
- destaque por jornada;
- resultado associado;
- imagem;
- texto curto.

### Classificacoes

Permite:

- importar classificacao;
- corrigir manualmente;
- guardar snapshot por jornada;
- consultar historico.

### Importacoes

Permite:

- importar calendario;
- atualizar resultados;
- atualizar classificacoes;
- rever erros;
- ver origem dos dados.

## Workflow editorial recomendado

1. Importar jogos da jornada.
2. Confirmar canais TV.
3. Durante/depois dos jogos, atualizar resultados.
4. Atualizar classificacao.
5. Criar manchete principal.
6. Criar noticias associadas.
7. Rever pagina da competicao.
8. Publicar.

## Importante

O backoffice nao deve publicar tudo automaticamente. Os dados objetivos podem entrar por API, mas manchetes e contexto devem passar por revisao humana.
