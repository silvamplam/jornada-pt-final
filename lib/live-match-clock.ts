export type LiveMatchClockInput = {
  status?: string | null;
  minute?: number | string | null;
  live_started_at?: string | null;
  live_base_minute?: number | string | null;
  is_clock_running?: boolean | null;
};

function parseMinute(value?: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(130, Math.floor(value)));
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Math.max(0, Math.min(130, Number.parseInt(value.trim(), 10)));
  }

  return null;
}

export function getPublicLiveMinute(match: LiveMatchClockInput, now = new Date()) {
  const status = match.status?.trim().toLowerCase();
  const fallbackMinute = parseMinute(match.minute);
  const baseMinute = parseMinute(match.live_base_minute);

  if (status !== "live") {
    return fallbackMinute;
  }

  if (match.is_clock_running && match.live_started_at && baseMinute !== null) {
    const startedAt = new Date(match.live_started_at);
    if (!Number.isNaN(startedAt.getTime())) {
      const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
      return Math.max(0, Math.min(130, baseMinute + elapsedMinutes));
    }
  }

  return baseMinute ?? fallbackMinute;
}
