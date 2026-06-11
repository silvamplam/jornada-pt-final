import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanInteger(value: FormDataEntryValue | null): number {
  const text = cleanText(value);
  const parsed = text ? Number.parseInt(text, 10) : Number.NaN;
  return Number.isNaN(parsed) ? 1 : parsed;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

type DraftComposition = {
  id: string;
  matchday_id: string;
  status: string;
  use_roundup_items: boolean;
};

type ReferenceCompositionState = DraftComposition & {
  is_current: boolean;
  published_at: string | null;
};

type CurrentEditorial = {
  id: string;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  headline_link_url?: string | null;
  complementary_mode: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: string | null;
  side_block_status: string | null;
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_text: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
};

type CurrentHighlight = {
  id: string;
  label: string | null;
  title: string | null;
  image_url: string | null;
  sort_order: number;
  status: string | null;
};

type CurrentLatestNews = {
  id: string;
  time_label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  article_id: string | null;
  sort_order: number;
  status: string | null;
};

type CurrentRoundupItem = {
  id: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  type: string | null;
  sort_order: number;
  status: string | null;
};

type CompositionSnapshot = {
  slot_type: string;
  source_type: string;
  source_id: string | null;
  article_id: string | null;
  title_snapshot: string | null;
  subtitle_snapshot: string | null;
  image_url_snapshot: string | null;
  link_url_snapshot: string | null;
  label_snapshot: string | null;
};

async function readFirst<T>(path: string): Promise<T | null> {
  const rows = await fetchSupabaseAdminTable<T>(`${path}&limit=1`);
  return rows[0] ?? null;
}

async function hasRows(path: string) {
  const rows = await fetchSupabaseAdminTable<{ id: string }>(`${path}&limit=1`);
  return rows.length > 0;
}

async function compositionBelongsToMatchday(compositionId: string, matchdayId: string) {
  return hasRows(
    `matchday_reference_compositions?select=id&id=eq.${encodeURIComponent(compositionId)}&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&status=eq.draft`
  );
}

function hasContent(...values: Array<string | null | undefined>) {
  return values.some((value) => Boolean(value?.trim()));
}

function isPublished(status?: string | null) {
  return status === "published";
}

async function readDraftComposition(compositionId: string, matchdayId: string) {
  return readFirst<DraftComposition>(
    `matchday_reference_compositions?select=id,matchday_id,status,use_roundup_items&id=eq.${encodeURIComponent(
      compositionId
    )}&matchday_id=eq.${encodeURIComponent(matchdayId)}&status=eq.draft`
  );
}

async function readReferenceCompositionState(compositionId: string, matchdayId: string) {
  return readFirst<ReferenceCompositionState>(
    `matchday_reference_compositions?select=id,matchday_id,status,use_roundup_items,is_current,published_at&id=eq.${encodeURIComponent(
      compositionId
    )}&matchday_id=eq.${encodeURIComponent(matchdayId)}`
  );
}

async function readMaxSortOrder(compositionId: string) {
  const row = await readFirst<{ sort_order: number | null }>(
    `matchday_reference_composition_items?select=sort_order&composition_id=eq.${encodeURIComponent(
      compositionId
    )}&order=sort_order.desc`
  );
  return row?.sort_order ?? 0;
}

async function buildCurrentPageSnapshots(matchdayId: string, useRoundupItems: boolean): Promise<CompositionSnapshot[]> {
  const [editorial, highlights, latestNews, roundupItems] = await Promise.all([
    readFirst<CurrentEditorial>(
      `matchday_editorials?select=id,title,summary,image_url,headline_link_url,complementary_mode,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,side_block_status,side_block_type,side_block_label,side_block_title,side_block_text,side_block_image_url,side_block_link_url&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}`
    ),
    fetchSupabaseAdminTable<CurrentHighlight>(
      `matchday_highlights?select=id,label,title,image_url,sort_order,status&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&status=eq.published&order=sort_order.asc&limit=50`
    ).catch(() => []),
    fetchSupabaseAdminTable<CurrentLatestNews>(
      `matchday_latest_news?select=id,time_label,title,subtitle,image_url,link_url,article_id,sort_order,status&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&status=eq.published&order=sort_order.asc&limit=50`
    ).catch(() => []),
    useRoundupItems
      ? fetchSupabaseAdminTable<CurrentRoundupItem>(
          `matchday_roundup_items?select=id,label,title,subtitle,image_url,video_url,type,sort_order,status&matchday_id=eq.${encodeURIComponent(
            matchdayId
          )}&status=eq.published&order=sort_order.asc&limit=50`
        ).catch(() => [])
      : Promise.resolve([])
  ]);

  const snapshots: CompositionSnapshot[] = [];

  if (editorial && hasContent(editorial.title, editorial.summary, editorial.image_url)) {
    snapshots.push({
      slot_type: "headline",
      source_type: "matchday_editorial",
      source_id: editorial.id,
      article_id: null,
      title_snapshot: editorial.title,
      subtitle_snapshot: editorial.summary,
      image_url_snapshot: editorial.image_url,
      link_url_snapshot: editorial.headline_link_url ?? null,
      label_snapshot: "Manchete"
    });
  }

  if (
    editorial &&
    Boolean(editorial.complementary_mode) &&
    editorial.complementary_mode !== "none" &&
    isPublished(editorial.complementary_status) &&
    hasContent(editorial.complementary_title, editorial.complementary_text, editorial.complementary_image_url)
  ) {
    snapshots.push({
      slot_type: "complement",
      source_type: "matchday_editorial",
      source_id: editorial.id,
      article_id: null,
      title_snapshot: editorial.complementary_title,
      subtitle_snapshot: editorial.complementary_text,
      image_url_snapshot: editorial.complementary_image_url,
      link_url_snapshot: editorial.complementary_link_url,
      label_snapshot: editorial.complementary_label
    });
  }

  if (editorial && isPublished(editorial.side_block_status) && hasContent(editorial.side_block_title, editorial.side_block_text, editorial.side_block_image_url)) {
    snapshots.push({
      slot_type: "side_block",
      source_type: "matchday_editorial",
      source_id: editorial.id,
      article_id: null,
      title_snapshot: editorial.side_block_title,
      subtitle_snapshot: editorial.side_block_text,
      image_url_snapshot: editorial.side_block_image_url,
      link_url_snapshot: editorial.side_block_link_url,
      label_snapshot: editorial.side_block_label || editorial.side_block_type
    });
  }

  highlights.forEach((item) => {
    snapshots.push({
      slot_type: "highlight",
      source_type: "matchday_highlight",
      source_id: item.id,
      article_id: null,
      title_snapshot: item.title,
      subtitle_snapshot: null,
      image_url_snapshot: item.image_url,
      link_url_snapshot: null,
      label_snapshot: item.label
    });
  });

  latestNews.forEach((item) => {
    snapshots.push({
      slot_type: "editorial_line_item",
      source_type: "matchday_latest_news",
      source_id: item.id,
      article_id: item.article_id,
      title_snapshot: item.title,
      subtitle_snapshot: item.subtitle,
      image_url_snapshot: item.image_url,
      link_url_snapshot: item.link_url,
      label_snapshot: item.time_label
    });
  });

  roundupItems.forEach((item) => {
    snapshots.push({
      slot_type: "roundup",
      source_type: "matchday_roundup_item",
      source_id: item.id,
      article_id: null,
      title_snapshot: item.title,
      subtitle_snapshot: item.subtitle,
      image_url_snapshot: item.image_url,
      link_url_snapshot: item.video_url,
      label_snapshot: item.label || item.type
    });
  });

  return snapshots;
}

async function createDraft(matchdayId: string, internalName: string | null) {
  if (!(await hasRows(`matchdays?select=id&id=eq.${encodeURIComponent(matchdayId)}`))) throw new Error("matchday-invalid");
  if (await hasRows(`matchday_reference_compositions?select=id&matchday_id=eq.${encodeURIComponent(matchdayId)}&status=eq.draft`)) return;
  await writeSupabaseAdmin("matchday_reference_compositions", {
    method: "POST",
    body: JSON.stringify({
      matchday_id: matchdayId,
      status: "draft",
      is_current: false,
      internal_name: internalName,
      use_roundup_items: true
    })
  });
}

async function updateDraft(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const compositionId = cleanText(formData.get("composition_id"));
  if (!matchdayId || !compositionId || !(await compositionBelongsToMatchday(compositionId, matchdayId))) throw new Error("composition-invalid");
  await writeSupabaseAdmin(
    `matchday_reference_compositions?id=eq.${encodeURIComponent(compositionId)}&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&status=eq.draft`,
    {
      method: "PATCH",
      body: JSON.stringify({
        internal_name: cleanText(formData.get("internal_name")),
        use_roundup_items: cleanText(formData.get("use_roundup_items")) === "1"
      })
    }
  );
}

async function addItem(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const compositionId = cleanText(formData.get("composition_id"));
  if (!matchdayId || !compositionId || !(await compositionBelongsToMatchday(compositionId, matchdayId))) throw new Error("composition-invalid");
  await writeSupabaseAdmin("matchday_reference_composition_items", {
    method: "POST",
    body: JSON.stringify({
      composition_id: compositionId,
      slot_type: cleanText(formData.get("slot_type")),
      source_type: cleanText(formData.get("source_type")),
      source_id: cleanText(formData.get("source_id")),
      article_id: cleanText(formData.get("article_id")),
      sort_order: cleanInteger(formData.get("sort_order")),
      title_snapshot: cleanText(formData.get("title_snapshot")),
      subtitle_snapshot: cleanText(formData.get("subtitle_snapshot")),
      image_url_snapshot: cleanText(formData.get("image_url_snapshot")),
      link_url_snapshot: cleanText(formData.get("link_url_snapshot")),
      label_snapshot: cleanText(formData.get("label_snapshot")),
      status: "draft"
    })
  });
}

async function removeItem(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const compositionId = cleanText(formData.get("composition_id"));
  const itemId = cleanText(formData.get("item_id"));
  if (!matchdayId || !compositionId || !itemId || !(await compositionBelongsToMatchday(compositionId, matchdayId))) throw new Error("composition-invalid");
  await writeSupabaseAdmin(
    `matchday_reference_composition_items?id=eq.${encodeURIComponent(itemId)}&composition_id=eq.${encodeURIComponent(compositionId)}`,
    { method: "DELETE" }
  );
}

async function saveCurrentPageState(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const compositionId = cleanText(formData.get("composition_id"));
  if (!matchdayId || !compositionId) throw new Error("composition-invalid");
  const composition = await readDraftComposition(compositionId, matchdayId);
  if (!composition) throw new Error("composition-invalid");

  const snapshots = await buildCurrentPageSnapshots(matchdayId, composition.use_roundup_items);
  if (snapshots.length === 0) return;

  const maxSortOrder = await readMaxSortOrder(composition.id);
  for (const [index, snapshot] of snapshots.entries()) {
    await writeSupabaseAdmin("matchday_reference_composition_items", {
      method: "POST",
      body: JSON.stringify({
        composition_id: composition.id,
        ...snapshot,
        sort_order: maxSortOrder + index + 1,
        status: "draft"
      })
    });
  }
}

async function publishReferenceComposition(formData: FormData) {
  const matchdayId = cleanText(formData.get("matchday_id"));
  const compositionId = cleanText(formData.get("composition_id"));
  if (!matchdayId || !compositionId) throw new Error("composition-invalid");

  const composition = await readReferenceCompositionState(compositionId, matchdayId);
  if (!composition) throw new Error("composition-invalid");
  if (composition.status === "published") return;
  if (composition.status !== "draft") throw new Error("composition-invalid");

  const hasItems = await hasRows(
    `matchday_reference_composition_items?select=id&composition_id=eq.${encodeURIComponent(composition.id)}`
  );
  if (!hasItems) throw new Error("composition-empty");

  await writeSupabaseAdmin(
    `matchday_reference_compositions?matchday_id=eq.${encodeURIComponent(matchdayId)}&id=neq.${encodeURIComponent(
      composition.id
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_current: false })
    }
  );

  const now = new Date().toISOString();
  await writeSupabaseAdmin(
    `matchday_reference_compositions?id=eq.${encodeURIComponent(composition.id)}&matchday_id=eq.${encodeURIComponent(matchdayId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "published",
        is_current: true,
        published_at: now,
        updated_at: now
      })
    }
  );
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) return redirectTo(request, "/admin?error=missing-service");
  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));
  const matchdayId = cleanText(formData.get("matchday_id"));
  const returnTo = cleanText(formData.get("return_to")) ?? "/admin/gestor";

  try {
    if (!matchdayId) throw new Error("missing-matchday");
    if (actionType === "create_draft") await createDraft(matchdayId, cleanText(formData.get("internal_name")));
    else if (actionType === "update_draft") await updateDraft(formData);
    else if (actionType === "add_item") await addItem(formData);
    else if (actionType === "remove_item") await removeItem(formData);
    else if (actionType === "save_current_page_state") await saveCurrentPageState(formData);
    else if (actionType === "publish_reference_composition") await publishReferenceComposition(formData);
    else throw new Error("unknown-action");
  } catch {
    return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}composition_error=1`);
  }

  return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}composition_saved=1`);
}
