-- PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1
-- SQL 2/5 — APLICAR
--
-- Objetivo:
-- Criar função controlada para criação auditada de formato competitivo
-- associado a uma competição existente.
--
-- Escopo:
-- - cria/atualiza apenas public.portal_create_competition_format(...);
-- - escrita controlada em public.portal_competition_formats;
-- - auditoria em public.portal_audit_events;
-- - autorização por portal_user ativo + permissão ativa;
-- - formato nasce sempre em draft/Rascunho;
-- - usa catálogo formal quando indicado;
-- - NÃO altera portal_competitions.format legacy;
-- - sem UI;
-- - sem /admin;
-- - sem backoffice;
-- - sem páginas públicas antigas.

begin;

create or replace function public.portal_create_competition_format(
  p_portal_competition_id uuid,
  p_catalog_format_id uuid default null,
  p_name text default null,
  p_code text default null,
  p_format_scope text default 'competition',
  p_format_family text default null,
  p_event_model text default null,
  p_result_model text default null,
  p_ranking_model text default null,
  p_notes text default null,
  p_status text default 'draft'
)
returns table (
  result_format_id uuid,
  result_portal_entity_id uuid,
  result_portal_context_id uuid,
  result_portal_modality_id uuid,
  result_portal_competition_id uuid,
  result_catalog_format_id uuid,
  result_name text,
  result_code text,
  result_format_scope text,
  result_format_family text,
  result_event_model text,
  result_result_model text,
  result_ranking_model text,
  result_status text,
  result_notes text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_actor_portal_user_id uuid;
  v_competition record;
  v_catalog record;
  v_name text;
  v_code text;
  v_format_scope text := coalesce(nullif(btrim(p_format_scope), ''), 'competition');
  v_format_family text;
  v_event_model text;
  v_result_model text;
  v_ranking_model text;
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_has_permission boolean := false;
  v_format_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'portal_not_authenticated' using errcode = '28000';
  end if;

  if p_portal_competition_id is null then
    raise exception 'portal_invalid_competition' using errcode = '22023';
  end if;

  if v_status <> 'draft' then
    raise exception 'portal_competition_format_initial_status_must_be_draft' using errcode = '22023';
  end if;

  if v_format_scope <> 'competition' then
    raise exception 'portal_competition_format_scope_not_supported_in_this_phase' using errcode = '22023';
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
    c.portal_context_id,
    c.portal_modality_id,
    c.name,
    c.slug,
    c.status as competition_status,
    pc.status as context_status,
    pm.name as modality_name,
    pm.slug as modality_slug,
    pm.status as modality_status
  into v_competition
  from public.portal_competitions c
  join public.portal_contexts pc
    on pc.id = c.portal_context_id
   and pc.portal_entity_id = c.portal_entity_id
  left join public.portal_modalities pm
    on pm.id = c.portal_modality_id
   and pm.portal_context_id = c.portal_context_id
   and pm.portal_entity_id = c.portal_entity_id
  where c.id = p_portal_competition_id
  limit 1;

  if not found then
    raise exception 'portal_competition_not_found' using errcode = 'P0002';
  end if;

  if v_competition.context_status <> 'active' then
    raise exception 'portal_context_not_active' using errcode = '42501';
  end if;

  if v_competition.competition_status not in ('draft', 'active') then
    raise exception 'portal_competition_not_available_for_format_creation' using errcode = '42501';
  end if;

  if v_competition.portal_modality_id is null then
    raise exception 'portal_competition_missing_modality' using errcode = '42501';
  end if;

  if coalesce(v_competition.modality_status, '') not in ('draft', 'active') then
    raise exception 'portal_modality_not_available_for_format_creation' using errcode = '42501';
  end if;

  if p_catalog_format_id is not null then
    select
      f.id,
      f.code,
      f.name,
      f.format_family,
      f.default_event_model,
      f.default_result_model,
      f.default_ranking_model,
      f.status
    into v_catalog
    from public.portal_competition_format_catalog f
    where f.id = p_catalog_format_id
      and f.status = 'active'
    limit 1;

    if not found then
      raise exception 'portal_competition_format_catalog_not_found' using errcode = 'P0002';
    end if;
  end if;

  v_name := nullif(
    btrim(
      coalesce(
        p_name,
        v_catalog.name,
        ''
      )
    ),
    ''
  );

  if v_name is null then
    raise exception 'portal_competition_format_name_required' using errcode = '22023';
  end if;

  v_code := lower(
    regexp_replace(
      coalesce(
        nullif(btrim(p_code), ''),
        v_catalog.code,
        v_name
      ),
      '[^a-zA-Z0-9]+',
      '_',
      'g'
    )
  );
  v_code := nullif(btrim(v_code, '_'), '');

  if v_code is null then
    raise exception 'portal_competition_format_code_required' using errcode = '22023';
  end if;

  v_format_family := nullif(
    btrim(
      coalesce(
        p_format_family,
        v_catalog.format_family,
        ''
      )
    ),
    ''
  );

  v_event_model := nullif(
    btrim(
      coalesce(
        p_event_model,
        v_catalog.default_event_model,
        ''
      )
    ),
    ''
  );

  v_result_model := nullif(
    btrim(
      coalesce(
        p_result_model,
        v_catalog.default_result_model,
        ''
      )
    ),
    ''
  );

  v_ranking_model := nullif(
    btrim(
      coalesce(
        p_ranking_model,
        v_catalog.default_ranking_model,
        ''
      )
    ),
    ''
  );

  select exists (
    select 1
    from public.portal_permissions p
    where p.portal_user_id = v_actor_portal_user_id
      and p.status = 'active'
      and p.can_view = true
      and p.can_create = true
      and p.can_edit = true
      and p.portal_entity_id = v_competition.portal_entity_id
      and (
        p.portal_context_id is null
        or p.portal_context_id = v_competition.portal_context_id
      )
      and (
        p.portal_competition_id is null
        or p.portal_competition_id = v_competition.id
      )
  ) into v_has_permission;

  if not v_has_permission then
    raise exception 'portal_competition_format_create_not_allowed' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.portal_competition_formats f
    where f.portal_entity_id = v_competition.portal_entity_id
      and f.portal_context_id = v_competition.portal_context_id
      and f.portal_competition_id = v_competition.id
      and f.format_scope = 'competition'
      and f.status <> 'archived'
  ) then
    raise exception 'portal_competition_format_scope_already_exists' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.portal_competition_formats f
    where f.portal_entity_id = v_competition.portal_entity_id
      and f.portal_context_id = v_competition.portal_context_id
      and f.portal_competition_id = v_competition.id
      and f.code is not null
      and lower(f.code) = lower(v_code)
  ) then
    raise exception 'portal_competition_format_code_already_exists' using errcode = '23505';
  end if;

  insert into public.portal_competition_formats (
    portal_entity_id,
    portal_context_id,
    portal_modality_id,
    portal_competition_id,
    catalog_format_id,
    name,
    code,
    format_scope,
    format_family,
    event_model,
    result_model,
    ranking_model,
    scoring_rules,
    tie_breakers,
    settings,
    status,
    notes
  ) values (
    v_competition.portal_entity_id,
    v_competition.portal_context_id,
    v_competition.portal_modality_id,
    v_competition.id,
    p_catalog_format_id,
    v_name,
    v_code,
    'competition',
    v_format_family,
    v_event_model,
    v_result_model,
    v_ranking_model,
    null,
    null,
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1',
      'source_function', 'portal_create_competition_format'
    ),
    'draft',
    v_notes
  )
  returning id into v_format_id;

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
    v_competition.portal_entity_id,
    v_competition.portal_context_id,
    v_competition.id,
    v_auth_user_id::text,
    v_actor_portal_user_id,
    'portal_competition_format_created',
    'portal_competition_formats',
    v_format_id,
    null,
    'draft',
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1',
      'source_function', 'portal_create_competition_format',
      'portal_modality_id', v_competition.portal_modality_id,
      'portal_competition_id', v_competition.id,
      'catalog_format_id', p_catalog_format_id,
      'legacy_competition_format_unchanged', true,
      'new', jsonb_build_object(
        'name', v_name,
        'code', v_code,
        'format_scope', 'competition',
        'format_family', v_format_family,
        'event_model', v_event_model,
        'result_model', v_result_model,
        'ranking_model', v_ranking_model,
        'status', 'draft',
        'notes', v_notes
      )
    )
  );

  return query
  select
    f.id,
    f.portal_entity_id,
    f.portal_context_id,
    f.portal_modality_id,
    f.portal_competition_id,
    f.catalog_format_id,
    f.name,
    f.code,
    f.format_scope,
    f.format_family,
    f.event_model,
    f.result_model,
    f.ranking_model,
    f.status,
    f.notes
  from public.portal_competition_formats f
  where f.id = v_format_id;
end;
$$;

revoke all on function public.portal_create_competition_format(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.portal_create_competition_format(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

comment on function public.portal_create_competition_format(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
is 'Controlled Portal das Escolas function to create an audited draft competition-level format linked to an existing competition. Requires active portal_user and active can_view/can_create/can_edit permission. Does not alter portal_competitions.format legacy field.';

commit;
