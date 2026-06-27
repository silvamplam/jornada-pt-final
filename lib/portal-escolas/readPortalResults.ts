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
};

type PortalResultStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  stage_order: number | null;
};

type PortalResultGameRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_stage_id: string;
  home_participant_id: string | null;
  away_participant_id: string | null;
  scheduled_at: string | null;
  status: string;
};

type PortalResultParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
};

type PortalResultRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_stage_id: string;
  portal_game_id: string;
  home_score: number | null;
  away_score: number | null;
  result_status: string;
  submitted_at: string | null;
  validated_at: string | null;
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
  contextLabel: string;
  stageLabel: string;
  gameLabel: string;
  homeName: string;
  awayName: string;
  resultLabel: string;
  resultStatus: string;
  gameStatus: string;
  submittedAt: string | null;
  validatedAt: string | null;
  scheduledAt: string | null;
  hasResult: boolean;
};

export type PortalResultsData = {
  results: PortalResultRecord[];
  scopes: PortalResultScope[];
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

function makeScoreLabel(result: PortalResultRow | undefined) {
  if (!result || result.home_score === null || result.away_score === null) {
    return "Sem resultado";
  }

  return `${result.home_score} - ${result.away_score}`;
}

function makeRecords(
  games: PortalResultGameRow[],
  results: PortalResultRow[],
  stages: PortalResultStageRow[],
  contexts: PortalResultContextRow[],
  competitions: PortalResultCompetitionRow[],
  participants: PortalResultParticipantRow[]
) {
  const gamesById = indexById(games);
  const stagesById = indexById(stages);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);
  const participantsById = indexById(participants);
  const resultsByGameId = new Map(results.map((result) => [result.portal_game_id, result]));
  const recordsByKey = new Map<string, PortalResultRecord>();

  games.forEach((game) => {
    const result = resultsByGameId.get(game.id);
    const homeName = game.home_participant_id
      ? participantsById.get(game.home_participant_id)?.name ?? "Participante não disponível"
      : "Participante por definir";
    const awayName = game.away_participant_id
      ? participantsById.get(game.away_participant_id)?.name ?? "Participante não disponível"
      : "Participante por definir";

    recordsByKey.set(game.id, {
      key: game.id,
      competitionLabel: competitionsById.get(game.portal_competition_id)?.name ?? "Competição autorizada",
      contextLabel: contextsById.get(game.portal_context_id)?.label ?? "Contexto autorizado",
      stageLabel: stagesById.get(game.portal_stage_id)?.name ?? "Jornada/fase não disponível",
      gameLabel: `${homeName} vs ${awayName}`,
      homeName,
      awayName,
      resultLabel: makeScoreLabel(result),
      resultStatus: result?.result_status ?? "no_result",
      gameStatus: game.status,
      submittedAt: result?.submitted_at ?? null,
      validatedAt: result?.validated_at ?? null,
      scheduledAt: game.scheduled_at,
      hasResult: Boolean(result)
    });
  });

  results.forEach((result) => {
    if (recordsByKey.has(result.portal_game_id)) {
      return;
    }

    recordsByKey.set(`result:${result.id}`, {
      key: `result:${result.id}`,
      competitionLabel: competitionsById.get(result.portal_competition_id)?.name ?? "Competição autorizada",
      contextLabel: contextsById.get(result.portal_context_id)?.label ?? "Contexto autorizado",
      stageLabel: stagesById.get(result.portal_stage_id)?.name ?? "Jornada/fase não disponível",
      gameLabel: "Jogo não disponível",
      homeName: "Participante não disponível",
      awayName: "Participante não disponível",
      resultLabel: makeScoreLabel(result),
      resultStatus: result.result_status,
      gameStatus: "unknown",
      submittedAt: result.submitted_at,
      validatedAt: result.validated_at,
      scheduledAt: null,
      hasResult: true
    });
  });

  return Array.from(recordsByKey.values()).sort(
    (first, second) =>
      (second.submittedAt ?? "").localeCompare(first.submittedAt ?? "") ||
      (first.scheduledAt ?? "").localeCompare(second.scheduledAt ?? "") ||
      first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
      first.stageLabel.localeCompare(second.stageLabel, "pt") ||
      first.gameLabel.localeCompare(second.gameLabel, "pt")
  );
}

export async function readPortalResults(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalResultsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, stagesResult, gamesResult, resultsResult] = await Promise.all([
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
      "id,portal_entity_id,portal_context_id,name",
      permissions,
      { sectionLabel: "competicoes", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalResultStageRow>(
      supabase,
      "portal_stages",
      "id,portal_entity_id,portal_context_id,portal_competition_id,name,stage_order",
      permissions,
      { sectionLabel: "jornadas/fases", orderColumn: "stage_order", ascending: true }
    ),
    readScopedRows<PortalResultGameRow>(
      supabase,
      "portal_games",
      "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,home_participant_id,away_participant_id,scheduled_at,status",
      permissions,
      { sectionLabel: "jogos", orderColumn: "scheduled_at", ascending: true }
    ),
    readScopedRows<PortalResultRow>(
      supabase,
      "portal_results",
      "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,portal_game_id,home_score,away_score,result_status,submitted_at,validated_at",
      permissions,
      { sectionLabel: "resultados", orderColumn: "submitted_at", ascending: false }
    )
  ]);

  [contextsResult, competitionsResult, stagesResult, gamesResult, resultsResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const participantIds = uniqueValues(gamesResult.rows.flatMap((game) => [game.home_participant_id, game.away_participant_id]));
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

  return {
    results: makeRecords(gamesResult.rows, resultsResult.rows, stages, contexts, competitions, participantsResult.rows),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
