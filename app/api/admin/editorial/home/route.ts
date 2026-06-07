import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

const HIGHLIGHT_SORT_ORDERS = Array.from({ length: 3 }, (_, index) => index + 1);
const ROUNDUP_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);
const LATEST_NEWS_SORT_ORDERS = Array.from({ length: 8 }, (_, index) => index + 1);

type SiteEditorialIdRow = {
  id: string;
};

type FeaturedMatchRow = {
  id: string;
  match_id: string;
};

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanStatus(value: FormDataEntryValue | null): "draft" | "published" {
  return cleanText(value) === "published" ? "published" : "draft";
}

function cleanBelowHeadlineMode(value: FormDataEntryValue | null): "highlights" | "roundup" {
  return cleanText(value) === "roundup" ? "roundup" : "highlights";
}

function cleanComplementaryMode(value: FormDataEntryValue | null): "none" | "complementary_story" | "roundup_video" {
  const mode = cleanText(value);

  return mode === "complementary_story" || mode === "roundup_video" ? mode : "none";
}

function uniqueFormValues(values: FormDataEntryValue[]) {
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    selected.push(trimmed);
    seen.add(trimmed);
  }

  return selected;
}

function returnUrl(request: Request, formData: FormData, key: "created" | "error", value: string) {
  const rawReturnTo = cleanText(formData.get("return_to"));
  const safeReturnTo = rawReturnTo?.startsWith("/admin/editorial/home") ? rawReturnTo : "/admin/editorial/home";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.set(key, value);

  return NextResponse.redirect(url, { status: 303 });
}

async function getHomeEditorialId() {
  const rows = await fetchSupabaseAdminTable<SiteEditorialIdRow>(
    "site_editorials?select=id&slug=eq.home&limit=1"
  );

  if (rows[0]) {
    return rows[0].id;
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

  const createdRows = await fetchSupabaseAdminTable<SiteEditorialIdRow>(
    "site_editorials?select=id&slug=eq.home&limit=1"
  );

  if (!createdRows[0]) {
    throw new Error("home-editorial-not-found");
  }

  return createdRows[0].id;
}

async function saveHomeEditorial(formData: FormData) {
  const id = await getHomeEditorialId();
  const hasBelowHeadlineMode = formData.has("below_headline_mode");
  const belowHeadlineMode = cleanBelowHeadlineMode(formData.get("below_headline_mode"));
  let complementaryMode = cleanComplementaryMode(formData.get("complementary_mode"));
  const shouldSyncComplementaryMode =
    hasBelowHeadlineMode && complementaryMode !== "none" && !formData.has("allow_manual_complementary_mode");

  if (shouldSyncComplementaryMode) {
    complementaryMode = belowHeadlineMode === "roundup" ? "roundup_video" : "complementary_story";
  }

  const complementaryRoundupItemId = cleanText(formData.get("complementary_roundup_item_id"));
  const payload: Record<string, string | null> = {};

  if (complementaryRoundupItemId) {
    const rows = await fetchSupabaseAdminTable<{ id: string }>(
      `site_editorial_roundup_items?select=id&id=eq.${encodeURIComponent(complementaryRoundupItemId)}&site_editorial_id=eq.${encodeURIComponent(id)}&limit=1`
    );

    if (!rows[0]) {
      throw new Error("roundup-item-invalid");
    }
  }

  const assignText = (field: string) => {
    if (formData.has(field)) {
      payload[field] = cleanText(formData.get(field));
    }
  };

  if (formData.has("status")) {
    payload.status = cleanStatus(formData.get("status"));
  }

  assignText("headline_title");
  assignText("headline_subtitle");
  assignText("headline_image_url");
  assignText("headline_link_url");
  assignText("headline_title_color");

  if (hasBelowHeadlineMode) {
    payload.below_headline_mode = belowHeadlineMode;
  }

  assignText("below_headline_heading");
  assignText("below_headline_heading_color");

  if (formData.has("side_block_status")) {
    payload.side_block_status = cleanStatus(formData.get("side_block_status"));
  }

  assignText("side_block_type");
  assignText("side_block_label");
  assignText("side_block_title");
  assignText("side_block_title_color");
  assignText("side_block_author");
  assignText("side_block_text");
  assignText("side_block_image_url");
  assignText("side_block_link_url");

  if (formData.has("complementary_status")) {
    payload.complementary_status = cleanStatus(formData.get("complementary_status"));
  }

  if (formData.has("complementary_mode") || shouldSyncComplementaryMode) {
    payload.complementary_mode = complementaryMode;
  }

  assignText("complementary_roundup_item_id");
  assignText("complementary_label");
  assignText("complementary_title");
  assignText("complementary_text");
  assignText("complementary_image_url");
  assignText("complementary_link_url");
  assignText("roundup_video_heading");
  assignText("roundup_video_heading_color");

  await writeSupabaseAdmin(`site_editorials?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

async function upsertEditorialItem(
  table: "site_editorial_highlights" | "site_editorial_roundup_items" | "site_editorial_latest_news",
  siteEditorialId: string,
  sortOrder: number,
  payload: Record<string, string | number | null>
) {
  const rows = await fetchSupabaseAdminTable<{ id: string }>(
    `${table}?select=id&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&sort_order=eq.${sortOrder}&limit=1`
  );

  if (rows[0]) {
    await writeSupabaseAdmin(`${table}?id=eq.${encodeURIComponent(rows[0].id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return;
  }

  await writeSupabaseAdmin(table, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      site_editorial_id: siteEditorialId,
      sort_order: sortOrder
    })
  });
}

async function saveHighlights(formData: FormData) {
  const siteEditorialId = await getHomeEditorialId();

  for (const sortOrder of HIGHLIGHT_SORT_ORDERS) {
    const title = cleanText(formData.get(`highlight_${sortOrder}_title`));
    const payload = {
      label: cleanText(formData.get(`highlight_${sortOrder}_label`)),
      title,
      subtitle: cleanText(formData.get(`highlight_${sortOrder}_subtitle`)),
      image_url: cleanText(formData.get(`highlight_${sortOrder}_image_url`)),
      link_url: cleanText(formData.get(`highlight_${sortOrder}_link_url`)),
      sort_order: sortOrder,
      status: title ? cleanStatus(formData.get(`highlight_${sortOrder}_status`)) : "draft"
    };

    await upsertEditorialItem("site_editorial_highlights", siteEditorialId, sortOrder, payload);
  }
}

async function saveRoundupItems(formData: FormData) {
  const siteEditorialId = await getHomeEditorialId();

  for (const sortOrder of ROUNDUP_SORT_ORDERS) {
    const title = cleanText(formData.get(`roundup_${sortOrder}_title`));
    const payload = {
      label: cleanText(formData.get(`roundup_${sortOrder}_label`)),
      title,
      subtitle: cleanText(formData.get(`roundup_${sortOrder}_subtitle`)),
      video_url: cleanText(formData.get(`roundup_${sortOrder}_video_url`)),
      duration: cleanText(formData.get(`roundup_${sortOrder}_duration`)),
      type: "video",
      sort_order: sortOrder,
      status: title ? cleanStatus(formData.get(`roundup_${sortOrder}_status`)) : "draft"
    };

    await upsertEditorialItem("site_editorial_roundup_items", siteEditorialId, sortOrder, payload);
  }
}

async function saveFeaturedMatches(formData: FormData) {
  const selectedMatchIds = uniqueFormValues(formData.getAll("featured_match_id"));
  const selectedSet = new Set(selectedMatchIds);
  const existingRows = await fetchSupabaseAdminTable<FeaturedMatchRow>(
    "site_featured_matches?select=id,match_id"
  );

  for (const row of existingRows) {
    if (!selectedSet.has(row.match_id)) {
      await writeSupabaseAdmin(`site_featured_matches?id=eq.${encodeURIComponent(row.id)}`, {
        method: "DELETE"
      });
    }
  }

  for (const [index, matchId] of selectedMatchIds.entries()) {
    await writeSupabaseAdmin("site_featured_matches?on_conflict=match_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        match_id: matchId,
        sort_order: index + 1
      })
    });
  }
}

async function saveLatestNews(formData: FormData) {
  const siteEditorialId = await getHomeEditorialId();

  for (const sortOrder of LATEST_NEWS_SORT_ORDERS) {
    const title = cleanText(formData.get(`latest_${sortOrder}_title`));
    const payload = {
      time_label: cleanText(formData.get(`latest_${sortOrder}_time_label`)),
      title,
      link_url: cleanText(formData.get(`latest_${sortOrder}_link_url`)),
      image_url: cleanText(formData.get(`latest_${sortOrder}_image_url`)),
      sort_order: sortOrder,
      status: title ? cleanStatus(formData.get(`latest_${sortOrder}_status`)) : "draft"
    };

    await upsertEditorialItem("site_editorial_latest_news", siteEditorialId, sortOrder, payload);
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();

  if (!getSupabaseServiceConfig()) {
    return returnUrl(request, formData, "error", "supabase-service-not-configured");
  }

  const actionType = cleanText(formData.get("action_type"));

  try {
    if (actionType === "save_home_editorial") {
      await saveHomeEditorial(formData);
    } else if (actionType === "save_home_highlights") {
      await saveHighlights(formData);
    } else if (actionType === "save_home_roundup_items") {
      await saveRoundupItems(formData);
    } else if (actionType === "save_home_latest_news") {
      await saveLatestNews(formData);
    } else if (actionType === "save_home_featured_matches") {
      await saveFeaturedMatches(formData);
    } else {
      throw new Error("invalid-action");
    }

    return returnUrl(request, formData, "created", actionType);
  } catch (error) {
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "unknown-error");
  }
}
