import Link from "next/link";

import {
  getEditorialPublishedSources,
  type EditorialPublishedSource,
} from "@/lib/editorial-published-sources";

import { adminEditorialContentsStyles, firstText } from "../_contentForm";

export const dynamic = "force-dynamic";

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

function SourceField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="content-admin-field">
      <dt>{label}</dt>
      <dd>{firstText(value) || "-"}</dd>
    </div>
  );
}

function SourceCard({ source }: { source: EditorialPublishedSource }) {
  const subtitle = firstText(source.subtitle, source.summary);

  return (
    <article className="content-admin-card">
      <div className="content-admin-card-main">
        {firstText(source.thumbnail_url, source.image_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="content-admin-thumb" src={firstText(source.thumbnail_url, source.image_url)} alt="" />
        ) : (
          <div className="content-admin-thumb content-admin-thumb-empty">Sem media</div>
        )}

        <div className="content-admin-card-copy">
          <div className="content-admin-badges">
            <span>{source.origin_label}</span>
            <span>{source.source_type}</span>
            <span>{source.content_type}</span>
            <span>{source.media_kind}</span>
          </div>

          {source.label ? <p className="content-admin-label">{source.label}</p> : null}
          <h2>{source.title}</h2>
          {subtitle ? <p className="content-admin-subtitle">{subtitle}</p> : null}
        </div>
      </div>

      <dl className="content-admin-fields">
        <SourceField label="Source type" value={source.source_type} />
        <SourceField label="Source id" value={source.source_id} />
        <SourceField label="Slug" value={source.source_slug} />
        <SourceField label="Link publico" value={source.link_url} />
        <SourceField label="Media" value={source.media_kind} />
        <SourceField label="Publicado" value={formatDateTime(source.published_at)} />
        <SourceField label="Imagem" value={source.image_url} />
        <SourceField label="Thumbnail" value={source.thumbnail_url} />
        <SourceField label="Video URL" value={source.video_url} />
        <SourceField label="Embed" value={source.embed_url} />
        <SourceField label="Duracao" value={source.duration} />
      </dl>

      <div className="content-admin-card-actions">
        <Link className="content-admin-edit-link" href={source.link_url}>
          Abrir publico
        </Link>
      </div>
    </article>
  );
}

export default async function AdminEditorialPublishedSourcesPage() {
  const sources = await getEditorialPublishedSources();
  const articleCount = sources.filter((source) => source.source_type === "article").length;
  const editorialContentCount = sources.filter((source) => source.source_type === "editorial_content").length;

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Fontes publicadas</h1>
          <p>
            Lista read-only normalizada de artigos/noticias e conteudos editoriais publicados. Ainda nao cria seletores,
            snapshots ou ligacoes a zonas editoriais.
          </p>
        </div>

        <Link className="content-admin-primary-action" href="/admin/editorial/conteudos">
          Voltar
        </Link>
      </section>

      <section className="content-admin-notes" aria-label="Notas de arquitetura">
        <p>
          <strong>Read-only:</strong> esta pagina apenas lista fontes publicadas de <code>editorial_articles</code> e{" "}
          <code>editorial_contents</code>.
        </p>
        <p>
          <strong>Contagem:</strong> artigos publicados: {articleCount}. Conteudos editoriais publicados:{" "}
          {editorialContentCount}. Total de fontes: {sources.length}.
        </p>
        <p>
          <strong>Sem zonas:</strong> nao associa conteudos a Home, Editorial da Jornada, Composicao, Manchete,
          Destaques, Zona Final ou Complemento.
        </p>
      </section>

      {sources.length === 0 ? (
        <section className="content-admin-empty">
          <h2>Nao existem fontes editoriais publicadas.</h2>
          <p>Assim que houver artigos ou conteudos editoriais published, eles aparecem nesta lista normalizada.</p>
        </section>
      ) : (
        <section className="content-admin-list" aria-label="Fontes editoriais publicadas">
          {sources.map((source) => (
            <SourceCard key={`${source.source_type}-${source.source_id}`} source={source} />
          ))}
        </section>
      )}
    </main>
  );
}
