create table if not exists public.matchday_roundup_items (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  label text,
  title text,
  subtitle text,
  image_url text,
  video_url text,
  duration text,
  type text not null default 'resumo',
  sort_order integer not null default 1,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matchday_roundup_items_status_check check (status in ('draft', 'published')),
  constraint matchday_roundup_items_type_check check (type in ('video', 'golos', 'resumo', 'noticia')),
  constraint matchday_roundup_items_sort_order_check check (sort_order between 1 and 3)
);

create index if not exists matchday_roundup_items_matchday_order_idx
on public.matchday_roundup_items (matchday_id, sort_order);
