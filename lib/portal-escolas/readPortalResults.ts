import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalAuthorization, PortalPermissionRow } from "@/lib/portal-escolas/auth";

type AuthorizedPortal = Extract<PortalAuthorization, { allowed: true }>;

type RowWithId = {
  id: string;
};

type PortalQueryResult = {
  data: unknown[] | null;
  error: unknown;
};

type PortalQuery = {
  eq(column: string, value: string | number | boolean | null): PortalQuery;
  in(column: string, values: string[]): PortalQuery;
  order(column: string, options?: { ascending?: boolean }): PortalQuery;
  limit(count: number): Promise<PortalQueryResult>;
};

type PortalResultEntityRow = RowWithId & {
  name: string;
};

type PortalResultContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalResultCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
  slug: string | null;
};

type PortalResultStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  type: string | null;
  stage_order: number | null;
};

type PortalEventRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  portal_stage_id: string | null;
  name: string;
  type: string | null;
  event_order: number | null;
  scheduled_at: string | null;
  status: string;
};

type PortalEventParticipantRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  portal_stage_id: string | null;
  portal_event_id: string;
  portal_participant_id: string;
  role: string | null;
  seed_order: number | null;
  status: string;
};

type PortalResultParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
};

type PortalResultEntryRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  portal_stage_id: string | null;
  portal_event_id: string;
  portal_participant_id: string;
  score_numeric: number | string | null;
  score_text: string | null;
  points: number | string | null;
  outcome: string | null;
  is_winner: boolean | null;
  result_status: string | null;
};

export type PortalResultScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalResultRecord = {
  key: string;
  competitionLabel: string;
  competitionHref: string | null;
  contextLabel: string;
  stageLabel: string;
  stageTypeLabel: string;
  eventLabel: string;
  eventTypeLabel: string;
  participantLabel: string;
  participantRoleLabel: string;
  scoreLabel: string;
  pointsLabel: string;
  outcomeLabel: string;
  resultStatus: string;
  eventStatus: string;
  scheduledAt: string | null;
  hasResult: boolean;
};

export type PortalResultsData = {
  results: PortalResultRecord[];
  scopes: PortalResultScope[];
  unavailableSections: string[];
  summary: {
    eventCount: number;
    eventParticipantCount: number;
    resultEntryCount: number;
    stageCount: number;
  };
};

const LIST_LIMIT = 1000;
const LOOKUP_LIMIT = 1000;

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  validated: "Validado",
  pending_validation: "Pendente de validação",
  draft: "Rascunho",
  scheduled: "Agendado",
  under_review: "Em revisão",
  submitted: "Submetido",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
  completed: "Concluído",
  finished: "Concluído",
  in_progress: "Em curso",
  live: "Em curso",
  no_result: "Sem resultado",
  mixed: "Misto",
  unknown: "Não disponível",
  stage: "Fase/jornada/ronda",
  group: "Grupo",
  round: "Ronda",
  series: "Série",
  final: "Final",
  matchday: "Jornada",
  event: "Evento",
  match: "Jogo",
  game: "Jogo",
  race: "Prova/corrida",
  heat: "Série",
  field_event: "Prova técnica",
  home: "Casa",
  away: "Fora",
  winner: "Vencedor",
  draw: "Empate",
  loss: "Derrota",
  win: "Vitória"
};

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function indexById<T extends RowWithId>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function sortByLabel<T>(rows: T[], readLabel: (row: T) => string) {
  return [...rows].sort((first, second) => readLabel(first).localeCompare(readLabel(second), "pt"));
}

function mergeRows<T extends RowWithId>(target: Map<string, T>, rows: T[]) {
  rows.forEach((row) => {
    target.set(row.id, row);
  });
}

function formatLabel(value: string | null | undefined, fallback = "Por definir") {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
  const mappedLabel = labelMap[normalized];

  if (mappedLabel) {
    return mappedLabel;
  }

  if (!trimmed.includes("_") && trimmed !== trimmed.toUpperCase()) {
    return trimmed;
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatValue(value: number | string | null | undefined, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function slugHref(slug: string | null) {
  return slug ? `/portal-escolas/competicoes/${slug}` : null;
}

async function readRows<T extends RowWithId>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  options: {
    sectionLabel: string;
    limit?: number;
    apply?: (query: PortalQuery) => PortalQuery;
  }
) {
  try {
    let query = supabase.from(table).select(select) as unknown as PortalQuery;

    if (options.apply) {
      query = options.apply(query);
    }

    const { data, error } = await query.limit(options.limit ?? LIST_LIMIT);

    if (error) {
      return {
        rows: [] as T[],
        unavailableSection: options.sectionLabel
      };
    }

    return {
      rows: (data ?? []) as unknown as T[],
      unavailableSection: null
    };
  } catch {
    return {
      rows: [] as T[],
      unavailableSection: options.sectionLabel
    };
  }
}

async function readScopedRows<T extends RowWithId>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  permissions: PortalPermissionRow[],
  options: {
    sectionLabel: string;
    orderColumn?: string;
    ascending?: boolean;
    includeCompetitionScope?: boolean;
    contextScopeColumn?: "portal_context_id" | "id";
    competitionScopeColumn?: "portal_competition_id" | "id";
  }
) {
  const rowsById = new Map<string, T>();
  const unavailableSections = new Set<string>();

  await Promise.all(
    permissions.map(async (permission) => {
      const result = await readRows<T>(supabase, table, select, {
        sectionLabel: options.sectionLabel,
        apply(query) {
          let scopedQuery = query.eq("portal_entity_id", permission.portal_entity_id);
          const contextScopeColumn = options.contextScopeColumn ?? "portal_context_id";
          const competitionScopeColumn = options.competitionScopeColumn ?? "portal_competition_id";

          if (permission.portal_context_id) {
            scopedQuery = scopedQuery.eq(contextScopeColumn, permission.portal_context_id);
          }

          if (options.includeCompetitionScope !== false && permission.portal_competition_id) {
            scopedQuery = scopedQuery.eq(competitionScopeColumn, permission.portal_competition_id);
          }

          if (options.orderColumn) {
            scopedQuery = scopedQuery.order(options.orderColumn, { ascending: options.ascending ?? true });
          }

          return scopedQuery;
        }
      });

      mergeRows(rowsById, result.rows);

      if (result.unavailableSection) {
        unavailableSections.add(result.unavailableSection);
      }
    })
  );

  return {
    rows: Array.from(rowsById.values()),
    unavailableSections
  };
}

async function readEntities(supabase: SupabaseClient, permissions: PortalPermissionRow[]) {
  const entityIds = uniqueValues(permissions.map((permission) => permission.portal_entity_id));

  if (entityIds.length === 0) {
    return {
      rows: [] as PortalResultEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalResultEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

async function readParticipantsByIds(supabase: SupabaseClient, participantIds: string[]) {
  if (participantIds.length === 0) {
    return {
      rows: [] as PortalResultParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalResultParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name", {
    sectionLabel: "participantes",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", participantIds).order("name", { ascending: true });
    }
  });
}

async function readEventParticipants(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) {
    return {
      rows: [] as PortalEventParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalEventParticipantRow>(
    supabase,
    "portal_event_participants",
    "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,portal_event_id,portal_participant_id,role,seed_order,status",
    {
      sectionLabel: "participantes de evento",
      limit: LOOKUP_LIMIT,
      apply(query) {
        return query.in("portal_event_id", eventIds).order("seed_order", { ascending: true });
      }
    }
  );
}

async function readResultEntries(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) {
    return {
      rows: [] as PortalResultEntryRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalResultEntryRow>(
    supabase,
    "portal_result_entries",
    "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,portal_event_id,portal_participant_id,score_numeric,score_text,points,outcome,is_winner,result_status",
    {
      sectionLabel: "resultados por participante",
      limit: LOOKUP_LIMIT,
      apply(query) {
        return query.in("portal_event_id", eventIds).order("portal_participant_id", { ascending: true });
      }
    }
  );
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalResultEntityRow[],
  contexts: PortalResultContextRow[],
  competitions: PortalResultCompetitionRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);

  return permissions.map((permission) => {
    const context = permission.portal_context_id ? contextsById.get(permission.portal_context_id) : null;
    const competition = permission.portal_competition_id ? competitionsById.get(permission.portal_competition_id) : null;

    return {
      id: permission.id,
      entityLabel: entitiesById.get(permission.portal_entity_id)?.name ?? "Entidade autorizada",
      contextLabel: permission.portal_context_id ? context?.label ?? "Contexto autorizado" : "Todos os contextos",
      competitionLabel: permission.portal_competition_id ? competition?.name ?? "Competição autorizada" : "Todas as competições"
    };
  });
}

function makeResultKey(eventId: string, participantId: string) {
  return `${eventId}:${participantId}`;
}

function makeScoreLabel(entry: PortalResultEntryRow | undefined) {
  if (!entry) {
    return "Sem resultado";
  }

  return formatValue(entry.score_text ?? entry.score_numeric, "Sem valor");
}

function makePointsLabel(entry: PortalResultEntryRow | undefined) {
  if (!entry) {
    return "—";
  }

  return formatValue(entry.points);
}

function makeOutcomeLabel(entry: PortalResultEntryRow | undefined) {
  if (!entry) {
    return "—";
  }

  if (entry.is_winner) {
    return "Vencedor";
  }

  return formatLabel(entry.outcome, "—");
}

function makeResults(
  events: PortalEventRow[],
  eventParticipants: PortalEventParticipantRow[],
  resultEntries: PortalResultEntryRow[],
  stages: PortalResultStageRow[],
  contexts: PortalResultContextRow[],
  competitions: PortalResultCompetitionRow[],
  participants: PortalResultParticipantRow[]
) {
  const eventsById = indexById(events);
  const stagesById = indexById(stages);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);
  const participantsById = indexById(participants);
  const entriesByEventAndParticipant = new Map(
    resultEntries.map((entry) => [makeResultKey(entry.portal_event_id, entry.portal_participant_id), entry])
  );
  const recordsByKey = new Map<string, PortalResultRecord>();

  eventParticipants.forEach((eventParticipant) => {
    const event = eventsById.get(eventParticipant.portal_event_id);

    if (!event) {
      return;
    }

    const entry = entriesByEventAndParticipant.get(
      makeResultKey(eventParticipant.portal_event_id, eventParticipant.portal_participant_id)
    );
    const stage = event.portal_stage_id ? stagesById.get(event.portal_stage_id) ?? null : null;
    const competition = competitionsById.get(event.portal_competition_id) ?? null;
    const participantLabel = participantsById.get(eventParticipant.portal_participant_id)?.name ?? "Participante não disponível";

    recordsByKey.set(makeResultKey(eventParticipant.portal_event_id, eventParticipant.portal_participant_id), {
      key: makeResultKey(eventParticipant.portal_event_id, eventParticipant.portal_participant_id),
      competitionLabel: competition?.name ?? "Competição autorizada",
      competitionHref: slugHref(competition?.slug ?? null),
      contextLabel: contextsById.get(event.portal_context_id)?.label ?? "Contexto autorizado",
      stageLabel: stage?.name ?? "Sem estrutura competitiva",
      stageTypeLabel: formatLabel(stage?.type, "Estrutura"),
      eventLabel: event.name,
      eventTypeLabel: formatLabel(event.type, "Evento"),
      participantLabel,
      participantRoleLabel: formatLabel(eventParticipant.role, "Participante"),
      scoreLabel: makeScoreLabel(entry),
      pointsLabel: makePointsLabel(entry),
      outcomeLabel: makeOutcomeLabel(entry),
      resultStatus: entry?.result_status ?? "no_result",
      eventStatus: event.status,
      scheduledAt: event.scheduled_at,
      hasResult: Boolean(entry)
    });
  });

  resultEntries.forEach((entry) => {
    const key = makeResultKey(entry.portal_event_id, entry.portal_participant_id);

    if (recordsByKey.has(key)) {
      return;
    }

    const event = eventsById.get(entry.portal_event_id);
    const stage = entry.portal_stage_id ? stagesById.get(entry.portal_stage_id) ?? null : null;
    const competition = competitionsById.get(entry.portal_competition_id) ?? null;

    recordsByKey.set(key, {
      key,
      competitionLabel: competition?.name ?? "Competição autorizada",
      competitionHref: slugHref(competition?.slug ?? null),
      contextLabel: contextsById.get(entry.portal_context_id)?.label ?? "Contexto autorizado",
      stageLabel: stage?.name ?? "Sem estrutura competitiva",
      stageTypeLabel: formatLabel(stage?.type, "Estrutura"),
      eventLabel: event?.name ?? "Evento não disponível",
      eventTypeLabel: formatLabel(event?.type, "Evento"),
      participantLabel: participantsById.get(entry.portal_participant_id)?.name ?? "Participante não disponível",
      participantRoleLabel: "Participante",
      scoreLabel: makeScoreLabel(entry),
      pointsLabel: makePointsLabel(entry),
      outcomeLabel: makeOutcomeLabel(entry),
      resultStatus: entry.result_status ?? "unknown",
      eventStatus: event?.status ?? "unknown",
      scheduledAt: event?.scheduled_at ?? null,
      hasResult: true
    });
  });

  return Array.from(recordsByKey.values()).sort(
    (first, second) =>
      (first.scheduledAt ?? "9999-12-31").localeCompare(second.scheduledAt ?? "9999-12-31") ||
      first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
      first.stageLabel.localeCompare(second.stageLabel, "pt") ||
      first.eventLabel.localeCompare(second.eventLabel, "pt") ||
      first.participantLabel.localeCompare(second.participantLabel, "pt")
  );
}

export async function readPortalResults(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalResultsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, stagesResult, eventsResult] = await Promise.all([
    readScopedRows<PortalResultContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalResultCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name,slug",
      permissions,
      { sectionLabel: "competições", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalResultStageRow>(
      supabase,
      "portal_stages",
      "id,portal_entity_id,portal_context_id,portal_competition_id,name,type,stage_order",
      permissions,
      { sectionLabel: "estrutura competitiva", orderColumn: "stage_order", ascending: true }
    ),
    readScopedRows<PortalEventRow>(
      supabase,
      "portal_events",
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,name,type,event_order,scheduled_at,status",
      permissions,
      { sectionLabel: "eventos", orderColumn: "event_order", ascending: true }
    )
  ]);

  [contextsResult, competitionsResult, stagesResult, eventsResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const eventIds = uniqueValues(eventsResult.rows.map((event) => event.id));

  const [eventParticipantsResult, resultEntriesResult] = await Promise.all([
    readEventParticipants(supabase, eventIds),
    readResultEntries(supabase, eventIds)
  ]);

  [eventParticipantsResult, resultEntriesResult].forEach((result) => {
    if (result.unavailableSection) {
      unavailableSections.add(result.unavailableSection);
    }
  });

  const participantIds = uniqueValues([
    ...eventParticipantsResult.rows.map((participant) => participant.portal_participant_id),
    ...resultEntriesResult.rows.map((entry) => entry.portal_participant_id)
  ]);
  const participantsResult = await readParticipantsByIds(supabase, participantIds);

  if (participantsResult.unavailableSection) {
    unavailableSections.add(participantsResult.unavailableSection);
  }

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);
  const stages = [...stagesResult.rows].sort(
    (first, second) =>
      (first.stage_order ?? Number.MAX_SAFE_INTEGER) - (second.stage_order ?? Number.MAX_SAFE_INTEGER) ||
      first.name.localeCompare(second.name, "pt")
  );
  const results = makeResults(
    eventsResult.rows,
    eventParticipantsResult.rows,
    resultEntriesResult.rows,
    stages,
    contexts,
    competitions,
    participantsResult.rows
  );

  return {
    results,
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt")),
    summary: {
      eventCount: eventsResult.rows.length,
      eventParticipantCount: eventParticipantsResult.rows.length,
      resultEntryCount: resultEntriesResult.rows.length,
      stageCount: stages.length
    }
  };
}
