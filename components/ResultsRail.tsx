import type { ResolvedMatch } from "@/lib/jornada";
import { getMatchMoment, getScoreLabel } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type ResultsRailProps = {
  matches: ResolvedMatch[];
  title?: string;
};

function matchVisualState(match: ResolvedMatch) {
  if (match.status === "live" || match.status === "halftime") return "live";
  if (match.status === "finished") return "finished";
  return "scheduled";
}

function matchStatusText(match: ResolvedMatch) {
  const visualState = matchVisualState(match);

  if (visualState === "live") {
    return match.minute ? `AO VIVO · ${match.minute}'` : "AO VIVO";
  }

  if (visualState === "finished") return "Finalizado";

  return "Agendado";
}

export function ResultsRail({ matches, title = "Resultados da jornada" }: ResultsRailProps) {
  return (
    <section className="rail-panel" aria-label={title}>
      <header className="rail-heading">
        <h2>{title}</h2>
      </header>
      <div className="results-line">
        <button className="score-arrow" type="button" aria-label="Jogos anteriores">
          ‹
        </button>
        <section className="scoreboard" aria-label="Marcadores">
          {matches.map((match) => {
            const visualState = matchVisualState(match);

            return (
              <article className={`match-card match-card-${match.status} match-card--${visualState}`} key={match.id}>
                <p className="match-status">
                  <span>{matchStatusText(match)}</span>
                  <em>
                    {match.competition.logo ? <img className="competition-mini-logo" src={match.competition.logo} alt="" /> : null}
                    {match.competition.name}
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
          })}
        </section>
        <button className="score-arrow" type="button" aria-label="Jogos seguintes">
          ›
        </button>
      </div>
    </section>
  );
}
