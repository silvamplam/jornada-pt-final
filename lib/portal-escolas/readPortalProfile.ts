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
  in(column: string, values: string[]): PortalQuery;
  order(column: string, options?: { ascending?: boolean }): PortalQuery;
  limit(count: number): Promise<PortalQueryResult>;
};

type PortalProfileEntityRow = RowWithId & {
  name: string;
};

type PortalProfileContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalProfileCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string | null;
  name: string;
};

export type PortalProfileScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
  permissionLabel: string;
  permissionStatus: string;
};

export type PortalProfileData = {
  scopes: PortalProfileScope[];
  unavailableSections: string[];
};

const LOOKUP_LIMIT = 1000;

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function indexById<T extends RowWithId>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function readRows<T extends RowWithId>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  options: {
    sectionLabel: string;
    apply: (query: PortalQuery) => PortalQuery;
  }
) {
  try {
    const query = options.apply(supabase.from(table).select(select) as unknown as PortalQuery);
    const { data, error } = await query.limit(LOOKUP_LIMIT);

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

async function readEntities(supabase: SupabaseClient, permissions: PortalPermissionRow[]) {
  const entityIds = uniqueValues(permissions.map((permission) => permission.portal_entity_id));

  if (entityIds.length === 0) {
    return {
      rows: [] as PortalProfileEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalProfileEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

async function readContexts(supabase: SupabaseClient, permissions: PortalPermissionRow[]) {
  const contextIds = uniqueValues(permissions.map((permission) => permission.portal_context_id));

  if (contextIds.length === 0) {
    return {
      rows: [] as PortalProfileContextRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalProfileContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", {
    sectionLabel: "contextos",
    apply(query) {
      return query.in("id", contextIds).order("label", { ascending: true });
    }
  });
}

async function readCompetitions(supabase: SupabaseClient, permissions: PortalPermissionRow[]) {
  const competitionIds = uniqueValues(permissions.map((permission) => permission.portal_competition_id));

  if (competitionIds.length === 0) {
    return {
      rows: [] as PortalProfileCompetitionRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalProfileCompetitionRow>(
    supabase,
    "portal_competitions",
    "id,portal_entity_id,portal_context_id,name",
    {
      sectionLabel: "competicoes",
      apply(query) {
        return query.in("id", competitionIds).order("name", { ascending: true });
      }
    }
  );
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalProfileEntityRow[],
  contexts: PortalProfileContextRow[],
  competitions: PortalProfileCompetitionRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const competitionsById = indexById(competitions);

  return permissions
    .map((permission) => {
      const context = permission.portal_context_id ? contextsById.get(permission.portal_context_id) : null;
      const competition = permission.portal_competition_id ? competitionsById.get(permission.portal_competition_id) : null;

      return {
        id: permission.id,
        entityLabel: entitiesById.get(permission.portal_entity_id)?.name ?? "Entidade autorizada",
        contextLabel: permission.portal_context_id ? context?.label ?? "Contexto autorizado" : "Todos os contextos",
        competitionLabel: permission.portal_competition_id
          ? competition?.name ?? "Competição autorizada"
          : "Todas as competições",
        permissionLabel: permission.can_view ? "Leitura autorizada" : "Permissão sem leitura",
        permissionStatus: permission.status
      };
    })
    .sort(
      (first, second) =>
        first.entityLabel.localeCompare(second.entityLabel, "pt") ||
        first.contextLabel.localeCompare(second.contextLabel, "pt") ||
        first.competitionLabel.localeCompare(second.competitionLabel, "pt")
    );
}

export async function readPortalProfile(supabase: SupabaseClient, authorization: AuthorizedPortal): Promise<PortalProfileData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();
  const [entitiesResult, contextsResult, competitionsResult] = await Promise.all([
    readEntities(supabase, permissions),
    readContexts(supabase, permissions),
    readCompetitions(supabase, permissions)
  ]);

  [entitiesResult, contextsResult, competitionsResult].forEach((result) => {
    if (result.unavailableSection) {
      unavailableSections.add(result.unavailableSection);
    }
  });

  return {
    scopes: makeScopes(permissions, entitiesResult.rows, contextsResult.rows, competitionsResult.rows),
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
