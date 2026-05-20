import { notFound } from "next/navigation";
import { ContextDashboard } from "@/components/ContextDashboard";
import { ContextHeader } from "@/components/ContextHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { getCompetitionContext, getCompetitionStaticParams, getCompetitions } from "@/lib/jornada";

type CompetitionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getCompetitionStaticParams();
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { slug } = await params;
  const context = getCompetitionContext(slug);

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
