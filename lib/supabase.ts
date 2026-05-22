import type { BroadcastOverride } from "@/lib/jornada";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseServiceConfig = {
  url: string;
  serviceRoleKey: string;
};

export type SupabaseCompetition = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
  is_active: boolean;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseSeason = {
  id: string;
  competition_id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseMatchday = {
  id: string;
  season_id: string;
  number: number;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  status: string;
  context_summary: string | null;
  editorial_title?: string | null;
  editorial_summary?: string | null;
  hero_image_url?: string | null;
  video_url?: string | null;
  display_order?: number | null;
  is_featured?: boolean | null;
  memory_note?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseTeam = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
  primary_color: string | null;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseBroadcastChannel = {
  id: string;
  name: string;
  platform: string | null;
  country: string | null;
  logo_url: string | null;
};

export type SupabaseMatch = {
  id: string;
  source_key?: string | null;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  home_team_id: string;
  away_team_id: string;
  status: string;
  minute: number | null;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  broadcast_channel_id: string | null;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  external_match_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseAdminMatch = SupabaseMatch & {
  competition: SupabaseCompetition | null;
  season: SupabaseSeason | null;
  matchday: SupabaseMatchday | null;
  homeTeam: SupabaseTeam | null;
  awayTeam: SupabaseTeam | null;
  broadcastChannel: SupabaseBroadcastChannel | null;
};

export type SupabaseAdminMatchday = SupabaseMatchday & {
  season: SupabaseSeason | null;
  competition: SupabaseCompetition | null;
  matchCount: number;
  articleCount: number;
  headlineCount: number;
};

export type SupabaseStanding = {
  id: string;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  moment_label: string | null;
  generated_at: string;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseStandingRow = {
  id: string;
  standing_id: string;
  team_id: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  home_played: number;
  home_wins: number;
  home_draws: number;
  home_losses: number;
  away_played: number;
  away_wins: number;
  away_draws: number;
  away_losses: number;
  data_source?: string | null;
  external_provider?: string | null;
  external_id?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  manual_override?: boolean | null;
};

export type SupabaseAdminStandingRow = SupabaseStandingRow & {
  team: SupabaseTeam | null;
};

export type SupabaseAdminStanding = SupabaseStanding & {
  competition: SupabaseCompetition | null;
  season: SupabaseSeason | null;
  matchday: SupabaseMatchday | null;
  rows: SupabaseAdminStandingRow[];
};

export type AdminOverview = {
  configured: boolean;
  error?: string;
  competitions: SupabaseCompetition[];
  matchdays: SupabaseAdminMatchday[];
  teams: SupabaseTeam[];
  broadcastChannels: SupabaseBroadcastChannel[];
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

async function fetchSupabaseTable<T>(path: string): Promise<T[]> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase environment variables are missing.");
  }

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase request failed with status ${response.status}`);
  }

  return response.json() as Promise<T[]>;
}

async function fetchSupabaseAdminTable<T>(path: string): Promise<T[]> {
  const config = getSupabaseServiceConfig();

  if (!config) {
    throw new Error("Supabase service role key is missing.");
  }

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase request failed with status ${response.status}`);
  }

  return response.json() as Promise<T[]>;
}

export async function writeSupabaseAdmin(path: string, init: RequestInit): Promise<void> {
  const config = getSupabaseServiceConfig();

  if (!config) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(endpoint, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase request failed with status ${response.status}`);
  }
}

export async function getAdminTeams(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  teams: SupabaseTeam[];
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      teams: []
    };
  }

  try {
    const teams = writeConfigured
      ? await fetchSupabaseAdminTable<SupabaseTeam>(
          "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
        )
      : await fetchSupabaseTable<SupabaseTeam>(
          "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
        );

    return {
      configured: true,
      writeConfigured,
      teams
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler clubes.",
      teams: []
    };
  }
}

export async function getAdminBroadcastChannels(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  broadcastChannels: SupabaseBroadcastChannel[];
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      broadcastChannels: []
    };
  }

  try {
    const broadcastChannels = writeConfigured
      ? await fetchSupabaseAdminTable<SupabaseBroadcastChannel>(
          "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
        )
      : await fetchSupabaseTable<SupabaseBroadcastChannel>(
          "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
        );

    return {
      configured: true,
      writeConfigured,
      broadcastChannels
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler canais TV.",
      broadcastChannels: []
    };
  }
}

function mapById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export async function getAdminMatchesTv(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  matches: SupabaseAdminMatch[];
  broadcastChannels: SupabaseBroadcastChannel[];
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      matches: [],
      broadcastChannels: []
    };
  }

  try {
    const readTable = writeConfigured ? fetchSupabaseAdminTable : fetchSupabaseTable;
    const [matches, competitions, teams, broadcastChannels] = await Promise.all([
      readTable<SupabaseMatch>(
        "matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id&order=kickoff_at.asc&limit=120"
      ),
      readTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      readTable<SupabaseTeam>(
        "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
      ),
      readTable<SupabaseBroadcastChannel>(
        "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
      )
    ]);

    const competitionsById = mapById(competitions);
    const teamsById = mapById(teams);
    const channelsById = mapById(broadcastChannels);

    return {
      configured: true,
      writeConfigured,
      matches: matches.map((match) => ({
        ...match,
        competition: competitionsById.get(match.competition_id) ?? null,
        season: null,
        matchday: null,
        homeTeam: teamsById.get(match.home_team_id) ?? null,
        awayTeam: teamsById.get(match.away_team_id) ?? null,
        broadcastChannel: match.broadcast_channel_id ? channelsById.get(match.broadcast_channel_id) ?? null : null
      })),
      broadcastChannels
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler jogos.",
      matches: [],
      broadcastChannels: []
    };
  }
}

export async function getAdminMatchesEditor(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  matches: SupabaseAdminMatch[];
  competitions: SupabaseCompetition[];
  seasons: SupabaseSeason[];
  matchdays: SupabaseMatchday[];
  teams: SupabaseTeam[];
  broadcastChannels: SupabaseBroadcastChannel[];
  syncMetadataAvailable: boolean;
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      matches: [],
      competitions: [],
      seasons: [],
      matchdays: [],
      teams: [],
      broadcastChannels: [],
      syncMetadataAvailable: false
    };
  }

  try {
    const readTable = writeConfigured ? fetchSupabaseAdminTable : fetchSupabaseTable;
    let syncMetadataAvailable = true;
    let matches: SupabaseMatch[] = [];
    const matchSelectBase =
      "id,source_key,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id";
    const matchSelectWithSync =
      `${matchSelectBase},data_source,external_provider,external_id,external_match_id,last_synced_at,sync_status,manual_override`;

    try {
      matches = await readTable<SupabaseMatch>(`matches?select=${matchSelectWithSync}&order=kickoff_at.asc&limit=160`);
    } catch {
      syncMetadataAvailable = false;
      matches = await readTable<SupabaseMatch>(`matches?select=${matchSelectBase}&order=kickoff_at.asc&limit=160`);
    }

    const [competitions, seasons, matchdays, teams, broadcastChannels] = await Promise.all([
      readTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      readTable<SupabaseSeason>(
        "seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"
      ),
      readTable<SupabaseMatchday>(
        "matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&order=number.asc"
      ),
      readTable<SupabaseTeam>(
        "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
      ),
      readTable<SupabaseBroadcastChannel>(
        "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
      )
    ]);

    const competitionsById = mapById(competitions);
    const seasonsById = mapById(seasons);
    const matchdaysById = mapById(matchdays);
    const teamsById = mapById(teams);
    const channelsById = mapById(broadcastChannels);

    return {
      configured: true,
      writeConfigured,
      matches: matches.map((match) => ({
        ...match,
        competition: competitionsById.get(match.competition_id) ?? null,
        season: seasonsById.get(match.season_id) ?? null,
        matchday: match.matchday_id ? matchdaysById.get(match.matchday_id) ?? null : null,
        homeTeam: teamsById.get(match.home_team_id) ?? null,
        awayTeam: teamsById.get(match.away_team_id) ?? null,
        broadcastChannel: match.broadcast_channel_id ? channelsById.get(match.broadcast_channel_id) ?? null : null
      })),
      competitions,
      seasons,
      matchdays,
      teams,
      broadcastChannels,
      syncMetadataAvailable
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler jogos.",
      matches: [],
      competitions: [],
      seasons: [],
      matchdays: [],
      teams: [],
      broadcastChannels: [],
      syncMetadataAvailable: false
    };
  }
}

type MatchdayLinkedRecord = {
  id: string;
  matchday_id: string | null;
};

function countByMatchday(items: MatchdayLinkedRecord[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    if (!item.matchday_id) {
      continue;
    }

    counts.set(item.matchday_id, (counts.get(item.matchday_id) ?? 0) + 1);
  }

  return counts;
}

export async function getAdminMatchdaysEditor(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  matchdays: SupabaseAdminMatchday[];
  competitions: SupabaseCompetition[];
  seasons: SupabaseSeason[];
  editorialFieldsAvailable: boolean;
  syncMetadataAvailable: boolean;
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      matchdays: [],
      competitions: [],
      seasons: [],
      editorialFieldsAvailable: false,
      syncMetadataAvailable: false
    };
  }

  try {
    const readTable = writeConfigured ? fetchSupabaseAdminTable : fetchSupabaseTable;
    const matchdaySelectBase = "id,season_id,number,label,starts_on,ends_on,status,context_summary";
    const editorialSelect =
      "editorial_title,editorial_summary,hero_image_url,video_url,display_order,is_featured,memory_note,seo_title,seo_description";
    const syncSelect = "data_source,external_provider,external_id,last_synced_at,sync_status,manual_override";
    let matchdays: SupabaseMatchday[] = [];
    let editorialFieldsAvailable = true;
    let syncMetadataAvailable = true;

    try {
      matchdays = await readTable<SupabaseMatchday>(
        `matchdays?select=${matchdaySelectBase},${editorialSelect},${syncSelect}&order=number.asc`
      );
    } catch {
      try {
        editorialFieldsAvailable = false;
        matchdays = await readTable<SupabaseMatchday>(
          `matchdays?select=${matchdaySelectBase},${syncSelect}&order=number.asc`
        );
      } catch {
        syncMetadataAvailable = false;
        matchdays = await readTable<SupabaseMatchday>(
          `matchdays?select=${matchdaySelectBase}&order=number.asc`
        );
      }
    }

    const [competitions, seasons, matches] = await Promise.all([
      readTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      readTable<SupabaseSeason>(
        "seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"
      ),
      readTable<MatchdayLinkedRecord>("matches?select=id,matchday_id&matchday_id=not.is.null&limit=500")
    ]);

    const articleRows = await readTable<MatchdayLinkedRecord>(
      "articles?select=id,matchday_id&matchday_id=not.is.null&limit=500"
    ).catch(() => []);
    const headlineRows = await readTable<MatchdayLinkedRecord>(
      "headlines?select=id,matchday_id&matchday_id=not.is.null&limit=500"
    ).catch(() => []);

    const competitionsById = mapById(competitions);
    const seasonsById = mapById(seasons);
    const matchCounts = countByMatchday(matches);
    const articleCounts = countByMatchday(articleRows);
    const headlineCounts = countByMatchday(headlineRows);

    return {
      configured: true,
      writeConfigured,
      matchdays: matchdays.map((matchday) => {
        const season = seasonsById.get(matchday.season_id) ?? null;
        const competition = season ? competitionsById.get(season.competition_id) ?? null : null;

        return {
          ...matchday,
          season,
          competition,
          matchCount: matchCounts.get(matchday.id) ?? 0,
          articleCount: articleCounts.get(matchday.id) ?? 0,
          headlineCount: headlineCounts.get(matchday.id) ?? 0
        };
      }),
      competitions,
      seasons,
      editorialFieldsAvailable,
      syncMetadataAvailable
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler jornadas.",
      matchdays: [],
      competitions: [],
      seasons: [],
      editorialFieldsAvailable: false,
      syncMetadataAvailable: false
    };
  }
}

export async function getAdminStandingsEditor(): Promise<{
  configured: boolean;
  writeConfigured: boolean;
  error?: string;
  standings: SupabaseAdminStanding[];
  competitions: SupabaseCompetition[];
  seasons: SupabaseSeason[];
  matchdays: SupabaseMatchday[];
  teams: SupabaseTeam[];
  syncMetadataAvailable: boolean;
}> {
  const readConfigured = Boolean(getSupabaseConfig());
  const writeConfigured = Boolean(getSupabaseServiceConfig());

  if (!readConfigured) {
    return {
      configured: false,
      writeConfigured,
      standings: [],
      competitions: [],
      seasons: [],
      matchdays: [],
      teams: [],
      syncMetadataAvailable: false
    };
  }

  try {
    const readTable = writeConfigured ? fetchSupabaseAdminTable : fetchSupabaseTable;
    const standingSelectBase = "id,competition_id,season_id,matchday_id,moment_label,generated_at";
    const rowSelectBase =
      "id,standing_id,team_id,position,played,wins,draws,losses,goals_for,goals_against,goal_difference,points,home_played,home_wins,home_draws,home_losses,away_played,away_wins,away_draws,away_losses";
    const syncSelect = "data_source,external_provider,external_id,last_synced_at,sync_status,manual_override";
    let syncMetadataAvailable = true;
    let standings: SupabaseStanding[] = [];
    let standingRows: SupabaseStandingRow[] = [];

    try {
      [standings, standingRows] = await Promise.all([
        readTable<SupabaseStanding>(`standings?select=${standingSelectBase},${syncSelect}&order=generated_at.desc&limit=80`),
        readTable<SupabaseStandingRow>(`standing_rows?select=${rowSelectBase},${syncSelect}&order=position.asc&limit=1200`)
      ]);
    } catch {
      syncMetadataAvailable = false;
      [standings, standingRows] = await Promise.all([
        readTable<SupabaseStanding>(`standings?select=${standingSelectBase}&order=generated_at.desc&limit=80`),
        readTable<SupabaseStandingRow>(`standing_rows?select=${rowSelectBase}&order=position.asc&limit=1200`)
      ]);
    }

    const [competitions, seasons, matchdays, teams] = await Promise.all([
      readTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      readTable<SupabaseSeason>(
        "seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"
      ),
      readTable<SupabaseMatchday>(
        "matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&order=number.asc"
      ),
      readTable<SupabaseTeam>(
        "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
      )
    ]);

    const competitionsById = mapById(competitions);
    const seasonsById = mapById(seasons);
    const matchdaysById = mapById(matchdays);
    const teamsById = mapById(teams);
    const rowsByStanding = standingRows.reduce<Map<string, SupabaseAdminStandingRow[]>>((map, row) => {
      const list = map.get(row.standing_id) ?? [];
      list.push({
        ...row,
        team: teamsById.get(row.team_id) ?? null
      });
      map.set(row.standing_id, list);
      return map;
    }, new Map());

    return {
      configured: true,
      writeConfigured,
      standings: standings.map((standing) => ({
        ...standing,
        competition: competitionsById.get(standing.competition_id) ?? null,
        season: seasonsById.get(standing.season_id) ?? null,
        matchday: standing.matchday_id ? matchdaysById.get(standing.matchday_id) ?? null : null,
        rows: rowsByStanding.get(standing.id) ?? []
      })),
      competitions,
      seasons,
      matchdays,
      teams,
      syncMetadataAvailable
    };
  } catch (error) {
    return {
      configured: true,
      writeConfigured,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler classificacoes.",
      standings: [],
      competitions: [],
      seasons: [],
      matchdays: [],
      teams: [],
      syncMetadataAvailable: false
    };
  }
}

type SupabasePublicBroadcastMatch = {
  source_key: string | null;
  broadcast_channel_id: string | null;
};

export async function getPublicBroadcastOverrides(): Promise<BroadcastOverride[]> {
  if (!getSupabaseConfig()) {
    return [];
  }

  try {
    const [matches, broadcastChannels] = await Promise.all([
      fetchSupabaseTable<SupabasePublicBroadcastMatch>(
        "matches?select=source_key,broadcast_channel_id&source_key=not.is.null&broadcast_channel_id=not.is.null&order=kickoff_at.asc&limit=200"
      ),
      fetchSupabaseTable<SupabaseBroadcastChannel>(
        "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
      )
    ]);
    const channelsById = mapById(broadcastChannels);

    return matches.flatMap((match) => {
      if (!match.source_key || !match.broadcast_channel_id) {
        return [];
      }

      const channel = channelsById.get(match.broadcast_channel_id);

      if (!channel) {
        return [];
      }

      return [
        {
          matchId: match.source_key,
          channel: channel.name,
          platform: channel.platform,
          region: channel.country,
          coverage: "Direto",
          logoUrl: channel.logo_url
        }
      ];
    });
  } catch {
    return [];
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!getSupabaseConfig()) {
    return {
      configured: false,
      competitions: [],
      matchdays: [],
      teams: [],
      broadcastChannels: []
    };
  }

  try {
    const [competitions, teams, broadcastChannels, matchdayOverview] = await Promise.all([
      fetchSupabaseTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      fetchSupabaseTable<SupabaseTeam>(
        "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
      ),
      fetchSupabaseTable<SupabaseBroadcastChannel>(
        "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
      ),
      getAdminMatchdaysEditor()
    ]);

    return {
      configured: true,
      competitions,
      matchdays: matchdayOverview.matchdays,
      teams,
      broadcastChannels
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler o Supabase.",
      competitions: [],
      matchdays: [],
      teams: [],
      broadcastChannels: []
    };
  }
}
