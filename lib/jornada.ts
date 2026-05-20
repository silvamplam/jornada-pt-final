import rawData from "@/data/jornada-data.json";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  badgeTone: string;
  logo?: string;
};

export type Player = {
  id: string;
  name: string;
  teamId: string;
};

export type Competition = {
  id: string;
  slug: string;
  name: string;
  country: string;
  logo?: string;
  accent: string;
  currentSeasonId: string;
  summary: string;
  seasons: Season[];
};

export type Season = {
  id: string;
  label: string;
  currentMatchdayId: string;
  matchdays: Matchday[];
};

export type Matchday = {
  id: string;
  number: number;
  label: string;
  dateLabel: string;
  status: "played" | "current" | "scheduled";
  headlineId: string;
  context: string;
  matchIds: string[];
  standingId: string;
};

export type MatchStatus = "finished" | "live" | "halftime" | "scheduled";

export type BroadcastChannel = {
  channel: string;
  platform: string;
  region: string;
  coverage: string;
};

export type Match = {
  id: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  minute?: number;
  kickoff: string;
  score: {
    home: number | null;
    away: number | null;
  };
  venue: string;
  broadcast?: BroadcastChannel;
  headlineId?: string;
  articleIds: string[];
  eventIds: string[];
  goalIds: string[];
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  category: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  matchId?: string;
  teamIds: string[];
  playerIds: string[];
  image: string;
  imageCredit?: string;
  sourceUrl?: string;
  publishedAtMoment: string;
  importance: number;
};

export type Headline = {
  id: string;
  title: string;
  dek: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  matchId?: string;
  articleId: string;
  image: string;
  imageCredit?: string;
  sourceUrl?: string;
  impact: string;
  timeframe: string;
};

export type Standing = {
  id: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  momentLabel: string;
  rows: StandingRow[];
};

export type StandingRow = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type Event = {
  id: string;
  matchId: string;
  minute: number;
  type: "goal" | "shot" | "card" | "context";
  title: string;
  teamId: string;
  playerId?: string;
};

export type Goal = {
  id: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  minute: number;
};

export type LiveUpdate = {
  id: string;
  competitionId: string;
  seasonId: string;
  matchdayId: string;
  matchId: string;
  minute: string;
  title: string;
  tone: "live" | "pause" | "scheduled";
};

export type DataSet = {
  generatedAt: string;
  teams: Team[];
  players: Player[];
  competitions: Competition[];
  matches: Match[];
  headlines: Headline[];
  articles: Article[];
  standings: Standing[];
  events: Event[];
  goals: Goal[];
  liveUpdates: LiveUpdate[];
};

export type ResolvedMatch = Match & {
  competition: Competition;
  matchday: Matchday;
  homeTeam: Team;
  awayTeam: Team;
  articles: Article[];
  events: Event[];
  goals: Goal[];
};

export type PlayerGoalTotal = {
  player: Player;
  team: Team;
  goals: number;
};

export type CompetitionContext = {
  competition: Competition;
  season: Season;
  matchday: Matchday;
  headline: Headline;
  headlineMatch?: ResolvedMatch;
  matches: ResolvedMatch[];
  articles: Article[];
  standing: Standing;
  liveUpdates: LiveUpdate[];
  goals: PlayerGoalTotal[];
  upcomingMatches: ResolvedMatch[];
};

export type HomeContext = {
  competitions: Competition[];
  featured: CompetitionContext;
  contexts: CompetitionContext[];
  mixedMatches: ResolvedMatch[];
  topArticles: Article[];
  liveUpdates: LiveUpdate[];
  goals: PlayerGoalTotal[];
};

export type BroadcastLogo = {
  label: string;
  modifier: "sport-tv" | "dazn" | "tv";
  src?: string;
  title: string;
};

const sportTvLogos: Record<string, string> = {
  "1": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Sport_TV1_%282023%29.svg",
  "2": "https://upload.wikimedia.org/wikipedia/commons/2/20/Sport_TV2_%282023%29.svg",
  "3": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Sport_TV3_%282023%29.svg",
  "6": "/assets/sport-tv6.png"
};

const daznLogos: Record<string, string> = {
  "1": "https://upload.wikimedia.org/wikipedia/commons/4/49/DAZN_1.svg"
};

const genericSportTvLogo = "https://upload.wikimedia.org/wikipedia/commons/3/38/Logo_SportTV.svg";

const data = rawData as DataSet;

export function getData(): DataSet {
  return data;
}

export function getCompetitions(): Competition[] {
  return data.competitions;
}

export function getCompetitionBySlug(slug: string): Competition | undefined {
  return data.competitions.find((competition) => competition.slug === slug);
}

export function getCurrentSeason(competition: Competition): Season {
  const season = competition.seasons.find((item) => item.id === competition.currentSeasonId);

  if (!season) {
    throw new Error(`Season ${competition.currentSeasonId} not found for ${competition.name}`);
  }

  return season;
}

export function getTeam(teamId: string): Team {
  const team = data.teams.find((item) => item.id === teamId);

  if (!team) {
    throw new Error(`Team ${teamId} not found`);
  }

  return team;
}

export function getPlayer(playerId: string): Player {
  const player = data.players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  return player;
}

export function getHeadline(headlineId: string): Headline {
  const headline = data.headlines.find((item) => item.id === headlineId);

  if (!headline) {
    throw new Error(`Headline ${headlineId} not found`);
  }

  return headline;
}

export function getArticle(articleId: string): Article {
  const article = data.articles.find((item) => item.id === articleId);

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  return article;
}

export function getStanding(standingId: string): Standing {
  const standing = data.standings.find((item) => item.id === standingId);

  if (!standing) {
    throw new Error(`Standing ${standingId} not found`);
  }

  return standing;
}

export function getMatchdayByNumber(season: Season, matchdayNumber?: number): Matchday {
  const selected = matchdayNumber
    ? season.matchdays.find((matchday) => matchday.number === matchdayNumber)
    : season.matchdays.find((matchday) => matchday.id === season.currentMatchdayId);

  if (!selected) {
    throw new Error(`Matchday ${matchdayNumber ?? season.currentMatchdayId} not found`);
  }

  return selected;
}

export function resolveMatch(match: Match): ResolvedMatch {
  const competition = data.competitions.find((item) => item.id === match.competitionId);

  if (!competition) {
    throw new Error(`Competition ${match.competitionId} not found`);
  }

  const season = competition.seasons.find((item) => item.id === match.seasonId);
  const matchday = season?.matchdays.find((item) => item.id === match.matchdayId);

  if (!season || !matchday) {
    throw new Error(`Matchday ${match.matchdayId} not found for match ${match.id}`);
  }

  return {
    ...match,
    competition,
    matchday,
    homeTeam: getTeam(match.homeTeamId),
    awayTeam: getTeam(match.awayTeamId),
    articles: match.articleIds.map(getArticle),
    events: match.eventIds.map((eventId) => {
      const event = data.events.find((item) => item.id === eventId);

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      return event;
    }),
    goals: match.goalIds.map((goalId) => {
      const goal = data.goals.find((item) => item.id === goalId);

      if (!goal) {
        throw new Error(`Goal ${goalId} not found`);
      }

      return goal;
    })
  };
}

export function getCompetitionContext(slug: string, matchdayNumber?: number): CompetitionContext | undefined {
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    return undefined;
  }

  const season = getCurrentSeason(competition);
  const matchday = getMatchdayByNumber(season, matchdayNumber);
  const matches = matchday.matchIds
    .map((matchId) => data.matches.find((match) => match.id === matchId))
    .filter((match): match is Match => Boolean(match))
    .map(resolveMatch);
  const headline = getHeadline(matchday.headlineId);
  const headlineMatch = headline.matchId ? matches.find((match) => match.id === headline.matchId) : undefined;
  const standing = getStanding(matchday.standingId);
  const matchdayArticles = data.articles
    .filter((article) => article.competitionId === competition.id && article.matchdayId === matchday.id)
    .sort((a, b) => b.importance - a.importance);
  const matchdayArticleIds = new Set(matchdayArticles.map((article) => article.id));
  const fallbackArticles = data.articles
    .filter((article) => article.competitionId === competition.id && !matchdayArticleIds.has(article.id))
    .sort((a, b) => b.importance - a.importance);
  const articles = [...matchdayArticles, ...fallbackArticles];
  const liveUpdates = data.liveUpdates.filter(
    (update) => update.competitionId === competition.id && update.matchdayId === matchday.id
  );
  const goals = getGoalTotals({ competitionId: competition.id, seasonId: season.id });
  const upcomingMatches = data.matches
    .filter((match) => match.competitionId === competition.id && match.status === "scheduled")
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, 6)
    .map(resolveMatch);

  return {
    competition,
    season,
    matchday,
    headline,
    headlineMatch,
    matches,
    articles,
    standing,
    liveUpdates,
    goals,
    upcomingMatches
  };
}

export function getHomeContext(): HomeContext {
  const contexts = data.competitions
    .map((competition) => getCompetitionContext(competition.slug))
    .filter((context): context is CompetitionContext => Boolean(context));
  const featured = contexts[0];
  const statusOrder: MatchStatus[] = ["live", "halftime", "finished", "scheduled"];
  const contextMatchPools = contexts.map((context) => {
    const seen = new Set(context.matches.map((match) => match.id));
    return [...context.matches, ...context.upcomingMatches.filter((match) => !seen.has(match.id))];
  });
  const mixedMatches = statusOrder
    .flatMap((status) => contextMatchPools.flatMap((matches) => matches.filter((match) => match.status === status).slice(0, 2)))
    .slice(0, 10);
  const topArticles = data.articles.sort((a, b) => b.importance - a.importance).slice(0, 7);
  const liveUpdates = data.liveUpdates.slice(0, 8);
  const goals = getGoalTotals().slice(0, 5);

  return {
    competitions: data.competitions,
    featured,
    contexts,
    mixedMatches,
    topArticles,
    liveUpdates,
    goals
  };
}

export function getGoalTotals(scope?: { competitionId?: string; seasonId?: string }): PlayerGoalTotal[] {
  const scopedGoals = data.goals.filter((goal) => {
    if (scope?.competitionId && goal.competitionId !== scope.competitionId) return false;
    if (scope?.seasonId && goal.seasonId !== scope.seasonId) return false;
    return true;
  });

  const totals = scopedGoals.reduce<Record<string, number>>((acc, goal) => {
    acc[goal.playerId] = (acc[goal.playerId] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([playerId, goals]) => {
      const player = getPlayer(playerId);

      return {
        player,
        team: getTeam(player.teamId),
        goals
      };
    })
    .sort((a, b) => b.goals - a.goals);
}

export function formatKickoff(kickoff: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(kickoff));
}

export function formatMatchDate(kickoff: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short"
  })
    .format(new Date(kickoff))
    .replace(".", "");
}

export function getBroadcastLogo(match: Match): BroadcastLogo {
  const platform = match.broadcast?.platform ?? match.broadcast?.channel ?? "TV";
  const channel = match.broadcast?.channel ?? "Canal a confirmar";
  const source = `${platform} ${channel}`.toLowerCase();

  if (source.includes("dazn")) {
    const number = channel.match(/dazn\s*(\d+)/i)?.[1];

    return {
      label: number ? `DAZN ${number}` : "DAZN",
      modifier: "dazn",
      src: number ? daznLogos[number] : undefined,
      title: channel
    };
  }

  if (source.includes("sport")) {
    const number = channel.match(/sport\s*tv\s*(\d+)/i)?.[1];

    return {
      label: number ? `Sport TV ${number}` : "Sport TV",
      modifier: "sport-tv",
      src: number ? sportTvLogos[number] ?? genericSportTvLogo : genericSportTvLogo,
      title: channel
    };
  }

  return { label: "TV", modifier: "tv", title: channel };
}

export function getScoreLabel(match: Match): string {
  if (match.score.home === null || match.score.away === null) {
    return "v";
  }

  return `${match.score.home}-${match.score.away}`;
}

export function getStatusLabel(match: Match): string {
  if (match.status === "live") return "Em direto";
  if (match.status === "halftime") return "Intervalo";
  if (match.status === "scheduled") return "Agendado";
  return "Finalizado";
}

export function getMatchMoment(match: Match): string {
  if (match.status === "live" && match.minute) return `${match.minute}'`;
  if (match.status === "halftime") return "45+1'";
  if (match.status === "scheduled") return formatKickoff(match.kickoff);
  return "Final";
}

export function getCompetitionStaticParams() {
  return data.competitions.map((competition) => ({
    slug: competition.slug
  }));
}

export function getMatchdayStaticParams() {
  return data.competitions.flatMap((competition) => {
    const season = getCurrentSeason(competition);

    return season.matchdays.map((matchday) => ({
      slug: competition.slug,
      matchday: String(matchday.number).padStart(2, "0")
    }));
  });
}

function statusWeight(status: MatchStatus): number {
  if (status === "live") return 0;
  if (status === "halftime") return 1;
  if (status === "finished") return 2;
  return 3;
}
