-- Jornada.pt - Fase Editorial A
-- Cria a camada editorial simples da jornada, separada da estrutura competitiva.

create table if not exists public.matchday_editorials (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  title text,
  summary text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_matchday_id_key'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_matchday_id_key unique (matchday_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_status_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_status_check check (status in ('draft', 'published'));
  end if;
end $$;

create or replace function public.set_matchday_editorials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_matchday_editorials_updated_at on public.matchday_editorials;

create trigger set_matchday_editorials_updated_at
before update on public.matchday_editorials
for each row
execute function public.set_matchday_editorials_updated_at();
