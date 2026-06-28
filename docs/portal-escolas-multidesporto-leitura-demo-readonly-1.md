# PORTAL-ESCOLAS-MULTIDESPORTO-LEITURA-DEMO-READONLY-1

## Estado antes da fase

A fase `PORTAL-ESCOLAS-MULTIDESPORTO-PONTE-LEGADO-DEMO-1` materializou dados demo nas tabelas multidesporto novas a partir do modelo legado do Portal das Escolas.

Foram criados e validados:

- 1 formato demo em `portal_competition_formats`;
- 3 eventos em `portal_events`;
- 6 participantes de evento em `portal_event_participants`;
- 4 entradas de resultado em `portal_result_entries`;
- 1 ranking em `portal_rankings`;
- 4 linhas de ranking em `portal_ranking_entries`.

O modelo legado continuou intacto:

- `portal_games` manteve 3 jogos;
- `portal_results` manteve 2 resultados.

## Objetivo desta fase

Criar a primeira leitura controlada desses dados dentro da aplicação, sem alterar o comportamento das páginas já existentes.

A leitura serve para provar que a app consegue consultar a camada multidesporto nova e apresentá-la em contexto autorizado do Portal.

## Estratégia

A fase adiciona:

1. Um helper isolado:

```txt
lib/portal-escolas/readPortalMultisportDemo.ts
```

2. Uma página isolada:

```txt
app/portal-escolas/multidesporto-demo/page.tsx
```

3. Um smoke test read-only:

```txt
supabase/sql/portal-escolas-multidesporto-leitura-demo-smoke-1-20260628.sql
```

## Página criada

URL:

```txt
/portal-escolas/multidesporto-demo
```

A página é protegida pelo mesmo fluxo do Portal das Escolas:

- sessão Supabase Auth obrigatória;
- `readPortalAuthorization` obrigatório;
- leitura limitada por permissões/RLS;
- sem escrita de dados.

## Dados apresentados

A página apresenta:

- formatos multidesporto configurados;
- eventos materializados;
- participantes por evento;
- entradas de resultado por participante;
- ranking/classificação demo.

## Decisão importante

Esta fase não adiciona a página à navegação interna principal. A razão é manter a fase isolada e evitar alterar a experiência normal do Portal antes de validação.

A página deve ser acedida diretamente por URL durante testes.

## Fora do escopo

- Não substituir `/portal-escolas/jogos`.
- Não substituir `/portal-escolas/resultados`.
- Não alterar navegação existente.
- Não alterar schema.
- Não escrever dados.
- Não alterar backoffice principal.
- Não apagar nem esconder o modelo legado.

## Critério de sucesso

A fase fica validada se:

1. o smoke SQL retorna tudo `ok`;
2. a nova página abre para utilizador autorizado;
3. a página mostra os dados demo materializados;
4. as páginas atuais do Portal continuam iguais;
5. o PR só contém os ficheiros desta fase.
