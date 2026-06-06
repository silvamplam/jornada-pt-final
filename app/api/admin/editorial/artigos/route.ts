import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

type EditorialArticleIdRow = {
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

function cleanScope(value: FormDataEntryValue | null): "home" | "matchday" | "competition" | "general" {
  const scope = cleanText(value);

  return scope === "home" || scope === "matchday" || scope === "competition" ? scope : "general";
}

function cleanPublishedAt(value: FormDataEntryValue | null): string | null {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function returnUrl(request: Request, formData: FormData, key: "created" | "error", value: string) {
  const rawReturnTo = cleanText(formData.get("return_to"));
  const safeReturnTo = rawReturnTo?.startsWith("/admin/editorial/artigos") ? rawReturnTo : "/admin/editorial/artigos";
  const url = new URL(safeReturnTo, request.url);

  url.searchParams.delete("created");
  url.searchParams.delete("error");
  url.searchParams.set(key, value);

  return NextResponse.redirect(url, { status: 303 });
}

async function assertArticleExists(articleId: string) {
  const rows = await fetchSupabaseAdminTable<EditorialArticleIdRow>(
    `editorial_articles?select=id&id=eq.${encodeURIComponent(articleId)}&limit=1`
  );

  if (!rows[0]) {
    throw new Error("article-not-found");
  }
}

async function saveArticle(formData: FormData) {
  const articleId = cleanText(formData.get("article_id"));
  const slug = cleanText(formData.get("slug"));

  if (!slug) {
    throw new Error("slug-required");
  }

  const payload = {
    slug,
    status: cleanStatus(formData.get("status")),
    scope: cleanScope(formData.get("scope")),
    matchday_id: cleanText(formData.get("matchday_id")),
    competition_id: cleanText(formData.get("competition_id")),
    title: cleanText(formData.get("title")),
    subtitle: cleanText(formData.get("subtitle")),
    label: cleanText(formData.get("label")),
    author: cleanText(formData.get("author")),
    image_url: cleanText(formData.get("image_url")),
    body: cleanText(formData.get("body")),
    published_at: cleanPublishedAt(formData.get("published_at")),
    updated_at: new Date().toISOString()
  };

  if (articleId) {
    await assertArticleExists(articleId);
    await writeSupabaseAdmin(`editorial_articles?id=eq.${encodeURIComponent(articleId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return;
  }

  await writeSupabaseAdmin("editorial_articles", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();

  if (!getSupabaseServiceConfig()) {
    return returnUrl(request, formData, "error", "supabase-service-not-configured");
  }

  const actionType = cleanText(formData.get("action_type"));

  try {
    if (actionType === "save_article") {
      await saveArticle(formData);
    } else {
      throw new Error("invalid-action");
    }

    return returnUrl(request, formData, "created", actionType);
  } catch (error) {
    return returnUrl(request, formData, "error", error instanceof Error ? error.message : "unknown-error");
  }
}
