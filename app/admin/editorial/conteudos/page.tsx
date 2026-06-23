import Link from "next/link";

import {
  countEditorialCompetitionItems,
  countEditorialSeasonItems,
  groupEditorialSidebarItems,
  type EditorialSidebarContext,
  type EditorialSidebarItem,
} from "@/lib/groupEditorialSidebarItems";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  type EditorialContent,
  type EditorialContentCompetition,
  type EditorialContentMatchday,
  type EditorialContentSeason,
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

type ContentContextLookups = {
  competitions: Map<string, string>;
  seasons: Map<string, string>;
  matchdays: Map<string, string>;
  seasonCompetitionIds: Map<string, string | null>;
  matchdaySeasonIds: Map<string, string | null>;
};

type ContentStatusView = "active" | "archived";

const editorialNavigationLinks = [
  { href: "/admin/editorial/home", label: "HOME EDITORIAL" },
  { href: "/admin/editorial/artigos", label: "ARTIGOS / NOTÍCIAS" },
  { href: "/admin/editorial/jornada", label: "EDITORIAL DA JORNADA" },
  { href: "/admin/editorial/composicao", label: "COMPOSIÇÃO EDITORIAL" },
  { href: "/admin/gestor", label: "CENTRO DE GESTÃO" },
  { href: "/admin", label: "BACKOFFICE" },
];

const contentSidebarStyles = `
  .content-admin-sidebar {
    display: grid;
    gap: 12px;
  }

  .content-admin-sidebar-groups {
    display: grid;
    gap: 10px;
  }

  .content-admin-sidebar-group,
  .content-admin-sidebar-subgroup,
  .content-admin-sidebar-leaf {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
  }

  .content-admin-sidebar-subgroup,
  .content-admin-sidebar-leaf {
    margin: 10px 12px;
  }

  .content-admin-sidebar-group summary,
  .content-admin-sidebar-subgroup summary,
  .content-admin-sidebar-leaf summary {
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    color: #111827;
    font-size: 13px;
    font-weight: 850;
    list-style: none;
  }

  .content-admin-sidebar-group summary::-webkit-details-marker,
  .content-admin-sidebar-subgroup summary::-webkit-details-marker,
  .content-admin-sidebar-leaf summary::-webkit-details-marker {
    display: none;
  }

  .content-admin-sidebar-count {
    border-radius: 999px;
    background: #f3f4f6;
    padding: 3px 8px;
    color: #4b5563;
    font-size: 11px;
    font-weight: 850;
  }

  .content-admin-sidebar-list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0 12px 12px;
    list-style: none;
  }
`;

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

async function readContentContextLookups(): Promise<ContentContextLookups> {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<EditorialContentCompetition>(
      "competitions?select=id,name,slug&order=name.asc",
    ).catch(() => []),
    fetchSupabaseAdminTable<EditorialContentSeason>(
      "seasons?select=id,label,competition_id&order=label.desc",
    ).catch(() => []),
    fetchSupabaseAdminTable<EditorialContentMatchday>(
      "matchdays?select=id,season_id,number,label&order=number.asc",
    ).catch(() => []),
  ]);

  return {
    competitions: new Map(
      competitions.map((competition) => [
        competition.id,
        firstText(competition.name, competition.slug, "Competicao sem nome") ?? "Competicao sem nome",
      ] as [string, string]),
    ),
    seasons: new Map(
      seasons.map((season) => [season.id, firstText(season.label, "Epoca sem nome") ?? "Epoca sem nome"] as [string, string]),
    ),
    matchdays: new Map(matchdays.map((matchday) => [matchday.id, matchdayDisplayLabel(matchday)] as [string, string])),
    seasonCompetitionIds: new Map(seasons.map((season) => [season.id, season.competition_id] as [string, string | null])),
    matchdaySeasonIds: new Map(matchdays.map((matchday) => [matchday.id, matchday.season_id] as [string, string | null])),
  };
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

function matchdayDisplayLabel(matchday: EditorialContentMatchday) {
  const number = Number.isFinite(matchday.number) ? `J${String(matchday.number).padStart(2, "0")}` : "";
  return [number, matchday.label].filter(Boolean).join(" - ") || "Jornada sem nome";
}

function lookupContentContextLabel(id: string | null | undefined, lookup: Map<string, string>, missingLabel: string) {
  if (!id) {
    return null;
  }

  return lookup.get(id) ?? missingLabel;
}

function readableContentScope(content: EditorialContent, context: EditorialSidebarContext) {
  if (content.matchday_id) return "matchday";
  const storedScope = firstText(content.scope);
  if (storedScope === "competition" || storedScope === "matchday") return storedScope;
  return context.competitionId ? "competition" : "general";
}

function resolveContentContext(content: EditorialContent, lookups: ContentContextLookups): EditorialSidebarContext {
  const matchdayId = content.matchday_id;
  const seasonId = matchdayId ? lookups.matchdaySeasonIds.get(matchdayId) ?? content.season_id : content.season_id;
  const competitionId = seasonId ? lookups.seasonCompetitionIds.get(seasonId) ?? content.competition_id : content.competition_id;
  const hasAnyContext = Boolean(content.matchday_id || content.season_id || content.competition_id);
  const context = {
    competitionId: competitionId ?? null,
    seasonId: seasonId ?? null,
    matchdayId: matchdayId ?? null,
    competitionLabel:
      lookupContentContextLabel(competitionId, lookups.competitions, "Contexto incompleto") ??
      (hasAnyContext ? "Contexto incompleto" : "Sem competicao associada"),
    seasonLabel:
      lookupContentContextLabel(seasonId, lookups.seasons, "Contexto incompleto") ??
      (hasAnyContext ? "Contexto incompleto" : "Sem epoca associada"),
    matchdayLabel:
      lookupContentContextLabel(matchdayId, lookups.matchdays, "Contexto incompleto") ??
      (content.matchday_id ? "Contexto incompleto" : "Sem jornada associada"),
    scopeLabel: null,
  };

  return { ...context, scopeLabel: readableContentScope(content, context) };
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

function ContentCard({ content, lookups }: { content: EditorialContent; lookups: ContentContextLookups }) {
  const mediaUrl = firstText(content.thumbnail_url, content.image_url);
  const title = firstText(content.title, "Conteudo sem titulo");
  const competitionLabel = lookupContentContextLabel(
    content.competition_id,
    lookups.competitions,
    "Competicao nao encontrada",
  );
  const seasonLabel = lookupContentContextLabel(content.season_id, lookups.seasons, "Epoca nao encontrada");
  const matchdayLabel = lookupContentContextLabel(content.matchday_id, lookups.matchdays, "Jornada nao encontrada");

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
        <Field label="Competicao" value={competitionLabel} />
        <Field label="Epoca" value={seasonLabel} />
        <Field label="Jornada" value={matchdayLabel} />
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
  const [{ contents, error }, lookups, message] = await Promise.all([
    readEditorialContents(statusView),
    readContentContextLookups(),
    Promise.resolve(pageMessage(params)),
  ]);
  const isArchivedView = statusView === "archived";
  const groupedContents = groupEditorialSidebarItems(
    contents.map((content): EditorialSidebarItem<EditorialContent> => ({
      item: content,
      context: resolveContentContext(content, lookups),
    })),
  );
  const renderContentItem = (entry: EditorialSidebarItem<EditorialContent>) => (
    <li key={entry.item.id}>
      <ContentCard content={entry.item} lookups={lookups} />
    </li>
  );

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>
      <style>{contentSidebarStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Reportagens / Videos / Entrevistas</h1>
          <p>
            Conteudos editoriais audiovisuais publicados ou em preparacao. Esta area nao substitui Artigos/Noticias e
            nao alimenta automaticamente as areas fixas de video da Jornada.
          </p>
          <nav
            aria-label="Navegacao editorial"
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}
          >
            {editorialNavigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.38)",
                  borderRadius: 8,
                  color: "#fff",
                  display: "inline-flex",
                  fontSize: 12,
                  fontWeight: 800,
                  justifyContent: "center",
                  minHeight: 34,
                  padding: "0 12px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link className="content-admin-primary-action" href="/admin/editorial/conteudos/novo">
          Novo conteúdo
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
        <section className="content-admin-sidebar" aria-label="Conteudos editoriais audiovisuais">
          <div className="content-admin-sidebar-groups">
            {groupedContents.generalItems.length > 0 ? (
              <details className="content-admin-sidebar-group" open>
                <summary>
                  <span>Gerais</span>
                  <span className="content-admin-sidebar-count">{groupedContents.generalItems.length}</span>
                </summary>
                <ul className="content-admin-sidebar-list">
                  {groupedContents.generalItems.map(renderContentItem)}
                </ul>
              </details>
            ) : null}

            {groupedContents.competitionGroups.map((competitionGroup) => (
              <details className="content-admin-sidebar-group" key={competitionGroup.key}>
                <summary>
                  <span>{competitionGroup.label}</span>
                  <span className="content-admin-sidebar-count">{countEditorialCompetitionItems(competitionGroup)}</span>
                </summary>
                {competitionGroup.seasonGroups.map((seasonGroup) => (
                  <details className="content-admin-sidebar-subgroup" key={seasonGroup.key}>
                    <summary>
                      <span>{seasonGroup.label}</span>
                      <span className="content-admin-sidebar-count">{countEditorialSeasonItems(seasonGroup)}</span>
                    </summary>
                    {seasonGroup.matchdayGroups.map((matchdayGroup) => (
                      <details className="content-admin-sidebar-leaf" key={matchdayGroup.key}>
                        <summary>
                          <span>{matchdayGroup.label}</span>
                          <span className="content-admin-sidebar-count">{matchdayGroup.items.length}</span>
                        </summary>
                        <ul className="content-admin-sidebar-list">
                          {matchdayGroup.items.map(renderContentItem)}
                        </ul>
                      </details>
                    ))}
                  </details>
                ))}
              </details>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
