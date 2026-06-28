-- Portal das Escolas - MULTIDESPORTO-SCHEMA-PROPOSTA-1.
-- Proposta idempotente e não destrutiva para validação manual.
-- Não executar automaticamente sem revisão.
-- Não remove tabelas/campos existentes.
-- Não altera o modelo público principal da Jornada.pt.
-- Não substitui portal_games/portal_results atuais.

create extension if not exists pgcrypto;

-- 1. Catálogo canónico de modalidades.
-- Esta tabela evita strings soltas e permite manter códigos estáveis.
create table if not exists public.portal_modality_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  modality_family text,
  default_event_model text,
  default_result_model text,
  status text not null default 'active',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_modality_catalog_code_not_empty check (btrim(code) <> ''),
  constraint portal_modality_catalog_name_not_empty check (btrim(name) <> ''),
  constraint portal_modality_catalog_status_not_empty check (btrim(status) <> '')
);

create unique index if not exists portal_modality_catalog_code_unique_idx
  on public.portal_modality_catalog (lower(code));

create index if not exists portal_modality_catalog_status_idx
  on public.portal_modality_catalog (status);

comment on table public.portal_modality_catalog is 'Canonical catalogue of sports/modalities used by Portal das Escolas.';
comment on column public.portal_modality_catalog.code is 'Stable canonical code, for example football, futsal, athletics, swimming, chess.';
comment on column public.portal_modality_catalog.modality_family is 'Optional grouping such as team_sport, individual_sport, racket_sport, mind_sport, multi_sport.';
comment on column public.portal_modality_catalog.default_event_model is 'Suggested default event model, for example match, race, field_event, tournament_round.';
comment on column public.portal_modality_catalog.default_result_model is 'Suggested default result model, for example score, sets, time, distance, ranking, points.';

-- 2. Modalidades ativadas dentro de uma entidade/contexto.
-- Esta é a camada formal Contexto -> Modalidade.
create table if not exists public.portal_modalities (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  catalog_modality_id uuid references public.portal_modality_catalog(id) on delete restrict,
  name text not null,
  slug text,
  local_code text,
  display_order integer,
  status text not null default 'active',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_modalities_name_not_empty check (btrim(name) <> ''),
  constraint portal_modalities_status_not_empty check (btrim(status) <> ''),
  constraint portal_modalities_display_order_positive check (display_order is null or display_order >= 0),
  constraint portal_modalities_local_code_not_empty check (local_code is null or btrim(local_code) <> '')
);

create unique index if not exists portal_modalities_context_slug_unique_idx
  on public.portal_modalities (portal_entity_id, portal_context_id, slug)
  where slug is not null;

create unique index if not exists portal_modalities_context_catalog_unique_idx
  on public.portal_modalities (portal_entity_id, portal_context_id, catalog_modality_id)
  where catalog_modality_id is not null;

create index if not exists portal_modalities_entity_idx on public.portal_modalities (portal_entity_id);
create index if not exists portal_modalities_context_idx on public.portal_modalities (portal_context_id);
create index if not exists portal_modalities_catalog_idx on public.portal_modalities (catalog_modality_id);
create index if not exists portal_modalities_status_idx on public.portal_modalities (status);
create index if not exists portal_modalities_order_idx on public.portal_modalities (display_order);

comment on table public.portal_modalities is 'Modalities/sports activated for a Portal entity within a specific context.';
comment on column public.portal_modalities.catalog_modality_id is 'Optional link to canonical modality catalogue.';
comment on column public.portal_modalities.local_code is 'Optional local code used by the school/entity.';

-- 3. Ligação opcional de competições à modalidade formal.
-- Mantém portal_competitions.modality como compatibilidade transitória.
alter table public.portal_competitions
  add column if not exists portal_modality_id uuid references public.portal_modalities(id) on delete restrict;

create index if not exists portal_competitions_modality_idx
  on public.portal_competitions (portal_modality_id);

comment on column public.portal_competitions.portal_modality_id is 'Formal modality link. portal_competitions.modality remains available as legacy/fallback text.';

-- 4. Escalões/categorias dentro de uma competição.
create table if not exists public.portal_competition_categories (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  name text not null,
  slug text,
  type text,
  gender text,
  age_min integer,
  age_max integer,
  display_order integer,
  status text not null default 'active',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_competition_categories_name_not_empty check (btrim(name) <> ''),
  constraint portal_competition_categories_status_not_empty check (btrim(status) <> ''),
  constraint portal_competition_categories_age_min_positive check (age_min is null or age_min >= 0),
  constraint portal_competition_categories_age_max_positive check (age_max is null or age_max >= 0),
  constraint portal_competition_categories_age_order check (age_min is null or age_max is null or age_min <= age_max),
  constraint portal_competition_categories_display_order_positive check (display_order is null or display_order >= 0)
);

create unique index if not exists portal_comp_categories_slug_unique_idx
  on public.portal_competition_categories (portal_entity_id, portal_context_id, portal_competition_id, slug)
  where slug is not null;

create index if not exists portal_comp_categories_entity_idx on public.portal_competition_categories (portal_entity_id);
create index if not exists portal_comp_categories_context_idx on public.portal_competition_categories (portal_context_id);
create index if not exists portal_comp_categories_modality_idx on public.portal_competition_categories (portal_modality_id);
create index if not exists portal_comp_categories_competition_idx on public.portal_competition_categories (portal_competition_id);
create index if not exists portal_comp_categories_status_idx on public.portal_competition_categories (status);
create index if not exists portal_comp_categories_order_idx on public.portal_competition_categories (display_order);

comment on table public.portal_competition_categories is 'Competition categories/age groups/classes for school sport contexts.';
comment on column public.portal_competition_categories.type is 'Optional category type, for example age_group, school_year, class, gender, level.';

-- 5. Eventos/provas/jogos universais.
-- Esta tabela não substitui portal_games nesta fase.
create table if not exists public.portal_events (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  name text not null,
  slug text,
  type text not null default 'event',
  event_order integer,
  scheduled_at timestamptz,
  venue text,
  status text not null default 'draft',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_events_name_not_empty check (btrim(name) <> ''),
  constraint portal_events_type_not_empty check (btrim(type) <> ''),
  constraint portal_events_status_not_empty check (btrim(status) <> ''),
  constraint portal_events_event_order_positive check (event_order is null or event_order >= 0)
);

create unique index if not exists portal_events_slug_unique_idx
  on public.portal_events (portal_entity_id, portal_context_id, portal_competition_id, slug)
  where slug is not null;

create index if not exists portal_events_entity_idx on public.portal_events (portal_entity_id);
create index if not exists portal_events_context_idx on public.portal_events (portal_context_id);
create index if not exists portal_events_modality_idx on public.portal_events (portal_modality_id);
create index if not exists portal_events_competition_idx on public.portal_events (portal_competition_id);
create index if not exists portal_events_category_idx on public.portal_events (portal_category_id);
create index if not exists portal_events_stage_idx on public.portal_events (portal_stage_id);
create index if not exists portal_events_type_idx on public.portal_events (type);
create index if not exists portal_events_status_idx on public.portal_events (status);
create index if not exists portal_events_scheduled_at_idx on public.portal_events (scheduled_at);
create index if not exists portal_events_order_idx on public.portal_events (event_order);

comment on table public.portal_events is 'Generic event/prova/jogo layer for multi-sport support.';
comment on column public.portal_events.type is 'Examples: match, race, field_event, heat, final, round, tournament_round, relay, exercise, event.';

-- 6. Participantes por evento.
-- Permite eventos com 2 ou N participantes.
create table if not exists public.portal_event_participants (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  portal_event_id uuid not null references public.portal_events(id) on delete restrict,
  portal_participant_id uuid not null references public.portal_participants(id) on delete restrict,
  role text,
  lane text,
  bib_number text,
  seed_order integer,
  group_label text,
  status text not null default 'active',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_event_participants_status_not_empty check (btrim(status) <> ''),
  constraint portal_event_participants_seed_order_positive check (seed_order is null or seed_order >= 0)
);

create unique index if not exists portal_event_participants_unique_idx
  on public.portal_event_participants (portal_event_id, portal_participant_id);

create index if not exists portal_event_participants_entity_idx on public.portal_event_participants (portal_entity_id);
create index if not exists portal_event_participants_context_idx on public.portal_event_participants (portal_context_id);
create index if not exists portal_event_participants_modality_idx on public.portal_event_participants (portal_modality_id);
create index if not exists portal_event_participants_competition_idx on public.portal_event_participants (portal_competition_id);
create index if not exists portal_event_participants_category_idx on public.portal_event_participants (portal_category_id);
create index if not exists portal_event_participants_stage_idx on public.portal_event_participants (portal_stage_id);
create index if not exists portal_event_participants_event_idx on public.portal_event_participants (portal_event_id);
create index if not exists portal_event_participants_participant_idx on public.portal_event_participants (portal_participant_id);
create index if not exists portal_event_participants_status_idx on public.portal_event_participants (status);
create index if not exists portal_event_participants_seed_order_idx on public.portal_event_participants (seed_order);

comment on table public.portal_event_participants is 'Participants entered in a generic multi-sport event/prova/jogo.';
comment on column public.portal_event_participants.role is 'Optional role, for example home, away, competitor, relay_team, judge_visible_entry.';

-- 7. Resultados por participante.
-- Modelo multiformato: pontuação, tempo, distância, posição, sets, tentativas, ranking, etc.
create table if not exists public.portal_result_entries (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_modality_id uuid references public.portal_modalities(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_category_id uuid references public.portal_competition_categories(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  portal_event_id uuid not null references public.portal_events(id) on delete restrict,
  portal_event_participant_id uuid references public.portal_event_participants(id) on delete restrict,
  portal_participant_id uuid not null references public.portal_participants(id) on delete restrict,
  result_status text not null default 'draft',
  rank integer,
  position_label text,
  score_numeric numeric,
  score_text text,
  points numeric,
  time_ms integer,
  distance_m numeric,
  mark_text text,
  set_scores jsonb,
  attempts jsonb,
  outcome text,
  is_winner boolean,
  validation_notes text,
  submitted_at timestamptz,
  validated_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_result_entries_status_not_empty check (btrim(result_status) <> ''),
  constraint portal_result_entries_rank_positive check (rank is null or rank >= 0),
  constraint portal_result_entries_time_ms_positive check (time_ms is null or time_ms >= 0)
);

create unique index if not exists portal_result_entries_participant_unique_idx
  on public.portal_result_entries (portal_event_id, portal_participant_id);

create index if not exists portal_result_entries_entity_idx on public.portal_result_entries (portal_entity_id);
create index if not exists portal_result_entries_context_idx on public.portal_result_entries (portal_context_id);
create index if not exists portal_result_entries_modality_idx on public.portal_result_entries (portal_modality_id);
create index if not exists portal_result_entries_competition_idx on public.portal_result_entries (portal_competition_id);
create index if not exists portal_result_entries_category_idx on public.portal_result_entries (portal_category_id);
create index if not exists portal_result_entries_stage_idx on public.portal_result_entries (portal_stage_id);
create index if not exists portal_result_entries_event_idx on public.portal_result_entries (portal_event_id);
create index if not exists portal_result_entries_event_participant_idx on public.portal_result_entries (portal_event_participant_id);
create index if not exists portal_result_entries_participant_idx on public.portal_result_entries (portal_participant_id);
create index if not exists portal_result_entries_status_idx on public.portal_result_entries (result_status);
create index if not exists portal_result_entries_rank_idx on public.portal_result_entries (rank);
create index if not exists portal_result_entries_submitted_at_idx on public.portal_result_entries (submitted_at);
create index if not exists portal_result_entries_validated_at_idx on public.portal_result_entries (validated_at);

comment on table public.portal_result_entries is 'Per-participant result entries for generic multi-sport events.';
comment on column public.portal_result_entries.time_ms is 'Time result in milliseconds, useful for athletics/swimming.';
comment on column public.portal_result_entries.distance_m is 'Distance/mark in metres, useful for field events.';
comment on column public.portal_result_entries.set_scores is 'Structured set scores, useful for volleyball/tennis/table tennis.';
comment on column public.portal_result_entries.attempts is 'Structured attempts/tries, useful for jumps/throws/gymnastics.';
comment on column public.portal_result_entries.outcome is 'Optional outcome, for example win, loss, draw, dnf, dns, dq.';

-- 8. Ligações opcionais dos conteúdos a modalidade/evento.
-- Não remove ligações existentes a competição/fase/jogo/participante.
alter table public.portal_content_submissions
  add column if not exists portal_modality_id uuid references public.portal_modalities(id) on delete restrict;

alter table public.portal_content_submissions
  add column if not exists portal_event_id uuid references public.portal_events(id) on delete restrict;

create index if not exists portal_content_submissions_modality_idx
  on public.portal_content_submissions (portal_modality_id);

create index if not exists portal_content_submissions_event_idx
  on public.portal_content_submissions (portal_event_id);

comment on column public.portal_content_submissions.portal_modality_id is 'Optional future link to formal modality.';
comment on column public.portal_content_submissions.portal_event_id is 'Optional future link to generic portal event/prova/jogo.';

-- 9. Seeds canónicos mínimos, idempotentes.
-- Estes códigos são catálogo, não dados de uma escola específica.
insert into public.portal_modality_catalog (
  code,
  name,
  modality_family,
  default_event_model,
  default_result_model,
  status
) values
  ('football', 'Futebol', 'team_sport', 'match', 'score', 'active'),
  ('futsal', 'Futsal', 'team_sport', 'match', 'score', 'active'),
  ('basketball', 'Basquetebol', 'team_sport', 'match', 'score', 'active'),
  ('handball', 'Andebol', 'team_sport', 'match', 'score', 'active'),
  ('volleyball', 'Voleibol', 'team_sport', 'match', 'sets', 'active'),
  ('athletics', 'Atletismo', 'individual_sport', 'race_or_field_event', 'time_distance_ranking', 'active'),
  ('swimming', 'Natação', 'individual_sport', 'race', 'time_ranking', 'active'),
  ('table_tennis', 'Ténis de mesa', 'racket_sport', 'match', 'sets', 'active'),
  ('badminton', 'Badminton', 'racket_sport', 'match', 'sets', 'active'),
  ('chess', 'Xadrez', 'mind_sport', 'match_or_tournament_round', 'points_ranking', 'active'),
  ('gymnastics', 'Ginástica', 'individual_sport', 'exercise', 'score_ranking', 'active'),
  ('multi_sport', 'Multidesporto', 'multi_sport', 'event', 'mixed', 'active')
on conflict do nothing;

-- 10. RLS.
-- As tabelas novas ficam com RLS ativo.
-- Policies SELECT são criadas apenas se a função public.portal_can_select_scope existir.
alter table public.portal_modality_catalog enable row level security;
alter table public.portal_modalities enable row level security;
alter table public.portal_competition_categories enable row level security;
alter table public.portal_events enable row level security;
alter table public.portal_event_participants enable row level security;
alter table public.portal_result_entries enable row level security;

-- Catálogo canónico: leitura autenticada. Não contém dados sensíveis por escola.
drop policy if exists portal_modality_catalog_select_authenticated on public.portal_modality_catalog;
create policy portal_modality_catalog_select_authenticated
on public.portal_modality_catalog
for select to authenticated
using (status = 'active');

-- Policies de escopo: só criadas se a função de escopo do Portal já existir.
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
    execute 'drop policy if exists portal_modalities_select_by_scope on public.portal_modalities';
    execute 'create policy portal_modalities_select_by_scope on public.portal_modalities for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, null::uuid))';

    execute 'drop policy if exists portal_comp_categories_select_by_scope on public.portal_competition_categories';
    execute 'create policy portal_comp_categories_select_by_scope on public.portal_competition_categories for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';

    execute 'drop policy if exists portal_events_select_by_scope on public.portal_events';
    execute 'create policy portal_events_select_by_scope on public.portal_events for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';

    execute 'drop policy if exists portal_event_participants_select_by_scope on public.portal_event_participants';
    execute 'create policy portal_event_participants_select_by_scope on public.portal_event_participants for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';

    execute 'drop policy if exists portal_result_entries_select_by_scope on public.portal_result_entries';
    execute 'create policy portal_result_entries_select_by_scope on public.portal_result_entries for select to authenticated using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id))';
  end if;
end $$;

-- 11. Nota de compatibilidade.
-- A app atual pode continuar a ler portal_competitions.modality.
-- A passagem para portal_modality_id deve ser feita numa fase de leitura read-only separada.
