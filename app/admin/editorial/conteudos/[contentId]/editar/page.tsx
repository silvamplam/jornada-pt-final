import { fetchSupabaseAdminTable } from "@/lib/supabase";

import { EditorialContent, EditorialContentForm, adminEditorialContentsStyles, editorialContentsSelect } from "../../_contentForm";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{
    contentId: string;
  }>;
  searchParams?: Promise<SearchParams>;
};

async function readEditorialContent(contentId: string) {
  try {
    const rows = await fetchSupabaseAdminTable<EditorialContent>(
      `editorial_contents?select=${editorialContentsSelect}&id=eq.${encodeURIComponent(contentId)}&limit=1`,
    );

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function pageMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-title": "Indique um titulo.",
    "missing-slug": "Nao foi possivel gerar um slug.",
    "invalid-status": "Estado invalido.",
    "invalid-scope": "Ambito invalido.",
    "invalid-content-type": "Tipo de conteudo invalido.",
    "invalid-action": "A edicao deve ser guardada pelo fluxo de alteracoes.",
    "missing-content": "O conteudo selecionado ja nao existe.",
    "save-failed": "Nao foi possivel guardar o conteudo.",
  };

  return error ? messages[error] ?? "Nao foi possivel guardar o conteudo." : null;
}

function firstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function EditEditorialContentPage({ params, searchParams }: PageProps) {
  const { contentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = firstSearchParam(resolvedSearchParams.error);
  const content = await readEditorialContent(contentId);

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Editar conteudo audiovisual</h1>
          <p>
            Edicao basica de public.editorial_contents. Nao cria rota publica nem liga este conteudo a zonas editoriais.
          </p>
        </div>
      </section>

        <nav className="content-admin-actions" style={{ marginBottom: 18 }} aria-label="Navegação editorial">
          <a href="/admin/editorial/home">Home Editorial</a>
          <a href="/admin/editorial/artigos">Artigos / Notícias</a>
          <a href="/admin/editorial/composicao">Composição Editorial</a>
          <a href="/admin/editorial/jornada">Editorial da Jornada</a>
          <a href="/admin/gestor">Centro de Gestão</a>
          <a href="/admin">Backoffice</a>
        </nav>
      {content ? (

        <EditorialContentForm mode="edit" content={content} message={pageMessage(error)} />
      ) : (
        <section className="content-admin-missing">
          <h2>Conteudo nao encontrado.</h2>
          <p>O registo pode ter sido removido ou nao existir neste ambiente.</p>
        </section>
      )}
    </main>
  );
}
