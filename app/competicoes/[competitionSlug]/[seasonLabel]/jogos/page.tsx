import PublicGamesPageContent from "@/components/public/PublicGamesPage";

export const dynamic = "force-dynamic";

type CompetitionGamesPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
  }>;
};

export default async function CompetitionGamesPage({ params }: CompetitionGamesPageProps) {
  const { competitionSlug, seasonLabel } = await params;

  return <PublicGamesPageContent competitionSlug={competitionSlug} seasonLabel={seasonLabel} />;
}
