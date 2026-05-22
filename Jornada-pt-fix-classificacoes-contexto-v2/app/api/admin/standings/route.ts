import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

type SeasonContext = {
  id: string;
  competition_id: string;
};

type MatchdayContext = {
  id: string;
  season_id: string;
};

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

async function resolveContext(seasonId: string, matchdayId: string | null) {
  const seasons = await fetchSupabaseAdminTable<SeasonContext>(
    `seasons?select=id,competition_id&id=eq.${encodeURIComponent(seasonId)}&limit=1`
  );
  const season = seasons[0];

  if (!season) {
    return null;
  }

  if (!matchdayId) {
    return {
      competitionId: season.competition_id,
      matchdayId: null
    };
  }

  const matchdays = await fetchSupabaseAdminTable<MatchdayContext>(
    `matchdays?select=id,season_id&id=eq.${encodeURIComponent(matchdayId)}&limit=1`
  );
  const matchday = matchdays[0];

  if (!matchday || matchday.season_id !== season.id) {
    return null;
  }

  return {
    competitionId: season.competition_id,
    matchdayId: matchday.id
  };
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/classificacoes?error=missing-service");
  }

  const formData = await request.formData();
  const seasonId = cleanText(formData.get("season_id"));

  if (!seasonId) {
    return redirectTo(request, "/admin/classificacoes?error=missing-fields");
  }

  try {
    const context = await resolveContext(seasonId, cleanText(formData.get("matchday_id")));

    if (!context) {
      return redirectTo(request, "/admin/classificacoes?error=invalid-context");
    }

    const syncMetadataAvailable = cleanText(formData.get("sync_metadata_available")) === "1";
    const body: Record<string, string | boolean | null> = {
      competition_id: context.competitionId,
      season_id: seasonId,
      matchday_id: context.matchdayId,
      moment_label: cleanText(formData.get("moment_label"))
    };

    if (syncMetadataAvailable) {
      body.data_source = "manual";
      body.sync_status = "manual";
      body.manual_override = false;
      body.external_provider = null;
      body.external_id = null;
      body.last_synced_at = null;
    }

    await writeSupabaseAdmin("standings", {
      method: "POST",
      body: JSON.stringify(body)
    });
  } catch {
    return redirectTo(request, "/admin/classificacoes?error=save");
  }

  return redirectTo(request, "/admin/classificacoes?created=1");
}
