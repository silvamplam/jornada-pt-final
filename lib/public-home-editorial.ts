import type { Article, Competition, Headline, HomeContext, Matchday, ResolvedMatch, Season, Team } from "@/lib/jornada";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

type SiteEditorial = {
  id: string;
  status: string | null;
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_link_url: string | null;
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_text: string | null;
  side_block_author: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
  side_block_status: string | null;
  complementary_mode: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: string | null;
  complementary_roundup_item_id: string | null;
  below_headline_heading: string | null;
  roundup_video_heading: string | null;
  final_zone_title: string | null;
  final_zone_title_color: string | null;
  final_zone_mode: string | null;
};

type SiteEditorialHighlight = {
  id: string;
  sort_order: number | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string | null;
};

type SiteEditorialRoundupItem = {
  id: string;
  sort_order: number | null;
  type: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  duration: string | null;
  image_url: string | null;
  video_url: string | null;
  status: string | null;
};

type SiteEditorialLatestNews = {
  id: string;
  sort_order: number | null;
  time_label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string | null;
};

type SiteFeaturedMatch = {
  match_id: string | null;
  sort_order: number | null;
};

type PublicHomeMatch = {
  id: string;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  home_team_id: string;
  away_team_id: string;
  status: string | null;
  minute: number | null;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  broadcast_channel_id: string | null;
};

type PublicHomeCompetition = {
  id: string;
  name: string;
  slug: string | null;
  country: string | null;
  logo_url: string | null;
  accent_color?: string | null;
};

type PublicHomeSeason = {
  id: string;
  competition_id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
};

type PublicHomeMatchday = {
  id: string;
  season_id: string;
  number: number | null;
  label: string | null;
  starts_on: string | null;
  ends_on: string | null;
  status: string | null;
};

type PublicHomeTeam = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
};

type PublicHomeBroadcastChannel = {
  id: string;
  name: string;
  platform: string | null;
  country: string | null;
  logo_url: string | null;
};

export type PublicHomeEditorialOverlay = {
  featuredMatches: ResolvedMatch[];
  headline: Headline | null;
  headlineMatch: ResolvedMatch | null;
  sideBlock: Article | null;
  highlights: Article[];
  highlightsTitle: string | null;
  latestNews: Article[];
  latestZoneTitle: string | null;
  latestZoneTitleColor: string | null;
  latestZoneMode: "latest_news" | "editorial_line" | null;
  roundupItems: Article[];
  roundupTitle: string | null;
  complement: Article | null;
};

function cleanText(value: string | null | undefined) {
  const cleanValue = value?.trim();
  return cleanValue ? cleanValue : null;
}

function safeHref(value: string | null | undefined) {
  const cleanValue = cleanText(value);
  if (!cleanValue) {
    return undefined;
  }

  if (cleanValue.startsWith("/") || cleanValue.startsWith("https://") || cleanValue.startsWith("http://")) {
    return cleanValue;
  }

  return undefined;
}

function safeColor(value: string | null | undefined) {
  const cleanValue = cleanText(value);
  return cleanValue && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(cleanValue) ? cleanValue : null;
}

function isPublished(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "published";
}

function sortByOrder<T extends { sort_order: number | null }>(items: T[]) {
  return [...items].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

function fallbackImage(context: HomeContext, index = 0) {
  return context.topArticles[index]?.image ?? context.featured.headline.image;
}

function baseArticle(context: HomeContext, id: string, index = 0): Article {
  return {
    id,
    slug: id,
    title: "",
    dek: "",
    category: "Editorial",
    competitionId: context.featured.competition.id,
    seasonId: context.featured.season.id,
    matchdayId: context.featured.matchday.id,
    teamIds: [],
    playerIds: [],
    image: fallbackImage(context, index),
    publishedAtMoment: "",
    importance: 100 - index
  };
}

function articleFromEditorial(
  context: HomeContext,
  id: string,
  input: {
    title: string | null;
    dek?: string | null;
    category?: string | null;
    image?: string | null;
    href?: string | null;
    moment?: string | null;
  },
  index = 0
): Article | null {
  const title = cleanText(input.title);
  if (!title) {
    return null;
  }

  return {
    ...baseArticle(context, id, index),
    title,
    dek: cleanText(input.dek) ?? "",
    category: cleanText(input.category) ?? "Editorial",
    image: cleanText(input.image) ?? fallbackImage(context, index),
    sourceUrl: safeHref(input.href),
    publishedAtMoment: cleanText(input.moment) ?? ""
  };
}

function overlayHeadline(context: HomeContext, editorial: SiteEditorial): Headline | null {
  const title = cleanText(editorial.headline_title);
  if (!title) {
    return null;
  }

  return {
    ...context.featured.headline,
    id: `site-home-headline-${editorial.id}`,
    title,
    dek: cleanText(editorial.headline_subtitle) ?? context.featured.headline.dek,
    image: cleanText(editorial.headline_image_url) ?? context.featured.headline.image,
    sourceUrl: safeHref(editorial.headline_link_url)
  };
}

function finalZoneModeLabel(mode: string | null | undefined) {
  if (mode === "latest_news") {
    return "Ultimas noticias";
  }
  if (mode === "editorial_line") {
    return "Linha editorial";
  }

  return "Editorial";
}

function mapMatchStatus(status: string | null | undefined): ResolvedMatch["status"] {
  const value = status?.trim().toLowerCase();

  if (value === "live" || value === "in_play" || value === "playing") {
    return "live";
  }
  if (value === "halftime" || value === "half_time" || value === "interval") {
    return "halftime";
  }
  if (value === "finished" || value === "final" || value === "full_time") {
    return "finished";
  }

  return "scheduled";
}

function toTeam(row: PublicHomeTeam): Team {
  return {
    id: row.id,
    name: row.name,
    shortName: cleanText(row.short_name) ?? row.name,
    badgeTone: cleanText(row.primary_color) ?? "#d8dee8",
    logo: cleanText(row.logo_url) ?? undefined
  };
}

function toCompetition(row: PublicHomeCompetition, season: Season): Competition {
  return {
    id: row.id,
    slug: cleanText(row.slug) ?? row.id,
    name: row.name,
    country: cleanText(row.country) ?? "",
    logo: cleanText(row.logo_url) ?? undefined,
    accent: cleanText(row.accent_color) ?? "#cf102d",
    currentSeasonId: season.id,
    summary: "",
    seasons: [season]
  };
}

function toMatchday(row: PublicHomeMatchday | undefined, fallbackId: string): Matchday {
  return {
    id: row?.id ?? fallbackId,
    number: row?.number ?? 0,
    label: cleanText(row?.label) ?? "Jornada",
    dateLabel: cleanText(row?.starts_on) ?? cleanText(row?.ends_on) ?? "",
    status: row?.status === "played" ? "played" : row?.status === "scheduled" ? "scheduled" : "current",
    headlineId: "",
    context: "",
    matchIds: [],
    standingId: ""
  };
}

async function readFeaturedMatches(): Promise<ResolvedMatch[]> {
  const featuredRows = sortByOrder(
    await fetchSupabaseAdminTable<SiteFeaturedMatch>("site_featured_matches?select=match_id,sort_order&order=sort_order.asc&limit=12")
  ).filter((item): item is SiteFeaturedMatch & { match_id: string } => Boolean(item.match_id));

  if (featuredRows.length === 0) {
    return [];
  }

  const matchIds = featuredRows.map((item) => item.match_id);
  const matchFilter = matchIds.map((id) => encodeURIComponent(id)).join(",");
  const matches = await fetchSupabaseAdminTable<PublicHomeMatch>(
    `matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id&id=in.(${matchFilter})`
  );

  if (matches.length === 0) {
    return [];
  }

  const competitionIds = [...new Set(matches.map((match) => match.competition_id))];
  const seasonIds = [...new Set(matches.map((match) => match.season_id))];
  const matchdayIds = [...new Set(matches.map((match) => match.matchday_id).filter((value): value is string => Boolean(value)))];
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const channelIds = [...new Set(matches.map((match) => match.broadcast_channel_id).filter((value): value is string => Boolean(value)))];

  const [competitions, seasons, matchdays, teams, channels] = await Promise.all([
    fetchSupabaseAdminTable<PublicHomeCompetition>(
      `competitions?select=id,name,slug,country,logo_url,accent_color&id=in.(${competitionIds.map((id) => encodeURIComponent(id)).join(",")})`
    ),
    fetchSupabaseAdminTable<PublicHomeSeason>(
      `seasons?select=id,competition_id,label,starts_on,ends_on&id=in.(${seasonIds.map((id) => encodeURIComponent(id)).join(",")})`
    ),
    matchdayIds.length > 0
      ? fetchSupabaseAdminTable<PublicHomeMatchday>(
          `matchdays?select=id,season_id,number,label,starts_on,ends_on,status&id=in.(${matchdayIds.map((id) => encodeURIComponent(id)).join(",")})`
        )
      : Promise.resolve([]),
    fetchSupabaseAdminTable<PublicHomeTeam>(
      `teams?select=id,name,short_name,logo_url,primary_color&id=in.(${teamIds.map((id) => encodeURIComponent(id)).join(",")})`
    ),
    channelIds.length > 0
      ? fetchSupabaseAdminTable<PublicHomeBroadcastChannel>(
          `broadcast_channels?select=id,name,platform,country,logo_url&id=in.(${channelIds.map((id) => encodeURIComponent(id)).join(",")})`
        )
      : Promise.resolve([])
  ]);

  const competitionsById = new Map(competitions.map((item) => [item.id, item]));
  const seasonsById = new Map(seasons.map((item) => [item.id, item]));
  const matchdaysById = new Map(matchdays.map((item) => [item.id, item]));
  const teamsById = new Map(teams.map((item) => [item.id, item]));
  const channelsById = new Map(channels.map((item) => [item.id, item]));
  const matchesById = new Map(matches.map((item) => [item.id, item]));

  return featuredRows
    .map((featuredRow) => {
      const match = matchesById.get(featuredRow.match_id);
      if (!match) {
        return null;
      }

      const seasonRow = seasonsById.get(match.season_id);
      const competitionRow = competitionsById.get(match.competition_id);
      const homeTeamRow = teamsById.get(match.home_team_id);
      const awayTeamRow = teamsById.get(match.away_team_id);

      if (!seasonRow || !competitionRow || !homeTeamRow || !awayTeamRow) {
        return null;
      }

      const matchday = toMatchday(match.matchday_id ? matchdaysById.get(match.matchday_id) : undefined, match.matchday_id ?? match.id);
      const season: Season = {
        id: seasonRow.id,
        label: seasonRow.label,
        currentMatchdayId: matchday.id,
        matchdays: [{ ...matchday, matchIds: [match.id] }]
      };
      const competition = toCompetition(competitionRow, season);
      const channel = match.broadcast_channel_id ? channelsById.get(match.broadcast_channel_id) : undefined;

      return {
        id: match.id,
        competitionId: match.competition_id,
        seasonId: match.season_id,
        matchdayId: matchday.id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        status: mapMatchStatus(match.status),
        minute: match.minute ?? undefined,
        kickoff: match.kickoff_at,
        score: {
          home: match.home_score,
          away: match.away_score
        },
        venue: cleanText(match.venue) ?? "",
        broadcast: channel
          ? {
              channel: channel.name,
              platform: cleanText(channel.platform) ?? channel.name,
              region: cleanText(channel.country) ?? "Portugal",
              coverage: "Direto",
              logoUrl: cleanText(channel.logo_url) ?? undefined
            }
          : undefined,
        articleIds: [],
        eventIds: [],
        goalIds: [],
        competition,
        matchday,
        homeTeam: toTeam(homeTeamRow),
        awayTeam: toTeam(awayTeamRow),
        articles: [],
        events: [],
        goals: []
      } satisfies ResolvedMatch;
    })
    .filter((match): match is ResolvedMatch => Boolean(match));
}

export async function getPublicHomeEditorialOverlay(context: HomeContext): Promise<PublicHomeEditorialOverlay | null> {
  try {
    const editorial = (
      await fetchSupabaseAdminTable<SiteEditorial>("site_editorials?select=*&slug=eq.home&status=eq.published&limit=1")
    )[0];

    if (!editorial) {
      return null;
    }

    const encodedId = encodeURIComponent(editorial.id);
    const [highlights, roundupItems, latestNews, featuredMatches] = await Promise.all([
      fetchSupabaseAdminTable<SiteEditorialHighlight>(
        `site_editorial_highlights?select=id,sort_order,label,title,subtitle,image_url,link_url,status&site_editorial_id=eq.${encodedId}&status=eq.published&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialRoundupItem>(
        `site_editorial_roundup_items?select=id,sort_order,type,label,title,subtitle,duration,image_url,video_url,status&site_editorial_id=eq.${encodedId}&status=eq.published&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialLatestNews>(
        `site_editorial_latest_news?select=id,sort_order,time_label,title,subtitle,image_url,link_url,status&site_editorial_id=eq.${encodedId}&status=eq.published&order=sort_order.asc`
      ),
      readFeaturedMatches()
    ]);

    const headline = overlayHeadline(context, editorial);
    const sideBlock = isPublished(editorial.side_block_status)
      ? articleFromEditorial(
          context,
          `site-side-${editorial.id}`,
          {
            title: editorial.side_block_title,
            dek: editorial.side_block_text,
            category: cleanText(editorial.side_block_label) ?? cleanText(editorial.side_block_type),
            image: editorial.side_block_image_url,
            href: editorial.side_block_link_url,
            moment: editorial.side_block_author
          },
          1
        )
      : null;
    const highlightsArticles = sortByOrder(highlights)
      .map((item, index) =>
        articleFromEditorial(
          context,
          `site-highlight-${item.id}`,
          {
            title: item.title,
            dek: item.subtitle,
            category: item.label,
            image: item.image_url,
            href: item.link_url
          },
          index + 1
        )
      )
      .filter((item): item is Article => Boolean(item));
    const latestNewsArticles = sortByOrder(latestNews)
      .map((item, index) =>
        articleFromEditorial(
          context,
          `site-latest-${item.id}`,
          {
            title: item.title,
            dek: item.subtitle,
            category: finalZoneModeLabel(editorial.final_zone_mode),
            image: item.image_url,
            href: item.link_url,
            moment: item.time_label
          },
          index + 2
        )
      )
      .filter((item): item is Article => Boolean(item));
    const roundupArticles = sortByOrder(roundupItems)
      .map((item, index) =>
        articleFromEditorial(
          context,
          `site-roundup-${item.id}`,
          {
            title: item.title,
            dek: cleanText(item.subtitle) ?? cleanText(item.duration),
            category: cleanText(item.label) ?? cleanText(item.type),
            image: item.image_url,
            href: item.video_url
          },
          index + 3
        )
      )
      .filter((item): item is Article => Boolean(item));
    const selectedRoundup = editorial.complementary_roundup_item_id
      ? roundupItems.find((item) => item.id === editorial.complementary_roundup_item_id)
      : roundupItems[0];
    const complement = editorial.complementary_mode === "roundup_video" && selectedRoundup
      ? articleFromEditorial(
          context,
          `site-complement-roundup-${selectedRoundup.id}`,
          {
            title: selectedRoundup.title,
            dek: cleanText(selectedRoundup.subtitle) ?? cleanText(selectedRoundup.duration),
            category: cleanText(selectedRoundup.label) ?? cleanText(selectedRoundup.type),
            image: selectedRoundup.image_url,
            href: selectedRoundup.video_url
          },
          4
        )
      : isPublished(editorial.complementary_status)
        ? articleFromEditorial(
            context,
            `site-complement-${editorial.id}`,
            {
              title: editorial.complementary_title,
              dek: editorial.complementary_text,
              category: editorial.complementary_label,
              image: editorial.complementary_image_url,
              href: editorial.complementary_link_url
            },
            4
          )
        : null;

    const overlay: PublicHomeEditorialOverlay = {
      featuredMatches,
      headline,
      headlineMatch: featuredMatches[0] ?? null,
      sideBlock,
      highlights: highlightsArticles,
      highlightsTitle: cleanText(editorial.below_headline_heading),
      latestNews: latestNewsArticles,
      latestZoneTitle: cleanText(editorial.final_zone_title) ?? "",
      latestZoneTitleColor: safeColor(editorial.final_zone_title_color),
      latestZoneMode: editorial.final_zone_mode === "latest_news" || editorial.final_zone_mode === "editorial_line"
        ? editorial.final_zone_mode
        : null,
      roundupItems: roundupArticles,
      roundupTitle: cleanText(editorial.roundup_video_heading),
      complement
    };

    const hasVisibleData = Boolean(
      overlay.featuredMatches.length ||
      overlay.headline ||
      overlay.sideBlock ||
      overlay.highlights.length ||
      overlay.latestNews.length ||
      overlay.roundupItems.length ||
      overlay.complement
    );

    return hasVisibleData ? overlay : null;
  } catch {
    return null;
  }
}
