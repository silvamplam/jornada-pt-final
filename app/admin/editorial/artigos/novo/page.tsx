import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  ArticleEditorForm,
  CompetitionOption,
  MatchdayOption,
  SeasonOption,
  editorialArticleAdminStyles,
} from "../_articleForm";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

async function loadContextOptions() {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<CompetitionOption>("competitions?select=id,name,slug,is_active&order=name.asc"),
    fetchSupabaseAdminTable<SeasonOption>("seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"),
    fetchSupabaseAdminTable<MatchdayOption>("matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc"),
  ]);

  return { competitions, seasons, matchdays };
}

function errorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    "missing-title": "Indique um título para o artigo.",
    "missing-slug": "Indique um slug ou deixe que seja gerado a partir do título.",
    "duplicate-slug": "Já existe um artigo com esse slug.",
    "invalid-context": "A competição, época e jornada escolhidas não pertencem ao mesmo contexto.",
    "invalid-published-at": "A data de publicação não é válida.",
    "missing-service": "Não foi possível aceder ao serviço Supabase de administração.",
    "save-failed": "Não foi possível gravar o artigo.",
  };

  return messages[error] ?? "Não foi possível gravar o artigo.";
}

export default async function NewEditorialArticlePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { competitions, seasons, matchdays } = await loadContextOptions();

  return (
    <main className="editorial-admin-shell">
      <div className="editorial-admin-container">
        <header className="editorial-admin-header">
          <div>
            <h1>Novo artigo</h1>
            <p>Criação mínima de artigos editoriais públicos em public.editorial_articles.</p>
          </div>
          <nav className="editorial-admin-actions" aria-label="Navegação editorial">
            <a href="/admin/editorial/artigos">Artigos / Notícias</a>
            <a href="/admin/editorial/home">Home Editorial</a>
            <a href="/admin/gestor">Centro de Gestão</a>
            <a href="/admin">Backoffice</a>
          </nav>
        </header>

        <ArticleEditorForm
          mode="create"
          competitions={competitions}
          seasons={seasons}
          matchdays={matchdays}
          message={errorMessage(params.error)}
        />
      </div>

      <style>{editorialArticleAdminStyles}</style>
    </main>
  );
}
