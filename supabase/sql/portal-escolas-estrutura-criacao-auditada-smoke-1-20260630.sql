-- PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1
-- SQL 4/5 — SMOKE TEST COM ROLLBACK
--
-- Objetivo:
-- Validar em transação que public.portal_create_competition_structure(...)
-- cria estrutura competitiva draft em portal_stages,
-- exige formato competitivo formal prévio,
-- audita em portal_audit_events,
-- bloqueia duplicado por nome,
-- bloqueia status inicial diferente de draft,
-- e não deixa dados persistidos.
--
-- Importante:
-- Este SQL faz ROLLBACK.
-- A estrutura smoke NÃO deve ficar persistida.
-- A auditoria smoke NÃO deve ficar persistida.
--
-- Não executar GRANT SELECT em portal_audit_events.

begin;

select set_config(
  'request.jwt.claim.sub',
  '554965c7-4e9d-4b23-981d-5197e4abea93',
  true
);

set local role authenticated;

select
  '01_create_result' as check_group,
  result_structure_id,
  result_portal_entity_id,
  result_portal_context_id,
  result_portal_competition_id,
  result_competition_format_id,
  result_name,
  result_type,
  result_stage_order,
  result_scheduled_date,
  result_status
from public.portal_create_competition_structure(
  '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
  null,
  null,
  null,
  null,
  'draft'
);

do $$
begin
  begin
    perform 1
    from public.portal_create_competition_structure(
      '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
      null,
      null,
      null,
      null,
      'draft'
    );

    raise exception 'smoke_failed_duplicate_structure_guard_did_not_trigger';
  exception
    when unique_violation then
      raise notice 'SMOKE OK — duplicate structure guard triggered';
  end;

  begin
    perform 1
    from public.portal_create_competition_structure(
      '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
      'Smoke Estrutura Estado Inválido',
      'league_stage',
      2,
      null,
      'active'
    );

    raise exception 'smoke_failed_non_draft_guard_did_not_trigger';
  exception
    when invalid_parameter_value then
      raise notice 'SMOKE OK — non-draft guard triggered';
  end;
end $$;

reset role;

do $$
declare
  v_structure_id uuid;
  v_structure_count integer;
  v_audit_count integer;
begin
  select s.id
  into v_structure_id
  from public.portal_stages s
  where s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and s.name = 'Fase regular'
    and s.type = 'league_stage'
    and s.status = 'draft'
  limit 1;

  if v_structure_id is null then
    raise exception 'smoke_failed_structure_not_created';
  end if;

  select count(*)
  into v_structure_count
  from public.portal_stages s
  where s.id = v_structure_id
    and s.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and s.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and s.name = 'Fase regular'
    and s.type = 'league_stage'
    and s.stage_order = 1
    and s.scheduled_date is null
    and s.status = 'draft';

  if v_structure_count <> 1 then
    raise exception 'smoke_failed_structure_row_count: %', v_structure_count;
  end if;

  select count(*)
  into v_audit_count
  from public.portal_audit_events a
  where a.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and a.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and a.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and a.actor_reference = '554965c7-4e9d-4b23-981d-5197e4abea93'
    and a.actor_portal_user_id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
    and a.action_type = 'portal_competition_structure_created'
    and a.object_type = 'portal_stages'
    and a.object_id = v_structure_id
    and a.previous_status is null
    and a.new_status = 'draft'
    and a.metadata ->> 'phase' = 'PORTAL-ESCOLAS-ESTRUTURA-CRIACAO-AUDITADA-1'
    and a.metadata ->> 'source_function' = 'portal_create_competition_structure'
    and a.metadata ->> 'portal_modality_id' = '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'
    and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    and a.metadata ->> 'competition_format_id' = '8495aee6-5a20-4dba-b3d1-f78a59fedbef'
    and a.metadata ->> 'competition_format_code' = 'matchdays_table'
    and a.metadata ->> 'competition_format_family' = 'league'
    and a.metadata -> 'new' ->> 'name' = 'Fase regular'
    and a.metadata -> 'new' ->> 'type' = 'league_stage'
    and a.metadata -> 'new' ->> 'stage_order' = '1'
    and a.metadata -> 'new' ->> 'status' = 'draft';

  if v_audit_count <> 1 then
    raise exception 'smoke_failed_audit_row_count: %', v_audit_count;
  end if;

  raise notice 'SMOKE OK — structure_id %, structure_count %, audit_count %, rollback pending',
    v_structure_id,
    v_structure_count,
    v_audit_count;
end $$;

select
  '02_smoke_inside_transaction' as check_group,
  'structure_and_audit_exist_before_rollback' as object_name,
  'summary' as object_type,
  case
    when (
      select count(*)
      from public.portal_stages s
      where s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and s.name = 'Fase regular'
        and s.type = 'league_stage'
        and s.stage_order = 1
        and s.status = 'draft'
    ) = 1
    and (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_structure_created'
        and a.object_type = 'portal_stages'
        and a.metadata -> 'new' ->> 'name' = 'Fase regular'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ) = 1
    then 'ok'
    else 'not_ok'
  end as status,
  jsonb_build_object(
    'structure_rows_before_rollback',
    (
      select count(*)
      from public.portal_stages s
      where s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and s.name = 'Fase regular'
        and s.type = 'league_stage'
        and s.stage_order = 1
        and s.status = 'draft'
    ),
    'audit_rows_before_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_structure_created'
        and a.object_type = 'portal_stages'
        and a.metadata -> 'new' ->> 'name' = 'Fase regular'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ),
    'expected', 'structure_rows = 1 and audit_rows = 1 before rollback'
  )::text as details;

rollback;

select
  '03_smoke_rolled_back' as check_group,
  'structure_and_audit_not_persisted_after_rollback' as object_name,
  'summary' as object_type,
  case
    when exists (
      select 1
      from public.portal_stages s
      where s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and s.name = 'Fase regular'
        and s.type = 'league_stage'
    ) then 'not_ok_structure_persisted'
    when exists (
      select 1
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_structure_created'
        and a.object_type = 'portal_stages'
        and a.metadata -> 'new' ->> 'name' = 'Fase regular'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ) then 'not_ok_audit_persisted'
    else 'ok'
  end as status,
  jsonb_build_object(
    'structure_rows_after_rollback',
    (
      select count(*)
      from public.portal_stages s
      where s.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and s.name = 'Fase regular'
        and s.type = 'league_stage'
    ),
    'audit_rows_after_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_structure_created'
        and a.object_type = 'portal_stages'
        and a.metadata -> 'new' ->> 'name' = 'Fase regular'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ),
    'expected', 'structure_rows = 0 and audit_rows = 0',
    'next_step_if_ok', 'send rollback SQL for storage only, do not execute'
  )::text as details;
