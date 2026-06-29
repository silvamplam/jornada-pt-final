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

type PortalGameEntityRow = RowWithId & {
  name: string;
};

type PortalGameContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalGameCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
  slug: string | null;
};

type PortalGameStageRow = RowWithId & {
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
  slug: string | null;
  type: string | null;
  event_order: number | null;
  scheduled_at: string | null;
  venue: string | null;
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

type PortalGameParticipantRow = RowWithId & {
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

export type PortalGameScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalGameRecord = {
  key: string;
  competitionLabel: string;
  competitionHref: string | null;
  contextLabel: string;
  stageLabel: string;
  stageTypeLabel: string;
  eventLabel: string;
  eventTypeLabel: string;
  participantLabels: string[];
  participantSummaryLabel: string;
  scheduledAt: string | null;
  venue: string | null;
  resultLabel: string;
  resultStatus: string;
  eventStatus: string;
  hasResult: boolean;
  resultEntryCount: number;
};

export type PortalGamesData = {
  games: PortalGameRecord[];
  scopes: PortalGameScope[];
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
      rows: [] as PortalGameEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalGameEntityRow>(supabase, "portal_entities", "id,name", {
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
      rows: [] as PortalGameParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalGameParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name", {
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
  entities: PortalGameEntityRow[],
  contexts: PortalGameContextRow[],
  competitions: PortalGameCompetitionRow[]
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

function makeResultLabel(entries: PortalResultEntryRow[]) {
  if (entries.length === 0) {
    return "Sem resultado";
  }

  const scoreParts = entries.map((entry) => formatValue(entry.score_text ?? entry.score_numeric)).filter((value) => value !== "—");

  if (scoreParts.length > 0) {
    return scoreParts.join(" - ");
  }

  const pointParts = entries.map((entry) => formatValue(entry.points)).filter((value) => value !== "—");

  if (pointParts.length > 0) {
    return `${pointParts.join(" - ")} pts`;
  }

  return `${entries.length} entrada${entries.length === 1 ? "" : "s"} de resultado`;
}

function makeResultStatus(entries: PortalResultEntryRow[]) {
  if (entries.length === 0) {
    return "no_result";
  }

  const statuses = uniqueValues(entries.map((entry) => entry.result_status));

  if (statuses.length === 1) {
    return statuses[0];
  }

  return "mixed";
}

function makeParticipantSummary(labels: string[]) {
  if (labels.length === 0) {
    return "Participantes por definir";
  }

  if (labels.length <= 3) {
    return labels.join(" · ");
  }

  return `${labels.slice(0, 3).join(" · ")} · +${labels.length - 3}`;
}

function makeGames(
  events: PortalEventRow[],
  eventParticipants: PortalEventParticipantRow[],
  resultEntries: PortalResultEntryRow[],
  stages: PortalGameStageRow[],
  contexts: PortalGameContextRow[],
  competitions: PortalGameCompetitionRow[],
  participants: PortalGameParticipantRow[]
) {
  const stagesById = indexById(stages);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);
  const participantsById = indexById(participants);

  return events
    .map((event) => {
      const stage = event.portal_stage_id ? stagesById.get(event.portal_stage_id) ?? null : null;
      const competition = competitionsById.get(event.portal_competition_id) ?? null;
      const participantsForEvent = eventParticipants
        .filter((participant) => participant.portal_event_id === event.id)
        .sort((first, second) => (first.seed_order ?? 999999) - (second.seed_order ?? 999999));
      const participantLabels = participantsForEvent.map((participant) => {
        const name = participantsById.get(participant.portal_participant_id)?.name ?? "Participante não disponível";
        const role = participant.role ? ` (${formatLabel(participant.role).toLowerCase()})` : "";

        return `${name}${role}`;
      });
      const resultsForEvent = resultEntries.filter((entry) => entry.portal_event_id === event.id);

      return {
        key: event.id,
        competitionLabel: competition?.name ?? "Competição autorizada",
        competitionHref: slugHref(competition?.slug ?? null),
        contextLabel: contextsById.get(event.portal_context_id)?.label ?? "Contexto autorizado",
        stageLabel: stage?.name ?? "Sem estrutura competitiva",
        stageTypeLabel: formatLabel(stage?.type, "Estrutura"),
        eventLabel: event.name,
        eventTypeLabel: formatLabel(event.type, "Evento"),
        participantLabels,
        participantSummaryLabel: makeParticipantSummary(participantLabels),
        scheduledAt: event.scheduled_at,
        venue: event.venue,
        resultLabel: makeResultLabel(resultsForEvent),
        resultStatus: makeResultStatus(resultsForEvent),
        eventStatus: event.status,
        hasResult: resultsForEvent.length > 0,
        resultEntryCount: resultsForEvent.length
      };
    })
    .sort(
      (first, second) =>
        (first.scheduledAt ?? "9999-12-31").localeCompare(second.scheduledAt ?? "9999-12-31") ||
        first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
        first.stageLabel.localeCompare(second.stageLabel, "pt") ||
        first.eventLabel.localeCompare(second.eventLabel, "pt")
    );
}

export async function readPortalGames(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalGamesData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, stagesResult, eventsResult] = await Promise.all([
    readScopedRows<PortalGameContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalGameCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name,slug",
      permissions,
      { sectionLabel: "competições", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalGameStageRow>(
      supabase,
      "portal_stages",
      "id,portal_entity_id,portal_context_id,portal_competition_id,name,type,stage_order",
      permissions,
      { sectionLabel: "estrutura competitiva", orderColumn: "stage_order", ascending: true }
    ),
    readScopedRows<PortalEventRow>(
      supabase,
      "portal_events",
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,name,slug,type,event_order,scheduled_at,venue,status",
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
  const games = makeGames(
    eventsResult.rows,
    eventParticipantsResult.rows,
    resultEntriesResult.rows,
    stages,
    contexts,
    competitions,
    participantsResult.rows
  );

  return {
    games,
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt")),
    summary: {
      eventCount: games.length,
      eventParticipantCount: eventParticipantsResult.rows.length,
      resultEntryCount: resultEntriesResult.rows.length,
      stageCount: stages.length
    }
  };
}
