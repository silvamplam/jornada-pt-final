import { fetchSupabaseAdminTable, type SupabaseBroadcastChannel, type SupabaseCompetition, type SupabaseMatch, type SupabaseMatchday, type SupabaseMatchdayEditorial, type SupabaseMatchdayHighlight, type SupabaseMatchdayRoundupItem, type SupabaseSeason, type SupabaseSeasonTeam, type SupabaseTeam } from "@/lib/supabase";

export type PublicSeasonParticipant = SupabaseSeasonTeam & {
  team: SupabaseTeam | null;
};

export type PublicSeasonMatch = SupabaseMatch & {
  matchday: SupabaseMatchday | null;
  homeTeam: SupabaseTeam | null;
  awayTeam: SupabaseTeam | null;
  broadcastChannel: SupabaseBroadcastChannel | null;
};

export type PublicMatchdayContext = {
  competition: SupabaseCompetition;
  season: SupabaseSeason;
  seasons: SupabaseSeason[];
  matchday: SupabaseMatchday;
  matchdays: SupabaseMatchday[];
  participants: PublicSeasonParticipant[];
  matchesForSeason: PublicSeasonMatch[];
  matchesForMatchday: PublicSeasonMatch[];
  editorial: SupabaseMatchdayEditorial | null;
  highlights: SupabaseMatchdayHighlight[];
  roundupItems: SupabaseMatchdayRoundupItem[];
};

export type PublicMatchdayDiagnostic = {
  params: {
    competitionSlug: string;
    seasonLabel: string;
    normalizedSeasonLabel: string;
    matchdayNumber: number;
  };
  step: string;
  message: string;
  competitionsFound?: number;
  availableCompetitionSlugs?: string[];
  seasonsFound?: number;
  availableSeasonLabels?: string[];
  availableSeasonUrlLabels?: string[];
  matchdaysFound?: number;
  availableMatchdayNumbers?: number[];
  participantsFound?: number;
  matchesFound?: number;
  error?: string;
};

export type PublicMatchdayDiagnosticResult = {
  context: PublicMatchdayContext | null;
  diagnostic: PublicMatchdayDiagnostic;
};

export type PublicSeasonMatchdaySummary = SupabaseMatchday & {
  matchCount: number;
  finishedMatchCount: number;
};

export type PublicSeasonContext = {
  competition: SupabaseCompetition;
  season: SupabaseSeason;
  matchdays: PublicSeasonMatchdaySummary[];
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

async function readBroadcastChannels(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  return fetchSupabaseAdminTable<SupabaseBroadcastChannel>(
    `broadcast_channels?select=id,name,platform,country,logo_url&id=in.(${idList(uniqueIds)})&limit=500`
  );
}

async function readPublishedMatchdayEditorial(matchdayId: string) {
  try {
    const rows = await fetchSupabaseAdminTable<SupabaseMatchdayEditorial>(
      `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,below_headline_mode,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_text_color,complementary_status,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&status=eq.published&limit=1`
    );

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function readPublishedMatchdayHighlights(matchdayId: string) {
  try {
    return fetchSupabaseAdminTable<SupabaseMatchdayHighlight>(
      `matchday_highlights?select=id,matchday_id,label,title,image_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&status=eq.published&order=sort_order.asc&limit=3`
    );
  } catch {
    return [];
  }
}

async function readPublishedMatchdayRoundupItems(matchdayId: string) {
  try {
    return fetchSupabaseAdminTable<SupabaseMatchdayRoundupItem>(
      `matchday_roundup_items?select=id,matchday_id,label,title,subtitle,image_url,video_url,duration,type,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&status=eq.published&order=sort_order.asc&limit=3`
    );
  } catch {
    return [];
  }
}

export async function getPublicSeasonContext({
  competitionSlug,
  seasonLabel
}: {
  competitionSlug: string;
  seasonLabel: string;
}): Promise<PublicSeasonContext | null> {
  const normalizedSeasonLabel = normalizeSeasonSegment(seasonLabel);
  const competitions = await fetchSupabaseAdminTable<SupabaseCompetition>(
    "competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&order=name.asc&limit=500"
  );
  const competition = competitions.find((item) => item.slug === competitionSlug && item.is_active !== false) ?? null;

  if (!competition) {
    return null;
  }

  const seasons = await fetchSupabaseAdminTable<SupabaseSeason>(
    `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&competition_id=eq.${encodeURIComponent(competition.id)}&order=label.desc&limit=100`
  );
  const season =
    seasons.find((item) => normalizeSeasonSegment(seasonLabelToUrlSegment(item.label)) === normalizedSeasonLabel) ?? null;

  if (!season) {
    return null;
  }

  const [matchdays, matches] = await Promise.all([
    fetchSupabaseAdminTable<SupabaseMatchday>(
      `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&season_id=eq.${encodeURIComponent(season.id)}&order=number.asc&limit=100`
    ),
    fetchSupabaseAdminTable<SupabaseMatch>(
      `matches?select=id,season_id,matchday_id,status&season_id=eq.${encodeURIComponent(season.id)}&limit=1000`
    )
  ]);
  const matchdaysWithCounts = matchdays.map((matchday) => {
    const matchdayMatches = matches.filter((match) => match.matchday_id === matchday.id);

    return {
      ...matchday,
      matchCount: matchdayMatches.length,
      finishedMatchCount: matchdayMatches.filter((match) => match.status === "finished").length
    };
  });

  return {
    competition,
    season,
    matchdays: matchdaysWithCounts
  };
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
  return (await getPublicMatchdayDiagnostic({ competitionSlug, seasonLabel, matchdayNumber })).context;
}

export async function getPublicMatchdayDiagnostic({
  competitionSlug,
  seasonLabel,
  matchdayNumber
}: {
  competitionSlug: string;
  seasonLabel: string;
  matchdayNumber: number;
}): Promise<PublicMatchdayDiagnosticResult> {
  const normalizedSeasonLabel = normalizeSeasonSegment(seasonLabel);
  const baseDiagnostic: PublicMatchdayDiagnostic = {
    params: {
      competitionSlug,
      seasonLabel,
      normalizedSeasonLabel,
      matchdayNumber
    },
    step: "start",
    message: "Diagnostico iniciado."
  };

  if (!Number.isInteger(matchdayNumber) || matchdayNumber < 1) {
    return {
      context: null,
      diagnostic: {
        ...baseDiagnostic,
        step: "invalid-matchday-number",
        message: "O parametro matchdayNumber nao e um numero inteiro valido."
      }
    };
  }

  try {
    const competitions = await fetchSupabaseAdminTable<SupabaseCompetition>(
      "competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&order=name.asc&limit=500"
    );
    const competition = competitions.find((item) => item.slug === competitionSlug) ?? null;

    if (!competition) {
      return {
        context: null,
        diagnostic: {
          ...baseDiagnostic,
          step: "competition-not-found",
          message: "Competicao nao encontrada pelo slug recebido.",
          competitionsFound: competitions.length,
          availableCompetitionSlugs: competitions.map((item) => item.slug).filter(Boolean).slice(0, 40)
        }
      };
    }

    if (competition.is_active === false) {
      return {
        context: null,
        diagnostic: {
          ...baseDiagnostic,
          step: "competition-inactive",
          message: "A competicao existe, mas esta marcada como inativa.",
          competitionsFound: competitions.length,
          availableCompetitionSlugs: competitions.map((item) => item.slug).filter(Boolean).slice(0, 40)
        }
      };
    }

    const seasons = await fetchSupabaseAdminTable<SupabaseSeason>(
      `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&competition_id=eq.${encodeURIComponent(competition.id)}&order=label.desc&limit=100`
    );
    const season =
      seasons.find((item) => normalizeSeasonSegment(seasonLabelToUrlSegment(item.label)) === normalizedSeasonLabel) ?? null;

    if (!season) {
      return {
        context: null,
        diagnostic: {
          ...baseDiagnostic,
          step: "season-not-found",
          message: "Epoca nao encontrada para esta competicao.",
          competitionsFound: competitions.length,
          seasonsFound: seasons.length,
          availableSeasonLabels: seasons.map((item) => item.label),
          availableSeasonUrlLabels: seasons.map((item) => seasonLabelToUrlSegment(item.label))
        }
      };
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
      return {
        context: null,
        diagnostic: {
          ...baseDiagnostic,
          step: "matchday-not-found",
          message: "Jornada nao encontrada para esta epoca.",
          competitionsFound: competitions.length,
          seasonsFound: seasons.length,
          matchdaysFound: matchdays.length,
          availableMatchdayNumbers: matchdays.map((item) => item.number)
        }
      };
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
    const [broadcastChannels, editorial, highlights, roundupItems] = await Promise.all([
      readBroadcastChannels(matches.map((match) => match.broadcast_channel_id ?? "")),
      readPublishedMatchdayEditorial(matchday.id),
      readPublishedMatchdayHighlights(matchday.id),
      readPublishedMatchdayRoundupItems(matchday.id)
    ]);
    const teamsById = byId(teams);
    const broadcastChannelsById = byId(broadcastChannels);
    const matchdaysById = byId(matchdays);
    const matchesForSeason = matches.map((match) => ({
      ...match,
      matchday: match.matchday_id ? matchdaysById.get(match.matchday_id) ?? null : null,
      homeTeam: teamsById.get(match.home_team_id) ?? null,
      awayTeam: teamsById.get(match.away_team_id) ?? null,
      broadcastChannel: match.broadcast_channel_id ? broadcastChannelsById.get(match.broadcast_channel_id) ?? null : null
    }));

    return {
      context: {
        competition,
        season,
        seasons,
        matchday,
        matchdays,
        participants: manualParticipants.map((participant) => ({
          ...participant,
          team: teamsById.get(participant.team_id) ?? null
        })),
        matchesForSeason,
        matchesForMatchday: matchesForSeason.filter((match) => match.matchday_id === matchday.id),
        editorial,
        highlights,
        roundupItems
      },
      diagnostic: {
        ...baseDiagnostic,
        step: "ok",
        message: "Dados carregados com sucesso.",
        competitionsFound: competitions.length,
        seasonsFound: seasons.length,
        matchdaysFound: matchdays.length,
        participantsFound: manualParticipants.length,
        matchesFound: matches.length
      }
    };
  } catch (error) {
    return {
      context: null,
      diagnostic: {
        ...baseDiagnostic,
        step: "load-error",
        message: "Erro ao carregar dados da Supabase.",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    };
  }
}
