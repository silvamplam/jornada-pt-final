import { NextResponse } from "next/server";
import { validateMatchContext } from "@/lib/match-context-validation";
import { validateMatchParticipants } from "@/lib/match-participants-validation";
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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function cleanMatchStatus(value: FormDataEntryValue | null): string {
  const status = cleanText(value);
  const allowed = new Set(["scheduled", "live", "halftime", "finished", "postponed", "cancelled"]);

  return status && allowed.has(status) ? status : "scheduled";
}

function cleanMatchdayStatus(value: FormDataEntryValue | null): string {
  const status = cleanText(value);
  const allowed = new Set(["scheduled", "live", "finished", "archived"]);

  return status && allowed.has(status) ? status : "scheduled";
}

function returnUrl(request: Request, formData: FormData, key: "created" | "error", value: string) {
  const rawReturnTo = cleanText(formData.get("return_to"));
  const safeReturnTo = rawReturnTo?.startsWith("/admin/gestor") ? rawReturnTo : "/admin/gestor";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.set(key, value);

  return NextResponse.redirect(url, { status: 303 });
}

async function createCountry(formData: FormData) {
  const name = cleanText(formData.get("name"));
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);

  if (!name || !slug) {
    throw new Error("missing-fields");
  }

  await writeSupabaseAdmin("countries", {
    method: "POST",
    body: JSON.stringify({
      name,
      slug,
      iso2: cleanText(formData.get("iso2")),
      flag_emoji: cleanText(formData.get("flag_emoji")),
      is_active: true
    })
  });
}

async function createCompetition(formData: FormData) {
  const name = cleanText(formData.get("name"));
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);
  const countryId = cleanText(formData.get("country_id"));

  if (!name || !slug || !countryId) {
    throw new Error("missing-fields");
  }

  const payload = {
    name,
    slug,
    country_id: countryId,
    country: cleanText(formData.get("country")),
    logo_url: cleanText(formData.get("logo_url")),
    accent_color: cleanText(formData.get("accent_color")),
    is_active: true
  };

  await writeSupabaseAdmin("competitions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function createSeason(formData: FormData) {
  const competitionId = cleanText(formData.get("competition_id"));
  const label = cleanText(formData.get("label"));

  if (!competitionId || !label) {
    throw new Error("missing-fields");
  }

  await writeSupabaseAdmin("seasons", {
    method: "POST",
    body: JSON.stringify({
      competition_id: competitionId,
      label,
      starts_on: cleanText(formData.get("starts_on")),
      ends_on: cleanText(formData.get("ends_on")),
      is_current: cleanText(formData.get("is_current")) === "1"
    })
  });
}

async function createParticipant(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));
  const teamId = cleanText(formData.get("team_id"));

  if (!seasonId || !teamId) {
    throw new Error("missing-fields");
  }

  const body: Record<string, string | number | boolean | null> = {
    season_id: seasonId,
    team_id: teamId,
    display_order: cleanInteger(formData.get("display_order")) ?? 1,
    status: cleanText(formData.get("status")) ?? "active"
  };

  if (cleanText(formData.get("sync_metadata_available")) === "1") {
    body.data_source = "manual";
    body.sync_status = "manual";
    body.manual_override = false;
    body.external_provider = null;
    body.external_id = null;
    body.last_synced_at = null;
  }

  await writeSupabaseAdmin("season_teams?on_conflict=season_id,team_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body)
  });
}

async function createMatchday(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));
  const number = cleanInteger(formData.get("number"));
  const label = cleanText(formData.get("label"));

  if (!seasonId || number === null || !label) {
    throw new Error("missing-fields");
  }

  const body: Record<string, string | number | boolean | null> = {
    season_id: seasonId,
    number,
    label,
    starts_on: cleanText(formData.get("starts_on")),
    ends_on: cleanText(formData.get("ends_on")),
    status: cleanMatchdayStatus(formData.get("status")),
    context_summary: cleanText(formData.get("context_summary"))
  };

  if (cleanText(formData.get("editorial_fields_available")) === "1") {
    body.editorial_title = cleanText(formData.get("editorial_title"));
    body.editorial_summary = cleanText(formData.get("editorial_summary"));
    body.hero_image_url = cleanText(formData.get("hero_image_url"));
    body.video_url = cleanText(formData.get("video_url"));
    body.display_order = cleanInteger(formData.get("display_order"));
    body.is_featured = cleanText(formData.get("is_featured")) === "1";
    body.memory_note = cleanText(formData.get("memory_note"));
    body.seo_title = cleanText(formData.get("seo_title"));
    body.seo_description = cleanText(formData.get("seo_description"));
  }

  if (cleanText(formData.get("sync_metadata_available")) === "1") {
    body.data_source = "manual";
    body.sync_status = "manual";
    body.manual_override = false;
    body.external_provider = null;
    body.external_id = null;
    body.last_synced_at = null;
  }

  await writeSupabaseAdmin("matchdays", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function createMatch(formData: FormData) {
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const matchdayId = cleanText(formData.get("matchday_id"));
  const homeTeamId = cleanText(formData.get("home_team_id"));
  const awayTeamId = cleanText(formData.get("away_team_id"));
  const kickoffAt = normalizeKickoff(cleanText(formData.get("kickoff_at")));

  if (!competitionId || !seasonId || !matchdayId || !homeTeamId || !awayTeamId || !kickoffAt) {
    throw new Error("missing-fields");
  }

  const contextValidation = await validateMatchContext({ competitionId, seasonId, matchdayId });

  if (!contextValidation.ok) {
    throw new Error(contextValidation.error);
  }

  const participantsValidation = await validateMatchParticipants({ seasonId, homeTeamId, awayTeamId });

  if (!participantsValidation.ok) {
    throw new Error(participantsValidation.error);
  }

  const body: Record<string, string | number | boolean | null> = {
    source_key: cleanText(formData.get("source_key")) ?? `manual-${Date.now()}`,
    competition_id: competitionId,
    season_id: seasonId,
    matchday_id: matchdayId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    status: cleanMatchStatus(formData.get("status")),
    minute: cleanInteger(formData.get("minute")),
    kickoff_at: kickoffAt,
    home_score: cleanInteger(formData.get("home_score")),
    away_score: cleanInteger(formData.get("away_score")),
    venue: cleanText(formData.get("venue")),
    broadcast_channel_id: cleanText(formData.get("broadcast_channel_id"))
  };

  if (cleanText(formData.get("sync_metadata_available")) === "1") {
    body.data_source = "manual";
    body.sync_status = "manual";
    body.manual_override = false;
    body.external_provider = null;
    body.external_id = null;
    body.external_match_id = null;
    body.last_synced_at = null;
  }

  await writeSupabaseAdmin("matches", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    const formData = await request.formData();
    return returnUrl(request, formData, "error", "missing-service");
  }

  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));

  try {
    if (actionType === "country") {
      await createCountry(formData);
    } else if (actionType === "competition") {
      await createCompetition(formData);
    } else if (actionType === "season") {
      await createSeason(formData);
    } else if (actionType === "participant") {
      await createParticipant(formData);
    } else if (actionType === "matchday") {
      await createMatchday(formData);
    } else if (actionType === "match") {
      await createMatch(formData);
    } else {
      return returnUrl(request, formData, "error", "unknown-action");
    }
  } catch (error) {
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "save");
  }

  return returnUrl(request, formData, "created", actionType ?? "1");
}
