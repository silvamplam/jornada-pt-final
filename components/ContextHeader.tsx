import type { CSSProperties } from "react";
import type { CompetitionContext, HomeContext } from "@/lib/jornada";

type AccentStyle = CSSProperties & {
  "--accent": string;
};

type ContextHeaderProps =
  | {
      mode: "home";
      context: HomeContext;
    }
  | {
      mode: "competition";
      context: CompetitionContext;
    };

export function ContextHeader(props: ContextHeaderProps) {
  if (props.mode === "home") {
    return null;
  }

  const { competition, season, matchday } = props.context;

  return (
    <section className="context-header" style={{ "--accent": competition.accent } as AccentStyle}>
      <div className="league-title">
        <span className="league-icon" aria-hidden="true">
          {competition.logo ? <img src={competition.logo} alt="" /> : "♜"}
        </span>
        <div>
          <p>{competition.name}</p>
          <h1>{season.label}</h1>
        </div>
      </div>
      <div>
        <p className="eyebrow">{matchday.label}</p>
        <h2>{matchday.dateLabel}</h2>
        <p className="context-summary">{matchday.context}</p>
      </div>
      <div className="time-chip">
        <span>Tempo histórico</span>
        <strong>{matchday.status === "current" ? "Momento atual" : matchday.label}</strong>
      </div>
    </section>
  );
}
