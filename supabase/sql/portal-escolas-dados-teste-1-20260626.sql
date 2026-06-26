-- Portal das Escolas - dados fictícios mínimos para teste manual.
-- Não usar para dados reais. Não cria autenticação, policies RLS, roles, grants, API ou UI.
-- Este ficheiro insere apenas dados demo em tabelas public.portal_.

-- portal_entities: 1 linha
insert into public.portal_entities (
  id,
  name,
  slug,
  type,
  status,
  contact_name,
  contact_email,
  notes
) values (
  '10000000-0000-0000-0000-000000000001',
  'Entidade Demo Escolar',
  'demo-entidade-escolar',
  'demo_entity',
  'active',
  'Responsável Demo',
  'portal-demo@example.invalid',
  'Dados fictícios para teste do Portal das Escolas.'
)
on conflict do nothing;

-- portal_contexts: 1 linha
insert into public.portal_contexts (
  id,
  portal_entity_id,
  label,
  type,
  start_date,
  end_date,
  status
) values (
  '11000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Ano Letivo Demo 2026/27',
  'school_year_demo',
  '2026-09-01',
  '2027-07-31',
  'active'
)
on conflict do nothing;

-- portal_competitions: 1 linha
insert into public.portal_competitions (
  id,
  portal_entity_id,
  portal_context_id,
  name,
  slug,
  modality,
  scope,
  format,
  status
) values (
  '12000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  'Torneio Demo Interturmas',
  'demo-torneio-interturmas',
  'Multidesporto',
  'demo',
  'Fase de grupos',
  'draft'
)
on conflict do nothing;

-- portal_participants: 6 linhas
insert into public.portal_participants (
  id,
  portal_entity_id,
  name,
  type,
  external_reference,
  status,
  notes
) values
  (
    '13000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Turma Demo 7.º A',
    'demo_class',
    'demo-participante-turma-7a',
    'active',
    'Participante fictício para testes.'
  ),
  (
    '13000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Turma Demo 7.º B',
    'demo_class',
    'demo-participante-turma-7b',
    'active',
    'Participante fictício para testes.'
  ),
  (
    '13000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Equipa Demo Azul',
    'demo_team',
    'demo-participante-equipa-azul',
    'active',
    'Participante fictício para testes.'
  ),
  (
    '13000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Equipa Demo Branca',
    'demo_team',
    'demo-participante-equipa-branca',
    'active',
    'Participante fictício para testes.'
  ),
  (
    '13000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'Núcleo Demo Norte',
    'demo_center',
    'demo-participante-nucleo-norte',
    'active',
    'Participante fictício para testes.'
  ),
  (
    '13000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    'Associação Demo Convidada',
    'demo_association',
    'demo-participante-associacao-convidada',
    'active',
    'Participante fictício para testes.'
  )
on conflict do nothing;

-- portal_competition_participants: 6 linhas
insert into public.portal_competition_participants (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  portal_participant_id,
  registration_status,
  group_label,
  seed_order
) values
  (
    '14000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000001',
    'validated',
    'Grupo Demo A',
    1
  ),
  (
    '14000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000002',
    'validated',
    'Grupo Demo A',
    2
  ),
  (
    '14000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000003',
    'validated',
    'Grupo Demo B',
    3
  ),
  (
    '14000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000004',
    'validated',
    'Grupo Demo B',
    4
  ),
  (
    '14000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000005',
    'pending_validation',
    'Convidados Demo',
    5
  ),
  (
    '14000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000006',
    'pending_validation',
    'Convidados Demo',
    6
  )
on conflict do nothing;

-- portal_stages: 2 linhas
insert into public.portal_stages (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  name,
  type,
  stage_order,
  scheduled_date,
  status
) values
  (
    '15000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'Jornada Demo 01',
    'demo_matchday',
    1,
    '2026-10-03',
    'draft'
  ),
  (
    '15000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'Jornada Demo 02',
    'demo_matchday',
    2,
    '2026-10-10',
    'draft'
  )
on conflict do nothing;

-- portal_games: 3 linhas
insert into public.portal_games (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  portal_stage_id,
  home_participant_id,
  away_participant_id,
  scheduled_at,
  venue,
  status,
  notes
) values
  (
    '16000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000002',
    '2026-10-03 10:00:00+00',
    'Campo Demo A',
    'scheduled',
    'Jogo fictício para teste.'
  ),
  (
    '16000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000003',
    '13000000-0000-0000-0000-000000000004',
    '2026-10-03 11:30:00+00',
    'Campo Demo B',
    'scheduled',
    'Jogo fictício para teste.'
  ),
  (
    '16000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000002',
    '13000000-0000-0000-0000-000000000005',
    '13000000-0000-0000-0000-000000000006',
    '2026-10-10 10:00:00+00',
    'Pavilhão Demo',
    'scheduled',
    'Jogo fictício sem resultado para teste de estado pendente.'
  )
on conflict do nothing;

-- portal_results: 2 linhas
insert into public.portal_results (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  portal_stage_id,
  portal_game_id,
  home_score,
  away_score,
  result_status,
  validation_notes,
  submitted_at,
  validated_at
) values
  (
    '17000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    '16000000-0000-0000-0000-000000000001',
    2,
    1,
    'pending_validation',
    'Resultado fictício por validar.',
    '2026-10-03 12:00:00+00',
    null
  ),
  (
    '17000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    '16000000-0000-0000-0000-000000000002',
    0,
    0,
    'validated',
    'Resultado fictício validado.',
    '2026-10-03 13:00:00+00',
    '2026-10-03 14:00:00+00'
  )
on conflict do nothing;

-- portal_content_submissions: 2 linhas
insert into public.portal_content_submissions (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  portal_stage_id,
  portal_game_id,
  portal_participant_id,
  type,
  title,
  summary,
  body,
  media_url,
  submission_status,
  review_notes,
  submitted_at,
  reviewed_at
) values
  (
    '18000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    '16000000-0000-0000-0000-000000000001',
    null,
    'demo_article',
    'Crónica Demo da Jornada 01',
    'Resumo fictício da primeira jornada demo.',
    'Texto fictício para testar submissão editorial do Portal das Escolas.',
    null,
    'submitted',
    'Submissão fictícia aguardando revisão.',
    '2026-10-03 15:00:00+00',
    null
  ),
  (
    '18000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    null,
    null,
    '13000000-0000-0000-0000-000000000003',
    'demo_gallery',
    'Galeria Demo do Torneio',
    'Galeria fictícia para testar conteúdos submetidos.',
    'Descrição fictícia de uma galeria demo do torneio.',
    null,
    'under_review',
    'Conteúdo fictício em revisão.',
    '2026-10-04 10:00:00+00',
    '2026-10-04 11:00:00+00'
  )
on conflict do nothing;

-- portal_access_profiles: 4 linhas
insert into public.portal_access_profiles (
  id,
  name,
  description,
  status
) values
  (
    '19000000-0000-0000-0000-000000000001',
    'Organizador Demo',
    'Perfil fictício para gerir o contexto demo.',
    'active'
  ),
  (
    '19000000-0000-0000-0000-000000000002',
    'Responsável de Competição Demo',
    'Perfil fictício para preparar participantes, stages, jogos e resultados.',
    'active'
  ),
  (
    '19000000-0000-0000-0000-000000000003',
    'Colaborador Editorial Demo',
    'Perfil fictício para submeter conteúdos para revisão.',
    'active'
  ),
  (
    '19000000-0000-0000-0000-000000000004',
    'Consulta Limitada Demo',
    'Perfil fictício para leitura limitada de calendário e resultados.',
    'active'
  )
on conflict do nothing;

-- portal_permissions: 3 linhas
insert into public.portal_permissions (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  access_profile_id,
  user_reference,
  can_view,
  can_create,
  can_edit,
  can_validate,
  can_submit_content,
  can_archive,
  status
) values
  (
    '1a000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000001',
    'demo-organizador@example.invalid',
    true,
    true,
    true,
    true,
    true,
    true,
    'active'
  ),
  (
    '1a000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000002',
    'demo-responsavel@example.invalid',
    true,
    true,
    true,
    true,
    false,
    false,
    'active'
  ),
  (
    '1a000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000003',
    'demo-editorial@example.invalid',
    true,
    true,
    true,
    false,
    true,
    false,
    'active'
  )
on conflict do nothing;

-- portal_audit_events: 3 linhas
insert into public.portal_audit_events (
  id,
  portal_entity_id,
  portal_context_id,
  portal_competition_id,
  actor_reference,
  action_type,
  object_type,
  object_id,
  previous_status,
  new_status,
  metadata
) values
  (
    '1b000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'demo-organizador@example.invalid',
    'demo_created',
    'portal_competitions',
    '12000000-0000-0000-0000-000000000001',
    null,
    'draft',
    '{"demo": true, "note": "Competição demo criada para teste."}'::jsonb
  ),
  (
    '1b000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'demo-responsavel@example.invalid',
    'demo_result_submitted',
    'portal_results',
    '17000000-0000-0000-0000-000000000001',
    null,
    'pending_validation',
    '{"demo": true, "note": "Resultado demo submetido para validação."}'::jsonb
  ),
  (
    '1b000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'demo-editorial@example.invalid',
    'demo_content_submitted',
    'portal_content_submissions',
    '18000000-0000-0000-0000-000000000001',
    null,
    'submitted',
    '{"demo": true, "note": "Conteúdo demo submetido para revisão."}'::jsonb
  )
on conflict do nothing;

-- Verificação manual opcional:
-- select 'portal_entities' as table_name, count(*) as rows_count from public.portal_entities
-- union all select 'portal_contexts', count(*) from public.portal_contexts
-- union all select 'portal_competitions', count(*) from public.portal_competitions
-- union all select 'portal_participants', count(*) from public.portal_participants
-- union all select 'portal_competition_participants', count(*) from public.portal_competition_participants
-- union all select 'portal_stages', count(*) from public.portal_stages
-- union all select 'portal_games', count(*) from public.portal_games
-- union all select 'portal_results', count(*) from public.portal_results
-- union all select 'portal_content_submissions', count(*) from public.portal_content_submissions
-- union all select 'portal_access_profiles', count(*) from public.portal_access_profiles
-- union all select 'portal_permissions', count(*) from public.portal_permissions
-- union all select 'portal_audit_events', count(*) from public.portal_audit_events
-- order by table_name;
--
-- select e.slug, c.label, comp.slug
-- from public.portal_entities e
-- join public.portal_contexts c on c.portal_entity_id = e.id
-- join public.portal_competitions comp on comp.portal_context_id = c.id
-- where e.slug like 'demo-%' and comp.slug like 'demo-%';
--
-- select g.id, hp.name as home_participant, ap.name as away_participant, r.result_status
-- from public.portal_games g
-- join public.portal_participants hp on hp.id = g.home_participant_id
-- join public.portal_participants ap on ap.id = g.away_participant_id
-- left join public.portal_results r on r.portal_game_id = g.id
-- order by g.scheduled_at;
--
-- select source_table.relname as source_table, target_table.relname as target_table
-- from pg_constraint fk
-- join pg_class source_table on source_table.oid = fk.conrelid
-- join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
-- join pg_class target_table on target_table.oid = fk.confrelid
-- where fk.contype = 'f'
--   and source_schema.nspname = 'public'
--   and source_table.relname like 'portal\_%' escape '\'
-- order by source_table.relname, target_table.relname;
