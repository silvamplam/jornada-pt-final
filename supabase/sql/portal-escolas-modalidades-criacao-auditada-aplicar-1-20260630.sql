-- PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1
-- Aplicar: cria função controlada para criação auditada de modalidades formais.
--
-- Escopo:
-- - função nova public.portal_create_modality(...);
-- - escrita em public.portal_modalities;
-- - auditoria em public.portal_audit_events;
-- - autorização por portal_user ativo + permissão ativa com can_view/can_create/can_edit;
-- - sem React;
-- - sem /admin;
-- - sem backoffice;
-- - sem páginas públicas antigas.

begin;

create or replace function public.portal_create_modality(
  p_portal_context_id uuid,
  p_catalog_code text default null,
  p_name text default null,
  p_slug text default null,
  p_local_code text default null,
  p_status text default 'draft',
  p_notes text default null
)
returns table (
  result_modality_id uuid,
  result_portal_entity_id uuid,
  result_portal_context_id uuid,
  result_catalog_modality_id uuid,
  result_name text,
  result_slug text,
  result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_actor_portal_user_id uuid;
  v_context record;
  v_catalog record;
  v_name text;
  v_slug text;
  v_local_code text := nullif(btrim(coalesce(p_local_code, '')), '');
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_has_permission boolean := false;
  v_modality_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'portal_not_authenticated' using errcode = '28000';
  end if;

  if p_portal_context_id is null then
    raise exception 'portal_invalid_context' using errcode = '22023';
  end if;

  if v_status not in ('draft', 'active', 'archived') then
    raise exception 'portal_invalid_modality_status' using errcode = '22023';
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
    c.id,
    c.portal_entity_id,
    c.label,
    c.status
  into v_context
  from public.portal_contexts c
  where c.id = p_portal_context_id;

  if not found then
    raise exception 'portal_context_not_found' using errcode = 'P0002';
  end if;

  if v_context.status <> 'active' then
    raise exception 'portal_context_not_active' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_catalog_code, '')), '') is not null then
    select
      mc.id,
      mc.code,
      mc.name,
      mc.status
    into v_catalog
    from public.portal_modality_catalog mc
    where lower(mc.code) = lower(btrim(p_catalog_code))
      and mc.status = 'active'
    limit 1;

    if not found then
      raise exception 'portal_catalog_modality_not_found_or_inactive' using errcode = 'P0002';
    end if;
  end if;

  v_name := nullif(btrim(coalesce(p_name, v_catalog.name, '')), '');

  if v_name is null then
    raise exception 'portal_modality_name_required' using errcode = '22023';
  end if;

  v_slug := lower(
    regexp_replace(
      coalesce(
        nullif(btrim(p_slug), ''),
        nullif(btrim(v_catalog.code), ''),
        v_name
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
  v_slug := nullif(btrim(v_slug, '-'), '');

  if v_slug is null then
    raise exception 'portal_modality_slug_required' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.portal_permissions p
    where p.portal_user_id = v_actor_portal_user_id
      and p.status = 'active'
      and p.can_view = true
      and p.can_create = true
      and p.can_edit = true
      and p.portal_entity_id = v_context.portal_entity_id
      and (p.portal_context_id is null or p.portal_context_id = v_context.id)
  ) into v_has_permission;

  if not v_has_permission then
    raise exception 'portal_modality_create_not_allowed' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.portal_modalities pm
    where pm.portal_entity_id = v_context.portal_entity_id
      and pm.portal_context_id = v_context.id
      and lower(pm.slug) = lower(v_slug)
  ) then
    raise exception 'portal_modality_slug_already_exists' using errcode = '23505';
  end if;

  if v_catalog.id is not null and exists (
    select 1
    from public.portal_modalities pm
    where pm.portal_entity_id = v_context.portal_entity_id
      and pm.portal_context_id = v_context.id
      and pm.catalog_modality_id = v_catalog.id
  ) then
    raise exception 'portal_catalog_modality_already_active_in_context' using errcode = '23505';
  end if;

  insert into public.portal_modalities (
    portal_entity_id,
    portal_context_id,
    catalog_modality_id,
    name,
    slug,
    local_code,
    status,
    notes,
    metadata
  ) values (
    v_context.portal_entity_id,
    v_context.id,
    v_catalog.id,
    v_name,
    v_slug,
    v_local_code,
    v_status,
    p_notes,
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1',
      'source', 'portal_create_modality',
      'created_by_auth_user_id', v_auth_user_id,
      'created_by_portal_user_id', v_actor_portal_user_id,
      'catalog_code', v_catalog.code,
      'created_at', now()
    )
  )
  returning id into v_modality_id;

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
    v_context.portal_entity_id,
    v_context.id,
    null,
    v_auth_user_id::text,
    v_actor_portal_user_id,
    'portal_modality_created',
    'portal_modalities',
    v_modality_id,
    null,
    v_status,
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1',
      'source_function', 'portal_create_modality',
      'portal_context_id', v_context.id,
      'catalog_modality_id', v_catalog.id,
      'catalog_code', v_catalog.code,
      'new', jsonb_build_object(
        'name', v_name,
        'slug', v_slug,
        'local_code', v_local_code,
        'status', v_status,
        'notes', p_notes
      )
    )
  );

  return query
  select
    pm.id,
    pm.portal_entity_id,
    pm.portal_context_id,
    pm.catalog_modality_id,
    pm.name,
    pm.slug,
    pm.status
  from public.portal_modalities pm
  where pm.id = v_modality_id;
end;
$$;

revoke all on function public.portal_create_modality(uuid, text, text, text, text, text, text) from public;
grant execute on function public.portal_create_modality(uuid, text, text, text, text, text, text) to authenticated;

comment on function public.portal_create_modality(uuid, text, text, text, text, text, text)
is 'Controlled Portal das Escolas function to create a formal modality in an authorized entity/context scope. Requires active portal_user and active can_view/can_create/can_edit permission. Each creation is audited in portal_audit_events.';

commit;
