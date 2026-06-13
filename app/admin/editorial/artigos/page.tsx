import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type EditorialArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  image_url?: string | null;
  source_url?: string | null;
  label?: string | null;
  category?: string | null;
  type?: string | null;
  author?: string | null;
  author_name?: string | null;
  status: string;
  competition_id?: string | null;
  season_id?: string | null;
  matchday_id?: string | null;
  match_id?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const editorialArticlesStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .editorial-articles-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .editorial-articles-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .editorial-articles-hero p,
  .editorial-articles-hero h1,
  .editorial-articles-panel h2,
  .editorial-articles-panel p,
  .editorial-articles-item h3,
  .editorial-articles-item p {
    margin: 0;
  }

  .editorial-articles-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-articles-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .editorial-articles-hero span {
    display: block;
    margin-top: 10px;
    max-width: 760px;
    color: #cdd5df;
    font-size: 16px;
  }

  .editorial-articles-actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }

  .editorial-articles-actions a,
  .editorial-articles-actions button,
  .editorial-articles-item-actions a,
  .editorial-articles-item-actions span {
    display: inline-block;
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
  }

  .editorial-articles-actions button {
    opacity: 0.56;
  }

  .editorial-articles-panel {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .editorial-articles-panel header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .editorial-articles-panel h2 {
    font-size: 21px;
    text-transform: uppercase;
  }

  .editorial-articles-panel p {
    margin-top: 6px;
    color: #687380;
    line-height: 1.4;
  }

  .editorial-articles-count {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .editorial-articles-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .editorial-articles-item {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #eef2f6;
  }

  .editorial-articles-item:last-child {
    border-bottom: 0;
  }

  .editorial-articles-image {
    display: grid;
    place-items: center;
    width: 92px;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 6px;
    background: #f8fafc;
    color: #7b8591;
    font-size: 11px;
    font-weight: 900;
  }

  .editorial-articles-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .editorial-articles-meta,
  .editorial-articles-ids {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 6px;
    color: #7b8591;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-articles-meta span:first-child {
    color: #e5252a;
  }

  .editorial-articles-item h3 {
    color: #10151b;
    font-size: 18px;
    line-height: 1.15;
  }

  .editorial-articles-item h3 a {
    color: inherit;
    text-decoration: none;
  }

  .editorial-articles-item h3 a:hover {
    text-decoration: underline;
  }

  .editorial-articles-item p {
    margin-top: 6px;
    color: #5b6571;
    line-height: 1.35;
  }

  .editorial-articles-slug {
    margin-top: 5px;
    color: #687380;
    font-family: "Courier New", monospace;
    font-size: 12px;
  }

  .editorial-articles-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .editorial-articles-item-actions a {
    border-color: #dce3eb;
    background: #10151b;
    color: #ffffff;
  }

  .editorial-articles-item-actions span {
    border-color: #dce3eb;
    color: #7b8591;
  }

  .editorial-articles-empty,
  .editorial-articles-warning {
    padding: 22px 20px;
    color: #5b6571;
    line-height: 1.45;
  }

  .editorial-articles-warning {
    background: #fff8ee;
    color: #6f4d1d;
  }

  @media (max-width: 920px) {
    .editorial-articles-shell {
      padding: 16px;
    }

    .editorial-articles-hero,
    .editorial-articles-panel header,
    .editorial-articles-item {
      display: grid;
      grid-template-columns: 1fr;
    }

    .editorial-articles-actions,
    .editorial-articles-item-actions {
      justify-content: flex-start;
    }
  }
`;

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleDateString("pt-PT");
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function publicArticleHref(article: EditorialArticle) {
  return `/noticias/${encodeURIComponent(article.slug)}`;
}

async function readEditorialArticles() {
  try {
    const articles = await fetchSupabaseAdminTable<EditorialArticle>(
      "editorial_articles?select=*&order=published_at.desc.nullslast&limit=100"
    );

    return { articles, error: null as string | null };
  } catch (error) {
    return {
      articles: [] as EditorialArticle[],
      error: error instanceof Error ? error.message : "Nao foi possivel ler os artigos editoriais."
    };
  }
}

export default async function AdminEditorialArticlesPage() {
  const { articles, error } = await readEditorialArticles();

  return (
    <main className="editorial-articles-shell">
      <style>{editorialArticlesStyles}</style>
      <section className="editorial-articles-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Artigos / Notícias</h1>
          <span>Área de consulta editorial dos artigos públicos registados em public.editorial_articles.</span>
        </div>
        <nav className="editorial-articles-actions" aria-label="Navegacao editorial">
          <a href="/admin/editorial/home">Home Editorial</a>
          <a href="/admin/gestor">Centro de Gestao</a>
          <a href="/admin/gestor?section=linha-editorial#linha-editorial">Composicao Editorial</a>
          <a href="/admin/gestor?section=linha-editorial#linha-editorial">Editorial da Jornada</a>
          <a href="/admin">Backoffice</a>
          <button disabled type="button" title="Acao de criacao ainda nao implementada nesta fase.">
            Novo
          </button>
        </nav>
      </section>

      <section className="editorial-articles-panel">
        <header>
          <div>
            <h2>Artigos editoriais publicos</h2>
            <p>Lista lida da tabela Supabase editorial_articles, com ligacao publica em /noticias/[slug].</p>
          </div>
          <span className="editorial-articles-count">{articles.length} itens</span>
        </header>

        {error ? <div className="editorial-articles-warning">{error}</div> : null}
        {!error ? (
          <div className="editorial-articles-warning">
            Esta fase recupera a leitura e os links publicos dos artigos editoriais. O botao Novo fica visivel mas desativado porque ainda nao ha CRUD/API de criacao nesta etapa.
          </div>
        ) : null}

        {!error && articles.length === 0 ? (
          <div className="editorial-articles-empty">Nao ha artigos editoriais para apresentar.</div>
        ) : null}

        {articles.length > 0 ? (
          <ul className="editorial-articles-list">
            {articles.map((article) => {
              const publishedDate = formatDate(article.published_at);
              const createdDate = formatDate(article.created_at);
              const articleDate = publishedDate ?? createdDate;
              const label = firstText(article.label, article.category, article.type);
              const author = firstText(article.author, article.author_name);
              const subtitle = firstText(article.subtitle, article.summary, article.excerpt);

              return (
                <li className="editorial-articles-item" key={article.id}>
                  <div className="editorial-articles-image">
                    {article.image_url ? <img alt="" src={article.image_url} /> : "SEM IMG"}
                  </div>
                  <div>
                    <div className="editorial-articles-meta">
                      <span>{article.status}</span>
                      {label ? <span>{label}</span> : null}
                      {author ? <span>{author}</span> : null}
                      {articleDate ? <span>{articleDate}</span> : null}
                    </div>
                    <h3>
                      <a href={publicArticleHref(article)}>{article.title}</a>
                    </h3>
                    <div className="editorial-articles-slug">/{article.slug}</div>
                    {subtitle ? <p>{subtitle}</p> : null}
                    <div className="editorial-articles-ids">
                      {article.matchday_id ? <span>matchday_id: {article.matchday_id}</span> : null}
                      {article.competition_id ? <span>competition_id: {article.competition_id}</span> : null}
                      {article.season_id ? <span>season_id: {article.season_id}</span> : null}
                      {article.match_id ? <span>match_id: {article.match_id}</span> : null}
                    </div>
                  </div>
                  <div className="editorial-articles-item-actions">
                    <a href={publicArticleHref(article)}>Abrir publico</a>
                    {article.source_url ? (
                      <a href={article.source_url} rel="noreferrer" target="_blank">
                        Fonte
                      </a>
                    ) : (
                      <span>Sem fonte</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
