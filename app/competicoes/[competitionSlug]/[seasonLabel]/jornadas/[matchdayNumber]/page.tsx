import { buildAccumulatedClassification, totalClassificationStats, type ClassificationSplit } from "@/lib/classification";
import { getPublicMatchdayDiagnostic, seasonLabelToUrlSegment, type PublicMatchdayContext, type PublicMatchdayDiagnostic, type PublicSeasonMatch } from "@/lib/public-matchday";
import PublicTeamBadge from "@/components/public/PublicTeamBadge";
import { publicEditorialStyles as publicMatchdayStyles } from "@/components/public/publicEditorialStyles";
import { PublicEditorialLayout, type PublicEditorialHighlight, type PublicEditorialLatestNews } from "@/components/public/PublicEditorialLayout";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PublicMatchdayPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
  }>;
  searchParams?: Promise<{
    debug_logos?: string;
  }>;
};

const PUBLIC_STAT_COLUMNS: Array<{ key: keyof ClassificationSplit; label: string }> = [
  { key: "played", label: "J" },
  { key: "wins", label: "V" },
  { key: "draws", label: "E" },
  { key: "losses", label: "D" },
  { key: "goalsFor", label: "GM" },
  { key: "goalsAgainst", label: "GS" },
  { key: "goalDifference", label: "DG" },
  { key: "points", label: "PTS" }
];

function signedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function goalDifferenceClass(value: number) {
  return value > 0 ? "public-gd-positive" : value < 0 ? "public-gd-negative" : "public-gd-neutral";
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatKickoffTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatMiniCardKickoff(value: string) {
  const date = new Date(value);
  const dayMonth = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
  const time = formatKickoffTime(value);

  return `${dayMonth} · ${time}`;
}

function formatMatchdayDateContext(matches: PublicSeasonMatch[]) {
  const kickoffDates = matches
    .map((match) => new Date(match.kickoff_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime());

  if (kickoffDates.length === 0) return "Data por definir";

  const firstDate = kickoffDates[0];
  const lastDate = kickoffDates[kickoffDates.length - 1];
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const dayFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    timeZone: "Europe/Lisbon"
  });
  const monthFormatter = new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const monthKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  });

  const firstLabel = dateFormatter.format(firstDate);
  const lastLabel = dateFormatter.format(lastDate);
  if (firstLabel === lastLabel) return firstLabel;

  const sameMonth = monthKeyFormatter.format(firstDate) === monthKeyFormatter.format(lastDate);
  if (sameMonth) {
    return `${dayFormatter.format(firstDate)}–${dayFormatter.format(lastDate)} ${monthFormatter.format(lastDate)}`;
  }

  return `${firstLabel} – ${lastLabel}`;
}

function statusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "live") return "Em direto";
  if (normalized === "halftime") return "Intervalo";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status;
}

function statusKind(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  if (normalized === "scheduled") return "scheduled";
  return "scheduled";
}

function sideBlockTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    opiniao: "OPINIÃO",
    arbitragem: "ARBITRAGEM",
    balanco: "BALANÇO",
    analise: "ANÁLISE",
    cronica: "CRÓNICA",
    "figura-da-jornada": "FIGURA DA JORNADA",
    outro: "EDITORIAL"
  };

  return value ? labels[value] ?? null : null;
}

function cleanPublicSideBlockText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const debugLinePattern = /^(estado|status|side_block_status)\s*:\s*(published|draft)$/i;
  const statusOnlyPattern = /^(published|draft)$/i;
  const cleanLines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !debugLinePattern.test(line) && !statusOnlyPattern.test(line));

  return cleanLines.join("\n").trim() || null;
}

function matchResult(match: PublicSeasonMatch) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const kind = statusKind(match.status);
  if ((kind !== "finished" && kind !== "live" && kind !== "halftime") || !hasScore) {
    return "vs";
  }

  return `${match.home_score} - ${match.away_score}`;
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

function compactTeamName(team?: PublicSeasonMatch["homeTeam"] | PublicSeasonMatch["awayTeam"] | null) {
  const editorialName = team?.name?.trim();
  const fallback = team?.short_name?.trim() || editorialName || "Equipa";

  if (!editorialName) {
    return fallback;
  }

  const override = compactTeamNameOverrides[normalizeTeamName(editorialName)];
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

function isWinner(match: PublicSeasonMatch, side: "home" | "away") {
  if (match.status !== "finished" || match.home_score === null || match.away_score === null || match.home_score === match.away_score) {
    return false;
  }

  return side === "home" ? match.home_score > match.away_score : match.away_score > match.home_score;
}

function renderStatsCells(stats: ClassificationSplit, options: { divider?: boolean; emphasizePoints?: boolean; group?: string } = {}) {
  return PUBLIC_STAT_COLUMNS.map((column, index) => {
    const value = stats[column.key];
    const className = [
      options.divider && index === 0 ? "public-table-divider" : "",
      column.key === "goalDifference" ? goalDifferenceClass(value) : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <td className={className || undefined} key={`${options.group ?? "stats"}-${column.key}`}>
        {column.key === "points" ? (
          <b className={options.emphasizePoints ? "public-points" : undefined}>{value}</b>
        ) : column.key === "goalDifference" ? (
          signedNumber(value)
        ) : (
          value
        )}
      </td>
    );
  });
}

function renderStatHeaders(group: string) {
  return PUBLIC_STAT_COLUMNS.map((column, index) => (
    <th className={index === 0 ? "public-table-divider" : undefined} key={`${group}-${column.key}`}>
      {column.label}
    </th>
  ));
}

function TeamBadge({ logoUrl, name, shortName }: { logoUrl?: string | null; name?: string | null; shortName?: string | null }) {
  return <PublicTeamBadge fallbackLabel={teamInitials(name, shortName)} logoUrl={logoUrl} />;
}

function BroadcastBadge({ match }: { match: PublicSeasonMatch }) {
  if (!match.broadcastChannel) {
    return null;
  }

  return (
    <span className="public-matchday-tv">
      {match.broadcastChannel.logo_url ? <img alt="" src={match.broadcastChannel.logo_url} /> : null}
      <span>{match.broadcastChannel.name}</span>
    </span>
  );
}

function CompactMatchCard({ match, focus }: { match: PublicSeasonMatch; focus?: boolean }) {
  const kind = statusKind(match.status);
  const broadcastChannelName = match.broadcastChannel?.name?.trim();
  const hasScore = match.home_score !== null && match.away_score !== null;
  const showScore = hasScore && (kind === "finished" || kind === "live" || kind === "halftime");
  const liveStatus = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} · ${match.minute}'` : statusLabel(match.status);

  return (
    <article className={`public-matchday-mini-card public-matchday-mini-card-${kind}`} data-live-focus={focus ? "true" : undefined}>
      <span className="public-matchday-mini-team">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{compactTeamName(match.homeTeam)}</span>
        {showScore ? <b className="public-matchday-mini-score">{match.home_score}</b> : null}
      </span>
      <span className="public-matchday-mini-team">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
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
            <time className="public-matchday-mini-time" dateTime={match.kickoff_at}>{formatMiniCardKickoff(match.kickoff_at)}</time>
            {broadcastChannelName ? (
              <>
                <span className="public-matchday-mini-separator" aria-hidden="true">·</span>
                <span className="public-matchday-mini-channel">{broadcastChannelName}</span>
              </>
            ) : null}
          </>
        )}
      </span>
    </article>
  );
}

function MatchCard({ match }: { match: PublicSeasonMatch }) {
  const kind = statusKind(match.status);
  const statusText = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} - ${match.minute}'` : statusLabel(match.status);
  const homeWinner = isWinner(match, "home");
  const awayWinner = isWinner(match, "away");

  return (
    <article className={`public-matchday-card public-matchday-card-${kind}`} key={match.id}>
      <div className={`public-matchday-team ${homeWinner ? "public-matchday-team-winner" : ""}`}>
        <div className="public-matchday-team-copy">
          <strong>{match.homeTeam?.name ?? "Equipa da casa"}</strong>
          <small>Casa</small>
        </div>
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
      </div>
      <div className="public-matchday-score">
        <strong>{matchResult(match)}</strong>
        <small className={`public-matchday-status public-matchday-status-${kind}`}>{statusText}</small>
      </div>
      <div className={`public-matchday-team ${awayWinner ? "public-matchday-team-winner" : ""}`}>
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <div className="public-matchday-team-copy">
          <strong>{match.awayTeam?.name ?? "Equipa visitante"}</strong>
          <small>Fora</small>
        </div>
      </div>
      <div className="public-matchday-meta">
        <span>{formatKickoff(match.kickoff_at)}</span>
        {match.venue ? <span>{match.venue}</span> : null}
        <BroadcastBadge match={match} />
      </div>
    </article>
  );
}

function DiagnosticPanel({ diagnostic }: { diagnostic: PublicMatchdayDiagnostic }) {
  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      <section className="public-diagnostic">
        <h2>Diagnóstico temporário da página pública</h2>
        <p>A rota foi carregada, mas os dados necessários não foram encontrados ou ocorreu um erro de leitura.</p>
        <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
      </section>
    </main>
  );
}

function logoDiagnosticStatus(logoUrl?: string | null) {
  const value = logoUrl?.trim();

  if (!value) {
    return "sem logo_url";
  }

  if (!/^https?:\/\//i.test(value)) {
    return "valor nao URL";
  }

  if (/Special:(FilePath|Redirect)/i.test(value)) {
    return "URL Wikimedia Special";
  }

  if (/upload\.wikimedia\.org/i.test(value)) {
    return "URL direta Wikimedia";
  }

  return "URL http/https";
}

function LogoDiagnosticPanel({ context }: { context: PublicMatchdayContext }) {
  const rowsById = new Map<
    string,
    {
      name: string;
      shortName: string;
      slug: string;
      logoUrl: string | null;
      sources: Set<string>;
    }
  >();
  const addTeam = (
    team: PublicSeasonMatch["homeTeam"],
    source: string
  ) => {
    if (!team) {
      return;
    }

    const existing = rowsById.get(team.id);
    if (existing) {
      existing.sources.add(source);
      return;
    }

    rowsById.set(team.id, {
      name: team.name,
      shortName: team.short_name,
      slug: team.slug,
      logoUrl: team.logo_url,
      sources: new Set([source])
    });
  };

  context.participants.forEach((participant, index) => {
    addTeam(participant.team, `participante ${index + 1}`);
  });
  context.matchesForMatchday.forEach((match) => {
    addTeam(match.homeTeam, `J${context.matchday.number} casa`);
    addTeam(match.awayTeam, `J${context.matchday.number} fora`);
  });
  const rows = Array.from(rowsById.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="public-logo-diagnostic" aria-label="Diagnóstico temporário dos emblemas">
      <h2>Diagnóstico temporário dos emblemas</h2>
      <p>
        Esta caixa só aparece com <code>?debug_logos=1</code>. A consola do browser também indica os URLs que falham no carregamento.
      </p>
      <table>
        <thead>
          <tr>
            <th>Clube</th>
            <th>Slug</th>
            <th>Logo recebido</th>
            <th>Estado</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td>{row.name || row.shortName}</td>
              <td>{row.slug}</td>
              <td>{row.logoUrl ? <code>{row.logoUrl}</code> : "—"}</td>
              <td>{logoDiagnosticStatus(row.logoUrl)}</td>
              <td>{Array.from(row.sources).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function PublicMatchdayPage({ params, searchParams }: PublicMatchdayPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;
  const query = searchParams ? await searchParams : {};

  if (competitionSlug === "liga-espanha") {
    redirect(`/competicoes/la-liga/${seasonLabel}/jornadas/${matchdayNumber}`);
  }

  const matchdayNumberValue = Number(matchdayNumber);
  const { context, diagnostic } = await getPublicMatchdayDiagnostic({
    competitionSlug,
    seasonLabel,
    matchdayNumber: matchdayNumberValue
  });

  if (!context) {
    return <DiagnosticPanel diagnostic={diagnostic} />;
  }
  const showLogoDiagnostic = query.debug_logos === "1";

  const seasonSegment = seasonLabelToUrlSegment(context.season.label);
  const seasonOptions = context.seasons.map((season) => ({
    id: season.id,
    label: season.label,
    href: `/competicoes/${context.competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1`
  }));
  const currentSeasonHref = `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/1`;
  const currentCompetitionMenuItem = {
    label: context.competition.name,
    slug: context.competition.slug,
    href: `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${context.matchday.number}`
  };
  const publicCompetitionMenuBase = [
    { label: "Liga Portugal", slug: "liga-portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
    { label: "La Liga", slug: "la-liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
    { label: "Premier League", slug: "premier-league", href: "/competicoes/premier-league/2026-27/jornadas/1" }
  ];
  const publicCompetitionMenu = publicCompetitionMenuBase.map((item) =>
    item.slug === currentCompetitionMenuItem.slug ? currentCompetitionMenuItem : item
  );

  if (!publicCompetitionMenu.some((item) => item.slug === currentCompetitionMenuItem.slug)) {
    publicCompetitionMenu.unshift(currentCompetitionMenuItem);
  }

  const classificationRows = buildAccumulatedClassification({
    participants: context.participants,
    matches: context.matchesForSeason,
    matchdays: context.matchdays,
    selectedMatchday: context.matchday
  });
  const matchdayHref = (number: number) => `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${number}`;
  const liveMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "live");
  const halftimeMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "halftime");
  const finishedMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "finished");
  const scheduledMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "scheduled");
  const selectedMatchdayDateContext = formatMatchdayDateContext(context.matchesForMatchday);
  const editorial = context.editorial;
  const publishedHeadline = editorial?.status === "published" ? editorial : null;
  const belowHeadlineMode = editorial?.below_headline_mode === "roundup" ? "roundup" : "highlights";
  const complementaryMode = editorial?.complementary_mode ?? "none";
  const belowHeadlineHeading =
    editorial?.below_headline_heading?.trim() || `Jornada ${String(context.matchday.number).padStart(2, "0")}`;
  const belowHeadlineHeadingColor = editorial?.below_headline_heading_color?.trim();
  const belowHeadlineLabel = belowHeadlineMode === "highlights" ? belowHeadlineHeading : `Jornada ${String(context.matchday.number).padStart(2, "0")}`;
  const belowHeadlineLabelColor = belowHeadlineMode === "highlights" ? belowHeadlineHeadingColor : null;
  const hasPublishedComplementaryStory =
    complementaryMode === "complementary_story" &&
    editorial?.complementary_status === "published" &&
    Boolean(editorial?.complementary_title?.trim());
  const hasRoundupVideoComplement = complementaryMode === "roundup_video" && context.roundupItems.length > 0;
  const sideBlockImageUrl = editorial?.side_block_image_url?.trim() || null;
  const explicitSideBlockLabel = cleanPublicSideBlockText(editorial?.side_block_label);
  const sideBlockLabel = explicitSideBlockLabel || sideBlockTypeLabel(editorial?.side_block_type);
  const sideBlockTitle = cleanPublicSideBlockText(editorial?.side_block_title);
  const sideBlockTitleColor = editorial?.side_block_title_color?.trim() || null;
  const sideBlockAuthor = cleanPublicSideBlockText(editorial?.side_block_author);
  const sideBlockText = cleanPublicSideBlockText(editorial?.side_block_text);
  const sideBlockLinkUrl = editorial?.side_block_link_url?.trim() || null;
  const hasPublishedSideBlock =
    editorial?.side_block_status === "published" &&
    Boolean(sideBlockImageUrl || explicitSideBlockLabel || sideBlockTitle || sideBlockText);
  const focusedStripMatch = liveMatches[0] ?? halftimeMatches[0] ?? null;
  const latestNewsItems =
    context.latestNews.length > 0
      ? context.latestNews.map((item) => ({
          id: item.id,
          timeLabel: item.time_label || "",
          title: item.title || "Noticia da jornada",
          imageUrl: item.image_url?.trim() || null
        }))
      : [
          {
            id: "placeholder-news-market",
            timeLabel: "12:30",
            title: "Mercado aquece antes da jornada europeia",
            imageUrl: null
          },
          {
            id: "placeholder-news-lineup",
            timeLabel: "12:45",
            title: "Treinador confirma alterações no onze",
            imageUrl: null
          },
          {
            id: "placeholder-news-tickets",
            timeLabel: "13:10",
            title: "Adeptos esgotam bilhetes para o clássico",
            imageUrl: null
          }
        ];
  const publicHighlights: PublicEditorialHighlight[] =
    context.highlights.length > 0
      ? context.highlights.map((highlight) => ({
          id: highlight.id,
          label: highlight.label,
          title: highlight.title,
          imageUrl: highlight.image_url?.trim() || null
        }))
      : [
          {
            id: "placeholder-highlight-preview",
            label: "Antevisão",
            title: "Os pontos de atenção antes da bola rolar",
            imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80"
          },
          {
            id: "placeholder-highlight-stand",
            label: "Ambiente",
            title: "A jornada vista pelas bancadas e pelos protagonistas",
            imageUrl: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=700&q=80"
          },
          {
            id: "placeholder-highlight-context",
            label: "Contexto",
            title: "O que pode mudar na tabela depois dos resultados",
            imageUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=700&q=80"
          }
        ];
  const publicLatestNews: PublicEditorialLatestNews[] = latestNewsItems;

  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      {showLogoDiagnostic ? <LogoDiagnosticPanel context={context} /> : null}
      <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <a className="public-site-brand" href="/">
          Jornada<span>.pt</span>
        </a>
        <nav className="public-site-menu" aria-label="Competições principais">
          {publicCompetitionMenu.map((item) => (
            <a
              aria-current={item.slug === context.competition.slug ? "page" : undefined}
              href={item.href}
              key={item.slug}
            >
              {item.label}
            </a>
          ))}
          <a href="#jogos">Jogos</a>
          <a href="#classificacao">Classificação</a>
        </nav>
        <div className="public-site-actions" aria-label="Ações">
          <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
          <a href="/admin/gestor">Entrar</a>
        </div>
      </header>
      <section className="public-season-nav-bar" aria-label="Navegacao de jornadas">
        <div className="public-hidden-heading">
          <h2>Jornadas</h2>
          <p>Navegação principal da época {context.season.label}.</p>
        </div>
        <div className="public-season-nav-inner">
        <label className="public-season-select-wrap">
          <span>Época</span>
          <select className="public-season-select" data-season-select defaultValue={currentSeasonHref}>
            {seasonOptions.map((season) => (
              <option key={season.id} value={season.href}>
                {season.label}
              </option>
            ))}
          </select>
        </label>
        <nav className="public-matchday-nav">
          {context.matchdays.map((matchday) => (
            <a
              aria-current={matchday.id === context.matchday.id ? "page" : undefined}
              href={matchdayHref(matchday.number)}
              key={matchday.id}
            >
              J{String(matchday.number).padStart(2, "0")}
            </a>
          ))}
        </nav>
        <div className="public-matchday-date-row" aria-label="Data da jornada selecionada">
          <span className="public-matchday-date-context">
            {selectedMatchdayDateContext}
          </span>
        </div>
        </div>
      </section>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var select = document.querySelector("[data-season-select]");
              if (!select) return;
              select.addEventListener("change", function () {
                if (select.value) window.location.href = select.value;
              });
            });
          `
        }}
      />

      <section className="public-matchday-panel public-matchday-scoreboard-panel" aria-label="Visao rapida dos jogos">
        <div className="public-matchday-strip-shell">
          <button className="public-matchday-strip-button" data-strip-scroll="left" type="button" aria-label="Ver jogos anteriores">
            ‹
          </button>
          <div className="public-matchday-strip" data-matchday-strip>
            {context.matchesForMatchday.length > 0 ? (
              context.matchesForMatchday.map((match) => (
                <CompactMatchCard focus={focusedStripMatch?.id === match.id} key={match.id} match={match} />
              ))
            ) : (
              <p>Ainda nao ha jogos nesta jornada.</p>
            )}
          </div>
          <button className="public-matchday-strip-button" data-strip-scroll="right" type="button" aria-label="Ver jogos seguintes">
            ›
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

      <PublicEditorialLayout
        ariaLabel="Capa da jornada"
        sideBlock={{
          isPublished: hasPublishedSideBlock,
          label: sideBlockLabel,
          title: sideBlockTitle,
          titleColor: sideBlockTitleColor,
          author: sideBlockAuthor,
          text: sideBlockText,
          imageUrl: sideBlockImageUrl,
          linkUrl: sideBlockLinkUrl,
          placeholder: "Espaco editorial por definir"
        }}
        headline={{
          title: publishedHeadline?.title ?? null,
          subtitle: publishedHeadline?.summary ?? null,
          imageUrl: publishedHeadline?.image_url ?? null,
          titleColor: publishedHeadline?.title_color ?? null,
          fallbackTitle: "Manchete da jornada",
          fallbackSubtitle: "Espaço reservado para a leitura editorial desta jornada."
        }}
        belowHeadline={{
          mode: belowHeadlineMode,
          label: belowHeadlineLabel,
          labelColor: belowHeadlineLabelColor,
          highlights: publicHighlights,
          roundupItems: context.roundupItems,
          showRoundupVideo: hasRoundupVideoComplement,
          roundupHeading: editorial?.roundup_video_heading ?? null,
          roundupHeadingColor: editorial?.roundup_video_heading_color ?? null,
          initialRoundupItemId: editorial?.complementary_roundup_item_id ?? null,
          matchdayNumber: context.matchday.number,
          complementary: {
            isPublished: Boolean(hasPublishedComplementaryStory && editorial),
            label: editorial?.complementary_label ?? null,
            title: editorial?.complementary_title ?? null,
            text: editorial?.complementary_text ?? null,
            imageUrl: editorial?.complementary_image_url ?? null,
            linkUrl: editorial?.complementary_link_url ?? null,
            fallbackTitle: "Espaço editorial preparado",
            fallbackText: "Bloco complementar por definir."
          }
        }}
        latestNews={publicLatestNews}
        latestNewsTitle="Últimas notícias"
      />
      <section className="public-matchday-panel" id="classificacao" aria-label="Classificacao acumulada">
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th rowSpan={2}>Pos</th>
                <th className="public-table-club" rowSpan={2}>Clube</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Total</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Casa</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Fora</th>
              </tr>
              <tr>
                {renderStatHeaders("total")}
                {renderStatHeaders("home")}
                {renderStatHeaders("away")}
              </tr>
            </thead>
            <tbody>
              {classificationRows.map((row, index) => (
                <tr key={row.teamId}>
                  <td>{index + 1}</td>
                  <td className="public-table-club">
                    <span className="public-club-cell">
                    <span className="public-club-name">{row.name}</span>
                    <span className="public-club-form">
                      <span>Últimos:</span>
                      {row.recentForm.length > 0 ? (
                        <span className="public-form-list">
                          {row.recentForm.map((result, resultIndex) => (
                            <span
                              className={
                                result.label.startsWith("V")
                                  ? "public-form-win"
                                  : result.label.startsWith("D")
                                    ? "public-form-loss"
                                    : "public-form-draw"
                              }
                              key={`${row.teamId}-${resultIndex}-${result.label}`}
                              title={result.title}
                            >
                              {result.label.charAt(0)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </span>
                    </span>
                  </td>
                  {renderStatsCells(totalClassificationStats(row), { divider: true, emphasizePoints: true, group: "total" })}
                  {renderStatsCells(row.home, { divider: true, group: "home" })}
                  {renderStatsCells(row.away, { divider: true, group: "away" })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


