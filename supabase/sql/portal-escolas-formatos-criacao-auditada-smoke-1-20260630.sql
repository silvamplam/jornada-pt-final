-- PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1
-- SQL 4/5 — SMOKE TEST COM ROLLBACK
--
-- Objetivo:
-- Validar em transação que public.portal_create_competition_format(...)
-- cria formato competitivo draft ligado à competição,
-- usa catálogo formal,
-- audita em portal_audit_events,
-- bloqueia duplicado por formato de competição,
-- bloqueia status inicial diferente de draft,
-- não altera portal_competitions.format legacy,
-- e não deixa dados persistidos.
--
-- Importante:
-- Este SQL faz ROLLBACK.
-- O formato smoke NÃO deve ficar persistido.
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
  result_format_id,
  result_portal_entity_id,
  result_portal_context_id,
  result_portal_modality_id,
  result_portal_competition_id,
  result_catalog_format_id,
  result_name,
  result_code,
  result_format_scope,
  result_format_family,
  result_event_model,
  result_result_model,
  result_ranking_model,
  result_status,
  result_notes
from public.portal_create_competition_format(
  '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
  '30169413-5714-45aa-af0a-537991f703d9'::uuid,
  null,
  null,
  'competition',
  null,
  null,
  null,
  null,
  'Smoke formato competitivo com rollback 20260630',
  'draft'
);

do $$
begin
  begin
    perform 1
    from public.portal_create_competition_format(
      '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
      '30169413-5714-45aa-af0a-537991f703d9'::uuid,
      null,
      null,
      'competition',
      null,
      null,
      null,
      null,
      'Smoke duplicado deve falhar',
      'draft'
    );

    raise exception 'smoke_failed_duplicate_format_guard_did_not_trigger';
  exception
    when unique_violation then
      raise notice 'SMOKE OK — duplicate competition-format guard triggered';
  end;

  begin
    perform 1
    from public.portal_create_competition_format(
      '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid,
      '30169413-5714-45aa-af0a-537991f703d9'::uuid,
      'Smoke Formato Estado Inválido',
      'smoke_formato_estado_invalido_rollback_20260630',
      'competition',
      null,
      null,
      null,
      null,
      'Smoke estado inválido deve falhar',
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
  v_format_id uuid;
  v_format_count integer;
  v_audit_count integer;
  v_legacy_format text;
begin
  select f.id
  into v_format_id
  from public.portal_competition_formats f
  where f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and f.code = 'round_robin_league'
    and f.status = 'draft'
  limit 1;

  if v_format_id is null then
    raise exception 'smoke_failed_format_not_created';
  end if;

  select count(*)
  into v_format_count
  from public.portal_competition_formats f
  where f.id = v_format_id
    and f.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and f.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and f.portal_modality_id = '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'::uuid
    and f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and f.catalog_format_id = '30169413-5714-45aa-af0a-537991f703d9'::uuid
    and f.name = 'Liga todos contra todos'
    and f.code = 'round_robin_league'
    and f.format_scope = 'competition'
    and f.format_family = 'league'
    and f.event_model = 'match'
    and f.result_model = 'score'
    and f.ranking_model = 'league_table'
    and f.status = 'draft'
    and f.notes = 'Smoke formato competitivo com rollback 20260630';

  if v_format_count <> 1 then
    raise exception 'smoke_failed_format_row_count: %', v_format_count;
  end if;

  select c.format
  into v_legacy_format
  from public.portal_competitions c
  where c.id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid;

  if v_legacy_format is not null then
    raise exception 'smoke_failed_legacy_competition_format_was_changed: %', v_legacy_format;
  end if;

  select count(*)
  into v_audit_count
  from public.portal_audit_events a
  where a.portal_entity_id = '10000000-0000-0000-0000-000000000001'::uuid
    and a.portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
    and a.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    and a.actor_reference = '554965c7-4e9d-4b23-981d-5197e4abea93'
    and a.actor_portal_user_id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
    and a.action_type = 'portal_competition_format_created'
    and a.object_type = 'portal_competition_formats'
    and a.object_id = v_format_id
    and a.previous_status is null
    and a.new_status = 'draft'
    and a.metadata ->> 'phase' = 'PORTAL-ESCOLAS-FORMATOS-CRIACAO-AUDITADA-1'
    and a.metadata ->> 'source_function' = 'portal_create_competition_format'
    and a.metadata ->> 'portal_modality_id' = '4718d870-0792-4c2a-bebe-a3b7e7b4bb9e'
    and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    and a.metadata ->> 'catalog_format_id' = '30169413-5714-45aa-af0a-537991f703d9'
    and a.metadata ->> 'legacy_competition_format_unchanged' = 'true'
    and a.metadata -> 'new' ->> 'code' = 'round_robin_league'
    and a.metadata -> 'new' ->> 'status' = 'draft';

  if v_audit_count <> 1 then
    raise exception 'smoke_failed_audit_row_count: %', v_audit_count;
  end if;

  raise notice 'SMOKE OK — format_id %, format_count %, audit_count %, rollback pending',
    v_format_id,
    v_format_count,
    v_audit_count;
end $$;

select
  '02_smoke_inside_transaction' as check_group,
  'format_and_audit_exist_before_rollback' as object_name,
  'summary' as object_type,
  case
    when (
      select count(*)
      from public.portal_competition_formats f
      where f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and f.code = 'round_robin_league'
        and f.status = 'draft'
    ) = 1
    and (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_format_created'
        and a.metadata -> 'new' ->> 'code' = 'round_robin_league'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ) = 1
    and (
      select c.format is null
      from public.portal_competitions c
      where c.id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    )
    then 'ok'
    else 'not_ok'
  end as status,
  jsonb_build_object(
    'format_rows_before_rollback',
    (
      select count(*)
      from public.portal_competition_formats f
      where f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and f.code = 'round_robin_league'
        and f.status = 'draft'
    ),
    'audit_rows_before_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_format_created'
        and a.metadata -> 'new' ->> 'code' = 'round_robin_league'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ),
    'legacy_competition_format',
    (
      select c.format
      from public.portal_competitions c
      where c.id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    ),
    'expected', 'format_rows = 1, audit_rows = 1, legacy_competition_format = null before rollback'
  )::text as details;

rollback;

select
  '03_smoke_rolled_back' as check_group,
  'format_and_audit_not_persisted_after_rollback' as object_name,
  'summary' as object_type,
  case
    when exists (
      select 1
      from public.portal_competition_formats f
      where f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and f.code = 'round_robin_league'
    ) then 'not_ok_format_persisted'
    when exists (
      select 1
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_format_created'
        and a.metadata -> 'new' ->> 'code' = 'round_robin_league'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ) then 'not_ok_audit_persisted'
    else 'ok'
  end as status,
  jsonb_build_object(
    'format_rows_after_rollback',
    (
      select count(*)
      from public.portal_competition_formats f
      where f.portal_competition_id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
        and f.code = 'round_robin_league'
    ),
    'audit_rows_after_rollback',
    (
      select count(*)
      from public.portal_audit_events a
      where a.action_type = 'portal_competition_format_created'
        and a.metadata -> 'new' ->> 'code' = 'round_robin_league'
        and a.metadata ->> 'portal_competition_id' = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'
    ),
    'legacy_competition_format_after_rollback',
    (
      select c.format
      from public.portal_competitions c
      where c.id = '83953311-f8ab-4d0e-b3b5-cf6ff3ada820'::uuid
    ),
    'expected', 'format_rows = 0, audit_rows = 0, legacy_competition_format = null',
    'next_step_if_ok', 'send rollback SQL for storage only, do not execute'
  )::text as details;
