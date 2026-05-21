-- Passo 7 - preparar dados objetivos para futura sincronizacao por API
-- Mantem o backoffice manual, mas deixa jogos, clubes, competicoes,
-- epocas, jornadas e classificacoes prontos para origem manual, API ou mista.

alter table public.competitions add column if not exists data_source text not null default 'manual';
alter table public.competitions add column if not exists external_provider text;
alter table public.competitions add column if not exists external_id text;
alter table public.competitions add column if not exists last_synced_at timestamptz;
alter table public.competitions add column if not exists sync_status text not null default 'manual';
alter table public.competitions add column if not exists manual_override boolean not null default false;

alter table public.seasons add column if not exists data_source text not null default 'manual';
alter table public.seasons add column if not exists external_provider text;
alter table public.seasons add column if not exists external_id text;
alter table public.seasons add column if not exists last_synced_at timestamptz;
alter table public.seasons add column if not exists sync_status text not null default 'manual';
alter table public.seasons add column if not exists manual_override boolean not null default false;

alter table public.matchdays add column if not exists data_source text not null default 'manual';
alter table public.matchdays add column if not exists external_provider text;
alter table public.matchdays add column if not exists external_id text;
alter table public.matchdays add column if not exists last_synced_at timestamptz;
alter table public.matchdays add column if not exists sync_status text not null default 'manual';
alter table public.matchdays add column if not exists manual_override boolean not null default false;

alter table public.teams add column if not exists data_source text not null default 'manual';
alter table public.teams add column if not exists external_provider text;
alter table public.teams add column if not exists external_id text;
alter table public.teams add column if not exists last_synced_at timestamptz;
alter table public.teams add column if not exists sync_status text not null default 'manual';
alter table public.teams add column if not exists manual_override boolean not null default false;

alter table public.matches add column if not exists data_source text not null default 'manual';
alter table public.matches add column if not exists external_provider text;
alter table public.matches add column if not exists external_id text;
alter table public.matches add column if not exists external_match_id text;
alter table public.matches add column if not exists last_synced_at timestamptz;
alter table public.matches add column if not exists sync_status text not null default 'manual';
alter table public.matches add column if not exists manual_override boolean not null default false;

alter table public.standings add column if not exists data_source text not null default 'manual';
alter table public.standings add column if not exists external_provider text;
alter table public.standings add column if not exists external_id text;
alter table public.standings add column if not exists last_synced_at timestamptz;
alter table public.standings add column if not exists sync_status text not null default 'manual';
alter table public.standings add column if not exists manual_override boolean not null default false;

alter table public.standing_rows add column if not exists data_source text not null default 'manual';
alter table public.standing_rows add column if not exists external_provider text;
alter table public.standing_rows add column if not exists external_id text;
alter table public.standing_rows add column if not exists last_synced_at timestamptz;
alter table public.standing_rows add column if not exists sync_status text not null default 'manual';
alter table public.standing_rows add column if not exists manual_override boolean not null default false;

create index if not exists competitions_external_lookup_idx on public.competitions (external_provider, external_id);
create index if not exists seasons_external_lookup_idx on public.seasons (external_provider, external_id);
create index if not exists matchdays_external_lookup_idx on public.matchdays (external_provider, external_id);
create index if not exists teams_external_lookup_idx on public.teams (external_provider, external_id);
create index if not exists matches_external_lookup_idx on public.matches (external_provider, external_id);
create index if not exists matches_external_match_lookup_idx on public.matches (external_provider, external_match_id);
create index if not exists standings_external_lookup_idx on public.standings (external_provider, external_id);
create index if not exists standing_rows_external_lookup_idx on public.standing_rows (external_provider, external_id);

update public.competitions set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.seasons set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.matchdays set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.teams set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.matches set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.standings set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
update public.standing_rows set data_source = 'manual', sync_status = 'manual' where data_source is null or sync_status is null;
