-- Passo 1 - base para jogos e canais TV

alter table public.matches add column if not exists source_key text;
alter table public.matches add column if not exists broadcast_channel_id uuid references public.broadcast_channels(id) on delete set null;
create unique index if not exists matches_source_key_unique on public.matches (source_key);

grant usage on schema public to anon;
grant select on public.competitions to anon;
grant select on public.seasons to anon;
grant select on public.matchdays to anon;
grant select on public.teams to anon;
grant select on public.broadcast_channels to anon;
grant select on public.matches to anon;

grant usage on schema public to service_role;
grant select on public.competitions to service_role;
grant select on public.seasons to service_role;
grant select on public.matchdays to service_role;
grant select on public.teams to service_role;
grant select on public.broadcast_channels to service_role;
grant select, insert, update, delete on public.matches to service_role;

alter table public.seasons enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Public read seasons" on public.seasons;
drop policy if exists "Public read matchdays" on public.matchdays;
drop policy if exists "Public read matches" on public.matches;

create policy "Public read seasons" on public.seasons for select using (true);
create policy "Public read matchdays" on public.matchdays for select using (true);
create policy "Public read matches" on public.matches for select using (true);
