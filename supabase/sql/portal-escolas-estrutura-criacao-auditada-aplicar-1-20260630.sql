-- PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1
-- SQL 2/5 — APLICAR
--
-- Objetivo:
-- Criar função controlada para criação auditada de estrutura competitiva
-- em public.portal_stages, associada a uma competição existente que já tem formato formal.
--
-- Escopo:
-- - cria/atualiza apenas public.portal_create_competition_structure(...);
-- - escrita controlada em public.portal_stages;
-- - auditoria em public.portal_audit_events;
-- - autorização por portal_user ativo + permissão ativa;
-- - estrutura nasce sempre em draft/Rascunho;
-- - valida que a competição já tem formato competitivo formal;
-- - NÃO cria eventos;
-- - NÃO cria participantes;
-- - NÃO cria resultados;
-- - sem UI;
-- - sem /admin;
-- - sem backoffice;
-- - sem páginas públicas antigas.

begin;

create or replace function public.portal_create_competition_structure(
  p_portal_competition_id uuid,
  p_name text default null,
  p_type text default null,
  p_stage_order integer default null,
  p_scheduled_date date default null,
  p_status text default 'draft'
)
returns table (
  result_structure_id uuid,
  result_portal_entity_id uuid,
  result_portal_context_id uuid,
  result_portal_competition_id uuid,
  result_competition_format_id uuid,
  result_name text,
  result_type text,
  result_stage_order integer,
  result_scheduled_date date,
  result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_actor_portal_user_id uuid;
  v_competition record;
  v_format record;
  v_name text;
  v_type text;
  v_stage_order integer;
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_has_permission boolean := false;
  v_structure_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'portal_not_authenticated' using errcode = '28000';
  end if;

  if p_portal_competition_id is null then
    raise exception 'portal_invalid_competition' using errcode = '22023';
  end if;

  if v_status <> 'draft' then
    raise exception 'portal_competition_structure_initial_status_must_be_draft' using errcode = '22023';
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
    raise exception 'portal_competition_not_available_for_structure_creation' using errcode = '42501';
  end if;

  if v_competition.portal_modality_id is null then
    raise exception 'portal_competition_missing_modality' using errcode = '42501';
  end if;

  if coalesce(v_competition.modality_status, '') not in ('draft', 'active') then
    raise exception 'portal_modality_not_available_for_structure_creation' using errcode = '42501';
  end if;

  select
    f.id,
    f.name,
    f.code,
    f.format_scope,
    f.format_family,
    f.event_model,
    f.result_model,
    f.ranking_model,
    f.status
  into v_format
  from public.portal_competition_formats f
  where f.portal_entity_id = v_competition.portal_entity_id
    and f.portal_context_id = v_competition.portal_context_id
    and f.portal_modality_id = v_competition.portal_modality_id
    and f.portal_competition_id = v_competition.id
    and f.format_scope = 'competition'
    and f.status in ('draft', 'active')
  order by f.created_at desc nulls last
  limit 1;

  if not found then
    raise exception 'portal_competition_format_required_before_structure' using errcode = '42501';
  end if;

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
    raise exception 'portal_competition_structure_create_not_allowed' using errcode = '42501';
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');

  if v_name is null then
    v_name := case
      when v_format.code in ('matchdays_table', 'round_robin_league') then 'Fase regular'
      when v_format.code = 'knockout_cup' then 'Eliminatória'
      when v_format.code = 'groups_then_knockout' then 'Fase de grupos'
      when v_format.code = 'swiss_tournament' then 'Rondas suíças'
      when v_format.code = 'race_ranking' then 'Prova por tempos'
      when v_format.code = 'field_event_ranking' then 'Prova por marcas'
      when v_format.code = 'multi_event_points' then 'Competição multi-evento'
      when v_format.code = 'points_ranking' then 'Ranking por pontos'
      when v_format.code = 'event_meeting' then 'Encontro'
      else 'Estrutura competitiva'
    end;
  end if;

  v_type := nullif(btrim(coalesce(p_type, '')), '');

  if v_type is null then
    v_type := case
      when v_format.format_family = 'league' then 'league_stage'
      when v_format.format_family = 'knockout' then 'knockout_stage'
      when v_format.format_family = 'hybrid' then 'group_stage'
      when v_format.format_family = 'swiss' then 'swiss_stage'
      when v_format.format_family = 'ranking' then 'ranking_stage'
      when v_format.format_family = 'race' then 'race_stage'
      when v_format.format_family = 'field_event' then 'field_event_stage'
      when v_format.format_family = 'multi_event' then 'multi_event_stage'
      when v_format.format_family = 'meeting' then 'meeting_stage'
      else 'stage'
    end;
  end if;

  if v_type is null then
    raise exception 'portal_competition_structure_type_required' using errcode = '22023';
  end if;

  if p_stage_order is not null and p_stage_order < 1 then
    raise exception 'portal_competition_structure_order_invalid' using errcode = '22023';
  end if;

  if p_stage_order is null then
    select coalesce(max(s.stage_order), 0) + 1
    into v_stage_order
    from public.portal_stages s
    where s.portal_entity_id = v_competition.portal_entity_id
      and s.portal_context_id = v_competition.portal_context_id
      and s.portal_competition_id = v_competition.id
      and s.status <> 'archived';
  else
    v_stage_order := p_stage_order;
  end if;

  if exists (
    select 1
    from public.portal_stages s
    where s.portal_entity_id = v_competition.portal_entity_id
      and s.portal_context_id = v_competition.portal_context_id
      and s.portal_competition_id = v_competition.id
      and s.status <> 'archived'
      and lower(s.name) = lower(v_name)
  ) then
    raise exception 'portal_competition_structure_name_already_exists' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.portal_stages s
    where s.portal_entity_id = v_competition.portal_entity_id
      and s.portal_context_id = v_competition.portal_context_id
      and s.portal_competition_id = v_competition.id
      and s.status <> 'archived'
      and s.stage_order = v_stage_order
  ) then
    raise exception 'portal_competition_structure_order_already_exists' using errcode = '23505';
  end if;

  insert into public.portal_stages (
    portal_entity_id,
    portal_context_id,
    portal_competition_id,
    name,
    type,
    stage_order,
    scheduled_date,
    status
  ) values (
    v_competition.portal_entity_id,
    v_competition.portal_context_id,
    v_competition.id,
    v_name,
    v_type,
    v_stage_order,
    p_scheduled_date,
    'draft'
  )
  returning id into v_structure_id;

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
    'portal_competition_structure_created',
    'portal_stages',
    v_structure_id,
    null,
    'draft',
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1',
      'source_function', 'portal_create_competition_structure',
      'portal_modality_id', v_competition.portal_modality_id,
      'portal_competition_id', v_competition.id,
      'competition_format_id', v_format.id,
      'competition_format_code', v_format.code,
      'competition_format_family', v_format.format_family,
      'new', jsonb_build_object(
        'name', v_name,
        'type', v_type,
        'stage_order', v_stage_order,
        'scheduled_date', p_scheduled_date,
        'status', 'draft'
      )
    )
  );

  return query
  select
    s.id,
    s.portal_entity_id,
    s.portal_context_id,
    s.portal_competition_id,
    v_format.id,
    s.name,
    s.type,
    s.stage_order,
    s.scheduled_date,
    s.status
  from public.portal_stages s
  where s.id = v_structure_id;
end;
$$;

revoke all on function public.portal_create_competition_structure(
  uuid,
  text,
  text,
  integer,
  date,
  text
) from public;

grant execute on function public.portal_create_competition_structure(
  uuid,
  text,
  text,
  integer,
  date,
  text
) to authenticated;

comment on function public.portal_create_competition_structure(
  uuid,
  text,
  text,
  integer,
  date,
  text
)
is 'Controlled Portal das Escolas function to create an audited draft competition structure in portal_stages. Requires an existing competition-level format and active can_view/can_create/can_edit permission. Does not create events, participants or results.';

commit;
