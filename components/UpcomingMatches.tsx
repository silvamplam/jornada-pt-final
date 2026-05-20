import type { ResolvedMatch } from "@/lib/jornada";
import { formatMatchDate, formatKickoff, getBroadcastLogo } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type UpcomingMatchesProps = {
  matches: ResolvedMatch[];
};

export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
  return (
    <section className="panel fixtures-panel" aria-label="Próximos jogos e onde se vê">
      <header className="panel-heading">
        <h2>Próximos jogos e onde se vê</h2>
      </header>
      <ul className="fixtures-list">
        {matches.map((match) => {
          const broadcast = getBroadcastLogo(match);

          return (
            <li key={match.id}>
              <time>{formatKickoff(match.kickoff)}</time>
              <span>
                <TeamBadge team={match.homeTeam} />
                {match.homeTeam.name}
              </span>
              <b>x</b>
              <span>
                <TeamBadge team={match.awayTeam} />
                {match.awayTeam.name}
              </span>
              <small className="fixture-competition">{match.competition.name}</small>
              <small className="fixture-date">{formatMatchDate(match.kickoff)}</small>
              <em className={`tv-logo tv-logo-${broadcast.modifier}`} title={broadcast.title} aria-label={broadcast.title}>
                {broadcast.src ? <img src={broadcast.src} alt="" /> : <span>{broadcast.label}</span>}
              </em>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
