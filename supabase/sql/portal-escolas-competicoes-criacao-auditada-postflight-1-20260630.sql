-- PORTAL-ESCOLAS-COMPETICOES-CRIACAO-AUDITADA-1
-- SQL 3/5 — POSTFLIGHT READ-ONLY
--
-- Objetivo:
-- Confirmar que public.portal_create_competition(...) foi criada
-- com assinatura, segurança, search_path, permissões e comentário esperados.
--
-- Não altera dados.
-- Não chama a função.
-- Não faz inserts/updates/deletes.

with fn as (
  select
    p.oid,
    p.proname,
    p.oid::regprocedure::text as signature,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as returns,
    pg_get_functiondef(p.oid) as definition,
    p.prosecdef as is_security_definer,
    p.proconfig as config,
    obj_description(p.oid, 'pg_proc') as comment
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'portal_create_competition'
),
fn_count as (
  select count(*) as total
  from fn
),
expected_signature as (
  select
    'portal_create_competition(uuid,text,text,text,text,text)'::text as signature
),
checks as (
  select
    '01_function_exists' as check_group,
    'public.portal_create_competition' as object_name,
    'function' as object_type,
    case
      when (select total from fn_count) = 1 then 'ok'
      when (select total from fn_count) = 0 then 'missing'
      else 'not_ok_multiple_overloads'
    end as status,
    jsonb_build_object(
      'function_count', (select total from fn_count),
      'signatures', coalesce((select jsonb_agg(signature order by signature) from fn), '[]'::jsonb)
    )::text as details

  union all

  select
    '02_signature',
    'portal_create_competition(uuid,text,text,text,text,text)',
    'signature',
    case
      when exists (
        select 1
        from fn
        where signature = (select signature from expected_signature)
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'expected', (select signature from expected_signature),
      'actual', coalesce((select jsonb_agg(signature order by signature) from fn), '[]'::jsonb)
    )::text

  union all

  select
    '03_security',
    'security_definer',
    'function_property',
    case
      when exists (
        select 1
        from fn
        where signature = (select signature from expected_signature)
          and is_security_definer = true
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'expected_security_definer', true,
      'actual', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'signature', signature,
              'is_security_definer', is_security_definer
            )
            order by signature
          )
          from fn
        ),
        '[]'::jsonb
      )
    )::text

  union all

  select
    '04_search_path',
    'search_path_public',
    'function_property',
    case
      when exists (
        select 1
        from fn
        where signature = (select signature from expected_signature)
          and config @> array['search_path=public']
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'expected', 'search_path=public',
      'actual', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'signature', signature,
              'config', config
            )
            order by signature
          )
          from fn
        ),
        '[]'::jsonb
      )
    )::text

  union all

  select
    '05_execute_grant',
    'authenticated_can_execute',
    'privilege',
    case
      when has_function_privilege(
        'authenticated',
        'public.portal_create_competition(uuid,text,text,text,text,text)',
        'execute'
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'role', 'authenticated',
      'privilege', 'execute',
      'function', 'public.portal_create_competition(uuid,text,text,text,text,text)'
    )::text

  union all

  select
    '06_public_execute_revoked',
    'public_cannot_execute',
    'privilege',
    case
      when has_function_privilege(
        'public',
        'public.portal_create_competition(uuid,text,text,text,text,text)',
        'execute'
      ) then 'not_ok_public_can_execute'
      else 'ok'
    end,
    jsonb_build_object(
      'role', 'public',
      'expected', 'no execute privilege',
      'function', 'public.portal_create_competition(uuid,text,text,text,text,text)'
    )::text

  union all

  select
    '07_returns',
    'expected_return_columns',
    'function_result',
    case
      when exists (
        select 1
        from fn
        where signature = (select signature from expected_signature)
          and returns ilike '%result_competition_id uuid%'
          and returns ilike '%result_portal_entity_id uuid%'
          and returns ilike '%result_portal_context_id uuid%'
          and returns ilike '%result_portal_modality_id uuid%'
          and returns ilike '%result_name text%'
          and returns ilike '%result_slug text%'
          and returns ilike '%result_modality text%'
          and returns ilike '%result_scope text%'
          and returns ilike '%result_format text%'
          and returns ilike '%result_status text%'
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'actual_returns', coalesce((select returns from fn limit 1), null)
    )::text

  union all

  select
    '08_definition_guards',
    'required_logic_fragments',
    'function_definition',
    case
      when exists (
        select 1
        from fn
        where signature = (select signature from expected_signature)
          and definition ilike '%auth.uid()%'
          and definition ilike '%portal_user_not_found%'
          and definition ilike '%portal_competition_initial_status_must_be_draft%'
          and definition ilike '%portal_competition_create_not_allowed%'
          and definition ilike '%portal_competition_slug_already_exists%'
          and definition ilike '%insert into public.portal_competitions%'
          and definition ilike '%insert into public.portal_audit_events%'
          and definition ilike '%portal_competition_created%'
          and definition ilike '%portal_competitions%'
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'checks', jsonb_build_object(
        'auth_uid', exists (select 1 from fn where definition ilike '%auth.uid()%'),
        'portal_user_guard', exists (select 1 from fn where definition ilike '%portal_user_not_found%'),
        'draft_guard', exists (select 1 from fn where definition ilike '%portal_competition_initial_status_must_be_draft%'),
        'permission_guard', exists (select 1 from fn where definition ilike '%portal_competition_create_not_allowed%'),
        'duplicate_guard', exists (select 1 from fn where definition ilike '%portal_competition_slug_already_exists%'),
        'competition_insert', exists (select 1 from fn where definition ilike '%insert into public.portal_competitions%'),
        'audit_insert', exists (select 1 from fn where definition ilike '%insert into public.portal_audit_events%'),
        'audit_action', exists (select 1 from fn where definition ilike '%portal_competition_created%'),
        'audit_object', exists (select 1 from fn where definition ilike '%portal_competitions%')
      )
    )::text

  union all

  select
    '09_comment',
    'function_comment',
    'comment',
    case
      when exists (
        select 1
        from fn
        where comment ilike '%Controlled Portal das Escolas function%'
          and comment ilike '%audited draft competition%'
      ) then 'ok'
      else 'not_ok'
    end,
    jsonb_build_object(
      'comment', coalesce((select comment from fn limit 1), null)
    )::text

  union all

  select
    '10_summary',
    'ready_for_smoke_with_rollback',
    'summary',
    case
      when (select total from fn_count) <> 1 then 'not_ok_function_count'
      when not exists (
        select 1 from fn
        where signature = (select signature from expected_signature)
      ) then 'not_ok_signature'
      when not exists (
        select 1 from fn
        where signature = (select signature from expected_signature)
          and is_security_definer = true
      ) then 'not_ok_security_definer'
      when not exists (
        select 1 from fn
        where signature = (select signature from expected_signature)
          and config @> array['search_path=public']
      ) then 'not_ok_search_path'
      when not has_function_privilege(
        'authenticated',
        'public.portal_create_competition(uuid,text,text,text,text,text)',
        'execute'
      ) then 'not_ok_authenticated_execute'
      when has_function_privilege(
        'public',
        'public.portal_create_competition(uuid,text,text,text,text,text)',
        'execute'
      ) then 'not_ok_public_execute'
      else 'ok'
    end,
    jsonb_build_object(
      'expected_next_step_if_ok', 'smoke test with begin + set local role authenticated + set local request.jwt.claim.sub + call function + verify rows + rollback',
      'safe_to_smoke_now', false,
      'note', 'Este postflight não autoriza smoke automático. Enviar resultado para validação antes do SQL smoke.'
    )::text
)
select
  check_group,
  object_name,
  object_type,
  status,
  details
from checks
order by
  check_group,
  object_name;
