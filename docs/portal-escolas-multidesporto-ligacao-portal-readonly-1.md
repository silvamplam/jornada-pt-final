# PORTAL-ESCOLAS-MULTIDESPORTO-LIGACAO-PORTAL-READONLY-1

## Enquadramento

As fases anteriores criaram e validaram a fundação multidesporto do Portal das Escolas:

- modalidades formais;
- formatos de competição;
- eventos genéricos;
- participantes de evento;
- resultados por participante;
- rankings/classificações;
- dados demo materializados a partir do modelo legado;
- página isolada `/portal-escolas/multidesporto-demo` validada em produção.

Esta fase não substitui as páginas atuais. O objetivo é apenas ligar a leitura multidesporto demo ao Portal de forma controlada.

## Decisão desta fase

Adicionar uma entrada `Multidesporto` à navegação interna comum do Portal das Escolas.

A ligação aponta para:

`/portal-escolas/multidesporto-demo`

A página continua identificada como demo e mantém a mensagem de que não substitui jogos/resultados atuais.

## Motivo

Isto permite validar a integração do novo modelo dentro da experiência do Portal sem ainda trocar a origem das páginas existentes.

O Portal passa a expor uma entrada visível para o modelo multidesporto, mas mantém o modelo legado em produção para:

- jogos;
- resultados;
- competições;
- jornadas/fases.

## Ficheiros alterados

### `app/portal-escolas/_components/PortalEscolasInternalNav.tsx`

Adiciona:

```tsx
{ key: "multidesporto", label: "Multidesporto", href: "/portal-escolas/multidesporto-demo" }
```

Também adiciona `"multidesporto"` ao tipo `PortalEscolasNavKey`.

### `app/portal-escolas/multidesporto-demo/page.tsx`

Passa a usar a navegação interna comum com:

```tsx
<PortalEscolasInternalNav current="multidesporto" />
```

## Segurança

A fase é read-only.

Não altera:

- schema;
- dados;
- RLS/policies;
- grants;
- backoffice;
- páginas públicas;
- páginas atuais de jogos/resultados.

## Validação esperada

A navegação interna deve mostrar `Multidesporto`.

Ao abrir `/portal-escolas/multidesporto-demo`, o item `Multidesporto` deve aparecer como ativo.

A página deve continuar a mostrar:

- 1 formato;
- 3 eventos;
- participantes por evento;
- resultados por participante quando existem;
- 1 ranking;
- 4 linhas de classificação.

As páginas atuais devem continuar sem alteração funcional:

- `/portal-escolas/jogos`;
- `/portal-escolas/resultados`;
- `/portal-escolas/competicoes`;
- `/portal-escolas/painel`.
