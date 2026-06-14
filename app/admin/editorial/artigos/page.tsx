import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  ArticleEditorForm,
  CompetitionOption,
  EditorialArticle,
  MatchdayOption,
  SeasonOption,
  editorialArticleAdminStyles,
  firstText,
  formatShortDate,
} from "./_articleForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    articleId?: string;
    mode?: string;
    error?: string;
    saved?: string;
    created?: string;
    removed?: string;
    detail?: string;
  }>;
};

async function readEditorialArticles() {
  try {
    const articles = await fetchSupabaseAdminTable<EditorialArticle>(
      "editorial_articles?select=*&order=published_at.desc.nullslast,created_at.desc.nullslast&limit=100",
    );

    return { articles, error: null as string | null };
  } catch (error) {
    return {
      articles: [] as EditorialArticle[],
      error: error instanceof Error ? error.message : "Não foi possível ler os artigos editoriais.",
    };
  }
}

async function loadContextOptions() {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<CompetitionOption>("competitions?select=id,name,slug,is_active&order=name.asc"),
    fetchSupabaseAdminTable<SeasonOption>("seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"),
    fetchSupabaseAdminTable<MatchdayOption>("matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc"),
  ]);

  return { competitions, seasons, matchdays };
}

function pageMessage(params: Awaited<NonNullable<PageProps["searchParams"]>>) {
  if (params.created) {
    return "Artigo criado.";
  }
  if (params.saved) {
    return "Artigo guardado.";
  }
  if (params.removed) {
    return "Artigo removido.";
  }

  const messages: Record<string, string> = {
    "invalid-action": "A ação pedida não existe.",
    "missing-title": "Indique um título para o artigo.",
    "missing-slug": "Indique um slug ou deixe que seja gerado a partir do título.",
    "duplicate-slug": "Já existe um artigo com esse slug.",
    "invalid-context": "A competição, época e jornada escolhidas não pertencem ao mesmo contexto.",
    "invalid-published-at": "A data de publicação não é válida.",
    "missing-service": "Não foi possível aceder ao serviço Supabase de administração.",
    "missing-article": "O artigo selecionado já não existe.",
    "delete-not-confirmed": "Confirme a remoção antes de apagar o artigo.",
    "required-field": "O Supabase recusou a gravação por campo obrigatório em falta.",
    constraint: "O Supabase recusou a gravação por constraint da tabela.",
    permission: "O Supabase recusou a gravação por permissões/RLS.",
    "supabase-error": "O Supabase recusou a gravação.",
    "save-failed": "Não foi possível gravar o artigo.",
  };

  if (!params.error) {
    return null;
  }

  const base = messages[params.error] ?? "Não foi possível gravar o artigo.";
  return params.detail ? `${base} Detalhe: ${params.detail}` : base;
}

function statusLabel(status: string | null) {
  return status?.trim() || "sem estado";
}

function selectedArticleFromQuery(articles: EditorialArticle[], articleId?: string, mode?: string) {
  if (mode === "novo") {
    return null;
  }

  if (!articleId) {
    return null;
  }

  return articles.find((article) => article.id === articleId) ?? null;
}

export default async function AdminEditorialArticlesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ articles, error }, context] = await Promise.all([readEditorialArticles(), loadContextOptions()]);
  const selectedArticle = selectedArticleFromQuery(articles, params.articleId, params.mode);
  const isEditing = Boolean(selectedArticle);
  const message = pageMessage(params);

  return (
    <main className="editorial-admin-shell">
      <div className="editorial-admin-container">
        <header className="editorial-admin-header editorial-admin-hero">
          <div>
            <h1>Artigos / Notícias</h1>
            <p>
              Biblioteca editorial global de public.editorial_articles, com criação e edição na mesma página.
            </p>
          </div>
          <nav className="editorial-admin-actions" aria-label="Navegação editorial">
            <a href="/admin/editorial/home">Home Editorial</a>
            <a href="/admin/editorial/composicao">Composição Editorial</a>
            <a href="/admin/editorial/jornada">Editorial da Jornada</a>
            <a href="/admin/gestor">Centro de Gestão</a>
            <a href="/admin">Backoffice</a>
          </nav>
          <div className="editorial-admin-actions" aria-label="Ações de artigos">
            <a className="primary" href="/admin/editorial/artigos?mode=novo">
              Novo artigo
            </a>
          </div>
        </header>

        {message ? <p className="article-admin-alert">{message}</p> : null}

        <div className="article-admin-workspace">
          <aside className="article-admin-sidebar" aria-label="Artigos existentes">
            <div className="article-admin-sidebar-header">
              <h2>Artigos existentes</h2>
              <p>{articles.length} artigos na biblioteca editorial.</p>
            </div>

            {error ? <p className="article-admin-alert">{error}</p> : null}
            {!error && articles.length === 0 ? <p className="article-admin-sidebar-item">Não há artigos editoriais para apresentar.</p> : null}

            {articles.length > 0 ? (
              <ul className="article-admin-sidebar-list">
                {articles.map((article) => {
                  const articleDate = firstText(formatShortDate(article.published_at), formatShortDate(article.created_at));
                  const isSelected = selectedArticle?.id === article.id;

                  return (
                    <li key={article.id}>
                      <a
                        className={`article-admin-sidebar-item${isSelected ? " is-selected" : ""}`}
                        href={`/admin/editorial/artigos?articleId=${encodeURIComponent(article.id)}`}
                      >
                        <span className="article-admin-sidebar-meta">
                          <span>{statusLabel(article.status)}</span>
                          {article.label ? <span>{article.label}</span> : null}
                        </span>
                        <strong>{article.title ?? "Sem título"}</strong>
                        <span className="article-admin-sidebar-meta">
                          {article.slug ? <span>/{article.slug}</span> : null}
                          {articleDate ? <span>{articleDate}</span> : null}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </aside>

          <section className="article-admin-editor">
            <div className="article-admin-editor-header">
              <h2>{isEditing ? "Editar artigo" : "Novo artigo"}</h2>
              <p>
                {isEditing
                  ? "O artigo selecionado mantém o link público e pode ser atualizado aqui."
                  : "Preencha o formulário para criar um novo rascunho ou artigo publicado."}
              </p>
            </div>

            <ArticleEditorForm
              mode={isEditing ? "edit" : "create"}
              article={selectedArticle}
              competitions={context.competitions}
              seasons={context.seasons}
              matchdays={context.matchdays}
              returnTo={
                isEditing && selectedArticle
                  ? `/admin/editorial/artigos?articleId=${encodeURIComponent(selectedArticle.id)}`
                  : "/admin/editorial/artigos"
              }
            />
            {selectedArticle ? (
              <form className="article-admin-delete-form" action="/api/admin/editorial/artigos" method="post">
                <input type="hidden" name="action_type" value="delete_article" />
                <input type="hidden" name="article_id" value={selectedArticle.id} />
                <input type="hidden" name="return_to" value="/admin/editorial/artigos" />
                <div>
                  <strong>Remover artigo</strong>
                  <p>Remove apenas o registo de public.editorial_articles. O link público deixará de abrir em /noticias/{selectedArticle.slug ?? "[slug]"}.</p>
                  <label className="article-admin-delete-confirm">
                    <input name="confirm_delete" type="checkbox" value="yes" required />
                    <span>Confirmo que quero remover este artigo editorial.</span>
                  </label>
                </div>
                <button type="submit">Remover artigo</button>
              </form>
            ) : null}
          </section>
        </div>
      </div>

      <style>{editorialArticleAdminStyles}</style>
    </main>
  );
}
