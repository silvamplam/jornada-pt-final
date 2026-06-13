import { notFound } from "next/navigation";

import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type EditorialArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  body?: string | null;
  image_url?: string | null;
  image_caption?: string | null;
  label?: string | null;
  category?: string | null;
  type?: string | null;
  author?: string | null;
  author_name?: string | null;
  status: string;
  source_url?: string | null;
  competition_id?: string | null;
  season_id?: string | null;
  matchday_id?: string | null;
  match_id?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const articlePageStyles = `
  body {
    margin: 0;
    background: #f3f5f8;
  }

  .news-article-shell {
    min-height: 100vh;
    color: #111820;
    padding: 0 24px 36px;
    font-family: Inter, Arial, Helvetica, sans-serif;
  }

  .news-article-topbar {
    border-bottom: 1px solid #e5e9ef;
    background: #ffffff;
  }

  .news-article-topbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(1240px, calc(100% - 36px));
    margin: 0 auto;
    padding: 16px 0;
  }

  .news-article-brand {
    color: #e5252a;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0;
    text-decoration: none;
  }

  .news-article-back {
    color: #4c5967;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-top-stack {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -24px;
    padding: 0 24px;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid #d9dee6;
    box-shadow: 0 10px 28px rgba(16, 24, 32, 0.08);
    backdrop-filter: blur(10px);
  }

  .public-site-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    max-width: 1180px;
    min-height: 70px;
    margin: 0 auto;
  }

  .public-site-brand {
    padding: 9px 12px;
    border-radius: 4px;
    background: #111820;
    color: #ffffff;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 0;
    text-decoration: none;
  }

  .public-site-brand span {
    color: #e5252a;
  }

  .public-site-menu {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: auto;
  }

  .public-site-menu a,
  .public-site-actions a,
  .public-site-search {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    padding: 0 11px;
    border-radius: 4px;
    color: #24313f;
    font-size: 13px;
    font-weight: 850;
    letter-spacing: 0;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-site-menu a:hover,
  .public-site-actions a:hover {
    background: #eef2f6;
    color: #e5252a;
  }

  .public-site-menu a[aria-current="page"] {
    color: #e5252a;
  }

  .public-site-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .public-site-search {
    background: #eef2f6;
    color: #687583;
  }

  .news-section-nav-bar {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 0 12px;
  }

  .news-section-nav-inner {
    display: flex;
    min-height: 38px;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
  }

  .news-section-label,
  .news-section-pill,
  .news-section-date {
    flex: 0 0 auto;
    padding: 7px 10px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .news-section-label {
    background: #e5252a;
    color: #ffffff;
  }

  .news-section-pill {
    border: 1px solid #dce2e9;
    background: #ffffff;
    color: #182330;
  }

  .news-section-date {
    margin-left: auto;
    background: transparent;
    color: #657180;
  }

  .news-article-layout {
    display: grid;
    grid-template-columns: minmax(0, 800px) 320px;
    gap: 42px;
    width: min(1180px, 100%);
    margin: 0 auto;
    padding: 34px 0 56px;
  }

  .news-article-main {
    min-width: 0;
  }

  .news-article-kickers {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
  }

  .news-article-label {
    display: inline-block;
    padding: 5px 8px;
    background: #0f263a;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .news-article-label + .news-article-label {
    background: #2d7b36;
  }

  .news-article-title {
    margin: 0;
    max-width: 760px;
    color: #05080c;
    font-size: clamp(36px, 4.5vw, 56px);
    line-height: 1.02;
    letter-spacing: 0;
  }

  .news-article-subtitle {
    margin: 14px 0 0;
    max-width: 720px;
    color: #56616f;
    font-size: 21px;
    font-weight: 700;
    line-height: 1.42;
  }

  .news-article-meta {
    display: grid;
    gap: 8px;
    margin: 18px 0 26px;
    padding: 13px 0;
    border-top: 1px solid #e1e6ec;
    border-bottom: 1px solid #e1e6ec;
    color: #5e6976;
    font-size: 14px;
  }

  .news-article-author {
    color: #17202b;
    font-size: 17px;
    font-weight: 800;
  }

  .news-article-image {
    margin: 0 0 28px;
    background: #eef2f6;
  }

  .news-article-image img {
    display: block;
    width: 100%;
    max-height: 620px;
    object-fit: cover;
    background: #eef2f6;
  }

  .news-article-image figcaption {
    margin-top: 8px;
    color: #687482;
    font-size: 12px;
  }

  .news-article-body {
    max-width: 880px;
    color: #111820;
    font-size: 20px;
    line-height: 1.62;
  }

  .news-article-body p {
    margin: 0 0 22px;
  }

  .news-article-sidebar {
    display: grid;
    align-content: start;
    gap: 20px;
    position: sticky;
    top: 128px;
  }

  .news-article-ad {
    display: grid;
    min-height: 300px;
    place-items: center;
    border: 1px solid #dfe5eb;
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.66)),
      linear-gradient(135deg, #eef4f6, #e5ecf2 55%, #f5f0e8);
    color: #7a8794;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .news-article-side-panel {
    border: 1px solid #e0e5eb;
    border-radius: 6px;
    background: #ffffff;
    overflow: hidden;
  }

  .news-article-side-panel h2 {
    margin: 0;
    padding: 14px 16px 10px;
    border-top: 5px solid #14263a;
    color: #111820;
    font-size: 22px;
    line-height: 1;
    text-transform: uppercase;
  }

  .news-article-side-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0 16px 16px;
    list-style: none;
  }

  .news-article-side-item {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 11px;
    padding: 12px 0;
    border-bottom: 1px solid #edf1f5;
  }

  .news-article-side-item:last-child {
    border-bottom: 0;
  }

  .news-article-side-item img {
    display: block;
    width: 92px;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: #eef2f6;
  }

  .news-article-side-thumb-placeholder {
    display: block;
    width: 92px;
    aspect-ratio: 4 / 3;
    background: linear-gradient(135deg, #eef2f6, #dbe3eb);
  }

  .news-article-side-item span {
    display: block;
    margin-bottom: 4px;
    color: #e5252a;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .news-article-side-item a {
    color: #17202b;
    font-size: 17px;
    font-weight: 900;
    line-height: 1.08;
    text-decoration: none;
  }

  .news-article-side-item a:hover {
    text-decoration: underline;
  }

  .news-article-side-date {
    margin-top: 5px;
    color: #788391;
    font-size: 12px;
  }

  @media (max-width: 900px) {
    .public-top-stack {
      margin: 0 -18px;
      padding: 0 18px;
    }

    .public-site-topbar {
      min-height: auto;
      padding: 12px 0;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .public-site-menu {
      order: 3;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .public-site-actions {
      margin-left: auto;
    }

    .news-article-layout {
      grid-template-columns: 1fr;
      padding-top: 22px;
    }

    .news-article-sidebar {
      position: static;
    }

    .news-article-title {
      font-size: 40px;
    }

    .news-article-subtitle {
      font-size: 19px;
    }

    .news-article-body {
      font-size: 18px;
    }

    .news-section-date {
      margin-left: 0;
    }
  }
`;

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function publicArticleHref(article: EditorialArticle) {
  return `/noticias/${encodeURIComponent(article.slug)}`;
}

function articleParagraphs(body?: string | null) {
  return (body ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

async function readArticle(slug: string) {
  const rows = await fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
  );

  return rows[0] ?? null;
}

async function readMoreArticles(currentSlug: string) {
  return fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=*&status=eq.published&slug=neq.${encodeURIComponent(
      currentSlug
    )}&order=published_at.desc.nullslast&limit=5`
  ).catch(() => []);
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await readArticle(slug);

  if (!article) {
    notFound();
  }

  const moreArticles = await readMoreArticles(slug);
  const label = firstText(article.label, article.category, article.type);
  const subtitle = firstText(article.subtitle, article.summary, article.excerpt);
  const author = firstText(article.author, article.author_name);
  const publishedAt = formatDate(article.published_at ?? article.created_at);
  const paragraphs = articleParagraphs(article.body);

  return (
    <div className="news-article-shell">
      <style>{articlePageStyles}</style>
      <div className="public-top-stack">
        <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
          <a className="public-site-brand" href="/">
            Jornada<span>.pt</span>
          </a>
          <nav className="public-site-menu" aria-label="Navegação principal">
            <a href="/">Início</a>
            <a href={`/noticias/${encodeURIComponent(slug)}`} aria-current="page">
              Notícias
            </a>
          </nav>
          <div className="public-site-actions" aria-label="Ações">
            <span className="public-site-search" aria-label="Pesquisar">
              Pesquisar
            </span>
            <a href="/admin/gestor">Entrar</a>
          </div>
        </header>
        <section className="news-section-nav-bar" aria-label="Contexto editorial">
          <div className="news-section-nav-inner">
            <span className="news-section-label">Editorial</span>
            <span className="news-section-pill">Notícias</span>
            {label ? <span className="news-section-pill">{label}</span> : null}
            {publishedAt ? <span className="news-section-date">{publishedAt}</span> : null}
          </div>
        </section>
      </div>

      <main className="news-article-layout">
        <article className="news-article-main">
          {label ? (
            <div className="news-article-kickers">
              <span className="news-article-label">{label}</span>
            </div>
          ) : null}

          <h1 className="news-article-title">{article.title}</h1>
          {subtitle ? <p className="news-article-subtitle">{subtitle}</p> : null}

          <div className="news-article-meta">
            {publishedAt ? <span>Publicado em: {publishedAt}</span> : null}
            {author ? <span className="news-article-author">{author}</span> : null}
          </div>

          {article.image_url ? (
            <figure className="news-article-image">
              <img alt="" src={article.image_url} />
              {article.image_caption ? <figcaption>{article.image_caption}</figcaption> : null}
            </figure>
          ) : null}

          <div className="news-article-body">
            {paragraphs.length > 0 ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : null}
          </div>
        </article>

        <aside className="news-article-sidebar">
          <div className="news-article-ad" aria-label="Publicidade">
            Publicidade
          </div>
          {moreArticles.length > 0 ? (
            <section className="news-article-side-panel" aria-label="Mais notícias">
              <h2>Mais notícias</h2>
              <ul className="news-article-side-list">
                {moreArticles.map((item) => {
                  const itemLabel = firstText(item.label, item.category, item.type);
                  const itemDate = formatDate(item.published_at ?? item.created_at);

                  return (
                    <li className="news-article-side-item" key={item.id}>
                      {item.image_url ? (
                        <img alt="" src={item.image_url} />
                      ) : (
                        <span className="news-article-side-thumb-placeholder" aria-hidden="true" />
                      )}
                      <div>
                        {itemLabel ? <span>{itemLabel}</span> : null}
                        <a href={publicArticleHref(item)}>{item.title}</a>
                        {itemDate ? <div className="news-article-side-date">{itemDate}</div> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
