import { notFound } from "next/navigation";
import { ContextDashboard } from "@/components/ContextDashboard";
import { ContextHeader } from "@/components/ContextHeader";
import { SiteHeader } from "@/components/SiteHeader";
import {
  applyBroadcastOverridesToCompetitionContext,
  getCompetitionContext,
  getCompetitionStaticParams,
  getCompetitions
} from "@/lib/jornada";
import { getPublicBroadcastOverrides } from "@/lib/supabase";

type CompetitionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getCompetitionStaticParams();
}

export const dynamic = "force-dynamic";

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { slug } = await params;
  const baseContext = getCompetitionContext(slug);

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
