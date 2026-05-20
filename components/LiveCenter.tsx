import type { CSSProperties } from "react";
import type { LiveUpdate, ResolvedMatch } from "@/lib/jornada";
import { getMatchMoment, getScoreLabel } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type TimelineStyle = CSSProperties & {
  "--x": string;
};

type LiveCenterProps = {
  matches: ResolvedMatch[];
  updates: LiveUpdate[];
};

export function LiveCenter({ matches, updates }: LiveCenterProps) {
  const liveMatch =
    matches.find((match) => match.status === "live") ??
    matches.find((match) => match.status === "halftime") ??
    matches.find((match) => match.status === "scheduled") ??
    matches[0];

  return (
    <section className="panel live-panel" aria-label="Centro ao vivo">
      <header className="panel-heading">
        <h2>Centro ao vivo</h2>
      </header>
      {liveMatch ? (
        <>
          <div className="live-score">
            <TeamBadge team={liveMatch.homeTeam} />
            <strong>{liveMatch.homeTeam.name}</strong>
            <b>{getScoreLabel(liveMatch)}</b>
            <strong>{liveMatch.awayTeam.name}</strong>
            <TeamBadge team={liveMatch.awayTeam} />
          </div>
          <div className="timeline" aria-label={`Momento do jogo: ${getMatchMoment(liveMatch)}`}>
            <span style={{ "--x": "15%" } as TimelineStyle} />
            <span style={{ "--x": "42%" } as TimelineStyle} />
            <span className="active" style={{ "--x": "67%" } as TimelineStyle} />
          </div>
        </>
      ) : (
        <p className="empty-panel">Sem jogos em direto neste contexto.</p>
      )}

      <ul className="live-updates">
        {updates.map((update) => (
          <li className={`update-${update.tone}`} key={update.id}>
            <time>{update.minute}</time>
            <span>{update.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
