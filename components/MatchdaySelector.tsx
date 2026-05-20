import Link from "next/link";
import type { Competition, Matchday, Season } from "@/lib/jornada";

type MatchdaySelectorProps = {
  competition: Competition;
  season: Season;
  selectedMatchday: Matchday;
};

export function MatchdaySelector({ competition, season, selectedMatchday }: MatchdaySelectorProps) {
  return (
    <nav className="matchday-selector" aria-label="Jornadas">
      <span>Jornada</span>
      {season.matchdays.map((matchday) => {
        const label = String(matchday.number).padStart(2, "0");
        const href =
          matchday.id === season.currentMatchdayId
            ? `/competicao/${competition.slug}`
            : `/competicao/${competition.slug}/jornada/${label}`;

        return (
          <Link className={matchday.id === selectedMatchday.id ? "active" : undefined} href={href} key={matchday.id}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
