import type { ResolvedMatch } from "@/lib/jornada";
import { getMatchMoment, getScoreLabel, getStatusLabel } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type ResultsRailProps = {
  matches: ResolvedMatch[];
  title?: string;
};

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
          {matches.map((match) => (
            <article className={`match-card match-card-${match.status}`} key={match.id}>
              <p className="match-status">
                <span>{getStatusLabel(match)}</span>
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
          ))}
        </section>
        <button className="score-arrow" type="button" aria-label="Jogos seguintes">
          ›
        </button>
      </div>
    </section>
  );
}
