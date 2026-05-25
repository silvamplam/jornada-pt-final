import { buildAccumulatedClassification, totalClassificationStats, type ClassificationSplit } from "@/lib/classification";
import { getPublicMatchdayDiagnostic, seasonLabelToUrlSegment, type PublicMatchdayDiagnostic, type PublicSeasonMatch } from "@/lib/public-matchday";

export const dynamic = "force-dynamic";

type PublicMatchdayPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
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

const publicMatchdayStyles = `
  body {
    margin: 0;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-matchday-shell {
    min-height: 100vh;
    padding: 0 28px 28px;
  }

  .public-top-stack {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -28px;
    padding: 0 28px;
    border-bottom: 1px solid #d8dee6;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.08);
  }

  .public-site-topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    max-width: 1540px;
    margin: 0 auto;
    padding: 12px 0 11px;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-site-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #2f343b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 34px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .public-site-brand span {
    color: #6b7480;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0;
  }

  .public-site-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-menu a,
  .public-site-actions a {
    color: #10151b;
    text-decoration: none;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
  }

  .public-site-actions a:first-child {
    padding: 9px 16px;
    border-radius: 999px;
    background: #ffe04f;
  }

  .public-season-nav-bar {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .public-hidden-heading {
    display: none;
  }

  .public-season-label {
    color: #10151b;
    font-size: 14px;
    font-weight: 900;
    white-space: nowrap;
  }

  .public-season-select-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 10px;
    border: 1px solid #cfd7e1;
    background: #f8fafc;
    color: #263241;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .public-season-select {
    min-width: 118px;
    border: 0;
    background: transparent;
    color: #10151b;
    font: inherit;
    outline: none;
    cursor: pointer;
  }

  .public-matchday-hero,
  .public-matchday-panel {
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-matchday-hero {
    display: none;
  }

  .public-matchday-hero p,
  .public-matchday-hero h1 {
    margin: 0;
  }

  .public-matchday-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-hero h1 {
    margin-top: 6px;
    font-size: 34px;
    line-height: 1;
  }

  .public-matchday-hero span {
    display: block;
    margin-top: 8px;
    color: #526174;
    font-size: 15px;
  }

  .public-matchday-panel {
    max-width: 1540px;
    margin-left: auto;
    margin-right: auto;
    margin-top: 18px;
    overflow: hidden;
  }

  .public-matchday-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .public-matchday-panel h2,
  .public-matchday-panel h3,
  .public-matchday-panel p {
    margin: 0;
  }

  .public-matchday-panel h2 {
    font-size: 24px;
    text-transform: uppercase;
  }

  .public-matchday-panel p {
    margin-top: 6px;
    color: #607086;
  }

  .public-matchday-list {
    display: grid;
    gap: 18px;
    padding: 20px;
  }

  .public-matchday-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-padding: 14px;
    padding: 14px 4px;
  }

  .public-matchday-strip-shell {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 6px;
    align-items: stretch;
    padding: 0 10px;
  }

  .public-matchday-strip-button {
    align-self: center;
    width: 30px;
    height: 48px;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-size: 22px;
    font-weight: 900;
    cursor: pointer;
  }

  .public-matchday-mini-card {
    display: grid;
    flex: 0 0 252px;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 6px;
    align-items: center;
    padding: 9px 10px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
    font-size: 13px;
  }

  .public-matchday-mini-card-live {
    border-color: #f5c2c7;
    background: #fff8f8;
  }

  .public-matchday-mini-card-halftime {
    border-color: #ffd3a3;
    background: #fffaf2;
  }

  .public-matchday-mini-card-finished {
    border-color: #dce8e1;
  }

  .public-matchday-mini-card strong {
    font-size: 16px;
    text-align: center;
    white-space: nowrap;
  }

  .public-matchday-mini-team {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    font-weight: 900;
  }

  .public-matchday-mini-team:first-child {
    justify-content: flex-end;
  }

  .public-matchday-mini-team:last-child {
    justify-content: flex-start;
  }

  .public-matchday-mini-team span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .public-matchday-mini-status {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #607086;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-mini-tv {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
  }

  .public-matchday-mini-tv img {
    width: 24px;
    height: 15px;
    object-fit: contain;
  }

  .public-matchday-cover {
    display: grid;
    grid-template-columns: minmax(220px, 0.68fr) minmax(500px, 1.7fr) minmax(220px, 0.62fr) minmax(260px, 0.78fr);
    gap: 20px;
    padding: 22px 20px;
  }

  .public-matchday-editorial,
  .public-matchday-feature,
  .public-matchday-cover-side,
  .public-matchday-news {
    display: grid;
    gap: 12px;
    align-content: start;
    padding: 0 18px 0 0;
    border-right: 1px solid #dfe5ec;
    background: #ffffff;
  }

  .public-matchday-editorial h2,
  .public-matchday-feature h3,
  .public-matchday-cover-side h3,
  .public-matchday-news h3 {
    margin: 0;
  }

  .public-matchday-editorial h2 {
    color: #c40012;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 42px;
    line-height: 1.02;
  }

  .public-matchday-feature {
    color: #263241;
  }

  .public-matchday-feature h3 {
    font-size: 14px;
    text-transform: uppercase;
  }

  .public-matchday-feature p {
    font-size: 13px;
  }

  .public-matchday-editorial p,
  .public-matchday-feature p,
  .public-matchday-cover-side p {
    margin: 0;
    color: #607086;
  }

  .public-matchday-cover-side h3,
  .public-matchday-news h3 {
    padding-top: 24px;
    border-top: 4px solid #10151b;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-news {
    padding-right: 0;
    border-right: 0;
  }

  .public-news-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .public-news-list li {
    display: grid;
    gap: 4px;
    padding: 12px 0;
    border-bottom: 1px solid #e6ebf1;
  }

  .public-news-list time {
    color: #c40012;
    font-size: 12px;
    font-weight: 900;
  }

  .public-news-list span {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 17px;
    line-height: 1.15;
  }

  .public-matchday-summary {
    display: grid;
    gap: 4px;
  }

  .public-matchday-summary span {
    padding: 9px 0;
    border-bottom: 1px solid #e6ebf1;
    border-radius: 0;
    background: transparent;
    color: #34404d;
    font-size: 13px;
    font-weight: 900;
  }

  .public-matchday-feature-game {
    display: grid;
    grid-template-columns: 1fr;
    gap: 9px;
    align-items: center;
    min-height: 210px;
    padding: 14px;
    border: 1px solid #dde4ec;
    border-radius: 0;
    background: #f8fafc;
  }

  .public-matchday-feature-team {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
    font-weight: 900;
  }

  .public-matchday-feature-score {
    min-width: 74px;
    text-align: center;
  }

  .public-matchday-feature-score strong {
    display: block;
    font-size: 24px;
  }

  .public-matchday-future {
    padding: 20px;
    color: #607086;
  }

  .public-matchday-group {
    display: grid;
    gap: 10px;
  }

  .public-matchday-group h3 {
    color: #263241;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    width: min(820px, 100%);
    margin: 0 auto;
    padding: 14px 16px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
  }

  .public-matchday-card-finished {
    border-color: #cfe5d7;
    background: #fbfffc;
  }

  .public-matchday-card-live {
    border-color: #f5c2c7;
    background: #fff8f8;
  }

  .public-matchday-team:first-child {
    text-align: right;
  }

  .public-matchday-team:last-of-type {
    text-align: left;
  }

  .public-matchday-team {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .public-matchday-team:first-child {
    justify-content: flex-end;
  }

  .public-matchday-team:last-of-type {
    justify-content: flex-start;
  }

  .public-matchday-team-copy {
    min-width: 0;
  }

  .public-matchday-team strong,
  .public-matchday-score strong {
    display: block;
    font-size: 18px;
  }

  .public-matchday-team small,
  .public-matchday-score small {
    display: block;
    margin-top: 4px;
    color: #66717f;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .public-matchday-team-winner strong {
    color: #137a3a;
  }

  .public-team-badge {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 34px;
    height: 34px;
    overflow: hidden;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #f8fafc;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
  }

  .public-team-badge img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .public-matchday-score {
    min-width: 86px;
    text-align: center;
  }

  .public-matchday-score strong {
    font-size: 24px;
    letter-spacing: 0;
  }

  .public-matchday-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: #eef2f6;
  }

  .public-matchday-status-finished {
    background: #eaf7ef;
    color: #137a3a;
  }

  .public-matchday-status-live {
    background: #fee2e2;
    color: #b4232b;
  }

  .public-matchday-status-halftime {
    background: #fff0d8;
    color: #8a3a00;
  }

  .public-matchday-status-scheduled {
    background: #eef2f6;
    color: #506075;
  }

  .public-matchday-meta {
    grid-column: 1 / -1;
    justify-content: center;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: #607086;
    font-size: 13px;
  }

  .public-matchday-tv {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 7px;
    border: 1px solid #dce3eb;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-weight: 800;
  }

  .public-matchday-tv img {
    width: 28px;
    height: 18px;
    object-fit: contain;
  }

  .public-matchday-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    padding: 0;
    overflow-x: auto;
    border-top: 2px solid #10151b;
    border-bottom: 0;
    background: #ffffff;
  }

  .public-matchday-nav a,
  .public-matchday-nav span {
    display: inline-block;
    flex: 0 0 auto;
    padding: 10px 14px;
    border: 0;
    border-right: 1px solid #dfe5ec;
    border-radius: 0;
    background: #ffffff;
    color: #263241;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-nav a[aria-current="page"] {
    border-color: #c40012;
    background: #c40012;
    color: #ffffff;
  }

  .public-table-wrap {
    overflow-x: auto;
    padding: 20px;
  }

  .public-table {
    width: 100%;
    min-width: 1080px;
    border-collapse: collapse;
    font-size: 13px;
  }

  .public-table th,
  .public-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #e6ebf1;
    text-align: right;
    white-space: nowrap;
  }

  .public-table th {
    color: #506075;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-table-club {
    min-width: 300px;
    text-align: left;
  }

  .public-club-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .public-club-name {
    min-width: 0;
    overflow: hidden;
    font-weight: 900;
    text-overflow: ellipsis;
  }

  .public-club-form {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-left: auto;
    color: #66717f;
    font-size: 11px;
    font-weight: 800;
    text-align: right;
    white-space: nowrap;
  }

  .public-table-divider {
    border-left: 2px solid #d8dee6;
  }

  .public-points {
    font-weight: 900;
  }

  .public-gd-positive {
    color: #137a3a;
    font-weight: 900;
  }

  .public-gd-negative {
    color: #b4232b;
    font-weight: 900;
  }

  .public-gd-neutral {
    color: #607086;
    font-weight: 900;
  }

  .public-form-list {
    display: inline-flex;
    gap: 4px;
  }

  .public-form-list span {
    padding: 3px 5px;
    border-radius: 999px;
    background: #eef2f6;
    font-size: 11px;
    font-weight: 900;
  }

  .public-form-win {
    color: #137a3a;
  }

  .public-form-draw {
    color: #607086;
  }

  .public-form-loss {
    color: #b4232b;
  }

  .public-diagnostic {
    margin-top: 18px;
    padding: 18px 20px;
    border: 1px solid #ffd3a3;
    border-radius: 8px;
    background: #fff8ee;
    color: #4a2d00;
  }

  .public-diagnostic h2,
  .public-diagnostic p {
    margin: 0;
  }

  .public-diagnostic p {
    margin-top: 8px;
  }

  .public-diagnostic pre {
    overflow-x: auto;
    margin: 14px 0 0;
    padding: 14px;
    border-radius: 6px;
    background: #ffffff;
    color: #10151b;
    font-size: 13px;
    white-space: pre-wrap;
  }

  @media (max-width: 760px) {
    .public-matchday-shell {
      padding: 0 16px 16px;
    }

    .public-top-stack {
      margin: 0 -16px;
      padding: 0 16px;
    }

    .public-matchday-panel[aria-label="Navegacao de jornadas"] {
      margin: 0 -16px;
    }

    .public-season-nav-inner {
      padding: 8px 16px 9px;
    }

    .public-matchday-hero h1 {
      font-size: 32px;
    }

    .public-site-topbar {
      grid-template-columns: 1fr;
    }

    .public-site-menu,
    .public-site-actions {
      display: none;
    }

  .public-season-nav-bar {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .public-matchday-card {
      grid-template-columns: 1fr;
      text-align: left;
    }

    .public-matchday-cover {
      grid-template-columns: 1fr;
    }

    .public-matchday-editorial,
    .public-matchday-feature,
    .public-matchday-cover-side,
    .public-matchday-news {
      padding-right: 0;
      border-right: 0;
    }

    .public-matchday-team:first-child,
    .public-matchday-team:last-of-type,
    .public-matchday-score {
      text-align: left;
    }
  }

  .public-matchday-panel[aria-label="Navegacao de jornadas"] {
    max-width: none;
    margin: 0 -28px;
    border: 0;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 18px rgba(12, 22, 34, 0.06);
  }

  .public-matchday-panel[aria-label="Navegacao de jornadas"] header {
    display: none;
  }

  .public-season-nav-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 18px;
    align-items: center;
    max-width: 1540px;
    margin: 0 auto;
    padding: 9px 28px 10px;
  }

  @media (max-width: 760px) {
    .public-matchday-panel[aria-label="Navegacao de jornadas"] {
      margin: 0 -16px;
    }

    .public-season-nav-inner {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 8px 16px 9px;
    }
  }
`;

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

function shortTeamLabel(name?: string | null, shortName?: string | null) {
  return shortName || name || "Equipa";
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
  return (
    <span className="public-team-badge" aria-hidden="true">
      {logoUrl ? <img alt="" src={logoUrl} /> : teamInitials(name, shortName)}
    </span>
  );
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

function MiniBroadcastBadge({ match }: { match: PublicSeasonMatch }) {
  if (!match.broadcastChannel) {
    return null;
  }

  return (
    <span className="public-matchday-mini-tv">
      {match.broadcastChannel.logo_url ? <img alt="" src={match.broadcastChannel.logo_url} /> : null}
      <span>{match.broadcastChannel.name}</span>
    </span>
  );
}

function CompactMatchCard({ match, focus }: { match: PublicSeasonMatch; focus?: boolean }) {
  const kind = statusKind(match.status);
  const statusText = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} - ${match.minute}'` : statusLabel(match.status);

  return (
    <article className={`public-matchday-mini-card public-matchday-mini-card-${kind}`} data-live-focus={focus ? "true" : undefined}>
      <span className="public-matchday-mini-team">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{shortTeamLabel(match.homeTeam?.name, match.homeTeam?.short_name)}</span>
      </span>
      <strong>{matchResult(match)}</strong>
      <span className="public-matchday-mini-team">
        <span>{shortTeamLabel(match.awayTeam?.name, match.awayTeam?.short_name)}</span>
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
      </span>
      <span className={`public-matchday-mini-status public-matchday-status-${statusKind(match.status)}`}>
        <span>{statusText}</span>
        <MiniBroadcastBadge match={match} />
      </span>
    </article>
  );
}

function FeaturedMatch({ match }: { match: PublicSeasonMatch | null }) {
  if (!match) {
    return <p>Ainda nao ha jogos definidos nesta jornada.</p>;
  }

  const kind = statusKind(match.status);

  return (
    <div className="public-matchday-feature-game">
      <div className="public-matchday-feature-team">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{match.homeTeam?.name ?? "Equipa da casa"}</span>
      </div>
      <div className="public-matchday-feature-score">
        <strong>{matchResult(match)}</strong>
        <small className={`public-matchday-status public-matchday-status-${kind}`}>{statusLabel(match.status)}</small>
      </div>
      <div className="public-matchday-feature-team">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <span>{match.awayTeam?.name ?? "Equipa visitante"}</span>
      </div>
      <div className="public-matchday-meta">
        <span>{formatKickoff(match.kickoff_at)}</span>
        {match.venue ? <span>{match.venue}</span> : null}
        <BroadcastBadge match={match} />
      </div>
    </div>
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

export default async function PublicMatchdayPage({ params }: PublicMatchdayPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;
  const matchdayNumberValue = Number(matchdayNumber);
  const { context, diagnostic } = await getPublicMatchdayDiagnostic({
    competitionSlug,
    seasonLabel,
    matchdayNumber: matchdayNumberValue
  });

  if (!context) {
    return <DiagnosticPanel diagnostic={diagnostic} />;
  }

  const seasonSegment = seasonLabelToUrlSegment(context.season.label);
  const seasonOptions = context.seasons.map((season) => ({
    id: season.id,
    label: season.label,
    href: `/competicoes/${context.competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1`
  }));
  const currentSeasonHref = `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/1`;
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
  const focusedStripMatch = liveMatches[0] ?? halftimeMatches[0] ?? null;
  const featuredMatch = liveMatches[0] ?? halftimeMatches[0] ?? finishedMatches[0] ?? scheduledMatches[0] ?? null;

  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <a className="public-site-brand" href="/">
          Jornada<span>.pt</span>
        </a>
        <nav className="public-site-menu" aria-label="Competições principais">
          <a aria-current="page" href={`/competicoes/${context.competition.slug}/${seasonSegment}`}>{context.competition.name}</a>
          <a href="/competicoes/liga-portugal/2025-26">Liga Portugal</a>
          <a href="/competicoes/liga-espanha/2026-27">La Liga</a>
          <a href="/competicoes/premier-league/2025-26">Premier League</a>
          <a href="#jogos">Jogos</a>
          <a href="#classificacao">Classificação</a>
        </nav>
        <div className="public-site-actions" aria-label="Ações">
          <a href="#jogos">Ver jornada</a>
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

      <section className="public-matchday-panel" aria-label="Visao rapida dos jogos">
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

      <section className="public-matchday-panel" aria-label="Capa da jornada">
        <div className="public-matchday-cover">
          <aside className="public-matchday-feature" aria-label="Jogo em destaque">
            <div>
              <h3>Jogo em destaque</h3>
              <p>Escolha automática a partir dos jogos desta jornada.</p>
            </div>
            <FeaturedMatch match={featuredMatch} />
          </aside>
          <article className="public-matchday-editorial">
            <div>
              <h2 style={context.editorial?.title_color ? { color: context.editorial.title_color } : undefined}>
                {context.editorial?.title || "Manchete da jornada"}
              </h2>
              <p>{context.editorial?.summary || "Espaço reservado para a leitura editorial desta jornada."}</p>
            </div>
          </article>
          <aside className="public-matchday-cover-side" aria-label="Resumo automático da jornada">
            <h3>Resumo</h3>
            <div className="public-matchday-summary">
              <span>{context.matchesForMatchday.length} jogos</span>
              <span>{finishedMatches.length} finalizados</span>
              <span>{scheduledMatches.length} agendados</span>
              <span>{liveMatches.length + halftimeMatches.length} em direto/intervalo</span>
            </div>
          </aside>
          <aside className="public-matchday-news" aria-label="Últimas notícias">
            <h3>Últimas notícias</h3>
            <ul className="public-news-list">
              <li>
                <time dateTime="12:30">12:30</time>
                <span>Mercado aquece antes da jornada europeia</span>
              </li>
              <li>
                <time dateTime="12:45">12:45</time>
                <span>Treinador confirma alterações no onze</span>
              </li>
              <li>
                <time dateTime="13:10">13:10</time>
                <span>Adeptos esgotam bilhetes para o clássico</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="public-matchday-panel" id="jogos" aria-label="Jogos da jornada">
        <header>
          <h2>Lista completa dos jogos</h2>
          <p>{context.matchesForMatchday.length} jogos nesta jornada.</p>
        </header>
        <div className="public-matchday-list">
          {context.matchesForMatchday.length === 0 ? (
            <p>Ainda não há jogos nesta jornada.</p>
          ) : null}
          {liveMatches.length > 0 ? (
            <section className="public-matchday-group" aria-label="Jogos em direto">
              <h3>Jogos em direto</h3>
              {liveMatches.map((match) => <MatchCard key={match.id} match={match} />)}
            </section>
          ) : null}
          {halftimeMatches.length > 0 ? (
            <section className="public-matchday-group" aria-label="Jogos no intervalo">
              <h3>Jogos no intervalo</h3>
              {halftimeMatches.map((match) => <MatchCard key={match.id} match={match} />)}
            </section>
          ) : null}
          {finishedMatches.length > 0 ? (
            <section className="public-matchday-group" aria-label="Jogos finalizados">
              <h3>Jogos finalizados</h3>
              {finishedMatches.map((match) => <MatchCard key={match.id} match={match} />)}
            </section>
          ) : null}
          {scheduledMatches.length > 0 ? (
            <section className="public-matchday-group" aria-label="Jogos agendados">
              <h3>Jogos agendados</h3>
              {scheduledMatches.map((match) => <MatchCard key={match.id} match={match} />)}
            </section>
          ) : null}
        </div>
      </section>

      <section className="public-matchday-panel" id="classificacao" aria-label="Classificacao acumulada">
        <header>
          <h2>Classificação da jornada</h2>
          <p>Tabela acumulada até à Jornada {context.matchday.number}, usando apenas jogos finalizados.</p>
        </header>
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
                              {result.label}
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
