-- Fase Editorial L - zona flexivel no espaco das ultimas noticias.
-- Migration aditiva: nao apaga, nao move e nao altera dados existentes.

alter table public.matchday_editorials
add column if not exists latest_zone_mode text not null default 'latest_news';

alter table public.matchday_editorials
add column if not exists latest_zone_title text;

alter table public.matchday_latest_news
add column if not exists subtitle text;

alter table public.matchday_latest_news
add column if not exists link_url text;

alter table public.matchday_latest_news
add column if not exists article_id uuid references public.articles(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_latest_zone_mode_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_latest_zone_mode_check
      check (latest_zone_mode in ('latest_news', 'editorial_line'));
  end if;
end $$;

notify pgrst, 'reload schema';
