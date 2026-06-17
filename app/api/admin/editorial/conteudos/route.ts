import { NextResponse } from "next/server";

import { fetchSupabaseAdminTable, writeSupabaseAdmin, writeSupabaseAdminReturning } from "@/lib/supabase";

type EditorialContentIdRow = {
  id: string;
  slug: string | null;
};

type EditorialContentPayload = {
  slug: string;
  status: "draft" | "published" | "archived";
  scope: "home" | "matchday" | "competition" | "general";
  content_type: "video" | "reportagem" | "entrevista" | "especial";
  label: string | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  author: string | null;
  image_url: string | null;
  image_caption: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  embed_url: string | null;
  duration: string | null;
  is_embeddable: boolean;
  published_at: string | null;
};

class EditorialContentAdminError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const allowedStatuses = new Set(["draft", "published", "archived"]);
const allowedScopes = new Set(["home", "matchday", "competition", "general"]);
const allowedContentTypes = new Set(["video", "reportagem", "entrevista", "especial"]);

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanStatus(value: string | null): EditorialContentPayload["status"] {
  if (!value || !allowedStatuses.has(value)) {
    throw new EditorialContentAdminError("invalid-status");
  }

  return value as EditorialContentPayload["status"];
}

function cleanScope(value: string | null): EditorialContentPayload["scope"] {
  if (!value || !allowedScopes.has(value)) {
    throw new EditorialContentAdminError("invalid-scope");
  }

  return value as EditorialContentPayload["scope"];
}

function cleanContentType(value: string | null): EditorialContentPayload["content_type"] {
  if (!value || !allowedContentTypes.has(value)) {
    throw new EditorialContentAdminError("invalid-content-type");
  }

  return value as EditorialContentPayload["content_type"];
}

function normalizePublishedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new EditorialContentAdminError("invalid-published-at");
  }

  return date.toISOString();
}

function redirectTo(request: Request, path: string, params: Record<string, string>) {
  const url = new URL(path, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, { status: 303 });
}

async function readSlugRows(slug: string) {
  return fetchSupabaseAdminTable<EditorialContentIdRow>(
    `editorial_contents?select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  ).catch(() => []);
}

async function uniqueSlug(baseSlug: string, currentContentId: string | null) {
  let candidate = baseSlug;

  for (let suffix = 1; suffix <= 50; suffix += 1) {
    const rows = await readSlugRows(candidate);
    const existing = rows[0] ?? null;

    if (!existing || existing.id === currentContentId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function assertContentExists(contentId: string) {
  const rows = await fetchSupabaseAdminTable<EditorialContentIdRow>(
    `editorial_contents?select=id,slug&id=eq.${encodeURIComponent(contentId)}&limit=1`,
  );

  if (!rows[0]?.id) {
    throw new EditorialContentAdminError("missing-content");
  }
}

async function buildPayload(formData: FormData, currentContentId: string | null): Promise<EditorialContentPayload> {
  const title = cleanText(formData.get("title"));
  if (!title) {
    throw new EditorialContentAdminError("missing-title");
  }

  const baseSlug = normalizeSlug(cleanText(formData.get("slug")) ?? title);
  if (!baseSlug) {
    throw new EditorialContentAdminError("missing-slug");
  }

  const status = cleanStatus(cleanText(formData.get("status")) ?? "draft");
  const scope = cleanScope(cleanText(formData.get("scope")) ?? "general");
  const contentType = cleanContentType(cleanText(formData.get("content_type")) ?? "video");
  let publishedAt = normalizePublishedAt(cleanText(formData.get("published_at")));

  if (status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  return {
    slug: await uniqueSlug(baseSlug, currentContentId),
    status,
    scope,
    content_type: contentType,
    label: cleanText(formData.get("label")),
    title,
    subtitle: cleanText(formData.get("subtitle")),
    summary: cleanText(formData.get("summary")),
    body: cleanText(formData.get("body")),
    author: cleanText(formData.get("author")),
    image_url: cleanText(formData.get("image_url")),
    image_caption: cleanText(formData.get("image_caption")),
    thumbnail_url: cleanText(formData.get("thumbnail_url")),
    video_url: cleanText(formData.get("video_url")),
    video_provider: cleanText(formData.get("video_provider")),
    embed_url: cleanText(formData.get("embed_url")),
    duration: cleanText(formData.get("duration")),
    is_embeddable: cleanText(formData.get("is_embeddable")) === "true",
    published_at: publishedAt,
  };
}

function errorCode(error: unknown) {
  return error instanceof EditorialContentAdminError ? error.code : "save-failed";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const actionType = cleanText(formData.get("action_type"));

    if (actionType !== "create_content") {
      if (actionType === "update_content") {
        const contentId = cleanText(formData.get("content_id"));
        const path = contentId
          ? `/admin/editorial/conteudos/${encodeURIComponent(contentId)}/editar`
          : "/admin/editorial/conteudos";

        return redirectTo(request, path, { error: "invalid-action" });
      }

      return redirectTo(request, "/admin/editorial/conteudos/novo", { error: "invalid-action" });
    }

    const payload = await buildPayload(formData, null);
    const rows = await writeSupabaseAdminReturning<EditorialContentIdRow>("editorial_contents?select=id,slug", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const created = rows[0] ?? null;
    if (!created?.id) {
      throw new EditorialContentAdminError("save-failed");
    }

    return redirectTo(request, "/admin/editorial/conteudos", { created: "1", contentId: created.id });
  } catch (error) {
    return redirectTo(request, "/admin/editorial/conteudos/novo", { error: errorCode(error) });
  }
}

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();
    const contentId = cleanText(formData.get("content_id"));
    if (!contentId) {
      throw new EditorialContentAdminError("missing-content");
    }

    await assertContentExists(contentId);
    const payload = await buildPayload(formData, contentId);

    await writeSupabaseAdmin(`editorial_contents?id=eq.${encodeURIComponent(contentId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      ok: true,
      redirect: `/admin/editorial/conteudos?contentId=${encodeURIComponent(contentId)}&updated=1`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorCode(error) }, { status: 400 });
  }
}
