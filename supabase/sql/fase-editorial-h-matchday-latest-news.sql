create table if not exists public.matchday_latest_news (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  time_label text,
  title text,
  image_url text,
  sort_order integer not null default 1,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matchday_latest_news_status_check check (status in ('draft', 'published')),
  constraint matchday_latest_news_sort_order_check check (sort_order between 1 and 20)
);

create index if not exists matchday_latest_news_matchday_order_idx
on public.matchday_latest_news (matchday_id, sort_order);
