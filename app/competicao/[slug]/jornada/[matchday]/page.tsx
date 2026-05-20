import { notFound } from "next/navigation";
import { ContextDashboard } from "@/components/ContextDashboard";
import { ContextHeader } from "@/components/ContextHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { getCompetitionContext, getCompetitions, getMatchdayStaticParams } from "@/lib/jornada";

type MatchdayPageProps = {
  params: Promise<{
    slug: string;
    matchday: string;
  }>;
};

export function generateStaticParams() {
  return getMatchdayStaticParams();
}

export default async function MatchdayPage({ params }: MatchdayPageProps) {
  const { slug, matchday } = await params;
  const matchdayNumber = Number(matchday);
  const context = Number.isNaN(matchdayNumber) ? undefined : getCompetitionContext(slug, matchdayNumber);

  if (!context) {
    notFound();
  }

  return (
    <>
      <SiteHeader competitions={getCompetitions()} activeSlug={context.competition.slug} />
      <div className="page-shell">
        <ContextHeader mode="competition" context={context} />
        <ContextDashboard context={context} />
      </div>
    </>
  );
}
