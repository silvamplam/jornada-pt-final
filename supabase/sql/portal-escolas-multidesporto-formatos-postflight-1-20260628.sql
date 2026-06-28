-- Portal das Escolas - MULTIDESPORTO-FORMATOS-POSTFLIGHT-1.
-- Validacao read-only depois de aplicar a camada de formatos/classificacoes.
-- Nao altera dados, schema, policies ou grants.

-- 1. Tabelas criadas.
select
  'target_tables_after_schema' as check_group,
  expected.table_name,
  case when t.table_name is null then 'missing' else 'ok' end as status
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

-- 2. Colunas-chave.
select
  'key_columns' as check_group,
  expected.table_name,
  expected.column_name,
  case when c.column_name is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_competition_format_catalog', 'code'),
    ('portal_competition_format_catalog', 'default_ranking_model'),
    ('portal_competition_formats', 'portal_competition_id'),
    ('portal_competition_formats', 'catalog_format_id'),
    ('portal_competition_formats', 'scoring_rules'),
    ('portal_competition_formats', 'tie_breakers'),
    ('portal_rankings', 'portal_competition_id'),
    ('portal_rankings', 'portal_format_id'),
    ('portal_rankings', 'ranking_scope'),
    ('portal_rankings', 'ranking_type'),
    ('portal_ranking_entries', 'portal_ranking_id'),
    ('portal_ranking_entries', 'portal_participant_id'),
    ('portal_ranking_entries', 'points'),
    ('portal_ranking_entries', 'played'),
    ('portal_ranking_entries', 'wins'),
    ('portal_ranking_entries', 'draws'),
    ('portal_ranking_entries', 'losses'),
    ('portal_ranking_entries', 'time_ms'),
    ('portal_ranking_entries', 'distance_m'),
    ('portal_ranking_entries', 'mark_text')
) as expected(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name
order by expected.table_name, expected.column_name;

-- 3. Seeds de formatos.
select
  'format_catalog_seed' as check_group,
  expected.code,
  case when f.code is null then 'missing' else 'ok' end as status,
  f.name
from (
  values
    ('matchdays_table'),
    ('round_robin_league'),
    ('knockout_cup'),
    ('groups_then_knockout'),
    ('swiss_tournament'),
    ('event_meeting'),
    ('race_ranking'),
    ('field_event_ranking'),
    ('points_ranking'),
    ('multi_event_points')
) as expected(code)
left join public.portal_competition_format_catalog f
  on lower(f.code) = expected.code
order by expected.code;

-- 4. RLS ativo.
select
  'rls_enabled' as check_group,
  c.relname as table_name,
  case when c.relrowsecurity then 'ok' else 'missing' end as status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'portal_competition_format_catalog',
    'portal_competition_formats',
    'portal_rankings',
    'portal_ranking_entries'
  )
order by c.relname;

-- 5. Policies SELECT esperadas.
select
  'select_policies' as check_group,
  expected.policy_name,
  expected.table_name,
  case when p.policyname is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_competition_format_catalog_select_authenticated', 'portal_competition_format_catalog'),
    ('portal_competition_formats_select_by_scope', 'portal_competition_formats'),
    ('portal_rankings_select_by_scope', 'portal_rankings'),
    ('portal_ranking_entries_select_by_scope', 'portal_ranking_entries')
) as expected(policy_name, table_name)
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename = expected.table_name
 and p.policyname = expected.policy_name
order by expected.table_name, expected.policy_name;

-- 6. Grants SELECT para authenticated.
select
  'select_grants_authenticated' as check_group,
  expected.table_name,
  case when g.table_name is null then 'missing' else 'ok' end as status
from (
  values
    ('portal_competition_format_catalog'),
    ('portal_competition_formats'),
    ('portal_rankings'),
    ('portal_ranking_entries')
) as expected(table_name)
left join information_schema.role_table_grants g
  on g.table_schema = 'public'
 and g.table_name = expected.table_name
 and g.grantee = 'authenticated'
 and g.privilege_type = 'SELECT'
order by expected.table_name;

-- 7. Compatibilidade: campos antigos continuam presentes.
select
  'legacy_columns_still_present' as check_group,
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
