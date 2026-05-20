# JORNADA.pt

Plataforma editorial, cronológica e contextual para futebol. O projeto organiza informação por competição, época, jornada e evento competitivo, em vez de tratar notícias como uma simples lista por data de publicação.

## Estrutura inicial

- `app/page.tsx`: homepage geral com várias competições.
- `app/competicao/[slug]/page.tsx`: modo contextual da competição atual.
- `app/competicao/[slug]/jornada/[matchday]/page.tsx`: consulta de uma jornada específica.
- `data/jornada-data.json`: dados simulados com entidades relacionais.
- `lib/jornada.ts`: camada de domínio que transforma dados em contexto de página.
- `components/`: blocos reutilizáveis da interface.
- `public/assets/`: imagens locais usadas pelo site.

## Modelo conceptual

O JSON já está organizado à volta das entidades principais:

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

As páginas não dependem de conteúdo fixo. A interface recebe um contexto resolvido a partir dos dados, o que prepara o projeto para uma futura base de dados ou API.

## Como correr localmente

Instale as dependências e inicie o projeto:

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

## Pré-visualização sem npm

Se o computador ainda não tiver `npm` disponível, este projeto inclui um servidor leve de pré-visualização:

```bash
node dev-server.mjs
```

Esse servidor não substitui o Next.js em produção. Serve apenas para ver o site localmente enquanto o ambiente Node/npm não está completo.

## Publicar online

O caminho mais simples é Vercel:

1. Criar um repositório no GitHub com estes ficheiros.
2. Entrar em https://vercel.com/new
3. Escolher o repositório.
4. Publicar com as definições automáticas de Next.js.

Também pode ser publicado em Netlify, desde que o projeto seja tratado como Next.js, com comando de build `npm run build`.
Atualização admin Supabase.
Deploy ligado ao repositório final.
