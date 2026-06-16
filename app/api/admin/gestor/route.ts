import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin, writeSupabaseAdminReturning } from "@/lib/supabase";

const ROUNDUP_EDITOR_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);
const LATEST_NEWS_EDITOR_SORT_ORDERS = Array.from({ length: 8 }, (_, index) => index + 1);

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

function cleanScore(value: FormDataEntryValue | null): number | null {
  const text = cleanText(value);

  if (!text || !/^\d+$/.test(text)) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function cleanMatchdayStatus(value: FormDataEntryValue | null): string {
  const status = cleanText(value);
  const allowed = new Set(["scheduled", "live", "finished", "archived"]);

  return status && allowed.has(status) ? status : "scheduled";
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

type AgendaMatchRow = {
  id: string;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  broadcast_channel_id: string | null;
};

type MatchdayTeamUse = {
  id: string;
  home_team_id: string;
  away_team_id: string;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  code?: string | null;
  country_id: string | null;
};

type TeamAliasRow = {
  team_id: string;
  normalized_alias: string;
};

type ClubListRow = {
  lineNumber: number;
  name: string;
  shortName: string | null;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

type ApplyClubListSummary = {
  createdTeams: number;
  reusedTeams: number;
  addedParticipants: number;
  existingParticipants: number;
  blockedConflicts: number;
  invalidLines: number;
};

type CalendarListRow = {
  lineNumber: number;
  matchdayNumber: number;
  matchdayLabel: string;
  homeName: string;
  awayName: string;
  kickoffAt: string;
  venue: string | null;
};

type CalendarApplySummary = {
  createdMatchdays: number;
  reusedMatchdays: number;
  createdMatches: number;
  existingMatches: number;
  blockedConflicts: number;
  invalidLines: number;
  involvedMatchdays: CalendarMatchdayRow[];
};

type ManualParticipantRow = {
  team_id: string;
};

type CalendarMatchdayRow = {
  id: string;
  number: number;
  label: string;
};

type ExistingCalendarMatchRow = {
  id: string;
  matchday_id: string | null;
  home_team_id: string;
  away_team_id: string;
};

type MatchIdRow = {
  id: string;
};

type MatchdayIdRow = {
  id: string;
};

class ClearSeasonCalendarError extends Error {
  detail: string;

  constructor(detail: string) {
    super("clear-season-calendar-step-failed");
    this.detail = detail;
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function returnUrl(request: Request, formData: FormData, key: "created" | "error", value: string, extraParams?: Record<string, string>) {
  const rawReturnTo = cleanText(formData.get("return_to"));
  const safeReturnTo =
    rawReturnTo?.startsWith("/admin/gestor") || rawReturnTo?.startsWith("/admin/editorial/jornada/")
      ? rawReturnTo
      : "/admin/gestor";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.delete("club_apply_summary");
  url.searchParams.delete("calendar_apply_summary");
  url.searchParams.delete("clear_calendar_error_detail");
  url.searchParams.delete("latest_news_error_detail");
  url.searchParams.set(key, value);
  Object.entries(extraParams ?? {}).forEach(([paramKey, paramValue]) => {
    url.searchParams.set(paramKey, paramValue);
  });

  return NextResponse.redirect(url, { status: 303 });
}

async function hasRows(path: string) {
  const rows = await fetchSupabaseAdminTable<{ id: string }>(`${path}&limit=1`);
  return rows.length > 0;
}

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

function encodedInList(values: string[]) {
  return values.map((value) => encodeURIComponent(value)).join(",");
}

async function deleteRows(path: string) {
  await writeSupabaseAdmin(path, {
    method: "DELETE"
  });
}

function isMissingOptionalRelationError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('"code":"42p01"') ||
    message.includes('"code":"42703"') ||
    message.includes('"code":"pgrst205"') ||
    message.includes("could not find the table") ||
    (message.includes("column") && message.includes("does not exist")) ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

function isPermissionDeniedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return message.includes('"code":"42501"') || message.includes("permission denied");
}

function formatActionError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Erro desconhecido.";
  }

  try {
    const parsed = JSON.parse(error.message) as { message?: string; details?: string; hint?: string; code?: string };
    return [parsed.message, parsed.details, parsed.hint, parsed.code ? `Codigo: ${parsed.code}` : null]
      .filter(Boolean)
      .join(" ");
  } catch {
    return error.message;
  }
}

function shortActionError(error: unknown) {
  const message = formatActionError(error).replace(/\s+/g, " ").trim();
  return message.length > 700 ? `${message.slice(0, 700)}...` : message;
}

async function deleteExistingOptionalRows(table: string, filter: string, label: string) {
  let linkedRows: { id: string }[] = [];

  try {
    linkedRows = await fetchSupabaseAdminTable<{ id: string }>(`${table}?select=id&${filter}&limit=1`);
  } catch (error) {
    if (isMissingOptionalRelationError(error)) {
      console.warn(`[admin/gestor] clear_season_calendar skipped optional dependency ${label}:`, error);
      return;
    }

    throw new Error(`${label}: ${shortActionError(error)}`);
  }

  if (linkedRows.length === 0) {
    return;
  }

  try {
    await deleteRows(`${table}?${filter}`);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw new Error(
        `Existem dados em ${table} ligados a estes jogos ou jornadas, mas a aplicacao nao tem permissao para os apagar. ${shortActionError(error)}`
      );
    }

    if (isMissingOptionalRelationError(error)) {
      console.warn(`[admin/gestor] clear_season_calendar skipped optional dependency ${label}:`, error);
      return;
    }

    throw new Error(`${label}: ${shortActionError(error)}`);
  }
}

async function runClearSeasonStep(stepLabel: string, operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    throw new ClearSeasonCalendarError(`Erro ao ${stepLabel}: ${shortActionError(error)}`);
  }
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

  const lookupTeams = await readTeamsForCountryLookup(countryId);
  const lookupAliases = await readTeamAliasesForTeamIds(lookupTeams.map((team) => team.id));
  const existingTeamByInput = resolveTeamByInputName({
    teamsByKey: buildTeamLookupIndex(lookupTeams, lookupAliases),
    slug,
    name,
    shortName
  });

  if (existingTeamByInput) {
    throw new Error("team-slug-exists");
  }

  if (await hasRows(`teams?select=id&slug=eq.${encodeURIComponent(slug)}`)) {
    throw new Error("team-slug-exists");
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

async function attachTeamToCountry(formData: FormData) {
  const teamId = cleanText(formData.get("team_id"));
  const countryId = cleanText(formData.get("country_id"));

  if (!teamId || !countryId) {
    throw new Error("missing-fields");
  }

  const teams = await fetchSupabaseAdminTable<{ id: string; country_id: string | null }>(
    `teams?select=id,country_id&id=eq.${encodeURIComponent(teamId)}&limit=1`
  );
  const team = teams[0];

  if (!team) {
    throw new Error("team-not-found");
  }

  if (team.country_id) {
    throw new Error("team-already-linked");
  }

  await writeSupabaseAdmin(`teams?id=eq.${encodeURIComponent(teamId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      country_id: countryId
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

  const participantPayload = {
    season_id: seasonId,
    team_id: teamId,
    display_order: cleanInteger(formData.get("display_order")) ?? 999,
    status: "active",
    data_source: "manual",
    sync_status: "manual",
    manual_override: true
  };

  await writeSupabaseAdmin("season_teams?on_conflict=season_id,team_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(participantPayload)
  });
}

function parseClubList(rawList: string): { rows: ClubListRow[]; invalidLines: number } {
  const seenSlugs = new Set<string>();
  const rows: ClubListRow[] = [];
  let invalidLines = 0;

  rawList
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line.length > 0)
    .forEach(({ line, lineNumber }) => {
      const [nameValue = "", shortValue = "", slugValue = "", logoValue = "", colorValue = ""] = line
        .split(";")
        .map((value) => value.trim());
      const name = nameValue;
      const slug = slugify(slugValue || name);

      if (!name || !slug || seenSlugs.has(slug)) {
        invalidLines += 1;
        return;
      }

      seenSlugs.add(slug);
      rows.push({
        lineNumber,
        name,
        shortName: cleanText(shortValue) ? shortValue.toUpperCase() : null,
        slug,
        logoUrl: cleanText(logoValue),
        primaryColor: cleanText(colorValue)
      });
    });

  return { rows, invalidLines };
}

async function applyClubList(formData: FormData): Promise<ApplyClubListSummary> {
  const countryId = cleanText(formData.get("country_id"));
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const rawList = cleanText(formData.get("club_preview"));

  if (!countryId || !competitionId || !seasonId || !rawList) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`countries?select=id&id=eq.${encodeURIComponent(countryId)}`))) {
    throw new Error("country-not-found");
  }

  if (
    !(await hasRows(
      `competitions?select=id&id=eq.${encodeURIComponent(competitionId)}&country_id=eq.${encodeURIComponent(countryId)}`
    ))
  ) {
    throw new Error("competition-country-invalid");
  }

  if (
    !(await hasRows(
      `seasons?select=id&id=eq.${encodeURIComponent(seasonId)}&competition_id=eq.${encodeURIComponent(competitionId)}`
    ))
  ) {
    throw new Error("season-competition-invalid");
  }

  const parsed = parseClubList(rawList);
  const summary: ApplyClubListSummary = {
    createdTeams: 0,
    reusedTeams: 0,
    addedParticipants: 0,
    existingParticipants: 0,
    blockedConflicts: 0,
    invalidLines: parsed.invalidLines
  };
  const lookupTeams = await readTeamsForCountryLookup(countryId);
  const lookupAliases = await readTeamAliasesForTeamIds(lookupTeams.map((team) => team.id));
  const teamsByKey = buildTeamLookupIndex(lookupTeams, lookupAliases);

  for (const row of parsed.rows) {
    let team = resolveTeamByInputName({
      teamsByKey,
      slug: row.slug,
      name: row.name,
      shortName: row.shortName
    });

    if (!team) {
      const existingTeams = await fetchSupabaseAdminTable<TeamRow>(
        `teams?select=id,name,short_name,slug,code,country_id&slug=eq.${encodeURIComponent(row.slug)}&limit=1`
      );
      team = existingTeams[0];
    }

    if (team?.country_id && team.country_id !== countryId) {
      summary.blockedConflicts += 1;
      continue;
    }

    if (!team) {
      const createdTeams = await writeSupabaseAdminReturning<TeamRow>("teams", {
        method: "POST",
        body: JSON.stringify({
          name: row.name,
          short_name: row.shortName ?? row.name.slice(0, 6).toUpperCase(),
          slug: row.slug,
          country_id: countryId,
          logo_url: row.logoUrl,
          primary_color: row.primaryColor
        })
      });
      team = createdTeams[0];
      summary.createdTeams += 1;
      if (team) {
        addTeamLookupKey(teamsByKey, team.slug, team);
        addTeamLookupKey(teamsByKey, team.name, team);
        addTeamLookupKey(teamsByKey, team.short_name, team);
        addTeamLookupKey(teamsByKey, team.code, team);
      }
    } else {
      summary.reusedTeams += 1;

      if (!team.country_id) {
        await writeSupabaseAdmin(`teams?id=eq.${encodeURIComponent(team.id)}&country_id=is.null`, {
          method: "PATCH",
          body: JSON.stringify({
            country_id: countryId
          })
        });

        if (
          !(await hasRows(
            `teams?select=id&id=eq.${encodeURIComponent(team.id)}&country_id=eq.${encodeURIComponent(countryId)}`
          ))
        ) {
          throw new Error("invalid-team-country");
        }
      }
    }

    if (!team?.id) {
      summary.invalidLines += 1;
      continue;
    }

    const participantExists = await hasRows(
      `season_teams?select=id&season_id=eq.${encodeURIComponent(seasonId)}&team_id=eq.${encodeURIComponent(team.id)}`
    );

    await writeSupabaseAdmin("season_teams?on_conflict=season_id,team_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        season_id: seasonId,
        team_id: team.id,
        display_order: row.lineNumber,
        status: "active",
        data_source: "manual",
        sync_status: "manual",
        manual_override: true
      })
    });

    if (participantExists) {
      summary.existingParticipants += 1;
    } else {
      summary.addedParticipants += 1;
    }
  }

  return summary;
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

async function removeAllParticipants(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));

  if (!seasonId) {
    throw new Error("missing-fields");
  }

  if (await hasRows(`matchdays?select=id&season_id=eq.${encodeURIComponent(seasonId)}`)) {
    throw new Error("season-participants-has-calendar");
  }

  if (await hasRows(`matches?select=id&season_id=eq.${encodeURIComponent(seasonId)}`)) {
    throw new Error("season-participants-has-calendar");
  }

  await writeSupabaseAdmin(`season_teams?season_id=eq.${encodeURIComponent(seasonId)}`, {
    method: "DELETE"
  });
}

async function removeOldParticipant(formData: FormData) {
  const participantId = cleanText(formData.get("participant_id"));

  if (!participantId) {
    throw new Error("missing-fields");
  }

  const oldParticipantPath =
    `season_teams?select=id&id=eq.${encodeURIComponent(participantId)}&or=(manual_override.is.false,manual_override.is.null)`;

  if (!(await hasRows(oldParticipantPath))) {
    if (await hasRows(`season_teams?select=id&id=eq.${encodeURIComponent(participantId)}&manual_override=is.true`)) {
      throw new Error("old-participant-manual");
    }

    throw new Error("old-participant-not-found");
  }

  await writeSupabaseAdmin(
    `season_teams?id=eq.${encodeURIComponent(participantId)}&or=(manual_override.is.false,manual_override.is.null)`,
    {
      method: "DELETE"
    }
  );
}

async function removeTeam(formData: FormData) {
  const teamId = cleanText(formData.get("team_id"));
  const countryId = cleanText(formData.get("country_id"));

  if (!teamId || !countryId) {
    throw new Error("missing-fields");
  }

  const teamParticipantsPath = `season_teams?select=id&team_id=eq.${encodeURIComponent(teamId)}`;
  const manualTeamParticipantsPath =
    `${teamParticipantsPath}&data_source=eq.manual&sync_status=eq.manual&manual_override=is.true`;

  if (await hasRows(manualTeamParticipantsPath)) {
    throw new Error("team-has-participants");
  }

  if (await hasRows(teamParticipantsPath)) {
    throw new Error("team-has-old-participants");
  }

  if (
    await hasRows(
      `matches?select=id&or=(home_team_id.eq.${encodeURIComponent(teamId)},away_team_id.eq.${encodeURIComponent(teamId)})`
    )
  ) {
    throw new Error("team-has-matches");
  }

  await writeSupabaseAdmin(
    `teams?id=eq.${encodeURIComponent(teamId)}&country_id=eq.${encodeURIComponent(countryId)}`,
    {
      method: "DELETE"
    }
  );
}

async function createMatchday(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));
  const number = cleanInteger(formData.get("number"));
  const label = cleanText(formData.get("label"));

  if (!seasonId || number === null || !label) {
    throw new Error("missing-fields");
  }

  if (
    !(await hasRows(
      `season_teams?select=id&season_id=eq.${encodeURIComponent(
        seasonId
      )}&data_source=eq.manual&sync_status=eq.manual&manual_override=is.true`
    ))
  ) {
    throw new Error("matchday-needs-participants");
  }

  if (
    await hasRows(
      `matchdays?select=id&season_id=eq.${encodeURIComponent(seasonId)}&number=eq.${encodeURIComponent(String(number))}`
    )
  ) {
    throw new Error("matchday-duplicate");
  }

  await writeSupabaseAdmin("matchdays", {
    method: "POST",
    body: JSON.stringify({
      season_id: seasonId,
      number,
      label,
      starts_on: cleanText(formData.get("starts_on")),
      ends_on: cleanText(formData.get("ends_on")),
      status: cleanMatchdayStatus(formData.get("status")),
      data_source: "manual",
      sync_status: "manual",
      manual_override: true,
      external_provider: null,
      external_id: null,
      last_synced_at: null
    })
  });
}

async function removeMatchday(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const seasonId = cleanText(formData.get("season_id"));

  if (!matchdayId || !seasonId) {
    throw new Error("missing-fields");
  }

  if (await hasRows(`matches?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}`)) {
    throw new Error("matchday-has-matches");
  }

  await writeSupabaseAdmin(
    `matchdays?id=eq.${encodeURIComponent(matchdayId)}&season_id=eq.${encodeURIComponent(seasonId)}`,
    {
      method: "DELETE"
    }
  );
}

async function saveMatchdayEditorial(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const status = cleanText(formData.get("status")) ?? "draft";
  const title = cleanText(formData.get("title"));
  const summary = cleanText(formData.get("summary"));
  const titleColor = cleanText(formData.get("title_color"));
  const imageUrl = cleanText(formData.get("image_url"));
  const headlineLinkUrl = cleanText(formData.get("headline_link_url"));
  const belowHeadlineModeValue = cleanText(formData.get("below_headline_mode")) ?? "highlights";
  const belowHeadlineMode = belowHeadlineModeValue === "roundup" ? "roundup" : "highlights";
  const belowHeadlineHeading = cleanText(formData.get("below_headline_heading"));
  const belowHeadlineHeadingColor = cleanText(formData.get("below_headline_heading_color"));
  const complementaryModeValue = cleanText(formData.get("complementary_mode")) ?? "none";
  const complementaryMode =
    complementaryModeValue === "roundup_video" || complementaryModeValue === "complementary_story"
      ? complementaryModeValue
      : "none";
  const complementaryStatusValue = cleanText(formData.get("complementary_status")) ?? "draft";
  const complementaryStatus = complementaryStatusValue === "published" ? "published" : "draft";
  const complementaryRoundupItemId = cleanText(formData.get("complementary_roundup_item_id"));
  const complementaryLabel = cleanText(formData.get("complementary_label"));
  const complementaryTitle = cleanText(formData.get("complementary_title"));
  const complementaryText = cleanText(formData.get("complementary_text"));
  const complementaryImageUrl = cleanText(formData.get("complementary_image_url"));
  const complementaryLinkUrl = cleanText(formData.get("complementary_link_url"));
  const roundupVideoHeading = cleanText(formData.get("roundup_video_heading"));
  const roundupVideoHeadingColor = cleanText(formData.get("roundup_video_heading_color"));
  const sideBlockStatusValue = cleanText(formData.get("side_block_status")) ?? "draft";
  const sideBlockStatus = sideBlockStatusValue === "published" ? "published" : "draft";
  const sideBlockType = cleanText(formData.get("side_block_type"));
  const sideBlockLabel = cleanText(formData.get("side_block_label"));
  const sideBlockTitle = cleanText(formData.get("side_block_title"));
  const sideBlockTitleColor = cleanText(formData.get("side_block_title_color"));
  const sideBlockAuthor = cleanText(formData.get("side_block_author"));
  const sideBlockText = cleanText(formData.get("side_block_text"));
  const sideBlockImageUrl = cleanText(formData.get("side_block_image_url"));
  const sideBlockLinkUrl = cleanText(formData.get("side_block_link_url"));

  if (!matchdayId || !["draft", "published"].includes(status)) {
    throw new Error("missing-fields");
  }

  if (status === "published" && !title) {
    throw new Error("editorial-title-required");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  if (
    complementaryMode === "roundup_video" &&
    complementaryRoundupItemId &&
    !(await hasRows(
      `matchday_roundup_items?select=id&id=eq.${encodeURIComponent(complementaryRoundupItemId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`
    ))
  ) {
    throw new Error("roundup-item-invalid");
  }

  const editorialPayload: Record<string, string | null> = {
    matchday_id: matchdayId,
    title,
    summary,
    title_color: titleColor,
    image_url: imageUrl,
    below_headline_mode: belowHeadlineMode,
    complementary_mode: complementaryMode,
    complementary_roundup_item_id: complementaryRoundupItemId,
    complementary_label: complementaryLabel,
    complementary_title: complementaryTitle,
    complementary_text: complementaryText,
    complementary_image_url: complementaryImageUrl,
    complementary_link_url: complementaryLinkUrl,
    complementary_status: complementaryStatus,
    status,
    updated_at: new Date().toISOString()
  };

  if (formData.has("roundup_video_heading")) {
    editorialPayload.roundup_video_heading = roundupVideoHeading;
  }

  if (formData.has("headline_link_url")) {
    editorialPayload.headline_link_url = headlineLinkUrl;
  }

  if (formData.has("roundup_video_heading_color")) {
    editorialPayload.roundup_video_heading_color = roundupVideoHeadingColor;
  }

  if (formData.has("below_headline_heading")) {
    editorialPayload.below_headline_heading = belowHeadlineHeading;
  }

  if (formData.has("below_headline_heading_color")) {
    editorialPayload.below_headline_heading_color = belowHeadlineHeadingColor;
  }

  if (formData.has("side_block_status")) {
    editorialPayload.side_block_status = sideBlockStatus;
    editorialPayload.side_block_type = sideBlockType;
    editorialPayload.side_block_label = sideBlockLabel;
    editorialPayload.side_block_title = sideBlockTitle;
    editorialPayload.side_block_title_color = sideBlockTitleColor;
    editorialPayload.side_block_author = sideBlockAuthor;
    editorialPayload.side_block_text = sideBlockText;
    editorialPayload.side_block_image_url = sideBlockImageUrl;
    editorialPayload.side_block_link_url = sideBlockLinkUrl;
  }

  await writeSupabaseAdmin("matchday_editorials?on_conflict=matchday_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(editorialPayload)
  });
}

async function setMatchdayBelowHeadlineMode(matchdayId: string, mode: "highlights" | "roundup") {
  const existingRows = await fetchSupabaseAdminTable<{ id: string }>(
    `matchday_editorials?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}&limit=1`
  );

  if (existingRows[0]) {
    await writeSupabaseAdmin(`matchday_editorials?id=eq.${encodeURIComponent(existingRows[0].id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        below_headline_mode: mode,
        updated_at: new Date().toISOString()
      })
    });
    return;
  }

  await writeSupabaseAdmin("matchday_editorials", {
    method: "POST",
    body: JSON.stringify({
      matchday_id: matchdayId,
      below_headline_mode: mode,
      status: "draft",
      updated_at: new Date().toISOString()
    })
  });
}

async function saveMatchdayHighlights(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));

  if (!matchdayId) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  for (const sortOrder of [1, 2, 3]) {
    const highlightId = cleanText(formData.get(`highlight_${sortOrder}_id`));
    const label = cleanText(formData.get(`highlight_${sortOrder}_label`));
    const title = cleanText(formData.get(`highlight_${sortOrder}_title`));
    const imageUrl = cleanText(formData.get(`highlight_${sortOrder}_image_url`));
    const linkUrl = cleanText(formData.get(`highlight_${sortOrder}_link_url`));
    const statusValue = cleanText(formData.get(`highlight_${sortOrder}_status`)) ?? "draft";
    const status = statusValue === "published" ? "published" : "draft";

    if (status === "published" && !title) {
      throw new Error("highlight-title-required");
    }

    const payload = {
      matchday_id: matchdayId,
      label,
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      sort_order: sortOrder,
      status,
      updated_at: new Date().toISOString()
    };

    if (highlightId) {
      await writeSupabaseAdmin(
        `matchday_highlights?id=eq.${encodeURIComponent(highlightId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        }
      );
      continue;
    }

    const existingRows = await fetchSupabaseAdminTable<{ id: string }>(
      `matchday_highlights?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}&sort_order=eq.${sortOrder}&limit=1`
    );

    if (existingRows[0]) {
      await writeSupabaseAdmin(`matchday_highlights?id=eq.${encodeURIComponent(existingRows[0].id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else if (label || title || imageUrl || linkUrl || status === "published") {
      await writeSupabaseAdmin("matchday_highlights", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  }

  await setMatchdayBelowHeadlineMode(matchdayId, "highlights");
}

async function saveMatchdayRoundupItems(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const allowedTypes = new Set(["video", "golos", "resumo", "noticia"]);

  if (!matchdayId) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  const existingRoundupRows = await fetchSupabaseAdminTable<{ id: string; sort_order: number; image_url: string | null }>(
    `matchday_roundup_items?select=id,sort_order,image_url&matchday_id=eq.${encodeURIComponent(matchdayId)}&limit=200`
  ).catch(() => []);
  const existingRoundupById = new Map(existingRoundupRows.map((item) => [item.id, item]));
  const existingRoundupBySortOrder = new Map(existingRoundupRows.map((item) => [item.sort_order, item]));

  for (const sortOrder of ROUNDUP_EDITOR_SORT_ORDERS) {
    const itemId = cleanText(formData.get(`roundup_${sortOrder}_id`));
    const label = cleanText(formData.get(`roundup_${sortOrder}_label`));
    const title = cleanText(formData.get(`roundup_${sortOrder}_title`));
    const subtitle = cleanText(formData.get(`roundup_${sortOrder}_subtitle`));
    const imageUrlFieldName = `roundup_${sortOrder}_image_url`;
    const existingImageUrl = itemId
      ? existingRoundupById.get(itemId)?.image_url ?? null
      : existingRoundupBySortOrder.get(sortOrder)?.image_url ?? null;
    const submittedImageUrl = formData.has(imageUrlFieldName) ? cleanText(formData.get(imageUrlFieldName)) : null;
    const imageUrl = submittedImageUrl ?? existingImageUrl;
    const videoUrl = cleanText(formData.get(`roundup_${sortOrder}_video_url`));
    const duration = cleanText(formData.get(`roundup_${sortOrder}_duration`));
    const typeValue = cleanText(formData.get(`roundup_${sortOrder}_type`)) ?? "resumo";
    const statusValue = cleanText(formData.get(`roundup_${sortOrder}_status`)) ?? "draft";
    const type = allowedTypes.has(typeValue) ? typeValue : "resumo";
    const status = statusValue === "published" ? "published" : "draft";
    const hasContent = Boolean(label || title || subtitle || imageUrl || videoUrl || duration);

    const payload = {
      matchday_id: matchdayId,
      label,
      title,
      subtitle,
      image_url: imageUrl,
      video_url: videoUrl,
      duration,
      type,
      sort_order: sortOrder,
      status,
      updated_at: new Date().toISOString()
    };

    if (!hasContent && status !== "published") {
      continue;
    }

    if (itemId) {
      await writeSupabaseAdmin(
        `matchday_roundup_items?id=eq.${encodeURIComponent(itemId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        }
      );
      continue;
    }

    const existingRows = await fetchSupabaseAdminTable<{ id: string }>(
      `matchday_roundup_items?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}&sort_order=eq.${sortOrder}&limit=1`
    );

    if (existingRows[0]) {
      await writeSupabaseAdmin(`matchday_roundup_items?id=eq.${encodeURIComponent(existingRows[0].id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else if (hasContent || status === "published") {
      await writeSupabaseAdmin("matchday_roundup_items", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  }

  await setMatchdayBelowHeadlineMode(matchdayId, "roundup");
}

async function saveMatchdayRoundupItem(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const sortOrder = cleanInteger(formData.get("roundup_sort_order"));
  const itemId = cleanText(formData.get("roundup_id"));
  const allowedTypes = new Set(["video", "golos", "resumo", "noticia"]);

  if (!matchdayId || !sortOrder || !ROUNDUP_EDITOR_SORT_ORDERS.includes(sortOrder)) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  const existingRows = itemId
    ? await fetchSupabaseAdminTable<{ id: string; image_url: string | null; video_url: string | null }>(
        `matchday_roundup_items?select=id,image_url,video_url&id=eq.${encodeURIComponent(itemId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}&limit=1`
      ).catch(() => [])
    : await fetchSupabaseAdminTable<{ id: string; image_url: string | null; video_url: string | null }>(
        `matchday_roundup_items?select=id,image_url,video_url&matchday_id=eq.${encodeURIComponent(matchdayId)}&sort_order=eq.${sortOrder}&limit=1`
      ).catch(() => []);

  const existingItem = existingRows[0] ?? null;
  const label = cleanText(formData.get("roundup_label"));
  const title = cleanText(formData.get("roundup_title"));
  const subtitle = cleanText(formData.get("roundup_subtitle"));
  const submittedImageUrl = formData.has("roundup_image_url") ? cleanText(formData.get("roundup_image_url")) : null;
  const submittedVideoUrl = formData.has("roundup_video_url") ? cleanText(formData.get("roundup_video_url")) : null;
  const imageUrl = submittedImageUrl ?? existingItem?.image_url ?? null;
  const videoUrl = submittedVideoUrl ?? existingItem?.video_url ?? null;
  const duration = cleanText(formData.get("roundup_duration"));
  const typeValue = cleanText(formData.get("roundup_type")) ?? "resumo";
  const statusValue = cleanText(formData.get("roundup_status")) ?? "draft";
  const type = allowedTypes.has(typeValue) ? typeValue : "resumo";
  const status = statusValue === "published" ? "published" : "draft";
  const hasContent = Boolean(label || title || subtitle || imageUrl || videoUrl || duration);

  if (!hasContent && status !== "published") {
    return;
  }

  const payload = {
    matchday_id: matchdayId,
    label,
    title,
    subtitle,
    image_url: imageUrl,
    video_url: videoUrl,
    duration,
    type,
    sort_order: sortOrder,
    status,
    updated_at: new Date().toISOString()
  };

  if (existingItem) {
    await writeSupabaseAdmin(
      `matchday_roundup_items?id=eq.${encodeURIComponent(existingItem.id)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
  } else {
    await writeSupabaseAdmin("matchday_roundup_items", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  await setMatchdayBelowHeadlineMode(matchdayId, "roundup");
}

async function saveMatchdayLatestNews(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const latestZoneModeValue = cleanText(formData.get("latest_zone_mode")) ?? "latest_news";
  const latestZoneMode = latestZoneModeValue === "editorial_line" ? "editorial_line" : "latest_news";
  const latestZoneTitleValue = formData.get("latest_zone_title");
  const latestZoneTitle = typeof latestZoneTitleValue === "string" ? latestZoneTitleValue.trim() : "";

  if (!matchdayId) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  await writeSupabaseAdmin("matchday_editorials?on_conflict=matchday_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      matchday_id: matchdayId,
      latest_zone_mode: latestZoneMode,
      latest_zone_title: latestZoneTitle,
      updated_at: new Date().toISOString()
    })
  });

  for (const sortOrder of LATEST_NEWS_EDITOR_SORT_ORDERS) {
    const newsId = cleanText(formData.get(`latest_news_${sortOrder}_id`));
    const timeLabel = cleanText(formData.get(`latest_news_${sortOrder}_time_label`));
    const title = cleanText(formData.get(`latest_news_${sortOrder}_title`));
    const subtitle = cleanText(formData.get(`latest_news_${sortOrder}_subtitle`));
    const imageUrl = cleanText(formData.get(`latest_news_${sortOrder}_image_url`));
    const linkUrl = cleanText(formData.get(`latest_news_${sortOrder}_link_url`));
    const rawArticleId = cleanText(formData.get(`latest_news_${sortOrder}_article_id`));
    const articleId = linkUrl?.startsWith("/noticias/") ? null : rawArticleId;
    const statusValue = cleanText(formData.get(`latest_news_${sortOrder}_status`)) ?? "draft";
    const status = statusValue === "published" ? "published" : "draft";
    const hasContent = Boolean(timeLabel || title || subtitle || imageUrl || linkUrl || articleId);

    if (status === "published" && !title) {
      throw new Error("latest-news-title-required");
    }

    if (!hasContent && status !== "published") {
      continue;
    }

    const payload = {
      matchday_id: matchdayId,
      time_label: timeLabel,
      title,
      subtitle,
      image_url: imageUrl,
      link_url: linkUrl,
      article_id: articleId,
      sort_order: sortOrder,
      status,
      updated_at: new Date().toISOString()
    };

    if (newsId) {
      await writeSupabaseAdmin(
        `matchday_latest_news?id=eq.${encodeURIComponent(newsId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        }
      );
      continue;
    }

    const existingRows = await fetchSupabaseAdminTable<{ id: string }>(
      `matchday_latest_news?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}&sort_order=eq.${sortOrder}&limit=1`
    );

    if (existingRows[0]) {
      await writeSupabaseAdmin(`matchday_latest_news?id=eq.${encodeURIComponent(existingRows[0].id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else if (hasContent || status === "published") {
      await writeSupabaseAdmin("matchday_latest_news", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  }
}

async function saveMatchdayLatestNewsItem(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const sortOrder = cleanInteger(formData.get("latest_news_sort_order"));
  const newsId = cleanText(formData.get("latest_news_id"));

  if (!matchdayId || !sortOrder || !LATEST_NEWS_EDITOR_SORT_ORDERS.includes(sortOrder)) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) {
    throw new Error("matchday-invalid");
  }

  const existingRows = newsId
    ? await fetchSupabaseAdminTable<{ id: string; article_id: string | null }>(
        `matchday_latest_news?select=id,article_id&id=eq.${encodeURIComponent(newsId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}&limit=1`
      ).catch(() => [])
    : await fetchSupabaseAdminTable<{ id: string; article_id: string | null }>(
        `matchday_latest_news?select=id,article_id&matchday_id=eq.${encodeURIComponent(matchdayId)}&sort_order=eq.${sortOrder}&limit=1`
      ).catch(() => []);

  const existingItem = existingRows[0] ?? null;
  const timeLabel = cleanText(formData.get("latest_news_time_label"));
  const title = cleanText(formData.get("latest_news_title"));
  const subtitle = cleanText(formData.get("latest_news_subtitle"));
  const imageUrl = cleanText(formData.get("latest_news_image_url"));
  const linkUrl = cleanText(formData.get("latest_news_link_url"));
  const rawArticleId = cleanText(formData.get("latest_news_article_id")) ?? existingItem?.article_id ?? null;
  const articleId = linkUrl?.startsWith("/noticias/") ? null : rawArticleId;
  const statusValue = cleanText(formData.get("latest_news_status")) ?? "draft";
  const status = statusValue === "published" ? "published" : "draft";
  const hasContent = Boolean(timeLabel || title || subtitle || imageUrl || linkUrl || articleId);

  if (status === "published" && !title) {
    throw new Error("latest-news-title-required");
  }

  if (!hasContent && status !== "published") {
    return;
  }

  const payload = {
    matchday_id: matchdayId,
    time_label: timeLabel,
    title,
    subtitle,
    image_url: imageUrl,
    link_url: linkUrl,
    article_id: articleId,
    sort_order: sortOrder,
    status,
    updated_at: new Date().toISOString()
  };

  if (existingItem) {
    await writeSupabaseAdmin(
      `matchday_latest_news?id=eq.${encodeURIComponent(existingItem.id)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
  } else {
    await writeSupabaseAdmin("matchday_latest_news", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}

function parseCalendarList(rawList: string): { rows: CalendarListRow[]; invalidLines: number } {
  const rows: CalendarListRow[] = [];
  let invalidLines = 0;

  rawList
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line.length > 0)
    .forEach(({ line, lineNumber }) => {
      const [numberValue = "", labelValue = "", homeValue = "", awayValue = "", kickoffValue = "", venueValue = ""] = line
        .split(";")
        .map((value) => value.trim());
      const matchdayNumber = Number.parseInt(numberValue, 10);
      const matchdayLabel = labelValue || (Number.isNaN(matchdayNumber) ? "" : `Jornada ${String(matchdayNumber).padStart(2, "0")}`);

      if (Number.isNaN(matchdayNumber) || matchdayNumber < 1 || !matchdayLabel || !homeValue || !awayValue || !kickoffValue) {
        invalidLines += 1;
        return;
      }

      rows.push({
        lineNumber,
        matchdayNumber,
        matchdayLabel,
        homeName: homeValue,
        awayName: awayValue,
        kickoffAt: kickoffValue,
        venue: cleanText(venueValue)
      });
    });

  return { rows, invalidLines };
}

function teamLookupKey(value: string | null | undefined) {
  return value ? slugify(value) : "";
}

function addTeamLookupKey(
  teamsByKey: Map<string, TeamRow>,
  key: string | null | undefined,
  team: TeamRow,
  options: { override?: boolean } = {}
) {
  const lookupKey = teamLookupKey(key);
  if (lookupKey && (options.override || !teamsByKey.has(lookupKey))) {
    teamsByKey.set(lookupKey, team);
  }
}

function buildTeamLookupIndex(teams: TeamRow[], aliases: TeamAliasRow[]) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const teamsByKey = new Map<string, TeamRow>();

  teams.forEach((team) => {
    addTeamLookupKey(teamsByKey, team.slug, team);
    addTeamLookupKey(teamsByKey, team.name, team);
    addTeamLookupKey(teamsByKey, team.short_name, team);
    addTeamLookupKey(teamsByKey, team.code, team);
  });

  aliases.forEach((alias) => {
    const team = teamsById.get(alias.team_id);
    if (team) {
      addTeamLookupKey(teamsByKey, alias.normalized_alias, team, { override: true });
    }
  });

  return teamsByKey;
}

function resolveTeamByInputName({
  teamsByKey,
  slug,
  name,
  shortName,
  code
}: {
  teamsByKey: Map<string, TeamRow>;
  slug?: string | null;
  name?: string | null;
  shortName?: string | null;
  code?: string | null;
}) {
  const keys = [slug, name, shortName, code];

  for (const key of keys) {
    const lookupKey = teamLookupKey(key);
    const team = lookupKey ? teamsByKey.get(lookupKey) : null;
    if (team) {
      return team;
    }
  }

  return null;
}

async function readTeamsForCountryLookup(countryId: string) {
  return fetchSupabaseAdminTable<TeamRow>(
    `teams?select=id,name,short_name,slug,code,country_id&or=(country_id.eq.${encodeURIComponent(countryId)},country_id.is.null)&limit=2000`
  );
}

async function readTeamAliasesForTeamIds(teamIds: string[]) {
  const uniqueTeamIds = Array.from(new Set(teamIds)).filter(Boolean);
  if (uniqueTeamIds.length === 0) {
    return [];
  }

  return fetchSupabaseAdminTable<TeamAliasRow>(
    `team_aliases?select=team_id,normalized_alias&team_id=in.(${uniqueTeamIds.map(encodeURIComponent).join(",")})&limit=1000`
  ).catch(() => []);
}

async function applyCalendarList(formData: FormData): Promise<CalendarApplySummary> {
  const countryId = cleanText(formData.get("country_id"));
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const rawList = cleanText(formData.get("calendar_preview"));

  if (!countryId || !competitionId || !seasonId || !rawList) {
    throw new Error("missing-fields");
  }

  if (!(await hasRows(`countries?select=id&id=eq.${encodeURIComponent(countryId)}`))) {
    throw new Error("country-not-found");
  }

  if (
    !(await hasRows(
      `competitions?select=id&id=eq.${encodeURIComponent(competitionId)}&country_id=eq.${encodeURIComponent(countryId)}`
    ))
  ) {
    throw new Error("competition-country-invalid");
  }

  if (
    !(await hasRows(
      `seasons?select=id&id=eq.${encodeURIComponent(seasonId)}&competition_id=eq.${encodeURIComponent(competitionId)}`
    ))
  ) {
    throw new Error("season-competition-invalid");
  }

  const parsed = parseCalendarList(rawList);
  const summary: CalendarApplySummary = {
    createdMatchdays: 0,
    reusedMatchdays: 0,
    createdMatches: 0,
    existingMatches: 0,
    blockedConflicts: 0,
    invalidLines: parsed.invalidLines,
    involvedMatchdays: []
  };

  const participants = await fetchSupabaseAdminTable<ManualParticipantRow>(
    `season_teams?select=team_id&season_id=eq.${encodeURIComponent(
      seasonId
    )}&data_source=eq.manual&sync_status=eq.manual&manual_override=is.true&limit=500`
  );
  const participantTeamIds = Array.from(new Set(participants.map((participant) => participant.team_id)));

  if (participantTeamIds.length === 0) {
    throw new Error("matchday-needs-participants");
  }

  const teamsQuery = participantTeamIds.map((id) => encodeURIComponent(id)).join(",");
  const teams = await fetchSupabaseAdminTable<TeamRow>(
    `teams?select=id,name,short_name,slug,code,country_id&id=in.(${teamsQuery})&country_id=eq.${encodeURIComponent(countryId)}&limit=500`
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const teamsByKey = new Map<string, TeamRow>();
  teams.forEach((team) => {
    addTeamLookupKey(teamsByKey, team.name, team);
    addTeamLookupKey(teamsByKey, team.short_name, team);
    addTeamLookupKey(teamsByKey, team.slug, team);
    addTeamLookupKey(teamsByKey, team.code, team);
  });
  const teamAliases = await fetchSupabaseAdminTable<TeamAliasRow>(
    `team_aliases?select=team_id,normalized_alias&team_id=in.(${teamsQuery})&limit=1000`
  ).catch(() => []);
  teamAliases.forEach((alias) => {
    const team = teamsById.get(alias.team_id);
    if (team) {
      addTeamLookupKey(teamsByKey, alias.normalized_alias, team, { override: true });
    }
  });

  const matchdayRows = await fetchSupabaseAdminTable<CalendarMatchdayRow>(
    `matchdays?select=id,number,label&season_id=eq.${encodeURIComponent(seasonId)}&manual_override=is.true&limit=500`
  );
  const matchdaysByNumber = new Map(matchdayRows.map((matchday) => [matchday.number, matchday]));
  const involvedMatchdaysByNumber = new Map<number, CalendarMatchdayRow>();
  const seenCreatedOrReusedMatchdays = new Set<number>();
  const existingMatches = await fetchSupabaseAdminTable<ExistingCalendarMatchRow>(
    `matches?select=id,matchday_id,home_team_id,away_team_id&season_id=eq.${encodeURIComponent(seasonId)}&limit=1000`
  );
  const matchdayNumberById = new Map(matchdayRows.map((matchday) => [matchday.id, matchday.number]));
  const usedTeamsByMatchday = new Map<number, Set<string>>();
  const existingMatchKeys = new Set<string>();
  const existingSeasonMatchKeys = new Set<string>();

  existingMatches.forEach((match) => {
    existingSeasonMatchKeys.add(`${match.home_team_id}:${match.away_team_id}`);
    if (!match.matchday_id) return;
    const number = matchdayNumberById.get(match.matchday_id);
    if (!number) return;

    const usedTeams = usedTeamsByMatchday.get(number) ?? new Set<string>();
    usedTeams.add(match.home_team_id);
    usedTeams.add(match.away_team_id);
    usedTeamsByMatchday.set(number, usedTeams);
    existingMatchKeys.add(`${number}:${match.home_team_id}:${match.away_team_id}`);
  });

  const seenMatchKeys = new Set<string>();
  const seenSeasonMatchKeys = new Set<string>();

  for (const row of parsed.rows) {
    const homeTeam = teamsByKey.get(teamLookupKey(row.homeName));
    const awayTeam = teamsByKey.get(teamLookupKey(row.awayName));

    if (!homeTeam || !awayTeam) {
      summary.blockedConflicts += 1;
      continue;
    }

    if (homeTeam.id === awayTeam.id) {
      summary.blockedConflicts += 1;
      continue;
    }

    const matchKey = `${row.matchdayNumber}:${homeTeam.id}:${awayTeam.id}`;
    const seasonMatchKey = `${homeTeam.id}:${awayTeam.id}`;
    if (existingMatchKeys.has(matchKey)) {
      const existingMatchday = matchdaysByNumber.get(row.matchdayNumber);
      if (existingMatchday) {
        involvedMatchdaysByNumber.set(row.matchdayNumber, existingMatchday);
      }
      summary.existingMatches += 1;
      continue;
    }

    if (existingSeasonMatchKeys.has(seasonMatchKey) || seenMatchKeys.has(matchKey) || seenSeasonMatchKeys.has(seasonMatchKey)) {
      summary.blockedConflicts += 1;
      continue;
    }

    const usedTeams = usedTeamsByMatchday.get(row.matchdayNumber) ?? new Set<string>();
    if (usedTeams.has(homeTeam.id) || usedTeams.has(awayTeam.id)) {
      summary.blockedConflicts += 1;
      continue;
    }

    let matchday = matchdaysByNumber.get(row.matchdayNumber);
    if (!matchday) {
      const createdMatchdays = await writeSupabaseAdminReturning<CalendarMatchdayRow>("matchdays", {
        method: "POST",
        body: JSON.stringify({
          season_id: seasonId,
          number: row.matchdayNumber,
          label: row.matchdayLabel,
          status: "scheduled",
          data_source: "manual",
          sync_status: "manual",
          manual_override: true,
          external_provider: null,
          external_id: null,
          last_synced_at: null
        })
      });
      matchday = createdMatchdays[0];
      if (!matchday) {
        summary.blockedConflicts += 1;
        continue;
      }
      matchdaysByNumber.set(row.matchdayNumber, matchday);
      summary.createdMatchdays += 1;
    } else if (!seenCreatedOrReusedMatchdays.has(row.matchdayNumber)) {
      summary.reusedMatchdays += 1;
    }

    seenCreatedOrReusedMatchdays.add(row.matchdayNumber);
    involvedMatchdaysByNumber.set(row.matchdayNumber, matchday);
    seenMatchKeys.add(matchKey);
    seenSeasonMatchKeys.add(seasonMatchKey);
    usedTeams.add(homeTeam.id);
    usedTeams.add(awayTeam.id);
    usedTeamsByMatchday.set(row.matchdayNumber, usedTeams);

    await writeSupabaseAdmin("matches", {
      method: "POST",
      body: JSON.stringify({
        source_key: `manual-calendar-${Date.now()}-${row.lineNumber}`,
        competition_id: competitionId,
        season_id: seasonId,
        matchday_id: matchday.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        kickoff_at: normalizeKickoff(row.kickoffAt),
        venue: row.venue,
        status: "scheduled",
        data_source: "manual",
        sync_status: "manual",
        manual_override: true,
        external_provider: null,
        external_id: null,
        external_match_id: null,
        last_synced_at: null
      })
    });
    summary.createdMatches += 1;
  }

  if (summary.createdMatches === 0 && summary.existingMatches === 0) {
    throw new Error("calendar-list-invalid");
  }

  summary.involvedMatchdays = Array.from(involvedMatchdaysByNumber.values()).sort((a, b) => a.number - b.number);

  return summary;
}

async function readAgendaMatch(formData: FormData): Promise<AgendaMatchRow> {
  const matchId = cleanText(formData.get("match_id"));
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const matchdayId = cleanText(formData.get("matchday_id"));

  if (!matchId || !competitionId || !seasonId || !matchdayId) {
    throw new Error("missing-fields");
  }

  const rows = await fetchSupabaseAdminTable<AgendaMatchRow>(
    `matches?select=id,competition_id,season_id,matchday_id,status,minute,home_score,away_score,broadcast_channel_id&id=eq.${encodeURIComponent(
      matchId
    )}&competition_id=eq.${encodeURIComponent(competitionId)}&season_id=eq.${encodeURIComponent(
      seasonId
    )}&matchday_id=eq.${encodeURIComponent(matchdayId)}&manual_override=is.true&limit=1`
  );
  const match = rows[0];

  if (!match) {
    throw new Error("match-not-found");
  }

  return match;
}

function assertSimpleScheduledMatch(match: AgendaMatchRow, action: "edit" | "remove" = "edit") {
  if (match.status === "finished" || match.home_score !== null || match.away_score !== null) {
    throw new Error(action === "remove" ? "match-has-result-remove" : "match-has-result-edit");
  }

  if (
    match.status !== "scheduled" ||
    match.minute !== null ||
    match.broadcast_channel_id !== null
  ) {
    throw new Error("match-not-simple");
  }
}

async function assertMatchTeamsAreManualParticipants(seasonId: string, homeTeamId: string, awayTeamId: string) {
  const participantBasePath =
    `season_teams?select=id&season_id=eq.${encodeURIComponent(
      seasonId
    )}&data_source=eq.manual&sync_status=eq.manual&manual_override=is.true`;

  const homeIsParticipant = await hasRows(`${participantBasePath}&team_id=eq.${encodeURIComponent(homeTeamId)}`);
  const awayIsParticipant = await hasRows(`${participantBasePath}&team_id=eq.${encodeURIComponent(awayTeamId)}`);

  if (!homeIsParticipant || !awayIsParticipant) {
    throw new Error("match-team-not-participant");
  }
}

async function assertTeamsFreeInMatchday(
  matchdayId: string,
  homeTeamId: string,
  awayTeamId: string,
  ignoredMatchId?: string | null
) {
  const matches = await fetchSupabaseAdminTable<MatchdayTeamUse>(
    `matches?select=id,home_team_id,away_team_id&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&manual_override=is.true`
  );
  const usedInOtherMatch = matches.some(
    (match) =>
      match.id !== ignoredMatchId &&
      (match.home_team_id === homeTeamId ||
        match.away_team_id === homeTeamId ||
        match.home_team_id === awayTeamId ||
        match.away_team_id === awayTeamId)
  );

  if (usedInOtherMatch) {
    throw new Error("match-team-already-in-matchday");
  }
}

async function assertUniqueSeasonMatch(
  seasonId: string,
  homeTeamId: string,
  awayTeamId: string,
  ignoredMatchId?: string | null
) {
  const matches = await fetchSupabaseAdminTable<{ id: string }>(
    `matches?select=id&season_id=eq.${encodeURIComponent(seasonId)}&home_team_id=eq.${encodeURIComponent(
      homeTeamId
    )}&away_team_id=eq.${encodeURIComponent(awayTeamId)}`
  );
  const duplicate = matches.some((match) => match.id !== ignoredMatchId);

  if (duplicate) {
    throw new Error("match-duplicate-season");
  }
}

async function hasMatchDependencies(matchId: string) {
  const encodedMatchId = encodeURIComponent(matchId);

  if (await hasRows(`match_events?select=id&match_id=eq.${encodedMatchId}`)) return true;
  if (await hasRows(`goals?select=id&match_id=eq.${encodedMatchId}`)) return true;
  if (await hasRows(`live_updates?select=id&match_id=eq.${encodedMatchId}`)) return true;
  if (await hasRows(`articles?select=id&match_id=eq.${encodedMatchId}`)) return true;
  if (await hasRows(`headlines?select=id&match_id=eq.${encodedMatchId}`)) return true;

  return false;
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

  if (homeTeamId === awayTeamId) {
    throw new Error("match-team-same");
  }

  if (!(await hasRows(`seasons?select=id&id=eq.${encodeURIComponent(seasonId)}&competition_id=eq.${encodeURIComponent(competitionId)}`))) {
    throw new Error("match-missing-context");
  }

  if (
    !(await hasRows(
      `matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}&season_id=eq.${encodeURIComponent(
        seasonId
      )}&manual_override=is.true`
    ))
  ) {
    throw new Error("matchday-invalid");
  }

  await assertMatchTeamsAreManualParticipants(seasonId, homeTeamId, awayTeamId);
  await assertUniqueSeasonMatch(seasonId, homeTeamId, awayTeamId);
  await assertTeamsFreeInMatchday(matchdayId, homeTeamId, awayTeamId);

  await writeSupabaseAdmin("matches", {
    method: "POST",
    body: JSON.stringify({
      source_key: `manual-${Date.now()}`,
      competition_id: competitionId,
      season_id: seasonId,
      matchday_id: matchdayId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_at: kickoffAt,
      venue: cleanText(formData.get("venue")),
      status: "scheduled",
      data_source: "manual",
      sync_status: "manual",
      manual_override: true,
      external_provider: null,
      external_id: null,
      external_match_id: null,
      last_synced_at: null
    })
  });
}

async function updateMatch(formData: FormData) {
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const matchdayId = cleanText(formData.get("matchday_id"));
  const matchId = cleanText(formData.get("match_id"));
  const homeTeamId = cleanText(formData.get("home_team_id"));
  const awayTeamId = cleanText(formData.get("away_team_id"));
  const kickoffAt = normalizeKickoff(cleanText(formData.get("kickoff_at")));

  if (!competitionId || !seasonId || !matchdayId || !matchId || !homeTeamId || !awayTeamId || !kickoffAt) {
    throw new Error("missing-fields");
  }

  if (homeTeamId === awayTeamId) {
    throw new Error("match-team-same");
  }

  const match = await readAgendaMatch(formData);
  assertSimpleScheduledMatch(match, "edit");

  if (
    !(await hasRows(
      `matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}&season_id=eq.${encodeURIComponent(
        seasonId
      )}&manual_override=is.true`
    ))
  ) {
    throw new Error("matchday-invalid");
  }

  await assertMatchTeamsAreManualParticipants(seasonId, homeTeamId, awayTeamId);
  await assertUniqueSeasonMatch(seasonId, homeTeamId, awayTeamId, matchId);
  await assertTeamsFreeInMatchday(matchdayId, homeTeamId, awayTeamId, matchId);

  await writeSupabaseAdmin(
    `matches?id=eq.${encodeURIComponent(matchId)}&competition_id=eq.${encodeURIComponent(
      competitionId
    )}&season_id=eq.${encodeURIComponent(seasonId)}&matchday_id=eq.${encodeURIComponent(matchdayId)}&manual_override=is.true`,
    {
      method: "PATCH",
      body: JSON.stringify({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        kickoff_at: kickoffAt,
        venue: cleanText(formData.get("venue")),
        status: "scheduled",
        data_source: "manual",
        sync_status: "manual",
        manual_override: true
      })
    }
  );
}

async function removeMatch(formData: FormData) {
  const matchId = cleanText(formData.get("match_id"));

  if (!matchId) {
    throw new Error("missing-fields");
  }

  const match = await readAgendaMatch(formData);
  assertSimpleScheduledMatch(match, "remove");

  if (await hasMatchDependencies(matchId)) {
    throw new Error("match-has-dependencies");
  }

  await writeSupabaseAdmin(
    `matches?id=eq.${encodeURIComponent(matchId)}&competition_id=eq.${encodeURIComponent(
      match.competition_id
    )}&season_id=eq.${encodeURIComponent(match.season_id)}&matchday_id=eq.${encodeURIComponent(
      match.matchday_id ?? ""
    )}&status=eq.scheduled&manual_override=is.true&minute=is.null&home_score=is.null&away_score=is.null&broadcast_channel_id=is.null`,
    {
      method: "DELETE"
    }
  );
}

async function clearSeasonCalendar(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));

  if (!seasonId) {
    throw new Error("missing-fields");
  }

  const encodedSeasonId = encodeURIComponent(seasonId);
  let matches: MatchIdRow[] = [];
  let matchdays: MatchdayIdRow[] = [];

  await runClearSeasonStep("ler jogos da epoca selecionada", async () => {
    matches = await fetchSupabaseAdminTable<MatchIdRow>(
      `matches?select=id&season_id=eq.${encodedSeasonId}&limit=500`
    );
  });

  await runClearSeasonStep("ler jornadas da epoca selecionada", async () => {
    matchdays = await fetchSupabaseAdminTable<MatchdayIdRow>(
      `matchdays?select=id&season_id=eq.${encodedSeasonId}&limit=5000`
    );
  });

  while (matches.length > 0) {
    for (const matchChunk of chunkRows(matches, 100)) {
      const matchIds = matchChunk.map((match) => match.id);
      const matchList = encodedInList(matchIds);
      const matchFilter = `match_id=in.(${matchList})`;

      await runClearSeasonStep("apagar dependencias por match_id", async () => {
        await deleteExistingOptionalRows("headlines", matchFilter, "headlines.match_id");
        await deleteExistingOptionalRows("articles", matchFilter, "articles.match_id");
        await deleteExistingOptionalRows("live_updates", matchFilter, "live_updates.match_id");
        await deleteExistingOptionalRows("match_events", matchFilter, "match_events.match_id");
        await deleteExistingOptionalRows("goals", matchFilter, "goals.match_id");
      });

      await runClearSeasonStep("apagar matches", async () => {
        await deleteRows(`matches?id=in.(${matchList})&season_id=eq.${encodedSeasonId}`);
      });
    }

    await runClearSeasonStep("confirmar jogos restantes da epoca selecionada", async () => {
      matches = await fetchSupabaseAdminTable<MatchIdRow>(
        `matches?select=id&season_id=eq.${encodedSeasonId}&limit=500`
      );
    });
  }

  for (const matchdayChunk of chunkRows(matchdays, 100)) {
    const matchdayIds = matchdayChunk.map((matchday) => matchday.id);
    const matchdayList = encodedInList(matchdayIds);
    const matchdayFilter = `matchday_id=in.(${matchdayList})`;

    await runClearSeasonStep("apagar editoriais das jornadas", async () => {
      await deleteExistingOptionalRows("matchday_editorials", matchdayFilter, "matchday_editorials.matchday_id");
    });
  }

  await runClearSeasonStep("apagar matchdays", async () => {
    await deleteRows(`matchdays?season_id=eq.${encodedSeasonId}`);
  });

  await runClearSeasonStep("apagar participantes", async () => {
    await deleteRows(`season_teams?season_id=eq.${encodedSeasonId}`);
  });
}

async function finishMatch(formData: FormData) {
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));
  const matchdayId = cleanText(formData.get("matchday_id"));
  const matchId = cleanText(formData.get("match_id"));
  const homeScore = cleanScore(formData.get("home_score"));
  const awayScore = cleanScore(formData.get("away_score"));

  if (!competitionId || !seasonId || !matchdayId || !matchId || homeScore === null || awayScore === null) {
    throw new Error("match-score-invalid");
  }

  if (!(await hasRows(`seasons?select=id&id=eq.${encodeURIComponent(seasonId)}&competition_id=eq.${encodeURIComponent(competitionId)}`))) {
    throw new Error("match-missing-context");
  }

  if (
    !(await hasRows(
      `matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}&season_id=eq.${encodeURIComponent(
        seasonId
      )}&manual_override=is.true`
    ))
  ) {
    throw new Error("matchday-invalid");
  }

  await readAgendaMatch(formData);

  await writeSupabaseAdmin(
    `matches?id=eq.${encodeURIComponent(matchId)}&competition_id=eq.${encodeURIComponent(
      competitionId
    )}&season_id=eq.${encodeURIComponent(seasonId)}&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&manual_override=is.true`,
    {
      method: "PATCH",
      body: JSON.stringify({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
        data_source: "manual",
        sync_status: "manual",
        manual_override: true
      })
    }
  );
}

async function removeSeason(formData: FormData) {
  const seasonId = cleanText(formData.get("season_id"));

  if (!seasonId) {
    throw new Error("missing-fields");
  }

  await clearSeasonCalendar(formData);

  await runClearSeasonStep("apagar epoca", async () => {
    await writeSupabaseAdmin(`seasons?id=eq.${encodeURIComponent(seasonId)}`, {
      method: "DELETE"
    });
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
  let createdValue = actionType ?? "1";
  let extraParams: Record<string, string> | undefined;

  try {
    if (actionType === "country") {
      await createCountry(formData);
    } else if (actionType === "competition") {
      await createCompetition(formData);
    } else if (actionType === "season") {
      await createSeason(formData);
    } else if (actionType === "team") {
      await createTeam(formData);
    } else if (actionType === "attach_team_to_country") {
      await attachTeamToCountry(formData);
    } else if (actionType === "participant") {
      await createParticipant(formData);
    } else if (actionType === "apply_club_list") {
      const summary = await applyClubList(formData);
      extraParams = { club_apply_summary: JSON.stringify(summary) };
    } else if (actionType === "remove_participant") {
      await removeParticipant(formData);
    } else if (actionType === "remove_all_participants") {
      await removeAllParticipants(formData);
    } else if (actionType === "remove_old_participant") {
      await removeOldParticipant(formData);
    } else if (actionType === "remove_team") {
      await removeTeam(formData);
    } else if (actionType === "matchday") {
      await createMatchday(formData);
    } else if (actionType === "apply_calendar_list") {
      const summary = await applyCalendarList(formData);
      extraParams = { calendar_apply_summary: JSON.stringify(summary) };
    } else if (actionType === "remove_matchday") {
      await removeMatchday(formData);
    } else if (actionType === "save_matchday_editorial") {
      await saveMatchdayEditorial(formData);
    } else if (actionType === "save_matchday_highlights") {
      await saveMatchdayHighlights(formData);
    } else if (actionType === "save_matchday_roundup_items") {
      await saveMatchdayRoundupItems(formData);
    } else if (actionType === "save_matchday_roundup_item") {
      await saveMatchdayRoundupItem(formData);
    } else if (actionType === "save_matchday_latest_news") {
      await saveMatchdayLatestNews(formData);
    } else if (actionType === "save_matchday_latest_news_item") {
      await saveMatchdayLatestNewsItem(formData);
    } else if (actionType === "match") {
      await createMatch(formData);
    } else if (actionType === "update_match") {
      await updateMatch(formData);
    } else if (actionType === "remove_match") {
      await removeMatch(formData);
    } else if (actionType === "clear_season_calendar") {
      await clearSeasonCalendar(formData);
    } else if (actionType === "finish_match") {
      await finishMatch(formData);
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
    if (error instanceof ClearSeasonCalendarError) {
      console.error("[admin/gestor] clear_season_calendar failed:", error.detail);
      return returnUrl(request, formData, "error", error.message, {
        clear_calendar_error_detail: error.detail
      });
    }

    if (actionType === "save_matchday_latest_news" || actionType === "save_matchday_latest_news_item") {
      return returnUrl(request, formData, "error", "latest-news-save-failed", {
        latest_news_error_detail: shortActionError(error)
      });
    }

    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "save");
  }

  return returnUrl(request, formData, "created", createdValue, extraParams);
}
