-- Portal das Escolas - MULTIDESPORTO-FORMATOS-SCHEMA-PROPOSTA-1.
-- Proposta idempotente e nao destrutiva para formatos de competicao e classificacoes/rankings.
-- Nao remove tabelas/campos existentes.
-- Nao altera o modelo publico principal da Jornada.pt.
-- Nao substitui portal_games/portal_results.
-- Nao substitui portal_competitions.format.

create extension if not exists pgcrypto;

-- 1. Catalogo canonico de formatos de competicao.
create table if not exists public.portal_competition_format_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  format_family text,
  default_event_model text,
  default_result_model text,
  default_ranking_model text,
  supports_head_to_head boolean not null default false,
  supports_multi_participant_events boolean not null default false,
  supports_stages boolean not null default true,
  supports_knockout boolean not null default false,
  status text not null default 'active',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_competition_format_catalog_code_not_empty check (btrim(code) <> ''),
  constraint portal_competition_format_catalog_name_not_empty check (btrim(name) <> ''),
  constraint portal_competition_format_catalog_status_not_empty check (btrim(status) <> '')
);

create unique index if not exists portal_competition_format_catalog_code_unique_idx
  on public.portal_competition_format_catalog (lower(code));

create index if not exists portal_competition_format_catalog_status_idx
  on public.portal_competition_format_catalog (status);

create index if not exists portal_competition_format_catalog_family_idx
  on public.portal_competition_format_catalog (format_family);

comment on table public.portal_competition_format_catalog is 'Canonical catalogue of competition formats for Portal das Escolas.';
comment on column public.portal_competition_format_catalog.code is 'Stable format code, for example matchdays_table, knockout_cup, race_ranking, swiss_tournament.';
comment on column public.portal_competition_format_catalog.default_ranking_model is 'Suggested ranking/classification model for this format.';

-- 2. Formato aplicado a uma competicao/categoria/fase concreta.
create table if not exists public.portal_competition_formats (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  catalog_format_id uuid references public.portal_competition_format_catalog(id) on delete restrict,
  name text not null,
  code text,
  format_scope text not null default 'competition',
  format_family text,
  event_model text,
  result_model text,
  ranking_model text,
  scoring_rules jsonb,
  tie_breakers jsonb,
  settings jsonb,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_competition_formats_name_not_empty check (btrim(name) <> ''),
  constraint portal_competition_formats_scope_not_empty check (btrim(format_scope) <> ''),
  constraint portal_competition_formats_status_not_empty check (btrim(status) <> ''),
  constraint portal_competition_formats_code_not_empty check (code is null or btrim(code) <> '')
);

create unique index if not exists portal_competition_formats_code_unique_idx
  on public.portal_competition_formats (portal_entity_id, portal_context_id, portal_competition_id, lower(code))
  where code is not null;

create index if not exists portal_competition_formats_entity_idx on public.portal_competition_formats (portal_entity_id);
create index if not exists portal_competition_formats_context_idx on public.portal_competition_formats (portal_context_id);
create index if not exists portal_competition_formats_modality_idx on public.portal_competition_formats (portal_modality_id);
create index if not exists portal_competition_formats_competition_idx on public.portal_competition_formats (portal_competition_id);
create index if not exists portal_competition_formats_category_idx on public.portal_competition_formats (portal_category_id);
create index if not exists portal_competition_formats_stage_idx on public.portal_competition_formats (portal_stage_id);
create index if not exists portal_competition_formats_catalog_idx on public.portal_competition_formats (catalog_format_id);
create index if not exists portal_competition_formats_scope_idx on public.portal_competition_formats (format_scope);
create index if not exists portal_competition_formats_status_idx on public.portal_competition_formats (status);

comment on table public.portal_competition_formats is 'Configured competition format layer for concrete school competitions/categories/stages.';
comment on column public.portal_competition_formats.format_scope is 'Scope of the configured format, for example competition, category, stage, event_series.';
comment on column public.portal_competition_formats.scoring_rules is 'Structured scoring rules snapshot for this configured format.';
comment on column public.portal_competition_formats.tie_breakers is 'Structured tie-breaker rules snapshot for this configured format.';

-- 3. Cabecalho de classificacoes/rankings.
create table if not exists public.portal_rankings (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_format_id uuid references public.portal_competition_formats(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  portal_event_id uuid references public.portal_events(id) on delete restrict,
  name text not null,
  slug text,
  ranking_scope text not null default 'competition',
  ranking_type text not null default 'overall',
  calculation_mode text not null default 'manual_snapshot',
  source text not null default 'manual',
  status text not null default 'draft',
  generated_at timestamptz,
  published_at timestamptz,
  rules_snapshot jsonb,
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_rankings_name_not_empty check (btrim(name) <> ''),
  constraint portal_rankings_scope_not_empty check (btrim(ranking_scope) <> ''),
  constraint portal_rankings_type_not_empty check (btrim(ranking_type) <> ''),
  constraint portal_rankings_calculation_mode_not_empty check (btrim(calculation_mode) <> ''),
  constraint portal_rankings_source_not_empty check (btrim(source) <> ''),
  constraint portal_rankings_status_not_empty check (btrim(status) <> '')
);

create unique index if not exists portal_rankings_slug_unique_idx
  on public.portal_rankings (portal_entity_id, portal_context_id, portal_competition_id, slug)
  where slug is not null;

create index if not exists portal_rankings_entity_idx on public.portal_rankings (portal_entity_id);
create index if not exists portal_rankings_context_idx on public.portal_rankings (portal_context_id);
create index if not exists portal_rankings_modality_idx on public.portal_rankings (portal_modality_id);
create index if not exists portal_rankings_competition_idx on public.portal_rankings (portal_competition_id);
create index if not exists portal_rankings_format_idx on public.portal_rankings (portal_format_id);
create index if not exists portal_rankings_category_idx on public.portal_rankings (portal_category_id);
create index if not exists portal_rankings_stage_idx on public.portal_rankings (portal_stage_id);
create index if not exists portal_rankings_event_idx on public.portal_rankings (portal_event_id);
create index if not exists portal_rankings_scope_idx on public.portal_rankings (ranking_scope);
create index if not exists portal_rankings_type_idx on public.portal_rankings (ranking_type);
create index if not exists portal_rankings_status_idx on public.portal_rankings (status);
create index if not exists portal_rankings_published_at_idx on public.portal_rankings (published_at);

comment on table public.portal_rankings is 'Classification/ranking headers for Portal das Escolas competitions/events.';
comment on column public.portal_rankings.ranking_scope is 'Scope of the ranking, for example competition, category, stage, event, group, school, participant.';
comment on column public.portal_rankings.ranking_type is 'Type of ranking, for example league_table, event_ranking, team_points, overall_points, medal_table.';
comment on column public.portal_rankings.rules_snapshot is 'Rules used to generate/validate this ranking at the time it was created.';

-- 4. Linhas de classificacao/ranking.
create table if not exists public.portal_ranking_entries (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_ranking_id uuid not null references public.portal_rankings(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  portal_event_id uuid references public.portal_events(id) on delete restrict,
  portal_result_entry_id uuid references public.portal_result_entries(id) on delete restrict,
  portal_participant_id uuid not null references public.portal_participants(id) on delete restrict,
  rank integer,
  position_label text,
  participant_label_override text,
  points numeric,
  played integer,
  wins integer,
  draws integer,
  losses integer,
  forfeits integer,
  score_for numeric,
  score_against numeric,
  score_difference numeric,
  sets_for numeric,
  sets_against numeric,
  time_ms integer,
  distance_m numeric,
  mark_text text,
  medal text,
  tie_breaker_values jsonb,
  form jsonb,
  status text not null default 'active',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_ranking_entries_status_not_empty check (btrim(status) <> ''),
  constraint portal_ranking_entries_rank_positive check (rank is null or rank >= 0),
  constraint portal_ranking_entries_played_positive check (played is null or played >= 0),
  constraint portal_ranking_entries_wins_positive check (wins is null or wins >= 0),
  constraint portal_ranking_entries_draws_positive check (draws is null or draws >= 0),
  constraint portal_ranking_entries_losses_positive check (losses is null or losses >= 0),
  constraint portal_ranking_entries_forfeits_positive check (forfeits is null or forfeits >= 0),
  constraint portal_ranking_entries_time_ms_positive check (time_ms is null or time_ms >= 0)
);

create unique index if not exists portal_ranking_entries_participant_unique_idx
  on public.portal_ranking_entries (portal_ranking_id, portal_participant_id);

create index if not exists portal_ranking_entries_entity_idx on public.portal_ranking_entries (portal_entity_id);
create index if not exists portal_ranking_entries_context_idx on public.portal_ranking_entries (portal_context_id);
create index if not exists portal_ranking_entries_modality_idx on public.portal_ranking_entries (portal_modality_id);
create index if not exists portal_ranking_entries_competition_idx on public.portal_ranking_entries (portal_competition_id);
create index if not exists portal_ranking_entries_ranking_idx on public.portal_ranking_entries (portal_ranking_id);
create index if not exists portal_ranking_entries_category_idx on public.portal_ranking_entries (portal_category_id);
create index if not exists portal_ranking_entries_stage_idx on public.portal_ranking_entries (portal_stage_id);
create index if not exists portal_ranking_entries_event_idx on public.portal_ranking_entries (portal_event_id);
create index if not exists portal_ranking_entries_result_entry_idx on public.portal_ranking_entries (portal_result_entry_id);
create index if not exists portal_ranking_entries_participant_idx on public.portal_ranking_entries (portal_participant_id);
create index if not exists portal_ranking_entries_rank_idx on public.portal_ranking_entries (rank);
create index if not exists portal_ranking_entries_status_idx on public.portal_ranking_entries (status);

comment on table public.portal_ranking_entries is 'Rows/entries for Portal das Escolas classifications and rankings.';
comment on column public.portal_ranking_entries.points is 'Generic points total for league tables, rankings or school/team classifications.';
comment on column public.portal_ranking_entries.time_ms is 'Time in milliseconds for time-based rankings.';
comment on column public.portal_ranking_entries.distance_m is 'Distance/mark in metres for field-event rankings.';
comment on column public.portal_ranking_entries.tie_breaker_values is 'Structured tie-breaker values used to order this entry.';

-- 5. Seeds canonicos minimos de formatos.
insert into public.portal_competition_format_catalog (
  code,
  name,
  format_family,
  default_event_model,
  default_result_model,
  default_ranking_model,
  supports_head_to_head,
  supports_multi_participant_events,
  supports_stages,
  supports_knockout,
  status
) values
  ('matchdays_table', 'Campeonato por jornadas com classificacao', 'league', 'match', 'score', 'league_table', true, false, true, false, 'active'),
  ('round_robin_league', 'Liga todos contra todos', 'league', 'match', 'score', 'league_table', true, false, true, false, 'active'),
  ('knockout_cup', 'Taca/eliminatoria', 'knockout', 'match', 'score', 'bracket_progression', true, false, true, true, 'active'),
  ('groups_then_knockout', 'Fase de grupos + eliminatorias', 'hybrid', 'match', 'score', 'group_tables_and_bracket', true, false, true, true, 'active'),
  ('swiss_tournament', 'Torneio suico', 'swiss', 'match_or_round', 'points', 'points_ranking', true, true, true, false, 'active'),
  ('event_meeting', 'Meeting/encontro de provas', 'meeting', 'event', 'mixed', 'event_rankings', false, true, true, false, 'active'),
  ('race_ranking', 'Prova por tempos', 'race', 'race', 'time', 'time_ranking', false, true, false, false, 'active'),
  ('field_event_ranking', 'Prova por marcas', 'field_event', 'field_event', 'distance_or_mark', 'mark_ranking', false, true, false, false, 'active'),
  ('points_ranking', 'Ranking por pontos', 'ranking', 'event', 'points', 'points_ranking', false, true, true, false, 'active'),
  ('multi_event_points', 'Competicao multi-evento por pontos', 'multi_event', 'event_series', 'points', 'overall_points', false, true, true, false, 'active')
on conflict do nothing;

-- 6. RLS e grants read-only.
alter table public.portal_competition_format_catalog enable row level security;
alter table public.portal_competition_formats enable row level security;
alter table public.portal_rankings enable row level security;
alter table public.portal_ranking_entries enable row level security;

grant select on public.portal_competition_format_catalog to authenticated;
grant select on public.portal_competition_formats to authenticated;
grant select on public.portal_rankings to authenticated;
grant select on public.portal_ranking_entries to authenticated;

-- Catalogo canonico: leitura autenticada apenas de formatos ativos.
drop policy if exists portal_competition_format_catalog_select_authenticated on public.portal_competition_format_catalog;
create policy portal_competition_format_catalog_select_authenticated
on public.portal_competition_format_catalog
for select to authenticated
using (status = 'active');

-- Policies de escopo: criadas apenas se a funcao de escopo do Portal existir.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'portal_can_select_scope'
      and pg_get_function_identity_arguments(p.oid) = 'target_portal_entity_id uuid, target_portal_context_id uuid, target_portal_competition_id uuid'
  ) then
    execute 'drop policy if exists portal_competition_formats_select_by_scope on public.portal_competition_formats';
    execute 'create policy portal_competition_formats_select_by_scope on public.portal_competition_formats for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';

    execute 'drop policy if exists portal_rankings_select_by_scope on public.portal_rankings';
    execute 'create policy portal_rankings_select_by_scope on public.portal_rankings for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';

    execute 'drop policy if exists portal_ranking_entries_select_by_scope on public.portal_ranking_entries';
    execute 'create policy portal_ranking_entries_select_by_scope on public.portal_ranking_entries for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';
  end if;
end $$;
