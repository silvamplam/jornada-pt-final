import { notFound } from "next/navigation";

import PublicTeamBadge from "@/components/public/PublicTeamBadge";
import { getPublicCompetitionMenu } from "@/lib/public-competition-menu";
import {
  getPublicMatchdayDiagnostic,
  seasonLabelToUrlSegment,
  type PublicSeasonMatch
} from "@/lib/public-matchday";
import {
  fetchSupabaseAdminTable,
  type SupabaseCompetition,
  type SupabaseMatchday,
  type SupabaseSeason
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type EditorialArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  body?: string | null;
  image_url?: string | null;
  image_caption?: string | null;
  label?: string | null;
  category?: string | null;
  type?: string | null;
  author?: string | null;
  author_name?: string | null;
  status: string;
  source_url?: string | null;
  competition_id?: string | null;
  season_id?: string | null;
  matchday_id?: string | null;
  match_id?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const articlePageStyles = `
  body {
    margin: 0;
    overflow-x: hidden;
    background: #ffffff;
  }

  .news-article-shell {
    min-height: 100vh;
    color: #111820;
    padding: 0 24px 28px;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-top-stack {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -24px;
    padding: 0 24px;
    border-bottom: 1px solid #d8dee6;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.08);
  }

  .public-site-topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    min-height: 56px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-site-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #2f343b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 29px;
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
    align-items: center;
    gap: 18px;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-site-menu a,
  .public-site-actions a {
    color: #10151b;
    text-decoration: none;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 900;
  }

  .public-site-search {
    display: inline-flex;
    min-width: 170px;
    align-items: center;
    gap: 8px;
    padding: 6px 11px;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #ffffff;
    color: #66717f;
    font-size: 12px;
    font-weight: 900;
  }

  .public-site-search::before {
    content: "⌕";
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ffe04f;
    color: #10151b;
    font-size: 13px;
  }

  .public-season-nav-bar {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .public-hidden-heading {
    display: none;
  }

  .public-season-nav-inner {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    align-items: center;
    min-height: 52px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
  }

  .public-season-select-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px 5px 10px;
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

  .public-matchday-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    min-width: 0;
    overflow-x: auto;
    padding: 0;
    border-top: 2px solid #10151b;
    background: #ffffff;
  }

  .public-matchday-nav a {
    display: inline-block;
    flex: 0 0 auto;
    padding: 8px 13px;
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

  .news-article-layout {
    display: grid;
    grid-template-columns: minmax(0, 780px) 320px;
    gap: 42px;
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 28px 0 56px;
  }

  .news-article-main {
    min-width: 0;
  }

  .news-article-kickers {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
  }

  .news-article-label {
    display: inline-block;
    padding: 5px 7px 4px;
    border-radius: 2px;
    background: #ffe04f;
    color: #111820;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .news-article-label + .news-article-label {
    background: transparent;
    color: #c40012;
  }

  .news-article-title {
    margin: 0;
    max-width: 760px;
    color: #05080c;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(40px, 4.6vw, 56px);
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: 0;
  }

  .news-article-subtitle {
    margin: 14px 0 0;
    max-width: 720px;
    color: #293442;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 21px;
    font-weight: 500;
    line-height: 1.42;
  }

  .news-article-meta {
    display: grid;
    gap: 6px;
    margin: 22px 0 22px;
    color: #5e6976;
    font-size: 14px;
  }

  .news-article-author {
    color: #17202b;
    font-size: 15px;
    font-weight: 800;
  }

  .news-article-image {
    margin: 0 0 30px;
    background: #eef2f6;
  }

  .news-article-image img {
    display: block;
    width: 100%;
    max-height: 620px;
    object-fit: cover;
    background: #eef2f6;
  }

  .news-article-image figcaption {
    margin-top: 8px;
    color: #687482;
    font-size: 12px;
  }

  .news-article-body {
    max-width: 880px;
    color: #111820;
    font-size: 20px;
    line-height: 1.62;
  }

  .news-article-body p {
    margin: 0 0 22px;
  }

  .news-article-games-strip {
    width: min(1180px, calc(100% - 32px));
    margin: 14px auto 0;
    padding: 8px 0 0;
    border-top: 1px solid #edf1f5;
  }

  .news-article-games-scroller {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 0 8px;
    scrollbar-width: thin;
  }

  .news-article-game-card {
    display: grid;
    flex: 0 0 176px;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    align-items: center;
    min-height: 84px;
    padding: 8px 9px;
    border: 1px solid #eef2f6;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 18px rgba(12, 22, 34, 0.05);
    color: #111820;
    font-size: 13px;
  }

  .news-article-game-team {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 5px;
    align-items: center;
    min-width: 0;
    color: #0d141d;
    font-weight: 900;
    line-height: 1.1;
  }

  .news-article-game-team span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .news-article-game-card .public-team-badge {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }

  .news-article-game-score {
    min-width: 18px;
    color: #05080c;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    text-align: right;
  }

  .news-article-game-meta {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 4px;
    padding: 2px 0 0 29px;
    color: #435160;
    font-size: 10.5px;
    font-weight: 850;
    line-height: 1.15;
    white-space: nowrap;
  }

  .news-article-game-channel {
    overflow: hidden;
    color: #405061;
    text-overflow: ellipsis;
  }

  .news-article-sidebar {
    display: grid;
    align-content: start;
    gap: 20px;
    position: sticky;
    top: 128px;
  }

  .news-article-ad {
    display: grid;
    min-height: 300px;
    place-items: center;
    border: 1px solid #dfe5eb;
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.66)),
      linear-gradient(135deg, #eef4f6, #e5ecf2 55%, #f5f0e8);
    color: #7a8794;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .news-article-side-panel {
    background: #ffffff;
  }

  .news-article-side-list {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .news-article-side-item {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }

  .news-article-side-item img {
    display: block;
    width: 86px;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: #eef2f6;
  }

  .news-article-side-thumb-placeholder {
    display: block;
    width: 86px;
    aspect-ratio: 4 / 3;
    background: linear-gradient(135deg, #eef2f6, #dbe3eb);
  }

  .news-article-side-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .news-article-side-label {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .news-article-side-item a {
    color: #17202b;
    font-size: 15px;
    font-weight: 900;
    line-height: 1.16;
    text-decoration: none;
  }

  .news-article-side-item a:hover {
    text-decoration: underline;
  }

  .news-article-side-subtitle {
    margin: 0;
    color: #5d6875;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.25;
  }

  .news-article-side-date {
    color: #7b8795;
    font-size: 12px;
    line-height: 1.1;
  }

  @media (max-width: 900px) {
    .news-article-shell {
      padding: 0 14px 26px;
    }

    .public-top-stack {
      margin: 0 -14px;
      padding: 0 14px;
    }

    .public-site-topbar {
      grid-template-columns: 1fr;
    }

    .public-site-menu,
    .public-site-actions {
      justify-content: flex-start;
    }

    .public-season-nav-inner {
      gap: 8px;
      padding: 8px 16px 9px;
    }

    .news-article-layout {
      grid-template-columns: 1fr;
      padding-top: 18px;
    }

    .news-article-games-strip {
      width: min(100%, calc(100% - 8px));
      margin-top: 10px;
    }

    .news-article-sidebar {
      position: static;
    }

    .news-article-title {
      font-size: 34px;
    }

    .news-article-subtitle {
      font-size: 17px;
    }

    .news-article-body {
      font-size: 18px;
    }
  }
`;

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatShortDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function publicArticleHref(article: EditorialArticle) {
  return `/noticias/${encodeURIComponent(article.slug)}`;
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

  return `${dayMonth} · ${formatKickoffTime(value)}`;
}

function statusKind(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  if (normalized === "scheduled") return "scheduled";
  return "unknown";
}

function statusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "live") return "AO VIVO";
  if (normalized === "halftime") return "AO VIVO";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status;
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
  const editorialName = name?.trim();
  const fallback = shortName?.trim() || editorialName || "Equipa";

  if (!editorialName) {
    return fallback;
  }

  return editorialName.length <= 20 ? editorialName : fallback;
}

function TeamBadge({ logoUrl, name, shortName }: { logoUrl?: string | null; name?: string | null; shortName?: string | null }) {
  return <PublicTeamBadge fallbackLabel={teamInitials(name, shortName)} logoUrl={logoUrl} />;
}

function ArticleMatchCard({ match }: { match: PublicSeasonMatch }) {
  const kind = statusKind(match.status);
  const hasScore = match.home_score !== null && match.away_score !== null;
  const showScore = hasScore && (kind === "finished" || kind === "live" || kind === "halftime");
  const liveStatus = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} · ${match.minute}'` : statusLabel(match.status);
  const channelName = match.broadcastChannel?.name?.trim();

  return (
    <article className="news-article-game-card">
      <span className="news-article-game-team">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{shortTeamLabel(match.homeTeam?.name, match.homeTeam?.short_name)}</span>
        {showScore ? <b className="news-article-game-score">{match.home_score}</b> : null}
      </span>
      <span className="news-article-game-team">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <span>{shortTeamLabel(match.awayTeam?.name, match.awayTeam?.short_name)}</span>
        {showScore ? <b className="news-article-game-score">{match.away_score}</b> : null}
      </span>
      <span className="news-article-game-meta">
        {kind === "scheduled" ? (
          <>
            <time dateTime={match.kickoff_at}>{formatMiniCardKickoff(match.kickoff_at)}</time>
            {channelName ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="news-article-game-channel">{channelName}</span>
              </>
            ) : null}
          </>
        ) : kind === "live" || kind === "halftime" ? (
          <span>{liveStatus}</span>
        ) : (
          <span>{kind === "finished" ? "Finalizado" : statusLabel(match.status)}</span>
        )}
      </span>
    </article>
  );
}

function articleParagraphs(body?: string | null) {
  return (body ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

async function readArticle(slug: string) {
  const rows = await fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
  );

  return rows[0] ?? null;
}

async function readMoreArticles(currentSlug: string) {
  return fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=*&status=eq.published&slug=neq.${encodeURIComponent(
      currentSlug
    )}&order=published_at.desc.nullslast&limit=5`
  ).catch(() => []);
}

async function readArticleMatchdayContext(article: EditorialArticle) {
  if (!article.matchday_id) {
    return null;
  }

  try {
    const matchdays = await fetchSupabaseAdminTable<SupabaseMatchday>(
      `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&id=eq.${encodeURIComponent(
        article.matchday_id
      )}&limit=1`
    );
    const matchday = matchdays[0] ?? null;
    const seasonId = matchday?.season_id ?? article.season_id;

    if (!matchday || !seasonId) {
      return null;
    }

    const seasons = await fetchSupabaseAdminTable<SupabaseSeason>(
      `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&id=eq.${encodeURIComponent(seasonId)}&limit=1`
    );
    const season = seasons[0] ?? null;
    const competitionId = season?.competition_id ?? article.competition_id;

    if (!season || !competitionId) {
      return null;
    }

    const competitions = await fetchSupabaseAdminTable<SupabaseCompetition>(
      `competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&id=eq.${encodeURIComponent(
        competitionId
      )}&limit=1`
    );
    const competition = competitions[0] ?? null;

    if (!competition?.slug || !matchday.number) {
      return null;
    }

    const { context } = await getPublicMatchdayDiagnostic({
      competitionSlug: competition.slug,
      seasonLabel: seasonLabelToUrlSegment(season.label),
      matchdayNumber: matchday.number
    });

    return context;
  } catch {
    return null;
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await readArticle(slug);

  if (!article) {
    notFound();
  }

  const [moreArticles, articleContext, publicCompetitionMenuBase] = await Promise.all([
    readMoreArticles(slug),
    readArticleMatchdayContext(article),
    getPublicCompetitionMenu().catch(() => [])
  ]);
  const label = firstText(article.label, article.category, article.type);
  const subtitle = firstText(article.subtitle, article.summary, article.excerpt);
  const author = firstText(article.author, article.author_name);
  const publishedAt = formatDate(article.published_at ?? article.created_at);
  const paragraphs = articleParagraphs(article.body);
  const articleMatches = articleContext?.matchesForMatchday ?? [];
  const seasonSegment = articleContext ? seasonLabelToUrlSegment(articleContext.season.label) : null;
  const matchdayHref = (matchdayNumber: number) =>
    articleContext && seasonSegment
      ? `/competicoes/${articleContext.competition.slug}/${seasonSegment}/jornadas/${matchdayNumber}`
      : "/";
  const gamesPageHref =
    articleContext && seasonSegment
      ? `/competicoes/${articleContext.competition.slug}/${seasonSegment}/jornadas/${articleContext.matchday.number}/jogos`
      : null;
  const classificationHref = articleContext ? `${matchdayHref(articleContext.matchday.number)}#classificacao` : null;
  const currentCompetitionMenuItem =
    articleContext && seasonSegment
      ? {
          label: articleContext.competition.name,
          slug: articleContext.competition.slug,
          href: matchdayHref(articleContext.matchday.number)
        }
      : null;
  const publicCompetitionMenu = currentCompetitionMenuItem
    ? publicCompetitionMenuBase.map((item) => (item.slug === currentCompetitionMenuItem.slug ? currentCompetitionMenuItem : item))
    : publicCompetitionMenuBase;
  const seasonOptions =
    articleContext && seasonSegment
      ? articleContext.seasons.map((season) => ({
          id: season.id,
          label: season.label,
          href: `/competicoes/${articleContext.competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1`
        }))
      : [];
  const currentSeasonHref = articleContext && seasonSegment ? `/competicoes/${articleContext.competition.slug}/${seasonSegment}/jornadas/1` : "/";

  return (
    <div className="news-article-shell">
      <style>{articlePageStyles}</style>
      <div className="public-top-stack">
        <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
          <a className="public-site-brand" href="/">
            Jornada<span>.pt</span>
          </a>
          <nav className="public-site-menu" aria-label="Competições principais">
            {publicCompetitionMenu.map((item) => (
              <a
                aria-current={articleContext?.competition.slug === item.slug ? "page" : undefined}
                href={item.href}
                key={item.slug}
              >
                {item.label}
              </a>
            ))}
            {gamesPageHref ? <a href={gamesPageHref}>Jogos</a> : null}
            {classificationHref ? <a href={classificationHref}>Classificação</a> : null}
          </nav>
          <div className="public-site-actions" aria-label="Ações">
            <span className="public-site-search" aria-label="Pesquisar">
              Pesquisar
            </span>
            <a href="/admin/gestor">Entrar</a>
          </div>
        </header>
        {articleContext ? (
          <section className="public-season-nav-bar" aria-label="Navegação de jornadas">
            <div className="public-hidden-heading">
              <h2>Jornadas</h2>
              <p>Navegação principal da época {articleContext.season.label}.</p>
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
              <nav className="public-matchday-nav" aria-label="Jornadas">
                {articleContext.matchdays.map((matchday) => (
                  <a
                    aria-current={matchday.id === articleContext.matchday.id ? "page" : undefined}
                    href={matchdayHref(matchday.number)}
                    key={matchday.id}
                  >
                    J{String(matchday.number).padStart(2, "0")}
                  </a>
                ))}
              </nav>
            </div>
          </section>
        ) : null}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var select = document.querySelector("[data-season-select]");
              if (select) {
                select.addEventListener("change", function () {
                  if (select.value) window.location.href = select.value;
                });
              }
            });
          `
        }}
      />
      {articleMatches.length > 0 ? (
        <section className="news-article-games-strip" aria-label="Jogos da jornada associados a esta notícia">
          <div className="news-article-games-scroller">
            {articleMatches.map((match) => (
              <ArticleMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}
      <main className="news-article-layout">
        <article className="news-article-main">
          {label ? (
            <div className="news-article-kickers">
              <span className="news-article-label">{label}</span>
            </div>
          ) : null}

          <h1 className="news-article-title">{article.title}</h1>
          {subtitle ? <p className="news-article-subtitle">{subtitle}</p> : null}

          <div className="news-article-meta">
            {author ? <span className="news-article-author">{author}</span> : null}
            {publishedAt ? <time dateTime={article.published_at ?? article.created_at ?? undefined}>{publishedAt}</time> : null}
          </div>

          {article.image_url ? (
            <figure className="news-article-image">
              <img alt="" src={article.image_url} />
              {article.image_caption ? <figcaption>{article.image_caption}</figcaption> : null}
            </figure>
          ) : null}

          <div className="news-article-body">
            {paragraphs.length > 0 ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : null}
          </div>
        </article>

        <aside className="news-article-sidebar">
          <div className="news-article-ad" aria-label="Publicidade">
            Publicidade
          </div>
          {moreArticles.length > 0 ? (
            <section className="news-article-side-panel" aria-label="Artigos relacionados">
              <ul className="news-article-side-list">
                {moreArticles.map((item) => {
                  const itemLabel = firstText(item.label, item.category, item.type);
                  const itemSubtitle = firstText(item.subtitle, item.summary, item.excerpt);
                  const itemDate = formatShortDate(item.published_at);

                  return (
                    <li className="news-article-side-item" key={item.id}>
                      {item.image_url ? (
                        <img alt="" src={item.image_url} />
                      ) : (
                        <span className="news-article-side-thumb-placeholder" aria-hidden="true" />
                      )}
                      <div className="news-article-side-copy">
                        {itemLabel ? <span className="news-article-side-label">{itemLabel}</span> : null}
                        <a href={publicArticleHref(item)}>{item.title}</a>
                        {itemSubtitle ? <p className="news-article-side-subtitle">{itemSubtitle}</p> : null}
                        {itemDate ? <time className="news-article-side-date" dateTime={item.published_at ?? undefined}>{itemDate}</time> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
