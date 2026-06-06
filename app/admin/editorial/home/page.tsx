import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type HomeEditorial = {
  id: string;
  slug: string;
  status: "draft" | "published";
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_title_color: string | null;
  below_headline_mode: "highlights" | "roundup";
  below_headline_heading: string | null;
  below_headline_heading_color: string | null;
  side_block_status: "draft" | "published";
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_title_color: string | null;
  side_block_author: string | null;
  side_block_text: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
  complementary_mode: "none" | "complementary_story" | "roundup_video";
  complementary_roundup_item_id: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: "draft" | "published";
  roundup_video_heading: string | null;
  roundup_video_heading_color: string | null;
};

type HomeHighlight = {
  id: string;
  site_editorial_id: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

type HomeLatestNews = {
  id: string;
  site_editorial_id: string;
  time_label: string | null;
  title: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

type HomeRoundupItem = {
  id: string;
  site_editorial_id: string;
  sort_order: number;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  duration: string | null;
  type: "video" | "golos" | "resumo" | "noticia";
  status: "draft" | "published";
};

type HomeFeaturedMatch = {
  id: string;
  match_id: string;
  sort_order: number | null;
};

type AdminMatchRow = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  matchday_id: string | null;
  kickoff_at: string | null;
};

type AdminTeamRow = {
  id: string;
  name: string | null;
  short_name: string | null;
};

type AdminMatchdayRow = {
  id: string;
  number: number | null;
  season_id: string | null;
};

type AdminSeasonRow = {
  id: string;
  label: string | null;
  competition_id: string | null;
};

type AdminCompetitionRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type AdminFeaturedMatchOption = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string | null;
  matchdayNumber: number | null;
};

type AdminFeaturedMatchGroup = {
  competitionId: string;
  competitionName: string;
  sortOrder: number;
  matches: AdminFeaturedMatchOption[];
};

type HomeEditorialPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const HIGHLIGHT_SORT_ORDERS = Array.from({ length: 3 }, (_, index) => index + 1);
const ROUNDUP_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);
const LATEST_NEWS_SORT_ORDERS = Array.from({ length: 8 }, (_, index) => index + 1);

const styles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .home-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .home-admin-hero,
  .home-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .home-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
  }

  .home-admin-hero h1,
  .home-admin-hero p,
  .home-admin-hero small,
  .home-admin-panel h2,
  .home-admin-panel h3,
  .home-admin-panel p {
    margin: 0;
  }

  .home-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-hero h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1.05;
  }

  .home-admin-hero small {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .home-admin-hero-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .home-admin-button {
    display: inline-block;
    width: fit-content;
    padding: 12px 16px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .home-admin-button.secondary {
    border: 1px solid #dce3eb;
    background: #ffffff;
    color: #10151b;
  }

  .home-admin-hero .home-admin-button.secondary {
    border-color: rgba(255, 255, 255, 0.28);
    background: transparent;
    color: #ffffff;
  }

  .home-admin-grid,
  .home-admin-two-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .home-admin-panel {
    padding: 20px;
  }

  .home-admin-panel > header {
    margin-bottom: 16px;
  }

  .home-admin-panel > header p,
  .home-admin-muted {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .home-admin-form,
  .home-admin-stack {
    display: grid;
    gap: 14px;
  }

  .home-admin-stack {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
    align-items: start;
    margin-top: 18px;
  }

  .home-admin-headline-panel {
    grid-column: 1;
    order: 1;
  }

  .home-admin-side-panel {
    grid-column: 2;
    order: 2;
  }

  .home-admin-composition-panel {
    grid-column: 1;
    order: 3;
  }

  .home-admin-complement-panel {
    grid-column: 2;
    order: 4;
  }

  .home-admin-wide-panel {
    grid-column: 1 / -1;
  }

  .home-admin-highlights-panel,
  .home-admin-roundup-panel,
  .home-admin-latest-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-admin-highlights-panel > header,
  .home-admin-roundup-panel > header,
  .home-admin-latest-panel > header,
  .home-admin-highlights-panel > .home-admin-button,
  .home-admin-roundup-panel > .home-admin-button,
  .home-admin-latest-panel > .home-admin-button {
    grid-column: 1 / -1;
  }

  .home-admin-compact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .home-admin-field,
  .home-admin-fieldset {
    display: grid;
    gap: 6px;
  }

  .home-admin-field label,
  .home-admin-fieldset legend {
    color: #425061;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-field input,
  .home-admin-field textarea,
  .home-admin-field select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #c8d2dd;
    border-radius: 6px;
    padding: 11px 12px;
    background: #ffffff;
    color: #10151b;
    font: inherit;
  }

  .home-admin-field textarea {
    min-height: 110px;
    resize: vertical;
  }

  .home-admin-fieldset {
    margin: 0;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .home-admin-fieldset legend {
    width: fit-content;
    padding: 0 8px;
    color: #10151b;
  }

  .home-admin-hidden-form {
    display: none;
  }

  .home-admin-preview {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .home-admin-preview img {
    display: block;
    width: 100%;
    max-height: 220px;
    object-fit: cover;
  }

  .home-admin-message {
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid #b7e1c0;
    border-radius: 8px;
    background: #effaf1;
    color: #1f6d31;
    font-size: 14px;
    font-weight: 800;
  }

  .home-admin-message.warning {
    border-color: #ffd0d0;
    background: #fff3f3;
    color: #9d1c1f;
  }

  .editorial-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .editorial-admin-hero,
  .editorial-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .editorial-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
  }

  .editorial-admin-hero h1,
  .editorial-admin-hero p,
  .editorial-admin-hero small,
  .editorial-admin-panel h2,
  .editorial-admin-panel h3,
  .editorial-admin-panel h4,
  .editorial-admin-panel p {
    margin: 0;
  }

  .editorial-admin-hero h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1.05;
  }

  .editorial-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-admin-hero small {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .editorial-admin-hero-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .editorial-admin-button {
    display: inline-block;
    width: fit-content;
    padding: 12px 16px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .editorial-admin-button.secondary {
    border: 1px solid #dce3eb;
    background: #ffffff;
    color: #10151b;
  }

  .editorial-admin-hero .editorial-admin-button.secondary {
    border-color: rgba(255, 255, 255, 0.28);
    background: transparent;
    color: #ffffff;
  }

  .editorial-admin-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .editorial-admin-composition {
    margin-top: 18px;
  }

  .home-featured-matches-list {
    display: grid;
    gap: 14px;
  }

  .home-featured-matches-group {
    display: grid;
    gap: 6px;
    padding: 12px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .home-featured-matches-group h3 {
    margin: 0 0 4px;
    color: #10151b;
    font-size: 16px;
  }

  .home-featured-match-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid #e6ebf1;
    color: #263241;
    font-size: 14px;
    font-weight: 800;
  }

  .home-featured-match-row:first-of-type {
    border-top: 0;
  }

  .home-featured-match-row input {
    width: 17px;
    height: 17px;
    flex: 0 0 auto;
  }

  .editorial-admin-composition-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .editorial-admin-composition-card {
    display: grid;
    gap: 14px;
    align-content: start;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .editorial-admin-composition-card h3 {
    margin: 0;
    font-size: 17px;
  }

  .editorial-admin-composition-card > p {
    margin: -6px 0 0;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .editorial-admin-composition-side-stack {
    display: grid;
    gap: 16px;
    align-content: start;
    min-width: 0;
  }

  .editorial-admin-panel {
    padding: 20px;
  }

  .editorial-admin-panel > header {
    margin-bottom: 16px;
  }

  .editorial-admin-panel > header p,
  .editorial-admin-muted {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .editorial-admin-form,
  .editorial-admin-stack,
  .editorial-admin-compact-stack {
    display: grid;
    gap: 14px;
  }

  .editorial-admin-compact-stack {
    gap: 10px;
  }

  .editorial-admin-field,
  .editorial-admin-fieldset {
    display: grid;
    gap: 6px;
  }

  .editorial-admin-field label,
  .editorial-admin-fieldset legend {
    color: #425061;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .editorial-admin-field input,
  .editorial-admin-field textarea,
  .editorial-admin-field select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #c8d2dd;
    border-radius: 6px;
    padding: 11px 12px;
    background: #ffffff;
    color: #10151b;
    font: inherit;
  }

  .editorial-admin-compact-stack .editorial-admin-field input,
  .editorial-admin-compact-stack .editorial-admin-field select {
    padding: 9px 10px;
  }

  .editorial-admin-field textarea {
    min-height: 110px;
    resize: vertical;
  }

  .editorial-admin-preview {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .editorial-admin-preview img {
    display: block;
    width: 100%;
    max-height: 220px;
    object-fit: cover;
  }

  .editorial-admin-fieldset {
    margin: 0;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: transparent;
  }

  .editorial-admin-compact-card {
    gap: 10px;
    padding: 12px;
  }

  .editorial-admin-compact-card legend {
    padding: 0 4px;
  }

  .editorial-admin-compact-card .editorial-admin-preview img {
    max-height: 120px;
  }

  .editorial-admin-upload-inline {
    display: grid;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #dce3eb;
  }

  .editorial-admin-upload-inline .editorial-admin-button {
    padding: 10px 12px;
  }

  .editorial-admin-hidden-form {
    display: none;
  }

  .editorial-admin-highlight-1 {
    background: #f9fafb;
  }

  .editorial-admin-highlight-2 {
    background: #f4f6f8;
  }

  .editorial-admin-highlight-3 {
    background: #eef2f6;
  }

  .editorial-admin-message {
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid #b7e1c0;
    border-radius: 8px;
    background: #effaf1;
    color: #1f6d31;
    font-size: 14px;
    font-weight: 800;
  }

  .editorial-admin-message.warning {
    border-color: #ffd0d0;
    background: #fff3f3;
    color: #9d1c1f;
  }

  #manchete,
  #composicao,
  #destaques,
  #resumo-jornada,
  #bloco-complementar,
  #ultimas-noticias {
    scroll-margin-top: 18px;
  }

  .editorial-complement-mode-section[hidden],
  .editorial-below-mode-section[hidden] {
    display: none;
  }

  @media (max-width: 980px) {
    .home-admin-shell {
      padding: 16px;
    }

    .home-admin-hero,
    .home-admin-grid,
    .home-admin-two-grid,
    .home-admin-compact-grid,
    .home-admin-stack,
    .home-admin-highlights-panel,
    .home-admin-roundup-panel,
    .home-admin-latest-panel,
    .editorial-admin-grid,
    .editorial-admin-composition-grid {
      grid-template-columns: 1fr;
    }

    .home-admin-headline-panel,
    .home-admin-side-panel,
    .home-admin-composition-panel,
    .home-admin-complement-panel,
    .home-admin-wide-panel {
      grid-column: 1;
    }

    .editorial-admin-shell {
      padding: 16px;
    }

    .editorial-admin-hero {
      display: grid;
    }
  }
`;

function oneParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
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

async function readHomeEditorial() {
  const rows = await fetchSupabaseAdminTable<HomeEditorial>(
    "site_editorials?select=id,slug,status,headline_title,headline_subtitle,headline_image_url,headline_title_color,below_headline_mode,below_headline_heading,below_headline_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color&slug=eq.home&limit=1"
  ).catch(() => []);

  if (rows[0]) {
    return rows[0];
  }

  if (!getSupabaseServiceConfig()) {
    return null;
  }

  await writeSupabaseAdmin("site_editorials?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      slug: "home",
      status: "draft",
      below_headline_mode: "highlights",
      complementary_mode: "none"
    })
  });

  return (
    await fetchSupabaseAdminTable<HomeEditorial>(
      "site_editorials?select=id,slug,status,headline_title,headline_subtitle,headline_image_url,headline_title_color,below_headline_mode,below_headline_heading,below_headline_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color&slug=eq.home&limit=1"
    ).catch(() => [])
  )[0] ?? null;
}

async function readHighlights(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeHighlight>(
    `site_editorial_highlights?select=id,site_editorial_id,label,title,subtitle,image_url,link_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=3`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

async function readRoundupItems(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeRoundupItem>(
    `site_editorial_roundup_items?select=id,site_editorial_id,sort_order,label,title,subtitle,image_url,video_url,duration,type,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=10`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

async function readLatestNews(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeLatestNews>(
    `site_editorial_latest_news?select=id,site_editorial_id,time_label,title,link_url,image_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=8`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

async function readFeaturedMatches() {
  return fetchSupabaseAdminTable<HomeFeaturedMatch>(
    "site_featured_matches?select=id,match_id,sort_order&order=sort_order.asc.nullslast,created_at.asc"
  ).catch(() => []);
}

async function readAvailableMatchesByCompetition(): Promise<AdminFeaturedMatchGroup[]> {
  const matches = await fetchSupabaseAdminTable<AdminMatchRow>(
    "matches?select=id,home_team_id,away_team_id,matchday_id,kickoff_at&order=kickoff_at.asc.nullslast&limit=500"
  ).catch(() => []);

  const teamsById = await readRowsById<AdminTeamRow>(
    "teams",
    "id,name,short_name",
    uniqueValues(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))
  );
  const matchdaysById = await readRowsById<AdminMatchdayRow>(
    "matchdays",
    "id,number,season_id",
    uniqueValues(matches.map((match) => match.matchday_id))
  );
  const seasonsById = await readRowsById<AdminSeasonRow>(
    "seasons",
    "id,label,competition_id",
    uniqueValues(Array.from(matchdaysById.values()).map((matchday) => matchday.season_id))
  );
  const competitionsById = await readRowsById<AdminCompetitionRow>(
    "competitions",
    "id,name,slug",
    uniqueValues(Array.from(seasonsById.values()).map((season) => season.competition_id))
  );

  const groupsByCompetition = new Map<string, AdminFeaturedMatchGroup>();
  const teamName = (teamId: string | null, fallback: string) => {
    const team = teamId ? teamsById.get(teamId) : null;
    return team?.name?.trim() || team?.short_name?.trim() || fallback;
  };

  for (const match of matches) {
    const matchday = match.matchday_id ? matchdaysById.get(match.matchday_id) : null;
    const season = matchday?.season_id ? seasonsById.get(matchday.season_id) : null;
    const competition = season?.competition_id ? competitionsById.get(season.competition_id) : null;
    const competitionId = competition?.id ?? "sem-competicao";
    const competitionName = competition?.name?.trim() || "Competicao por definir";
    const group = groupsByCompetition.get(competitionId) ?? {
      competitionId,
      competitionName,
      sortOrder: 999,
      matches: []
    };

    group.matches.push({
      id: match.id,
      homeTeamName: teamName(match.home_team_id, "Equipa da casa"),
      awayTeamName: teamName(match.away_team_id, "Equipa visitante"),
      kickoffAt: match.kickoff_at,
      matchdayNumber: matchday?.number ?? null
    });
    groupsByCompetition.set(competitionId, group);
  }

  return Array.from(groupsByCompetition.values())
    .map((group) => ({
      ...group,
      matches: group.matches.sort((first, second) => {
        const firstMatchday = first.matchdayNumber ?? 999;
        const secondMatchday = second.matchdayNumber ?? 999;
        if (firstMatchday !== secondMatchday) return firstMatchday - secondMatchday;
        return (first.kickoffAt ?? "").localeCompare(second.kickoffAt ?? "");
      })
    }))
    .sort((first, second) => {
      if (first.sortOrder !== second.sortOrder) return first.sortOrder - second.sortOrder;
      return first.competitionName.localeCompare(second.competitionName);
    });
}

function feedbackMessage(created?: string, error?: string) {
  const createdLabels: Record<string, string> = {
    save_home_editorial: "Capa editorial da home guardada.",
    save_home_highlights: "Destaques da home guardados.",
    save_home_roundup_items: "Resumo da home guardado.",
    save_home_latest_news: "Ultimas noticias da home guardadas.",
    save_home_featured_matches: "Jogos da pagina inicial guardados.",
    upload_home_headline_image: "Imagem da manchete carregada.",
    upload_home_highlight_image: "Imagem do destaque carregada."
  };

  if (created) {
    return { type: "success" as const, text: createdLabels[created] ?? "Alteracoes guardadas." };
  }

  if (error) {
    return { type: "warning" as const, text: `Nao foi possivel guardar: ${error}` };
  }

  return null;
}

export default async function HomeEditorialAdminPage({ searchParams }: HomeEditorialPageProps) {
  const query = searchParams ? await searchParams : {};
  const editorial = await readHomeEditorial();
  const highlights = editorial ? await readHighlights(editorial.id) : new Map<number, HomeHighlight>();
  const roundupItems = editorial ? await readRoundupItems(editorial.id) : new Map<number, HomeRoundupItem>();
  const latestNews = editorial ? await readLatestNews(editorial.id) : new Map<number, HomeLatestNews>();
  const [featuredMatches, availableMatchesByCompetition] = await Promise.all([
    readFeaturedMatches(),
    readAvailableMatchesByCompetition()
  ]);
  const selectedFeaturedMatchIds = new Set(featuredMatches.map((match) => match.match_id));
  const message = feedbackMessage(oneParam(query, "created"), oneParam(query, "error"));
  const feedbackScope = oneParam(query, "feedback_scope");
  const renderScopedMessage = (scope: string) =>
    message && feedbackScope === scope ? (
      <div className={`editorial-admin-message ${message.type === "warning" ? "warning" : ""}`}>{message.text}</div>
    ) : null;
  const belowHeadlineMode = editorial?.below_headline_mode === "roundup" ? "roundup" : "highlights";
  const complementaryMode = editorial?.complementary_mode ?? "none";
  const returnTo = "/admin/editorial/home";
  const scopedReturnTo = (scope: string, anchor = scope) => `${returnTo}?feedback_scope=${scope}#${anchor}`;
  const returnToManchete = scopedReturnTo("manchete");
  const returnToBlocoLateral = scopedReturnTo("bloco-lateral");
  const returnToComposicao = scopedReturnTo("composicao");
  const returnToDestaques = scopedReturnTo("destaques");
  const returnToResumo = scopedReturnTo("resumo-jornada");
  const returnToComplementar = scopedReturnTo("bloco-complementar");
  const returnToUltimasNoticias = scopedReturnTo("ultimas-noticias");
  const returnToJogosHome = scopedReturnTo("jogos-home");
  const belowHeadlineHeadingFallback = "Capa Jornada.pt";
  const roundupVideoHeadingFallback = "Capa Jornada.pt - Videos e resumo";
  const highlightsFormId = "home-highlights-form";
  const belowHeadlineSettingsFormId = "home-below-headline-settings-form";

  if (!editorial) {
    return (
      <main className="home-admin-shell">
        <style>{styles}</style>
        <section className="home-admin-hero">
          <div>
            <p>Capa global</p>
            <h1>Home editorial</h1>
            <small>O registo site_editorials.slug = home ainda nao esta disponivel.</small>
          </div>
          <a className="home-admin-button secondary" href="/admin/gestor">Voltar ao gestor</a>
        </section>
      </main>
    );
  }

  const highlightsEditor = (
    <>
      <form className="editorial-admin-hidden-form" action="/api/admin/editorial/home" id={highlightsFormId} method="post">
        <input type="hidden" name="action_type" value="save_home_highlights" />
        <input type="hidden" name="return_to" value={returnToDestaques} />
      </form>
      <div className="editorial-admin-compact-stack">
        {HIGHLIGHT_SORT_ORDERS.map((sortOrder) => {
          const item = highlights.get(sortOrder);
          return (
            <fieldset className={`editorial-admin-fieldset editorial-admin-compact-card editorial-admin-highlight-${sortOrder}`} key={sortOrder}>
              <legend>Destaque {sortOrder}</legend>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-label`}>Etiqueta</label>
                <input form={highlightsFormId} id={`highlight-${sortOrder}-label`} name={`highlight_${sortOrder}_label`} defaultValue={item?.label ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-title`}>Titulo</label>
                <input form={highlightsFormId} id={`highlight-${sortOrder}-title`} name={`highlight_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-subtitle`}>Subtitulo / texto</label>
                <textarea form={highlightsFormId} id={`highlight-${sortOrder}-subtitle`} name={`highlight_${sortOrder}_subtitle`} defaultValue={item?.subtitle ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-image-url`}>Imagem URL</label>
                <input form={highlightsFormId} id={`highlight-${sortOrder}-image-url`} name={`highlight_${sortOrder}_image_url`} defaultValue={item?.image_url ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-link-url`}>Link</label>
                <input form={highlightsFormId} id={`highlight-${sortOrder}-link-url`} name={`highlight_${sortOrder}_link_url`} defaultValue={item?.link_url ?? ""} />
              </div>
              {item?.image_url ? (
                <div className="editorial-admin-preview">
                  <img alt="" src={item.image_url} />
                </div>
              ) : null}
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${sortOrder}-status`}>Estado</label>
                <select form={highlightsFormId} id={`highlight-${sortOrder}-status`} name={`highlight_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <form action="/api/admin/editorial/home/image" className="editorial-admin-upload-inline" encType="multipart/form-data" method="post">
                <input type="hidden" name="return_to" value={returnToDestaques} />
                <input type="hidden" name="target" value="highlight" />
                <input type="hidden" name="sort_order" value={sortOrder} />
                <div className="editorial-admin-field">
                  <label htmlFor={`highlight-${sortOrder}-image-upload`}>Carregar imagem do destaque {sortOrder}</label>
                  <input accept="image/jpeg,image/png,image/webp" id={`highlight-${sortOrder}-image-upload`} name="image" type="file" />
                </div>
                <button className="editorial-admin-button secondary" type="submit">Carregar imagem</button>
              </form>
            </fieldset>
          );
        })}
        <button className="editorial-admin-button" form={highlightsFormId} type="submit">Guardar destaques</button>
      </div>
    </>
  );

  const roundupEditor = (
    <form className="editorial-admin-form" action="/api/admin/editorial/home" method="post">
      <input type="hidden" name="action_type" value="save_home_roundup_items" />
      <input type="hidden" name="return_to" value={returnToResumo} />
      {ROUNDUP_SORT_ORDERS.map((sortOrder) => {
        const item = roundupItems.get(sortOrder);
        return (
          <fieldset className={`editorial-admin-fieldset editorial-admin-highlight-${sortOrder}`} key={sortOrder}>
            <legend>Item {sortOrder}</legend>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-sort-order`}>Ordem</label>
              <input id={`roundup-${sortOrder}-sort-order`} readOnly value={sortOrder} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-label`}>Etiqueta</label>
              <input id={`roundup-${sortOrder}-label`} name={`roundup_${sortOrder}_label`} defaultValue={item?.label ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-title`}>Titulo</label>
              <input id={`roundup-${sortOrder}-title`} name={`roundup_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-subtitle`}>Subtitulo</label>
              <input id={`roundup-${sortOrder}-subtitle`} name={`roundup_${sortOrder}_subtitle`} defaultValue={item?.subtitle ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-video-url`}>Video URL</label>
              <input id={`roundup-${sortOrder}-video-url`} name={`roundup_${sortOrder}_video_url`} defaultValue={item?.video_url ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-duration`}>Duracao</label>
              <input id={`roundup-${sortOrder}-duration`} name={`roundup_${sortOrder}_duration`} defaultValue={item?.duration ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-type`}>Tipo</label>
              <select id={`roundup-${sortOrder}-type`} name={`roundup_${sortOrder}_type`} defaultValue={item?.type ?? "resumo"}>
                <option value="video">Video</option>
                <option value="golos">Golos</option>
                <option value="resumo">Resumo</option>
                <option value="noticia">Noticia</option>
              </select>
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${sortOrder}-status`}>Estado</label>
              <select id={`roundup-${sortOrder}-status`} name={`roundup_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </fieldset>
        );
      })}
      <button className="editorial-admin-button" type="submit">Guardar Resumo da Jornada</button>
    </form>
  );

  const latestNewsEditor = (
    <form className="editorial-admin-form" action="/api/admin/editorial/home" method="post">
      <input type="hidden" name="action_type" value="save_home_latest_news" />
      <input type="hidden" name="return_to" value={returnToUltimasNoticias} />
      <div className="editorial-admin-compact-stack">
        {LATEST_NEWS_SORT_ORDERS.map((sortOrder) => {
          const item = latestNews.get(sortOrder);
          return (
            <fieldset className="editorial-admin-fieldset editorial-admin-compact-card" key={sortOrder}>
              <legend>Noticia {sortOrder}</legend>
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-sort-order`}>Ordem</label>
                <input id={`latest-${sortOrder}-sort-order`} readOnly value={sortOrder} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-time-label`}>Hora / etiqueta</label>
                <input id={`latest-${sortOrder}-time-label`} name={`latest_${sortOrder}_time_label`} defaultValue={item?.time_label ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-title`}>Titulo</label>
                <input id={`latest-${sortOrder}-title`} name={`latest_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-link-url`}>Link</label>
                <input id={`latest-${sortOrder}-link-url`} name={`latest_${sortOrder}_link_url`} defaultValue={item?.link_url ?? ""} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-image-url`}>Imagem URL opcional</label>
                <input id={`latest-${sortOrder}-image-url`} name={`latest_${sortOrder}_image_url`} defaultValue={item?.image_url ?? ""} />
              </div>
              {item?.image_url ? (
                <div className="editorial-admin-preview">
                  <img alt="" src={item.image_url} />
                </div>
              ) : null}
              <div className="editorial-admin-field">
                <label htmlFor={`latest-${sortOrder}-status`}>Estado</label>
                <select id={`latest-${sortOrder}-status`} name={`latest_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
            </fieldset>
          );
        })}
      </div>
      <button className="editorial-admin-button" type="submit">Guardar ultimas noticias</button>
    </form>
  );

  return (
    <main className="editorial-admin-shell">
      <style>{styles}</style>
      <section className="editorial-admin-hero">
        <div>
          <p>Capa global do Jornada.pt</p>
          <h1>Home editorial</h1>
          <small>Edita site_editorials.slug = home, sem liga, epoca ou jornada associada.</small>
        </div>
        <div className="editorial-admin-hero-actions">
          <a className="editorial-admin-button secondary" href="/admin/gestor">Voltar ao gestor</a>
          <a className="editorial-admin-button secondary" href="/">Ver site</a>
        </div>
      </section>

      {message && !feedbackScope ? <div className={`editorial-admin-message ${message.type === "warning" ? "warning" : ""}`}>{message.text}</div> : null}

      <section className="editorial-admin-panel editorial-admin-composition" id="jogos-home">
        <header>
          <h2>Jogos na pagina inicial</h2>
          <p>Seleciona os jogos existentes que aparecem na barra da home. A selecao guarda apenas o match_id.</p>
        </header>
        {renderScopedMessage("jogos-home")}
        <form className="editorial-admin-form" action="/api/admin/editorial/home" method="post">
          <input type="hidden" name="action_type" value="save_home_featured_matches" />
          <input type="hidden" name="return_to" value={returnToJogosHome} />
          {availableMatchesByCompetition.length > 0 ? (
            <div className="home-featured-matches-list">
              {availableMatchesByCompetition.map((group) => (
                <section className="home-featured-matches-group" key={group.competitionId}>
                  <h3>{group.competitionName}</h3>
                  {group.matches.map((match) => (
                    <label className="home-featured-match-row" key={match.id}>
                      <input
                        defaultChecked={selectedFeaturedMatchIds.has(match.id)}
                        name="featured_match_id"
                        type="checkbox"
                        value={match.id}
                      />
                      <span>{match.homeTeamName} vs {match.awayTeamName}</span>
                    </label>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <p className="editorial-admin-muted">Nao foram encontrados jogos para selecionar.</p>
          )}
          <button className="editorial-admin-button" type="submit">Guardar selecao de jogos</button>
        </form>
      </section>

      <div className="editorial-admin-grid">
        <section className="editorial-admin-panel" id="manchete">
          <header>
            <h2>Manchete principal</h2>
            <p>Campos de site_editorials ligados a slug home.</p>
          </header>
          {renderScopedMessage("manchete")}
          <form className="editorial-admin-form" action="/api/admin/editorial/home" method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value={returnToManchete} />
            <div className="editorial-admin-field">
              <label htmlFor="headline-title">Titulo</label>
              <input id="headline-title" name="headline_title" defaultValue={editorial.headline_title ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="headline-subtitle">Subtitulo</label>
              <textarea id="headline-subtitle" name="headline_subtitle" defaultValue={editorial.headline_subtitle ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="headline-title-color">Cor do titulo</label>
              <input id="headline-title-color" name="headline_title_color" defaultValue={editorial.headline_title_color ?? ""} placeholder="#10151b" />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="headline-image-url">Imagem da manchete URL</label>
              <input id="headline-image-url" name="headline_image_url" defaultValue={editorial.headline_image_url ?? ""} />
            </div>
            {editorial.headline_image_url ? (
              <div className="editorial-admin-preview">
                <img alt="" src={editorial.headline_image_url} />
              </div>
            ) : null}
            <div className="editorial-admin-field">
              <label htmlFor="home-status">Estado</label>
              <select id="home-status" name="status" defaultValue={editorial.status}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <button className="editorial-admin-button" type="submit">Guardar manchete</button>
          </form>
          <form className="editorial-admin-form" action="/api/admin/editorial/home/image" encType="multipart/form-data" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="return_to" value={returnToManchete} />
            <input type="hidden" name="target" value="headline" />
            <div className="editorial-admin-field">
              <label htmlFor="headline-image-upload">Carregar imagem da manchete</label>
              <input accept="image/jpeg,image/png,image/webp" id="headline-image-upload" name="image" type="file" />
            </div>
            <button className="editorial-admin-button secondary" type="submit">Carregar imagem da manchete</button>
          </form>
        </section>

        <aside className="editorial-admin-panel" id="bloco-lateral">
          <header>
            <h2>Bloco lateral</h2>
            <p>Controla a chamada editorial curta da coluna lateral da capa.</p>
          </header>
          {renderScopedMessage("bloco-lateral")}
          <form className="editorial-admin-form" action="/api/admin/editorial/home" method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value={returnToBlocoLateral} />
            <div className="editorial-admin-field">
              <label htmlFor="side-block-status">Estado</label>
              <select id="side-block-status" name="side_block_status" defaultValue={editorial.side_block_status}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-type">Tipo</label>
              <select id="side-block-type" name="side_block_type" defaultValue={editorial.side_block_type ?? "opiniao"}>
                <option value="opiniao">Opiniao</option>
                <option value="arbitragem">Arbitragem</option>
                <option value="balanco">Balanco</option>
                <option value="analise">Analise</option>
                <option value="cronica">Cronica</option>
                <option value="figura-da-jornada">Figura da jornada</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-label">Etiqueta</label>
              <input id="side-block-label" name="side_block_label" defaultValue={editorial.side_block_label ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-title">Titulo</label>
              <input id="side-block-title" name="side_block_title" defaultValue={editorial.side_block_title ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-title-color">Cor do titulo</label>
              <input id="side-block-title-color" name="side_block_title_color" defaultValue={editorial.side_block_title_color ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-author">Autor, opcional</label>
              <input id="side-block-author" name="side_block_author" defaultValue={editorial.side_block_author ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-text">Texto / excerto</label>
              <textarea id="side-block-text" name="side_block_text" defaultValue={editorial.side_block_text ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-image-url">Imagem opcional</label>
              <input id="side-block-image-url" name="side_block_image_url" defaultValue={editorial.side_block_image_url ?? ""} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="side-block-link-url">Link opcional</label>
              <input id="side-block-link-url" name="side_block_link_url" defaultValue={editorial.side_block_link_url ?? ""} />
            </div>
            <button className="editorial-admin-button" type="submit">Guardar bloco lateral</button>
          </form>
        </aside>
      </div>

      <section className="editorial-admin-panel editorial-admin-composition" id="composicao">
        <header>
          <h2>Composicao abaixo da manchete</h2>
          <p>Controla os dois espacos editoriais que aparecem por baixo da manchete na primeira pagina.</p>
        </header>
        {renderScopedMessage("composicao")}
        <div data-composition-form>
          <div className="editorial-admin-composition-grid">
            <div className="editorial-admin-composition-card">
              <h3>Zona abaixo da manchete</h3>
              <p>Escolhe que conjunto ocupa a area inferior esquerda da composicao.</p>
              <form className="editorial-admin-form" action="/api/admin/editorial/home" data-below-mode-form id={belowHeadlineSettingsFormId} method="post">
                <input type="hidden" name="action_type" value="save_home_editorial" />
                <input type="hidden" name="return_to" value={returnToComposicao} />
                <input type="hidden" name="complementary_mode" value={complementaryMode} data-suggested-complement />
                <div className="editorial-admin-field">
                  <label htmlFor="composition-below-headline-mode">Tipo de conteudo abaixo da manchete</label>
                  <select id="composition-below-headline-mode" name="below_headline_mode" defaultValue={belowHeadlineMode}>
                    <option value="highlights">Destaques abaixo da manchete</option>
                    <option value="roundup">Resumo da Jornada</option>
                  </select>
                </div>
                <button className="editorial-admin-button secondary" type="submit">Guardar escolha</button>
              </form>
              <div className="editorial-below-mode-section" data-below-section="highlights" hidden={belowHeadlineMode !== "highlights"} id="destaques">
                <h4>Destaques abaixo da manchete</h4>
                <p className="editorial-admin-muted">Edita os destaques editoriais desta zona e o texto superior que aparece no publico.</p>
                {renderScopedMessage("destaques")}
                <div className="editorial-admin-compact-stack">
                  <div className="editorial-admin-field">
                    <label htmlFor="below-headline-heading">Texto do topo</label>
                    <input form={belowHeadlineSettingsFormId} id="below-headline-heading" name="below_headline_heading" defaultValue={editorial.below_headline_heading ?? ""} placeholder={belowHeadlineHeadingFallback} />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="below-headline-heading-color">Cor do texto do topo</label>
                    <input form={belowHeadlineSettingsFormId} id="below-headline-heading-color" name="below_headline_heading_color" defaultValue={editorial.below_headline_heading_color ?? ""} placeholder="#0b1f3a" />
                  </div>
                  <button className="editorial-admin-button secondary" form={belowHeadlineSettingsFormId} type="submit">Guardar texto do topo</button>
                  <p className="editorial-admin-muted">Se ficarem vazios, a pagina publica pode usar {belowHeadlineHeadingFallback} e a cor atual.</p>
                </div>
                {highlightsEditor}
              </div>
              <div className="editorial-below-mode-section" data-below-section="roundup" hidden={belowHeadlineMode !== "roundup"} id="resumo-jornada">
                <h4>Resumo da Jornada</h4>
                <p className="editorial-admin-muted">Edita entradas para videos, golos, resumos ou noticias da capa global.</p>
                {renderScopedMessage("resumo-jornada")}
                {roundupEditor}
              </div>
            </div>

            <div className="editorial-admin-composition-side-stack">
              <div className="editorial-admin-composition-card" id="bloco-complementar">
                <h3>Bloco complementar</h3>
                <p>Escolhe o conteudo do espaco editorial da direita.</p>
                {renderScopedMessage("bloco-complementar")}
                <form className="editorial-admin-form" action="/api/admin/editorial/home" data-complementary-form method="post">
                  <input type="hidden" name="action_type" value="save_home_editorial" />
                  <input type="hidden" name="return_to" value={returnToComplementar} />
                  <input type="hidden" name="allow_manual_complementary_mode" value="1" />
                  <input type="hidden" name="below_headline_mode" value={belowHeadlineMode} />
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-mode">Tipo de bloco complementar</label>
                    <select id="complementary-mode" name="complementary_mode" defaultValue={complementaryMode}>
                      <option value="none">Nenhum</option>
                      <option value="complementary_story">Complemento da manchete</option>
                      <option value="roundup_video">Video do Resumo da Jornada</option>
                    </select>
                  </div>
                  <div className="editorial-complement-mode-section" data-complementary-section="none" hidden={complementaryMode !== "none"}>
                    <p className="editorial-admin-muted">O Bloco complementar fica desativado na pagina publica.</p>
                  </div>
                  <div className="editorial-complement-mode-section" data-complementary-section="roundup_video" hidden={complementaryMode !== "roundup_video"}>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-roundup-item">Video inicial opcional</label>
                      <select id="complementary-roundup-item" name="complementary_roundup_item_id" defaultValue={editorial.complementary_roundup_item_id ?? ""}>
                        <option value="">Usar primeiro item publicado</option>
                        {Array.from(roundupItems.values())
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.sort_order}. {item.title || item.label || "Item sem titulo"}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="roundup-video-heading">Titulo da lista / Cabecalho do resumo</label>
                      <input id="roundup-video-heading" name="roundup_video_heading" defaultValue={editorial.roundup_video_heading ?? ""} placeholder={roundupVideoHeadingFallback} />
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="roundup-video-heading-color">Cor do cabecalho</label>
                      <input id="roundup-video-heading-color" name="roundup_video_heading_color" defaultValue={editorial.roundup_video_heading_color ?? ""} placeholder="#003f8f" />
                    </div>
                  </div>
                  <div className="editorial-complement-mode-section" data-complementary-section="complementary_story" hidden={complementaryMode !== "complementary_story"}>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-status">Estado</label>
                      <select id="complementary-status" name="complementary_status" defaultValue={editorial.complementary_status}>
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicado</option>
                      </select>
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-label">Antetitulo / etiqueta</label>
                      <input id="complementary-label" name="complementary_label" defaultValue={editorial.complementary_label ?? ""} />
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-title">Titulo</label>
                      <input id="complementary-title" name="complementary_title" defaultValue={editorial.complementary_title ?? ""} />
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-text">Texto curto / conteudo breve</label>
                      <textarea id="complementary-text" name="complementary_text" defaultValue={editorial.complementary_text ?? ""} />
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-image-url">Imagem URL</label>
                      <input id="complementary-image-url" name="complementary_image_url" defaultValue={editorial.complementary_image_url ?? ""} />
                    </div>
                    <div className="editorial-admin-field">
                      <label htmlFor="complementary-link-url">Link da noticia completa</label>
                      <input id="complementary-link-url" name="complementary_link_url" defaultValue={editorial.complementary_link_url ?? ""} />
                    </div>
                  </div>
                  <button className="editorial-admin-button" type="submit">Guardar bloco complementar</button>
                </form>
              </div>

              <section className="editorial-admin-composition-card" id="ultimas-noticias">
                <h3>Ultimas noticias</h3>
                <p>Edita a coluna direita da primeira pagina. A imagem e opcional: se ficar vazia, a noticia aparece apenas com hora e titulo.</p>
                {renderScopedMessage("ultimas-noticias")}
                {latestNewsEditor}
              </section>
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var form = document.querySelector('[data-composition-form]');
                if (!form) return;
                var belowSelect = form.querySelector('[name="below_headline_mode"]');
                var complementSelect = form.querySelector('[data-complementary-form] [name="complementary_mode"]');
                var suggestedComplement = form.querySelector('[data-suggested-complement]');
                var belowSections = Array.prototype.slice.call(form.querySelectorAll('[data-below-section]'));
                var sections = Array.prototype.slice.call(form.querySelectorAll('[data-complementary-section]'));
                function syncBelowSections() {
                  var mode = belowSelect ? belowSelect.value : 'highlights';
                  belowSections.forEach(function (section) {
                    section.hidden = section.getAttribute('data-below-section') !== mode;
                  });
                }
                function syncComplementSections() {
                  var mode = complementSelect ? complementSelect.value : 'none';
                  if (suggestedComplement) suggestedComplement.value = mode;
                  sections.forEach(function (section) {
                    section.hidden = section.getAttribute('data-complementary-section') !== mode;
                  });
                }
                function suggestComplement() {
                  if (!belowSelect || !complementSelect) return;
                  complementSelect.value = belowSelect.value === 'roundup' ? 'roundup_video' : 'complementary_story';
                  if (suggestedComplement) suggestedComplement.value = complementSelect.value;
                  syncBelowSections();
                  syncComplementSections();
                }
                if (belowSelect) belowSelect.addEventListener('change', suggestComplement);
                if (complementSelect) complementSelect.addEventListener('change', syncComplementSections);
                syncBelowSections();
                syncComplementSections();
              })();
            `
          }}
        />
      </section>
    </main>
  );
}
