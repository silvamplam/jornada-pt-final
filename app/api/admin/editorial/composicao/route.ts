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
    else throw new Error("unknown-action");
  } catch {
    return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}composition_error=1`);
  }

  return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}composition_saved=1`);
}
