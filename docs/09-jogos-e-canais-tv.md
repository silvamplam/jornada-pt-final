# Jogos e canais TV

Esta fase liga cada jogo a um canal de televisao no Supabase. O objetivo e que a agenda consiga mostrar "onde se ve" com logotipo, em vez de apenas texto.

## O que foi criado

- Pagina `/admin/jogos-tv`.
- Lista de jogos vindos da tabela `matches`.
- Selector de canal para cada jogo.
- Ligacao ao campo `broadcast_channel_id`.
- SQL de preparacao em `supabase/match-broadcast-setup.sql`.

## Como aplicar

1. Envia estes ficheiros para o GitHub e faz commit.
2. Espera o deploy da Vercel terminar.
3. Abre o Supabase.
4. Vai a SQL Editor.
5. Abre o ficheiro `supabase/match-broadcast-setup.sql`.
6. Copia o conteudo completo.
7. Cola no SQL Editor.
8. Clica em Run.
9. Se aparecer aviso de operacao destrutiva, confirma apenas se o SQL for este ficheiro.
10. Abre `/admin/jogos-tv`.

## Depois de aplicado

Cada jogo passa a ter um canal associado. No backoffice podes trocar o canal e guardar. A agenda publica ja esta preparada para apresentar logotipos quando o jogo tiver dados de transmissao.

## Futuro com fontes externas

Esta estrutura permite automatizar a entrada de dados mais tarde. Um importador pode receber informacao de uma API, feed ou ficheiro externo e preencher as mesmas tabelas:

- `competitions`
- `seasons`
- `matchdays`
- `teams`
- `matches`
- `broadcast_channels`

O campo `source_key` foi criado para identificar o mesmo jogo de forma estavel quando vier de uma fonte externa. Isso evita duplicados e permite atualizar hora, resultado, estado do jogo e canal TV sem partir a organizacao editorial do Jornada.pt.
