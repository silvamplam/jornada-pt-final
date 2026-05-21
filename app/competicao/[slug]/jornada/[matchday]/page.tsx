import { notFound } from "next/navigation";
import { ContextDashboard } from "@/components/ContextDashboard";
import { ContextHeader } from "@/components/ContextHeader";
import { SiteHeader } from "@/components/SiteHeader";
import {
  applyBroadcastOverridesToCompetitionContext,
  getCompetitionContext,
  getCompetitions,
  getMatchdayStaticParams
} from "@/lib/jornada";
import { getPublicBroadcastOverrides } from "@/lib/supabase";

type MatchdayPageProps = {
  params: Promise<{
    slug: string;
    matchday: string;
  }>;
};

export function generateStaticParams() {
  return getMatchdayStaticParams();
}

export const dynamic = "force-dynamic";

export default async function MatchdayPage({ params }: MatchdayPageProps) {
  const { slug, matchday } = await params;
  const matchdayNumber = Number(matchday);
  const baseContext = Number.isNaN(matchdayNumber) ? undefined : getCompetitionContext(slug, matchdayNumber);

  if (!baseContext) {
    notFound();
  }

  const context = applyBroadcastOverridesToCompetitionContext(baseContext, await getPublicBroadcastOverrides());

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
