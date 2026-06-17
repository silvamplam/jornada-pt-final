-- Jornada.pt
-- FASE: CONTEUDOS-EDITORIAIS-VIDEO-REPORTAGEM-4-SQL-FICHEIRO-MANUAL
--
-- SQL manual, aditivo e NAO aplicado automaticamente.
--
-- Objetivo:
-- Criar a proposta de fundacao para public.editorial_contents, uma futura
-- entidade editorial publicada para videos editoriais, reportagens, entrevistas
-- e especiais.
--
-- Regras de seguranca e legado:
-- - Nao altera public.editorial_articles.
-- - Nao altera /noticias/[slug].
-- - Nao altera matchday_roundup_items, site_editorial_roundup_items ou matchdays.video_url.
-- - Nao altera matchday_reference_composition_items nem source_type atual.
-- - Nao mexe em article_id.
-- - Nao migra dados antigos.
-- - Nao mistura areas fixas de video da Jornada com conteudos editoriais audiovisuais.
-- - Esta tabela nasce como entidade nova, paralela e compativel com o legado.

create table if not exists public.editorial_contents (
  id uuid primary key default gen_random_uuid(),

  slug text not null,
  status text not null default 'draft',
  scope text not null default 'general',
  content_type text not null,

  label text,
  title text not null,
  subtitle text,
  summary text,
  body text,
  author text,

  image_url text,
  image_caption text,
  thumbnail_url text,

  video_url text,
  video_provider text,
  embed_url text,
  duration text,
  is_embeddable boolean not null default false,

  published_at timestamptz,

  competition_id uuid,
  season_id uuid,
  matchday_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_status_check'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_scope_check'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_scope_check
      check (scope in ('home', 'matchday', 'competition', 'general'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_content_type_check'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_content_type_check
      check (content_type in ('video', 'reportagem', 'entrevista', 'especial'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_slug_not_blank_check'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_slug_not_blank_check
      check (btrim(slug) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_title_not_blank_check'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_title_not_blank_check
      check (btrim(title) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_competition_id_fkey'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_competition_id_fkey
      foreign key (competition_id)
      references public.competitions(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_season_id_fkey'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_season_id_fkey
      foreign key (season_id)
      references public.seasons(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorial_contents_matchday_id_fkey'
  ) then
    alter table public.editorial_contents
      add constraint editorial_contents_matchday_id_fkey
      foreign key (matchday_id)
      references public.matchdays(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists editorial_contents_slug_unique_idx
on public.editorial_contents (lower(btrim(slug)));

create index if not exists editorial_contents_status_idx
on public.editorial_contents (status);

create index if not exists editorial_contents_scope_idx
on public.editorial_contents (scope);

create index if not exists editorial_contents_content_type_idx
on public.editorial_contents (content_type);

create index if not exists editorial_contents_published_at_idx
on public.editorial_contents (published_at desc);

create index if not exists editorial_contents_status_published_at_idx
on public.editorial_contents (status, published_at desc);

create index if not exists editorial_contents_content_type_status_idx
on public.editorial_contents (content_type, status);

create index if not exists editorial_contents_scope_status_idx
on public.editorial_contents (scope, status);

create index if not exists editorial_contents_competition_id_idx
on public.editorial_contents (competition_id);

create index if not exists editorial_contents_season_id_idx
on public.editorial_contents (season_id);

create index if not exists editorial_contents_matchday_id_idx
on public.editorial_contents (matchday_id);

-- O projeto usa funcoes updated_at especificas por area/tabela em varias fases.
-- Mantem-se aqui o mesmo padrao local e reversivel para evitar depender de uma
-- funcao global que pode nao existir em todos os ambientes.
create or replace function public.set_editorial_contents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_editorial_contents_updated_at on public.editorial_contents;

create trigger set_editorial_contents_updated_at
before update on public.editorial_contents
for each row
execute function public.set_editorial_contents_updated_at();

notify pgrst, 'reload schema';

-- Notas para fases futuras:
-- - Um adaptador podera unir editorial_articles + editorial_contents numa lista
--   normalizada de conteudos publicados para seletores editoriais.
-- - As zonas devem continuar a guardar snapshot editavel, sem depender da fonte viva.
-- - A composicao podera precisar, em fase propria, de aceitar source_type =
--   'editorial_content'. Nao alterar isso neste ficheiro.
-- - As areas fixas de video da Jornada continuam independentes e nao devem ser
--   alimentadas automaticamente por editorial_contents.

-- Rollback manual, apenas se for realmente necessario:
-- drop trigger if exists set_editorial_contents_updated_at on public.editorial_contents;
-- drop function if exists public.set_editorial_contents_updated_at();
-- drop table if exists public.editorial_contents;
-- notify pgrst, 'reload schema';
