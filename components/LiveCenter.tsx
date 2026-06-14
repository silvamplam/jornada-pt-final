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

function livePanelVisualState(match?: ResolvedMatch) {
  if (!match) return "scheduled";
  if (match.status === "live" || match.status === "halftime") return "live";
  if (match.status === "finished") return "finished";
  return "scheduled";
}

function livePanelStatusText(match: ResolvedMatch) {
  const visualState = livePanelVisualState(match);

  if (visualState === "live") {
    return match.minute ? `AO VIVO · ${match.minute}'` : "AO VIVO";
  }

  if (visualState === "finished") return "Finalizado";

  return getMatchMoment(match) || "Agendado";
}

export function LiveCenter({ matches, updates }: LiveCenterProps) {
  const liveMatch =
    matches.find((match) => match.status === "live") ??
    matches.find((match) => match.status === "halftime") ??
    matches.find((match) => match.status === "scheduled") ??
    matches[0];
  const visualState = livePanelVisualState(liveMatch);

  return (
    <section className={`panel live-panel live-panel--${visualState}`} aria-label="Centro ao vivo">
      <header className="panel-heading">
        <h2>Centro ao vivo</h2>
      </header>
      {liveMatch ? (
        <>
          <p className="live-panel-status">
            <span>{livePanelStatusText(liveMatch)}</span>
          </p>
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
