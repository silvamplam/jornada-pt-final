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

type PortalCompetitionEntityRow = RowWithId & {
  name: string;
};

type PortalCompetitionContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalCompetitionRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  name: string;
  slug: string | null;
  modality: string | null;
  scope: string | null;
  format: string | null;
  status: string;
};

type PortalCompetitionModalityRow = RowWithId & {
  catalog_modality_id: string | null;
  name: string;
  slug: string | null;
  local_code: string | null;
  status: string;
};

type PortalCompetitionModalityCatalogRow = RowWithId & {
  code: string;
  name: string;
  status: string;
};

export type PortalCompetitionScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalCompetitionRecord = {
  key: string;
  name: string;
  slug: string | null;
  modality: string | null;
  scope: string | null;
  format: string | null;
  status: string;
  entityLabel: string;
  contextLabel: string;
  formalModalityName: string | null;
  formalModalitySlug: string | null;
  formalModalityLocalCode: string | null;
  formalModalityCatalogCode: string | null;
  formalModalityCatalogName: string | null;
  formalModalityStatus: string | null;
};

export type PortalCompetitionsData = {
  competitions: PortalCompetitionRecord[];
  scopes: PortalCompetitionScope[];
  formalModalityCount: number;
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
      rows: [] as PortalCompetitionEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalCompetitionEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalCompetitionEntityRow[],
  contexts: PortalCompetitionContextRow[],
  competitions: PortalCompetitionRow[]
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

function makeCompetitions(
  competitions: PortalCompetitionRow[],
  entities: PortalCompetitionEntityRow[],
  contexts: PortalCompetitionContextRow[],
  formalModalities: PortalCompetitionModalityRow[],
  modalityCatalog: PortalCompetitionModalityCatalogRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const formalModalitiesById = indexById(formalModalities);
  const catalogById = indexById(modalityCatalog);

  return competitions
    .map((competition) => {
      const formalModality = competition.portal_modality_id
        ? formalModalitiesById.get(competition.portal_modality_id) ?? null
        : null;
      const catalog = formalModality?.catalog_modality_id
        ? catalogById.get(formalModality.catalog_modality_id) ?? null
        : null;

      return {
        key: competition.id,
        name: competition.name,
        slug: competition.slug,
        modality: competition.modality,
        scope: competition.scope,
        format: competition.format,
        status: competition.status,
        entityLabel: entitiesById.get(competition.portal_entity_id)?.name ?? "Entidade autorizada",
        contextLabel: contextsById.get(competition.portal_context_id)?.label ?? "Contexto autorizado",
        formalModalityName: formalModality?.name ?? null,
        formalModalitySlug: formalModality?.slug ?? null,
        formalModalityLocalCode: formalModality?.local_code ?? null,
        formalModalityCatalogCode: catalog?.code ?? null,
        formalModalityCatalogName: catalog?.name ?? null,
        formalModalityStatus: formalModality?.status ?? null
      };
    })
    .sort(
      (first, second) =>
        first.contextLabel.localeCompare(second.contextLabel, "pt") ||
        (first.formalModalityName ?? first.modality ?? "").localeCompare(
          second.formalModalityName ?? second.modality ?? "",
          "pt"
        ) ||
        first.name.localeCompare(second.name, "pt")
    );
}

async function readFormalModalities(
  supabase: SupabaseClient,
  competitions: PortalCompetitionRow[]
) {
  const modalityIds = uniqueValues(competitions.map((competition) => competition.portal_modality_id));

  if (modalityIds.length === 0) {
    return {
      rows: [] as PortalCompetitionModalityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalCompetitionModalityRow>(
    supabase,
    "portal_modalities",
    "id,catalog_modality_id,name,slug,local_code,status",
    {
      sectionLabel: "modalidades formais",
      limit: LOOKUP_LIMIT,
      apply(query) {
        return query.in("id", modalityIds).order("name", { ascending: true });
      }
    }
  );
}

async function readModalityCatalog(
  supabase: SupabaseClient,
  formalModalities: PortalCompetitionModalityRow[]
) {
  const catalogIds = uniqueValues(formalModalities.map((modality) => modality.catalog_modality_id));

  if (catalogIds.length === 0) {
    return {
      rows: [] as PortalCompetitionModalityCatalogRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalCompetitionModalityCatalogRow>(supabase, "portal_modality_catalog", "id,code,name,status", {
    sectionLabel: "catálogo de modalidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", catalogIds).order("name", { ascending: true });
    }
  });
}

export async function readPortalCompetitions(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalCompetitionsData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const entitiesResult = await readEntities(supabase, permissions);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  const [contextsResult, competitionsResult] = await Promise.all([
    readScopedRows<PortalCompetitionContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      orderColumn: "label",
      ascending: true,
      includeCompetitionScope: false,
      contextScopeColumn: "id"
    }),
    readScopedRows<PortalCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,portal_modality_id,name,slug,modality,scope,format,status",
      permissions,
      { sectionLabel: "competicoes", orderColumn: "name", ascending: true, competitionScopeColumn: "id" }
    )
  ]);

  [contextsResult, competitionsResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);
  const formalModalitiesResult = await readFormalModalities(supabase, competitions);

  if (formalModalitiesResult.unavailableSection) {
    unavailableSections.add(formalModalitiesResult.unavailableSection);
  }

  const formalModalities = sortByLabel(formalModalitiesResult.rows, (modality) => modality.name);
  const modalityCatalogResult = await readModalityCatalog(supabase, formalModalities);

  if (modalityCatalogResult.unavailableSection) {
    unavailableSections.add(modalityCatalogResult.unavailableSection);
  }

  return {
    competitions: makeCompetitions(competitions, entities, contexts, formalModalities, modalityCatalogResult.rows),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    formalModalityCount: formalModalities.length,
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
