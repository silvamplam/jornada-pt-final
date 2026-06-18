import Link from "next/link";

import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  EditorialContent,
  adminEditorialContentsStyles,
  editorialContentsSelect,
  firstText,
  formatDateTime,
} from "./_contentForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    created?: string;
    updated?: string;
    archived?: string;
    saved?: string;
    error?: string;
  }>;
};

type ReadEditorialContentsResult = {
  contents: EditorialContent[];
  error: string | null;
};

type ContentStatusView = "active" | "archived";

async function readEditorialContents(statusView: ContentStatusView): Promise<ReadEditorialContentsResult> {
  try {
    const statusFilter =
      statusView === "archived" ? "status=eq.archived" : "or=(status.is.null,status.neq.archived)";
    const contents = await fetchSupabaseAdminTable<EditorialContent>(
      `editorial_contents?select=${editorialContentsSelect}&${statusFilter}&order=published_at.desc.nullslast,created_at.desc.nullslast`,
    );

    return { contents, error: null };
  } catch (error) {
    return {
      contents: [],
      error: error instanceof Error ? error.message : "Nao foi possivel ler public.editorial_contents.",
    };
  }
}

function pageMessage(params: Awaited<NonNullable<PageProps["searchParams"]>>) {
  if (params.created) {
    return "Conteudo criado.";
  }
  if (params.updated) {
    return "Conteudo atualizado.";
  }
  if (params.archived) {
    return "Conteudo arquivado.";
  }
  if (params.saved) {
    return "Conteudo guardado.";
  }

  const messages: Record<string, string> = {
    "missing-title": "Indique um titulo.",
    "missing-slug": "Nao foi possivel gerar um slug.",
    "invalid-status": "Estado invalido.",
    "invalid-scope": "Ambito invalido.",
    "invalid-content-type": "Tipo de conteudo invalido.",
    "invalid-action": "Acao invalida para este formulario.",
    "missing-content": "O conteudo selecionado ja nao existe.",
    "save-failed": "Nao foi possivel guardar o conteudo.",
  };

  return params.error ? messages[params.error] ?? "Nao foi possivel guardar o conteudo." : null;
}

function contentStatusView(params: Awaited<NonNullable<PageProps["searchParams"]>>): ContentStatusView {
  return params.status === "archived" ? "archived" : "active";
}

function Field({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  const displayValue = typeof value === "boolean" ? (value ? "sim" : "nao") : firstText(value);

  return (
    <div className="content-admin-field">
      <dt>{label}</dt>
      <dd>{displayValue || "-"}</dd>
    </div>
  );
}

function PublicStatus({ content }: { content: EditorialContent }) {
  if (content.status === "published" && content.slug) {
    return (
      <Link className="content-admin-edit-link" href={`/conteudos/${encodeURIComponent(content.slug)}`}>
        Ver publico
      </Link>
    );
  }

  const message = content.status === "archived" ? "Arquivado - nao publico" : "Rascunho - sem pagina publica";

  return (
    <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 750, lineHeight: 1.3 }}>
      {message}
    </span>
  );
}

function ContentCard({ content }: { content: EditorialContent }) {
  const mediaUrl = firstText(content.thumbnail_url, content.image_url);
  const title = firstText(content.title, "Conteudo sem titulo");

  return (
    <article className="content-admin-card">
      <div className="content-admin-card-main">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="content-admin-thumb" src={mediaUrl} alt="" />
        ) : (
          <div className="content-admin-thumb content-admin-thumb-empty">Sem media</div>
        )}

        <div className="content-admin-card-copy">
          <div className="content-admin-badges">
            <span>{firstText(content.status, "draft")}</span>
            <span>{firstText(content.content_type, "sem tipo")}</span>
            <span>{firstText(content.scope, "general")}</span>
          </div>

          {content.label ? <p className="content-admin-label">{content.label}</p> : null}
          <h2>{title}</h2>
          {content.subtitle ? <p className="content-admin-subtitle">{content.subtitle}</p> : null}
          {content.summary ? <p className="content-admin-summary">{content.summary}</p> : null}
        </div>
      </div>

      <dl className="content-admin-fields">
        <Field label="Autor" value={content.author} />
        <Field label="Slug" value={content.slug} />
        <Field label="Imagem" value={content.image_url} />
        <Field label="Thumbnail" value={content.thumbnail_url} />
        <Field label="Video URL" value={content.video_url} />
        <Field label="Provider" value={content.video_provider} />
        <Field label="Embed" value={content.embed_url} />
        <Field label="Duracao" value={content.duration} />
        <Field label="Embeddable" value={content.is_embeddable} />
        <Field label="Publicado" value={formatDateTime(content.published_at)} />
        <Field label="Competicao" value={content.competition_id} />
        <Field label="Epoca" value={content.season_id} />
        <Field label="Jornada" value={content.matchday_id} />
      </dl>

      <div className="content-admin-card-actions">
        <PublicStatus content={content} />
        <Link className="content-admin-edit-link" href={`/admin/editorial/conteudos/${content.id}/editar`}>
          Editar
        </Link>
      </div>
    </article>
  );
}

export default async function AdminEditorialContentsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const statusView = contentStatusView(params);
  const [{ contents, error }, message] = await Promise.all([
    readEditorialContents(statusView),
    Promise.resolve(pageMessage(params)),
  ]);
  const isArchivedView = statusView === "archived";

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Reportagens / Videos / Entrevistas</h1>
          <p>
            Conteudos editoriais audiovisuais publicados ou em preparacao. Esta area nao substitui Artigos/Noticias e
            nao alimenta automaticamente as areas fixas de video da Jornada.
          </p>
        </div>

        <Link className="content-admin-primary-action" href="/admin/editorial/conteudos/novo">
          Novo conteudo
        </Link>
      </section>

      <section className="content-admin-notes" aria-label="Notas de arquitetura">
        <p>
          <strong>Separacao:</strong> Artigos/Noticias continuam em <code>editorial_articles</code>. Esta pagina gere
          apenas <code>editorial_contents</code>.
        </p>
        <p>
          <strong>Video da Jornada:</strong> <code>matchday_roundup_items</code>, <code>site_editorial_roundup_items</code>{" "}
          e <code>matchdays.video_url</code> continuam independentes.
        </p>
        <p>
          <strong>Arquivo:</strong> a lista principal mostra rascunhos e publicados. Conteudos arquivados ficam ocultos,
          mas nao sao apagados.
        </p>
      </section>

      <nav className="content-admin-view-tabs" aria-label="Filtro de conteudos">
        <Link className={!isArchivedView ? "active" : undefined} href="/admin/editorial/conteudos">
          Ativos
        </Link>
        <Link className={isArchivedView ? "active" : undefined} href="/admin/editorial/conteudos?status=archived">
          Arquivados
        </Link>
      </nav>

      {message ? <p className="content-admin-alert">{message}</p> : null}
      {error ? <p className="content-admin-alert">{error}</p> : null}

      {contents.length === 0 ? (
        <section className="content-admin-empty">
          <h2>
            {isArchivedView
              ? "Nao existem conteudos editoriais audiovisuais arquivados."
              : "Ainda nao existem conteudos editoriais audiovisuais ativos."}
          </h2>
          <p>
            {isArchivedView
              ? "Conteudos arquivados continuam na base e podem ser editados para voltar a draft ou published."
              : "A criacao/edicao ja esta disponivel nesta area admin."}
          </p>
        </section>
      ) : (
        <section className="content-admin-list" aria-label="Conteudos editoriais audiovisuais">
          {contents.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </section>
      )}
    </main>
  );
}
