import Link from "next/link";
import type { CSSProperties } from "react";
import type { CompetitionContext, HomeContext } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type AccentStyle = CSSProperties & {
  "--accent": string;
};

type ContextRailProps =
  | {
      mode: "home";
      context: HomeContext;
    }
  | {
      mode: "competition";
      context: CompetitionContext;
    };

export function ContextRail(props: ContextRailProps) {
  if (props.mode === "home") {
    return (
      <aside className="context-rail">
        <section className="panel" aria-label="Competições em foco">
          <header className="panel-heading">
            <h2>Competições em foco</h2>
          </header>
          <div className="competition-stack">
            {props.context.contexts.map((context) => (
              <Link
                className="competition-card"
                href={`/competicao/${context.competition.slug}`}
                key={context.competition.id}
                style={{ "--accent": context.competition.accent } as AccentStyle}
              >
                <div className="competition-card-copy">
                  <span>{context.competition.country}</span>
                  <strong>{context.competition.name}</strong>
                  <small>
                    {context.matchday.label} · {context.matchday.dateLabel}
                  </small>
                  <p>{context.competition.summary}</p>
                  <div className="competition-card-teams" aria-hidden="true">
                    {context.matches.slice(0, 2).flatMap((match) => [match.homeTeam, match.awayTeam]).slice(0, 3).map((team, index) => (
                      <TeamBadge team={team} key={`${team.id}-${index}`} />
                    ))}
                  </div>
                </div>
                <img className="competition-thumb" src={context.headline.image} alt="" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </aside>
    );
  }

  const { headline } = props.context;

  return (
    <aside className="context-rail">
      <section className="panel topic-panel" aria-label="Contexto da jornada">
        <div className="main-topic">
          <img src={headline.image} alt="" aria-hidden="true" />
          <div>
            <strong>{headline.title}</strong>
          </div>
        </div>
        <ul className="mini-topics">
          {props.context.articles.slice(0, 3).map((article) => (
            <li key={article.id}>
              <img src={article.image} alt="" aria-hidden="true" />
              <div>
                <strong>{article.title}</strong>
                <p>{article.publishedAtMoment}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
