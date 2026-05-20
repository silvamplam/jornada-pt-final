-- Jornada.pt - politicas publicas de leitura segura.
-- Estas politicas permitem ao site ler dados nao sensiveis com a anon key.

alter table competitions enable row level security;
alter table teams enable row level security;
alter table broadcast_channels enable row level security;

drop policy if exists "Public read competitions" on competitions;
drop policy if exists "Public read teams" on teams;
drop policy if exists "Public read broadcast channels" on broadcast_channels;

create policy "Public read competitions"
on competitions
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
