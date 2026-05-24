import { NextResponse } from "next/server";
import {
  fetchSupabaseAdminTable,
  getSupabaseServiceConfig,
  writeSupabaseAdmin,
  type SupabaseBroadcastChannel,
  type SupabaseMatch,
  type SupabaseMatchday,
  type SupabaseTeam
} from "@/lib/supabase";

type BulkBroadcastAction = "preview" | "apply";

type BulkBroadcastInput = {
  action: BulkBroadcastAction;
  seasonId: string;
  rows: string;
};

type BroadcastPreviewRow = {
  line: number;
  matchday: string;
  home: string;
  away: string;
  channel: string;
  matchLabel: string;
  channelLabel: string;
  status: "update" | "unchanged" | "match_not_found" | "channel_not_found" | "invalid" | "conflict";
  note: string;
  matchId?: string;
  channelId?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textKey(value: string | null | undefined) {
  return normalize(value ?? "");
}

function teamMatches(team: SupabaseTeam | undefined, value: string) {
  const key = textKey(value);
  return Boolean(team && key && [team.name, team.short_name, team.slug].some((item) => textKey(item) === key));
}

function parseLine(line: string) {
  const [matchday, home, away, channel] = line.split(";").map((part) => part?.trim() ?? "");
  return { matchday, home, away, channel };
}

async function buildPreview(input: BulkBroadcastInput) {
  const seasonId = input.seasonId?.trim();
  const parsedRows = input.rows.split(/\r?\n/).map((line, index) => ({
    line: index + 1,
    raw: line.trim(),
    parsed: parseLine(line)
  }));
  const nonEmptyRows = parsedRows.filter((row) => row.raw);

  if (!seasonId) {
    return { rows: [], summary: { update: 0, unchanged: 0, missingMatch: 0, missingChannel: 0, invalid: nonEmptyRows.length, conflict: 0 } };
  }

  const [matchdays, matches, channels] = await Promise.all([
    fetchSupabaseAdminTable<SupabaseMatchday>(
      `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&season_id=eq.${encodeURIComponent(seasonId)}&order=number.asc&limit=100`
    ),
    fetchSupabaseAdminTable<SupabaseMatch>(
      `matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id&season_id=eq.${encodeURIComponent(seasonId)}&limit=1000`
    ),
    fetchSupabaseAdminTable<SupabaseBroadcastChannel>(
      "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc&limit=500"
    )
  ]);
  const teamIds = Array.from(new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]).filter(Boolean)));
  const teams =
    teamIds.length > 0
      ? await fetchSupabaseAdminTable<SupabaseTeam>(
          `teams?select=id,name,short_name,slug,country,logo_url,primary_color&id=in.(${teamIds.map(encodeURIComponent).join(",")})&limit=1000`
        )
      : [];
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const matchdaysByNumber = new Map(matchdays.map((matchday) => [String(matchday.number), matchday]));
  const channelsByKey = new Map<string, SupabaseBroadcastChannel>();

  for (const channel of channels) {
    channelsByKey.set(textKey(channel.name), channel);
  }

  const seenMatches = new Map<string, string>();
  const previewRows: BroadcastPreviewRow[] = nonEmptyRows.map(({ line, parsed }) => {
    const base = {
      line,
      matchday: parsed.matchday,
      home: parsed.home,
      away: parsed.away,
      channel: parsed.channel,
      matchLabel: "-",
      channelLabel: "-"
    };

    if (!parsed.matchday || !parsed.home || !parsed.away || !parsed.channel) {
      return { ...base, status: "invalid", note: "Linha incompleta." };
    }

    const matchday = matchdaysByNumber.get(String(Number(parsed.matchday)));

    if (!matchday) {
      return { ...base, status: "match_not_found", note: "Jornada nao encontrada nesta epoca." };
    }

    const match = matches.find((item) => {
      const homeTeam = teamsById.get(item.home_team_id);
      const awayTeam = teamsById.get(item.away_team_id);
      return item.matchday_id === matchday.id && teamMatches(homeTeam, parsed.home) && teamMatches(awayTeam, parsed.away);
    });

    if (!match) {
      return { ...base, status: "match_not_found", note: "Jogo nao encontrado nesta epoca." };
    }

    const channel = channelsByKey.get(textKey(parsed.channel));
    const homeTeam = teamsById.get(match.home_team_id);
    const awayTeam = teamsById.get(match.away_team_id);
    const matchLabel = `${matchday.label || `Jornada ${matchday.number}`} - ${homeTeam?.name ?? parsed.home} vs ${awayTeam?.name ?? parsed.away}`;

    if (!channel) {
      return { ...base, matchLabel, status: "channel_not_found", note: "Canal nao encontrado.", matchId: match.id };
    }

    const previousChannelForMatch = seenMatches.get(match.id);
    seenMatches.set(match.id, channel.id);

    if (previousChannelForMatch) {
      return {
        ...base,
        matchLabel,
        channelLabel: channel.name,
        status: "conflict",
        note: "O mesmo jogo aparece mais do que uma vez na lista.",
        matchId: match.id,
        channelId: channel.id
      };
    }

    if (match.broadcast_channel_id === channel.id) {
      return {
        ...base,
        matchLabel,
        channelLabel: channel.name,
        status: "unchanged",
        note: "O jogo ja tinha este canal.",
        matchId: match.id,
        channelId: channel.id
      };
    }

    const currentChannel = channels.find((item) => item.id === match.broadcast_channel_id);

    return {
      ...base,
      matchLabel,
      channelLabel: channel.name,
      status: "update",
      note: currentChannel ? `Sera atualizado de ${currentChannel.name} para ${channel.name}.` : `Sera definido como ${channel.name}.`,
      matchId: match.id,
      channelId: channel.id
    };
  });

  return {
    rows: previewRows,
    summary: {
      update: previewRows.filter((row) => row.status === "update").length,
      unchanged: previewRows.filter((row) => row.status === "unchanged").length,
      missingMatch: previewRows.filter((row) => row.status === "match_not_found").length,
      missingChannel: previewRows.filter((row) => row.status === "channel_not_found").length,
      invalid: previewRows.filter((row) => row.status === "invalid").length,
      conflict: previewRows.filter((row) => row.status === "conflict").length
    }
  };
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    return NextResponse.json({ error: "missing-service" }, { status: 400 });
  }

  const input = (await request.json()) as BulkBroadcastInput;
  const preview = await buildPreview(input);

  if (input.action === "apply") {
    let applied = 0;

    for (const row of preview.rows) {
      if (row.status !== "update" || !row.matchId || !row.channelId) {
        continue;
      }

      await writeSupabaseAdmin(`matches?id=eq.${encodeURIComponent(row.matchId)}`, {
        method: "PATCH",
        body: JSON.stringify({ broadcast_channel_id: row.channelId })
      });
      applied += 1;
    }

    return NextResponse.json({ ...preview, applied });
  }

  return NextResponse.json({ ...preview, applied: 0 });
}
