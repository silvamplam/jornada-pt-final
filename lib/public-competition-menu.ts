import { fetchSupabaseAdminTable } from "@/lib/supabase";

export type PublicCompetitionMenuItem = {
  label: string;
  slug: string;
  href: string;
};

type CompetitionMenuRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type SeasonMenuRow = {
  id: string;
  label: string | null;
  competition_id: string | null;
  is_current?: boolean | null;
};

type MatchdayMenuRow = {
  id: string;
  number: number | null;
  season_id: string | null;
};

const preferredCompetitionOrder = ["liga-portugal", "la-liga", "premier-league"];

const fallbackCompetitionMenu: PublicCompetitionMenuItem[] = [
  { label: "Liga Portugal", slug: "liga-portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
  { label: "La Liga", slug: "la-liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
  { label: "Premier League", slug: "premier-league", href: "/competicoes/premier-league/2026-27/jornadas/1" }
];

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function seasonLabelToUrlSegment(label: string | null | undefined) {
  return (cleanText(label) || "2026/27").replace(/\//g, "-");
}

async function readSeasonMenuRows() {
  const rowsWithCurrent = await fetchSupabaseAdminTable<SeasonMenuRow>(
    "seasons?select=id,label,competition_id,is_current&order=label.desc&limit=1000"
  ).catch(() => null);

  if (rowsWithCurrent) {
    return rowsWithCurrent;
  }

  return fetchSupabaseAdminTable<SeasonMenuRow>(
    "seasons?select=id,label,competition_id&order=label.desc&limit=1000"
  ).catch(() => []);
}

function sortSeasonsForMenu(first: SeasonMenuRow, second: SeasonMenuRow) {
  if (first.is_current && !second.is_current) return -1;
  if (!first.is_current && second.is_current) return 1;

  return (cleanText(second.label) || "").localeCompare(cleanText(first.label) || "");
}

function sortMatchdaysForMenu(first: MatchdayMenuRow, second: MatchdayMenuRow) {
  return (first.number ?? 9999) - (second.number ?? 9999);
}

function sortCompetitionMenu(first: PublicCompetitionMenuItem, second: PublicCompetitionMenuItem) {
  const firstIndex = preferredCompetitionOrder.indexOf(first.slug);
  const secondIndex = preferredCompetitionOrder.indexOf(second.slug);
  const firstRank = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
  const secondRank = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;

  if (firstRank !== secondRank) return firstRank - secondRank;

  return first.label.localeCompare(second.label, "pt");
}

export async function readPublicCompetitionMenu(): Promise<PublicCompetitionMenuItem[]> {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<CompetitionMenuRow>("competitions?select=id,name,slug&order=name.asc&limit=500").catch(() => []),
    readSeasonMenuRows(),
    fetchSupabaseAdminTable<MatchdayMenuRow>("matchdays?select=id,number,season_id&order=number.asc&limit=2000").catch(() => [])
  ]);

  const matchdaysBySeasonId = new Map<string, MatchdayMenuRow[]>();

  for (const matchday of matchdays) {
    if (!matchday.season_id) continue;
    const current = matchdaysBySeasonId.get(matchday.season_id) ?? [];
    current.push(matchday);
    matchdaysBySeasonId.set(matchday.season_id, current);
  }

  for (const seasonMatchdays of matchdaysBySeasonId.values()) {
    seasonMatchdays.sort(sortMatchdaysForMenu);
  }

  const seasonsByCompetitionId = new Map<string, SeasonMenuRow[]>();

  for (const season of seasons) {
    if (!season.competition_id) continue;
    const current = seasonsByCompetitionId.get(season.competition_id) ?? [];
    current.push(season);
    seasonsByCompetitionId.set(season.competition_id, current);
  }

  const menuItems = competitions.flatMap((competition) => {
    const slug = cleanText(competition.slug);
    if (!competition.id || !slug) return [];

    const competitionSeasons = (seasonsByCompetitionId.get(competition.id) ?? []).sort(sortSeasonsForMenu);
    const seasonWithMatchday = competitionSeasons.find((season) => (matchdaysBySeasonId.get(season.id) ?? []).length > 0);
    const matchday = seasonWithMatchday ? matchdaysBySeasonId.get(seasonWithMatchday.id)?.[0] ?? null : null;

    if (!seasonWithMatchday || !matchday) return [];

    return [
      {
        label: cleanText(competition.name) || slug,
        slug,
        href: `/competicoes/${slug}/${seasonLabelToUrlSegment(seasonWithMatchday.label)}/jornadas/${matchday.number ?? 1}`
      }
    ];
  });

  return menuItems.length > 0 ? menuItems.sort(sortCompetitionMenu) : fallbackCompetitionMenu;
}
