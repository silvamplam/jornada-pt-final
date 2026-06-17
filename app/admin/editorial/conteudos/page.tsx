import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type EditorialContent = {
  id: string;
  slug: string | null;
  status: string | null;
  scope: string | null;
  content_type: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  author: string | null;
  image_url: string | null;
  image_caption: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  embed_url: string | null;
  duration: string | null;
  is_embeddable: boolean | null;
  published_at: string | null;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReadEditorialContentsResult = {
  contents: EditorialContent[];
  error: string | null;
};

const editorialContentsSelect = [
  "id",
  "slug",
  "status",
  "scope",
  "content_type",
  "label",
  "title",
  "subtitle",
  "summary",
  "body",
  "author",
  "image_url",
  "image_caption",
  "thumbnail_url",
  "video_url",
  "video_provider",
  "embed_url",
  "duration",
  "is_embeddable",
  "published_at",
  "competition_id",
  "season_id",
  "matchday_id",
  "created_at",
  "updated_at",
].join(",");

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

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleanValue = value?.trim();
    if (cleanValue) {
      return cleanValue;
    }
  }

  return "";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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
    </article>
  );
}

export default async function AdminEditorialContentsPage() {
  const { contents, error } = await readEditorialContents();

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

        <span className="content-admin-disabled-action" aria-disabled="true">
          Novo conteudo - em fase futura
        </span>
      </section>

      <section className="content-admin-notes" aria-label="Notas de arquitetura">
        <p>
          <strong>Separacao:</strong> Artigos/Noticias continuam em <code>editorial_articles</code>. Esta pagina le
          apenas <code>editorial_contents</code>.
        </p>
        <p>
          <strong>Video da Jornada:</strong> <code>matchday_roundup_items</code>, <code>site_editorial_roundup_items</code>{" "}
          e <code>matchdays.video_url</code> continuam independentes.
        </p>
      </section>

      {error ? <p className="content-admin-alert">{error}</p> : null}

      {contents.length === 0 ? (
        <section className="content-admin-empty">
          <h2>Ainda nao existem conteudos editoriais audiovisuais.</h2>
          <p>A criacao/edicao sera adicionada numa fase futura.</p>
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

const adminEditorialContentsStyles = `
  .content-admin-shell {
    min-height: 100vh;
    background: #f4f6f8;
    color: #111827;
    padding: 32px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .content-admin-header,
  .content-admin-notes,
  .content-admin-empty,
  .content-admin-card,
  .content-admin-alert {
    max-width: 1180px;
    margin: 0 auto;
  }

  .content-admin-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 18px;
    border-radius: 10px;
    background: #10151b;
    color: #fff;
    padding: 26px;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.14);
  }

  .content-admin-eyebrow,
  .content-admin-label {
    margin: 0 0 8px;
    color: #d71920;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .content-admin-header h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.08;
  }

  .content-admin-header p {
    max-width: 760px;
    margin: 10px 0 0;
    color: #cbd5e1;
    line-height: 1.55;
  }

  .content-admin-disabled-action {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 8px;
    padding: 0 14px;
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
  }

  .content-admin-notes {
    display: grid;
    gap: 10px;
    margin-bottom: 18px;
  }

  .content-admin-notes p,
  .content-admin-alert,
  .content-admin-empty,
  .content-admin-card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
  }

  .content-admin-notes p {
    margin: 0;
    padding: 12px 14px;
    color: #374151;
    line-height: 1.5;
  }

  .content-admin-notes code {
    border-radius: 5px;
    background: #f3f4f6;
    padding: 2px 5px;
    color: #111827;
    font-size: 12px;
  }

  .content-admin-alert {
    margin-bottom: 18px;
    padding: 14px;
    border-color: #fecaca;
    background: #fff1f2;
    color: #991b1b;
    font-size: 13px;
    font-weight: 700;
  }

  .content-admin-empty {
    padding: 34px 26px;
    text-align: center;
  }

  .content-admin-empty h2 {
    margin: 0;
    font-size: 22px;
  }

  .content-admin-empty p {
    margin: 8px 0 0;
    color: #6b7280;
  }

  .content-admin-list {
    display: grid;
    gap: 16px;
  }

  .content-admin-card {
    padding: 18px;
  }

  .content-admin-card-main {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }

  .content-admin-thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    object-fit: cover;
    background: #e5e7eb;
  }

  .content-admin-thumb-empty {
    display: grid;
    place-items: center;
    color: #6b7280;
    font-size: 12px;
    font-weight: 800;
  }

  .content-admin-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .content-admin-badges span {
    border-radius: 999px;
    background: #f3f4f6;
    padding: 5px 8px;
    color: #374151;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .content-admin-card h2 {
    margin: 0;
    font-size: 24px;
    line-height: 1.18;
  }

  .content-admin-subtitle,
  .content-admin-summary {
    margin: 8px 0 0;
    color: #4b5563;
    line-height: 1.5;
  }

  .content-admin-fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 18px 0 0;
  }

  .content-admin-field {
    min-width: 0;
    border-radius: 8px;
    background: #f9fafb;
    padding: 10px;
  }

  .content-admin-field dt {
    margin: 0 0 4px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .content-admin-field dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: #111827;
    font-size: 13px;
    line-height: 1.4;
  }

  @media (max-width: 860px) {
    .content-admin-shell {
      padding: 18px;
    }

    .content-admin-header {
      display: grid;
    }

    .content-admin-card-main,
    .content-admin-fields {
      grid-template-columns: 1fr;
    }
  }
`;
