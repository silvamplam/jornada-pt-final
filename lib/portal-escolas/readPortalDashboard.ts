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

type PortalDashboardEntityRow = RowWithId & {
  name: string;
  slug: string | null;
  type: string;
  status: string;
};

type PortalDashboardContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type PortalDashboardCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
  slug: string | null;
  modality: string | null;
  scope: string | null;
  format: string | null;
  status: string;
};

type PortalDashboardParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
  type: string;
  status: string;
};

type PortalDashboardParticipantLinkRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_participant_id: string;
  registration_status: string;
  group_label: string | null;
  seed_order: number | null;
};

type PortalDashboardStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  type: string;
  stage_order: number | null;
  scheduled_date: string | null;
  status: string;
};

type PortalDashboardGameRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_stage_id: string;
  home_participant_id: string | null;
  away_participant_id: string | null;
  scheduled_at: string | null;
  venue: string | null;
  status: string;
};

type PortalDashboardResultRow = RowWithId & {
  portal_game_id: string;
  home_score: number | null;
  away_score: number | null;
  result_status: string;
  submitted_at: string | null;
  validated_at: string | null;
};

type PortalDashboardContentSubmissionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string | null;
  portal_stage_id: string | null;
  portal_game_id: string | null;
  portal_participant_id: string | null;
  type: string;
  title: string;
  submission_status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

export type PortalDashboardScope = {
  id: string;
  entityId: string;
  entityLabel: string;
  contextId: string | null;
  contextLabel: string;
  competitionId: string | null;
  competitionLabel: string;
};

export type PortalDashboardParticipant = {
  key: string;
  id: string;
  name: string;
  type: string;
  status: string;
  registrationStatus: string;
  groupLabel: string | null;
  competitionId: string;
  competitionLabel: string;
};

export type PortalDashboardGame = {
  id: string;
  stageName: string;
  homeName: string;
  awayName: string;
  scheduledAt: string | null;
  venue: string | null;
  status: string;
  resultLabel: string;
};

export type PortalDashboardData = {
  entities: PortalDashboardEntityRow[];
  contexts: PortalDashboardContextRow[];
  competitions: PortalDashboardCompetitionRow[];
  participants: PortalDashboardParticipant[];
  stages: PortalDashboardStageRow[];
  games: PortalDashboardGame[];
  results: PortalDashboardResultRow[];
  contentSubmissions: PortalDashboardContentSubmissionRow[];
  scopes: PortalDashboardScope[];
  counts: {
    entities: number;
    contexts: number;
    competitions: number;
    participants: number;
    stages: number;
    games: number;
    results: number;
    contentSubmissions: number;
  };
  unavailableSections: string[];
};

const SECTION_LIMIT = 80;
const LOOKUP_LIMIT = 240;

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

    const { data, error } = await query.limit(options.limit ?? SECTION_LIMIT);

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

          if (permission.portal_context_id) {
            scopedQuery = scopedQuery.eq("portal_context_id", permission.portal_context_id);
          }

          if (permission.portal_competition_id) {
            scopedQuery = scopedQuery.eq("portal_competition_id", permission.portal_competition_id);
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
      rows: [] as PortalDashboardEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalDashboardEntityRow>(supabase, "portal_entities", "id,name,slug,type,status", {
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
      rows: [] as PortalDashboardParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalDashboardParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name,type,status", {
    sectionLabel: "participantes",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", participantIds).order("name", { ascending: true });
    }
  });
}

function makeResultLabel(result: PortalDashboardResultRow | undefined) {
  if (!result) {
    return "Sem resultado";
  }

  if (result.home_score === null || result.away_score === null) {
    return result.result_status;
  }

  return `${result.home_score} - ${result.away_score} | ${result.result_status}`;
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalDashboardEntityRow[],
  contexts: PortalDashboardContextRow[],
  competitions: PortalDashboardCompetitionRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);

  return permissions.map((permission) => {
    const entity = entitiesById.get(permission.portal_entity_id);
    const context = permission.portal_context_id ? contextsById.get(permission.portal_context_id) : null;
    const competition = permission.portal_competition_id ? competitionsById.get(permission.portal_competition_id) : null;

    return {
      id: permission.id,
      entityId: permission.portal_entity_id,
      entityLabel: entity?.name ?? permission.portal_entity_id,
      contextId: permission.portal_context_id,
      contextLabel: permission.portal_context_id ? context?.label ?? permission.portal_context_id : "Todos os contextos",
      competitionId: permission.portal_competition_id,
      competitionLabel: permission.portal_competition_id
        ? competition?.name ?? permission.portal_competition_id
        : "Todas as competicoes"
    };
  });
}

function makeParticipants(
  links: PortalDashboardParticipantLinkRow[],
  participants: PortalDashboardParticipantRow[],
  competitions: PortalDashboardCompetitionRow[]
) {
  const participantsById = indexById(participants);
  const competitionsById = indexById(competitions);

  return links
    .map((link) => {
      const participant = participantsById.get(link.portal_participant_id);

      if (!participant) {
        return null;
      }

      return {
        key: `${link.portal_competition_id}:${participant.id}`,
        id: participant.id,
        name: participant.name,
        type: participant.type,
        status: participant.status,
        registrationStatus: link.registration_status,
        groupLabel: link.group_label,
        competitionId: link.portal_competition_id,
        competitionLabel: competitionsById.get(link.portal_competition_id)?.name ?? link.portal_competition_id,
        seedOrder: link.seed_order ?? Number.MAX_SAFE_INTEGER
      };
    })
    .filter((participant): participant is PortalDashboardParticipant & { seedOrder: number } => Boolean(participant))
    .sort((first, second) => first.seedOrder - second.seedOrder || first.name.localeCompare(second.name, "pt"))
    .map(({ seedOrder: _seedOrder, ...participant }) => participant);
}

function makeGames(
  games: PortalDashboardGameRow[],
  stages: PortalDashboardStageRow[],
  participants: PortalDashboardParticipantRow[],
  results: PortalDashboardResultRow[]
) {
  const stagesById = indexById(stages);
  const participantsById = indexById(participants);
  const resultsByGameId = new Map(results.map((result) => [result.portal_game_id, result]));

  return games
    .map((game) => ({
      id: game.id,
      stageName: stagesById.get(game.portal_stage_id)?.name ?? "Jornada/fase sem nome",
      homeName: game.home_participant_id ? participantsById.get(game.home_participant_id)?.name ?? game.home_participant_id : "Participante por definir",
      awayName: game.away_participant_id ? participantsById.get(game.away_participant_id)?.name ?? game.away_participant_id : "Participante por definir",
      scheduledAt: game.scheduled_at,
      venue: game.venue,
      status: game.status,
      resultLabel: makeResultLabel(resultsByGameId.get(game.id))
    }))
    .sort((first, second) => (first.scheduledAt ?? "").localeCompare(second.scheduledAt ?? ""));
}

export async function readPortalDashboard(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalDashboardData> {
  const unavailableSections = new Set<string>();
  const permissions = authorization.permissions;

  const entitiesResult = await readEntities(supabase, permissions);
  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, participantLinksResult, stagesResult, gamesResult, resultsResult, contentResult] =
    await Promise.all([
      readScopedRows<PortalDashboardContextRow>(
        supabase,
        "portal_contexts",
        "id,portal_entity_id,label,type,start_date,end_date,status",
        permissions,
        { sectionLabel: "contextos", orderColumn: "start_date", ascending: false }
      ),
      readScopedRows<PortalDashboardCompetitionRow>(
        supabase,
        "portal_competitions",
        "id,portal_entity_id,portal_context_id,name,slug,modality,scope,format,status",
        permissions,
        { sectionLabel: "competicoes", orderColumn: "name", ascending: true }
      ),
      readScopedRows<PortalDashboardParticipantLinkRow>(
        supabase,
        "portal_competition_participants",
        "id,portal_entity_id,portal_context_id,portal_competition_id,portal_participant_id,registration_status,group_label,seed_order",
        permissions,
        { sectionLabel: "inscricoes", orderColumn: "seed_order", ascending: true }
      ),
      readScopedRows<PortalDashboardStageRow>(
        supabase,
        "portal_stages",
        "id,portal_entity_id,portal_context_id,portal_competition_id,name,type,stage_order,scheduled_date,status",
        permissions,
        { sectionLabel: "jornadas/fases", orderColumn: "stage_order", ascending: true }
      ),
      readScopedRows<PortalDashboardGameRow>(
        supabase,
        "portal_games",
        "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,home_participant_id,away_participant_id,scheduled_at,venue,status",
        permissions,
        { sectionLabel: "jogos", orderColumn: "scheduled_at", ascending: true }
      ),
      readScopedRows<PortalDashboardResultRow>(
        supabase,
        "portal_results",
        "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,portal_game_id,home_score,away_score,result_status,submitted_at,validated_at",
        permissions,
        { sectionLabel: "resultados", orderColumn: "submitted_at", ascending: false }
      ),
      readScopedRows<PortalDashboardContentSubmissionRow>(
        supabase,
        "portal_content_submissions",
        "id,portal_entity_id,portal_context_id,portal_competition_id,portal_stage_id,portal_game_id,portal_participant_id,type,title,submission_status,submitted_at,reviewed_at",
        permissions,
        { sectionLabel: "conteudos", orderColumn: "submitted_at", ascending: false }
      )
    ]);

  [
    contextsResult,
    competitionsResult,
    participantLinksResult,
    stagesResult,
    gamesResult,
    resultsResult,
    contentResult
  ].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const participantIds = uniqueValues([
    ...participantLinksResult.rows.map((link) => link.portal_participant_id),
    ...gamesResult.rows.flatMap((game) => [game.home_participant_id, game.away_participant_id]),
    ...contentResult.rows.map((content) => content.portal_participant_id)
  ]);
  const participantsResult = await readParticipantsByIds(supabase, participantIds);

  if (participantsResult.unavailableSection) {
    unavailableSections.add(participantsResult.unavailableSection);
  }

  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);
  const participants = makeParticipants(participantLinksResult.rows, participantsResult.rows, competitions);
  const stages = [...stagesResult.rows].sort(
    (first, second) =>
      (first.stage_order ?? Number.MAX_SAFE_INTEGER) - (second.stage_order ?? Number.MAX_SAFE_INTEGER) ||
      first.name.localeCompare(second.name, "pt")
  );
  const games = makeGames(gamesResult.rows, stages, participantsResult.rows, resultsResult.rows);
  const results = [...resultsResult.rows].sort((first, second) => (second.submitted_at ?? "").localeCompare(first.submitted_at ?? ""));
  const contentSubmissions = [...contentResult.rows].sort((first, second) =>
    (second.submitted_at ?? "").localeCompare(first.submitted_at ?? "")
  );

  return {
    entities,
    contexts,
    competitions,
    participants,
    stages,
    games,
    results,
    contentSubmissions,
    scopes: makeScopes(permissions, entities, contexts, competitions),
    counts: {
      entities: entities.length,
      contexts: contexts.length,
      competitions: competitions.length,
      participants: participants.length,
      stages: stages.length,
      games: games.length,
      results: results.length,
      contentSubmissions: contentSubmissions.length
    },
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
