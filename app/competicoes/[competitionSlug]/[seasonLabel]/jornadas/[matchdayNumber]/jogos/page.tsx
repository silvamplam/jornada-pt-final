import { buildAccumulatedClassification } from "@/lib/classification";
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
    background: #f4f6f8;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-games-shell {
    min-height: 100vh;
    padding: 0 24px 34px;
  }

  .public-games-topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -24px;
    padding: 0 24px;
    border-bottom: 1px solid #d8dee6;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.08);
  }

  .public-games-topbar-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    min-height: 58px;
    max-width: 1512px;
    margin: 0 auto;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-games-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #2f343b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 29px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
  }

  .public-games-brand span {
    color: #6b7480;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    font-weight: 900;
  }

  .public-games-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: flex-end;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-nav a {
    color: #10151b;
    text-decoration: none;
  }

  .public-games-nav a[aria-current="page"] {
    color: #c40012;
  }

  .public-games-wrap {
    max-width: 1512px;
    margin: 0 auto;
  }

  .public-games-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    align-items: end;
    margin-top: 18px;
    padding: 24px 0 18px;
    border-bottom: 4px solid #10151b;
  }

  .public-games-kicker {
    display: inline-flex;
    width: fit-content;
    margin-bottom: 12px;
    padding: 5px 8px;
    background: #c40012;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .public-games-hero h1 {
    max-width: 920px;
    margin: 0;
    color: #10151b;
    font-size: clamp(34px, 4.6vw, 64px);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .public-games-hero p {
    max-width: 760px;
    margin: 12px 0 0;
    color: #4e5b69;
    font-size: 17px;
    line-height: 1.45;
  }

  .public-games-backlink {
    align-self: center;
    padding: 9px 12px;
    border: 1px solid #cfd7e1;
    background: #ffffff;
    color: #10151b;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .public-games-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 22px;
    align-items: start;
    margin-top: 22px;
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
    font-size: 22px;
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
    gap: 18px;
    padding: 20px;
  }

  .public-games-group {
    display: grid;
    gap: 10px;
  }

  .public-games-group h3 {
    color: #263241;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 15px 16px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
  }

  .public-games-card-finished {
    border-color: #d8dee6;
    background: #f7f9fb;
  }

  .public-games-card-live,
  .public-games-card-halftime {
    border-color: #a9dcbc;
    background: #f1fbf5;
  }

  .public-games-card-scheduled {
    border-color: #ecd58b;
    background: #fff9e8;
  }

  .public-games-card-unknown {
    border-color: #d8dee6;
    background: #ffffff;
  }

  .public-games-team {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .public-games-team:first-child {
    justify-content: flex-end;
    text-align: right;
  }

  .public-games-team:last-of-type {
    justify-content: flex-start;
    text-align: left;
  }

  .public-games-team-copy {
    min-width: 0;
  }

  .public-games-team strong,
  .public-games-score strong {
    display: block;
    color: #10151b;
    font-size: 18px;
    font-weight: 900;
  }

  .public-games-team small,
  .public-games-score small {
    display: block;
    margin-top: 4px;
    color: #66717f;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .public-games-team-winner strong {
    color: #137a3a;
  }

  .public-team-badge {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 34px;
    height: 34px;
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

  .public-games-score {
    min-width: 92px;
    text-align: center;
  }

  .public-games-score strong {
    font-size: 25px;
  }

  .public-games-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: #eef2f6;
  }

  .public-games-status-finished {
    background: #e9edf2;
    color: #4e5b69;
  }

  .public-games-status-live,
  .public-games-status-halftime {
    background: #dff7e8;
    color: #137a3a;
  }

  .public-games-status-live::before,
  .public-games-status-halftime::before {
    content: "";
    width: 6px;
    height: 6px;
    margin-right: 4px;
    border-radius: 999px;
    background: #17a34a;
  }

  .public-games-status-scheduled {
    background: #fff2bf;
    color: #745400;
  }

  .public-games-status-unknown {
    background: #eef2f6;
    color: #506075;
  }

  .public-games-meta {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    color: #607086;
    font-size: 13px;
  }

  .public-games-tv {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 7px;
    border: 1px solid #dce3eb;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-weight: 800;
  }

  .public-games-tv img {
    width: 28px;
    height: 18px;
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

  .public-games-side-block h2 {
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 3px solid #10151b;
    color: #10151b;
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .public-games-stat {
    padding: 11px;
    border: 1px solid #e3e9f0;
    background: #f8fafc;
  }

  .public-games-stat strong {
    display: block;
    color: #10151b;
    font-size: 23px;
    font-weight: 900;
  }

  .public-games-stat span {
    color: #607086;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .public-games-table th,
  .public-games-table td {
    padding: 8px 4px;
    border-bottom: 1px solid #e6ebf1;
    text-align: right;
  }

  .public-games-table th:first-child,
  .public-games-table td:first-child {
    text-align: left;
  }

  .public-games-table th {
    color: #607086;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-games-table b {
    color: #10151b;
    font-weight: 900;
  }

  .public-games-link-list {
    display: grid;
    gap: 8px;
  }

  .public-games-link-list a {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #e6ebf1;
    color: #10151b;
    font-size: 14px;
    font-weight: 900;
    text-decoration: none;
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

  @media (max-width: 920px) {
    .public-games-shell {
      padding: 0 14px 26px;
    }

    .public-games-topbar {
      margin: 0 -14px;
      padding: 0 14px;
    }

    .public-games-topbar-inner,
    .public-games-hero,
    .public-games-layout {
      grid-template-columns: 1fr;
    }

    .public-games-nav {
      justify-content: flex-start;
    }

    .public-games-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .public-games-team,
    .public-games-team:first-child,
    .public-games-team:last-of-type {
      justify-content: center;
      text-align: center;
    }

    .public-games-meta {
      grid-column: auto;
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
  return status;
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
      <div className={`public-games-team ${homeWinner ? "public-games-team-winner" : ""}`}>
        <div className="public-games-team-copy">
          <strong>{match.homeTeam?.name ?? "Equipa da casa"}</strong>
          <small>Casa</small>
        </div>
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
      </div>
      <div className="public-games-score">
        <strong>{matchResult(match)}</strong>
        <small className={`public-games-status public-games-status-${kind}`}>{statusText}</small>
      </div>
      <div className={`public-games-team ${awayWinner ? "public-games-team-winner" : ""}`}>
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <div className="public-games-team-copy">
          <strong>{match.awayTeam?.name ?? "Equipa visitante"}</strong>
          <small>Fora</small>
        </div>
      </div>
      <div className="public-games-meta">
        <span>{statusKind(match.status) === "scheduled" ? formatKickoffTime(match.kickoff_at) : formatKickoff(match.kickoff_at)}</span>
        {match.venue ? <span>{match.venue}</span> : null}
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
  const matchdayHref = (number: number) => `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${number}`;
  const currentMatchdayHref = matchdayHref(context.matchday.number);
  const classificationHref = `${currentMatchdayHref}#classificacao`;
  const selectedMatchdayIndex = context.matchdays.findIndex((matchday) => matchday.id === context.matchday.id);
  const previousMatchday = selectedMatchdayIndex > 0 ? context.matchdays[selectedMatchdayIndex - 1] : null;
  const nextMatchday =
    selectedMatchdayIndex >= 0 && selectedMatchdayIndex < context.matchdays.length - 1
      ? context.matchdays[selectedMatchdayIndex + 1]
      : null;
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
  const classificationRows = buildAccumulatedClassification({
    participants: context.participants,
    matches: context.matchesForSeason,
    matchdays: context.matchdays,
    selectedMatchday: context.matchday
  }).slice(0, 5);
  const selectedMatchdayDateContext = formatMatchdayDateContext(context.matchesForMatchday);

  return (
    <main className="public-games-shell">
      <style>{gamesPageStyles}</style>
      <div className="public-games-topbar">
        <div className="public-games-topbar-inner">
          <a className="public-games-brand" href="/">
            Jornada<span>.pt</span>
          </a>
          <nav className="public-games-nav" aria-label="Navegação da página de jogos">
            <a href={currentMatchdayHref}>Jornada</a>
            <a aria-current="page" href={`${currentMatchdayHref}/jogos`}>Jogos</a>
            <a href={classificationHref}>Classificação</a>
          </nav>
        </div>
      </div>

      <div className="public-games-wrap">
        <section className="public-games-hero" aria-label="Cabeçalho dos jogos da jornada">
          <div>
            <span className="public-games-kicker">
              {context.competition.name} · {context.season.label} · J{String(context.matchday.number).padStart(2, "0")}
            </span>
            <h1>Jogos da Jornada</h1>
            <p>Calendário, resultados e estado dos jogos da J{String(context.matchday.number).padStart(2, "0")}.</p>
          </div>
          <a className="public-games-backlink" href={currentMatchdayHref}>Voltar à jornada</a>
        </section>

        <div className="public-games-layout">
          <section className="public-games-main public-games-panel" aria-label="Lista detalhada dos jogos">
            <header>
              <h2>Jogos</h2>
              <p>{selectedMatchdayDateContext}</p>
            </header>
            {context.matchesForMatchday.length > 0 ? (
              <div className="public-games-list">
                {matchGroups.map((group) => (
                  <section className="public-games-group" aria-label={`Jogos: ${group.label}`} key={group.key}>
                    <h3>{group.label}</h3>
                    {group.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </section>
                ))}
              </div>
            ) : (
              <div className="public-games-empty">Ainda não há jogos nesta jornada.</div>
            )}
          </section>

          <aside className="public-games-sidebar" aria-label="Informação lateral da jornada">
            <section className="public-games-panel public-games-side-block" aria-label="Resumo da jornada">
              <h2>Resumo</h2>
              <div className="public-games-stats">
                <div className="public-games-stat">
                  <strong>{context.matchesForMatchday.length}</strong>
                  <span>Jogos</span>
                </div>
                <div className="public-games-stat">
                  <strong>{finishedMatches.length}</strong>
                  <span>Finalizados</span>
                </div>
                <div className="public-games-stat">
                  <strong>{liveMatches.length}</strong>
                  <span>Em direto</span>
                </div>
                <div className="public-games-stat">
                  <strong>{scheduledMatches.length}</strong>
                  <span>Agendados</span>
                </div>
              </div>
            </section>

            {classificationRows.length > 0 ? (
              <section className="public-games-panel public-games-side-block" aria-label="Classificação curta">
                <h2>Classificação</h2>
                <table className="public-games-table">
                  <thead>
                    <tr>
                      <th>Clube</th>
                      <th>J</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classificationRows.map((row, index) => (
                      <tr key={row.teamId}>
                        <td>{index + 1}. {row.name}</td>
                        <td>{row.played}</td>
                        <td><b>{row.points}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="public-games-panel public-games-side-block" aria-label="Outras zonas da jornada">
              <h2>Também nesta jornada</h2>
              <div className="public-games-link-list">
                <a href={currentMatchdayHref}>
                  <span>Página principal</span>
                  <span>›</span>
                </a>
                <a href={classificationHref}>
                  <span>Classificação completa</span>
                  <span>›</span>
                </a>
                {previousMatchday ? (
                  <a href={`${matchdayHref(previousMatchday.number)}/jogos`}>
                    <span>Jornada anterior</span>
                    <span>J{String(previousMatchday.number).padStart(2, "0")}</span>
                  </a>
                ) : null}
                {nextMatchday ? (
                  <a href={`${matchdayHref(nextMatchday.number)}/jogos`}>
                    <span>Jornada seguinte</span>
                    <span>J{String(nextMatchday.number).padStart(2, "0")}</span>
                  </a>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
