# Jornada.pt - Ligacao ao Supabase

O projeto Supabase ja existe e a base de dados inicial ja foi criada.

## Estado atual

Tabelas principais criadas.

Dados iniciais confirmados:

- competitions: 3
- teams: 20
- broadcast_channels: 8

## Variaveis de ambiente

Quando o site for ligado ao Supabase, devem existir estas variaveis:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Estas variaveis devem ser colocadas:

- localmente num ficheiro `.env.local`;
- na Vercel em Project Settings > Environment Variables.

## Importante

Nao colocar a service role key no codigo do site.

A service role key deve ser usada apenas em tarefas seguras de servidor ou scripts administrativos.

## Proximo passo

Criar uma primeira pagina interna de administracao:

```text
/admin
```

Essa pagina deve comecar simples:

- ver competicoes;
- ver equipas;
- ver canais TV;
- testar ligacao a base de dados.

Depois evolui para editar jogos, jornadas, manchetes e noticias.
