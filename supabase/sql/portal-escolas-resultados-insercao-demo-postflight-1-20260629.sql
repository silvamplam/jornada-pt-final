-- PORTAL-ESCOLAS-RESULTADOS-INSERCAO-DEMO-1
-- Postflight read-only. Confirma funcao e permissao de execucao.

select
  'function_exists' as check_type,
  'portal_upsert_result_entry' as target,
  case
    when to_regprocedure('public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)') is not null then 'ok'
    else 'missing'
  end as status
union all
select
  'execute_grant' as check_type,
  'authenticated' as target,
  case
    when has_function_privilege('authenticated', 'public.portal_upsert_result_entry(uuid, uuid, text, numeric, numeric, text, text)', 'execute') then 'ok'
    else 'missing'
  end as status
union all
select
  'editable_permissions' as check_type,
  'active can_edit permissions' as target,
  case when count(*) > 0 then 'ok' else 'missing' end as status
from public.portal_permissions
where status = 'active'
  and can_view = true
  and can_edit = true;
