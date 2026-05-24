import { fetchSupabaseAdminTable, type SupabaseCompetition, type SupabaseMatch, type SupabaseMatchday, type SupabaseSeason, type SupabaseSeasonTeam, type SupabaseTeam } from "@/lib/supabase";

export type PublicSeasonParticipant = SupabaseSeasonTeam & {
  team: SupabaseTeam | null;
};

export type PublicSeasonMatch = SupabaseMatch & {
  matchday: SupabaseMatchday | null;
  homeTeam: SupabaseTeam | null;
  awayTeam: SupabaseTeam | null;
};

export type PublicMatchdayContext = {
  competition: SupabaseCompetition;
  season: SupabaseSeason;
  matchday: SupabaseMatchday;
  matchdays: SupabaseMatchday[];
  participants: PublicSeasonParticipant[];
  matchesForSeason: PublicSeasonMatch[];
  matchesForMatchday: PublicSeasonMatch[];
};

export function seasonLabelToUrlSegment(label: string) {
  return label.trim().replace(/\//g, "-");
}

function normalizeSeasonSegment(value: string) {
  return value.trim().toLowerCase().replace(/\//g, "-");
}

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function idList(ids: string[]) {
  return ids.map((id) => encodeURIComponent(id)).join(",");
}

async function readTeams(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  return fetchSupabaseAdminTable<SupabaseTeam>(
    `teams?select=id,name,short_name,slug,country,logo_url,primary_color&id=in.(${idList(uniqueIds)})&limit=1000`
  );
}

export async function getPublicMatchdayContext({
  competitionSlug,
  seasonLabel,
  matchdayNumber
}: {
  competitionSlug: string;
  seasonLabel: string;
  matchdayNumber: number;
}): Promise<PublicMatchdayContext | null> {
  if (!Number.isInteger(matchdayNumber) || matchdayNumber < 1) {
    return null;
  }

  const competitions = await fetchSupabaseAdminTable<SupabaseCompetition>(
    `competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&slug=eq.${encodeURIComponent(competitionSlug)}&limit=1`
  );
  const competition = competitions[0];

  if (!competition || competition.is_active === false) {
    return null;
  }

  const seasons = await fetchSupabaseAdminTable<SupabaseSeason>(
    `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&competition_id=eq.${encodeURIComponent(competition.id)}&order=label.desc&limit=100`
  );
  const requestedSeason = normalizeSeasonSegment(seasonLabel);
  const season =
    seasons.find((item) => normalizeSeasonSegment(seasonLabelToUrlSegment(item.label)) === requestedSeason) ?? null;

  if (!season) {
    return null;
  }

  const [matchdays, participants, matches] = await Promise.all([
    fetchSupabaseAdminTable<SupabaseMatchday>(
      `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&season_id=eq.${encodeURIComponent(season.id)}&order=number.asc&limit=100`
    ),
    fetchSupabaseAdminTable<SupabaseSeasonTeam>(
      `season_teams?select=id,season_id,team_id,display_order,status,data_source,sync_status,manual_override&season_id=eq.${encodeURIComponent(season.id)}&order=display_order.asc&limit=1000`
    ),
    fetchSupabaseAdminTable<SupabaseMatch>(
      `matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id&season_id=eq.${encodeURIComponent(season.id)}&order=kickoff_at.asc&limit=1000`
    )
  ]);
  const matchday = matchdays.find((item) => item.number === matchdayNumber) ?? null;

  if (!matchday) {
    return null;
  }

  const manualParticipants = participants.filter(
    (participant) =>
      participant.data_source === "manual" &&
      participant.sync_status === "manual" &&
      participant.manual_override === true
  );
  const teams = await readTeams([
    ...manualParticipants.map((participant) => participant.team_id),
    ...matches.flatMap((match) => [match.home_team_id, match.away_team_id])
  ]);
  const teamsById = byId(teams);
  const matchdaysById = byId(matchdays);
  const matchesForSeason = matches.map((match) => ({
    ...match,
    matchday: match.matchday_id ? matchdaysById.get(match.matchday_id) ?? null : null,
    homeTeam: teamsById.get(match.home_team_id) ?? null,
    awayTeam: teamsById.get(match.away_team_id) ?? null
  }));

  return {
    competition,
    season,
    matchday,
    matchdays,
    participants: manualParticipants.map((participant) => ({
      ...participant,
      team: teamsById.get(participant.team_id) ?? null
    })),
    matchesForSeason,
    matchesForMatchday: matchesForSeason.filter((match) => match.matchday_id === matchday.id)
  };
}
