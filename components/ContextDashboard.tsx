import type { CompetitionContext } from "@/lib/jornada";
import { ContextRail } from "@/components/ContextRail";
import { GoalsList } from "@/components/GoalsList";
import { HeroHeadline } from "@/components/HeroHeadline";
import { LatestList } from "@/components/LatestList";
import { LiveCenter } from "@/components/LiveCenter";
import { MatchdaySelector } from "@/components/MatchdaySelector";
import { NewsGrid } from "@/components/NewsGrid";
import { ResultsRail } from "@/components/ResultsRail";
import { StandingsTable } from "@/components/StandingsTable";
import { UpcomingMatches } from "@/components/UpcomingMatches";

type ContextDashboardProps = {
  context: CompetitionContext;
};

export function ContextDashboard({ context }: ContextDashboardProps) {
  const seenMatchIds = new Set(context.matches.map((match) => match.id));
  const matchRail = [
    ...context.matches,
    ...context.upcomingMatches.filter((match) => !seenMatchIds.has(match.id))
  ].slice(0, 6);

  return (
    <>
      <MatchdaySelector competition={context.competition} season={context.season} selectedMatchday={context.matchday} />
      <ResultsRail matches={matchRail} />

      <div className="dashboard-grid">
        <ContextRail mode="competition" context={context} />
        <main className="main-column">
          <HeroHeadline
            competition={context.competition}
            headline={context.headline}
            label={context.matchday.label}
            match={context.headlineMatch}
          />
          <NewsGrid articles={context.articles.slice(0, 4)} title="" />
        </main>
        <aside className="side-column">
          <LatestList articles={context.articles} />
          <LiveCenter matches={context.matches} updates={context.liveUpdates} />
        </aside>
      </div>

      <section className="data-grid">
        <GoalsList goals={context.goals} />
        <StandingsTable standing={context.standing} />
        <UpcomingMatches matches={context.upcomingMatches} />
      </section>
    </>
  );
}
