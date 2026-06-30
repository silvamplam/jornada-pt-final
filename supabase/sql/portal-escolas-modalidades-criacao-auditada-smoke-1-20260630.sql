-- PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1
-- Smoke funcional com ROLLBACK.
--
-- Objetivo:
-- - simular auth.uid() do utilizador demo;
-- - criar uma modalidade temporária no contexto demo;
-- - confirmar que a modalidade existe dentro da transação;
-- - confirmar que a auditoria foi criada em portal_audit_events;
-- - fazer ROLLBACK no fim para não deixar dados persistidos.

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select u.auth_user_id::text
    from public.portal_users u
    where u.id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
      and u.status = 'active'
    limit 1
  ),
  true
);

create temp table portal_modality_smoke_created as
select *
from public.portal_create_modality(
  '11000000-0000-0000-0000-000000000001'::uuid,
  null,
  'Modalidade Smoke Auditoria',
  'smoke-modalidade-auditoria-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  'smoke-audit',
  'draft',
  'Modalidade temporária criada pelo smoke PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1.'
);

with created as (
  select *
  from portal_modality_smoke_created
),
created_row as (
  select
    pm.*
  from public.portal_modalities pm
  join created c
    on c.result_modality_id = pm.id
),
audit_row as (
  select
    ae.*
  from public.portal_audit_events ae
  join created c
    on c.result_modality_id = ae.object_id
  where ae.action_type = 'portal_modality_created'
    and ae.object_type = 'portal_modalities'
    and ae.actor_portal_user_id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
    and ae.metadata ->> 'phase' = 'PORTAL-ESCOLAS-MODALIDADES-CRIACAO-AUDITADA-1'
),
checks as (
  select
    '01_created_function_result' as check_group,
    'portal_create_modality_returned_row' as object_name,
    'function_result' as object_type,
    case when exists (select 1 from created) then 'ok' else 'missing' end as status,
    (select to_jsonb(created)::text from created limit 1) as details

  union all

  select
    '02_created_modality_row',
    'portal_modalities_inserted',
    'table_row',
    case
      when exists (
        select 1
        from created_row
        where name = 'Modalidade Smoke Auditoria'
          and status = 'draft'
          and portal_context_id = '11000000-0000-0000-0000-000000000001'::uuid
      ) then 'ok'
      else 'not_ok'
    end,
    (select to_jsonb(created_row)::text from created_row limit 1)

  union all

  select
    '03_audit',
    'portal_audit_events_inserted',
    'audit_event',
    case
      when exists (
        select 1
        from audit_row
        where action_type = 'portal_modality_created'
          and object_type = 'portal_modalities'
          and new_status = 'draft'
          and metadata ? 'new'
      ) then 'ok'
      else 'not_ok'
    end,
    (
      select jsonb_build_object(
        'id', id,
        'actor_portal_user_id', actor_portal_user_id,
        'action_type', action_type,
        'object_type', object_type,
        'object_id', object_id,
        'previous_status', previous_status,
        'new_status', new_status,
        'metadata', metadata
      )::text
      from audit_row
      limit 1
    )

  union all

  select
    '04_summary',
    'audited_modality_creation_smoke',
    'summary',
    case
      when not exists (select 1 from created) then 'not_ok'
      when not exists (select 1 from created_row) then 'not_ok'
      when not exists (select 1 from audit_row) then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'temporary_modality', 'Modalidade Smoke Auditoria',
      'audit_expected', true,
      'rollback_expected', true,
      'persistent_changes_expected', false
    )::text
)
select *
from checks
order by check_group, object_name;

rollback;
