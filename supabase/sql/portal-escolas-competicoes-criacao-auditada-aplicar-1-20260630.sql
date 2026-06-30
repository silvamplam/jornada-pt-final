-- PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1
-- SQL 2/5 — APLICAR
--
-- Objetivo:
-- Criar função controlada para criação auditada de competições
-- associadas a uma modalidade formal existente.
--
-- Escopo:
-- - cria/atualiza apenas public.portal_create_competition(...);
-- - escrita controlada em public.portal_competitions;
-- - auditoria em public.portal_audit_events;
-- - autorização por portal_user ativo + permissão estrutural ativa;
-- - competição nasce sempre em draft/Rascunho;
-- - sem UI;
-- - sem /admin;
-- - sem backoffice;
-- - sem páginas públicas antigas.

begin;

create or replace function public.portal_create_competition(
  p_portal_modality_id uuid,
  p_name text,
  p_slug text default null,
  p_scope text default null,
  p_format text default null,
  p_status text default 'draft'
)
returns table (
  result_competition_id uuid,
  result_portal_entity_id uuid,
  result_portal_context_id uuid,
  result_portal_modality_id uuid,
  result_name text,
  result_slug text,
  result_modality text,
  result_scope text,
  result_format text,
  result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_actor_portal_user_id uuid;
  v_modality record;
  v_name text;
  v_slug text;
  v_scope text := nullif(btrim(coalesce(p_scope, '')), '');
  v_format text := nullif(btrim(coalesce(p_format, '')), '');
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_has_permission boolean := false;
  v_competition_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'portal_not_authenticated' using errcode = '28000';
  end if;

  if p_portal_modality_id is null then
    raise exception 'portal_invalid_modality' using errcode = '22023';
  end if;

  if v_status <> 'draft' then
    raise exception 'portal_competition_initial_status_must_be_draft' using errcode = '22023';
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');

  if v_name is null then
    raise exception 'portal_competition_name_required' using errcode = '22023';
  end if;

  v_slug := lower(
    regexp_replace(
      coalesce(
        nullif(btrim(p_slug), ''),
        v_name
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
  v_slug := nullif(btrim(v_slug, '-'), '');

  if v_slug is null then
    raise exception 'portal_competition_slug_required' using errcode = '22023';
  end if;

  select
    u.id
  into v_actor_portal_user_id
  from public.portal_users u
  where u.auth_user_id = v_auth_user_id
    and u.status = 'active'
  limit 1;

  if v_actor_portal_user_id is null then
    raise exception 'portal_user_not_found' using errcode = 'P0002';
  end if;

  select
    pm.id,
    pm.portal_entity_id,
    pm.portal_context_id,
    pm.catalog_modality_id,
    pm.name,
    pm.slug,
    pm.status as modality_status,
    pc.status as context_status
  into v_modality
  from public.portal_modalities pm
  join public.portal_contexts pc
    on pc.id = pm.portal_context_id
   and pc.portal_entity_id = pm.portal_entity_id
  where pm.id = p_portal_modality_id
  limit 1;

  if not found then
    raise exception 'portal_modality_not_found' using errcode = 'P0002';
  end if;

  if v_modality.context_status <> 'active' then
    raise exception 'portal_context_not_active' using errcode = '42501';
  end if;

  if v_modality.modality_status not in ('draft', 'active') then
    raise exception 'portal_modality_not_available_for_competition_creation' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.portal_permissions p
    where p.portal_user_id = v_actor_portal_user_id
      and p.status = 'active'
      and p.can_view = true
      and p.can_create = true
      and p.can_edit = true
      and p.portal_entity_id = v_modality.portal_entity_id
      and p.portal_competition_id is null
      and (
        p.portal_context_id is null
        or p.portal_context_id = v_modality.portal_context_id
      )
  ) into v_has_permission;

  if not v_has_permission then
    raise exception 'portal_competition_create_not_allowed' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.portal_competitions c
    where c.portal_entity_id = v_modality.portal_entity_id
      and c.portal_context_id = v_modality.portal_context_id
      and lower(c.slug) = lower(v_slug)
  ) then
    raise exception 'portal_competition_slug_already_exists' using errcode = '23505';
  end if;

  insert into public.portal_competitions (
    portal_entity_id,
    portal_context_id,
    portal_modality_id,
    name,
    slug,
    modality,
    scope,
    format,
    status
  ) values (
    v_modality.portal_entity_id,
    v_modality.portal_context_id,
    v_modality.id,
    v_name,
    v_slug,
    v_modality.name,
    v_scope,
    v_format,
    'draft'
  )
  returning id into v_competition_id;

  insert into public.portal_audit_events (
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    actor_reference,
    actor_portal_user_id,
    action_type,
    object_type,
    object_id,
    previous_status,
    new_status,
    metadata
  ) values (
    v_modality.portal_entity_id,
    v_modality.portal_context_id,
    v_competition_id,
    v_auth_user_id::text,
    v_actor_portal_user_id,
    'portal_competition_created',
    'portal_competitions',
    v_competition_id,
    null,
    'draft',
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1',
      'source_function', 'portal_create_competition',
      'portal_modality_id', v_modality.id,
      'portal_context_id', v_modality.portal_context_id,
      'catalog_modality_id', v_modality.catalog_modality_id,
      'new', jsonb_build_object(
        'name', v_name,
        'slug', v_slug,
        'modality', v_modality.name,
        'scope', v_scope,
        'format', v_format,
        'status', 'draft'
      )
    )
  );

  return query
  select
    c.id,
    c.portal_entity_id,
    c.portal_context_id,
    c.portal_modality_id,
    c.name,
    c.slug,
    c.modality,
    c.scope,
    c.format,
    c.status
  from public.portal_competitions c
  where c.id = v_competition_id;
end;
$$;

revoke all on function public.portal_create_competition(uuid, text, text, text, text, text) from public;
grant execute on function public.portal_create_competition(uuid, text, text, text, text, text) to authenticated;

comment on function public.portal_create_competition(uuid, text, text, text, text, text)
is 'Controlled Portal das Escolas function to create an audited draft competition linked to a formal modality. Requires active portal_user and active can_view/can_create/can_edit structural permission. Each creation is audited in portal_audit_events.';

commit;
