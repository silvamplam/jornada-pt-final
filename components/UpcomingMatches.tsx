import type { ResolvedMatch } from "@/lib/jornada";
import { formatKickoff, getBroadcastLogo, getMatchMoment, getScoreLabel } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type UpcomingMatchesProps = {
  matches: ResolvedMatch[];
};

function fixtureVisualState(match: ResolvedMatch) {
  if (match.status === "live" || match.status === "halftime") return "live";
  if (match.status === "finished") return "finished";
  return "scheduled";
}

function fixtureStatusText(match: ResolvedMatch) {
  const visualState = fixtureVisualState(match);

  if (visualState === "live") {
    return match.minute ? `AO VIVO · ${match.minute}'` : "AO VIVO";
  }

  if (visualState === "finished") return "Finalizado";

  return formatKickoff(match.kickoff) || "Agendado";
}

function UpcomingMatchCard({ match }: { match: ResolvedMatch }) {
  const broadcast = getBroadcastLogo(match);
  const visualState = fixtureVisualState(match);

  return (
    <article className={`match-card match-card-${match.status} match-card--${visualState}`} key={match.id}>
      <p className="match-status">
        <span>{fixtureStatusText(match)}</span>
        <em title={broadcast.title}>
          {broadcast.src ? <img className="competition-mini-logo" src={broadcast.src} alt="" /> : null}
          {broadcast.src ? broadcast.title : broadcast.label}
        </em>
      </p>
      <div className="match-teams">
        <TeamBadge team={match.homeTeam} />
        <strong>{match.homeTeam.shortName}</strong>
        <b>{getScoreLabel(match)}</b>
        <strong>{match.awayTeam.shortName}</strong>
        <TeamBadge team={match.awayTeam} />
      </div>
      <small>{getMatchMoment(match)}</small>
    </article>
  );
}

export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
  return (
    <section className="panel fixtures-panel" aria-label="Próximos jogos e onde se vê">
      <header className="panel-heading">
        <h2>Próximos jogos e onde se vê</h2>
      </header>
      <section className="scoreboard fixtures-scoreboard" aria-label="PrÃ³ximos jogos">
        {matches.map((match) => (
          <UpcomingMatchCard key={match.id} match={match} />
        ))}
      </section>
    </section>
  );
}
