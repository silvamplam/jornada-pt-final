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

type PortalStageEntityRow = RowWithId & {
  name: string;
};

type PortalStageContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalStageCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
};

type PortalStageRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_competition_id: string;
  name: string;
  type: string;
  stage_order: number | null;
  scheduled_date: string | null;
  status: string;
};

export type PortalStageScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalStageRecord = {
  key: string;
  name: string;
  type: string;
  status: string;
  stageOrder: number | null;
  scheduledDate: string | null;
  competitionLabel: string;
  contextLabel: string;
};

export type PortalStagesData = {
  stages: PortalStageRecord[];
  scopes: PortalStageScope[];
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
      rows: [] as PortalStageEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalStageEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalStageEntityRow[],
  contexts: PortalStageContextRow[],
  competitions: PortalStageCompetitionRow[]
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

function makeStages(
  stages: PortalStageRow[],
  contexts: PortalStageContextRow[],
  competitions: PortalStageCompetitionRow[]
) {
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);

  return stages
    .map((stage) => ({
      key: stage.id,
      name: stage.name,
      type: stage.type,
      status: stage.status,
      stageOrder: stage.stage_order,
      scheduledDate: stage.scheduled_date,
      competitionLabel: competitionsById.get(stage.portal_competition_id)?.name ?? "Competição autorizada",
      contextLabel: contextsById.get(stage.portal_context_id)?.label ?? "Contexto autorizado"
    }))
    .sort(
      (first, second) =>
        first.competitionLabel.localeCompare(second.competitionLabel, "pt") ||
        (first.stageOrder ?? Number.MAX_SAFE_INTEGER) - (second.stageOrder ?? Number.MAX_SAFE_INTEGER) ||
        (first.scheduledDate ?? "9999-12-31").localeCompare(second.scheduledDate ?? "9999-12-31") ||
        first.name.localeCompare(second.name, "pt")
    );
}

export async function readPortalStages(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalStagesData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult, stagesResult] = await Promise.all([
    readScopedRows<PortalStageContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalStageCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,name",
      permissions,
      { sectionLabel: "competicoes", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    ),
    readScopedRows<PortalStageRow>(
      supabase,
      "portal_stages",
      "id,portal_entity_id,portal_context_id,portal_competition_id,name,type,stage_order,scheduled_date,status",
      permissions,
      { sectionLabel: "jornadas/fases", orderColumn: "stage_order", ascending: true }
    )
  ]);

  [contextsResult, competitionsResult, stagesResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);

  return {
    stages: makeStages(stagesResult.rows, contexts, competitions),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
