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
    created?: string;
    saved?: string;
    error?: string;
  }>;
};

type ReadEditorialContentsResult = {
  contents: EditorialContent[];
  error: string | null;
};

async function readEditorialContents(): Promise<ReadEditorialContentsResult> {
  try {
    const contents = await fetchSupabaseAdminTable<EditorialContent>(
      `editorial_contents?select=${editorialContentsSelect}&order=published_at.desc.nullslast,created_at.desc.nullslast`,
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
  if (params.saved) {
    return "Conteudo guardado.";
  }

  const messages: Record<string, string> = {
    "missing-title": "Indique um titulo.",
    "missing-slug": "Nao foi possivel gerar um slug.",
    "invalid-status": "Estado invalido.",
    "invalid-scope": "Ambito invalido.",
    "invalid-content-type": "Tipo de conteudo invalido.",
    "missing-content": "O conteudo selecionado ja nao existe.",
    "save-failed": "Nao foi possivel guardar o conteudo.",
  };

  return params.error ? messages[params.error] ?? "Nao foi possivel guardar o conteudo." : null;
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
        <Link className="content-admin-edit-link" href={`/admin/editorial/conteudos/${content.id}/editar`}>
          Editar
        </Link>
      </div>
    </article>
  );
}

export default async function AdminEditorialContentsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ contents, error }, message] = await Promise.all([readEditorialContents(), Promise.resolve(pageMessage(params))]);

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
      </section>

      {message ? <p className="content-admin-alert">{message}</p> : null}
      {error ? <p className="content-admin-alert">{error}</p> : null}

      {contents.length === 0 ? (
        <section className="content-admin-empty">
          <h2>Ainda nao existem conteudos editoriais audiovisuais.</h2>
          <p>A criacao/edicao ja esta disponivel nesta area admin.</p>
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
