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

type PortalMultisportEntityRow = RowWithId & {
  name: string;
};

type PortalMultisportContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalMultisportCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
};

type PortalMultisportStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  stage_order: number | null;
};

type PortalMultisportParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
};

type PortalCompetitionFormatRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  catalog_format_id: string | null;
  name: string;
  code: string | null;
  format_scope: string;
  event_model: string | null;
  result_model: string | null;
  ranking_model: string | null;
  status: string;
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

type PortalRankingRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  portal_format_id: string | null;
  name: string;
  slug: string | null;
  ranking_scope: string;
  ranking_type: string;
  status: string;
};

type PortalRankingEntryRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  portal_ranking_id: string;
  portal_participant_id: string;
  rank: number | null;
  position_label: string | null;
  points: number | string | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  score_for: number | string | null;
  score_against: number | string | null;
  score_difference: number | string | null;
  status: string;
};

export type PortalMultisportScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalMultisportFormatRecord = {
  key: string;
  name: string;
  code: string;
  status: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
  formatScope: string;
  eventModel: string;
  resultModel: string;
  rankingModel: string;
};

export type PortalMultisportEventRecord = {
  key: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  competitionLabel: string;
  contextLabel: string;
  stageLabel: string;
  scheduledAt: string | null;
  venue: string | null;
  participantLabels: string[];
  resultEntries: Array<{
    participantLabel: string;
    scoreLabel: string;
    pointsLabel: string;
    outcomeLabel: string;
  }>;
};

export type PortalMultisportRankingRecord = {
  key: string;
  name: string;
  slug: string;
  status: string;
  rankingType: string;
  competitionLabel: string;
  rows: Array<{
    key: string;
    rankLabel: string;
    participantLabel: string;
    pointsLabel: string;
    playedLabel: string;
    recordLabel: string;
    scoreLabel: string;
  }>;
};

export type PortalMultisportDemoData = {
  formats: PortalMultisportFormatRecord[];
  events: PortalMultisportEventRecord[];
  rankings: PortalMultisportRankingRecord[];
  scopes: PortalMultisportScope[];
  unavailableSections: string[];
};

const LIST_LIMIT = 1000;
const LOOKUP_LIMIT = 1000;

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

function formatValue(value: number | string | null | undefined, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatStatus(status: string | null | undefined) {
  if (!status) {
    return "Sem estado";
  }

  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    return { rows: [] as PortalMultisportEntityRow[], unavailableSection: null };
  }

  return readRows<PortalMultisportEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

async function readParticipantsByIds(supabase: SupabaseClient, participantIds: string[]) {
  if (participantIds.length === 0) {
    return { rows: [] as PortalMultisportParticipantRow[], unavailableSection: null };
  }

  return readRows<PortalMultisportParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name", {
    sectionLabel: "participantes",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", participantIds).order("name", { ascending: true });
    }
  });
}

async function readStagesByIds(supabase: SupabaseClient, stageIds: string[]) {
  if (stageIds.length === 0) {
    return { rows: [] as PortalMultisportStageRow[], unavailableSection: null };
  }

  return readRows<PortalMultisportStageRow>(
    supabase,
    "portal_stages",
    "id,portal_entity_id,portal_context_id,portal_competition_id,name,stage_order",
    {
      sectionLabel: "fases/jornadas",
      limit: LOOKUP_LIMIT,
      apply(query) {
        return query.in("id", stageIds).order("stage_order", { ascending: true });
      }
    }
  );
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalMultisportEntityRow[],
  contexts: PortalMultisportContextRow[],
  competitions: PortalMultisportCompetitionRow[]
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

function makeFormats(
  formats: PortalCompetitionFormatRow[],
  entitiesById: Map<string, PortalMultisportEntityRow>,
  contextsById: Map<string, PortalMultisportContextRow>,
  competitionsById: Map<string, PortalMultisportCompetitionRow>
) {
  return sortByLabel(formats, (format) => format.name).map((format) => ({
    key: format.id,
    name: format.name,
    code: format.code ?? "sem-codigo",
    status: formatStatus(format.status),
    entityLabel: entitiesById.get(format.portal_entity_id)?.name ?? "Entidade",
    contextLabel: contextsById.get(format.portal_context_id)?.label ?? "Contexto",
    competitionLabel: competitionsById.get(format.portal_competition_id)?.name ?? "Competição",
    formatScope: formatStatus(format.format_scope),
    eventModel: format.event_model ?? "—",
    resultModel: format.result_model ?? "—",
    rankingModel: format.ranking_model ?? "—"
  }));
}

function makeEvents(
  events: PortalEventRow[],
  eventParticipants: PortalEventParticipantRow[],
  resultEntries: PortalResultEntryRow[],
  contextsById: Map<string, PortalMultisportContextRow>,
  competitionsById: Map<string, PortalMultisportCompetitionRow>,
  stagesById: Map<string, PortalMultisportStageRow>,
  participantsById: Map<string, PortalMultisportParticipantRow>
) {
  return [...events]
    .sort((first, second) => {
      const firstOrder = first.event_order ?? 999999;
      const secondOrder = second.event_order ?? 999999;

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return first.name.localeCompare(second.name, "pt");
    })
    .map((event) => {
      const participants = eventParticipants
        .filter((participant) => participant.portal_event_id === event.id)
        .sort((first, second) => (first.seed_order ?? 999999) - (second.seed_order ?? 999999));
      const eventResults = resultEntries.filter((entry) => entry.portal_event_id === event.id);

      return {
        key: event.id,
        name: event.name,
        slug: event.slug ?? "sem-slug",
        type: event.type ?? "evento",
        status: formatStatus(event.status),
        competitionLabel: competitionsById.get(event.portal_competition_id)?.name ?? "Competição",
        contextLabel: contextsById.get(event.portal_context_id)?.label ?? "Contexto",
        stageLabel: event.portal_stage_id ? stagesById.get(event.portal_stage_id)?.name ?? "Fase/jornada" : "Sem fase/jornada",
        scheduledAt: event.scheduled_at,
        venue: event.venue,
        participantLabels: participants.map((participant) => {
          const name = participantsById.get(participant.portal_participant_id)?.name ?? "Participante";
          const role = participant.role ? ` (${formatStatus(participant.role).toLowerCase()})` : "";

          return `${name}${role}`;
        }),
        resultEntries: eventResults.map((entry) => ({
          participantLabel: participantsById.get(entry.portal_participant_id)?.name ?? "Participante",
          scoreLabel: formatValue(entry.score_text ?? entry.score_numeric),
          pointsLabel: formatValue(entry.points),
          outcomeLabel: formatStatus(entry.outcome)
        }))
      };
    });
}

function makeRankings(
  rankings: PortalRankingRow[],
  rankingEntries: PortalRankingEntryRow[],
  competitionsById: Map<string, PortalMultisportCompetitionRow>,
  participantsById: Map<string, PortalMultisportParticipantRow>
) {
  return sortByLabel(rankings, (ranking) => ranking.name).map((ranking) => ({
    key: ranking.id,
    name: ranking.name,
    slug: ranking.slug ?? "sem-slug",
    status: formatStatus(ranking.status),
    rankingType: formatStatus(ranking.ranking_type),
    competitionLabel: competitionsById.get(ranking.portal_competition_id)?.name ?? "Competição",
    rows: rankingEntries
      .filter((entry) => entry.portal_ranking_id === ranking.id)
      .sort((first, second) => (first.rank ?? 999999) - (second.rank ?? 999999))
      .map((entry) => ({
        key: entry.id,
        rankLabel: entry.position_label ?? formatValue(entry.rank),
        participantLabel: participantsById.get(entry.portal_participant_id)?.name ?? "Participante",
        pointsLabel: formatValue(entry.points),
        playedLabel: formatValue(entry.played),
        recordLabel: `${formatValue(entry.wins, "0")}-${formatValue(entry.draws, "0")}-${formatValue(entry.losses, "0")}`,
        scoreLabel: `${formatValue(entry.score_for, "0")}-${formatValue(entry.score_against, "0")} (${formatValue(entry.score_difference, "0")})`
      }))
  }));
}

export async function readPortalMultisportDemo(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalMultisportDemoData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const [entitiesResult, contextsResult, competitionsResult, formatsResult, eventsResult, rankingsResult] = await Promise.all([
    readEntities(supabase, permissions),
    readScopedRows<PortalMultisportContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      contextScopeColumn: "id",
      includeCompetitionScope: false,
      orderColumn: "label"
    }),
    readScopedRows<PortalMultisportCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name",
      permissions,
      {
        sectionLabel: "competições",
        competitionScopeColumn: "id",
        orderColumn: "name"
      }
    ),
    readScopedRows<PortalCompetitionFormatRow>(
      supabase,
      "portal_competition_formats",
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,catalog_format_id,name,code,format_scope,event_model,result_model,ranking_model,status",
      permissions,
      {
        sectionLabel: "formatos multidesporto",
        orderColumn: "name"
      }
    ),
    readScopedRows<PortalEventRow>(
      supabase,
      "portal_events",
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,name,slug,type,event_order,scheduled_at,venue,status",
      permissions,
      {
        sectionLabel: "eventos multidesporto",
        orderColumn: "event_order"
      }
    ),
    readScopedRows<PortalRankingRow>(
      supabase,
      "portal_rankings",
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_format_id,name,slug,ranking_scope,ranking_type,status",
      permissions,
      {
        sectionLabel: "rankings multidesporto",
        orderColumn: "name"
      }
    )
  ]);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  contextsResult.unavailableSections.forEach((section) => unavailableSections.add(section));
  competitionsResult.unavailableSections.forEach((section) => unavailableSections.add(section));
  formatsResult.unavailableSections.forEach((section) => unavailableSections.add(section));
  eventsResult.unavailableSections.forEach((section) => unavailableSections.add(section));
  rankingsResult.unavailableSections.forEach((section) => unavailableSections.add(section));

  const eventIds = uniqueValues(eventsResult.rows.map((event) => event.id));
  const rankingIds = uniqueValues(rankingsResult.rows.map((ranking) => ranking.id));
  const stageIds = uniqueValues(eventsResult.rows.map((event) => event.portal_stage_id));

  const [eventParticipantsResult, resultEntriesResult, rankingEntriesResult, stagesResult] = await Promise.all([
    eventIds.length > 0
      ? readRows<PortalEventParticipantRow>(
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
        )
      : Promise.resolve({ rows: [] as PortalEventParticipantRow[], unavailableSection: null }),
    eventIds.length > 0
      ? readRows<PortalResultEntryRow>(
          supabase,
          "portal_result_entries",
          "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_stage_id,portal_event_id,portal_participant_id,score_numeric,score_text,points,outcome,is_winner,result_status",
          {
            sectionLabel: "entradas de resultado multidesporto",
            limit: LOOKUP_LIMIT,
            apply(query) {
              return query.in("portal_event_id", eventIds).order("portal_participant_id", { ascending: true });
            }
          }
        )
      : Promise.resolve({ rows: [] as PortalResultEntryRow[], unavailableSection: null }),
    rankingIds.length > 0
      ? readRows<PortalRankingEntryRow>(
          supabase,
          "portal_ranking_entries",
          "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,portal_ranking_id,portal_participant_id,rank,position_label,points,played,wins,draws,losses,score_for,score_against,score_difference,status",
          {
            sectionLabel: "linhas de ranking multidesporto",
            limit: LOOKUP_LIMIT,
            apply(query) {
              return query.in("portal_ranking_id", rankingIds).order("rank", { ascending: true });
            }
          }
        )
      : Promise.resolve({ rows: [] as PortalRankingEntryRow[], unavailableSection: null }),
    readStagesByIds(supabase, stageIds)
  ]);

  [eventParticipantsResult, resultEntriesResult, rankingEntriesResult, stagesResult].forEach((result) => {
    if (result.unavailableSection) {
      unavailableSections.add(result.unavailableSection);
    }
  });

  const participantIds = uniqueValues([
    ...eventParticipantsResult.rows.map((participant) => participant.portal_participant_id),
    ...resultEntriesResult.rows.map((entry) => entry.portal_participant_id),
    ...rankingEntriesResult.rows.map((entry) => entry.portal_participant_id)
  ]);
  const participantsResult = await readParticipantsByIds(supabase, participantIds);

  if (participantsResult.unavailableSection) {
    unavailableSections.add(participantsResult.unavailableSection);
  }

  const entitiesById = indexById(entitiesResult.rows);
  const contextsById = indexById(contextsResult.rows);
  const competitionsById = indexById(competitionsResult.rows);
  const stagesById = indexById(stagesResult.rows);
  const participantsById = indexById(participantsResult.rows);

  return {
    formats: makeFormats(formatsResult.rows, entitiesById, contextsById, competitionsById),
    events: makeEvents(
      eventsResult.rows,
      eventParticipantsResult.rows,
      resultEntriesResult.rows,
      contextsById,
      competitionsById,
      stagesById,
      participantsById
    ),
    rankings: makeRankings(rankingsResult.rows, rankingEntriesResult.rows, competitionsById, participantsById),
    scopes: makeScopes(permissions, entitiesResult.rows, contextsResult.rows, competitionsResult.rows),
    unavailableSections: Array.from(unavailableSections)
  };
}
