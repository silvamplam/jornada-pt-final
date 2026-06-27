-- Portal das Escolas - DASHBOARD-DADOS-REAIS-SELECT-1.
-- Permissoes minimas para a dashboard autenticada read-only.
-- Nao cria INSERT/UPDATE/DELETE policies, nao concede anon e nao usa service_role.

alter table public.portal_users enable row level security;
alter table public.portal_permissions enable row level security;
alter table public.portal_entities enable row level security;
alter table public.portal_contexts enable row level security;
alter table public.portal_competitions enable row level security;
alter table public.portal_competition_participants enable row level security;
alter table public.portal_participants enable row level security;
alter table public.portal_stages enable row level security;
alter table public.portal_games enable row level security;
alter table public.portal_results enable row level security;
alter table public.portal_content_submissions enable row level security;

grant select on public.portal_users to authenticated;
grant select on public.portal_permissions to authenticated;
grant select on public.portal_entities to authenticated;
grant select on public.portal_contexts to authenticated;
grant select on public.portal_competitions to authenticated;
grant select on public.portal_competition_participants to authenticated;
grant select on public.portal_participants to authenticated;
grant select on public.portal_stages to authenticated;
grant select on public.portal_games to authenticated;
grant select on public.portal_results to authenticated;
grant select on public.portal_content_submissions to authenticated;

create or replace function public.portal_can_select_scope(
  target_portal_entity_id uuid,
  target_portal_context_id uuid,
  target_portal_competition_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portal_users u
    join public.portal_permissions p on p.portal_user_id = u.id
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and p.status = 'active'
      and p.can_view = true
      and p.portal_entity_id = target_portal_entity_id
      and (target_portal_context_id is null or p.portal_context_id is null or p.portal_context_id = target_portal_context_id)
      and (target_portal_competition_id is null or p.portal_competition_id is null or p.portal_competition_id = target_portal_competition_id)
  );
$$;

drop policy if exists portal_users_select_own_active on public.portal_users;
create policy portal_users_select_own_active on public.portal_users for select to authenticated
using (auth_user_id = auth.uid() and status = 'active');

drop policy if exists portal_permissions_select_own_active on public.portal_permissions;
create policy portal_permissions_select_own_active on public.portal_permissions for select to authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.portal_users u
    where u.id = portal_permissions.portal_user_id
      and u.auth_user_id = auth.uid()
      and u.status = 'active'
  )
);

drop policy if exists portal_entities_select_by_scope on public.portal_entities;
create policy portal_entities_select_by_scope on public.portal_entities for select to authenticated
using (public.portal_can_select_scope(id, null, null));

drop policy if exists portal_contexts_select_by_scope on public.portal_contexts;
create policy portal_contexts_select_by_scope on public.portal_contexts for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, id, null));

drop policy if exists portal_competitions_select_by_scope on public.portal_competitions;
create policy portal_competitions_select_by_scope on public.portal_competitions for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, id));

drop policy if exists portal_competition_participants_select_by_scope on public.portal_competition_participants;
create policy portal_competition_participants_select_by_scope on public.portal_competition_participants for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id));

drop policy if exists portal_participants_select_by_authorized_competition on public.portal_participants;
create policy portal_participants_select_by_authorized_competition on public.portal_participants for select to authenticated
using (
  exists (
    select 1 from public.portal_competition_participants cp
    where cp.portal_participant_id = portal_participants.id
      and public.portal_can_select_scope(cp.portal_entity_id, cp.portal_context_id, cp.portal_competition_id)
  )
  or exists (
    select 1
    from public.portal_users u
    join public.portal_permissions p on p.portal_user_id = u.id
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and p.status = 'active'
      and p.can_view = true
      and p.portal_entity_id = portal_participants.portal_entity_id
      and p.portal_context_id is null
      and p.portal_competition_id is null
  )
);

drop policy if exists portal_stages_select_by_scope on public.portal_stages;
create policy portal_stages_select_by_scope on public.portal_stages for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id));

drop policy if exists portal_games_select_by_scope on public.portal_games;
create policy portal_games_select_by_scope on public.portal_games for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id));

drop policy if exists portal_results_select_by_scope on public.portal_results;
create policy portal_results_select_by_scope on public.portal_results for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id));

drop policy if exists portal_content_submissions_select_by_scope on public.portal_content_submissions;
create policy portal_content_submissions_select_by_scope on public.portal_content_submissions for select to authenticated
using (public.portal_can_select_scope(portal_entity_id, portal_context_id, portal_competition_id));
