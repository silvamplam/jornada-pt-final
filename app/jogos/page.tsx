import Link from "next/link";
import { publicEditorialStyles } from "@/components/public/publicEditorialStyles";
import { readPublicCompetitionMenu } from "@/lib/public-competition-menu";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  kickoff_at: string | null;
  status: string | null;
  minute: number | string | null;
  home_score: number | null;
  away_score: number | null;
  broadcast_channel_id: string | null;
};

type TeamRow = {
  id: string;
  name: string | null;
  short_name: string | null;
  logo_url: string | null;
};

type CompetitionRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type SeasonRow = {
  id: string;
  label: string | null;
};

type MatchdayRow = {
  id: string;
  number: number | null;
};

type BroadcastLinkRow = {
  match_id: string | null;
  broadcast_channel_id: string | null;
};

type BroadcastChannelRow = {
  id: string;
  name: string | null;
  logo_url: string | null;
};

type PublicGame = {
  id: string;
  competition: CompetitionRow | null;
  season: SeasonRow | null;
  matchday: MatchdayRow | null;
  homeTeam: TeamRow | null;
  awayTeam: TeamRow | null;
  kickoff_at: string | null;
  status: string | null;
  minute: number | string | null;
  home_score: number | null;
  away_score: number | null;
  broadcastChannel: BroadcastChannelRow | null;
};

const gamesPageStyles = `
  .public-games-page {
    max-width: 1180px;
    margin: 26px auto 72px;
    padding: 0 0 48px;
  }

  .public-games-heading {
    display: grid;
    gap: 8px;
    max-width: 760px;
    margin: 0 0 22px;
  }

  .public-games-kicker {
    color: #c40012;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .public-games-heading h1 {
    margin: 0;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(30px, 4vw, 44px);
    font-weight: 850;
    letter-spacing: 0;
    line-height: 1;
  }

  .public-games-heading p {
    margin: 0;
    color: #526174;
    font-size: 15px;
    line-height: 1.45;
  }

  .public-games-section {
    margin-top: 16px;
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
    overflow: hidden;
  }

  .public-games-section header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .public-games-section h2 {
    margin: 0;
    color: #10151b;
    font-size: 14px;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .public-games-count {
    color: #607086;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-list {
    display: grid;
  }

  .public-game-card {
    display: grid;
    grid-template-columns: minmax(140px, 190px) minmax(0, 1fr) minmax(170px, 230px);
    gap: 18px;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #e6ebf1;
  }

  .public-game-card:last-child {
    border-bottom: 0;
  }

  .public-game-context {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .public-game-competition {
    color: #10151b;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-game-matchday {
    color: #607086;
    font-size: 12px;
    font-weight: 800;
  }

  .public-game-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .public-game-team {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    min-width: 0;
    color: #10151b;
    font-size: 14px;
    font-weight: 900;
  }

  .public-game-team:last-child {
    grid-template-columns: minmax(0, 1fr) auto;
    text-align: right;
  }

  .public-game-team span:last-child,
  .public-game-team span:first-child {
    min-width: 0;
  }

  .public-game-team-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .public-game-team-badge {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #dfe5ec;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-size: 10px;
    font-weight: 950;
    overflow: hidden;
  }

  .public-game-team-badge img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .public-game-score {
    min-width: 64px;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24px;
    font-weight: 950;
    text-align: center;
    line-height: 1;
  }

  .public-game-vs {
    min-width: 64px;
    color: #9aa6b4;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-align: center;
    text-transform: uppercase;
  }

  .public-game-info {
    display: grid;
    gap: 5px;
    justify-items: end;
    min-width: 0;
    color: #526174;
    font-size: 12px;
    font-weight: 800;
    text-align: right;
  }

  .public-game-status {
    color: #10151b;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
  }

  .public-game-status-live {
    color: #c40012;
  }

  .public-game-tv {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    max-width: 100%;
    min-width: 0;
    color: #607086;
  }

  .public-game-tv img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  .public-game-empty {
    padding: 18px 16px;
    color: #607086;
    font-size: 13px;
    font-weight: 800;
  }

  @media (max-width: 820px) {
    .public-games-page {
      margin-top: 18px;
    }

    .public-game-card {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .public-game-info {
      justify-items: start;
      text-align: left;
    }
  }
`;

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function inFilter(values: string[]) {
  return `in.(${values.map((value) => encodeURIComponent(value)).join(",")})`;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function readRowsById<T extends { id: string }>(table: string, select: string, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, T>();
  }

  const rows = await fetchSupabaseAdminTable<T>(
    `${table}?select=${select}&id=${inFilter(ids)}`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.id, row]));
}

function statusKind(status?: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  return "scheduled";
}

function statusLabel(match: PublicGame) {
  const kind = statusKind(match.status);
  if (kind === "finished") return "Finalizado";
  if (kind === "halftime") return "Intervalo";
  if (kind === "live") return match.minute ? `Em direto · ${match.minute}'` : "Em direto";
  if (match.status?.trim().toLowerCase() === "postponed") return "Adiado";
  if (match.status?.trim().toLowerCase() === "cancelled") return "Cancelado";
  return "Agendado";
}

function formatKickoff(value?: string | null) {
  if (!value) return "Data/hora por definir";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data/hora por definir";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function teamInitials(team?: TeamRow | null) {
  const source = cleanText(team?.short_name) || cleanText(team?.name) || "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "FC";
}

function teamName(team?: TeamRow | null) {
  return cleanText(team?.name) || cleanText(team?.short_name) || "Equipa";
}

async function readBroadcastChannelsByMatchId(matchIds: string[], matches: MatchRow[] = []) {
  const channelsByMatchId = new Map<string, BroadcastChannelRow>();
  if (matchIds.length === 0) return channelsByMatchId;

  const directChannelIdsByMatchId = new Map(
    matches
      .filter((match) => Boolean(match.broadcast_channel_id))
      .map((match) => [match.id, match.broadcast_channel_id as string])
  );
  const directChannelsById = await readRowsById<BroadcastChannelRow>(
    "broadcast_channels",
    "id,name,logo_url",
    uniqueValues(Array.from(directChannelIdsByMatchId.values()))
  );

  for (const [matchId, channelId] of directChannelIdsByMatchId) {
    const channel = directChannelsById.get(channelId);
    if (channel) {
      channelsByMatchId.set(matchId, channel);
    }
  }

  const matchFilter = inFilter(matchIds);
  const relationQueries = [
    `match_broadcast_channels?select=match_id,broadcast_channel_id&match_id=${matchFilter}`,
    `match_broadcasts?select=match_id,broadcast_channel_id&match_id=${matchFilter}`,
    `matches_broadcast_channels?select=match_id,broadcast_channel_id&match_id=${matchFilter}`
  ];
  let links: BroadcastLinkRow[] = [];

  for (const query of relationQueries) {
    links = await fetchSupabaseAdminTable<BroadcastLinkRow>(query).catch(() => []);
    if (links.length > 0) break;
  }

  if (links.length === 0) return channelsByMatchId;

  const channelsById = await readRowsById<BroadcastChannelRow>(
    "broadcast_channels",
    "id,name,logo_url",
    uniqueValues(links.map((link) => link.broadcast_channel_id))
  );

  for (const link of links) {
    if (!link.match_id || !link.broadcast_channel_id || channelsByMatchId.has(link.match_id)) continue;
    const channel = channelsById.get(link.broadcast_channel_id);
    if (channel) {
      channelsByMatchId.set(link.match_id, channel);
    }
  }

  return channelsByMatchId;
}

async function readPublicGames(): Promise<PublicGame[]> {
  const matches = await fetchSupabaseAdminTable<MatchRow>(
    "matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,kickoff_at,status,minute,home_score,away_score,broadcast_channel_id&order=kickoff_at.asc&limit=500"
  ).catch(() => []);
  const matchIds = matches.map((match) => match.id);
  const [teamsById, competitionsById, seasonsById, matchdaysById, broadcastChannelsByMatchId] = await Promise.all([
    readRowsById<TeamRow>(
      "teams",
      "id,name,short_name,logo_url",
      uniqueValues(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))
    ),
    readRowsById<CompetitionRow>(
      "competitions",
      "id,name,slug",
      uniqueValues(matches.map((match) => match.competition_id))
    ),
    readRowsById<SeasonRow>(
      "seasons",
      "id,label",
      uniqueValues(matches.map((match) => match.season_id))
    ),
    readRowsById<MatchdayRow>(
      "matchdays",
      "id,number",
      uniqueValues(matches.map((match) => match.matchday_id))
    ),
    readBroadcastChannelsByMatchId(matchIds, matches)
  ]);

  return matches.map((match) => ({
    id: match.id,
    competition: match.competition_id ? competitionsById.get(match.competition_id) ?? null : null,
    season: match.season_id ? seasonsById.get(match.season_id) ?? null : null,
    matchday: match.matchday_id ? matchdaysById.get(match.matchday_id) ?? null : null,
    homeTeam: match.home_team_id ? teamsById.get(match.home_team_id) ?? null : null,
    awayTeam: match.away_team_id ? teamsById.get(match.away_team_id) ?? null : null,
    kickoff_at: match.kickoff_at,
    status: match.status,
    minute: match.minute,
    home_score: match.home_score,
    away_score: match.away_score,
    broadcastChannel: broadcastChannelsByMatchId.get(match.id) ?? null
  }));
}

function sortGames(first: PublicGame, second: PublicGame) {
  const firstTime = first.kickoff_at ? new Date(first.kickoff_at).getTime() : Number.MAX_SAFE_INTEGER;
  const secondTime = second.kickoff_at ? new Date(second.kickoff_at).getTime() : Number.MAX_SAFE_INTEGER;

  if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) return 0;
  if (Number.isNaN(firstTime)) return 1;
  if (Number.isNaN(secondTime)) return -1;

  return firstTime - secondTime;
}

function TeamBlock({ team, side }: { team: TeamRow | null; side: "home" | "away" }) {
  const badge = (
    <span className="public-game-team-badge">
      {team?.logo_url ? <img alt="" src={team.logo_url} /> : teamInitials(team)}
    </span>
  );
  const name = <span className="public-game-team-name">{teamName(team)}</span>;

  return (
    <span className="public-game-team">
      {side === "home" ? (
        <>
          {badge}
          {name}
        </>
      ) : (
        <>
          {name}
          {badge}
        </>
      )}
    </span>
  );
}

function GameScore({ game }: { game: PublicGame }) {
  const kind = statusKind(game.status);
  const hasScore = game.home_score !== null && game.home_score !== undefined && game.away_score !== null && game.away_score !== undefined;

  if (hasScore && (kind === "finished" || kind === "live" || kind === "halftime")) {
    return <strong className="public-game-score">{game.home_score} - {game.away_score}</strong>;
  }

  return <span className="public-game-vs">vs</span>;
}

function GameCard({ game }: { game: PublicGame }) {
  const kind = statusKind(game.status);
  const channelName = cleanText(game.broadcastChannel?.name);
  const matchdayLabel = game.matchday?.number ? `J${String(game.matchday.number).padStart(2, "0")}` : null;
  const seasonLabel = cleanText(game.season?.label);

  return (
    <article className="public-game-card">
      <div className="public-game-context">
        <span className="public-game-competition">{cleanText(game.competition?.name) || "Competição"}</span>
        <span className="public-game-matchday">
          {[seasonLabel, matchdayLabel].filter(Boolean).join(" · ") || "Jornada por definir"}
        </span>
      </div>
      <div className="public-game-main">
        <TeamBlock team={game.homeTeam} side="home" />
        <GameScore game={game} />
        <TeamBlock team={game.awayTeam} side="away" />
      </div>
      <div className="public-game-info">
        <span className={`public-game-status${kind === "live" || kind === "halftime" ? " public-game-status-live" : ""}`}>
          {statusLabel(game)}
        </span>
        {kind === "scheduled" ? <time dateTime={game.kickoff_at ?? undefined}>{formatKickoff(game.kickoff_at)}</time> : null}
        <span className="public-game-tv">
          {game.broadcastChannel?.logo_url ? <img alt="" src={game.broadcastChannel.logo_url} /> : null}
          <span>{channelName || "TV por confirmar"}</span>
        </span>
      </div>
    </article>
  );
}

function GamesSection({ title, games }: { title: string; games: PublicGame[] }) {
  return (
    <section className="public-games-section" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <span className="public-games-count">{games.length} {games.length === 1 ? "jogo" : "jogos"}</span>
      </header>
      {games.length > 0 ? (
        <div className="public-games-list">
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      ) : (
        <p className="public-game-empty">Não há jogos nesta secção.</p>
      )}
    </section>
  );
}

export default async function GamesPage() {
  const [competitionLinks, games] = await Promise.all([readPublicCompetitionMenu(), readPublicGames()]);
  const liveGames = games.filter((game) => {
    const kind = statusKind(game.status);
    return kind === "live" || kind === "halftime";
  }).sort(sortGames);
  const finishedGames = games.filter((game) => statusKind(game.status) === "finished").sort(sortGames);
  const scheduledGames = games.filter((game) => statusKind(game.status) === "scheduled").sort(sortGames);

  return (
    <main className="public-matchday-shell">
      <style>{publicEditorialStyles}</style>
      <style>{gamesPageStyles}</style>
      <div className="public-top-stack">
        <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
          <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
            Jornada<span>.pt</span>
          </Link>
          <nav className="public-site-menu" aria-label="Competições principais">
            {competitionLinks.map((link) => (
              <Link href={link.href} key={link.slug}>
                {link.label}
              </Link>
            ))}
            <Link aria-current="page" href="/jogos">Jogos</Link>
          </nav>
          <div className="public-site-actions" aria-label="Ações">
            <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
            <Link href="/admin/login">Entrar</Link>
          </div>
        </header>
      </div>

      <div className="public-games-page">
        <section className="public-games-heading" aria-label="Jogos">
          <span className="public-games-kicker">Agenda</span>
          <h1>Jogos</h1>
          <p>Todos os jogos acompanhados pelo Jornada.pt, organizados por estado e com informação televisiva quando disponível.</p>
        </section>

        <GamesSection title="Jogos em direto" games={liveGames} />
        <GamesSection title="Jogos finalizados" games={finishedGames} />
        <GamesSection title="Jogos agendados" games={scheduledGames} />
      </div>
    </main>
  );
}
