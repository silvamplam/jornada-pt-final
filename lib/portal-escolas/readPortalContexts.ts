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

type PortalContextEntityRow = RowWithId & {
  name: string;
};

type PortalContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

export type PortalContextScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
};

export type PortalContextRecord = {
  key: string;
  label: string;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  entityLabel: string;
};

export type PortalContextsData = {
  contexts: PortalContextRecord[];
  scopes: PortalContextScope[];
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
      rows: [] as PortalContextEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalContextEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalContextEntityRow[],
  contexts: PortalContextRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);

  return permissions.map((permission) => {
    const context = permission.portal_context_id ? contextsById.get(permission.portal_context_id) : null;

    return {
      id: permission.id,
      entityLabel: entitiesById.get(permission.portal_entity_id)?.name ?? "Entidade autorizada",
      contextLabel: permission.portal_context_id ? context?.label ?? "Contexto autorizado" : "Todos os contextos"
    };
  });
}

function makeContexts(contexts: PortalContextRow[], entities: PortalContextEntityRow[]) {
  const entitiesById = indexById(entities);

  return contexts
    .map((context) => ({
      key: context.id,
      label: context.label,
      type: context.type,
      startDate: context.start_date,
      endDate: context.end_date,
      status: context.status,
      entityLabel: entitiesById.get(context.portal_entity_id)?.name ?? "Entidade autorizada"
    }))
    .sort(
      (first, second) =>
        first.entityLabel.localeCompare(second.entityLabel, "pt") ||
        first.label.localeCompare(second.label, "pt") ||
        (first.startDate ?? "").localeCompare(second.startDate ?? "")
    );
}

export async function readPortalContexts(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalContextsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const contextsResult = await readScopedRows<PortalContextRow>(
    supabase,
    "portal_contexts",
    "id,portal_entity_id,label,type,start_date,end_date,status",
    permissions,
    {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }
  );

  contextsResult.unavailableSections.forEach((section) => unavailableSections.add(section));

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);

  return {
    contexts: makeContexts(contexts, entities),
    scopes: makeScopes(permissions, entities, contexts),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
