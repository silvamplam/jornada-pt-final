-- Portal das Escolas - GATEKEEPER-EDITORIAL-SCHEMA-1.
-- Suporte mínimo para revisão/aprovação editorial. Não cria policies RLS, API, UI ou dados.

alter table public.portal_content_submissions
add column if not exists submitted_by_portal_user_id uuid,
add column if not exists reviewed_by_portal_user_id uuid,
add column if not exists approved_by_portal_user_id uuid,
add column if not exists rejected_by_portal_user_id uuid,
add column if not exists approved_at timestamptz,
add column if not exists rejected_at timestamptz;

alter table public.portal_permissions
add column if not exists can_review_content boolean not null default false,
add column if not exists can_approve_content boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_submitted_by_portal_user_id_fkey') then
    alter table public.portal_content_submissions add constraint portal_content_submissions_submitted_by_portal_user_id_fkey foreign key (submitted_by_portal_user_id) references public.portal_users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_reviewed_by_portal_user_id_fkey') then
    alter table public.portal_content_submissions add constraint portal_content_submissions_reviewed_by_portal_user_id_fkey foreign key (reviewed_by_portal_user_id) references public.portal_users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_approved_by_portal_user_id_fkey') then
    alter table public.portal_content_submissions add constraint portal_content_submissions_approved_by_portal_user_id_fkey foreign key (approved_by_portal_user_id) references public.portal_users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_rejected_by_portal_user_id_fkey') then
    alter table public.portal_content_submissions add constraint portal_content_submissions_rejected_by_portal_user_id_fkey foreign key (rejected_by_portal_user_id) references public.portal_users(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_submission_status_allowed_check') then
    if exists (
      select 1
      from public.portal_content_submissions
      where submission_status not in ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected')
    ) then
      raise exception 'portal_content_submissions has unsupported submission_status values for gatekeeper editorial schema';
    end if;

    alter table public.portal_content_submissions
    add constraint portal_content_submissions_submission_status_allowed_check
    check (submission_status in ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portal_content_submissions_no_self_approval_check') then
    alter table public.portal_content_submissions
    add constraint portal_content_submissions_no_self_approval_check
    check (
      submitted_by_portal_user_id is null
      or approved_by_portal_user_id is null
      or submitted_by_portal_user_id <> approved_by_portal_user_id
    );
  end if;
end $$;

create index if not exists portal_content_submissions_entity_status_idx on public.portal_content_submissions (portal_entity_id, submission_status);
create index if not exists portal_content_submissions_competition_status_idx on public.portal_content_submissions (portal_competition_id, submission_status);
create index if not exists portal_content_submissions_submitted_by_user_idx on public.portal_content_submissions (submitted_by_portal_user_id);
create index if not exists portal_content_submissions_reviewed_by_user_idx on public.portal_content_submissions (reviewed_by_portal_user_id);
create index if not exists portal_content_submissions_approved_by_user_idx on public.portal_content_submissions (approved_by_portal_user_id);
create index if not exists portal_content_submissions_rejected_by_user_idx on public.portal_content_submissions (rejected_by_portal_user_id);
create index if not exists portal_content_submissions_submitted_at_idx on public.portal_content_submissions (submitted_at);
create index if not exists portal_content_submissions_reviewed_at_idx on public.portal_content_submissions (reviewed_at);
create index if not exists portal_content_submissions_approved_at_idx on public.portal_content_submissions (approved_at);
create index if not exists portal_content_submissions_rejected_at_idx on public.portal_content_submissions (rejected_at);
create index if not exists portal_permissions_can_review_content_idx on public.portal_permissions (can_review_content);
create index if not exists portal_permissions_can_approve_content_idx on public.portal_permissions (can_approve_content);
