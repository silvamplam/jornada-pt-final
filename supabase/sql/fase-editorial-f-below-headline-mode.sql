alter table public.matchday_editorials
add column if not exists below_headline_mode text not null default 'highlights';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_below_headline_mode_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_below_headline_mode_check
      check (below_headline_mode in ('highlights', 'roundup'));
  end if;
end $$;
