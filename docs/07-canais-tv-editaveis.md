# Canais TV editaveis

O backoffice passa a ter uma area em `/admin/canais-tv` para criar e editar canais de televisao.

## O que permite editar

- Nome do canal
- Plataforma
- Pais
- URL do logotipo

## Permissoes Supabase

Se a pagina devolver `permission denied for table broadcast_channels`, executa no Supabase SQL Editor:

```sql
grant usage on schema public to service_role;
grant select, insert, update, delete on public.broadcast_channels to service_role;
```

O ficheiro completo de permissoes esta em `supabase/admin-service-grants.sql`.
