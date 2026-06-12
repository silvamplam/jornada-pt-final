import type { ReactNode } from "react";
import {
  fetchSupabaseAdminTable,
  type SupabaseCompetition,
  type SupabaseCountry,
  type SupabaseMatchday,
  type SupabaseMatchdayEditorial,
  type SupabaseMatchdayHighlight,
  type SupabaseMatchdayLatestNews,
  type SupabaseMatchdayRoundupItem,
  type SupabaseSeason
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CompositionPageProps = {
  params: Promise<{
    matchdayId: string;
  }>;
};

type MatchdayContext = {
  matchday: SupabaseMatchday;
  season: SupabaseSeason;
  competition: SupabaseCompetition;
  country: SupabaseCountry | null;
};

type SupabaseArticle = {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_url: string | null;
  status: string;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
  match_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReferenceComposition = {
  id: string;
  matchday_id: string;
  status: string;
  is_current: boolean;
  internal_name: string | null;
  use_roundup_items: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type ReferenceCompositionItem = {
  id: string;
  composition_id: string;
  slot_type: string;
  source_type: string;
  source_id: string | null;
  article_id: string | null;
  sort_order: number;
  title_snapshot: string | null;
  subtitle_snapshot: string | null;
  image_url_snapshot: string | null;
  link_url_snapshot: string | null;
  label_snapshot: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type MatchdayEditorialWithHeadlineLink = SupabaseMatchdayEditorial & {
  headline_link_url?: string | null;
};

type MatchdayHighlightWithLink = SupabaseMatchdayHighlight & {
  link_url?: string | null;
};

const referenceCompositionSections = [
  { slotType: "headline", title: "Manchete" },
  { slotType: "complement", title: "Complemento da manchete" },
  { slotType: "side_block", title: "Bloco lateral" },
  { slotType: "highlight", title: "Destaques abaixo da manchete" },
  { slotType: "important_item", title: "Mais notícias da jornada" },
  { slotType: "editorial_line_item", title: "Zona editorial final" },
  { slotType: "related_article", title: "Artigos relacionados" },
  { slotType: "roundup", title: "Resumo / Vídeos" },
  { slotType: "custom_card", title: "Cartão personalizado" }
];

function groupCompositionItemsBySection(items: ReferenceCompositionItem[]) {
  const orderedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const knownSlotTypes = new Set(referenceCompositionSections.map((section) => section.slotType));
  const sections = referenceCompositionSections
    .map((section) => ({
      ...section,
      items: orderedItems.filter((item) => item.slot_type === section.slotType)
    }))
    .filter((section) => section.items.length > 0 || section.slotType === "important_item");
  const otherItems = orderedItems.filter((item) => !knownSlotTypes.has(item.slot_type));

  if (otherItems.length > 0) {
    sections.push({
      slotType: "other",
      title: "Outros itens",
      items: otherItems
    });
  }

  return sections;
}

function compositionSectionTitle(slotType?: string | null) {
  return referenceCompositionSections.find((section) => section.slotType === slotType)?.title ?? "Outros itens";
}

function normalizeCandidateLink(value?: string | null) {
  return textOrEmpty(value).toLowerCase();
}

function normalizeCandidateValue(value?: string | null) {
  return textOrEmpty(value).toLowerCase();
}

function normalizeSourceType(sourceType?: string | null) {
  const normalized = normalizeCandidateValue(sourceType);

  if (normalized === "matchday_editorials") return "matchday_editorial";
  if (normalized === "matchday_highlights") return "matchday_highlight";
  if (normalized === "matchday_roundup_items") return "matchday_roundup_item";
  if (normalized === "articles") return "article";

  return normalized;
}

function isMatchdayEditorialSource(sourceType?: string | null) {
  return normalizeSourceType(sourceType) === "matchday_editorial";
}

function isFreeNewsSlot(slotType?: string | null) {
  return slotType === "important_item" || slotType === "editorial_line_item";
}

function canMoveToFreeNewsSlot(item: ReferenceCompositionItem) {
  return item.slot_type !== "roundup" && normalizeSourceType(item.source_type) !== "matchday_roundup_item";
}

function compositionItemDisplayLabel(item: ReferenceCompositionItem) {
  return isFreeNewsSlot(item.slot_type) ? null : item.label_snapshot || item.slot_type;
}

function matchdayEditorialOriginSlot(item: ReferenceCompositionItem) {
  if (!isMatchdayEditorialSource(item.source_type)) {
    return null;
  }

  if (item.slot_type === "headline" || item.slot_type === "complement" || item.slot_type === "side_block") {
    return item.slot_type;
  }

  const label = normalizeCandidateValue(item.label_snapshot);

  if (label === "manchete") {
    return "headline";
  }

  if (label === "complemento da manchete" || label === "complemento") {
    return "complement";
  }

  if (label === "bloco lateral") {
    return "side_block";
  }

  return null;
}

function concreteContentMatches(
  item: ReferenceCompositionItem,
  {
    articleId,
    linkUrl,
    title,
    subtitle,
    imageUrl
  }: {
    articleId?: string | null;
    linkUrl?: string | null;
    title?: string | null;
    subtitle?: string | null;
    imageUrl?: string | null;
  }
) {
  const itemTitle = normalizeCandidateValue(item.title_snapshot);
  const candidateTitle = normalizeCandidateValue(title);

  if (!itemTitle || !candidateTitle || itemTitle !== candidateTitle) {
    return false;
  }

  if (articleId && item.article_id && item.article_id === articleId) {
    return true;
  }

  const itemLinkUrl = normalizeCandidateLink(item.link_url_snapshot);
  const candidateLinkUrl = normalizeCandidateLink(linkUrl);

  if (itemLinkUrl && candidateLinkUrl && itemLinkUrl === candidateLinkUrl) {
    return true;
  }

  const itemImageUrl = normalizeCandidateLink(item.image_url_snapshot);
  const candidateImageUrl = normalizeCandidateLink(imageUrl);
  const itemSubtitle = normalizeCandidateValue(item.subtitle_snapshot);
  const candidateSubtitle = normalizeCandidateValue(subtitle);
  const canCompareImage = Boolean(itemImageUrl && candidateImageUrl);
  const canCompareSubtitle = Boolean(itemSubtitle && candidateSubtitle);

  return (canCompareImage && itemImageUrl === candidateImageUrl) || (canCompareSubtitle && itemSubtitle === candidateSubtitle);
}

function compositionItemMatchesCandidate(
  item: ReferenceCompositionItem,
  {
    sourceType,
    sourceId,
    articleId,
    linkUrl,
    originSlotType,
    title,
    subtitle,
    imageUrl
  }: {
    sourceType: string;
    sourceId?: string | null;
    articleId?: string | null;
    linkUrl?: string | null;
    originSlotType?: string | null;
    title?: string | null;
    subtitle?: string | null;
    imageUrl?: string | null;
  }
) {
  if (isMatchdayEditorialSource(sourceType)) {
    if (!sourceId || !isMatchdayEditorialSource(item.source_type) || !item.source_id || item.source_id !== sourceId) {
      return false;
    }

    const originMatches = Boolean(originSlotType && matchdayEditorialOriginSlot(item) === originSlotType);

    if (!originMatches && isFreeNewsSlot(item.slot_type)) {
      return concreteContentMatches(item, { articleId, linkUrl, title, subtitle, imageUrl });
    }

    if (!originMatches) {
      return false;
    }

    const itemTitle = normalizeCandidateValue(item.title_snapshot);
    const candidateTitle = normalizeCandidateValue(title);

    if (itemTitle && candidateTitle && itemTitle !== candidateTitle) {
      return false;
    }

    if (articleId && item.article_id && item.article_id === articleId) {
      return true;
    }

    const itemLinkUrl = normalizeCandidateLink(item.link_url_snapshot);
    const candidateLinkUrl = normalizeCandidateLink(linkUrl);

    if (itemLinkUrl && candidateLinkUrl && itemLinkUrl === candidateLinkUrl) {
      return true;
    }

    if (!itemTitle || !candidateTitle || itemTitle !== candidateTitle) {
      return false;
    }

    const itemImageUrl = normalizeCandidateLink(item.image_url_snapshot);
    const candidateImageUrl = normalizeCandidateLink(imageUrl);
    const itemSubtitle = normalizeCandidateValue(item.subtitle_snapshot);
    const candidateSubtitle = normalizeCandidateValue(subtitle);
    const canCompareImage = Boolean(itemImageUrl && candidateImageUrl);
    const canCompareSubtitle = Boolean(itemSubtitle && candidateSubtitle);

    if (canCompareImage || canCompareSubtitle) {
      return (canCompareImage && itemImageUrl === candidateImageUrl) || (canCompareSubtitle && itemSubtitle === candidateSubtitle);
    }

    return true;
  }

  const itemTitle = normalizeCandidateValue(item.title_snapshot);
  const candidateTitle = normalizeCandidateValue(title);

  if (itemTitle && candidateTitle && itemTitle !== candidateTitle) {
    return false;
  }

  if (articleId && item.article_id && item.article_id === articleId) {
    return true;
  }

  const itemLinkUrl = normalizeCandidateLink(item.link_url_snapshot);
  const candidateLinkUrl = normalizeCandidateLink(linkUrl);

  if (itemLinkUrl && candidateLinkUrl && itemLinkUrl === candidateLinkUrl) {
    return true;
  }

  if (sourceType && sourceId && item.source_type && item.source_id) {
    if (isMatchdayEditorialSource(item.source_type)) {
      return false;
    }

    if (normalizeSourceType(item.source_type) === normalizeSourceType(sourceType) && item.source_id === sourceId) {
      return true;
    }
  }

  if (itemTitle && candidateTitle && itemTitle === candidateTitle) {
    const itemImageUrl = normalizeCandidateLink(item.image_url_snapshot);
    const candidateImageUrl = normalizeCandidateLink(imageUrl);
    const itemSubtitle = normalizeCandidateValue(item.subtitle_snapshot);
    const candidateSubtitle = normalizeCandidateValue(subtitle);
    const canCompareImage = Boolean(itemImageUrl && candidateImageUrl);
    const canCompareSubtitle = Boolean(itemSubtitle && candidateSubtitle);

    return (canCompareImage && itemImageUrl === candidateImageUrl) || (canCompareSubtitle && itemSubtitle === candidateSubtitle);
  }

  return false;
}

function candidatePlacementLabel(
  items: ReferenceCompositionItem[],
  candidate: {
    sourceType: string;
    sourceId?: string | null;
    articleId?: string | null;
    linkUrl?: string | null;
    originSlotType?: string | null;
    title?: string | null;
    subtitle?: string | null;
    imageUrl?: string | null;
  }
) {
  const slotTitles = items
    .filter((item) => compositionItemMatchesCandidate(item, candidate))
    .map((item) => compositionSectionTitle(item.slot_type));
  const uniqueSlotTitles = Array.from(new Set(slotTitles));

  return uniqueSlotTitles.length > 0 ? uniqueSlotTitles.join(", ") : null;
}

function countCompositionSlots(items: ReferenceCompositionItem[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const slotType = item.slot_type ?? "";
    counts[slotType] = (counts[slotType] ?? 0) + 1;
    return counts;
  }, {});
}

function getCompositionPublicationValidation(items: ReferenceCompositionItem[]) {
  const counts = countCompositionSlots(items);
  const headlineCount = counts.headline ?? 0;
  const complementCount = counts.complement ?? 0;
  const sideBlockCount = counts.side_block ?? 0;
  const warnings: string[] = [];

  if (headlineCount === 0) {
    warnings.push("A composição ainda não tem manchete.");
  } else if (headlineCount > 1) {
    warnings.push(`A composição tem ${headlineCount} manchetes. Remove ${headlineCount === 2 ? "uma" : "as manchetes extra"} antes de publicar.`);
  }

  if (complementCount > 1) {
    warnings.push("A composição só pode ter um complemento da manchete.");
  }

  if (sideBlockCount > 1) {
    warnings.push("A composição só pode ter um bloco lateral.");
  }

  return {
    canPublish: items.length > 0 && warnings.length === 0,
    warnings,
  };
}

function getPublishedCompositionProblemMessage(items: ReferenceCompositionItem[]) {
  const counts = countCompositionSlots(items);
  const headlineCount = counts.headline ?? 0;
  const complementCount = counts.complement ?? 0;
  const sideBlockCount = counts.side_block ?? 0;

  if (headlineCount === 0) {
    return "Esta composição publicada tem um problema estrutural: a zona Manchete não tem itens. Reabre como rascunho, adiciona uma manchete e publica novamente.";
  }

  if (headlineCount > 1) {
    return `Esta composição publicada tem um problema estrutural: a zona Manchete tem ${headlineCount} itens. Reabre como rascunho, remove uma manchete e publica novamente.`;
  }

  if (complementCount > 1) {
    return "Esta composição publicada tem um problema estrutural: a zona Complemento da manchete tem mais de um item. Reabre como rascunho, remove o complemento extra e publica novamente.";
  }

  if (sideBlockCount > 1) {
    return "Esta composição publicada tem um problema estrutural: a zona Bloco lateral tem mais de um item. Reabre como rascunho, remove o bloco lateral extra e publica novamente.";
  }

  return null;
}

const compositionPageStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .composition-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .composition-admin-hero,
  .composition-admin-panel,
  .composition-admin-card {
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .composition-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-end;
    padding: 24px;
    background: #10151b;
    color: #ffffff;
  }

  .composition-admin-hero p,
  .composition-admin-hero h1,
  .composition-admin-hero span {
    margin: 0;
  }

  .composition-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-hero h1 {
    margin-top: 8px;
    font-size: 38px;
    line-height: 1;
  }

  .composition-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .composition-admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .composition-admin-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.26);
    border-radius: 6px;
    color: inherit;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .composition-admin-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
    align-items: start;
  }

  .composition-admin-panel {
    overflow: hidden;
  }

  .composition-admin-panel > header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .composition-admin-panel h2,
  .composition-admin-panel h3,
  .composition-admin-panel p,
  .composition-admin-card p {
    margin: 0;
  }

  .composition-admin-panel h2 {
    font-size: 22px;
    text-transform: uppercase;
  }

  .composition-admin-panel header p {
    margin-top: 6px;
    color: #607086;
    font-size: 13px;
    line-height: 1.45;
  }

  .composition-admin-stack {
    display: grid;
    gap: 14px;
    padding: 16px;
  }

  .composition-admin-card {
    overflow: hidden;
    box-shadow: none;
  }

  .composition-admin-card header {
    padding: 12px 14px;
    border-bottom: 1px solid #edf1f5;
    background: #ffffff;
  }

  .composition-admin-card h3 {
    font-size: 15px;
    text-transform: uppercase;
  }

  .composition-admin-card-body {
    display: grid;
    gap: 10px;
    padding: 14px;
  }

  .composition-admin-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .composition-admin-section-list {
    display: grid;
    gap: 14px;
  }

  .composition-admin-section {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid #e3e9f0;
    border-radius: 6px;
    background: #f8fafc;
  }

  .composition-admin-section-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .composition-admin-section-heading h4 {
    margin: 0;
    color: #10151b;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-section-heading span {
    color: #607086;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-candidates {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
  }

  .composition-admin-candidates summary {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #edf1f5;
    cursor: pointer;
    color: #10151b;
    font-size: 15px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-candidates summary::-webkit-details-marker {
    display: none;
  }

  .composition-admin-candidates summary::after {
    content: "Abrir";
    color: #607086;
    font-size: 11px;
    font-weight: 900;
  }

  .composition-admin-candidates[open] summary::after {
    content: "Fechar";
  }

  .composition-admin-candidates-body {
    display: grid;
    gap: 14px;
    padding: 14px;
  }

  .composition-admin-item {
    display: grid;
    gap: 8px;
    min-width: 0;
    padding: 12px;
    border: 1px solid #e3e9f0;
    border-radius: 6px;
    background: #ffffff;
  }

  .composition-admin-video-item {
    display: grid;
    gap: 8px;
    min-width: 0;
    padding: 12px;
    border: 1px solid #d9e1ea;
    border-radius: 6px;
    background: #fbfcfe;
  }

  .composition-admin-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
    background: #eef2f6;
  }

  .composition-admin-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .composition-admin-label {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-added-badge {
    width: fit-content;
    border-radius: 999px;
    background: #e8f1ec;
    color: #1f6d43;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-title {
    color: #10151b;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.2;
  }

  .composition-admin-copy {
    color: #526174;
    font-size: 13px;
    line-height: 1.45;
  }

  .composition-admin-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    color: #607086;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-link {
    color: #10151b;
    font-size: 12px;
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .composition-admin-form {
    display: grid;
    gap: 10px;
  }

  .composition-admin-form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .composition-admin-field {
    display: grid;
    gap: 6px;
  }

  .composition-admin-field label,
  .composition-admin-check {
    color: #526174;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-input {
    width: 100%;
    min-height: 38px;
    box-sizing: border-box;
    border: 1px solid #cdd6e0;
    border-radius: 6px;
    padding: 8px 10px;
    color: #10151b;
    font: inherit;
  }

  .composition-admin-small-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    width: fit-content;
    border: 0;
    border-radius: 6px;
    padding: 0 12px;
    background: #10151b;
    color: #ffffff;
    cursor: pointer;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-small-button.secondary {
    background: #e6ebf1;
    color: #10151b;
  }

  .composition-admin-note {
    color: #6d7b8c;
    font-size: 12px;
    line-height: 1.45;
  }

  .composition-admin-empty {
    padding: 12px;
    border: 1px dashed #cdd6e0;
    border-radius: 6px;
    color: #6d7b8c;
    font-size: 13px;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .composition-admin-layout,
    .composition-admin-grid {
      grid-template-columns: 1fr;
    }

    .composition-admin-hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .composition-admin-actions {
      justify-content: flex-start;
    }
  }
`;

async function readFirst<T>(path: string): Promise<T | null> {
  const rows = await fetchSupabaseAdminTable<T>(`${path}&limit=1`);
  return rows[0] ?? null;
}

async function readMatchdayContext(matchdayId: string): Promise<MatchdayContext | null> {
  const matchday = await readFirst<SupabaseMatchday>(
    `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&id=eq.${encodeURIComponent(matchdayId)}`
  ).catch(() => null);

  if (!matchday) {
    return null;
  }

  const season = await readFirst<SupabaseSeason>(
    `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&id=eq.${encodeURIComponent(matchday.season_id)}`
  ).catch(() => null);

  if (!season) {
    return null;
  }

  const competition = await readFirst<SupabaseCompetition>(
    `competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&id=eq.${encodeURIComponent(
      season.competition_id
    )}`
  ).catch(() => null);

  if (!competition) {
    return null;
  }

  const country = competition.country_id
    ? await readFirst<SupabaseCountry>(
        `countries?select=id,name,slug,iso2,flag_emoji,is_active&id=eq.${encodeURIComponent(competition.country_id)}`
      ).catch(() => null)
    : null;

  return { matchday, season, competition, country };
}

async function readMatchdayEditorial(matchdayId: string): Promise<MatchdayEditorialWithHeadlineLink | null> {
  try {
    return await readFirst<MatchdayEditorialWithHeadlineLink>(
      `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,headline_link_url,below_headline_mode,below_headline_heading,below_headline_heading_color,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,latest_zone_mode,latest_zone_title,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}`
    );
  } catch {
    return readFirst<MatchdayEditorialWithHeadlineLink>(
      `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,headline_link_url,below_headline_mode,below_headline_heading,below_headline_heading_color,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}`
    ).catch(() => null);
  }
}

function readMatchdayHighlights(matchdayId: string): Promise<MatchdayHighlightWithLink[]> {
  return fetchSupabaseAdminTable<MatchdayHighlightWithLink>(
    `matchday_highlights?select=id,matchday_id,label,title,image_url,link_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=20`
  ).catch(() => []);
}

function readMatchdayRoundupItems(matchdayId: string): Promise<SupabaseMatchdayRoundupItem[]> {
  return fetchSupabaseAdminTable<SupabaseMatchdayRoundupItem>(
    `matchday_roundup_items?select=id,matchday_id,label,title,subtitle,image_url,video_url,duration,type,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=50`
  ).catch(() => []);
}

async function readMatchdayLatestNews(matchdayId: string): Promise<SupabaseMatchdayLatestNews[]> {
  try {
    return await fetchSupabaseAdminTable<SupabaseMatchdayLatestNews>(
      `matchday_latest_news?select=id,matchday_id,time_label,title,subtitle,image_url,link_url,article_id,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&order=sort_order.asc&limit=50`
    );
  } catch {
    return fetchSupabaseAdminTable<SupabaseMatchdayLatestNews>(
      `matchday_latest_news?select=id,matchday_id,time_label,title,image_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&order=sort_order.asc&limit=50`
    ).catch(() => []);
  }
}

function readMatchdayArticles(matchdayId: string): Promise<SupabaseArticle[]> {
  return fetchSupabaseAdminTable<SupabaseArticle>(
    `articles?select=id,title,summary,image_url,source_url,status,competition_id,season_id,matchday_id,match_id,published_at,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=published_at.desc.nullslast&limit=50`
  ).catch(() => []);
}

function readDraftReferenceComposition(matchdayId: string): Promise<ReferenceComposition | null> {
  return readFirst<ReferenceComposition>(
    `matchday_reference_compositions?select=id,matchday_id,status,is_current,internal_name,use_roundup_items,created_at,updated_at,published_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&status=eq.draft&order=created_at.desc`
  ).catch(() => null);
}

async function readReferenceCompositionForBackoffice(matchdayId: string): Promise<ReferenceComposition | null> {
  const draftComposition = await readDraftReferenceComposition(matchdayId);

  if (draftComposition) {
    return draftComposition;
  }

  return readFirst<ReferenceComposition>(
    `matchday_reference_compositions?select=id,matchday_id,status,is_current,internal_name,use_roundup_items,created_at,updated_at,published_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&status=eq.published&is_current=is.true&order=published_at.desc.nullslast`
  ).catch(() => null);
}

function readReferenceCompositionItems(compositionId?: string | null): Promise<ReferenceCompositionItem[]> {
  if (!compositionId) {
    return Promise.resolve([]);
  }

  return fetchSupabaseAdminTable<ReferenceCompositionItem>(
    `matchday_reference_composition_items?select=id,composition_id,slot_type,source_type,source_id,article_id,sort_order,title_snapshot,subtitle_snapshot,image_url_snapshot,link_url_snapshot,label_snapshot,status,created_at,updated_at&composition_id=eq.${encodeURIComponent(
      compositionId
    )}&order=sort_order.asc&limit=200`
  ).catch(() => []);
}

function statusLabel(status?: string | null) {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  return status || "Sem estado";
}

function compositionStatusLabel(status?: string | null) {
  if (status === "published") return "publicada";
  if (status === "draft") return "rascunho";
  return status || "sem estado";
}

function formatPublishedAt(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  });
}

function textOrEmpty(value?: string | null) {
  return value?.trim() || "";
}

function FieldLink({ href }: { href?: string | null }) {
  const url = textOrEmpty(href);

  if (!url) {
    return null;
  }

  return (
    <a className="composition-admin-link" href={url}>
      Abrir link
    </a>
  );
}

function ImagePreview({ src }: { src?: string | null }) {
  const imageUrl = textOrEmpty(src);

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="composition-admin-image">
      <img alt="" src={imageUrl} />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="composition-admin-empty">{children}</div>;
}

function ItemCard({
  label,
  title,
  subtitle,
  imageUrl,
  linkUrl,
  addedInLabel,
  meta,
  children
}: {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  addedInLabel?: string | null;
  meta?: Array<string | null | undefined>;
  children?: ReactNode;
}) {
  const visibleMeta = meta?.filter((item): item is string => Boolean(item)) ?? [];

  return (
    <article className="composition-admin-item">
      <ImagePreview src={imageUrl} />
      {textOrEmpty(label) ? <span className="composition-admin-label">{label}</span> : null}
      {addedInLabel ? (
        <span className="composition-admin-added-badge">Já adicionada em: {addedInLabel}</span>
      ) : null}
      {textOrEmpty(title) ? <strong className="composition-admin-title">{title}</strong> : null}
      {textOrEmpty(subtitle) ? <p className="composition-admin-copy">{subtitle}</p> : null}
      {visibleMeta.length > 0 ? (
        <div className="composition-admin-meta">
          {visibleMeta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <FieldLink href={linkUrl} />
      {children}
    </article>
  );
}

function RoundupItemCard({
  label,
  title,
  subtitle,
  linkUrl,
  addedInLabel,
  meta,
  children
}: {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
  addedInLabel?: string | null;
  meta?: Array<string | null | undefined>;
  children?: ReactNode;
}) {
  const visibleMeta = meta?.filter((item): item is string => Boolean(item)) ?? [];

  return (
    <article className="composition-admin-video-item">
      {textOrEmpty(label) ? <span className="composition-admin-label">{label}</span> : null}
      {addedInLabel ? (
        <span className="composition-admin-added-badge">Já adicionada em: {addedInLabel}</span>
      ) : null}
      {textOrEmpty(title) ? <strong className="composition-admin-title">{title}</strong> : null}
      {textOrEmpty(subtitle) ? <p className="composition-admin-copy">{subtitle}</p> : null}
      {visibleMeta.length > 0 ? (
        <div className="composition-admin-meta">
          {visibleMeta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <FieldLink href={linkUrl} />
      {children}
    </article>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="composition-admin-card">
      <header>
        <h3>{title}</h3>
      </header>
      <div className="composition-admin-card-body">{children}</div>
    </section>
  );
}

function ItemsGrid<T>({
  items,
  empty,
  render
}: {
  items: T[];
  empty: string;
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return <div className="composition-admin-grid">{items.map(render)}</div>;
}

function HiddenField({ name, value }: { name: string; value?: string | number | null }) {
  return <input type="hidden" name={name} value={value == null ? "" : String(value)} />;
}

function CreateDraftForm({ matchdayId, returnTo }: { matchdayId: string; returnTo: string }) {
  return (
    <form className="composition-admin-form" action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="create_draft" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="return_to" value={returnTo} />
      <div className="composition-admin-field">
        <label htmlFor="reference-composition-internal-name">Nome interno</label>
        <input
          className="composition-admin-input"
          id="reference-composition-internal-name"
          name="internal_name"
          placeholder="Rascunho de composição histórica"
        />
      </div>
      <button className="composition-admin-small-button" type="submit">
        Criar rascunho
      </button>
      <p className="composition-admin-note">
        O rascunho é criado apenas na nova estrutura de composição histórica. A página pública continua sem alterações.
      </p>
    </form>
  );
}

function UpdateDraftForm({
  composition,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  matchdayId: string;
  returnTo: string;
}) {
  return (
    <form className="composition-admin-form" action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="update_draft" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <div className="composition-admin-field">
        <label htmlFor="reference-composition-current-name">Nome interno</label>
        <input
          className="composition-admin-input"
          id="reference-composition-current-name"
          name="internal_name"
          defaultValue={composition.internal_name ?? ""}
        />
      </div>
      <label className="composition-admin-check">
        <input type="checkbox" name="use_roundup_items" value="1" defaultChecked={composition.use_roundup_items} /> Usar
        resumo/vídeos
      </label>
      <button className="composition-admin-small-button" type="submit">
        Guardar nome interno e opção
      </button>
    </form>
  );
}

function SaveCurrentPageStateForm({
  composition,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  matchdayId: string;
  returnTo: string;
}) {
  return (
    <form className="composition-admin-form" action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="save_current_page_state" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <p className="composition-admin-note">
        Adiciona à composição os blocos atualmente publicados, sem publicar nem alterar a página pública.
      </p>
      <label className="composition-admin-check">
        <input type="checkbox" required /> Isto vai adicionar à composição os blocos atualmente publicados. Não altera a página pública.
      </label>
      <button className="composition-admin-small-button" type="submit">
        GUARDAR ESTADO ATUAL DA PÁGINA
      </button>
    </form>
  );
}

function PublishCompositionForm({
  composition,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  matchdayId: string;
  returnTo: string;
}) {
  return (
    <form className="composition-admin-form" action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="publish_reference_composition" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <p className="composition-admin-note">
        Publica internamente esta composição como versão ativa da jornada. Não altera a página pública.
      </p>
      <button className="composition-admin-small-button" type="submit">
        Publicar composição
      </button>
    </form>
  );
}

function ReopenCompositionForm({
  composition,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  matchdayId: string;
  returnTo: string;
}) {
  return (
    <form className="composition-admin-form" action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="reopen_reference_composition" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <p className="composition-admin-note">
        Esta composição está publicada. Para alterar itens, reabre como rascunho, corrige e publica novamente.
      </p>
      <button className="composition-admin-small-button secondary" type="submit">
        Reabrir para edição
      </button>
    </form>
  );
}

function AddCandidateForm({
  composition,
  matchdayId,
  returnTo,
  sortOrder,
  slotType,
  sourceType,
  sourceId,
  articleId,
  title,
  subtitle,
  imageUrl,
  linkUrl,
  label,
  alreadyAdded,
  buttonLabel = "Adicionar à composição"
}: {
  composition: ReferenceComposition | null;
  matchdayId: string;
  returnTo: string;
  sortOrder: number;
  slotType: string;
  sourceType: string;
  sourceId?: string | null;
  articleId?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  label?: string | null;
  alreadyAdded?: boolean;
  buttonLabel?: string;
}) {
  if (!composition || composition.status !== "draft" || alreadyAdded) {
    return null;
  }

  return (
    <form action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="add_item" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <HiddenField name="slot_type" value={slotType} />
      <HiddenField name="source_type" value={sourceType} />
      <HiddenField name="source_id" value={sourceId} />
      <HiddenField name="article_id" value={articleId} />
      <HiddenField name="sort_order" value={sortOrder} />
      <HiddenField name="title_snapshot" value={title} />
      <HiddenField name="subtitle_snapshot" value={subtitle} />
      <HiddenField name="image_url_snapshot" value={imageUrl} />
      <HiddenField name="link_url_snapshot" value={linkUrl} />
      <HiddenField name="label_snapshot" value={label} />
      <button className="composition-admin-small-button" type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}

function AddImportantItemForm({
  composition,
  matchdayId,
  returnTo,
  sortOrder,
  sourceType,
  sourceId,
  articleId,
  title,
  subtitle,
  imageUrl,
  linkUrl,
  label,
  alreadyAdded
}: {
  composition: ReferenceComposition | null;
  matchdayId: string;
  returnTo: string;
  sortOrder: number;
  sourceType: string;
  sourceId?: string | null;
  articleId?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  label?: string | null;
  alreadyAdded?: boolean;
}) {
  if (!composition || composition.status !== "draft" || alreadyAdded) {
    return null;
  }

  return (
    <form action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="add_item" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="return_to" value={returnTo} />
      <HiddenField name="slot_type" value="important_item" />
      <HiddenField name="source_type" value={sourceType} />
      <HiddenField name="source_id" value={sourceId} />
      <HiddenField name="article_id" value={articleId} />
      <HiddenField name="sort_order" value={sortOrder} />
      <HiddenField name="title_snapshot" value={title} />
      <HiddenField name="subtitle_snapshot" value={subtitle} />
      <HiddenField name="image_url_snapshot" value={imageUrl} />
      <HiddenField name="link_url_snapshot" value={linkUrl} />
      <HiddenField name="label_snapshot" value={label} />
      <button className="composition-admin-small-button secondary" type="submit">
        Adicionar a Mais notícias da jornada
      </button>
    </form>
  );
}

function RemoveItemForm({
  composition,
  item,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  item: ReferenceCompositionItem;
  matchdayId: string;
  returnTo: string;
}) {
  return (
    <form action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="remove_item" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="item_id" value={item.id} />
      <HiddenField name="return_to" value={returnTo} />
      <button className="composition-admin-small-button secondary" type="submit">
        Remover da composição
      </button>
    </form>
  );
}

function MoveItemForm({
  composition,
  item,
  matchdayId,
  returnTo,
  targetSlotType,
  label
}: {
  composition: ReferenceComposition;
  item: ReferenceCompositionItem;
  matchdayId: string;
  returnTo: string;
  targetSlotType: "important_item" | "editorial_line_item";
  label: string;
}) {
  return (
    <form action="/api/admin/editorial/composicao" method="post">
      <HiddenField name="action_type" value="move_composition_item" />
      <HiddenField name="matchday_id" value={matchdayId} />
      <HiddenField name="composition_id" value={composition.id} />
      <HiddenField name="item_id" value={item.id} />
      <HiddenField name="target_slot_type" value={targetSlotType} />
      <HiddenField name="return_to" value={returnTo} />
      <button className="composition-admin-small-button secondary" type="submit">
        {label}
      </button>
    </form>
  );
}

function CompositionItemActions({
  composition,
  item,
  matchdayId,
  returnTo
}: {
  composition: ReferenceComposition;
  item: ReferenceCompositionItem;
  matchdayId: string;
  returnTo: string;
}) {
  const canMove = canMoveToFreeNewsSlot(item);

  return (
    <div className="composition-admin-form">
      {canMove && item.slot_type !== "important_item" ? (
        <MoveItemForm
          composition={composition}
          item={item}
          matchdayId={matchdayId}
          returnTo={returnTo}
          targetSlotType="important_item"
          label="Mover para Mais notícias da jornada"
        />
      ) : null}
      {canMove && item.slot_type !== "editorial_line_item" ? (
        <MoveItemForm
          composition={composition}
          item={item}
          matchdayId={matchdayId}
          returnTo={returnTo}
          targetSlotType="editorial_line_item"
          label="Mover para Zona editorial final"
        />
      ) : null}
      {canMove ? (
        <p className="composition-admin-note">Se quiseres reaproveitar esta notícia noutra zona, usa Mover em vez de Remover.</p>
      ) : null}
      <RemoveItemForm composition={composition} item={item} matchdayId={matchdayId} returnTo={returnTo} />
    </div>
  );
}

export default async function AdminEditorialCompositionPage({ params }: CompositionPageProps) {
  const { matchdayId } = await params;
  const context = await readMatchdayContext(matchdayId);

  if (!context) {
    return (
      <main className="composition-admin-shell">
        <style>{compositionPageStyles}</style>
        <section className="composition-admin-panel">
          <header>
            <h2>Jornada não encontrada</h2>
            <p>A composição editorial só pode ser visualizada a partir de uma jornada existente.</p>
          </header>
        </section>
      </main>
    );
  }

  const { matchday, season, competition, country } = context;
  const [editorial, highlights, roundupItems, latestNews, articles] = await Promise.all([
    readMatchdayEditorial(matchday.id),
    readMatchdayHighlights(matchday.id),
    readMatchdayRoundupItems(matchday.id),
    readMatchdayLatestNews(matchday.id),
    readMatchdayArticles(matchday.id)
  ]);
  const publishedHighlights = highlights.filter((item) => item.status === "published");
  const publishedRoundupItems = roundupItems.filter((item) => item.status === "published");
  const publishedLatestNews = latestNews.filter((item) => item.status === "published");
  const publishedArticles = articles.filter((item) => item.status === "published");
  const draftComposition = await readReferenceCompositionForBackoffice(matchday.id);
  const compositionItems = await readReferenceCompositionItems(draftComposition?.id);
  const returnTo = `/admin/editorial/composicao/${matchday.id}`;
  const nextSortOrder = compositionItems.length + 1;
  const groupedCompositionItems = groupCompositionItemsBySection(compositionItems);
  const publicationValidation = getCompositionPublicationValidation(compositionItems);
  const getCandidateAddedInLabel = (
    sourceType: string,
    sourceId?: string | null,
    articleId?: string | null,
    linkUrl?: string | null,
    originSlotType?: string | null,
    title?: string | null,
    subtitle?: string | null,
    imageUrl?: string | null
  ) => candidatePlacementLabel(compositionItems, { sourceType, sourceId, articleId, linkUrl, originSlotType, title, subtitle, imageUrl });
  const isDraftComposition = draftComposition?.status === "draft";
  const isPublishedComposition = draftComposition?.status === "published";
  const publishedCompositionProblemMessage = isPublishedComposition ? getPublishedCompositionProblemMessage(compositionItems) : null;
  const publishedAtLabel = formatPublishedAt(draftComposition?.published_at);
  const latestZoneMode = editorial?.latest_zone_mode === "editorial_line" ? "Linha editorial" : "Últimas notícias";
  const contextLabel = `${country?.name ?? "Pais"} / ${competition.name} / ${season.label} / ${matchday.label}`;

  return (
    <main className="composition-admin-shell">
      <style>{compositionPageStyles}</style>

      <section className="composition-admin-hero">
        <div>
          <p>Composição editorial da jornada</p>
          <h1>Jornada {String(matchday.number).padStart(2, "0")}</h1>
          <span>{contextLabel}</span>
        </div>
        <nav className="composition-admin-actions" aria-label="Acoes de navegacao">
          <a className="composition-admin-button" href={`/admin/editorial/jornada/${matchday.id}`}>
            Backoffice editorial
          </a>
          <a className="composition-admin-button" href="/admin/gestor">
            Centro de gestao
          </a>
        </nav>
      </section>

      <div className="composition-admin-layout">
        <section className="composition-admin-panel">
          <header>
            <h2>Atualidade</h2>
            <p>Leitura do estado editorial atual da página da jornada. Esta área é apenas de consulta.</p>
          </header>
          <div className="composition-admin-stack">
            <Card title="Manchete atual">
              {editorial ? (
                <ItemCard
                  imageUrl={editorial.image_url}
                  title={editorial.title}
                  subtitle={editorial.summary}
                  meta={[statusLabel(editorial.status)]}
                />
              ) : (
                <EmptyState>Não existe manchete editorial guardada para esta jornada.</EmptyState>
              )}
            </Card>

            <Card title="Destaques abaixo da manchete">
              <ItemsGrid
                items={highlights}
                empty="Não existem destaques guardados."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.label}
                    title={item.title}
                    meta={[`Posicao ${item.sort_order}`, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Complemento da manchete">
              {editorial?.complementary_mode !== "none" ? (
                <ItemCard
                  imageUrl={editorial?.complementary_image_url}
                  label={editorial?.complementary_label}
                  title={editorial?.complementary_title}
                  subtitle={editorial?.complementary_text}
                  linkUrl={editorial?.complementary_link_url}
                  meta={[editorial?.complementary_mode, statusLabel(editorial?.complementary_status)]}
                />
              ) : (
                <EmptyState>O complemento da manchete está sem modo ativo.</EmptyState>
              )}
            </Card>

            <Card title="Bloco lateral">
              {editorial?.side_block_status ? (
                <ItemCard
                  imageUrl={editorial?.side_block_image_url}
                  label={editorial?.side_block_label || editorial?.side_block_type}
                  title={editorial?.side_block_title}
                  subtitle={editorial?.side_block_text}
                  linkUrl={editorial?.side_block_link_url}
                  meta={[editorial?.side_block_author ? `Autor: ${editorial.side_block_author}` : null, statusLabel(editorial?.side_block_status)]}
                />
              ) : (
                <EmptyState>O bloco lateral ainda não tem conteúdo guardado.</EmptyState>
              )}
            </Card>

            <Card title="Resumo da jornada / vídeos">
              <ItemsGrid
                items={roundupItems}
                empty="Não existem itens de resumo ou vídeo."
                render={(item) => (
                  <RoundupItemCard
                    key={item.id}
                    label={item.label || item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.video_url}
                    meta={[`Posicao ${item.sort_order}`, item.duration, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Zona editorial final">
              <div className="composition-admin-meta">
                <span>Modo atual: {latestZoneMode}</span>
                {editorial?.latest_zone_title ? <span>Titulo: {editorial.latest_zone_title}</span> : null}
              </div>
              <ItemsGrid
                items={latestNews}
                empty="Não existem itens na zona editorial final."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.time_label}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.link_url}
                    meta={[`Posicao ${item.sort_order}`, item.article_id ? `Artigo: ${item.article_id}` : null, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>
          </div>
        </section>

        <section className="composition-admin-panel">
          <header>
            <h2>Arquivo / Memória histórica</h2>
            <p>Candidatos disponíveis e composição histórica em rascunho. Esta área não altera a página pública.</p>
          </header>
          <div className="composition-admin-stack">
            <Card title={isPublishedComposition ? "Composição publicada" : "Composição em rascunho"}>
              {draftComposition ? (
                <>
                  <div className="composition-admin-meta">
                    <span>Estado: {compositionStatusLabel(draftComposition.status)}</span>
                    {isPublishedComposition ? (
                      <span>Versão ativa: {draftComposition.is_current ? "sim" : "não"}</span>
                    ) : (
                      <span>Não publicado no site</span>
                    )}
                    <span>{draftComposition.use_roundup_items ? "Inclui resumo/vídeos" : "Não inclui resumo/vídeos"}</span>
                    {publishedAtLabel ? <span>Publicado em: {publishedAtLabel}</span> : null}
                  </div>
                  {isDraftComposition ? (
                    <>
                      <UpdateDraftForm composition={draftComposition} matchdayId={matchday.id} returnTo={returnTo} />
                      <SaveCurrentPageStateForm composition={draftComposition} matchdayId={matchday.id} returnTo={returnTo} />
                      {publicationValidation.warnings.length > 0 ? (
                        <div className="composition-admin-note">
                          {publicationValidation.warnings.map((warning) => (
                            <p key={warning}>{warning}</p>
                          ))}
                        </div>
                      ) : null}
                      {publicationValidation.canPublish ? (
                        <PublishCompositionForm composition={draftComposition} matchdayId={matchday.id} returnTo={returnTo} />
                      ) : null}
                    </>
                  ) : null}
                  {isPublishedComposition && draftComposition.is_current ? (
                    <>
                      {publishedCompositionProblemMessage ? (
                        <p className="composition-admin-note">{publishedCompositionProblemMessage}</p>
                      ) : null}
                      <p className="composition-admin-note">Esta é a composição ativa desta jornada.</p>
                      <ReopenCompositionForm composition={draftComposition} matchdayId={matchday.id} returnTo={returnTo} />
                    </>
                  ) : null}
                </>
              ) : (
                <CreateDraftForm matchdayId={matchday.id} returnTo={returnTo} />
              )}
            </Card>

            <Card title="Itens já adicionados">
              {draftComposition && compositionItems.length > 0 ? (
                <div className="composition-admin-section-list">
                  {groupedCompositionItems.map((section) => (
                    <section className="composition-admin-section" key={section.slotType}>
                      <div className="composition-admin-section-heading">
                        <h4>{section.title}</h4>
                        <span>
                          {section.items.length} {section.items.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                      <div className="composition-admin-grid">
                        {section.items.length === 0 && section.slotType === "important_item" ? (
                          <EmptyState>Sem notícias adicionadas nesta zona.</EmptyState>
                        ) : null}
                        {section.items.map((item) => {
                          const itemMeta = [
                            `Ordem ${item.sort_order}`,
                            `Bloco: ${item.slot_type}`,
                            `Fonte: ${item.source_type}`,
                            item.article_id ? `Artigo: ${item.article_id}` : null,
                            statusLabel(item.status)
                          ];

                          if (item.slot_type === "roundup") {
                            return (
                              <RoundupItemCard
                                key={item.id}
                                label={compositionItemDisplayLabel(item)}
                                title={item.title_snapshot}
                                subtitle={item.subtitle_snapshot}
                                linkUrl={item.link_url_snapshot}
                              meta={itemMeta}
                            >
                              {isDraftComposition ? (
                                  <CompositionItemActions composition={draftComposition} item={item} matchdayId={matchday.id} returnTo={returnTo} />
                                ) : null}
                              </RoundupItemCard>
                            );
                          }

                          return (
                            <ItemCard
                              key={item.id}
                              imageUrl={item.image_url_snapshot}
                              label={compositionItemDisplayLabel(item)}
                              title={item.title_snapshot}
                              subtitle={item.subtitle_snapshot}
                              linkUrl={item.link_url_snapshot}
                              meta={itemMeta}
                            >
                              {isDraftComposition ? (
                                <CompositionItemActions composition={draftComposition} item={item} matchdayId={matchday.id} returnTo={returnTo} />
                              ) : null}
                            </ItemCard>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <EmptyState>
                  {draftComposition
                    ? "Ainda não há itens adicionados à composição histórica em rascunho."
                    : "Cria primeiro um rascunho para começar a adicionar candidatos."}
                </EmptyState>
              )}
            </Card>

            <details className="composition-admin-candidates" open={compositionItems.length === 0}>
              <summary>Candidatos disponíveis</summary>
              <div className="composition-admin-candidates-body">
                <Card title="Manchete candidata">
                  {editorial ? (
                    <ItemCard
                      imageUrl={editorial.image_url}
                      title={editorial.title}
                      subtitle={editorial.summary}
                      linkUrl={editorial.headline_link_url}
                      addedInLabel={getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.headline_link_url, "headline", editorial.title, editorial.summary, editorial.image_url)}
                      meta={["Fonte: matchday_editorials", statusLabel(editorial.status)]}
                    >
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="headline"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.title}
                        subtitle={editorial.summary}
                        imageUrl={editorial.image_url}
                        linkUrl={editorial.headline_link_url}
                        label="Manchete"
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.headline_link_url, "headline", editorial.title, editorial.summary, editorial.image_url))}
                      />
                      <AddImportantItemForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.title}
                        subtitle={editorial.summary}
                        imageUrl={editorial.image_url}
                        linkUrl={editorial.headline_link_url}
                        label="Manchete"
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.headline_link_url, "headline", editorial.title, editorial.summary, editorial.image_url))}
                      />
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="editorial_line_item"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.title}
                        subtitle={editorial.summary}
                        imageUrl={editorial.image_url}
                        linkUrl={editorial.headline_link_url}
                        label="Manchete"
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.headline_link_url, "headline", editorial.title, editorial.summary, editorial.image_url))}
                        buttonLabel="Adicionar à Zona editorial final"
                      />
                    </ItemCard>
                  ) : (
                    <EmptyState>Não há manchete candidata guardada.</EmptyState>
                  )}
                </Card>

                <Card title="Bloco lateral candidato">
                  {editorial?.side_block_title || editorial?.side_block_text || editorial?.side_block_image_url ? (
                    <ItemCard
                      imageUrl={editorial?.side_block_image_url}
                      label={editorial?.side_block_label || editorial?.side_block_type}
                      title={editorial?.side_block_title}
                      subtitle={editorial?.side_block_text}
                      linkUrl={editorial?.side_block_link_url}
                      addedInLabel={getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.side_block_link_url, "side_block", editorial.side_block_title, editorial.side_block_text, editorial.side_block_image_url)}
                      meta={["Fonte: matchday_editorials", statusLabel(editorial?.side_block_status)]}
                    >
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="side_block"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.side_block_title}
                        subtitle={editorial.side_block_text}
                        imageUrl={editorial.side_block_image_url}
                        linkUrl={editorial.side_block_link_url}
                        label={editorial.side_block_label || editorial.side_block_type}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.side_block_link_url, "side_block", editorial.side_block_title, editorial.side_block_text, editorial.side_block_image_url))}
                      />
                      <AddImportantItemForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.side_block_title}
                        subtitle={editorial.side_block_text}
                        imageUrl={editorial.side_block_image_url}
                        linkUrl={editorial.side_block_link_url}
                        label={editorial.side_block_label || editorial.side_block_type}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.side_block_link_url, "side_block", editorial.side_block_title, editorial.side_block_text, editorial.side_block_image_url))}
                      />
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="editorial_line_item"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.side_block_title}
                        subtitle={editorial.side_block_text}
                        imageUrl={editorial.side_block_image_url}
                        linkUrl={editorial.side_block_link_url}
                        label={editorial.side_block_label || editorial.side_block_type}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.side_block_link_url, "side_block", editorial.side_block_title, editorial.side_block_text, editorial.side_block_image_url))}
                        buttonLabel="Adicionar à Zona editorial final"
                      />
                    </ItemCard>
                  ) : (
                    <EmptyState>Não há bloco lateral candidato guardado.</EmptyState>
                  )}
                </Card>

                <Card title="Complemento candidato">
                  {editorial?.complementary_title || editorial?.complementary_text || editorial?.complementary_image_url ? (
                    <ItemCard
                      imageUrl={editorial?.complementary_image_url}
                      label={editorial?.complementary_label}
                      title={editorial?.complementary_title}
                      subtitle={editorial?.complementary_text}
                      linkUrl={editorial?.complementary_link_url}
                      addedInLabel={getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.complementary_link_url, "complement", editorial.complementary_title, editorial.complementary_text, editorial.complementary_image_url)}
                      meta={["Fonte: matchday_editorials", statusLabel(editorial?.complementary_status)]}
                    >
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="complement"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.complementary_title}
                        subtitle={editorial.complementary_text}
                        imageUrl={editorial.complementary_image_url}
                        linkUrl={editorial.complementary_link_url}
                        label={editorial.complementary_label}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.complementary_link_url, "complement", editorial.complementary_title, editorial.complementary_text, editorial.complementary_image_url))}
                      />
                      <AddImportantItemForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.complementary_title}
                        subtitle={editorial.complementary_text}
                        imageUrl={editorial.complementary_image_url}
                        linkUrl={editorial.complementary_link_url}
                        label={editorial.complementary_label}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.complementary_link_url, "complement", editorial.complementary_title, editorial.complementary_text, editorial.complementary_image_url))}
                      />
                      <AddCandidateForm
                        composition={draftComposition}
                        matchdayId={matchday.id}
                        returnTo={returnTo}
                        sortOrder={nextSortOrder}
                        slotType="editorial_line_item"
                        sourceType="matchday_editorial"
                        sourceId={editorial.id}
                        title={editorial.complementary_title}
                        subtitle={editorial.complementary_text}
                        imageUrl={editorial.complementary_image_url}
                        linkUrl={editorial.complementary_link_url}
                        label={editorial.complementary_label}
                        alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_editorial", editorial.id, null, editorial.complementary_link_url, "complement", editorial.complementary_title, editorial.complementary_text, editorial.complementary_image_url))}
                        buttonLabel="Adicionar à Zona editorial final"
                      />
                    </ItemCard>
                  ) : (
                    <EmptyState>Não há complemento candidato guardado.</EmptyState>
                  )}
                </Card>

                <Card title="Destaques candidatos">
                  <ItemsGrid
                    items={publishedHighlights.length > 0 ? publishedHighlights : highlights}
                    empty="Não há destaques candidatos."
                    render={(item) => (
                      <ItemCard
                        key={item.id}
                        imageUrl={item.image_url}
                        label={item.label}
                        title={item.title}
                        linkUrl={item.link_url}
                        addedInLabel={getCandidateAddedInLabel("matchday_highlight", item.id, null, item.link_url, null, item.title, null, item.image_url)}
                        meta={["Fonte: matchday_highlights", `Posicao ${item.sort_order}`, statusLabel(item.status)]}
                      >
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="highlight"
                          sourceType="matchday_highlight"
                          sourceId={item.id}
                          title={item.title}
                          imageUrl={item.image_url}
                          linkUrl={item.link_url}
                          label={item.label}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_highlight", item.id, null, item.link_url, null, item.title, null, item.image_url))}
                        />
                        <AddImportantItemForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          sourceType="matchday_highlight"
                          sourceId={item.id}
                          title={item.title}
                          imageUrl={item.image_url}
                          linkUrl={item.link_url}
                          label={item.label}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_highlight", item.id, null, item.link_url, null, item.title, null, item.image_url))}
                        />
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="editorial_line_item"
                          sourceType="matchday_highlight"
                          sourceId={item.id}
                          title={item.title}
                          imageUrl={item.image_url}
                          linkUrl={item.link_url}
                          label={item.label}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_highlight", item.id, null, item.link_url, null, item.title, null, item.image_url))}
                          buttonLabel="Adicionar à Zona editorial final"
                        />
                      </ItemCard>
                    )}
                  />
                </Card>

                <Card title="Cartões disponíveis da Zona editorial final">
                  <ItemsGrid
                    items={publishedLatestNews.length > 0 ? publishedLatestNews : latestNews}
                    empty="Não há cartões disponíveis na zona editorial final."
                    render={(item) => (
                      <ItemCard
                        key={item.id}
                        imageUrl={item.image_url}
                        label={item.time_label}
                        title={item.title}
                        subtitle={item.subtitle}
                        linkUrl={item.link_url}
                        addedInLabel={getCandidateAddedInLabel("matchday_latest_news", item.id, item.article_id, item.link_url, null, item.title, item.subtitle, item.image_url)}
                        meta={["Fonte: matchday_latest_news", `Posicao ${item.sort_order}`, item.article_id ? `Artigo: ${item.article_id}` : null, statusLabel(item.status)]}
                      >
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="editorial_line_item"
                          sourceType="matchday_latest_news"
                          sourceId={item.id}
                          articleId={item.article_id}
                          title={item.title}
                          subtitle={item.subtitle}
                          imageUrl={item.image_url}
                          linkUrl={item.link_url}
                          label={item.time_label}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_latest_news", item.id, item.article_id, item.link_url, null, item.title, item.subtitle, item.image_url))}
                          buttonLabel="Adicionar à Zona editorial final"
                        />
                        <AddImportantItemForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          sourceType="matchday_latest_news"
                          sourceId={item.id}
                          articleId={item.article_id}
                          title={item.title}
                          subtitle={item.subtitle}
                          imageUrl={item.image_url}
                          linkUrl={item.link_url}
                          label={item.time_label}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_latest_news", item.id, item.article_id, item.link_url, null, item.title, item.subtitle, item.image_url))}
                        />
                      </ItemCard>
                    )}
                  />
                </Card>

                <Card title="Vídeos / resumo disponíveis">
                  <ItemsGrid
                    items={publishedRoundupItems.length > 0 ? publishedRoundupItems : roundupItems}
                    empty="Não há vídeos ou resumos disponíveis."
                    render={(item) => (
                      <RoundupItemCard
                        key={item.id}
                        label={item.label || item.type}
                        title={item.title}
                        subtitle={item.subtitle}
                        linkUrl={item.video_url}
                        addedInLabel={getCandidateAddedInLabel("matchday_roundup_item", item.id, null, item.video_url, null, item.title, item.subtitle, item.image_url)}
                        meta={["Fonte: matchday_roundup_items", `Posicao ${item.sort_order}`, item.duration, statusLabel(item.status)]}
                      >
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="roundup"
                          sourceType="matchday_roundup_item"
                          sourceId={item.id}
                          title={item.title}
                          subtitle={item.subtitle}
                          imageUrl={item.image_url}
                          linkUrl={item.video_url}
                          label={item.label || item.type}
                          alreadyAdded={Boolean(getCandidateAddedInLabel("matchday_roundup_item", item.id, null, item.video_url, null, item.title, item.subtitle, item.image_url))}
                        />
                      </RoundupItemCard>
                    )}
                  />
                </Card>

                <Card title="Artigos / notícias relacionados">
                  <ItemsGrid
                    items={publishedArticles.length > 0 ? publishedArticles : articles}
                    empty="Não há artigos relacionados de forma direta com esta jornada."
                    render={(item) => (
                      <ItemCard
                        key={item.id}
                        imageUrl={item.image_url}
                        title={item.title}
                        subtitle={item.summary}
                        linkUrl={item.source_url}
                        addedInLabel={getCandidateAddedInLabel("article", item.id, item.id, item.source_url, null, item.title, item.summary, item.image_url)}
                        meta={["Fonte: articles", statusLabel(item.status), item.published_at ? `Publicado: ${new Date(item.published_at).toLocaleDateString("pt-PT")}` : null]}
                      >
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="related_article"
                          sourceType="article"
                          sourceId={item.id}
                          articleId={item.id}
                          title={item.title}
                          subtitle={item.summary}
                          imageUrl={item.image_url}
                          linkUrl={item.source_url}
                          label="Artigo / notícia"
                          alreadyAdded={Boolean(getCandidateAddedInLabel("article", item.id, item.id, item.source_url, null, item.title, item.summary, item.image_url))}
                        />
                        <AddCandidateForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          slotType="editorial_line_item"
                          sourceType="article"
                          sourceId={item.id}
                          articleId={item.id}
                          title={item.title}
                          subtitle={item.summary}
                          imageUrl={item.image_url}
                          linkUrl={item.source_url}
                          label="Artigo / notícia"
                          alreadyAdded={Boolean(getCandidateAddedInLabel("article", item.id, item.id, item.source_url, null, item.title, item.summary, item.image_url))}
                          buttonLabel="Adicionar à Zona editorial final"
                        />
                        <AddImportantItemForm
                          composition={draftComposition}
                          matchdayId={matchday.id}
                          returnTo={returnTo}
                          sortOrder={nextSortOrder}
                          sourceType="article"
                          sourceId={item.id}
                          articleId={item.id}
                          title={item.title}
                          subtitle={item.summary}
                          imageUrl={item.image_url}
                          linkUrl={item.source_url}
                          label="Artigo / notícia"
                          alreadyAdded={Boolean(getCandidateAddedInLabel("article", item.id, item.id, item.source_url, null, item.title, item.summary, item.image_url))}
                        />
                      </ItemCard>
                    )}
                  />
                </Card>
              </div>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
