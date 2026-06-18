import { fetchSupabaseAdminTable } from "@/lib/supabase";

export type EditorialPublishedSource = {
  source_type: "article" | "editorial_content";
  source_id: string;
  source_slug: string;
  content_type: string;
  media_kind: "image" | "video" | "mixed";
  label: string | null;
  author: string | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  embed_url: string | null;
  duration: string | null;
  link_url: string;
  published_at: string | null;
  origin_label: string;
};

type EditorialArticleRow = {
  id: string;
  slug: string | null;
  title: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  label?: string | null;
  author?: string | null;
  status: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

type EditorialContentRow = {
  id: string;
  slug: string | null;
  status: string | null;
  content_type: string | null;
  label: string | null;
  author: string | null;
  title: string | null;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  embed_url: string | null;
  duration: string | null;
  published_at: string | null;
  created_at: string | null;
};

function cleanText(value: string | null | undefined) {
  const cleanValue = value?.trim();
  return cleanValue || null;
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleanValue = cleanText(value);
    if (cleanValue) {
      return cleanValue;
    }
  }

  return null;
}

function publicContentHref(kind: "article" | "editorial_content", slug: string) {
  return kind === "article" ? `/noticias/${encodeURIComponent(slug)}` : `/conteudos/${encodeURIComponent(slug)}`;
}

function contentMediaKind(content: EditorialContentRow): EditorialPublishedSource["media_kind"] {
  const hasVideo = Boolean(firstText(content.video_url, content.embed_url));
  const hasImage = Boolean(firstText(content.thumbnail_url, content.image_url));
  const hasText = Boolean(firstText(content.subtitle, content.summary, content.body));

  if (hasVideo && hasText) {
    return "mixed";
  }

  if (hasVideo) {
    return "video";
  }

  return hasImage ? "image" : "image";
}

function normalizeArticle(article: EditorialArticleRow): EditorialPublishedSource | null {
  const slug = cleanText(article.slug);
  const title = cleanText(article.title);

  if (!slug || !title) {
    return null;
  }

  return {
    source_type: "article",
    source_id: article.id,
    source_slug: slug,
    content_type: "article",
    media_kind: "image",
    label: cleanText(article.label),
    author: cleanText(article.author),
    title,
    subtitle: cleanText(article.subtitle),
    summary: null,
    image_url: cleanText(article.image_url),
    thumbnail_url: null,
    video_url: null,
    embed_url: null,
    duration: null,
    link_url: publicContentHref("article", slug),
    published_at: cleanText(article.published_at) ?? cleanText(article.created_at),
    origin_label: "Artigo / Noticia",
  };
}

function normalizeContent(content: EditorialContentRow): EditorialPublishedSource | null {
  const slug = cleanText(content.slug);
  const title = cleanText(content.title);

  if (!slug || !title) {
    return null;
  }

  return {
    source_type: "editorial_content",
    source_id: content.id,
    source_slug: slug,
    content_type: cleanText(content.content_type) ?? "conteudo",
    media_kind: contentMediaKind(content),
    label: cleanText(content.label),
    author: cleanText(content.author),
    title,
    subtitle: cleanText(content.subtitle),
    summary: cleanText(content.summary),
    image_url: cleanText(content.image_url),
    thumbnail_url: cleanText(content.thumbnail_url),
    video_url: cleanText(content.video_url),
    embed_url: cleanText(content.embed_url),
    duration: cleanText(content.duration),
    link_url: publicContentHref("editorial_content", slug),
    published_at: cleanText(content.published_at) ?? cleanText(content.created_at),
    origin_label: "Conteudo editorial",
  };
}

function publishedTime(value: EditorialPublishedSource) {
  const date = value.published_at ? new Date(value.published_at) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

export async function getEditorialPublishedSources(): Promise<EditorialPublishedSource[]> {
  const [articleRows, contentRows] = await Promise.all([
    fetchSupabaseAdminTable<EditorialArticleRow>(
      "editorial_articles?select=id,slug,title,subtitle,label,author,image_url,status,published_at,created_at&status=eq.published&order=published_at.desc.nullslast,created_at.desc.nullslast",
    ).catch(() => []),
    fetchSupabaseAdminTable<EditorialContentRow>(
      "editorial_contents?select=id,slug,status,content_type,label,author,title,subtitle,summary,body,image_url,thumbnail_url,video_url,embed_url,duration,published_at,created_at&status=eq.published&order=published_at.desc.nullslast,created_at.desc.nullslast",
    ).catch(() => []),
  ]);

  return [
    ...articleRows.map(normalizeArticle),
    ...contentRows.map(normalizeContent),
  ]
    .filter((source): source is EditorialPublishedSource => Boolean(source))
    .sort((left, right) => publishedTime(right) - publishedTime(left));
}
