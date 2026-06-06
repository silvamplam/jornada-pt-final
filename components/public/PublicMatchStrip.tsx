export type PublicMatchStripTeam = {
  name?: string | null;
  short_name?: string | null;
  logo_url?: string | null;
};

export type PublicMatchStripBroadcastChannel = {
  name?: string | null;
  logo_url?: string | null;
};

export type PublicMatchStripMatch = {
  id: string;
  kickoff_at?: string | null;
  status?: string | null;
  minute?: number | string | null;
  home_score?: number | null;
  away_score?: number | null;
  homeTeam?: PublicMatchStripTeam | null;
  awayTeam?: PublicMatchStripTeam | null;
  broadcastChannel?: PublicMatchStripBroadcastChannel | null;
};

function formatKickoffTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function formatMiniCardKickoff(value?: string | null) {
  if (!value) return "Hora por definir";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hora por definir";

  const dayMonth = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
  const time = formatKickoffTime(value);

  return time ? `${dayMonth} \u00b7 ${time}` : dayMonth;
}

function statusLabel(status?: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "live") return "Em direto";
  if (normalized === "halftime") return "Intervalo";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status?.trim() || "Agendado";
}

function statusKind(status?: string | null) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  if (normalized === "scheduled") return "scheduled";
  return "scheduled";
}

function teamInitials(name?: string | null, shortName?: string | null) {
  const source = shortName || name || "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "FC";
}

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const compactTeamNameOverrides: Record<string, string> = {
  "academico de viseu": "A. de Viseu",
  "manchester city": "M. City",
  "manchester united": "M. United",
  "atletico madrid": "A. Madrid",
  "real sociedad": "R. Sociedad",
  "nottingham forest": "N. Forest",
  "brighton & hove albion": "Brighton",
  "brighton and hove albion": "Brighton",
  "deportivo la coruna": "Dep. La Coruña",
  "rayo vallecano": "R. Vallecano",
  "tottenham hotspur": "Tottenham"
};

function compactTeamName(team?: PublicMatchStripTeam | null) {
  const editorialName = team?.name?.trim();
  const fallback = team?.short_name?.trim() || editorialName || "Equipa";

  if (!editorialName) {
    return fallback;
  }

  const normalizedName = normalizeTeamName(editorialName);
  const override = compactTeamNameOverrides[normalizedName];
  if (override) {
    return override;
  }

  if (editorialName.length <= 13) {
    return editorialName;
  }

  const parts = editorialName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const compactName = `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
    return compactName.length <= 16 ? compactName : `${parts[0][0]}. ${parts[1]}`;
  }

  return fallback.length <= 13 ? fallback : editorialName;
}

function TeamBadge({ team }: { team?: PublicMatchStripTeam | null }) {
  const label = teamInitials(team?.name, team?.short_name);

  return (
    <span className="public-team-badge">
      {team?.logo_url ? <img alt="" src={team.logo_url} /> : label}
    </span>
  );
}

function CompactMatchCard({ match, focus }: { match: PublicMatchStripMatch; focus?: boolean }) {
  const kind = statusKind(match.status);
  const broadcastChannelName = match.broadcastChannel?.name?.trim();
  const hasScore = match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined;
  const showScore = hasScore && (kind === "finished" || kind === "live" || kind === "halftime");
  const liveStatus = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} \u00b7 ${match.minute}'` : statusLabel(match.status);

  return (
    <article className={`public-matchday-mini-card public-matchday-mini-card-${kind}`} data-live-focus={focus ? "true" : undefined}>
      <span className="public-matchday-mini-team">
        <TeamBadge team={match.homeTeam} />
        <span>{compactTeamName(match.homeTeam)}</span>
        {showScore ? <b className="public-matchday-mini-score">{match.home_score}</b> : null}
      </span>
      <span className="public-matchday-mini-team">
        <TeamBadge team={match.awayTeam} />
        <span>{compactTeamName(match.awayTeam)}</span>
        {showScore ? <b className="public-matchday-mini-score">{match.away_score}</b> : null}
      </span>
      <span className="public-matchday-mini-status">
        {kind === "finished" ? (
          <span>Finalizado</span>
        ) : kind === "live" || kind === "halftime" ? (
          <span>{liveStatus}</span>
        ) : (
          <>
            <time className="public-matchday-mini-time" dateTime={match.kickoff_at ?? undefined}>{formatMiniCardKickoff(match.kickoff_at)}</time>
            {broadcastChannelName ? (
              <>
                <span className="public-matchday-mini-separator" aria-hidden="true">{"\u00b7"}</span>
                <span className="public-matchday-mini-channel">{broadcastChannelName}</span>
              </>
            ) : null}
          </>
        )}
      </span>
    </article>
  );
}

export default function PublicMatchStrip({ matches }: { matches: PublicMatchStripMatch[] }) {
  const focusedMatch = matches.find((match) => {
    const kind = statusKind(match.status);
    return kind === "live" || kind === "halftime";
  }) ?? null;

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="public-matchday-panel public-matchday-scoreboard-panel" aria-label="Visao rapida dos jogos">
      <div className="public-matchday-strip-shell">
        <button className="public-matchday-strip-button" data-strip-scroll="left" type="button" aria-label="Ver jogos anteriores">
          {"\u2039"}
        </button>
        <div className="public-matchday-strip" data-matchday-strip>
          {matches.map((match) => (
            <CompactMatchCard focus={focusedMatch?.id === match.id} key={match.id} match={match} />
          ))}
        </div>
        <button className="public-matchday-strip-button" data-strip-scroll="right" type="button" aria-label="Ver jogos seguintes">
          {"\u203a"}
        </button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var strip = document.querySelector("[data-matchday-strip]");
              if (!strip) return;
              var focused = strip.querySelector("[data-live-focus='true']");
              if (focused && "scrollIntoView" in focused) {
                focused.scrollIntoView({ block: "nearest", inline: "center" });
              }
              document.querySelectorAll("[data-strip-scroll]").forEach(function (button) {
                button.addEventListener("click", function () {
                  var direction = button.getAttribute("data-strip-scroll") === "left" ? -1 : 1;
                  strip.scrollBy({ left: direction * Math.max(260, Math.round(strip.clientWidth * 0.85)), behavior: "smooth" });
                });
              });
            });
          `
        }}
      />
    </section>
  );
}
