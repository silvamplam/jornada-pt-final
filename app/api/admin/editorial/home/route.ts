import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

const HIGHLIGHT_SORT_ORDERS = Array.from({ length: 6 }, (_, index) => index + 1);
const ROUNDUP_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);
const LATEST_NEWS_SORT_ORDERS = Array.from({ length: 8 }, (_, index) => index + 1);

type SiteEditorialIdRow = {
  id: string;
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

function cleanRoundupType(value: FormDataEntryValue | null): "video" | "golos" | "resumo" | "noticia" {
  const type = cleanText(value);

  return type === "video" || type === "golos" || type === "noticia" ? type : "resumo";
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
  const belowHeadlineMode = cleanBelowHeadlineMode(formData.get("below_headline_mode"));
  const complementaryMode = cleanComplementaryMode(formData.get("complementary_mode"));
  const complementaryRoundupItemId = cleanText(formData.get("complementary_roundup_item_id"));

  if (complementaryRoundupItemId) {
    const rows = await fetchSupabaseAdminTable<{ id: string }>(
      `site_editorial_roundup_items?select=id&id=eq.${encodeURIComponent(complementaryRoundupItemId)}&site_editorial_id=eq.${encodeURIComponent(id)}&limit=1`
    );

    if (!rows[0]) {
      throw new Error("roundup-item-invalid");
    }
  }

  await writeSupabaseAdmin(`site_editorials?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: cleanStatus(formData.get("status")),
      headline_title: cleanText(formData.get("headline_title")),
      headline_subtitle: cleanText(formData.get("headline_subtitle")),
      headline_image_url: cleanText(formData.get("headline_image_url")),
      headline_title_color: cleanText(formData.get("headline_title_color")),
      below_headline_mode: belowHeadlineMode,
      below_headline_heading: cleanText(formData.get("below_headline_heading")),
      below_headline_heading_color: cleanText(formData.get("below_headline_heading_color")),
      side_block_status: cleanStatus(formData.get("side_block_status")),
      side_block_type: cleanText(formData.get("side_block_type")),
      side_block_label: cleanText(formData.get("side_block_label")),
      side_block_title: cleanText(formData.get("side_block_title")),
      side_block_title_color: cleanText(formData.get("side_block_title_color")),
      side_block_author: cleanText(formData.get("side_block_author")),
      side_block_text: cleanText(formData.get("side_block_text")),
      side_block_image_url: cleanText(formData.get("side_block_image_url")),
      side_block_link_url: cleanText(formData.get("side_block_link_url")),
      complementary_status: cleanStatus(formData.get("complementary_status")),
      complementary_mode: complementaryMode,
      complementary_roundup_item_id: complementaryRoundupItemId,
      complementary_label: cleanText(formData.get("complementary_label")),
      complementary_title: cleanText(formData.get("complementary_title")),
      complementary_text: cleanText(formData.get("complementary_text")),
      complementary_image_url: cleanText(formData.get("complementary_image_url")),
      complementary_link_url: cleanText(formData.get("complementary_link_url")),
      roundup_video_heading: cleanText(formData.get("roundup_video_heading")),
      roundup_video_heading_color: cleanText(formData.get("roundup_video_heading_color"))
    })
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
      image_url: cleanText(formData.get(`roundup_${sortOrder}_image_url`)),
      video_url: cleanText(formData.get(`roundup_${sortOrder}_video_url`)),
      duration: cleanText(formData.get(`roundup_${sortOrder}_duration`)),
      type: cleanRoundupType(formData.get(`roundup_${sortOrder}_type`)),
      sort_order: sortOrder,
      status: title ? cleanStatus(formData.get(`roundup_${sortOrder}_status`)) : "draft"
    };

    await upsertEditorialItem("site_editorial_roundup_items", siteEditorialId, sortOrder, payload);
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
    } else {
      throw new Error("invalid-action");
    }

    return returnUrl(request, formData, "created", actionType);
  } catch (error) {
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "unknown-error");
  }
}
