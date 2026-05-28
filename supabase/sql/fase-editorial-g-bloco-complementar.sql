alter table public.matchday_editorials
add column if not exists complementary_mode text not null default 'none';

alter table public.matchday_editorials
add column if not exists complementary_roundup_item_id uuid references public.matchday_roundup_items(id) on delete set null;

alter table public.matchday_editorials
add column if not exists complementary_label text;

alter table public.matchday_editorials
add column if not exists complementary_title text;

alter table public.matchday_editorials
add column if not exists complementary_text text;

alter table public.matchday_editorials
add column if not exists complementary_image_url text;

alter table public.matchday_editorials
add column if not exists complementary_link_url text;

alter table public.matchday_editorials
add column if not exists complementary_text_color text;

alter table public.matchday_editorials
add column if not exists complementary_status text not null default 'draft';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_complementary_mode_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_complementary_mode_check
      check (complementary_mode in ('none', 'roundup_video', 'complementary_story'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchday_editorials_complementary_status_check'
  ) then
    alter table public.matchday_editorials
      add constraint matchday_editorials_complementary_status_check
      check (complementary_status in ('draft', 'published'));
  end if;
end $$;
