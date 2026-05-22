import { writeSupabaseAdmin } from "@/lib/supabase";

type EnsureSeasonParticipantsInput = {
  seasonId: string;
  teamIds: Array<string | null | undefined>;
  syncMetadataAvailable?: boolean;
};

function uniqueTeamIds(teamIds: Array<string | null | undefined>) {
  return Array.from(new Set(teamIds.filter((teamId): teamId is string => Boolean(teamId))));
}

function participantRows(seasonId: string, teamIds: string[], includeSyncMetadata: boolean) {
  return teamIds.map((teamId) => {
    const row: Record<string, string | number | boolean | null> = {
      season_id: seasonId,
      team_id: teamId,
      display_order: 999,
      status: "active"
    };

    if (includeSyncMetadata) {
      row.data_source = "manual";
      row.sync_status = "manual";
      row.manual_override = false;
      row.external_provider = null;
      row.external_id = null;
      row.last_synced_at = null;
    }

    return row;
  });
}

async function upsertParticipants(seasonId: string, teamIds: string[], includeSyncMetadata: boolean) {
  await writeSupabaseAdmin("season_teams?on_conflict=season_id,team_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates,return=minimal"
    },
    body: JSON.stringify(participantRows(seasonId, teamIds, includeSyncMetadata))
  });
}

export async function ensureSeasonParticipants({
  seasonId,
  teamIds,
  syncMetadataAvailable = true
}: EnsureSeasonParticipantsInput) {
  const uniqueIds = uniqueTeamIds(teamIds);

  if (uniqueIds.length === 0) {
    return;
  }

  try {
    await upsertParticipants(seasonId, uniqueIds, syncMetadataAvailable);
  } catch {
    if (!syncMetadataAvailable) {
      return;
    }

    try {
      await upsertParticipants(seasonId, uniqueIds, false);
    } catch {
      // Older databases may not have season_teams yet. Match saving must keep working.
    }
  }
}
