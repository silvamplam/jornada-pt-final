import type { CSSProperties } from "react";
import type { LiveUpdate, ResolvedMatch } from "@/lib/jornada";
import { getBroadcastLogo, getMatchMoment, getScoreLabel } from "@/lib/jornada";
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

function LiveMatchCard({ match }: { match: ResolvedMatch }) {
  const visualState = livePanelVisualState(match);
  const broadcast = getBroadcastLogo(match);

  return (
    <article className={`match-card match-card-${match.status} match-card--${visualState}`}>
      <p className="match-status">
        <span>{livePanelStatusText(match)}</span>
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
          <section className="scoreboard live-scoreboard" aria-label="Jogo em destaque no centro ao vivo">
            <LiveMatchCard match={liveMatch} />
          </section>
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
