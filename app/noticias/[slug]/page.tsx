import Link from "next/link";
import { publicEditorialStyles } from "@/components/public/publicEditorialStyles";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type EditorialArticle = {
  id: string;
  slug: string;
  status: "draft" | "published";
  scope: "home" | "matchday" | "competition" | "general";
  matchday_id: string | null;
  competition_id: string | null;
  title: string | null;
  subtitle: string | null;
  label: string | null;
  author: string | null;
  image_url: string | null;
  body: string | null;
  published_at: string | null;
};

type RelatedArticle = {
  id: string;
  slug: string;
  title: string | null;
  label: string | null;
  image_url: string | null;
  published_at: string | null;
  matchday_id: string | null;
  competition_id: string | null;
};

const competitionLinks = [
  { label: "Liga Portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
  { label: "La Liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
  { label: "Premier League", href: "/competicoes/premier-league/2026-27/jornadas/1" }
];

const topMenuLinks = [
  ...competitionLinks,
  { label: "Jogos", href: "/competicoes/liga-portugal/2026-27/jornadas/1#jogos" },
  { label: "Classifica\u00e7\u00e3o", href: "/competicoes/liga-portugal/2026-27/jornadas/1#classificacao" }
];

const articleStyles = `
  .public-article-page {
    max-width: 1220px;
    margin: 34px auto 78px;
    padding: 0 22px;
  }

  .public-article-layout {
    display: grid;
    grid-template-columns: minmax(0, 780px) minmax(280px, 340px);
    align-items: start;
    gap: 58px;
  }

  .public-article-reading {
    min-width: 0;
  }

  .public-article-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    color: #607086;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-article-card {
    background: #ffffff;
  }

  .public-article-header {
    padding: 0 0 22px;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-article-label {
    display: inline-block;
    margin-bottom: 14px;
    color: #e5252a;
    font-size: 13px;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .public-article-title {
    max-width: 740px;
    margin: 0;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(34px, 4.2vw, 54px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1.04;
  }

  .public-article-subtitle {
    max-width: 700px;
    margin: 14px 0 0;
    color: #526174;
    font-size: 19px;
    line-height: 1.42;
  }

  .public-article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
    color: #607086;
    font-size: 12px;
    font-weight: 800;
  }

  .public-article-meta span + span::before {
    content: "/";
    margin-right: 10px;
    color: #a7b1bd;
  }

  .public-article-image {
    margin: 22px 0 0;
  }

  .public-article-image img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 430px;
    object-fit: cover;
    border-radius: 6px;
  }

  .public-article-body {
    max-width: 670px;
    margin: 30px 0 0;
    color: #18212c;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    line-height: 1.68;
  }

  .public-article-body p {
    margin: 0 0 22px;
  }

  .public-article-sidebar {
    position: sticky;
    top: 22px;
    display: grid;
    gap: 22px;
  }

  .public-article-side-block {
    border-top: 5px solid #10151b;
    background: #ffffff;
    padding-top: 14px;
  }

  .public-article-side-block h2,
  .public-article-more h2 {
    margin: 0 0 14px;
    color: #10151b;
    font-size: 13px;
    font-weight: 950;
    letter-spacing: 0.07em;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-article-side-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .public-article-side-item {
    border-top: 1px solid #dfe5ec;
    padding: 13px 0;
  }

  .public-article-side-item:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .public-article-side-link {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }

  .public-article-side-link:not(.has-image) {
    display: block;
  }

  .public-article-side-thumb {
    display: block;
    width: 74px;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-article-side-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .public-article-side-label,
  .public-article-related-label {
    display: block;
    margin-bottom: 5px;
    color: #e5252a;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-article-side-title {
    display: block;
    color: #10151b;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.14;
  }

  .public-article-side-link:hover .public-article-side-title,
  .public-article-related-title:hover,
  .public-article-back:hover {
    text-decoration: underline;
  }

  .public-article-side-date {
    display: block;
    margin-top: 7px;
    color: #607086;
    font-size: 12px;
    font-weight: 800;
  }

  .public-article-ad-slot,
  .public-article-horizontal-ad {
    display: grid;
    place-items: center;
    min-height: 104px;
    border: 1px solid #dfe5ec;
    border-radius: 6px;
    background: #f7f9fb;
    color: #8a98a8;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .public-article-sidebar .public-article-ad-slot:first-child {
    min-height: 320px;
    background: #edf1f5;
  }

  .public-article-sidebar .public-article-ad-slot:last-child {
    min-height: 150px;
  }

  .public-article-horizontal-ad {
    min-height: 76px;
    margin-top: 42px;
  }

  .public-article-more {
    margin-top: 34px;
    border-top: 5px solid #10151b;
    padding-top: 16px;
  }

  .public-article-related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .public-article-related-card {
    border-top: 1px solid #dfe5ec;
    padding-top: 12px;
  }

  .public-article-related-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    margin-bottom: 10px;
    overflow: hidden;
    border-radius: 5px;
    background: #eef2f6;
  }

  .public-article-related-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .public-article-related-title {
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.04;
    text-decoration: none;
  }

  .public-article-empty {
    max-width: 760px;
    margin: 60px auto;
    padding: 36px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-article-empty p,
  .public-article-empty h1 {
    margin: 0;
  }

  .public-article-empty p:first-child {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-article-empty h1 {
    margin-top: 10px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 46px;
    line-height: 1;
  }

  .public-article-empty p + p {
    margin-top: 14px;
    color: #607086;
    font-size: 17px;
    line-height: 1.45;
  }

  .public-article-empty a {
    display: inline-block;
    margin-top: 22px;
    color: #10151b;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 760px) {
    .public-article-page {
      margin-top: 20px;
      padding: 0 16px;
    }

    .public-article-layout {
      display: block;
    }

    .public-article-title {
      font-size: 42px;
    }

    .public-article-subtitle {
      font-size: 18px;
    }

    .public-article-body {
      font-size: 19px;
    }

    .public-article-sidebar {
      position: static;
      margin-top: 36px;
    }

    .public-article-sidebar .public-article-ad-slot:first-child,
    .public-article-sidebar .public-article-ad-slot:last-child {
      min-height: 96px;
    }

    .public-article-related-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatPublishedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function bodyBlocks(body: string | null) {
  const text = cleanText(body);
  if (!text) return [];

  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

async function readArticle(slug: string) {
  const rows = await fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=id,slug,status,scope,matchday_id,competition_id,title,subtitle,label,author,image_url,body,published_at&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
  ).catch(() => []);

  return rows[0] ?? null;
}

function relatedPriority(article: EditorialArticle, relatedArticle: RelatedArticle) {
  if (article.competition_id && relatedArticle.competition_id === article.competition_id) return 0;
  if (article.matchday_id && relatedArticle.matchday_id === article.matchday_id) return 1;
  return 2;
}

async function readRelatedArticles(article: EditorialArticle) {
  const rows = await fetchSupabaseAdminTable<RelatedArticle>(
    `editorial_articles?select=id,slug,title,label,image_url,published_at,matchday_id,competition_id&status=eq.published&slug=neq.${encodeURIComponent(article.slug)}&order=published_at.desc&limit=18`
  ).catch(() => []);

  return rows.sort((firstArticle, secondArticle) => {
    const priorityDifference = relatedPriority(article, firstArticle) - relatedPriority(article, secondArticle);
    if (priorityDifference !== 0) return priorityDifference;

    const firstTime = firstArticle.published_at ? new Date(firstArticle.published_at).getTime() : 0;
    const secondTime = secondArticle.published_at ? new Date(secondArticle.published_at).getTime() : 0;

    return secondTime - firstTime;
  });
}

function PublicHeader() {
  return (
    <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
          Jornada<span>.pt</span>
        </Link>
        <nav className="public-site-menu" aria-label="Competicoes principais">
          {topMenuLinks.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="public-site-actions" aria-label="Acoes">
          <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
          <Link href="/admin/login">Entrar</Link>
        </div>
      </header>
    </div>
  );
}

function NotFoundArticle() {
  return (
    <section className="public-article-empty" aria-label="Noticia nao encontrada">
      <p>Noticia</p>
      <h1>Noticia nao encontrada</h1>
      <p>O artigo pode ainda estar em rascunho, nao existir ou ter sido retirado da leitura publica.</p>
      <Link href="/">Voltar ao Jornada.pt</Link>
    </section>
  );
}

function relatedArticleTitle(article: RelatedArticle) {
  return cleanText(article.title) || article.slug;
}

function ArticleSideList({ articles, title }: { articles: RelatedArticle[]; title: string }) {
  if (articles.length === 0) return null;

  return (
    <section className="public-article-side-block" aria-label={title}>
      <h2>{title}</h2>
      <ul className="public-article-side-list">
        {articles.map((article) => {
          const articleLabel = cleanText(article.label) || "Noticia";
          const articleDate = formatShortDate(article.published_at);
          const imageUrl = cleanText(article.image_url);

          return (
            <li className="public-article-side-item" key={article.id}>
              <Link className={`public-article-side-link${imageUrl ? " has-image" : ""}`} href={`/noticias/${article.slug}`}>
                {imageUrl ? (
                  <span className="public-article-side-thumb">
                    <img alt="" src={imageUrl} />
                  </span>
                ) : null}
                <span>
                  <span className="public-article-side-label">{articleLabel}</span>
                  <span className="public-article-side-title">{relatedArticleTitle(article)}</span>
                  {articleDate ? <span className="public-article-side-date">{articleDate}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ArticleSidebar({ articles }: { articles: RelatedArticle[] }) {
  return (
    <aside className="public-article-sidebar" aria-label="Mais no Jornada.pt">
      <div className="public-article-ad-slot" aria-label="Espaco reservado">
        PUBLICIDADE
      </div>
      <ArticleSideList articles={articles} title="Mais noticias" />
      <div className="public-article-ad-slot" aria-label="Espaco reservado">
        PUBLICIDADE
      </div>
    </aside>
  );
}

function MoreArticles({ articles }: { articles: RelatedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="public-article-more" aria-label="Ler tambem">
      <h2>Ler tambem</h2>
      <div className="public-article-related-grid">
        {articles.map((article) => (
          <article className="public-article-related-card" key={article.id}>
            {cleanText(article.image_url) ? (
              <Link className="public-article-related-image" href={`/noticias/${article.slug}`}>
                <img alt="" src={cleanText(article.image_url) ?? ""} />
              </Link>
            ) : null}
            <span className="public-article-related-label">{cleanText(article.label) || "Noticia"}</span>
            <Link className="public-article-related-title" href={`/noticias/${article.slug}`}>
              {relatedArticleTitle(article)}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await readArticle(slug);
  const relatedArticles = article ? await readRelatedArticles(article) : [];
  const blocks = bodyBlocks(article?.body ?? null);
  const label = cleanText(article?.label) || "Noticia";
  const title = article ? cleanText(article.title) || article.slug : null;
  const subtitle = cleanText(article?.subtitle);
  const imageUrl = cleanText(article?.image_url);
  const author = cleanText(article?.author);
  const publishedAt = formatPublishedAt(article?.published_at ?? null);
  const sidebarArticles = relatedArticles.slice(0, 5);
  const moreArticles = relatedArticles.length > 5 ? relatedArticles.slice(5, 11) : relatedArticles.slice(0, 6);

  return (
    <main className="public-matchday-shell">
      <style>{`${publicEditorialStyles}\n${articleStyles}`}</style>
      <PublicHeader />

      <div className="public-article-page">
        {!article || !title ? (
          <NotFoundArticle />
        ) : (
          <>
            <div className="public-article-layout">
              <article className="public-article-reading">
                <Link className="public-article-back" href="/">Voltar ao Jornada.pt</Link>
                <div className="public-article-card">
                  <header className="public-article-header">
                    <span className="public-article-label">{label}</span>
                    <h1 className="public-article-title">{title}</h1>
                    {subtitle ? <p className="public-article-subtitle">{subtitle}</p> : null}
                    {author || publishedAt ? (
                      <div className="public-article-meta">
                        {author ? <span>{author}</span> : null}
                        {publishedAt ? <span>{publishedAt}</span> : null}
                      </div>
                    ) : null}
                  </header>

                  {imageUrl ? (
                    <figure className="public-article-image">
                      <img alt="" src={imageUrl} />
                    </figure>
                  ) : null}

                  <div className="public-article-body">
                    {blocks.length > 0 ? (
                      blocks.map((block, index) => (
                        <p key={`${article.id}-paragraph-${index}`}>
                          {block.split(/\n/).map((line, lineIndex, lines) => (
                            <span key={`${article.id}-paragraph-${index}-line-${lineIndex}`}>
                              {line}
                              {lineIndex < lines.length - 1 ? <br /> : null}
                            </span>
                          ))}
                        </p>
                      ))
                    ) : (
                      <p>Texto em preparacao.</p>
                    )}
                  </div>
                </div>
              </article>

              <ArticleSidebar articles={sidebarArticles} />
            </div>

            <div className="public-article-horizontal-ad" aria-label="Espaco reservado">
              PUBLICIDADE
            </div>

            <MoreArticles articles={moreArticles} />
          </>
        )}
      </div>
    </main>
  );
}
