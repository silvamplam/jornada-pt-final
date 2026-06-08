import Link from "next/link";
import PublicMatchStrip, { type PublicMatchStripMatch } from "@/components/public/PublicMatchStrip";
import { publicEditorialStyles } from "@/components/public/publicEditorialStyles";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type EditorialArticle = {
  id: string;
  slug: string;
  status: "draft" | "published";
  scope: "home" | "matchday" | "competition" | "general";
  season_id: string | null;
  matchday_id: string | null;
  competition_id: string | null;
  title: string | null;
  subtitle: string | null;
  label: string | null;
  author: string | null;
  image_url: string | null;
  image_caption: string | null;
  body: string | null;
  published_at: string | null;
  created_at: string | null;
};

type RelatedArticle = {
  id: string;
  slug: string;
  title: string | null;
  label: string | null;
  image_url: string | null;
  published_at: string | null;
  season_id: string | null;
  matchday_id: string | null;
  competition_id: string | null;
};

type ArticleMatchdayRow = {
  id: string;
  number: number | null;
  season_id: string | null;
};

type ArticleSeasonRow = {
  id: string;
  label: string | null;
  competition_id: string | null;
};

type ArticleCompetitionRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type ArticleMatchRow = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  kickoff_at: string | null;
  status: string | null;
  minute: number | string | null;
  home_score: number | null;
  away_score: number | null;
  broadcast_channel_id: string | null;
};

type ArticleTeamRow = {
  id: string;
  name: string | null;
  short_name: string | null;
  logo_url: string | null;
};

type ArticleBroadcastLinkRow = {
  match_id: string | null;
  broadcast_channel_id: string | null;
};

type ArticleBroadcastChannelRow = {
  id: string;
  name: string | null;
  logo_url: string | null;
};

type ArticleMatchdayFrame = {
  competition: {
    id: string;
    name: string;
    slug: string;
  } | null;
  season: {
    id: string;
    label: string;
  } | null;
  seasons: Array<{
    id: string;
    label: string;
  }>;
  matchday: {
    id: string;
    number: number;
  } | null;
  matchdays: Array<{
    id: string;
    number: number;
  }>;
  matches: PublicMatchStripMatch[];
};

const competitionLinks = [
  { label: "Liga Portugal", slug: "liga-portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
  { label: "La Liga", slug: "la-liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
  { label: "Premier League", slug: "premier-league", href: "/competicoes/premier-league/2026-27/jornadas/1" }
];

const articleStyles = `
  .public-article-page {
    max-width: 1220px;
    margin: 34px auto 78px;
    padding: 0 22px;
  }

  .public-article-layout {
    display: grid;
    grid-template-columns: minmax(0, 780px) minmax(280px, 340px);
    align-items: start;
    gap: 58px;
  }

  .public-article-reading {
    min-width: 0;
  }

  .public-article-card {
    background: #ffffff;
  }

  .public-article-header {
    padding: 0 0 14px;
  }

  .public-article-label {
    display: inline-block;
    margin: 4px 0 8px;
    color: #e5252a;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .public-article-title {
    max-width: 680px;
    margin: 0;
    color: #121212;
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: clamp(27px, 3.05vw, 39px);
    font-weight: 680;
    letter-spacing: 0;
    line-height: 1.05;
  }

  .public-article-subtitle {
    max-width: 680px;
    margin: 8px 0 0;
    color: #343434;
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 17px;
    line-height: 1.38;
  }

  .public-article-meta {
    display: grid;
    gap: 3px;
    margin-top: 12px;
    color: #5f5f5f;
    font-size: 12px;
    font-weight: 700;
  }

  .public-article-author {
    color: #3f3f3f;
    font-weight: 800;
  }

  .public-article-date {
    color: #6f6f6f;
    font-weight: 600;
  }

  .public-article-image {
    margin: 24px 0 0;
  }

  .public-article-image img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 430px;
    object-fit: cover;
    border-radius: 0;
  }

  .public-article-image figcaption {
    margin-top: 7px;
    color: #727272;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
  }

  .public-article-body {
    max-width: 670px;
    margin: 30px 0 0;
    color: #18212c;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    line-height: 1.68;
  }

  .public-article-body p {
    margin: 0 0 22px;
  }

  .public-article-sidebar {
    position: sticky;
    top: 22px;
    display: grid;
    gap: 22px;
  }

  .public-article-side-block {
    border-top: 5px solid #10151b;
    background: #ffffff;
    padding-top: 14px;
  }

  .public-article-side-block h2,
  .public-article-more h2 {
    margin: 0 0 14px;
    color: #10151b;
    font-size: 13px;
    font-weight: 950;
    letter-spacing: 0.07em;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-article-side-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .public-article-side-item {
    border-top: 1px solid #dfe5ec;
    padding: 13px 0;
  }

  .public-article-side-item:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .public-article-side-link {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }

  .public-article-side-link:not(.has-image) {
    display: block;
  }

  .public-article-side-thumb {
    display: block;
    width: 74px;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-article-side-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .public-article-side-label,
  .public-article-related-label {
    display: block;
    margin-bottom: 5px;
    color: #e5252a;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-article-side-title {
    display: block;
    color: #10151b;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.14;
  }

  .public-article-side-link:hover .public-article-side-title,
  .public-article-related-title:hover {
    text-decoration: underline;
  }

  .public-article-side-date {
    display: block;
    margin-top: 7px;
    color: #607086;
    font-size: 12px;
    font-weight: 800;
  }

  .public-article-ad-slot,
  .public-article-horizontal-ad {
    display: grid;
    place-items: center;
    min-height: 104px;
    border: 1px solid #dfe5ec;
    border-radius: 6px;
    background: #f7f9fb;
    color: #8a98a8;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .public-article-sidebar .public-article-ad-slot:first-child {
    min-height: 320px;
    background: #edf1f5;
  }

  .public-article-sidebar .public-article-ad-slot:last-child {
    min-height: 150px;
  }

  .public-article-horizontal-ad {
    min-height: 76px;
    margin-top: 42px;
  }

  .public-article-more {
    margin-top: 34px;
    border-top: 5px solid #10151b;
    padding-top: 16px;
  }

  .public-article-related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .public-article-related-card {
    border-top: 1px solid #dfe5ec;
    padding-top: 12px;
  }

  .public-article-related-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    margin-bottom: 10px;
    overflow: hidden;
    border-radius: 5px;
    background: #eef2f6;
  }

  .public-article-related-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .public-article-related-title {
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.04;
    text-decoration: none;
  }

  .public-article-empty {
    max-width: 760px;
    margin: 60px auto;
    padding: 36px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-article-empty p,
  .public-article-empty h1 {
    margin: 0;
  }

  .public-article-empty p:first-child {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-article-empty h1 {
    margin-top: 10px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 46px;
    line-height: 1;
  }

  .public-article-empty p + p {
    margin-top: 14px;
    color: #607086;
    font-size: 17px;
    line-height: 1.45;
  }

  .public-article-empty a {
    color: #10151b;
  }

  @media (max-width: 760px) {
    .public-article-page {
      margin-top: 20px;
      padding: 0 16px;
    }

    .public-article-layout {
      display: block;
    }

    .public-article-title {
      font-size: 34px;
    }

    .public-article-subtitle {
      font-size: 16px;
    }

    .public-article-body {
      font-size: 19px;
    }

    .public-article-sidebar {
      position: static;
      margin-top: 36px;
    }

    .public-article-sidebar .public-article-ad-slot:first-child,
    .public-article-sidebar .public-article-ad-slot:last-child {
      min-height: 96px;
    }

    .public-article-related-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function inFilter(values: string[]) {
  return `in.(${values.map((value) => encodeURIComponent(value)).join(",")})`;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function readRowsById<T extends { id: string }>(table: string, select: string, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, T>();
  }

  const rows = await fetchSupabaseAdminTable<T>(
    `${table}?select=${select}&id=${inFilter(ids)}`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.id, row]));
}

function seasonLabelToUrlSegment(label: string | null | undefined) {
  return encodeURIComponent((cleanText(label) || "epoca").replace(/\//g, "-"));
}

function formatPublishedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function formatMatchdayDateContext(matches: PublicMatchStripMatch[]) {
  const kickoffDates = matches
    .map((match) => (match.kickoff_at ? new Date(match.kickoff_at) : null))
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()))
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
    return `${dayFormatter.format(firstDate)}-${dayFormatter.format(lastDate)} ${monthFormatter.format(lastDate)}`;
  }

  return `${firstLabel} - ${lastLabel}`;
}

function bodyBlocks(body: string | null) {
  const text = cleanText(body);
  if (!text) return [];

  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

async function readArticle(slug: string) {
  const rows = await fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=id,slug,status,scope,season_id,matchday_id,competition_id,title,subtitle,label,author,image_url,image_caption,body,published_at,created_at&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
  ).catch(() => []);

  return rows[0] ?? null;
}

async function readBroadcastChannelsByMatchId(matchIds: string[], matches: ArticleMatchRow[] = []) {
  const channelsByMatchId = new Map<string, ArticleBroadcastChannelRow>();
  if (matchIds.length === 0) return channelsByMatchId;

  const directChannelIdsByMatchId = new Map(
    matches
      .filter((match) => Boolean(match.broadcast_channel_id))
      .map((match) => [match.id, match.broadcast_channel_id as string])
  );
  const directChannelsById = await readRowsById<ArticleBroadcastChannelRow>(
    "broadcast_channels",
    "id,name,logo_url",
    uniqueValues(Array.from(directChannelIdsByMatchId.values()))
  );

  for (const [matchId, channelId] of directChannelIdsByMatchId) {
    const channel = directChannelsById.get(channelId);
    if (channel) {
      channelsByMatchId.set(matchId, channel);
    }
  }

  const matchFilter = inFilter(matchIds);
  const relationQueries = [
    `match_broadcast_channels?select=match_id,broadcast_channel_id&match_id=${matchFilter}`,
    `match_broadcasts?select=match_id,broadcast_channel_id&match_id=${matchFilter}`,
    `matches_broadcast_channels?select=match_id,broadcast_channel_id&match_id=${matchFilter}`
  ];
  let links: ArticleBroadcastLinkRow[] = [];

  for (const query of relationQueries) {
    links = await fetchSupabaseAdminTable<ArticleBroadcastLinkRow>(query).catch(() => []);
    if (links.length > 0) break;
  }

  if (links.length === 0) return channelsByMatchId;

  const channelsById = await readRowsById<ArticleBroadcastChannelRow>(
    "broadcast_channels",
    "id,name,logo_url",
    uniqueValues(links.map((link) => link.broadcast_channel_id))
  );

  for (const link of links) {
    if (!link.match_id || !link.broadcast_channel_id || channelsByMatchId.has(link.match_id)) continue;
    const channel = channelsById.get(link.broadcast_channel_id);
    if (channel) {
      channelsByMatchId.set(link.match_id, channel);
    }
  }

  return channelsByMatchId;
}

async function readMatchdayMatches(matchdayId: string): Promise<PublicMatchStripMatch[]> {
  const matches = await fetchSupabaseAdminTable<ArticleMatchRow>(
    `matches?select=id,home_team_id,away_team_id,kickoff_at,status,minute,home_score,away_score,broadcast_channel_id&matchday_id=eq.${encodeURIComponent(matchdayId)}&order=kickoff_at.asc&limit=100`
  ).catch(() => []);
  const matchIds = matches.map((match) => match.id);
  const [teamsById, broadcastChannelsByMatchId] = await Promise.all([
    readRowsById<ArticleTeamRow>(
      "teams",
      "id,name,short_name,logo_url",
      uniqueValues(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))
    ),
    readBroadcastChannelsByMatchId(matchIds, matches)
  ]);

  return matches.map((match) => ({
    id: match.id,
    kickoff_at: match.kickoff_at,
    status: match.status ?? "scheduled",
    minute: match.minute,
    home_score: match.home_score,
    away_score: match.away_score,
    homeTeam: match.home_team_id ? teamsById.get(match.home_team_id) ?? null : null,
    awayTeam: match.away_team_id ? teamsById.get(match.away_team_id) ?? null : null,
    broadcastChannel: broadcastChannelsByMatchId.get(match.id) ?? null
  }));
}

async function readArticleFrame(article: EditorialArticle): Promise<ArticleMatchdayFrame | null> {
  let matchday: ArticleMatchdayRow | null = null;
  let seasonId = article.season_id;
  let competitionId = article.competition_id;

  if (article.matchday_id) {
    const matchdayRows = await fetchSupabaseAdminTable<ArticleMatchdayRow>(
      `matchdays?select=id,number,season_id&id=eq.${encodeURIComponent(article.matchday_id)}&limit=1`
    ).catch(() => []);
    matchday = matchdayRows[0] ?? null;
    if (matchday?.season_id) {
      seasonId = matchday.season_id;
    }
  }

  const seasonRows = seasonId
    ? await fetchSupabaseAdminTable<ArticleSeasonRow>(
        `seasons?select=id,label,competition_id&id=eq.${encodeURIComponent(seasonId)}&limit=1`
      ).catch(() => [])
    : [];
  const season = seasonRows[0] ?? null;

  if (matchday && season?.competition_id) {
    competitionId = season.competition_id;
  }

  const competitionRows = competitionId
    ? await fetchSupabaseAdminTable<ArticleCompetitionRow>(
        `competitions?select=id,name,slug&id=eq.${encodeURIComponent(competitionId)}&limit=1`
      ).catch(() => [])
    : [];
  const competition = competitionRows[0] ?? null;
  const competitionSlug = cleanText(competition?.slug);

  if (!season && !competition) return null;

  const [seasonRowsForCompetition, matchdayRowsForSeason, matches] = await Promise.all([
    competition?.id
      ? fetchSupabaseAdminTable<ArticleSeasonRow>(
          `seasons?select=id,label,competition_id&competition_id=eq.${encodeURIComponent(competition.id)}&order=label.desc&limit=100`
        ).catch(() => [])
      : Promise.resolve([]),
    season?.id && matchday
      ? fetchSupabaseAdminTable<ArticleMatchdayRow>(
          `matchdays?select=id,number,season_id&season_id=eq.${encodeURIComponent(season.id)}&order=number.asc&limit=200`
        ).catch(() => [])
      : Promise.resolve([]),
    matchday?.id ? readMatchdayMatches(matchday.id) : Promise.resolve([])
  ]);

  return {
    competition: competition?.id && competitionSlug
      ? {
          id: competition.id,
          name: cleanText(competition.name) || competitionSlug,
          slug: competitionSlug
        }
      : null,
    season: season?.id
      ? {
          id: season.id,
          label: cleanText(season.label) || "Epoca"
        }
      : null,
    seasons: seasonRowsForCompetition
      .filter((row) => row.id && cleanText(row.label))
      .map((row) => ({ id: row.id, label: cleanText(row.label) || "Epoca" })),
    matchday: matchday?.id
      ? {
          id: matchday.id,
          number: matchday.number ?? 1
        }
      : null,
    matchdays: matchdayRowsForSeason
      .filter((row) => row.id)
      .map((row) => ({ id: row.id, number: row.number ?? 1 })),
    matches
  };
}

function relatedPriority(article: EditorialArticle, relatedArticle: RelatedArticle) {
  if (article.matchday_id && relatedArticle.matchday_id === article.matchday_id) return 0;
  if (article.season_id && relatedArticle.season_id === article.season_id) return 1;
  if (article.competition_id && relatedArticle.competition_id === article.competition_id) return 2;
  return 3;
}

async function readRelatedArticles(article: EditorialArticle) {
  const competitionFilter = article.competition_id
    ? `&competition_id=eq.${encodeURIComponent(article.competition_id)}`
    : "";
  const rows = await fetchSupabaseAdminTable<RelatedArticle>(
    `editorial_articles?select=id,slug,title,label,image_url,published_at,season_id,matchday_id,competition_id&status=eq.published&slug=neq.${encodeURIComponent(article.slug)}${competitionFilter}&order=published_at.desc&limit=50`
  ).catch(() => []);

  return rows.sort((firstArticle, secondArticle) => {
    const priorityDifference = relatedPriority(article, firstArticle) - relatedPriority(article, secondArticle);
    if (priorityDifference !== 0) return priorityDifference;

    const firstTime = firstArticle.published_at ? new Date(firstArticle.published_at).getTime() : 0;
    const secondTime = secondArticle.published_at ? new Date(secondArticle.published_at).getTime() : 0;

    return secondTime - firstTime;
  });
}

function PublicHeader({ frame }: { frame?: ArticleMatchdayFrame | null }) {
  const activeCompetition = frame?.competition ?? null;
  const seasonSegment = frame?.season ? seasonLabelToUrlSegment(frame.season.label) : null;
  const currentMatchdayNumber = frame?.matchday?.number ?? 1;
  const competitionMenu = activeCompetition && seasonSegment
    ? competitionLinks.map((link) =>
        link.slug === activeCompetition.slug
          ? {
              ...link,
              label: activeCompetition.name,
              href: `/competicoes/${activeCompetition.slug}/${seasonSegment}/jornadas/${currentMatchdayNumber}`
            }
          : link
      )
    : competitionLinks;
  const contextualMatchdayHref = activeCompetition && seasonSegment
    ? `/competicoes/${activeCompetition.slug}/${seasonSegment}/jornadas/${currentMatchdayNumber}`
    : null;
  const jogosHref = frame?.matchday ? "#jogos" : contextualMatchdayHref ? `${contextualMatchdayHref}#jogos` : "/competicoes/liga-portugal/2026-27/jornadas/1#jogos";
  const classificacaoHref = activeCompetition && seasonSegment
    ? `${contextualMatchdayHref}#classificacao`
    : "/competicoes/liga-portugal/2026-27/jornadas/1#classificacao";

  return (
    <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
      <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
        Jornada<span>.pt</span>
      </Link>
      <nav className="public-site-menu" aria-label="Competicoes principais">
        {competitionMenu.map((link) => (
          <Link
            aria-current={activeCompetition && link.slug === activeCompetition.slug ? "page" : undefined}
            href={link.href}
            key={link.slug}
          >
            {link.label}
          </Link>
        ))}
        <Link href={jogosHref}>Jogos</Link>
        <Link href={classificacaoHref}>Classificação</Link>
      </nav>
      <div className="public-site-actions" aria-label="Acoes">
        <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
        <Link href="/admin/login">Entrar</Link>
      </div>
    </header>
  );
}

function ArticleGlobalHeader({ frame }: { frame?: ArticleMatchdayFrame | null }) {
  return (
    <div className="public-top-stack">
      <PublicHeader frame={frame} />
    </div>
  );
}

function ArticleMatchdayContextFrame({ frame }: { frame: ArticleMatchdayFrame }) {
  if (!frame.competition || !frame.season || !frame.matchday) {
    return <ArticleGlobalHeader frame={frame} />;
  }

  const competition = frame.competition;
  const season = frame.season;
  const selectedMatchday = frame.matchday;
  const seasonSegment = seasonLabelToUrlSegment(season.label);
  const currentSeasonHref = `/competicoes/${competition.slug}/${seasonSegment}/jornadas/1`;
  const seasons = frame.seasons.length > 0 ? frame.seasons : [season];
  const matchdays = frame.matchdays.length > 0 ? frame.matchdays : [selectedMatchday];
  const selectedMatchdayDateContext = formatMatchdayDateContext(frame.matches);
  const matchdayHref = (matchdayNumber: number) =>
    `/competicoes/${competition.slug}/${seasonSegment}/jornadas/${matchdayNumber}`;

  return (
    <>
      <div className="public-top-stack">
        <PublicHeader frame={frame} />
        <section className="public-season-nav-bar" aria-label="Navegacao de jornadas">
          <div className="public-hidden-heading">
            <h2>Jornadas</h2>
            <p>Navegacao principal da epoca {season.label}.</p>
          </div>
          <div className="public-season-nav-inner">
            <label className="public-season-select-wrap">
              <span>Epoca</span>
              <select className="public-season-select" data-article-season-select defaultValue={currentSeasonHref}>
                {seasons.map((season) => (
                  <option
                    key={season.id}
                    value={`/competicoes/${competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1`}
                  >
                    {season.label}
                  </option>
                ))}
              </select>
            </label>
            <nav className="public-matchday-nav">
              {matchdays.map((matchday) => (
                <a
                  aria-current={matchday.id === selectedMatchday.id ? "page" : undefined}
                  href={matchdayHref(matchday.number)}
                  key={matchday.id}
                >
                  J{String(matchday.number).padStart(2, "0")}
                </a>
              ))}
            </nav>
            <div className="public-matchday-date-row" aria-label="Data da jornada selecionada">
              <span className="public-matchday-date-context">{selectedMatchdayDateContext}</span>
            </div>
          </div>
        </section>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var select = document.querySelector("[data-article-season-select]");
              if (!select) return;
              select.addEventListener("change", function () {
                if (select.value) window.location.href = select.value;
              });
            });
          `
        }}
      />
      <div id="jogos">
        <PublicMatchStrip matches={frame.matches} />
      </div>
    </>
  );
}

function NotFoundArticle() {
  return (
    <section className="public-article-empty" aria-label="Noticia nao encontrada">
      <p>Noticia</p>
      <h1>Noticia nao encontrada</h1>
      <p>O artigo pode ainda estar em rascunho, nao existir ou ter sido retirado da leitura publica.</p>
    </section>
  );
}

function relatedArticleTitle(article: RelatedArticle) {
  return cleanText(article.title) || article.slug;
}

function ArticleSideList({ articles, title }: { articles: RelatedArticle[]; title: string }) {
  if (articles.length === 0) return null;

  return (
    <section className="public-article-side-block" aria-label={title}>
      <h2>{title}</h2>
      <ul className="public-article-side-list">
        {articles.map((article) => {
          const articleLabel = cleanText(article.label) || "Noticia";
          const articleDate = formatShortDate(article.published_at);
          const imageUrl = cleanText(article.image_url);

          return (
            <li className="public-article-side-item" key={article.id}>
              <Link className={`public-article-side-link${imageUrl ? " has-image" : ""}`} href={`/noticias/${article.slug}`}>
                {imageUrl ? (
                  <span className="public-article-side-thumb">
                    <img alt="" src={imageUrl} />
                  </span>
                ) : null}
                <span>
                  <span className="public-article-side-label">{articleLabel}</span>
                  <span className="public-article-side-title">{relatedArticleTitle(article)}</span>
                  {articleDate ? <span className="public-article-side-date">{articleDate}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ArticleSidebar({ articles }: { articles: RelatedArticle[] }) {
  return (
    <aside className="public-article-sidebar" aria-label="Mais no Jornada.pt">
      <div className="public-article-ad-slot" aria-label="Espaco reservado">
        PUBLICIDADE
      </div>
      <ArticleSideList articles={articles} title="Mais noticias" />
      <div className="public-article-ad-slot" aria-label="Espaco reservado">
        PUBLICIDADE
      </div>
    </aside>
  );
}

function MoreArticles({ articles }: { articles: RelatedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="public-article-more" aria-label="Ler tambem">
      <h2>Ler tambem</h2>
      <div className="public-article-related-grid">
        {articles.map((article) => (
          <article className="public-article-related-card" key={article.id}>
            {cleanText(article.image_url) ? (
              <Link className="public-article-related-image" href={`/noticias/${article.slug}`}>
                <img alt="" src={cleanText(article.image_url) ?? ""} />
              </Link>
            ) : null}
            <span className="public-article-related-label">{cleanText(article.label) || "Noticia"}</span>
            <Link className="public-article-related-title" href={`/noticias/${article.slug}`}>
              {relatedArticleTitle(article)}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await readArticle(slug);
  const [relatedArticles, matchdayFrame]: [RelatedArticle[], ArticleMatchdayFrame | null] = article
    ? await Promise.all([readRelatedArticles(article), readArticleFrame(article)])
    : [[], null];
  const blocks = bodyBlocks(article?.body ?? null);
  const label = cleanText(article?.label) || "Noticia";
  const title = article ? cleanText(article.title) || article.slug : null;
  const subtitle = cleanText(article?.subtitle);
  const imageUrl = cleanText(article?.image_url);
  const imageCaption = cleanText(article?.image_caption);
  const author = cleanText(article?.author);
  const publishedAtSource = article?.published_at ?? article?.created_at ?? null;
  const publishedAt = formatPublishedAt(publishedAtSource);
  const sidebarArticles = relatedArticles.slice(0, 5);
  const moreArticles = relatedArticles.length > 5 ? relatedArticles.slice(5, 11) : relatedArticles.slice(0, 6);

  return (
    <main className="public-matchday-shell">
      <style>{`${publicEditorialStyles}\n${articleStyles}`}</style>
      {matchdayFrame?.matchday ? <ArticleMatchdayContextFrame frame={matchdayFrame} /> : <ArticleGlobalHeader frame={matchdayFrame} />}

      <div className="public-article-page">
        {!article || !title ? (
          <NotFoundArticle />
        ) : (
          <>
            <div className="public-article-layout">
              <article className="public-article-reading">
                <div className="public-article-card">
                  <header className="public-article-header">
                    <span className="public-article-label">{label}</span>
                    <h1 className="public-article-title">{title}</h1>
                    {subtitle ? <p className="public-article-subtitle">{subtitle}</p> : null}
                    {author || publishedAt ? (
                      <div className="public-article-meta">
                        {author ? <span className="public-article-author">{author}</span> : null}
                        {publishedAt ? (
                          <time className="public-article-date" dateTime={publishedAtSource ?? undefined}>
                            {publishedAt}
                          </time>
                        ) : null}
                      </div>
                    ) : null}
                  </header>

                  {imageUrl ? (
                    <figure className="public-article-image">
                      <img alt="" src={imageUrl} />
                      {imageCaption ? <figcaption>{imageCaption}</figcaption> : null}
                    </figure>
                  ) : null}

                  <div className="public-article-body">
                    {blocks.length > 0 ? (
                      blocks.map((block, index) => (
                        <p key={`${article.id}-paragraph-${index}`}>
                          {block.split(/\n/).map((line, lineIndex, lines) => (
                            <span key={`${article.id}-paragraph-${index}-line-${lineIndex}`}>
                              {line}
                              {lineIndex < lines.length - 1 ? <br /> : null}
                            </span>
                          ))}
                        </p>
                      ))
                    ) : (
                      <p>Texto em preparacao.</p>
                    )}
                  </div>
                </div>
              </article>

              <ArticleSidebar articles={sidebarArticles} />
            </div>

            <div className="public-article-horizontal-ad" aria-label="Espaco reservado">
              PUBLICIDADE
            </div>

            <MoreArticles articles={moreArticles} />
          </>
        )}
      </div>
    </main>
  );
}
