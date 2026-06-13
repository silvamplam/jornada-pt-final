import { NextResponse } from "next/server";

import {
  fetchSupabaseAdminTable,
  getSupabaseServiceConfig,
  writeSupabaseAdmin,
  writeSupabaseAdminReturning,
} from "@/lib/supabase";

type ArticleIdRow = {
  id: string;
};

type CreatedArticleRow = {
  id: string;
  slug: string | null;
};

type CompetitionContextRow = {
  id: string;
};

type SeasonContextRow = {
  id: string;
  competition_id: string | null;
};

type MatchdayContextRow = {
  id: string;
  season_id: string | null;
};

type ArticlePayload = {
  title: string;
  slug: string;
  status: "draft" | "published";
  scope: string | null;
  label: string | null;
  author: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  image_caption: string | null;
  published_at: string | null;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
};

class ArticleAdminError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

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

function cleanStatus(value: string | null): "draft" | "published" {
  return value === "published" ? "published" : "draft";
}

function normalizePublishedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ArticleAdminError("invalid-published-at");
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

async function assertSlugAvailable(slug: string, currentArticleId: string | null) {
  const rows = await fetchSupabaseAdminTable<ArticleIdRow>(
    `editorial_articles?select=id&slug=eq.${encodeURIComponent(slug)}&limit=2`,
  );

  const collision = rows.find((row) => row.id !== currentArticleId);
  if (collision) {
    throw new ArticleAdminError("duplicate-slug");
  }
}

async function assertArticleExists(articleId: string) {
  const rows = await fetchSupabaseAdminTable<ArticleIdRow>(
    `editorial_articles?select=id&id=eq.${encodeURIComponent(articleId)}&limit=1`,
  );

  if (!rows[0]) {
    throw new ArticleAdminError("missing-article");
  }
}

async function readCompetition(competitionId: string) {
  const rows = await fetchSupabaseAdminTable<CompetitionContextRow>(
    `competitions?select=id&id=eq.${encodeURIComponent(competitionId)}&limit=1`,
  );

  return rows[0] ?? null;
}

async function readSeason(seasonId: string) {
  const rows = await fetchSupabaseAdminTable<SeasonContextRow>(
    `seasons?select=id,competition_id&id=eq.${encodeURIComponent(seasonId)}&limit=1`,
  );

  return rows[0] ?? null;
}

async function readMatchday(matchdayId: string) {
  const rows = await fetchSupabaseAdminTable<MatchdayContextRow>(
    `matchdays?select=id,season_id&id=eq.${encodeURIComponent(matchdayId)}&limit=1`,
  );

  return rows[0] ?? null;
}

async function normalizeContextIds(formData: FormData) {
  let competitionId = cleanText(formData.get("competition_id"));
  let seasonId = cleanText(formData.get("season_id"));
  const matchdayId = cleanText(formData.get("matchday_id"));

  if (competitionId && !(await readCompetition(competitionId))) {
    throw new ArticleAdminError("invalid-context");
  }

  if (matchdayId) {
    const matchday = await readMatchday(matchdayId);
    if (!matchday?.season_id) {
      throw new ArticleAdminError("invalid-context");
    }

    if (seasonId && matchday.season_id !== seasonId) {
      throw new ArticleAdminError("invalid-context");
    }

    seasonId = seasonId ?? matchday.season_id;
  }

  if (seasonId) {
    const season = await readSeason(seasonId);
    if (!season?.competition_id) {
      throw new ArticleAdminError("invalid-context");
    }

    if (competitionId && season.competition_id !== competitionId) {
      throw new ArticleAdminError("invalid-context");
    }

    competitionId = competitionId ?? season.competition_id;
  }

  return {
    competition_id: competitionId,
    season_id: seasonId,
    matchday_id: matchdayId,
  };
}

async function buildPayload(formData: FormData, currentArticleId: string | null): Promise<ArticlePayload> {
  const title = cleanText(formData.get("title"));
  if (!title) {
    throw new ArticleAdminError("missing-title");
  }

  const slug = normalizeSlug(cleanText(formData.get("slug")) ?? title);
  if (!slug) {
    throw new ArticleAdminError("missing-slug");
  }

  await assertSlugAvailable(slug, currentArticleId);

  const status = cleanStatus(cleanText(formData.get("status")));
  let publishedAt = normalizePublishedAt(cleanText(formData.get("published_at")));

  if (status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const context = await normalizeContextIds(formData);

  return {
    title,
    slug,
    status,
    scope: cleanText(formData.get("scope")),
    label: cleanText(formData.get("label")),
    author: cleanText(formData.get("author")),
    subtitle: cleanText(formData.get("subtitle")),
    body: cleanText(formData.get("body")),
    image_url: cleanText(formData.get("image_url")),
    image_caption: cleanText(formData.get("image_caption")),
    published_at: publishedAt,
    competition_id: context.competition_id,
    season_id: context.season_id,
    matchday_id: context.matchday_id,
  };
}

async function createArticle(request: Request, formData: FormData) {
  const payload = await buildPayload(formData, null);
  const rows = await writeSupabaseAdminReturning<CreatedArticleRow>("editorial_articles?select=id,slug", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const created = rows[0];
  if (!created?.id) {
    throw new ArticleAdminError("save-failed");
  }

  return redirectTo(request, `/admin/editorial/artigos/${encodeURIComponent(created.id)}/editar`, { created: "1" });
}

async function updateArticle(request: Request, formData: FormData) {
  const articleId = cleanText(formData.get("article_id"));
  if (!articleId) {
    throw new ArticleAdminError("missing-article");
  }

  await assertArticleExists(articleId);

  const payload = await buildPayload(formData, articleId);
  await writeSupabaseAdmin(`editorial_articles?id=eq.${encodeURIComponent(articleId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...payload,
      updated_at: new Date().toISOString(),
    }),
  });

  return redirectTo(request, `/admin/editorial/artigos/${encodeURIComponent(articleId)}/editar`, { saved: "1" });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));

  try {
    try {
      getSupabaseServiceConfig();
    } catch {
      throw new ArticleAdminError("missing-service");
    }

    if (actionType === "create_article") {
      return await createArticle(request, formData);
    }

    if (actionType === "update_article") {
      return await updateArticle(request, formData);
    }

    return redirectTo(request, "/admin/editorial/artigos", { error: "invalid-action" });
  } catch (error) {
    const code = error instanceof ArticleAdminError ? error.code : "save-failed";
    const articleId = cleanText(formData.get("article_id"));
    const fallbackPath =
      actionType === "update_article" && articleId
        ? `/admin/editorial/artigos/${encodeURIComponent(articleId)}/editar`
        : "/admin/editorial/artigos/novo";

    return redirectTo(request, fallbackPath, { error: code });
  }
}
