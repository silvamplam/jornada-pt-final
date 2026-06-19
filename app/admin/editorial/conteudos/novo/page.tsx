import { EditorialContentForm, adminEditorialContentsStyles } from "../_contentForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function pageMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-title": "Indique um titulo.",
    "missing-slug": "Nao foi possivel gerar um slug.",
    "invalid-status": "Estado invalido.",
    "invalid-scope": "Ambito invalido.",
    "invalid-content-type": "Tipo de conteudo invalido.",
    "invalid-action": "Acao invalida para este formulario.",
    "save-failed": "Nao foi possivel criar o conteudo.",
  };

  return error ? messages[error] ?? "Nao foi possivel criar o conteudo." : null;
}

export default async function NewEditorialContentPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Novo conteudo audiovisual</h1>
          <p>
            Criacao basica de conteudo editorial audiovisual. Nao liga a Home, Jornada, Composicao ou areas fixas de
            video nesta fase.
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
      <EditorialContentForm mode="create" message={pageMessage(params.error)} />

    </main>
  );
}
