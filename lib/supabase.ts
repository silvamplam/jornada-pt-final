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
};

export type SupabaseTeam = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
  primary_color: string | null;
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
};

export type SupabaseAdminMatch = SupabaseMatch & {
  competition: SupabaseCompetition | null;
  homeTeam: SupabaseTeam | null;
  awayTeam: SupabaseTeam | null;
  broadcastChannel: SupabaseBroadcastChannel | null;
};

export type AdminOverview = {
  configured: boolean;
  error?: string;
  competitions: SupabaseCompetition[];
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

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!getSupabaseConfig()) {
    return {
      configured: false,
      competitions: [],
      teams: [],
      broadcastChannels: []
    };
  }

  try {
    const [competitions, teams, broadcastChannels] = await Promise.all([
      fetchSupabaseTable<SupabaseCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      fetchSupabaseTable<SupabaseTeam>(
        "teams?select=id,name,short_name,slug,country,logo_url,primary_color&order=name.asc"
      ),
      fetchSupabaseTable<SupabaseBroadcastChannel>(
        "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc"
      )
    ]);

    return {
      configured: true,
      competitions,
      teams,
      broadcastChannels
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Erro desconhecido ao ler o Supabase.",
      competitions: [],
      teams: [],
      broadcastChannels: []
    };
  }
}
