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
        "broadcast_channels?select=id,name,platform,country&order=name.asc"
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
