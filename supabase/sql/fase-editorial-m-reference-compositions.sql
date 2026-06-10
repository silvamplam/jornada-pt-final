-- Fase Editorial M - composicoes historicas selecionaveis da jornada.
-- Aditiva: cria apenas camada paralela, sem alterar dados existentes.

create table if not exists public.matchday_reference_compositions (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_current boolean not null default false,
  internal_name text,
  use_roundup_items boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.matchday_reference_composition_items (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid not null references public.matchday_reference_compositions(id) on delete cascade,
  slot_type text not null check (slot_type in ('headline', 'side_block', 'complement', 'highlight', 'editorial_line_item', 'related_article', 'roundup', 'custom_card')),
  source_type text not null check (source_type in ('matchday_editorial', 'matchday_highlight', 'matchday_latest_news', 'matchday_roundup_item', 'article', 'manual_link')),
  source_id uuid,
  article_id uuid references public.articles(id) on delete set null,
  sort_order integer not null default 1,
  title_snapshot text,
  subtitle_snapshot text,
  image_url_snapshot text,
  link_url_snapshot text,
  label_snapshot text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matchday_reference_compositions_matchday_id_idx on public.matchday_reference_compositions (matchday_id);
create index if not exists matchday_reference_compositions_status_idx on public.matchday_reference_compositions (status);
create index if not exists matchday_reference_compositions_is_current_idx on public.matchday_reference_compositions (is_current);
create unique index if not exists matchday_reference_compositions_current_unique_idx on public.matchday_reference_compositions (matchday_id) where is_current = true;
create index if not exists matchday_reference_composition_items_composition_id_idx on public.matchday_reference_composition_items (composition_id);
create index if not exists matchday_reference_composition_items_slot_type_idx on public.matchday_reference_composition_items (slot_type);
create index if not exists matchday_reference_composition_items_source_type_idx on public.matchday_reference_composition_items (source_type);
create index if not exists matchday_reference_composition_items_article_id_idx on public.matchday_reference_composition_items (article_id);
create index if not exists matchday_reference_composition_items_sort_order_idx on public.matchday_reference_composition_items (sort_order);
create index if not exists matchday_reference_composition_items_status_idx on public.matchday_reference_composition_items (status);

create or replace function public.set_matchday_reference_compositions_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists set_matchday_reference_compositions_updated_at on public.matchday_reference_compositions;
create trigger set_matchday_reference_compositions_updated_at before update on public.matchday_reference_compositions for each row execute function public.set_matchday_reference_compositions_updated_at();

create or replace function public.set_matchday_reference_composition_items_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists set_matchday_reference_composition_items_updated_at on public.matchday_reference_composition_items;
create trigger set_matchday_reference_composition_items_updated_at before update on public.matchday_reference_composition_items for each row execute function public.set_matchday_reference_composition_items_updated_at();

notify pgrst, 'reload schema';
