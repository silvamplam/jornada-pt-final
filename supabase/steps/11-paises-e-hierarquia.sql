-- Jornada.pt - paises e hierarquia do backoffice.
-- Este passo cria a camada Pais -> Competicao -> Epoca.
-- Os menus passam a ser alimentados apenas pelo que for criado no backoffice.

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  iso2 text,
  flag_emoji text,
  is_active boolean not null default true,
  data_source text not null default 'manual',
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  sync_status text not null default 'manual',
  manual_override boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.competitions
  add column if not exists country_id uuid references public.countries(id) on delete set null;

insert into public.countries (name, slug, iso2, flag_emoji, is_active, data_source, sync_status, manual_override)
values
  ('Portugal', 'portugal', 'PT', 'PT', true, 'manual', 'manual', true),
  ('Inglaterra', 'inglaterra', 'EN', 'EN', true, 'manual', 'manual', true),
  ('Espanha', 'espanha', 'ES', 'ES', true, 'manual', 'manual', true)
on conflict (slug) do update
set
  name = excluded.name,
  iso2 = excluded.iso2,
  flag_emoji = excluded.flag_emoji,
  is_active = excluded.is_active,
  manual_override = true;

with existing_countries as (
  select distinct
    trim(country) as name,
    lower(regexp_replace(trim(country), '[^a-zA-Z0-9]+', '-', 'g')) as slug
  from public.competitions
  where country is not null and trim(country) <> ''
)
insert into public.countries (name, slug, is_active, data_source, sync_status, manual_override)
select name, slug, true, 'manual', 'manual', true
from existing_countries
where slug <> ''
on conflict (slug) do nothing;

update public.competitions c
set country_id = co.id
from public.countries co
where c.country_id is null
  and c.country is not null
  and lower(trim(c.country)) = lower(trim(co.name));

create index if not exists countries_external_lookup_idx on public.countries (external_provider, external_id);
create index if not exists competitions_country_id_idx on public.competitions (country_id);

grant select on public.countries to anon, authenticated;
grant select, insert, update, delete on public.countries to service_role;
grant select, insert, update, delete on public.competitions to service_role;
grant select, insert, update, delete on public.seasons to service_role;

alter table public.countries enable row level security;

drop policy if exists countries_select_public on public.countries;

create policy countries_select_public
on public.countries
for select
using (true);
