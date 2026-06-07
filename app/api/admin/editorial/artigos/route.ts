import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

type EditorialArticleIdRow = {
  id: string;
};

type SeasonContextRow = {
  id: string;
  competition_id: string | null;
  label?: string | null;
};

type MatchdayContextRow = {
  id: string;
  season_id: string | null;
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

async function readSeasonContext(seasonId: string) {
  const rows = await fetchSupabaseAdminTable<SeasonContextRow>(
    `seasons?select=id,competition_id&id=eq.${encodeURIComponent(seasonId)}&limit=1`
  );
  const season = rows[0];

  if (!season) {
    throw new Error("season-invalid");
  }

  return season;
}

async function readSeasonContextByLabel(seasonLabel: string, competitionId: string | null) {
  const competitionFilter = competitionId ? `&competition_id=eq.${encodeURIComponent(competitionId)}` : "";
  const rows = await fetchSupabaseAdminTable<SeasonContextRow>(
    `seasons?select=id,competition_id,label&label=eq.${encodeURIComponent(seasonLabel)}${competitionFilter}&order=id.asc&limit=1`
  );
  const season = rows[0];

  if (!season) {
    throw new Error("season-invalid");
  }

  return season;
}

async function readMatchdayArticleContext(matchdayId: string) {
  const rows = await fetchSupabaseAdminTable<MatchdayContextRow>(
    `matchdays?select=id,season_id&id=eq.${encodeURIComponent(matchdayId)}&limit=1`
  );
  const matchday = rows[0];

  if (!matchday?.season_id) {
    throw new Error("matchday-invalid");
  }

  const season = await readSeasonContext(matchday.season_id);

  return {
    matchday_id: matchday.id,
    season_id: season.id,
    competition_id: season.competition_id
  };
}

async function saveArticle(formData: FormData) {
  const articleId = cleanText(formData.get("article_id"));
  const slug = cleanText(formData.get("slug"));
  const matchdayId = cleanText(formData.get("matchday_id"));
  const seasonLabel = cleanText(formData.get("season_label"));
  let seasonId = cleanText(formData.get("season_id"));
  let competitionId = cleanText(formData.get("competition_id"));

  if (!slug) {
    throw new Error("slug-required");
  }

  if (matchdayId) {
    const matchdayContext = await readMatchdayArticleContext(matchdayId);
    seasonId = matchdayContext.season_id;
    competitionId = matchdayContext.competition_id;
  } else if (seasonLabel && (!seasonId || competitionId)) {
    const seasonContext = await readSeasonContextByLabel(seasonLabel, competitionId);
    seasonId = seasonContext.id;
  }

  if (!seasonId) {
    throw new Error("season-required");
  }

  let season = await readSeasonContext(seasonId);

  if (competitionId && season.competition_id !== competitionId) {
    if (!seasonLabel) {
      throw new Error("article-season-competition-mismatch");
    }

    season = await readSeasonContextByLabel(seasonLabel, competitionId);
    seasonId = season.id;
  }

  const payload = {
    slug,
    status: cleanStatus(formData.get("status")),
    scope: cleanScope(formData.get("scope")),
    season_id: seasonId,
    matchday_id: matchdayId,
    competition_id: competitionId,
    title: cleanText(formData.get("title")),
    subtitle: cleanText(formData.get("subtitle")),
    label: cleanText(formData.get("label")),
    author: cleanText(formData.get("author")),
    image_url: cleanText(formData.get("image_url")),
    image_caption: cleanText(formData.get("image_caption")),
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
