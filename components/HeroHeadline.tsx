import Link from "next/link";
import type { Competition, Headline, ResolvedMatch } from "@/lib/jornada";
import { getScoreLabel } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type HeroHeadlineProps = {
  headline: Headline;
  competition: Competition;
  match?: ResolvedMatch;
  label: string;
};

export function HeroHeadline({ headline, match }: HeroHeadlineProps) {
  return (
    <article className="hero-story">
      <img src={headline.image} alt="" aria-hidden="true" />
      <div className="hero-content">
        <h2>{headline.title}</h2>
        <p>{headline.dek}</p>
        <Link className="primary-button" href={headline.sourceUrl ?? "#"}>
          Ler reportagem
        </Link>
      </div>
      {match ? (
        <div className="hero-score" aria-label="Resultado associado">
          <TeamBadge team={match.homeTeam} />
          <strong>{match.homeTeam.shortName}</strong>
          <b>{getScoreLabel(match)}</b>
          <strong>{match.awayTeam.shortName}</strong>
          <TeamBadge team={match.awayTeam} />
        </div>
      ) : null}
    </article>
  );
}
