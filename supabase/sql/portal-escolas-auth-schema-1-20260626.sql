-- Portal das Escolas - AUTH-SCHEMA-1.
-- Schema mínimo para identidade futura. Não cria policies RLS, login, API, UI ou dados.

create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  display_name text,
  invite_email text,
  status text not null default 'pending',
  invited_at timestamptz,
  activated_at timestamptz,
  disabled_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_users_status_check check (status in ('pending', 'active', 'disabled')),
  constraint portal_users_display_name_not_empty check (display_name is null or btrim(display_name) <> ''),
  constraint portal_users_invite_email_not_empty check (invite_email is null or btrim(invite_email) <> '')
);

alter table public.portal_users enable row level security;

comment on table public.portal_users is 'Portal users linked conceptually to Supabase Auth and scoped to a portal entity.';
comment on column public.portal_users.auth_user_id is 'Supabase Auth user id. Nullable while invitation is pending.';
comment on column public.portal_users.invite_email is 'Invitation/reference email. Not the final authorization identity.';

create index if not exists portal_users_entity_idx on public.portal_users (portal_entity_id);
create index if not exists portal_users_auth_user_idx on public.portal_users (auth_user_id) where auth_user_id is not null;
create index if not exists portal_users_status_idx on public.portal_users (status);
create index if not exists portal_users_invite_email_idx on public.portal_users (invite_email) where invite_email is not null;
create unique index if not exists portal_users_entity_auth_user_unique_idx on public.portal_users (portal_entity_id, auth_user_id) where auth_user_id is not null;

alter table public.portal_permissions add column if not exists portal_user_id uuid;
comment on column public.portal_permissions.portal_user_id is 'Future link to public.portal_users. Nullable during demo/invitation transition.';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portal_permissions_portal_user_id_fkey') then
    alter table public.portal_permissions add constraint portal_permissions_portal_user_id_fkey foreign key (portal_user_id) references public.portal_users(id) on delete set null;
  end if;
end $$;

create index if not exists portal_permissions_portal_user_idx on public.portal_permissions (portal_user_id);
create index if not exists portal_permissions_user_entity_idx on public.portal_permissions (portal_user_id, portal_entity_id);
create index if not exists portal_permissions_user_entity_context_idx on public.portal_permissions (portal_user_id, portal_entity_id, portal_context_id);
create index if not exists portal_permissions_user_entity_competition_idx on public.portal_permissions (portal_user_id, portal_entity_id, portal_competition_id);

alter table public.portal_audit_events add column if not exists actor_portal_user_id uuid;
comment on column public.portal_audit_events.actor_portal_user_id is 'Future actor link to public.portal_users. actor_reference remains available for demo/history.';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portal_audit_events_actor_portal_user_id_fkey') then
    alter table public.portal_audit_events add constraint portal_audit_events_actor_portal_user_id_fkey foreign key (actor_portal_user_id) references public.portal_users(id) on delete set null;
  end if;
end $$;

create index if not exists portal_audit_events_actor_portal_user_idx on public.portal_audit_events (actor_portal_user_id);
