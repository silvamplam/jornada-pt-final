-- Jornada.pt - COMPOSICAO-BANCO-NOTICIAS-1A
-- Fundacao minima para banco de noticias guardadas da jornada.
-- Manual e aditivo: nao associa itens a composicoes e nao altera dados existentes.

create table if not exists public.matchday_editorial_bank_items (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  label text,
  title text not null,
  subtitle text,
  image_url text,
  link_url text,
  source_type text,
  source_id text,
  source_slug text,
  origin_slot_type text,
  sort_order integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorial_bank_items_status_check'
  ) then
    alter table public.matchday_editorial_bank_items
      add constraint matchday_editorial_bank_items_status_check check (status in ('active', 'archived'));
  end if;
end $$;

create index if not exists matchday_editorial_bank_items_matchday_id_idx
on public.matchday_editorial_bank_items (matchday_id);

create index if not exists matchday_editorial_bank_items_matchday_status_idx
on public.matchday_editorial_bank_items (matchday_id, status);

create index if not exists matchday_editorial_bank_items_matchday_source_idx
on public.matchday_editorial_bank_items (matchday_id, source_type, source_id);

create index if not exists matchday_editorial_bank_items_matchday_link_idx
on public.matchday_editorial_bank_items (matchday_id, link_url);

create unique index if not exists matchday_editorial_bank_items_matchday_source_unique_idx
on public.matchday_editorial_bank_items (matchday_id, lower(btrim(source_type)), lower(btrim(source_id)))
where source_type is not null
  and btrim(source_type) <> ''
  and source_id is not null
  and btrim(source_id) <> '';

create unique index if not exists matchday_editorial_bank_items_matchday_link_unique_idx
on public.matchday_editorial_bank_items (matchday_id, lower(btrim(link_url)))
where link_url is not null
  and btrim(link_url) <> '';

create or replace function public.set_matchday_editorial_bank_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_matchday_editorial_bank_items_updated_at on public.matchday_editorial_bank_items;

create trigger set_matchday_editorial_bank_items_updated_at
before update on public.matchday_editorial_bank_items
for each row
execute function public.set_matchday_editorial_bank_items_updated_at();

notify pgrst, 'reload schema';

-- Rollback manual, se alguma vez for necessario:
-- drop trigger if exists set_matchday_editorial_bank_items_updated_at on public.matchday_editorial_bank_items;
-- drop function if exists public.set_matchday_editorial_bank_items_updated_at();
-- drop table if exists public.matchday_editorial_bank_items;
