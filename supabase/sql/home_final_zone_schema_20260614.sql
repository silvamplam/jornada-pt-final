alter table public.site_editorial_latest_news
  add column if not exists subtitle text;

alter table public.site_editorials
  add column if not exists final_zone_title text,
  add column if not exists final_zone_title_color text,
  add column if not exists final_zone_mode text;

alter table public.site_editorials
  drop constraint if exists site_editorials_final_zone_mode_check;

alter table public.site_editorials
  add constraint site_editorials_final_zone_mode_check
  check (
    final_zone_mode is null
    or final_zone_mode in ('latest_news', 'editorial_line')
  );
