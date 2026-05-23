import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

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

function returnUrl(request: Request, formData: FormData, key: "created" | "error", value: string) {
  const rawReturnTo = cleanText(formData.get("return_to"));
  const safeReturnTo = rawReturnTo?.startsWith("/admin/gestor") ? rawReturnTo : "/admin/gestor";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.set(key, value);

  return NextResponse.redirect(url, { status: 303 });
}

async function hasRows(path: string) {
  const rows = await fetchSupabaseAdminTable<{ id: string }>(`${path}&limit=1`);
  return rows.length > 0;
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

async function createTeam(formData: FormData) {
  const name = cleanText(formData.get("name"));
  const shortName = cleanText(formData.get("short_name"))?.toUpperCase();
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);
  const countryId = cleanText(formData.get("country_id"));

  if (!name || !shortName || !slug || !countryId) {
    throw new Error("missing-fields");
  }

  await writeSupabaseAdmin("teams", {
    method: "POST",
    body: JSON.stringify({
      name,
      short_name: shortName,
      slug,
      country_id: countryId,
      logo_url: cleanText(formData.get("logo_url")),
      primary_color: cleanText(formData.get("primary_color"))
    })
  });
}

async function createParticipant(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));
  const teamId = cleanText(formData.get("team_id"));
  const countryId = cleanText(formData.get("country_id"));

  if (!seasonId || !teamId || !countryId) {
    throw new Error("missing-fields");
  }

  const linkedTeams = await fetchSupabaseAdminTable<{ id: string }>(
    `teams?select=id&id=eq.${encodeURIComponent(teamId)}&country_id=eq.${encodeURIComponent(countryId)}&limit=1`
  );

  if (linkedTeams.length === 0) {
    throw new Error("invalid-team-country");
  }

  await writeSupabaseAdmin("season_teams?on_conflict=season_id,team_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      season_id: seasonId,
      team_id: teamId,
      display_order: cleanInteger(formData.get("display_order")) ?? 999,
      status: "active",
      data_source: "manual",
      sync_status: "manual",
      manual_override: true
    })
  });
}

async function removeParticipant(formData: FormData) {
  const participantId = cleanText(formData.get("participant_id"));
  const seasonId = cleanText(formData.get("season_id"));

  if (!participantId || !seasonId) {
    throw new Error("missing-fields");
  }

  await writeSupabaseAdmin(
    `season_teams?id=eq.${encodeURIComponent(participantId)}&season_id=eq.${encodeURIComponent(seasonId)}`,
    {
      method: "DELETE"
    }
  );
}

async function removeSeason(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));

  if (!seasonId) {
    throw new Error("missing-fields");
  }

  if (await hasRows(`season_teams?select=id&season_id=eq.${encodeURIComponent(seasonId)}`)) {
    throw new Error("season-has-participants");
  }

  if (await hasRows(`matchdays?select=id&season_id=eq.${encodeURIComponent(seasonId)}`)) {
    throw new Error("season-has-matchdays");
  }

  if (await hasRows(`matches?select=id&season_id=eq.${encodeURIComponent(seasonId)}`)) {
    throw new Error("season-has-matches");
  }

  await writeSupabaseAdmin(`seasons?id=eq.${encodeURIComponent(seasonId)}`, {
    method: "DELETE"
  });
}

async function removeCompetition(formData: FormData) {
  const competitionId = cleanText(formData.get("competition_id"));

  if (!competitionId) {
    throw new Error("missing-fields");
  }

  if (await hasRows(`seasons?select=id&competition_id=eq.${encodeURIComponent(competitionId)}`)) {
    throw new Error("competition-has-seasons");
  }

  await writeSupabaseAdmin(`competitions?id=eq.${encodeURIComponent(competitionId)}`, {
    method: "DELETE"
  });
}

async function removeCountry(formData: FormData) {
  const countryId = cleanText(formData.get("country_id"));

  if (!countryId) {
    throw new Error("missing-fields");
  }

  if (await hasRows(`competitions?select=id&country_id=eq.${encodeURIComponent(countryId)}`)) {
    throw new Error("country-has-competitions");
  }

  if (await hasRows(`teams?select=id&country_id=eq.${encodeURIComponent(countryId)}`)) {
    throw new Error("country-has-teams");
  }

  await writeSupabaseAdmin(`countries?id=eq.${encodeURIComponent(countryId)}`, {
    method: "DELETE"
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
    } else if (actionType === "team") {
      await createTeam(formData);
    } else if (actionType === "participant") {
      await createParticipant(formData);
    } else if (actionType === "remove_participant") {
      await removeParticipant(formData);
    } else if (actionType === "remove_season") {
      await removeSeason(formData);
    } else if (actionType === "remove_competition") {
      await removeCompetition(formData);
    } else if (actionType === "remove_country") {
      await removeCountry(formData);
    } else {
      return returnUrl(request, formData, "error", "unknown-action");
    }
  } catch (error) {
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "save");
  }

  return returnUrl(request, formData, "created", actionType ?? "1");
}
