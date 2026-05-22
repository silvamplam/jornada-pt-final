-- Passo 8 - tornar a Jornada uma entidade editorial forte
-- A jornada deixa de ser apenas um agrupador tecnico de jogos.
-- Estes campos permitem dar titulo, contexto, memoria, destaque e SEO
-- sem misturar a camada editorial com os dados objetivos dos jogos.

alter table public.matchdays add column if not exists editorial_title text;
alter table public.matchdays add column if not exists editorial_summary text;
alter table public.matchdays add column if not exists hero_image_url text;
alter table public.matchdays add column if not exists video_url text;
alter table public.matchdays add column if not exists display_order integer;
alter table public.matchdays add column if not exists is_featured boolean not null default false;
alter table public.matchdays add column if not exists memory_note text;
alter table public.matchdays add column if not exists seo_title text;
alter table public.matchdays add column if not exists seo_description text;

create index if not exists matchdays_featured_idx on public.matchdays (is_featured, display_order);
create index if not exists matchdays_season_order_idx on public.matchdays (season_id, display_order, number);

update public.matchdays
set display_order = number
where display_order is null;

grant select, insert, update, delete on public.matchdays to service_role;
grant select on public.articles to service_role;
grant select on public.headlines to service_role;
