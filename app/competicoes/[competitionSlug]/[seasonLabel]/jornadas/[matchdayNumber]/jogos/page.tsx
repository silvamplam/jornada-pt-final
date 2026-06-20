import { getPublicCompetitionMenu } from "@/lib/public-competition-menu";
import {
  getPublicMatchdayDiagnostic,
  seasonLabelToUrlSegment,
  type PublicMatchdayDiagnostic,
  type PublicSeasonMatch
} from "@/lib/public-matchday";
import PublicTeamBadge from "@/components/public/PublicTeamBadge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PublicMatchdayGamesPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
  }>;
};

const gamesPageStyles = `
  body {
    margin: 0;
    overflow-x: hidden;
    background: #ffffff;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-games-shell {
    min-height: 100vh;
    padding: 0 24px 32px;
  }

  .public-top-stack {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -24px;
    padding: 0 24px;
    border-bottom: 1px solid #d8dee6;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.08);
  }

  .public-site-topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    min-height: 56px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-site-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #2f343b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 29px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .public-site-brand span {
    color: #6b7480;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0;
  }

  .public-site-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-site-menu a,
  .public-site-actions a {
    color: #10151b;
    text-decoration: none;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
  }

  .public-site-search {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 170px;
    padding: 6px 11px;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #ffffff;
    color: #66717f;
    font-size: 12px;
    font-weight: 900;
  }

  .public-site-search::before {
    content: "⌕";
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ffe04f;
    color: #10151b;
    font-size: 13px;
  }

  .public-season-nav-bar {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .public-hidden-heading {
    display: none;
  }

  .public-season-nav-inner {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px 12px;
    align-items: center;
    min-height: 46px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
    overflow: hidden;
  }

  .public-season-select-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px 5px 10px;
    border: 1px solid #cfd7e1;
    background: #f8fafc;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .public-season-select {
    min-width: 118px;
    border: 0;
    background: transparent;
    color: #10151b;
    font: inherit;
    outline: none;
    cursor: pointer;
  }

  .public-matchday-nav {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    gap: 0;
    min-width: 0;
    overflow-x: auto;
    padding: 0;
    border-top: 2px solid #10151b;
    background: #ffffff;
    white-space: nowrap;
  }

  .public-matchday-nav a {
    display: inline-block;
    flex: 0 0 auto;
    padding: 7px 10px;
    border: 0;
    border-right: 1px solid #dfe5ec;
    border-radius: 0;
    background: #ffffff;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-nav a[aria-current="page"] {
    border-color: #c40012;
    background: #c40012;
    color: #ffffff;
  }

  .public-matchday-leg-nav {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    border: 1px solid #cfd7e1;
    background: #f8fafc;
    white-space: nowrap;
  }

  .public-matchday-leg-nav a {
    display: inline-flex;
    align-items: center;
    padding: 6px 9px;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-leg-nav a + a {
    border-left: 1px solid #dfe5ec;
  }

  .public-matchday-leg-nav a[aria-current="true"] {
    background: #10151b;
    color: #ffffff;
  }

  .public-matchday-date-row {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    min-width: 0;
    margin-left: auto;
  }

  .public-matchday-date-context {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    color: #66717f;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    text-align: right;
    white-space: nowrap;
  }

  .public-games-wrap {
    max-width: 1180px;
    margin: 0 auto;
  }

  .public-games-page-head {
    display: block;
    padding: 20px 0 10px;
  }

  .public-games-kicker {
    display: inline-flex;
    width: fit-content;
    margin-bottom: 10px;
    padding: 4px 7px;
    background: #c40012;
    color: #ffffff;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-page-title {
    display: grid;
    gap: 4px;
  }

  .public-games-page-title strong {
    margin: 0;
    color: #10151b;
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .public-games-page-title span {
    color: #607086;
    font-size: 14px;
    font-weight: 900;
  }

  .public-games-layout {
    display: grid;
    grid-template-columns: minmax(0, 760px) minmax(280px, 320px);
    gap: 22px;
    align-items: start;
    justify-content: start;
    margin-top: 18px;
  }

  .public-games-main,
  .public-games-sidebar {
    display: grid;
    gap: 16px;
  }

  .public-games-panel {
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-games-main.public-games-panel {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .public-games-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .public-games-panel h2,
  .public-games-panel h3,
  .public-games-panel p {
    margin: 0;
  }

  .public-games-panel h2 {
    color: #10151b;
    font-size: 21px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-panel header p {
    margin-top: 6px;
    color: #607086;
    font-size: 14px;
  }

  .public-games-list {
    display: grid;
    gap: 14px;
    inline-size: min(100%, 620px);
    justify-self: start;
    padding: 4px 0 0;
  }

  .public-games-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .public-games-group + .public-games-group {
    margin-top: 8px;
  }

  .public-games-group h3 {
    flex: 0 0 100%;
    margin: 0 0 3px;
    color: #7a8796;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-card {
    display: grid;
    flex: 0 0 176px;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    align-items: center;
    min-height: 84px;
    padding: 8px 9px;
    border: 1px solid #eef2f6;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 18px rgba(12, 22, 34, 0.05);
    font-size: 13px;
  }

  .public-games-card-finished {
    background: #ffffff;
  }

  .public-games-card-live,
  .public-games-card-halftime {
    background: #ffffff;
  }

  .public-games-card-scheduled {
    background: #ffffff;
  }

  .public-games-card-unknown {
    background: #ffffff;
  }

  .public-games-team-line {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 5px;
    align-items: center;
    min-width: 0;
    font-weight: 900;
  }

  .public-games-team-line span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .public-games-team-score {
    min-width: 16px;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    text-align: right;
  }

  .public-games-team-winner strong {
    color: #137a3a;
  }

          .public-team-badge {
            display: grid;
            flex: 0 0 24px;
            place-items: center;
            width: 24px;
            height: 24px;
    overflow: hidden;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #f8fafc;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
  }

  .public-team-badge img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .public-games-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 4px;
    min-width: 0;
    padding: 2px 0 0 29px;
    color: #607086;
    font-size: 10.5px;
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;
  }

  .public-games-tv {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #263241;
    font-weight: 800;
  }

  .public-games-tv img {
    width: 22px;
    height: 14px;
    object-fit: contain;
  }

  .public-games-empty {
    padding: 22px;
    color: #607086;
    font-size: 14px;
  }

  .public-games-side-block {
    padding: 16px;
  }

  .public-games-side-block p {
    color: #607086;
    font-size: 14px;
    line-height: 1.42;
  }

  .public-games-ad-slot {
    display: grid;
    min-height: 260px;
    place-items: center;
    border: 1px solid #dfe5ec;
    background: #f8fafc;
    color: #8a96a5;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-news-list {
    display: grid;
    gap: 12px;
  }

  .public-games-news-item {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 0;
    border-bottom: 0;
    color: inherit;
    text-decoration: none;
  }

  .public-games-news-item-no-image {
    grid-template-columns: minmax(0, 1fr);
  }

  .public-games-news-item + .public-games-news-item {
    padding-top: 8px;
  }

  .public-games-news-thumb {
    display: block;
    width: 72px;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-games-news-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .public-games-news-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .public-games-news-label {
    color: #c40012;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-games-news-item strong {
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.15;
  }

  .public-games-news-date {
    color: #7a8796;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .public-games-diagnostic {
    max-width: 1100px;
    margin: 18px auto 0;
    padding: 18px 20px;
    border: 1px solid #ffd3a3;
    border-radius: 8px;
    background: #fff8ee;
    color: #4a2d00;
  }

  .public-games-diagnostic pre {
    overflow-x: auto;
    margin: 14px 0 0;
    padding: 14px;
    border-radius: 6px;
    background: #ffffff;
    color: #10151b;
    font-size: 13px;
    white-space: pre-wrap;
  }

  @media (max-width: 980px) {
    .public-games-shell {
      padding: 0 14px 26px;
    }

    .public-top-stack {
      margin: 0 -14px;
      padding: 0 14px;
    }

    .public-site-topbar,
    .public-games-layout {
      grid-template-columns: 1fr;
    }

    .public-season-nav-inner {
      gap: 8px;
      padding: 8px 16px 9px;
      overflow-x: auto;
    }

    .public-site-menu,
    .public-site-actions {
      justify-content: flex-start;
    }

    .public-matchday-date-row {
      justify-content: flex-start;
      margin-left: 0;
    }

    .public-matchday-date-context {
      text-align: left;
    }

    .public-games-card {
      grid-template-columns: 34px minmax(0, 1fr) 86px minmax(0, 1fr) 34px;
      gap: 8px;
    }

    .public-games-meta {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 640px) {
    .public-site-search {
      min-width: 0;
    }

    .public-games-page-title strong {
      font-size: 16px;
    }

  }
`;

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatKickoffTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatMatchdayDateContext(matches: PublicSeasonMatch[]) {
  const kickoffDates = matches
    .map((match) => new Date(match.kickoff_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime());

  if (kickoffDates.length === 0) return "Data por definir";

  const firstDate = kickoffDates[0];
  const lastDate = kickoffDates[kickoffDates.length - 1];
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const dayFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    timeZone: "Europe/Lisbon"
  });
  const monthFormatter = new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const monthKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  });

  const firstLabel = dateFormatter.format(firstDate);
  const lastLabel = dateFormatter.format(lastDate);
  if (firstLabel === lastLabel) return firstLabel;

  const sameMonth = monthKeyFormatter.format(firstDate) === monthKeyFormatter.format(lastDate);
  if (sameMonth) {
    return `${dayFormatter.format(firstDate)}-${dayFormatter.format(lastDate)} ${monthFormatter.format(lastDate)}`;
  }

  return `${firstLabel} - ${lastLabel}`;
}

function statusKind(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  if (normalized === "scheduled") return "scheduled";
  return "unknown";
}

function statusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "live") return "AO VIVO";
  if (normalized === "halftime") return "AO VIVO";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status || "Estado por definir";
}

function matchResult(match: PublicSeasonMatch) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const kind = statusKind(match.status);
  if ((kind !== "finished" && kind !== "live" && kind !== "halftime") || !hasScore) {
    return "vs";
  }

  return `${match.home_score} - ${match.away_score}`;
}

function teamInitials(name?: string | null, shortName?: string | null) {
  const source = shortName || name || "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "FC";
}

function shortTeamLabel(name?: string | null, shortName?: string | null) {
  const editorialName = name?.trim();
  const fallback = shortName?.trim() || editorialName || "Equipa";

  if (!editorialName) {
    return fallback;
  }

  return editorialName.length <= 20 ? editorialName : fallback;
}

function isWinner(match: PublicSeasonMatch, side: "home" | "away") {
  if (match.status !== "finished" || match.home_score === null || match.away_score === null || match.home_score === match.away_score) {
    return false;
  }

  return side === "home" ? match.home_score > match.away_score : match.away_score > match.home_score;
}

function TeamBadge({ logoUrl, name, shortName }: { logoUrl?: string | null; name?: string | null; shortName?: string | null }) {
  return <PublicTeamBadge fallbackLabel={teamInitials(name, shortName)} logoUrl={logoUrl} />;
}

function BroadcastBadge({ match }: { match: PublicSeasonMatch }) {
  if (!match.broadcastChannel) {
    return null;
  }

  return (
    <span className="public-games-tv">
      {match.broadcastChannel.logo_url ? <img alt="" src={match.broadcastChannel.logo_url} /> : null}
      <span>{match.broadcastChannel.name}</span>
    </span>
  );
}

function MatchCard({ match }: { match: PublicSeasonMatch }) {
  const kind = statusKind(match.status);
  const statusText = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} · ${match.minute}'` : statusLabel(match.status);
  const homeWinner = isWinner(match, "home");
  const awayWinner = isWinner(match, "away");

  return (
    <article className={`public-games-card public-games-card-${kind}`} key={match.id}>
      <div className="public-games-crest public-games-crest-home">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
      </div>
      <div className={`public-games-team-copy public-games-team-copy-home ${homeWinner ? "public-games-team-winner" : ""}`}>
        <strong>{match.homeTeam?.name ?? "Equipa da casa"}</strong>
        <small>Casa</small>
      </div>
      <div className="public-games-score">
        <strong>{matchResult(match)}</strong>
        <small className={`public-games-status public-games-status-${kind}`}>{statusText}</small>
      </div>
      <div className={`public-games-team-copy public-games-team-copy-away ${awayWinner ? "public-games-team-winner" : ""}`}>
        <strong>{match.awayTeam?.name ?? "Equipa visitante"}</strong>
        <small>Fora</small>
      </div>
      <div className="public-games-crest public-games-crest-away">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
      </div>
      <div className="public-games-meta">
        <span>{statusKind(match.status) === "scheduled" ? formatKickoffTime(match.kickoff_at) : formatKickoff(match.kickoff_at)}</span>
        <BroadcastBadge match={match} />
      </div>
    </article>
  );
}

function ReferenceGamesCard({ match }: { match: PublicSeasonMatch }) {
  const kind = statusKind(match.status);
  const showScore = (kind === "finished" || kind === "live" || kind === "halftime") && match.home_score !== null && match.away_score !== null;
  const statusText = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} - ${match.minute}'` : statusLabel(match.status);

  return (
    <article className={`public-games-card public-games-card-${kind}`} key={match.id}>
      <span className="public-games-team-line">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{shortTeamLabel(match.homeTeam?.name, match.homeTeam?.short_name)}</span>
        {showScore ? <b className="public-games-team-score">{match.home_score}</b> : null}
      </span>
      <span className="public-games-team-line">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <span>{shortTeamLabel(match.awayTeam?.name, match.awayTeam?.short_name)}</span>
        {showScore ? <b className="public-games-team-score">{match.away_score}</b> : null}
      </span>
      <div className="public-games-meta">
        <span>{kind === "scheduled" ? formatKickoffTime(match.kickoff_at) : statusText}</span>
        <BroadcastBadge match={match} />
      </div>
    </article>
  );
}

function DiagnosticPanel({ diagnostic }: { diagnostic: PublicMatchdayDiagnostic }) {
  return (
    <main className="public-games-shell">
      <style>{gamesPageStyles}</style>
      <section className="public-games-diagnostic">
        <h2>Diagnóstico temporário da página pública</h2>
        <p>A rota foi carregada, mas os dados necessários não foram encontrados ou ocorreu um erro de leitura.</p>
        <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
      </section>
    </main>
  );
}

export default async function PublicMatchdayGamesPage({ params }: PublicMatchdayGamesPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;

  if (competitionSlug === "liga-espanha") {
    redirect(`/competicoes/la-liga/${seasonLabel}/jornadas/${matchdayNumber}/jogos`);
  }

  const matchdayNumberValue = Number(matchdayNumber);
  const { context, diagnostic } = await getPublicMatchdayDiagnostic({
    competitionSlug,
    seasonLabel,
    matchdayNumber: matchdayNumberValue
  });

  if (!context) {
    return <DiagnosticPanel diagnostic={diagnostic} />;
  }

  const seasonSegment = seasonLabelToUrlSegment(context.season.label);
  const matchdayPageHref = (number: number) => `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${number}`;
  const gamesPageHref = (number: number) => `${matchdayPageHref(number)}/jogos`;
  const currentMatchdayHref = matchdayPageHref(context.matchday.number);
  const currentGamesHref = gamesPageHref(context.matchday.number);
  const classificationHref = `${currentMatchdayHref}#classificacao`;
  const seasonOptions = context.seasons.map((season) => ({
    id: season.id,
    label: season.label,
    href: `/competicoes/${context.competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1/jogos`
  }));
  const currentSeasonHref = `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/1/jogos`;
  const currentCompetitionMenuItem = {
    label: context.competition.name,
    slug: context.competition.slug,
    href: currentMatchdayHref
  };
  const publicCompetitionMenuBase = await getPublicCompetitionMenu().catch(() => []);
  const publicCompetitionMenu = publicCompetitionMenuBase.map((item) =>
    item.slug === currentCompetitionMenuItem.slug ? currentCompetitionMenuItem : item
  );

  if (!publicCompetitionMenu.some((item) => item.slug === currentCompetitionMenuItem.slug)) {
    publicCompetitionMenu.unshift(currentCompetitionMenuItem);
  }

  const liveMatches = context.matchesForMatchday.filter((match) => {
    const kind = statusKind(match.status);
    return kind === "live" || kind === "halftime";
  });
  const finishedMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "finished");
  const scheduledMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "scheduled");
  const otherMatches = context.matchesForMatchday.filter((match) => {
    const kind = statusKind(match.status);
    return kind !== "live" && kind !== "halftime" && kind !== "finished" && kind !== "scheduled";
  });
  const matchGroups = [
    { key: "live", label: "Em direto", matches: liveMatches },
    { key: "finished", label: "Finalizados", matches: finishedMatches },
    { key: "scheduled", label: "Agendados", matches: scheduledMatches },
    { key: "other", label: "Outros estados", matches: otherMatches }
  ].filter((group) => group.matches.length > 0);
  const shouldSplitMatchdayNav = context.matchdays.length > 20;
  const firstLegMatchdays = shouldSplitMatchdayNav ? context.matchdays.slice(0, 19) : context.matchdays;
  const secondLegMatchdays = shouldSplitMatchdayNav ? context.matchdays.slice(19) : [];
  const activeMatchdayLeg =
    shouldSplitMatchdayNav && secondLegMatchdays.some((matchday) => matchday.id === context.matchday.id)
      ? "second"
      : "first";
  const visibleMatchdays = activeMatchdayLeg === "second" ? secondLegMatchdays : firstLegMatchdays;
  const firstLegHref = firstLegMatchdays[0] ? gamesPageHref(firstLegMatchdays[0].number) : currentSeasonHref;
  const secondLegHref = secondLegMatchdays[0] ? gamesPageHref(secondLegMatchdays[0].number) : currentSeasonHref;
  const selectedMatchdayDateContext = formatMatchdayDateContext(context.matchesForMatchday);
  const sidebarNewsItems = context.latestNews.slice(0, 4).map((item) => ({
    id: item.id,
    dateLabel: item.time_label?.trim() || "",
    imageUrl: item.image_url?.trim() || "",
    label: "label" in item ? ((item as { label?: string | null }).label?.trim() || "") : "",
    title: item.title || "Notícia da jornada",
    linkUrl: item.link_url?.trim() || ""
  }));

  return (
    <main className="public-games-shell">
      <style>{gamesPageStyles}</style>
      <div className="public-top-stack">
        <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
          <a className="public-site-brand" href="/">
            Jornada<span>.pt</span>
          </a>
          <nav className="public-site-menu" aria-label="Competições principais">
            {publicCompetitionMenu.map((item) => (
              <a
                aria-current={item.slug === context.competition.slug ? "page" : undefined}
                href={item.href}
                key={item.slug}
              >
                {item.label}
              </a>
            ))}
            <a aria-current="page" href={currentGamesHref}>Jogos</a>
            <a href={classificationHref}>Classificação</a>
          </nav>
          <div className="public-site-actions" aria-label="Ações">
            <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
            <a href="/admin/gestor">Entrar</a>
          </div>
        </header>
        <section className="public-season-nav-bar" aria-label="Navegação de jornadas">
          <div className="public-hidden-heading">
            <h2>Jornadas</h2>
            <p>Navegação principal da época {context.season.label}.</p>
          </div>
          <div className="public-season-nav-inner">
            <label className="public-season-select-wrap">
              <span>Época</span>
              <select className="public-season-select" data-season-select defaultValue={currentSeasonHref}>
                {seasonOptions.map((season) => (
                  <option key={season.id} value={season.href}>
                    {season.label}
                  </option>
                ))}
              </select>
            </label>
            {shouldSplitMatchdayNav ? (
              <nav className="public-matchday-leg-nav" aria-label="Voltas da época">
                <a aria-current={activeMatchdayLeg === "first" ? "true" : undefined} href={firstLegHref}>
                  1.ª volta
                </a>
                <a aria-current={activeMatchdayLeg === "second" ? "true" : undefined} href={secondLegHref}>
                  2.ª volta
                </a>
              </nav>
            ) : null}
            <nav className="public-matchday-nav" aria-label="Jornadas">
              {visibleMatchdays.map((matchday) => (
                <a
                  aria-current={matchday.id === context.matchday.id ? "page" : undefined}
                  href={gamesPageHref(matchday.number)}
                  key={matchday.id}
                >
                  J{String(matchday.number).padStart(2, "0")}
                </a>
              ))}
            </nav>
            <div className="public-matchday-date-row" aria-label="Data da jornada selecionada">
              <span className="public-matchday-date-context">{selectedMatchdayDateContext}</span>
            </div>
          </div>
        </section>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var select = document.querySelector("[data-season-select]");
              if (!select) return;
              select.addEventListener("change", function () {
                if (select.value) window.location.href = select.value;
              });
            });
          `
        }}
      />

      <div className="public-games-wrap">
        <section className="public-games-page-head" aria-label="Cabeçalho dos jogos da jornada">
          <span className="public-games-kicker">
            {context.competition.name} · {context.season.label} · J{String(context.matchday.number).padStart(2, "0")}
          </span>
          <div className="public-games-page-title">
            <strong>Jogos da jornada</strong>
            <span>{selectedMatchdayDateContext}</span>
          </div>
        </section>

        <div className="public-games-layout">
          <section className="public-games-main public-games-panel" aria-label="Lista detalhada dos jogos">
            {context.matchesForMatchday.length > 0 ? (
              <div className="public-games-list">
                {matchGroups.map((group) => (
                  <section className="public-games-group" aria-label={`Jogos: ${group.label}`} key={group.key}>
                    <h3>{group.label}</h3>
                    {group.matches.map((match) => (
                      <ReferenceGamesCard key={match.id} match={match} />
                    ))}
                  </section>
                ))}
              </div>
            ) : (
              <div className="public-games-empty">Ainda não há jogos nesta jornada.</div>
            )}
          </section>

          <aside className="public-games-sidebar" aria-label="Informação lateral da jornada">
            <section className="public-games-panel public-games-side-block" aria-label="Publicidade">
              <div className="public-games-ad-slot">Publicidade</div>
            </section>

            {sidebarNewsItems.length > 0 ? (
              <section className="public-games-panel public-games-side-block" aria-label="Mais notícias">
                <div className="public-games-news-list">
                  {sidebarNewsItems.map((item) => {
                    const itemClassName = `public-games-news-item ${item.imageUrl ? "" : "public-games-news-item-no-image"}`.trim();
                    const itemContent = (
                      <>
                        {item.imageUrl ? (
                          <span className="public-games-news-thumb">
                            <img alt="" src={item.imageUrl} />
                          </span>
                        ) : null}
                        <span className="public-games-news-copy">
                          {item.label ? <span className="public-games-news-label">{item.label}</span> : null}
                          <strong>{item.title}</strong>
                          {item.dateLabel ? <span className="public-games-news-date">{item.dateLabel}</span> : null}
                        </span>
                      </>
                    );

                    return item.linkUrl ? (
                      <a className={itemClassName} href={item.linkUrl} key={item.id}>
                        {itemContent}
                      </a>
                    ) : (
                      <div className={itemClassName} key={item.id}>
                        {itemContent}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
