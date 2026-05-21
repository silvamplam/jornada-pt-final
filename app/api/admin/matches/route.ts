import { NextResponse } from "next/server";
import { getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanInteger(value: FormDataEntryValue | null): number | null {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const parsed = Number.parseInt(text, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeKickoff(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const month = Number.parseInt(value.slice(5, 7), 10);
  const portugalOffset = month >= 4 && month <= 10 ? "+01:00" : "+00:00";

  return `${withSeconds}${portugalOffset}`;
}

function cleanStatus(value: FormDataEntryValue | null): string {
  const status = cleanText(value);
  const allowed = new Set(["scheduled", "live", "halftime", "finished"]);

  return status && allowed.has(status) ? status : "scheduled";
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/jogos?error=missing-service");
  }

  const formData = await request.formData();
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const homeTeamId = cleanText(formData.get("home_team_id"));
  const awayTeamId = cleanText(formData.get("away_team_id"));
  const kickoffAt = normalizeKickoff(cleanText(formData.get("kickoff_at")));

  if (!competitionId || !seasonId || !homeTeamId || !awayTeamId || !kickoffAt) {
    return redirectTo(request, "/admin/jogos?error=missing-fields");
  }

  try {
    await writeSupabaseAdmin("matches", {
      method: "POST",
      body: JSON.stringify({
        source_key: cleanText(formData.get("source_key")) ?? `manual-${Date.now()}`,
        competition_id: competitionId,
        season_id: seasonId,
        matchday_id: cleanText(formData.get("matchday_id")),
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        status: cleanStatus(formData.get("status")),
        minute: cleanInteger(formData.get("minute")),
        kickoff_at: kickoffAt,
        home_score: cleanInteger(formData.get("home_score")),
        away_score: cleanInteger(formData.get("away_score")),
        venue: cleanText(formData.get("venue")),
        broadcast_channel_id: cleanText(formData.get("broadcast_channel_id"))
      })
    });
  } catch {
    return redirectTo(request, "/admin/jogos?error=save");
  }

  return redirectTo(request, "/admin/jogos?created=1");
}
