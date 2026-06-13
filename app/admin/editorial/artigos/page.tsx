import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  EditorialArticle,
  editorialArticleAdminStyles,
  firstText,
  formatShortDate,
  publicArticleHref,
} from "./_articleForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

async function readEditorialArticles() {
  try {
    const articles = await fetchSupabaseAdminTable<EditorialArticle>(
      "editorial_articles?select=*&order=published_at.desc.nullslast&limit=100",
    );

    return { articles, error: null as string | null };
  } catch (error) {
    return {
      articles: [] as EditorialArticle[],
      error: error instanceof Error ? error.message : "Não foi possível ler os artigos editoriais.",
    };
  }
}

function errorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    "invalid-action": "A ação pedida não existe.",
    "save-failed": "Não foi possível gravar o artigo.",
  };

  return messages[error] ?? "Não foi possível executar a ação pedida.";
}

function statusLabel(status: string | null) {
  if (!status) {
    return "sem estado";
  }

  return status;
}

export default async function AdminEditorialArticlesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { articles, error } = await readEditorialArticles();
  const routeMessage = errorMessage(params.error);

  return (
    <main className="editorial-admin-shell">
      <div className="editorial-admin-container">
        <header className="editorial-admin-header">
          <div>
            <h1>Artigos / Notícias</h1>
            <p>
              Biblioteca editorial global lida de public.editorial_articles. Os artigos publicados abrem em /noticias/[slug].
            </p>
          </div>
          <nav className="editorial-admin-actions" aria-label="Navegação editorial">
            <a href="/admin/editorial/home">Home Editorial</a>
            <a href="/admin/gestor">Centro de Gestão</a>
            <a href="/admin/gestor?section=linha-editorial#linha-editorial">Composição Editorial</a>
            <a href="/admin/gestor?section=linha-editorial#linha-editorial">Editorial da Jornada</a>
            <a href="/admin">Backoffice</a>
            <a className="primary" href="/admin/editorial/artigos/novo">
              Novo
            </a>
          </nav>
        </header>

        {routeMessage ? <p className="article-admin-alert">{routeMessage}</p> : null}

        <section className="editorial-admin-panel">
          <div className="editorial-admin-header">
            <div>
              <h2>Artigos editoriais públicos</h2>
              <p>
                Esta página cria e edita a biblioteca global. A associação a uma jornada continua separada na Composição Editorial.
              </p>
            </div>
            <strong>{articles.length} itens</strong>
          </div>

          {error ? <p className="article-admin-alert">{error}</p> : null}
          {!error && articles.length === 0 ? <p>Não há artigos editoriais para apresentar.</p> : null}

          {articles.length > 0 ? (
            <div className="article-list">
              {articles.map((article) => {
                const publicHref = publicArticleHref(article.slug);
                const label = firstText(article.label);
                const subtitle = firstText(article.subtitle);
                const articleDate = firstText(formatShortDate(article.published_at), formatShortDate(article.created_at));

                return (
                  <article className="article-card" key={article.id}>
                    {article.image_url ? (
                      <img alt="" src={article.image_url} />
                    ) : (
                      <div className="article-card-image-placeholder">Sem imagem</div>
                    )}

                    <div className="article-card-body">
                      <div className="article-card-meta">
                        <span>{statusLabel(article.status)}</span>
                        {label ? <span>{label}</span> : null}
                        {article.author ? <span>{article.author}</span> : null}
                        {articleDate ? <span>{articleDate}</span> : null}
                      </div>

                      <h2>
                        {publicHref ? <a href={publicHref}>{article.title ?? "Sem título"}</a> : article.title ?? "Sem título"}
                      </h2>

                      {article.slug ? <p className="article-card-context">/{article.slug}</p> : null}
                      {subtitle ? <p>{subtitle}</p> : null}

                      <div className="article-card-context">
                        {article.competition_id ? <span>competition_id: {article.competition_id}</span> : null}
                        {article.season_id ? <span>season_id: {article.season_id}</span> : null}
                        {article.matchday_id ? <span>matchday_id: {article.matchday_id}</span> : null}
                      </div>

                      <div className="article-card-actions">
                        <a href={`/admin/editorial/artigos/${encodeURIComponent(article.id)}/editar`}>Editar</a>
                        {publicHref ? (
                          <a href={publicHref} target="_blank" rel="noreferrer">
                            Abrir público
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>

      <style>{editorialArticleAdminStyles}</style>
    </main>
  );
}
