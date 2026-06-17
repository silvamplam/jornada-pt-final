import { fetchSupabaseAdminTable } from "@/lib/supabase";

import { EditorialContent, EditorialContentForm, adminEditorialContentsStyles, editorialContentsSelect } from "../../_contentForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    contentId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
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
    "missing-content": "O conteudo selecionado ja nao existe.",
    "save-failed": "Nao foi possivel guardar o conteudo.",
  };

  return error ? messages[error] ?? "Nao foi possivel guardar o conteudo." : null;
}

export default async function EditEditorialContentPage({ params, searchParams }: PageProps) {
  const [{ contentId }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
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

      {content ? (
        <EditorialContentForm mode="edit" content={content} message={pageMessage(resolvedSearchParams.error)} />
      ) : (
        <section className="content-admin-missing">
          <h2>Conteudo nao encontrado.</h2>
          <p>O registo pode ter sido removido ou nao existir neste ambiente.</p>
        </section>
      )}
    </main>
  );
}
