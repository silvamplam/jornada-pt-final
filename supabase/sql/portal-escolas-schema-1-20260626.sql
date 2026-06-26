-- Portal das Escolas - schema inicial isolado para revisão manual.
-- Não executar automaticamente. Não cria API, policies RLS, roles, grants ou seeds.
-- Todas as tabelas usam prefixo portal_ e não dependem das tabelas editoriais atuais.

create extension if not exists pgcrypto;

create table if not exists public.portal_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  type text not null,
  status text not null default 'active',
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_entities_name_not_empty check (btrim(name) <> ''),
  constraint portal_entities_type_not_empty check (btrim(type) <> ''),
  constraint portal_entities_status_not_empty check (btrim(status) <> '')
);

create table if not exists public.portal_contexts (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  label text not null,
  type text,
  start_date date,
  end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_contexts_label_not_empty check (btrim(label) <> ''),
  constraint portal_contexts_status_not_empty check (btrim(status) <> ''),
  constraint portal_contexts_date_order check (
    start_date is null
    or end_date is null
    or start_date <= end_date
  )
);

create table if not exists public.portal_competitions (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  name text not null,
  slug text,
  modality text,
  scope text,
  format text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_competitions_name_not_empty check (btrim(name) <> ''),
  constraint portal_competitions_status_not_empty check (btrim(status) <> '')
);

create table if not exists public.portal_participants (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  name text not null,
  type text not null,
  external_reference text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_participants_name_not_empty check (btrim(name) <> ''),
  constraint portal_participants_type_not_empty check (btrim(type) <> ''),
  constraint portal_participants_status_not_empty check (btrim(status) <> '')
);

create table if not exists public.portal_competition_participants (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_participant_id uuid not null references public.portal_participants(id) on delete restrict,
  registration_status text not null default 'draft',
  group_label text,
  seed_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_competition_participants_registration_status_not_empty check (btrim(registration_status) <> ''),
  constraint portal_competition_participants_seed_order_positive check (seed_order is null or seed_order >= 0)
);

create table if not exists public.portal_stages (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  name text not null,
  type text not null,
  stage_order integer,
  scheduled_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_stages_name_not_empty check (btrim(name) <> ''),
  constraint portal_stages_type_not_empty check (btrim(type) <> ''),
  constraint portal_stages_status_not_empty check (btrim(status) <> ''),
  constraint portal_stages_stage_order_positive check (stage_order is null or stage_order >= 0)
);

create table if not exists public.portal_games (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_stage_id uuid not null references public.portal_stages(id) on delete restrict,
  home_participant_id uuid references public.portal_participants(id) on delete restrict,
  away_participant_id uuid references public.portal_participants(id) on delete restrict,
  scheduled_at timestamptz,
  venue text,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_games_status_not_empty check (btrim(status) <> ''),
  constraint portal_games_distinct_participants check (
    home_participant_id is null
    or away_participant_id is null
    or home_participant_id <> away_participant_id
  )
);

-- Fase futura poderá criar portal_game_participants para encontros com mais de dois participantes.
create table if not exists public.portal_results (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid not null references public.portal_competitions(id) on delete restrict,
  portal_stage_id uuid not null references public.portal_stages(id) on delete restrict,
  portal_game_id uuid not null references public.portal_games(id) on delete restrict,
  home_score integer,
  away_score integer,
  result_status text not null default 'draft',
  validation_notes text,
  submitted_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_results_result_status_not_empty check (btrim(result_status) <> ''),
  constraint portal_results_home_score_non_negative check (home_score is null or home_score >= 0),
  constraint portal_results_away_score_non_negative check (away_score is null or away_score >= 0)
);

create table if not exists public.portal_content_submissions (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid not null references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid references public.portal_competitions(id) on delete restrict,
  portal_stage_id uuid references public.portal_stages(id) on delete restrict,
  portal_game_id uuid references public.portal_games(id) on delete restrict,
  portal_participant_id uuid references public.portal_participants(id) on delete restrict,
  type text not null,
  title text not null,
  summary text,
  body text,
  media_url text,
  submission_status text not null default 'draft',
  review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_content_submissions_type_not_empty check (btrim(type) <> ''),
  constraint portal_content_submissions_title_not_empty check (btrim(title) <> ''),
  constraint portal_content_submissions_status_not_empty check (btrim(submission_status) <> '')
);

create table if not exists public.portal_access_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_access_profiles_name_not_empty check (btrim(name) <> ''),
  constraint portal_access_profiles_status_not_empty check (btrim(status) <> '')
);

create table if not exists public.portal_permissions (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid references public.portal_competitions(id) on delete restrict,
  access_profile_id uuid not null references public.portal_access_profiles(id) on delete restrict,
  user_reference text,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_validate boolean not null default false,
  can_submit_content boolean not null default false,
  can_archive boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_permissions_status_not_empty check (btrim(status) <> '')
);

create table if not exists public.portal_audit_events (
  id uuid primary key default gen_random_uuid(),
  portal_entity_id uuid not null references public.portal_entities(id) on delete restrict,
  portal_context_id uuid references public.portal_contexts(id) on delete restrict,
  portal_competition_id uuid references public.portal_competitions(id) on delete restrict,
  actor_reference text,
  action_type text not null,
  object_type text not null,
  object_id uuid,
  previous_status text,
  new_status text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint portal_audit_events_action_type_not_empty check (btrim(action_type) <> ''),
  constraint portal_audit_events_object_type_not_empty check (btrim(object_type) <> '')
);

create unique index if not exists portal_entities_slug_unique_idx
  on public.portal_entities (slug)
  where slug is not null;

create unique index if not exists portal_competitions_local_slug_unique_idx
  on public.portal_competitions (portal_entity_id, portal_context_id, slug)
  where slug is not null;

create unique index if not exists portal_competition_participants_unique_idx
  on public.portal_competition_participants (portal_competition_id, portal_participant_id);

create index if not exists portal_contexts_entity_idx on public.portal_contexts (portal_entity_id);
create index if not exists portal_contexts_status_idx on public.portal_contexts (status);

create index if not exists portal_competitions_entity_idx on public.portal_competitions (portal_entity_id);
create index if not exists portal_competitions_context_idx on public.portal_competitions (portal_context_id);
create index if not exists portal_competitions_status_idx on public.portal_competitions (status);

create index if not exists portal_participants_entity_idx on public.portal_participants (portal_entity_id);
create index if not exists portal_participants_type_idx on public.portal_participants (type);
create index if not exists portal_participants_status_idx on public.portal_participants (status);

create index if not exists portal_competition_participants_entity_idx on public.portal_competition_participants (portal_entity_id);
create index if not exists portal_competition_participants_context_idx on public.portal_competition_participants (portal_context_id);
create index if not exists portal_competition_participants_competition_idx on public.portal_competition_participants (portal_competition_id);
create index if not exists portal_competition_participants_participant_idx on public.portal_competition_participants (portal_participant_id);
create index if not exists portal_competition_participants_status_idx on public.portal_competition_participants (registration_status);

create index if not exists portal_stages_entity_idx on public.portal_stages (portal_entity_id);
create index if not exists portal_stages_context_idx on public.portal_stages (portal_context_id);
create index if not exists portal_stages_competition_idx on public.portal_stages (portal_competition_id);
create index if not exists portal_stages_type_idx on public.portal_stages (type);
create index if not exists portal_stages_status_idx on public.portal_stages (status);
create index if not exists portal_stages_scheduled_date_idx on public.portal_stages (scheduled_date);

create index if not exists portal_games_entity_idx on public.portal_games (portal_entity_id);
create index if not exists portal_games_context_idx on public.portal_games (portal_context_id);
create index if not exists portal_games_competition_idx on public.portal_games (portal_competition_id);
create index if not exists portal_games_stage_idx on public.portal_games (portal_stage_id);
create index if not exists portal_games_home_participant_idx on public.portal_games (home_participant_id);
create index if not exists portal_games_away_participant_idx on public.portal_games (away_participant_id);
create index if not exists portal_games_status_idx on public.portal_games (status);
create index if not exists portal_games_scheduled_at_idx on public.portal_games (scheduled_at);

create index if not exists portal_results_entity_idx on public.portal_results (portal_entity_id);
create index if not exists portal_results_context_idx on public.portal_results (portal_context_id);
create index if not exists portal_results_competition_idx on public.portal_results (portal_competition_id);
create index if not exists portal_results_stage_idx on public.portal_results (portal_stage_id);
create index if not exists portal_results_game_idx on public.portal_results (portal_game_id);
create index if not exists portal_results_status_idx on public.portal_results (result_status);
create index if not exists portal_results_submitted_at_idx on public.portal_results (submitted_at);
create index if not exists portal_results_created_at_idx on public.portal_results (created_at);

create index if not exists portal_content_submissions_entity_idx on public.portal_content_submissions (portal_entity_id);
create index if not exists portal_content_submissions_context_idx on public.portal_content_submissions (portal_context_id);
create index if not exists portal_content_submissions_competition_idx on public.portal_content_submissions (portal_competition_id);
create index if not exists portal_content_submissions_stage_idx on public.portal_content_submissions (portal_stage_id);
create index if not exists portal_content_submissions_game_idx on public.portal_content_submissions (portal_game_id);
create index if not exists portal_content_submissions_participant_idx on public.portal_content_submissions (portal_participant_id);
create index if not exists portal_content_submissions_type_idx on public.portal_content_submissions (type);
create index if not exists portal_content_submissions_status_idx on public.portal_content_submissions (submission_status);
create index if not exists portal_content_submissions_created_at_idx on public.portal_content_submissions (created_at);

create index if not exists portal_access_profiles_status_idx on public.portal_access_profiles (status);

create index if not exists portal_permissions_entity_idx on public.portal_permissions (portal_entity_id);
create index if not exists portal_permissions_context_idx on public.portal_permissions (portal_context_id);
create index if not exists portal_permissions_competition_idx on public.portal_permissions (portal_competition_id);
create index if not exists portal_permissions_access_profile_idx on public.portal_permissions (access_profile_id);
create index if not exists portal_permissions_user_reference_idx on public.portal_permissions (user_reference);
create index if not exists portal_permissions_status_idx on public.portal_permissions (status);

create index if not exists portal_audit_events_entity_idx on public.portal_audit_events (portal_entity_id);
create index if not exists portal_audit_events_context_idx on public.portal_audit_events (portal_context_id);
create index if not exists portal_audit_events_competition_idx on public.portal_audit_events (portal_competition_id);
create index if not exists portal_audit_events_action_type_idx on public.portal_audit_events (action_type);
create index if not exists portal_audit_events_object_idx on public.portal_audit_events (object_type, object_id);
create index if not exists portal_audit_events_created_at_idx on public.portal_audit_events (created_at);

-- RLS/policies, autenticação, permissões reais, roles/grants e auditoria automática ficam para fases futuras.
