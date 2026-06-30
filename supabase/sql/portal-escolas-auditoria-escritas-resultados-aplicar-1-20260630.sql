-- PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1
-- Aplicar: adiciona auditoria automática à escrita de resultados existente.
--
-- Estratégia:
-- - preservar a assinatura e retorno atuais de public.portal_upsert_result_entry(...);
-- - manter recálculo automático do ranking demo;
-- - registar cada criação/edição de resultado em public.portal_audit_events;
-- - não alterar React, schema, RLS, policies ou grants.

begin;

create or replace function public.portal_upsert_result_entry(
  p_portal_event_id uuid,
  p_portal_participant_id uuid,
  p_score_text text default null,
  p_score_numeric numeric default null,
  p_points numeric default null,
  p_outcome text default null,
  p_result_status text default 'submitted'
)
returns table (
  result_entry_id uuid,
  result_event_id uuid,
  result_participant_id uuid,
  saved_result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_actor_portal_user_id uuid;
  v_event record;
  v_event_participant record;
  v_result_status text := coalesce(nullif(btrim(p_result_status), ''), 'submitted');
  v_outcome text := nullif(btrim(coalesce(p_outcome, '')), '');
  v_score_text text := nullif(btrim(coalesce(p_score_text, '')), '');
  v_has_permission boolean := false;
  v_previous_result_entry_id uuid;
  v_previous_status text;
  v_previous_score_text text;
  v_previous_score_numeric numeric;
  v_previous_points numeric;
  v_previous_outcome text;
  v_saved_result_entry_id uuid;
  v_saved_event_id uuid;
  v_saved_participant_id uuid;
  v_saved_status text;
begin
  if v_auth_user_id is null then
    raise exception 'portal_not_authenticated' using errcode = '28000';
  end if;

  if p_portal_event_id is null or p_portal_participant_id is null then
    raise exception 'portal_invalid_result_target' using errcode = '22023';
  end if;

  if v_result_status not in ('draft', 'submitted', 'validated') then
    raise exception 'portal_invalid_result_status' using errcode = '22023';
  end if;

  if v_outcome is not null and v_outcome not in ('win', 'draw', 'loss', 'dnf', 'dns', 'dq') then
    raise exception 'portal_invalid_result_outcome' using errcode = '22023';
  end if;

  if v_score_text is null and p_score_numeric is null and p_points is null and v_outcome is null then
    raise exception 'portal_empty_result' using errcode = '22023';
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
    e.id,
    e.portal_entity_id,
    e.portal_context_id,
    e.portal_modality_id,
    e.portal_competition_id,
    e.portal_stage_id
  into v_event
  from public.portal_events e
  where e.id = p_portal_event_id;

  if not found then
    raise exception 'portal_event_not_found' using errcode = 'P0002';
  end if;

  select ep.*
  into v_event_participant
  from public.portal_event_participants ep
  where ep.portal_event_id = p_portal_event_id
    and ep.portal_participant_id = p_portal_participant_id
  limit 1;

  if not found then
    raise exception 'portal_event_participant_not_found' using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.portal_permissions p
    where p.portal_user_id = v_actor_portal_user_id
      and p.status = 'active'
      and p.can_view = true
      and p.can_edit = true
      and (v_result_status <> 'validated' or p.can_validate = true)
      and p.portal_entity_id = v_event.portal_entity_id
      and (p.portal_context_id is null or p.portal_context_id = v_event.portal_context_id)
      and (p.portal_competition_id is null or p.portal_competition_id = v_event.portal_competition_id)
  ) into v_has_permission;

  if not v_has_permission then
    raise exception 'portal_result_write_not_allowed' using errcode = '42501';
  end if;

  select
    re.id,
    re.result_status,
    re.score_text,
    re.score_numeric,
    re.points,
    re.outcome
  into
    v_previous_result_entry_id,
    v_previous_status,
    v_previous_score_text,
    v_previous_score_numeric,
    v_previous_points,
    v_previous_outcome
  from public.portal_result_entries re
  where re.portal_event_id = p_portal_event_id
    and re.portal_participant_id = p_portal_participant_id
  limit 1;

  insert into public.portal_result_entries (
    portal_entity_id,
    portal_context_id,
    portal_modality_id,
    portal_competition_id,
    portal_stage_id,
    portal_event_id,
    portal_event_participant_id,
    portal_participant_id,
    result_status,
    score_numeric,
    score_text,
    points,
    outcome,
    is_winner,
    submitted_at,
    validated_at,
    metadata
  ) values (
    v_event.portal_entity_id,
    v_event.portal_context_id,
    v_event.portal_modality_id,
    v_event.portal_competition_id,
    v_event.portal_stage_id,
    p_portal_event_id,
    v_event_participant.id,
    p_portal_participant_id,
    v_result_status,
    p_score_numeric,
    v_score_text,
    p_points,
    v_outcome,
    case
      when v_outcome = 'win' then true
      when v_outcome is null then null
      else false
    end,
    now(),
    case when v_result_status = 'validated' then now() else null end,
    jsonb_build_object(
      'source', 'portal_escolas_resultados_insercao_demo_1',
      'auto_recalculate_phase', 'PORTAL-ESCOLAS-RANKING-AUTO-RECALCULO-DEMO-1',
      'audit_phase', 'PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1',
      'updated_by_auth_user_id', v_auth_user_id,
      'updated_by_portal_user_id', v_actor_portal_user_id,
      'updated_at', now()
    )
  )
  on conflict (portal_event_id, portal_participant_id)
  do update set
    portal_event_participant_id = excluded.portal_event_participant_id,
    result_status = excluded.result_status,
    score_numeric = excluded.score_numeric,
    score_text = excluded.score_text,
    points = excluded.points,
    outcome = excluded.outcome,
    is_winner = excluded.is_winner,
    submitted_at = coalesce(public.portal_result_entries.submitted_at, excluded.submitted_at),
    validated_at = case when excluded.result_status = 'validated' then now() else null end,
    metadata = coalesce(public.portal_result_entries.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now()
  returning
    public.portal_result_entries.id,
    public.portal_result_entries.portal_event_id,
    public.portal_result_entries.portal_participant_id,
    public.portal_result_entries.result_status
  into
    v_saved_result_entry_id,
    v_saved_event_id,
    v_saved_participant_id,
    v_saved_status;

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
    v_event.portal_entity_id,
    v_event.portal_context_id,
    v_event.portal_competition_id,
    v_auth_user_id::text,
    v_actor_portal_user_id,
    case
      when v_previous_result_entry_id is null then 'portal_result_entry_created'
      else 'portal_result_entry_updated'
    end,
    'portal_result_entries',
    v_saved_result_entry_id,
    v_previous_status,
    v_saved_status,
    jsonb_build_object(
      'phase', 'PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1',
      'source_function', 'portal_upsert_result_entry',
      'portal_event_id', v_saved_event_id,
      'portal_participant_id', v_saved_participant_id,
      'previous', jsonb_build_object(
        'result_entry_id', v_previous_result_entry_id,
        'result_status', v_previous_status,
        'score_text', v_previous_score_text,
        'score_numeric', v_previous_score_numeric,
        'points', v_previous_points,
        'outcome', v_previous_outcome
      ),
      'new', jsonb_build_object(
        'result_status', v_saved_status,
        'score_text', v_score_text,
        'score_numeric', p_score_numeric,
        'points', p_points,
        'outcome', v_outcome
      )
    )
  );

  if v_event.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid then
    perform 1
    from public.portal_recalculate_demo_competition_ranking();
  end if;

  return query
  select
    v_saved_result_entry_id,
    v_saved_event_id,
    v_saved_participant_id,
    v_saved_status;
end;
$$;

revoke all on function public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text) from public;
grant execute on function public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text) to authenticated;

comment on function public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)
is 'Controlled Portal das Escolas result upsert for existing event participants. Requires active can_edit permission scoped to the event; validated status also requires can_validate. Demo competition results automatically trigger demo ranking recalculation. Each write is recorded in portal_audit_events.';

commit;
