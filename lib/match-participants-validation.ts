import { fetchSupabaseAdminTable } from "@/lib/supabase";

type SeasonParticipantRecord = {
  team_id: string;
  status: string | null;
};

type ValidateMatchParticipantsInput = {
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
};

export type MatchParticipantsValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: "same-team" | "missing-season-participants" | "team-not-in-season";
    };

export async function validateMatchParticipants({
  seasonId,
  homeTeamId,
  awayTeamId
}: ValidateMatchParticipantsInput): Promise<MatchParticipantsValidationResult> {
  if (homeTeamId === awayTeamId) {
    return { ok: false, error: "same-team" };
  }

  const participants = await fetchSupabaseAdminTable<SeasonParticipantRecord>(
    `season_teams?select=team_id,status&season_id=eq.${encodeURIComponent(seasonId)}&limit=1000`
  );
  const activeTeamIds = new Set(
    participants.filter((participant) => participant.status !== "inactive").map((participant) => participant.team_id)
  );

  if (activeTeamIds.size === 0) {
    return { ok: false, error: "missing-season-participants" };
  }

  if (!activeTeamIds.has(homeTeamId) || !activeTeamIds.has(awayTeamId)) {
    return { ok: false, error: "team-not-in-season" };
  }

  return { ok: true };
}
