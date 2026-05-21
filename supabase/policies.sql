-- Jornada.pt - politicas publicas de leitura segura.
-- Estas politicas permitem ao site ler dados nao sensiveis com a anon key.

alter table competitions enable row level security;
alter table seasons enable row level security;
alter table matchdays enable row level security;
alter table teams enable row level security;
alter table broadcast_channels enable row level security;
alter table matches enable row level security;

drop policy if exists "Public read competitions" on competitions;
drop policy if exists "Public read seasons" on seasons;
drop policy if exists "Public read matchdays" on matchdays;
drop policy if exists "Public read teams" on teams;
drop policy if exists "Public read broadcast channels" on broadcast_channels;
drop policy if exists "Public read matches" on matches;

create policy "Public read competitions"
on competitions
for select
using (true);

create policy "Public read seasons"
on seasons
for select
using (true);

create policy "Public read matchdays"
on matchdays
for select
using (true);

create policy "Public read teams"
on teams
for select
using (true);

create policy "Public read broadcast channels"
on broadcast_channels
for select
using (true);

create policy "Public read matches"
on matches
for select
using (true);
