-- PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1
-- Smoke funcional com ROLLBACK.
-- Simula uma escrita de resultado pela função existente, confirma que é criado audit event,
-- confirma que o ranking continua recalculado e reverte tudo no fim.

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

select *
from public.portal_upsert_result_entry(
  (
    select e.id
    from public.portal_events e
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
    limit 1
  ),
  (
    select ep.portal_participant_id
    from public.portal_event_participants ep
    join public.portal_events e
      on e.id = ep.portal_event_id
    join public.portal_participants p
      on p.id = ep.portal_participant_id
    where e.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
      and e.name = 'Núcleo Demo Norte vs Associação Demo Convidada'
      and p.name = 'Núcleo Demo Norte'
    limit 1
  ),
  '2',
  2,
  3,
  'win',
  'submitted'
);

with audit_rows as (
  select
    ae.*
  from public.portal_audit_events ae
  where ae.actor_portal_user_id = '11ac17b3-31a0-4a0b-9cf0-be65cbaf72eb'::uuid
    and ae.object_type = 'portal_result_entries'
    and ae.action_type in ('portal_result_entry_created', 'portal_result_entry_updated')
    and ae.metadata ->> 'phase' = 'PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1'
  order by ae.created_at desc
  limit 5
),
ranking_rows as (
  select
    p.name as participant_name,
    pre.points,
    pre.score_for,
    pre.score_against,
    pre.score_difference
  from public.portal_rankings pr
  join public.portal_ranking_entries pre
    on pre.portal_ranking_id = pr.id
  join public.portal_participants p
    on p.id = pre.portal_participant_id
  where pr.portal_competition_id = '12000000-0000-0000-0000-000000000001'::uuid
    and pr.slug = 'legacy-demo-league-table'
),
checks as (
  select
    '01_audit' as check_group,
    'audit_event_created' as object_name,
    'audit_event' as object_type,
    case when exists (select 1 from audit_rows) then 'ok' else 'missing' end as status,
    (select jsonb_agg(to_jsonb(audit_rows))::text from audit_rows) as details

  union all

  select
    '02_ranking',
    'nucleo_ranking_still_recalculated',
    'ranking_entry',
    case
      when exists (
        select 1
        from ranking_rows
        where participant_name = 'Núcleo Demo Norte'
          and points = 3
          and score_for = 2
          and score_against = 0
          and score_difference = 2
      ) then 'ok'
      else 'not_ok'
    end,
    (
      select to_jsonb(ranking_rows)::text
      from ranking_rows
      where participant_name = 'Núcleo Demo Norte'
      limit 1
    )

  union all

  select
    '03_summary',
    'result_write_audit_smoke',
    'summary',
    case
      when not exists (select 1 from audit_rows) then 'not_ok'
      when not exists (
        select 1
        from ranking_rows
        where participant_name = 'Núcleo Demo Norte'
          and points = 3
          and score_for = 2
          and score_against = 0
          and score_difference = 2
      ) then 'not_ok'
      else 'ok'
    end,
    jsonb_build_object(
      'rollback_expected', true,
      'audited_object_type', 'portal_result_entries',
      'ranking_recalculation_preserved', true
    )::text
)
select *
from checks
order by check_group, object_name;

rollback;
