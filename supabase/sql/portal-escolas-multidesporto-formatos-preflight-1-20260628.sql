-- Portal das Escolas - MULTIDESPORTO-FORMATOS-PREFLIGHT-1.
-- Diagnostico read-only antes de aplicar a camada de formatos/classificacoes.
-- Nao altera dados, schema, policies ou grants.

-- 1. Tabelas base obrigatorias do Portal.
select
  'base_tables' as check_group,
  expected.table_name,
  case when t.table_name is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_entities'),
    ('portal_contexts'),
    ('portal_competitions'),
    ('portal_participants'),
    ('portal_competition_participants'),
    ('portal_stages'),
    ('portal_games'),
    ('portal_results'),
    ('portal_content_submissions'),
    ('portal_permissions')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;

-- 2. Tabelas multidesporto anteriores obrigatorias.
select
  'multisport_tables' as check_group,
  expected.table_name,
  case when t.table_name is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_modality_catalog'),
    ('portal_modalities'),
    ('portal_competition_categories'),
    ('portal_events'),
    ('portal_event_participants'),
    ('portal_result_entries')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;

-- 3. Colunas legadas que devem continuar intactas.
select
  'legacy_columns' as check_group,
  expected.table_name,
  expected.column_name,
  case when c.column_name is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_competitions', 'modality'),
    ('portal_competitions', 'format'),
    ('portal_games', 'home_participant_id'),
    ('portal_games', 'away_participant_id'),
    ('portal_results', 'home_score'),
    ('portal_results', 'away_score')
) as expected(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name
order by expected.table_name, expected.column_name;

-- 4. Funcao de escopo/RLS necessaria para as novas policies.
select
  'portal_can_select_scope' as check_group,
  'function' as object_type,
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'portal_can_select_scope'
      and pg_get_function_identity_arguments(p.oid) = 'target_portal_entity_id uuid, target_portal_context_id uuid, target_portal_competition_id uuid'
  ) then 'ok' else 'missing' end as status;

-- 5. Estado previo das novas tabelas desta fase.
select
  'target_tables_before_schema' as check_group,
  expected.table_name,
  case when t.table_name is null then 'not_created_yet' else 'already_exists' end as status
from (
  values
    ('portal_competition_format_catalog'),
    ('portal_competition_formats'),
    ('portal_rankings'),
    ('portal_ranking_entries')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;
