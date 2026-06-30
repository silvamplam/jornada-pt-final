-- PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1
-- SQL 4/5 — SMOKE TEST CORRIGIDO COM ROLLBACK
--
-- Objetivo:
-- Validar em transação que public.portal_create_competition(...)
-- cria competição draft ligada à modalidade formal,
-- audita em portal_audit_events,
-- bloqueia duplicados,
-- bloqueia status inicial diferente de draft,
-- e não deixa dados persistidos.
--
-- Importante:
-- Este SQL faz ROLLBACK.
-- A competição smoke NÃO deve ficar persistida.
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
  result_competition_id,
  result_portal_entity_id,
  result_portal_context_id,
  result_portal_modality_id,
  result_name,
  result_slug,
  result_modality,
  result_scope,
  result_format,
  result_status
from public.portal_create_competition(
  '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'::uuid,
  'Smoke Competição Auditada Rollback 20260630',
  'smoke-competicao-auditada-rollback-20260630',
  'smoke',
  'smoke rollback',
  'draft'
);

do $$
begin
  begin
    perform 1
    from public.portal_create_competition(
      '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'::uuid,
      'Smoke Competição Auditada Rollback 20260630',
      'smoke-competicao-auditada-rollback-20260630',
      'smoke',
      'smoke rollback',
      'draft'
    );

    raise exception 'smoke_failed_duplicate_guard_did_not_trigger';
  exception
    when unique_violation then
      raise notice 'SMOKE OK — duplicate guard triggered';
  end;

  begin
    perform 1
    from public.portal_create_competition(
      '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'::uuid,
      'Smoke Competição Estado Inválido',
      'smoke-competicao-estado-invalido-rollback-20260630',
      'smoke',
      'smoke rollback',
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
  v_competition_id uuid;
  v_competition_count integer;
  v_audit_count integer;
begin
  select c.id
  into v_competition_id
  from public.portal_competitions c
  where c.slug = 'smoke-competicao-auditada-rollback-20260630'
  limit 1;

  if v_competition_id is null then
    raise exception 'smoke_failed_competition_not_created';
  end if;

  select count(*)
  into v_competition_count
  from public.portal_competitions c
  where c.id = v_competition_id
    and c.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and c.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and c.portal_modality_id = '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'::uuid
    and c.name = 'Smoke Competição Auditada Rollback 20260630'
    and c.slug = 'smoke-competicao-auditada-rollback-20260630'
    and c.modality = 'Modalidade Slug Automatico'
    and c.scope = 'smoke'
    and c.format = 'smoke rollback'
    and c.status = 'draft';

  if v_competition_count <> 1 then
    raise exception 'smoke_failed_competition_row_count: %', v_competition_count;
  end if;

  select count(*)
  into v_audit_count
  from public.portal_audit_events a
  where a.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and a.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and a.portal_competition_id = v_competition_id
    and a.actor_reference = '554965c7-4e9d-4b23-981d-5197e4abea93'
    and a.actor_portal_user_id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
    and a.action_type = 'portal_competition_created'
    and a.object_type = 'portal_competitions'
    and a.object_id = v_competition_id
    and a.previous_status is null
    and a.new_status = 'draft'
    and a.metadata ->> 'phase' = 'PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1'
    and a.metadata ->> 'source_function' = 'portal_create_competition'
    and a.metadata ->> 'portal_modality_id' = '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'
    and a.metadata -> 'new' ->> 'slug' = 'smoke-competicao-auditada-rollback-20260630'
    and a.metadata -> 'new' ->> 'status' = 'draft';

  if v_audit_count <> 1 then
    raise exception 'smoke_failed_audit_row_count: %', v_audit_count;
  end if;

  raise notice 'SMOKE OK — competition_id %, competition_count %, audit_count %, rollback pending',
    v_competition_id,
    v_competition_count,
    v_audit_count;
end $$;

select
  '02_smoke_inside_transaction' as check_group,
  'competition_and_audit_exist_before_rollback' as object_name,
  'summary' as object_type,
  case
    when (
      select count(*)
      from public.portal_competitions c
      where c.slug = 'smoke-competicao-auditada-rollback-20260630'
    ) = 1
    and (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_created'
        and a.metadata -> 'new' ->> 'slug' = 'smoke-competicao-auditada-rollback-20260630'
    ) = 1
    then 'ok'
    else 'not_ok'
  end as status,
  jsonb_build_object(
    'competition_rows_before_rollback',
    (
      select count(*)
      from public.portal_competitions c
      where c.slug = 'smoke-competicao-auditada-rollback-20260630'
    ),
    'audit_rows_before_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_created'
        and a.metadata -> 'new' ->> 'slug' = 'smoke-competicao-auditada-rollback-20260630'
    ),
    'expected', 'both counts must be 1 before rollback'
  )::text as details;

rollback;

select
  '03_smoke_rolled_back' as check_group,
  'competition_and_audit_not_persisted_after_rollback' as object_name,
  'summary' as object_type,
  case
    when exists (
      select 1
      from public.portal_competitions c
      where c.slug = 'smoke-competicao-auditada-rollback-20260630'
    ) then 'not_ok_competition_persisted'
    when exists (
      select 1
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_created'
        and a.metadata -> 'new' ->> 'slug' = 'smoke-competicao-auditada-rollback-20260630'
    ) then 'not_ok_audit_persisted'
    else 'ok'
  end as status,
  jsonb_build_object(
    'competition_rows_after_rollback',
    (
      select count(*)
      from public.portal_competitions c
      where c.slug = 'smoke-competicao-auditada-rollback-20260630'
    ),
    'audit_rows_after_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_created'
        and a.metadata -> 'new' ->> 'slug' = 'smoke-competicao-auditada-rollback-20260630'
    ),
    'expected', 'both counts must be 0',
    'next_step_if_ok', 'send rollback SQL for storage only, do not execute'
  )::text as details;
