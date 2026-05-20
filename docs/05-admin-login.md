# Login do backoffice

O backoffice em `/admin` esta preparado para ficar protegido por password.

## Variaveis na Vercel

No projeto da Vercel, em `Environment Variables`, adiciona:

- `ADMIN_PASSWORD`: a password que vais usar para entrar no backoffice.
- `ADMIN_SESSION_SECRET`: opcional, uma frase longa para assinar a sessao.

Se `ADMIN_SESSION_SECRET` ficar vazio, o site usa a propria password para assinar a sessao.

## Como funciona

- Quem abrir `/admin` sem sessao entra primeiro em `/admin/login`.
- A password fica guardada apenas na Vercel, nao no codigo.
- A sessao dura 8 horas.
- O botao `Sair` termina a sessao.

## Futuro

Quando o backoffice crescer, este bloqueio simples deve evoluir para Supabase Auth com utilizadores, papeis e permissoes editoriais.
