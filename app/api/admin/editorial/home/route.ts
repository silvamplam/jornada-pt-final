import { NextResponse } from "next/server";

import { fetchSupabaseAdminTable, writeSupabaseAdmin } from "@/lib/supabase";

type SiteEditorialIdRow = {
  id: string;
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

function redirectTo(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/editorial/home", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));

  if (actionType !== "update_site_editorial_home") {
    return redirectTo(request, { error: "invalid-action" });
  }

  try {
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

    return redirectTo(request, { saved: "1" });
  } catch (error) {
    return redirectTo(request, {
      error: classifyError(error),
      detail: sanitizeErrorText(error instanceof Error ? error.message : String(error))
    });
  }
}
