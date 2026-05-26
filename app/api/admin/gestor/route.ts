import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin, writeSupabaseAdminReturning } from "@/lib/supabase";

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
  country_id: string | null;
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
  const safeReturnTo = rawReturnTo?.startsWith("/admin/gestor") ? rawReturnTo : "/admin/gestor";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.delete("club_apply_summary");
  url.searchParams.delete("calendar_apply_summary");
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

function isForeignKeyError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes('"code":"23503"');
}

async function deleteOptionalRows(path: string, label: string) {
  try {
    await deleteRows(path);
  } catch (error) {
    if (isMissingOptionalRelationError(error)) {
      console.warn(`[admin/gestor] clear_season_calendar skipped optional dependency ${label}:`, error);
      return;
    }

    throw error;
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

  for (const row of parsed.rows) {
    const existingTeams = await fetchSupabaseAdminTable<TeamRow>(
      `teams?select=id,name,short_name,slug,country_id&slug=eq.${encodeURIComponent(row.slug)}&limit=1`
    );
    let team = existingTeams[0];

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

  if (!matchdayId || !["draft", "published"].includes(status)) {
    throw new Error("missing-fields");
  }

  if (status === "published" && !title) {
    throw new Error("editorial-title-required");
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
      title,
      summary,
      title_color: titleColor,
      status,
      updated_at: new Date().toISOString()
    })
  });
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
    `teams?select=id,name,short_name,slug,country_id&id=in.(${teamsQuery})&country_id=eq.${encodeURIComponent(countryId)}&limit=500`
  );
  const teamsByKey = new Map<string, TeamRow>();
  teams.forEach((team) => {
    teamsByKey.set(teamLookupKey(team.name), team);
    teamsByKey.set(team.slug, team);
    if (team.short_name) {
      teamsByKey.set(teamLookupKey(team.short_name), team);
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

  try {
    const encodedSeasonId = encodeURIComponent(seasonId);
    let matches = await fetchSupabaseAdminTable<MatchIdRow>(
      `matches?select=id&season_id=eq.${encodedSeasonId}&limit=500`
    );

    while (matches.length > 0) {
      for (const matchChunk of chunkRows(matches, 100)) {
        const matchIds = matchChunk.map((match) => match.id);
        const matchList = encodedInList(matchIds);
        const matchFilter = `match_id=in.(${matchList})`;

        await deleteOptionalRows(`headlines?${matchFilter}`, "headlines.match_id");
        await deleteOptionalRows(`articles?${matchFilter}`, "articles.match_id");
        await deleteOptionalRows(`live_updates?${matchFilter}`, "live_updates.match_id");
        await deleteOptionalRows(`match_events?${matchFilter}`, "match_events.match_id");
        await deleteOptionalRows(`goals?${matchFilter}`, "goals.match_id");
        await deleteRows(`matches?id=in.(${matchList})&season_id=eq.${encodedSeasonId}`);
      }

      matches = await fetchSupabaseAdminTable<MatchIdRow>(
        `matches?select=id&season_id=eq.${encodedSeasonId}&limit=500`
      );
    }

    await deleteRows(`matchdays?season_id=eq.${encodedSeasonId}`);
  } catch (error) {
    console.error(`[admin/gestor] clear_season_calendar failed for season ${seasonId}:`, error);

    if (isForeignKeyError(error)) {
      throw new Error("clear-season-calendar-fk");
    }

    throw new Error("clear-season-calendar-failed");
  }
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
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "save");
  }

  return returnUrl(request, formData, "created", createdValue, extraParams);
}
