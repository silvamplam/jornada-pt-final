import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { fetchSupabaseAdminTable, writeSupabaseAdmin } from "@/lib/supabase";

type SiteEditorialIdRow = {
  id: string;
};

type MatchIdRow = {
  id: string;
};

type SiteFeaturedMatchRow = {
  id: string;
  match_id: string | null;
  sort_order: number | null;
};

class HomeEditorialAdminError extends Error {
  constructor(public code: string, message = code) {
    super(message);
  }
}

const allowedTextFields = [
  "headline_title",
  "headline_subtitle",
  "headline_image_url",
  "headline_link_url",
  "side_block_type",
  "side_block_label",
  "side_block_title",
  "side_block_text",
  "side_block_author",
  "side_block_image_url",
  "side_block_link_url",
  "complementary_mode",
  "complementary_label",
  "complementary_title",
  "complementary_text",
  "complementary_image_url",
  "complementary_link_url",
  "complementary_roundup_item_id",
  "below_headline_mode",
  "below_headline_heading",
  "roundup_video_heading"
] as const;

const allowedColorFields = [
  "headline_title_color",
  "side_block_title_color",
  "below_headline_heading_color",
  "roundup_video_heading_color"
] as const;

const allowedStatusFields = ["status", "side_block_status", "complementary_status"] as const;

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
}

function cleanMatchId(value: FormDataEntryValue | null) {
  const cleanValue = cleanText(value);
  if (!cleanValue) {
    return null;
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanValue)) {
    throw new HomeEditorialAdminError("invalid-featured-match");
  }

  return cleanValue;
}

function cleanInteger(value: FormDataEntryValue | null) {
  const cleanValue = cleanText(value);
  if (!cleanValue) {
    return null;
  }

  const parsed = Number.parseInt(cleanValue, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function uniqueCleanMatchIds(values: FormDataEntryValue[]) {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const id = cleanMatchId(value);
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

function cleanStatus(value: string | null) {
  if (!value) {
    return "draft";
  }

  if (value === "published" || value === "draft") {
    return value;
  }

  throw new HomeEditorialAdminError("invalid-status");
}

function cleanColor(value: string | null) {
  if (!value) {
    return null;
  }

  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)) {
    return value;
  }

  throw new HomeEditorialAdminError("invalid-color");
}

const contextAnchors = {
  games: "home-games",
  headline: "home-headline",
  side: "home-side-block",
  composition: "home-composition",
  complement: "home-complement"
} as const;

type SaveContext = keyof typeof contextAnchors;

function cleanSaveContext(value: string | null): SaveContext | null {
  if (!value) {
    return null;
  }

  return Object.prototype.hasOwnProperty.call(contextAnchors, value) ? (value as SaveContext) : null;
}

function gameFilterParams(formData: FormData) {
  const params: Record<string, string> = {};

  for (const key of ["home_competition_id", "home_season_id", "home_matchday_id"]) {
    const value = cleanText(formData.get(key));
    if (value) {
      params[key] = value;
    }
  }

  return params;
}

function redirectTo(request: Request, params: Record<string, string>, anchor?: string | null) {
  const url = new URL("/admin/editorial/home", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (anchor) {
    url.hash = anchor;
  }

  return NextResponse.redirect(url, { status: 303 });
}

function sanitizeErrorText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/apikey[=:]\s*[A-Za-z0-9._-]+/gi, "apikey=[redacted]")
    .trim()
    .slice(0, 220);
}

function classifyError(error: unknown) {
  if (error instanceof HomeEditorialAdminError) {
    return error.code;
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/permission|row-level|rls/i.test(message)) {
    return "permission";
  }
  if (/not-null|null value|required/i.test(message)) {
    return "required-field";
  }
  if (/constraint|check/i.test(message)) {
    return "constraint";
  }

  return "save-failed";
}

async function ensureHomeEditorialExists(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<SiteEditorialIdRow>(
    `site_editorials?select=id&id=eq.${encodeURIComponent(siteEditorialId)}&slug=eq.home&limit=1`
  );

  if (!rows[0]) {
    throw new HomeEditorialAdminError("missing-home-editorial");
  }
}

function buildPayload(formData: FormData) {
  const payload: Record<string, string | null> = {};

  for (const field of allowedTextFields) {
    payload[field] = cleanText(formData.get(field));
  }

  for (const field of allowedColorFields) {
    payload[field] = cleanColor(cleanText(formData.get(field)));
  }

  for (const field of allowedStatusFields) {
    payload[field] = cleanStatus(cleanText(formData.get(field)));
  }

  return payload;
}

function chunkList<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function readExistingMatchIds(matchIds: string[]) {
  const existing = new Set<string>();

  for (const chunk of chunkList(matchIds, 80)) {
    if (chunk.length === 0) {
      continue;
    }

    const rows = await fetchSupabaseAdminTable<MatchIdRow>(
      `matches?select=id&id=in.(${chunk.map((id) => encodeURIComponent(id)).join(",")})`
    );

    for (const row of rows) {
      existing.add(row.id);
    }
  }

  return existing;
}

function orderedSelectedMatches(formData: FormData, selectedIds: string[]) {
  return selectedIds
    .map((matchId, index) => ({
      matchId,
      index,
      requestedOrder: cleanInteger(formData.get(`featured_order_${matchId}`)) ?? index + 1
    }))
    .sort((a, b) => a.requestedOrder - b.requestedOrder || a.index - b.index)
    .map((item, index) => ({
      match_id: item.matchId,
      sort_order: index + 1
    }));
}

async function updateFeaturedMatches(request: Request, formData: FormData) {
  const availableIds = uniqueCleanMatchIds(formData.getAll("available_match_id"));
  const selectedIds = uniqueCleanMatchIds(formData.getAll("featured_match_id"));

  if (availableIds.length === 0) {
    throw new HomeEditorialAdminError("missing-selection-set");
  }

  if (selectedIds.length === 0) {
    throw new HomeEditorialAdminError("empty-featured-selection");
  }

  const availableSet = new Set(availableIds);
  if (selectedIds.some((matchId) => !availableSet.has(matchId))) {
    throw new HomeEditorialAdminError("invalid-featured-match");
  }

  const existingMatchIds = await readExistingMatchIds(availableIds);
  if (availableIds.some((matchId) => !existingMatchIds.has(matchId))) {
    throw new HomeEditorialAdminError("invalid-featured-match");
  }

  const currentRows = await fetchSupabaseAdminTable<SiteFeaturedMatchRow>(
    "site_featured_matches?select=id,match_id,sort_order&limit=1000"
  );
  const currentByMatchId = new Map(
    currentRows.filter((row): row is SiteFeaturedMatchRow & { match_id: string } => Boolean(row.match_id)).map((row) => [row.match_id, row])
  );
  const selectedSet = new Set(selectedIds);
  const rowsToRemove = currentRows
    .filter((row): row is SiteFeaturedMatchRow & { match_id: string } => Boolean(row.match_id))
    .filter((row) => availableSet.has(row.match_id) && !selectedSet.has(row.match_id));

  for (const chunk of chunkList(rowsToRemove, 80)) {
    await writeSupabaseAdmin(
      `site_featured_matches?match_id=in.(${chunk.map((row) => encodeURIComponent(row.match_id)).join(",")})`,
      { method: "DELETE" }
    );
  }

  const ordered = orderedSelectedMatches(formData, selectedIds);
  const now = new Date().toISOString();
  const rowsToInsert: Array<{ id: string; match_id: string; sort_order: number; created_at: string; updated_at: string }> = [];

  for (const item of ordered) {
    const current = currentByMatchId.get(item.match_id);

    if (current) {
      await writeSupabaseAdmin(`site_featured_matches?id=eq.${encodeURIComponent(current.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          sort_order: item.sort_order,
          updated_at: now
        })
      });
    } else {
      rowsToInsert.push({
        id: randomUUID(),
        match_id: item.match_id,
        sort_order: item.sort_order,
        created_at: now,
        updated_at: now
      });
    }
  }

  if (rowsToInsert.length > 0) {
    await writeSupabaseAdmin("site_featured_matches", {
      method: "POST",
      body: JSON.stringify(rowsToInsert)
    });
  }

  return redirectTo(request, { saved: "games", ...gameFilterParams(formData) }, contextAnchors.games);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));
  const saveContext = actionType === "update_featured_matches"
    ? "games"
    : cleanSaveContext(cleanText(formData.get("save_context"))) ?? "headline";

  if (actionType !== "update_site_editorial_home" && actionType !== "update_featured_matches") {
    return redirectTo(request, { error: "invalid-action", failed: saveContext }, contextAnchors[saveContext]);
  }

  try {
    if (actionType === "update_featured_matches") {
      return await updateFeaturedMatches(request, formData);
    }

    const siteEditorialId = cleanText(formData.get("site_editorial_id"));
    if (!siteEditorialId) {
      throw new HomeEditorialAdminError("missing-home-editorial");
    }

    await ensureHomeEditorialExists(siteEditorialId);

    await writeSupabaseAdmin(
      `site_editorials?id=eq.${encodeURIComponent(siteEditorialId)}&slug=eq.home`,
      {
        method: "PATCH",
        body: JSON.stringify(buildPayload(formData))
      }
    );

    return redirectTo(request, { saved: saveContext }, contextAnchors[saveContext]);
  } catch (error) {
    return redirectTo(request, {
      error: classifyError(error),
      failed: saveContext,
      detail: sanitizeErrorText(error instanceof Error ? error.message : String(error)),
      ...(saveContext === "games" ? gameFilterParams(formData) : {})
    }, contextAnchors[saveContext]);
  }
}
