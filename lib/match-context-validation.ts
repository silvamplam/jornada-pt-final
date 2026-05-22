import { fetchSupabaseAdminTable } from "@/lib/supabase";

type SeasonContextRecord = {
  id: string;
  competition_id: string;
};

type MatchdayContextRecord = {
  id: string;
  season_id: string;
};

type ValidateMatchContextInput = {
  competitionId: string;
  seasonId: string;
  matchdayId?: string | null;
};

export type MatchContextValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: "missing-season" | "season-competition-mismatch" | "missing-matchday" | "matchday-season-mismatch";
    };

export async function validateMatchContext({
  competitionId,
  seasonId,
  matchdayId
}: ValidateMatchContextInput): Promise<MatchContextValidationResult> {
  const seasons = await fetchSupabaseAdminTable<SeasonContextRecord>(
    `seasons?select=id,competition_id&id=eq.${encodeURIComponent(seasonId)}&limit=1`
  );
  const season = seasons[0];

  if (!season) {
    return { ok: false, error: "missing-season" };
  }

  if (season.competition_id !== competitionId) {
    return { ok: false, error: "season-competition-mismatch" };
  }

  if (!matchdayId) {
    return { ok: true };
  }

  const matchdays = await fetchSupabaseAdminTable<MatchdayContextRecord>(
    `matchdays?select=id,season_id&id=eq.${encodeURIComponent(matchdayId)}&limit=1`
  );
  const matchday = matchdays[0];

  if (!matchday) {
    return { ok: false, error: "missing-matchday" };
  }

  if (matchday.season_id !== seasonId) {
    return { ok: false, error: "matchday-season-mismatch" };
  }

  return { ok: true };
}
