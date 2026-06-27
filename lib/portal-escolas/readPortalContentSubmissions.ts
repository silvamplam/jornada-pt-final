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

type PortalContentEntityRow = RowWithId & {
  name: string;
};

type PortalContentContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalContentCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
};

type PortalContentStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  stage_order: number | null;
};

type PortalContentGameRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_stage_id: string;
  home_participant_id: string | null;
  away_participant_id: string | null;
  scheduled_at: string | null;
};

type PortalContentParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
};

type PortalContentSubmissionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string | null;
  portal_stage_id: string | null;
  portal_game_id: string | null;
  portal_participant_id: string | null;
  type: string | null;
  title: string;
  summary: string | null;
  submission_status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

export type PortalContentScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalContentSubmissionRecord = {
  key: string;
  title: string;
  summary: string | null;
  type: string | null;
  submissionStatus: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  competitionLabel: string;
  contextLabel: string;
  stageLabel: string;
  gameLabel: string;
  participantLabel: string;
};

export type PortalContentSubmissionsData = {
  submissions: PortalContentSubmissionRecord[];
  scopes: PortalContentScope[];
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
      rows: [] as PortalContentEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalContentEntityRow>(supabase, "portal_entities", "id,name", {
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
      rows: [] as PortalContentParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalContentParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name", {
    sectionLabel: "participantes",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", participantIds).order("name", { ascending: true });
    }
  });
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalContentEntityRow[],
  contexts: PortalContentContextRow[],
  competitions: PortalContentCompetitionRow[]
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

function makeGameLabel(game: PortalContentGameRow | undefined, participantsById: Map<string, PortalContentParticipantRow>) {
  if (!game) {
    return "Jogo não disponível";
  }

  const homeName = game.home_participant_id
    ? participantsById.get(game.home_participant_id)?.name ?? "Participante não disponível"
    : "Participante por definir";
  const awayName = game.away_participant_id
    ? participantsById.get(game.away_participant_id)?.name ?? "Participante não disponível"
    : "Participante por definir";

  return `${homeName} vs ${awayName}`;
}

function makeSubmissions(
  submissions: PortalContentSubmissionRow[],
  contexts: PortalContentContextRow[],
  competitions: PortalContentCompetitionRow[],
  stages: PortalContentStageRow[],
  games: PortalContentGameRow[],
  participants: PortalContentParticipantRow[]
) {
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);
  const stagesById = indexById(stages);
  const gamesById = indexById(games);
  const participantsById = indexById(participants);

  return submissions
    .map((submission) => ({
      key: submission.id,
      title: submission.title,
      summary: submission.summary,
      type: submission.type,
      submissionStatus: submission.submission_status,
      submittedAt: submission.submitted_at,
      reviewedAt: submission.reviewed_at,
      competitionLabel: submission.portal_competition_id
        ? competitionsById.get(submission.portal_competition_id)?.name ?? "Competição não disponível"
        : "Competição não disponível",
      contextLabel: contextsById.get(submission.portal_context_id)?.label ?? "Contexto autorizado",
      stageLabel: submission.portal_stage_id
        ? stagesById.get(submission.portal_stage_id)?.name ?? "Jornada/fase não disponível"
        : "Jornada/fase não disponível",
      gameLabel: submission.portal_game_id ? makeGameLabel(gamesById.get(submission.portal_game_id), participantsById) : "Jogo não associado",
      participantLabel: submission.portal_participant_id
        ? participantsById.get(submission.portal_participant_id)?.name ?? "Participante não disponível"
        : "Participante não associado"
    }))
    .sort(
      (first, second) =>
        (second.submittedAt ?? "").localeCompare(first.submittedAt ?? "") ||
        first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
        first.title.localeCompare(second.title, "pt")
    );
}

export async function readPortalContentSubmissions(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalContentSubmissionsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, stagesResult, gamesResult, submissionsResult] = await Promise.all([
    readScopedRows<PortalContentContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalContentCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name",
      permissions,
      { sectionLabel: "competicoes", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalContentStageRow>(
      supabase,
      "portal_stages",
      "id,portal_entity_id,portal_context_id,portal_competition_id,name,stage_order",
      permissions,
      { sectionLabel: "jornadas/fases", orderColumn: "stage_order", ascending: true }
    ),
    readScopedRows<PortalContentGameRow>(
      supabase,
      "portal_games",
      "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,home_participant_id,away_participant_id,scheduled_at",
      permissions,
      { sectionLabel: "jogos", orderColumn: "scheduled_at", ascending: true }
    ),
    readScopedRows<PortalContentSubmissionRow>(
      supabase,
      "portal_content_submissions",
      "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,portal_game_id,portal_participant_id,type,title,summary,submission_status,submitted_at,reviewed_at",
      permissions,
      { sectionLabel: "conteudos", orderColumn: "submitted_at", ascending: false }
    )
  ]);

  [contextsResult, competitionsResult, stagesResult, gamesResult, submissionsResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const participantIds = uniqueValues([
    ...submissionsResult.rows.map((submission) => submission.portal_participant_id),
    ...gamesResult.rows.flatMap((game) => [game.home_participant_id, game.away_participant_id])
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

  return {
    submissions: makeSubmissions(submissionsResult.rows, contexts, competitions, stages, gamesResult.rows, participantsResult.rows),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
