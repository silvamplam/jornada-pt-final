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

type PortalParticipantEntityRow = RowWithId & {
  name: string;
};

type PortalParticipantContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalParticipantCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
};

type PortalParticipantRow = RowWithId & {
  portal_entity_id: string;
  name: string;
  type: string;
  status: string;
};

type PortalParticipantLinkRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  portal_participant_id: string;
  registration_status: string;
  group_label: string | null;
  seed_order: number | null;
};

export type PortalParticipantScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalParticipantRecord = {
  key: string;
  name: string;
  type: string;
  status: string;
  registrationStatus: string;
  groupLabel: string | null;
  competitionLabel: string;
  contextLabel: string;
};

export type PortalParticipantsData = {
  participants: PortalParticipantRecord[];
  scopes: PortalParticipantScope[];
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
      rows: [] as PortalParticipantEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalParticipantEntityRow>(supabase, "portal_entities", "id,name", {
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
      rows: [] as PortalParticipantRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalParticipantRow>(supabase, "portal_participants", "id,portal_entity_id,name,type,status", {
    sectionLabel: "participantes",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", participantIds).order("name", { ascending: true });
    }
  });
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalParticipantEntityRow[],
  contexts: PortalParticipantContextRow[],
  competitions: PortalParticipantCompetitionRow[]
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

function makeParticipants(
  links: PortalParticipantLinkRow[],
  participants: PortalParticipantRow[],
  contexts: PortalParticipantContextRow[],
  competitions: PortalParticipantCompetitionRow[]
) {
  const participantsById = indexById(participants);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);

  return links
    .map((link) => {
      const participant = participantsById.get(link.portal_participant_id);

      if (!participant) {
        return null;
      }

      return {
        key: `${link.portal_competition_id}:${participant.id}`,
        name: participant.name,
        type: participant.type,
        status: participant.status,
        registrationStatus: link.registration_status,
        groupLabel: link.group_label,
        competitionLabel: competitionsById.get(link.portal_competition_id)?.name ?? "Competição autorizada",
        contextLabel: contextsById.get(link.portal_context_id)?.label ?? "Contexto autorizado",
        seedOrder: link.seed_order ?? Number.MAX_SAFE_INTEGER
      };
    })
    .filter((participant): participant is PortalParticipantRecord & { seedOrder: number } => Boolean(participant))
    .sort(
      (first, second) =>
        first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
        (first.groupLabel ?? "").localeCompare(second.groupLabel ?? "", "pt") ||
        first.seedOrder - second.seedOrder ||
        first.name.localeCompare(second.name, "pt")
    )
    .map(({ seedOrder: _seedOrder, ...participant }) => participant);
}

export async function readPortalParticipants(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalParticipantsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, participantLinksResult] = await Promise.all([
    readScopedRows<PortalParticipantContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalParticipantCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name",
      permissions,
      { sectionLabel: "competicoes", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalParticipantLinkRow>(
      supabase,
      "portal_competition_participants",
      "id,portal_entity_id,portal_context_id,portal_competition_id,portal_participant_id,registration_status,group_label,seed_order",
      permissions,
      { sectionLabel: "inscricoes", orderColumn: "seed_order", ascending: true }
    )
  ]);

  [contextsResult, competitionsResult, participantLinksResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const participantIds = uniqueValues(participantLinksResult.rows.map((link) => link.portal_participant_id));
  const participantsResult = await readParticipantsByIds(supabase, participantIds);

  if (participantsResult.unavailableSection) {
    unavailableSections.add(participantsResult.unavailableSection);
  }

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);

  return {
    participants: makeParticipants(participantLinksResult.rows, participantsResult.rows, contexts, competitions),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
