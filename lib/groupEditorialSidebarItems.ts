export type EditorialSidebarContext = {
  competitionId: string | null;
  seasonId: string | null;
  matchdayId: string | null;
  competitionLabel: string;
  seasonLabel: string;
  matchdayLabel: string;
  scopeLabel?: string | null;
};

export type EditorialSidebarItem<T> = {
  item: T;
  context: EditorialSidebarContext;
  isSelected?: boolean;
};

export type EditorialSidebarMatchdayGroup<T> = {
  key: string;
  label: string;
  items: EditorialSidebarItem<T>[];
};

export type EditorialSidebarSeasonGroup<T> = {
  key: string;
  label: string;
  matchdayGroups: EditorialSidebarMatchdayGroup<T>[];
};

export type EditorialSidebarCompetitionGroup<T> = {
  key: string;
  label: string;
  seasonGroups: EditorialSidebarSeasonGroup<T>[];
};

function findOrCreateCompetitionGroup<T>(groups: EditorialSidebarCompetitionGroup<T>[], item: EditorialSidebarItem<T>) {
  const key = item.context.competitionId ?? "contexto-incompleto";
  let group = groups.find((entry) => entry.key === key);

  if (!group) {
    group = { key, label: item.context.competitionLabel, seasonGroups: [] };
    groups.push(group);
  }

  return group;
}

function findOrCreateSeasonGroup<T>(group: EditorialSidebarCompetitionGroup<T>, item: EditorialSidebarItem<T>) {
  const key = item.context.seasonId ?? "sem-epoca";
  const label = item.context.seasonId ? item.context.seasonLabel : "Sem epoca associada";
  let seasonGroup = group.seasonGroups.find((entry) => entry.key === key);

  if (!seasonGroup) {
    seasonGroup = { key, label, matchdayGroups: [] };
    group.seasonGroups.push(seasonGroup);
  }

  return seasonGroup;
}

function findOrCreateMatchdayGroup<T>(group: EditorialSidebarSeasonGroup<T>, item: EditorialSidebarItem<T>) {
  const key = item.context.matchdayId ?? "sem-jornada";
  const label = item.context.matchdayId ? item.context.matchdayLabel : "Sem jornada associada";
  let matchdayGroup = group.matchdayGroups.find((entry) => entry.key === key);

  if (!matchdayGroup) {
    matchdayGroup = { key, label, items: [] };
    group.matchdayGroups.push(matchdayGroup);
  }

  return matchdayGroup;
}

export function groupEditorialSidebarItems<T>(items: EditorialSidebarItem<T>[]) {
  const generalItems: EditorialSidebarItem<T>[] = [];
  const competitionGroups: EditorialSidebarCompetitionGroup<T>[] = [];

  items.forEach((item) => {
    const isGeneral = item.context.scopeLabel === "general" || !item.context.competitionId;

    if (isGeneral) {
      generalItems.push(item);
      return;
    }

    const competitionGroup = findOrCreateCompetitionGroup(competitionGroups, item);
    const seasonGroup = findOrCreateSeasonGroup(competitionGroup, item);
    const matchdayGroup = findOrCreateMatchdayGroup(seasonGroup, item);
    matchdayGroup.items.push(item);
  });

  return { generalItems, competitionGroups };
}

export function countEditorialSeasonItems<T>(group: EditorialSidebarSeasonGroup<T>) {
  return group.matchdayGroups.reduce((total, matchdayGroup) => total + matchdayGroup.items.length, 0);
}

export function countEditorialCompetitionItems<T>(group: EditorialSidebarCompetitionGroup<T>) {
  return group.seasonGroups.reduce((total, seasonGroup) => total + countEditorialSeasonItems(seasonGroup), 0);
}

export function hasSelectedEditorialItem<T>(items: EditorialSidebarItem<T>[]) {
  return items.some((item) => Boolean(item.isSelected));
}

export function editorialMatchdayGroupHasSelected<T>(group: EditorialSidebarMatchdayGroup<T>) {
  return hasSelectedEditorialItem(group.items);
}

export function editorialSeasonGroupHasSelected<T>(group: EditorialSidebarSeasonGroup<T>) {
  return group.matchdayGroups.some(editorialMatchdayGroupHasSelected);
}

export function editorialCompetitionGroupHasSelected<T>(group: EditorialSidebarCompetitionGroup<T>) {
  return group.seasonGroups.some(editorialSeasonGroupHasSelected);
}
