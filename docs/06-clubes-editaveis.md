# Clubes editaveis

O backoffice passa a ter uma area em `/admin/clubes` para criar e editar clubes.

## O que permite editar

- Nome do clube
- Sigla curta
- Slug
- Pais
- URL do emblema
- Cor principal

## Variavel privada necessaria

Para gravar na Supabase, a Vercel precisa desta variavel:

- `SUPABASE_SERVICE_ROLE_KEY`

Esta chave deve ficar apenas na Vercel. Nunca deve ser usada com o prefixo `NEXT_PUBLIC_`.

## Onde encontrar a chave

No Supabase:

1. Abre o projeto.
2. Vai a `Settings`.
3. Entra em `API Keys`.
4. Copia a chave secreta/service role.
5. Cola na Vercel em `Environment Variables` com o nome `SUPABASE_SERVICE_ROLE_KEY`.

Depois faz redeploy na Vercel.
