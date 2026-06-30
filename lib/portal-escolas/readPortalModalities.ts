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

type PortalModalityEntityRow = RowWithId & {
  name: string;
};

type PortalModalityContextRow = RowWithId & {
  portal_entity_id: string;
  label: string;
};

type PortalModalityCatalogRow = RowWithId & {
  code: string;
  name: string;
  modality_family: string | null;
  default_event_model: string | null;
  default_result_model: string | null;
  status: string;
};

type PortalModalityRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  catalog_modality_id: string | null;
  name: string;
  slug: string | null;
  local_code: string | null;
  display_order: number | null;
  status: string;
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

type PortalCompetitionFormatRow = RowWithId & {
  portal_entity_id: string;
  portal_context_id: string;
  portal_modality_id: string | null;
  portal_competition_id: string;
  name: string;
  code: string | null;
  event_model: string | null;
  result_model: string | null;
  ranking_model: string | null;
  status: string;
};

export type PortalModalityScope = {
  id: string;
  entityLabel: string;
  contextLabel: string;
  competitionLabel: string;
};

export type PortalModalityCreationScope = {
  key: string;
  portalEntityId: string;
  portalContextId: string;
  entityLabel: string;
  contextLabel: string;
};

export type PortalModalityCompetitionRecord = {
  key: string;
  name: string;
  slug: string | null;
  formatLabel: string;
  formalFormatLabel: string;
  statusLabel: string;
  scopeLabel: string;
};

export type PortalModalityRecord = {
  key: string;
  name: string;
  slug: string | null;
  localCode: string | null;
  source: "formal" | "legacy";
  sourceLabel: string;
  statusLabel: string;
  entityLabel: string;
  contextLabel: string;
  catalogLabel: string;
  catalogCode: string | null;
  familyLabel: string;
  defaultEventModelLabel: string;
  defaultResultModelLabel: string;
  competitionCount: number;
  competitions: PortalModalityCompetitionRecord[];
  componentLabels: string[];
};

export type PortalModalityCatalogRecord = {
  key: string;
  code: string;
  name: string;
  familyLabel: string;
  defaultEventModelLabel: string;
  defaultResultModelLabel: string;
  statusLabel: string;
};

export type PortalModalitiesData = {
  modalities: PortalModalityRecord[];
  catalog: PortalModalityCatalogRecord[];
  scopes: PortalModalityScope[];
  creationScopes: PortalModalityCreationScope[];
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

function normalizeKey(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatStatus(value: string | null | undefined, fallback = "Por definir") {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (firstLetter) => firstLetter.toUpperCase());
}

function formatModelLabel(value: string | null | undefined, fallback = "Por definir") {
  return formatStatus(value, fallback);
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

async function readCreationScopeModalities(
  supabase: SupabaseClient,
  creationScopes: PortalModalityCreationScope[]
) {
  const rowsById = new Map<string, PortalModalityRow>();
  const unavailableSections = new Set<string>();

  await Promise.all(
    creationScopes.map(async (scope) => {
      const result = await readRows<PortalModalityRow>(
        supabase,
        "portal_modalities",
        "id,portal_entity_id,portal_context_id,catalog_modality_id,name,slug,local_code,display_order,status",
        {
          sectionLabel: "modalidades formais",
          apply(query) {
            return query
              .eq("portal_entity_id", scope.portalEntityId)
              .eq("portal_context_id", scope.portalContextId);
          }
        }
      );

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
      rows: [] as PortalModalityEntityRow[],
      unavailableSection: null
    };
  }

  return readRows<PortalModalityEntityRow>(supabase, "portal_entities", "id,name", {
    sectionLabel: "entidades",
    limit: LOOKUP_LIMIT,
    apply(query) {
      return query.in("id", entityIds).order("name", { ascending: true });
    }
  });
}

function findCatalogByLegacyLabel(catalogRows: PortalModalityCatalogRow[], label: string | null) {
  const normalizedLabel = normalizeLabel(label);

  if (!normalizedLabel) {
    return null;
  }

  return (
    catalogRows.find((catalog) => normalizeLabel(catalog.name) === normalizedLabel) ??
    catalogRows.find((catalog) => normalizeLabel(catalog.code) === normalizedLabel || normalizeKey(catalog.code) === normalizeKey(label)) ??
    null
  );
}

function makeScopes(
  permissions: PortalPermissionRow[],
  entities: PortalModalityEntityRow[],
  contexts: PortalModalityContextRow[],
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

function makeCreationScopes(
  permissions: PortalPermissionRow[],
  entities: PortalModalityEntityRow[],
  contexts: PortalModalityContextRow[]
): PortalModalityCreationScope[] {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const scopesByContextId = new Map<string, PortalModalityCreationScope>();

  permissions.forEach((permission) => {
    if (
      !permission.can_view ||
      !permission.can_create ||
      !permission.can_edit ||
      permission.status !== "active" ||
      permission.portal_competition_id ||
      !permission.portal_context_id
    ) {
      return;
    }

    if (scopesByContextId.has(permission.portal_context_id)) {
      return;
    }

    scopesByContextId.set(permission.portal_context_id, {
      key: permission.id,
      portalEntityId: permission.portal_entity_id,
      portalContextId: permission.portal_context_id,
      entityLabel: entitiesById.get(permission.portal_entity_id)?.name ?? "Entidade autorizada",
      contextLabel: contextsById.get(permission.portal_context_id)?.label ?? "Contexto autorizado"
    });
  });

  return Array.from(scopesByContextId.values()).sort(
    (first, second) =>
      first.entityLabel.localeCompare(second.entityLabel, "pt") ||
      first.contextLabel.localeCompare(second.contextLabel, "pt")
  );
}

function makeCompetitionRecord(competition: PortalCompetitionRow, formatsByCompetitionId: Map<string, PortalCompetitionFormatRow[]>) {
  const formats = formatsByCompetitionId.get(competition.id) ?? [];
  const activeFormat = formats[0] ?? null;

  return {
    key: competition.id,
    name: competition.name,
    slug: competition.slug,
    formatLabel: formatStatus(competition.format),
    formalFormatLabel: activeFormat ? `${activeFormat.name} (${activeFormat.code ?? "sem código"})` : "Sem formato formal",
    statusLabel: formatStatus(competition.status),
    scopeLabel: formatStatus(competition.scope)
  };
}

function readComponentLabels(
  catalog: PortalModalityCatalogRow | null,
  competitions: PortalCompetitionRow[],
  formatsByCompetitionId: Map<string, PortalCompetitionFormatRow[]>
) {
  const labels = new Set<string>();

  if (catalog?.default_event_model) {
    labels.add(`Evento: ${formatModelLabel(catalog.default_event_model)}`);
  }

  if (catalog?.default_result_model) {
    labels.add(`Resultado: ${formatModelLabel(catalog.default_result_model)}`);
  }

  competitions.forEach((competition) => {
    const formats = formatsByCompetitionId.get(competition.id) ?? [];

    formats.forEach((format) => {
      if (format.event_model) {
        labels.add(`Evento: ${formatModelLabel(format.event_model)}`);
      }
      if (format.result_model) {
        labels.add(`Resultado: ${formatModelLabel(format.result_model)}`);
      }
      if (format.ranking_model) {
        labels.add(`Ranking: ${formatModelLabel(format.ranking_model)}`);
      }
    });
  });

  return Array.from(labels).slice(0, 6);
}

function makeModalities(
  formalModalities: PortalModalityRow[],
  catalogRows: PortalModalityCatalogRow[],
  competitions: PortalCompetitionRow[],
  formats: PortalCompetitionFormatRow[],
  entities: PortalModalityEntityRow[],
  contexts: PortalModalityContextRow[]
) {
  const entitiesById = indexById(entities);
  const contextsById = indexById(contexts);
  const catalogById = indexById(catalogRows);
  const formatsByCompetitionId = new Map<string, PortalCompetitionFormatRow[]>();

  formats.forEach((format) => {
    const existing = formatsByCompetitionId.get(format.portal_competition_id) ?? [];
    existing.push(format);
    formatsByCompetitionId.set(format.portal_competition_id, existing);
  });

  const consumedCompetitionIds = new Set<string>();
  const formalRecords = formalModalities.map((modality) => {
    const catalog = modality.catalog_modality_id ? catalogById.get(modality.catalog_modality_id) ?? null : null;
    const attachedCompetitions = competitions.filter((competition) => {
      if (consumedCompetitionIds.has(competition.id)) {
        return false;
      }

      if (competition.portal_modality_id === modality.id) {
        consumedCompetitionIds.add(competition.id);
        return true;
      }

      if (competition.portal_modality_id) {
        return false;
      }

      const competitionModality = normalizeLabel(competition.modality);
      const modalityName = normalizeLabel(modality.name);
      const catalogName = normalizeLabel(catalog?.name);

      if (competitionModality && (competitionModality === modalityName || competitionModality === catalogName)) {
        consumedCompetitionIds.add(competition.id);
        return true;
      }

      return false;
    });

    return {
      key: modality.id,
      name: modality.name,
      slug: modality.slug,
      localCode: modality.local_code,
      source: "formal" as const,
      sourceLabel: "Modalidade formal",
      statusLabel: formatStatus(modality.status),
      entityLabel: entitiesById.get(modality.portal_entity_id)?.name ?? "Entidade autorizada",
      contextLabel: contextsById.get(modality.portal_context_id)?.label ?? "Contexto autorizado",
      catalogLabel: catalog?.name ?? "Sem catálogo associado",
      catalogCode: catalog?.code ?? null,
      familyLabel: formatStatus(catalog?.modality_family, "Família por definir"),
      defaultEventModelLabel: formatModelLabel(catalog?.default_event_model),
      defaultResultModelLabel: formatModelLabel(catalog?.default_result_model),
      competitionCount: attachedCompetitions.length,
      competitions: attachedCompetitions.map((competition) => makeCompetitionRecord(competition, formatsByCompetitionId)),
      componentLabels: readComponentLabels(catalog, attachedCompetitions, formatsByCompetitionId)
    };
  });

  const legacyGroups = new Map<string, PortalCompetitionRow[]>();

  competitions.forEach((competition) => {
    if (consumedCompetitionIds.has(competition.id)) {
      return;
    }

    const modalityLabel = competition.modality?.trim() || "Modalidade por definir";
    const groupKey = `${competition.portal_entity_id}:${competition.portal_context_id}:${normalizeKey(modalityLabel) || "por-definir"}`;
    const existing = legacyGroups.get(groupKey) ?? [];
    existing.push(competition);
    legacyGroups.set(groupKey, existing);
  });

  const legacyRecords = Array.from(legacyGroups.entries()).map(([groupKey, groupCompetitions]) => {
    const firstCompetition = groupCompetitions[0];
    const modalityLabel = firstCompetition?.modality?.trim() || "Modalidade por definir";
    const catalog = findCatalogByLegacyLabel(catalogRows, modalityLabel);

    return {
      key: `legacy-${groupKey}`,
      name: modalityLabel,
      slug: normalizeKey(modalityLabel) || null,
      localCode: null,
      source: "legacy" as const,
      sourceLabel: "Fallback por competição",
      statusLabel: "Compatibilidade",
      entityLabel: firstCompetition ? entitiesById.get(firstCompetition.portal_entity_id)?.name ?? "Entidade autorizada" : "Entidade autorizada",
      contextLabel: firstCompetition ? contextsById.get(firstCompetition.portal_context_id)?.label ?? "Contexto autorizado" : "Contexto autorizado",
      catalogLabel: catalog?.name ?? "Catálogo por associar",
      catalogCode: catalog?.code ?? null,
      familyLabel: formatStatus(catalog?.modality_family, "Família por definir"),
      defaultEventModelLabel: formatModelLabel(catalog?.default_event_model),
      defaultResultModelLabel: formatModelLabel(catalog?.default_result_model),
      competitionCount: groupCompetitions.length,
      competitions: groupCompetitions.map((competition) => makeCompetitionRecord(competition, formatsByCompetitionId)),
      componentLabels: readComponentLabels(catalog, groupCompetitions, formatsByCompetitionId)
    };
  });

  return [...formalRecords, ...legacyRecords].sort(
    (first, second) =>
      first.contextLabel.localeCompare(second.contextLabel, "pt") ||
      first.name.localeCompare(second.name, "pt") ||
      first.sourceLabel.localeCompare(second.sourceLabel, "pt")
  );
}

function makeCatalog(catalogRows: PortalModalityCatalogRow[]): PortalModalityCatalogRecord[] {
  return sortByLabel(catalogRows, (catalog) => catalog.name).map((catalog) => ({
    key: catalog.id,
    code: catalog.code,
    name: catalog.name,
    familyLabel: formatStatus(catalog.modality_family, "Família por definir"),
    defaultEventModelLabel: formatModelLabel(catalog.default_event_model),
    defaultResultModelLabel: formatModelLabel(catalog.default_result_model),
    statusLabel: formatStatus(catalog.status)
  }));
}

export async function readPortalModalities(
  supabase: SupabaseClient,
  authorization: AuthorizedPortal
): Promise<PortalModalitiesData> {
  const permissions = authorization.permissions;
  const unavailableSections = new Set<string>();

  const [entitiesResult, contextsResult, catalogResult, modalitiesResult, competitionsResult, formatsResult] = await Promise.all([
    readEntities(supabase, permissions),
    readScopedRows<PortalModalityContextRow>(supabase, "portal_contexts", "id,portal_entity_id,label", permissions, {
      sectionLabel: "contextos",
      contextScopeColumn: "id",
      includeCompetitionScope: false,
      orderColumn: "label"
    }),
    readRows<PortalModalityCatalogRow>(
      supabase,
      "portal_modality_catalog",
      "id,code,name,modality_family,default_event_model,default_result_model,status",
      {
        sectionLabel: "catálogo de modalidades",
        apply(query) {
          return query.eq("status", "active").order("name", { ascending: true });
        }
      }
    ),
    readScopedRows<PortalModalityRow>(
      supabase,
      "portal_modalities",
      "id,portal_entity_id,portal_context_id,catalog_modality_id,name,slug,local_code,display_order,status",
      permissions,
      {
        sectionLabel: "modalidades formais",
        includeCompetitionScope: false,
        orderColumn: "display_order"
      }
    ),
    readScopedRows<PortalCompetitionRow>(
      supabase,
      "portal_competitions",
      "id,portal_entity_id,portal_context_id,portal_modality_id,name,slug,modality,scope,format,status",
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
      "id,portal_entity_id,portal_context_id,portal_modality_id,portal_competition_id,name,code,event_model,result_model,ranking_model,status",
      permissions,
      {
        sectionLabel: "formatos multidesporto",
        orderColumn: "name"
      }
    )
  ]);

  if (entitiesResult.unavailableSection) {
    unavailableSections.add(entitiesResult.unavailableSection);
  }

  if (catalogResult.unavailableSection) {
    unavailableSections.add(catalogResult.unavailableSection);
  }

  [contextsResult, modalitiesResult, competitionsResult, formatsResult].forEach((result) => {
    result.unavailableSections.forEach((section) => unavailableSections.add(section));
  });

  const entities = sortByLabel(entitiesResult.rows, (entity) => entity.name);
  const contexts = sortByLabel(contextsResult.rows, (context) => context.label);
  const competitions = sortByLabel(competitionsResult.rows, (competition) => competition.name);
  const catalog = sortByLabel(catalogResult.rows, (catalogRow) => catalogRow.name);
  const creationScopes = makeCreationScopes(permissions, entities, contexts);
  const creationScopeModalitiesResult = await readCreationScopeModalities(supabase, creationScopes);
  const formalModalitiesById = new Map<string, PortalModalityRow>();

  mergeRows(formalModalitiesById, modalitiesResult.rows);
  mergeRows(formalModalitiesById, creationScopeModalitiesResult.rows);
  creationScopeModalitiesResult.unavailableSections.forEach((section) => unavailableSections.add(section));

  return {
    modalities: makeModalities(Array.from(formalModalitiesById.values()), catalog, competitions, formatsResult.rows, entities, contexts),
    catalog: makeCatalog(catalog),
    scopes: makeScopes(permissions, entities, contexts, competitions),
    creationScopes,
    unavailableSections: Array.from(unavailableSections).sort((first, second) => first.localeCompare(second, "pt"))
  };
}
