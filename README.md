# JORNADA.pt

Plataforma editorial, cronologica e contextual para futebol. O projeto organiza informacao por competicao, epoca, jornada e evento competitivo, em vez de tratar noticias como uma simples lista por data de publicacao.

## Ideia central

A Jornada.pt e a maquina do tempo do futebol. A unidade principal nao e apenas a noticia nem apenas o resultado: e a jornada enquanto contexto competitivo.

O leitor deve conseguir perceber:

- que competicao esta a consultar;
- que jornada esta em causa;
- que jogos pertencem a essa jornada;
- que resultados ja aconteceram;
- que jogos ainda faltam;
- que impacto competitivo existe;
- que noticias, manchetes e memoria historica pertencem a esse momento.

## Estrutura inicial

- `app/page.tsx`: homepage geral com varias competicoes.
- `app/competicao/[slug]/page.tsx`: modo contextual da competicao atual.
- `app/competicao/[slug]/jornada/[matchday]/page.tsx`: consulta de uma jornada especifica.
- `app/admin/page.tsx`: painel inicial do backoffice.
- `app/admin/jornadas/page.tsx`: gestao manual e editorial das jornadas.
- `app/admin/classificacoes/page.tsx`: gestao manual das classificacoes por competicao, epoca e jornada.
- `app/admin/jogos/page.tsx`: gestao manual dos jogos, resultados, estados e transmissoes.
- `app/admin/clubes/page.tsx`: gestao dos clubes.
- `app/admin/canais-tv/page.tsx`: gestao dos canais TV e logotipos.
- `data/jornada-data.json`: dados simulados com entidades relacionais.
- `lib/jornada.ts`: camada de dominio que transforma dados em contexto de pagina.
- `lib/supabase.ts`: camada de leitura/escrita preparada para Supabase.
- `components/`: blocos reutilizaveis da interface.
- `public/assets/`: imagens locais usadas pelo site.

## Modelo conceptual

As entidades principais sao:

- `Competition`
- `Season`
- `Matchday`
- `Match`
- `Team`
- `Player`
- `Standing`
- `Article`
- `Headline`
- `Event`
- `Goal`
- `LiveUpdate`
- `BroadcastChannel`

A Jornada (`Matchday`) e uma entidade forte. Pode ter titulo editorial, resumo, imagem principal, video, ordem, destaque, memoria historica, SEO, jogos associados, noticias associadas, manchetes associadas e classificacao associada.

A classificacao (`Standing`) e guardada como fotografia de um momento competitivo. Pode estar ligada a uma competicao, epoca e jornada, para que o leitor consiga perceber a consequencia dos jogos nesse ponto da competicao.

## Preparacao para API futura

Mesmo com gestao manual nesta fase, a base fica preparada para dados vindos de API externa:

- `data_source`: manual, api ou mixed;
- `external_provider`;
- `external_id`;
- `external_match_id`, quando aplicavel;
- `last_synced_at`;
- `sync_status`;
- `manual_override`.

A API futura deve alimentar dados objetivos. O backoffice continua responsavel por corrigir, proteger e dar contexto editorial.

## Como correr localmente

Instale as dependencias e inicie o projeto:

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

## Pre-visualizacao sem npm

Se o computador ainda nao tiver `npm` disponivel, este projeto inclui um servidor leve de pre-visualizacao:

```bash
node dev-server.mjs
```

Esse servidor nao substitui o Next.js em producao. Serve apenas para ver o site localmente enquanto o ambiente Node/npm nao esta completo.

## Publicar online

O caminho mais simples e Vercel:

1. Criar um repositorio no GitHub com estes ficheiros.
2. Entrar em https://vercel.com/new
3. Escolher o repositorio.
4. Publicar com as definicoes automaticas de Next.js.

Tambem pode ser publicado em Netlify, desde que o projeto seja tratado como Next.js, com comando de build `npm run build`.

Teste de deploy Vercel - 2026-05-23
