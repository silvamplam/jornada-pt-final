alter table public.matchday_editorials
add column if not exists side_block_status text not null default 'draft';

alter table public.matchday_editorials
add column if not exists side_block_type text;

alter table public.matchday_editorials
add column if not exists side_block_label text;

alter table public.matchday_editorials
add column if not exists side_block_title text;

alter table public.matchday_editorials
add column if not exists side_block_title_color text;

alter table public.matchday_editorials
add column if not exists side_block_author text;

alter table public.matchday_editorials
add column if not exists side_block_text text;

alter table public.matchday_editorials
add column if not exists side_block_image_url text;

alter table public.matchday_editorials
add column if not exists side_block_link_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_side_block_status_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_side_block_status_check
      check (side_block_status in ('draft', 'published'));
  end if;
end $$;

notify pgrst, 'reload schema';
