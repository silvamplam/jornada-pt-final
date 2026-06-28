# PORTAL-ESCOLAS-MULTIDESPORTO-ARQUITETURA-1

Este pacote é a primeira fase da fundação multidesporto do Portal das Escolas.

## Escopo

Contém apenas documentação técnica e uma proposta SQL isolada para revisão/teste manual.

Inclui:

- `docs/portal-escolas-multidesporto-arquitetura-1.md`
- `supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql`

## O que este pacote não faz

- Não altera páginas da aplicação.
- Não altera helpers TypeScript.
- Não altera o backoffice existente.
- Não altera páginas públicas.
- Não altera o modelo principal da Jornada.pt.
- Não cria API.
- Não cria service role.
- Não substitui `portal_games` nem `portal_results` atuais.
- Não remove `portal_competitions.modality`.

## Como aplicar na branch

Aplicar numa branch própria, por exemplo:

`portal-escolas-multidesporto-arquitetura-1-20260628`

Copiar os ficheiros deste ZIP para a raiz do projeto:

```text
C:\Users\silva\Documents\Codex\jornada-pt-final-auth-login-1-git
```

Depois confirmar:

```bash
git status --short -uall
git diff --stat
```

O esperado é aparecerem apenas ficheiros novos:

```text
docs/portal-escolas-multidesporto-arquitetura-1.md
supabase/sql/portal-escolas-multidesporto-schema-proposta-1-20260628.sql
README-APLICAR.md
```

## Teste no Supabase

O SQL é uma proposta idempotente e não destrutiva, mas deve ser testado primeiro num ambiente seguro.

Antes de executar em produção:

1. Ler a documentação.
2. Confirmar se a função `public.portal_can_select_scope` existe.
3. Confirmar se as tabelas `portal_` atuais existem.
4. Executar primeiro em ambiente de teste/staging, se disponível.
5. Confirmar tabelas, colunas, índices e policies criadas.

## Decisão importante

Esta fase não fecha a implementação multidesporto. Apenas estabelece a arquitetura proposta para validar antes de qualquer UI ou alteração funcional.
