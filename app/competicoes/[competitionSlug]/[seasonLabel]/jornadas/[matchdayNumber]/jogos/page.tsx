import PublicGamesPageContent from "@/components/public/PublicGamesPage";

export const dynamic = "force-dynamic";

type MatchdayGamesPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
  }>;
};

export default async function MatchdayGamesPage({ params }: MatchdayGamesPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;

  return (
    <PublicGamesPageContent
      competitionSlug={competitionSlug}
      matchdayNumber={matchdayNumber}
      seasonLabel={seasonLabel}
    />
  );
}
