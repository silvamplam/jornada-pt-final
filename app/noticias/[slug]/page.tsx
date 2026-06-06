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

const competitionLinks = [
  { label: "Liga Portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
  { label: "La Liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
  { label: "Premier League", href: "/competicoes/premier-league/2026-27/jornadas/1" }
];

const articleStyles = `
  .public-article-page {
    max-width: 1180px;
    margin: 28px auto 64px;
  }

  .public-article-reading {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 0 48px;
  }

  .public-article-back {
    display: inline-flex;
    margin-bottom: 22px;
    color: #607086;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-article-card {
    border-top: 4px solid #10151b;
    background: #ffffff;
  }

  .public-article-header {
    padding: 0 0 24px;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-article-label {
    display: inline-block;
    margin-bottom: 12px;
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .public-article-title {
    max-width: 820px;
    margin: 0;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(42px, 6vw, 76px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.94;
  }

  .public-article-subtitle {
    max-width: 740px;
    margin: 18px 0 0;
    color: #526174;
    font-size: 20px;
    line-height: 1.35;
  }

  .public-article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
    color: #607086;
    font-size: 13px;
    font-weight: 800;
  }

  .public-article-meta span + span::before {
    content: "/";
    margin-right: 10px;
    color: #a7b1bd;
  }

  .public-article-image {
    margin: 24px 0 0;
  }

  .public-article-image img {
    display: block;
    width: 100%;
    max-height: 560px;
    object-fit: cover;
    border-radius: 8px;
  }

  .public-article-body {
    max-width: 740px;
    margin: 28px auto 0;
    color: #18212c;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 21px;
    line-height: 1.62;
  }

  .public-article-body p {
    margin: 0 0 22px;
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

function PublicHeader() {
  return (
    <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
          Jornada<span>.pt</span>
        </Link>
        <nav className="public-site-menu" aria-label="Competicoes principais">
          {competitionLinks.map((link) => (
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await readArticle(slug);
  const blocks = bodyBlocks(article?.body ?? null);
  const label = cleanText(article?.label) || "Noticia";
  const title = article ? cleanText(article.title) || article.slug : null;
  const subtitle = cleanText(article?.subtitle);
  const imageUrl = cleanText(article?.image_url);
  const author = cleanText(article?.author);
  const publishedAt = formatPublishedAt(article?.published_at ?? null);

  return (
    <main className="public-matchday-shell">
      <style>{`${publicEditorialStyles}\n${articleStyles}`}</style>
      <PublicHeader />

      <div className="public-article-page">
        {!article || !title ? (
          <NotFoundArticle />
        ) : (
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
        )}
      </div>
    </main>
  );
}
