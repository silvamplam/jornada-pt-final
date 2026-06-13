import { notFound } from "next/navigation";

import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  ArticleEditorForm,
  CompetitionOption,
  EditorialArticle,
  MatchdayOption,
  SeasonOption,
  editorialArticleAdminStyles,
  publicArticleHref,
} from "../../_articleForm";

type PageProps = {
  params: Promise<{ articleId: string }>;
  searchParams?: Promise<{ error?: string; saved?: string; created?: string }>;
};

async function loadArticle(articleId: string) {
  const articles = await fetchSupabaseAdminTable<EditorialArticle>(
    `editorial_articles?select=*&id=eq.${encodeURIComponent(articleId)}&limit=1`,
  );

  return articles[0] ?? null;
}

async function loadContextOptions() {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<CompetitionOption>("competitions?select=id,name,slug,is_active&order=name.asc"),
    fetchSupabaseAdminTable<SeasonOption>("seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"),
    fetchSupabaseAdminTable<MatchdayOption>("matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc"),
  ]);

  return { competitions, seasons, matchdays };
}

function statusMessage(params: { error?: string; saved?: string; created?: string }) {
  if (params.saved) {
    return "Artigo guardado.";
  }
  if (params.created) {
    return "Artigo criado.";
  }

  const messages: Record<string, string> = {
    "missing-article": "O artigo já não existe.",
    "missing-title": "Indique um título para o artigo.",
    "missing-slug": "Indique um slug ou deixe que seja gerado a partir do título.",
    "duplicate-slug": "Já existe outro artigo com esse slug.",
    "invalid-context": "A competição, época e jornada escolhidas não pertencem ao mesmo contexto.",
    "invalid-published-at": "A data de publicação não é válida.",
    "missing-service": "Não foi possível aceder ao serviço Supabase de administração.",
    "save-failed": "Não foi possível gravar o artigo.",
  };

  return params.error ? messages[params.error] ?? "Não foi possível gravar o artigo." : null;
}

export default async function EditEditorialArticlePage({ params, searchParams }: PageProps) {
  const { articleId } = await params;
  const query = searchParams ? await searchParams : {};
  const [article, context] = await Promise.all([loadArticle(articleId), loadContextOptions()]);

  if (!article) {
    notFound();
  }

  const publicHref = publicArticleHref(article.slug);

  return (
    <main className="editorial-admin-shell">
      <div className="editorial-admin-container">
        <header className="editorial-admin-header">
          <div>
            <h1>Editar artigo</h1>
            <p>Atualização de artigo editorial público em public.editorial_articles.</p>
          </div>
          <nav className="editorial-admin-actions" aria-label="Navegação editorial">
            <a href="/admin/editorial/artigos">Artigos / Notícias</a>
            {publicHref ? (
              <a href={publicHref} target="_blank" rel="noreferrer">
                Abrir público
              </a>
            ) : null}
            <a href="/admin/editorial/home">Home Editorial</a>
            <a href="/admin/gestor">Centro de Gestão</a>
            <a href="/admin">Backoffice</a>
          </nav>
        </header>

        <ArticleEditorForm
          mode="edit"
          article={article}
          competitions={context.competitions}
          seasons={context.seasons}
          matchdays={context.matchdays}
          message={statusMessage(query)}
        />
      </div>

      <style>{editorialArticleAdminStyles}</style>
    </main>
  );
}
