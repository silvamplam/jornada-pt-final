import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalContentSubmissions } from "@/lib/portal-escolas/readPortalContentSubmissions";

type ContentSubmissionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Conteúdos | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de conteúdos autorizados no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const contentStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-content-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-content-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-content-hero,
  .portal-content-section,
  .portal-content-warning,
  .portal-content-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-content-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-content-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-content-hero h1,
  .portal-content-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-content-text,
  .portal-content-warning p,
  .portal-content-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-content-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    padding: 8px 10px;
    border: 1px solid #bcd7df;
    border-radius: 999px;
    background: #e8f6f8;
    color: #0f6478;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .portal-content-section,
  .portal-content-warning,
  .portal-content-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-content-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-content-section h2,
  .portal-content-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-content-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-content-scope-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-content-scope-list span,
  .portal-content-filter span,
  .portal-content-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-content-scope-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-content-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(4, minmax(145px, 1fr)) auto auto;
    gap: 12px;
    align-items: end;
    margin-top: 16px;
  }

  .portal-content-filter input,
  .portal-content-filter select {
    width: 100%;
    box-sizing: border-box;
    margin-top: 7px;
    padding: 10px 11px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
  }

  .portal-content-button,
  .portal-content-link-button {
    min-height: 39px;
    padding: 10px 12px;
    border: 1px solid #0f6f8d;
    border-radius: 8px;
    background: #0f6f8d;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .portal-content-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: #cbdce7;
    background: #ffffff;
    color: #0f6f8d;
  }

  .portal-content-table-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 16px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }

  .portal-content-table {
    width: 100%;
    min-width: 1440px;
    border-collapse: collapse;
  }

  .portal-content-table th,
  .portal-content-table td {
    padding: 12px;
    border-bottom: 1px solid #d7e4ed;
    text-align: left;
    vertical-align: top;
  }

  .portal-content-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .portal-content-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-content-table .portal-content-tag {
    white-space: nowrap;
  }

  .portal-content-table td:nth-child(2),
  .portal-content-table td:nth-child(4),
  .portal-content-table td:nth-child(5) {
    white-space: nowrap;
  }

  .portal-content-title strong,
  .portal-content-title span,
  .portal-content-relation span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-content-title span,
  .portal-content-relation span {
    margin-top: 4px;
    color: #667789;
    font-size: 12px;
  }

  .portal-content-muted {
    color: #667789;
  }

  .portal-content-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-content-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-content-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-content-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-content-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  @media (max-width: 1140px) {
    .portal-content-filters {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-content-shell {
      padding: 16px;
    }

    .portal-content-hero,
    .portal-content-filters,
    .portal-content-scope-list {
      grid-template-columns: 1fr;
    }

    .portal-content-hero {
      padding: 22px;
    }
  }
`;

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  validated: "Validado",
  pending_validation: "Pendente de validação",
  draft: "Rascunho",
  scheduled: "Agendado",
  under_review: "Em revisão",
  changes_requested: "Alterações pedidas",
  submitted: "Submetido",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
  published: "Publicado",
  completed: "Concluído",
  gallery: "Galeria",
  demo_gallery: "Galeria",
  article: "Artigo",
  demo_article: "Artigo",
  video: "Vídeo",
  audio: "Áudio",
  image: "Imagem",
  photo: "Fotografia",
  text: "Texto"
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeFilterValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatLabel(value: string | null | undefined, fallback = "Por definir") {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
  const mappedLabel = labelMap[normalized];

  if (mappedLabel) {
    return mappedLabel;
  }

  if (!trimmed.includes("_") && trimmed !== trimmed.toUpperCase()) {
    return trimmed;
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second, "pt"));
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competicoes: "competições",
    conteudos: "conteúdos",
    contextos: "contextos",
    entidades: "entidades",
    jogos: "jogos",
    participantes: "participantes",
    "jornadas/fases": "jornadas/fases"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-content-empty">{message}</p>;
}

export default async function PortalEscolasConteudosPage({ searchParams }: ContentSubmissionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    type: firstParam(params.tipo).trim(),
    status: firstParam(params.estado).trim(),
    stage: firstParam(params.jornada).trim()
  };
  const supabase = await createPortalEscolasServerClient();

  if (!supabase) {
    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?status=not-configured`);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(PORTAL_ESCOLAS_LOGIN_PATH);
  }

  const authorization = await readPortalAuthorization(supabase, user.id);

  if (!authorization.allowed) {
    return (
      <main className="portal-content-shell">
        <style>{contentStyles}</style>
        <div className="portal-content-wrap">
          <section className="portal-content-warning" aria-labelledby="portal-content-warning-title">
            <p className="portal-content-eyebrow">Portal das Escolas</p>
            <h1 id="portal-content-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-content-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalContentSubmissions(supabase, authorization);
  const contentRows = data.submissions.map((content) => ({
    ...content,
    typeLabel: formatLabel(content.type, "Tipo por definir"),
    statusLabel: formatLabel(content.submissionStatus),
    submittedAtLabel: formatDateTime(content.submittedAt, "Sem submissão registada"),
    reviewedAtLabel: formatDateTime(content.reviewedAt, "Ainda não revisto")
  }));
  const filteredContents = contentRows.filter((content) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${content.title} ${content.summary ?? ""}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || content.competitionLabel === filters.competition) &&
      (!filters.type || content.typeLabel === filters.type) &&
      (!filters.status || content.statusLabel === filters.status) &&
      (!filters.stage || content.stageLabel === filters.stage)
    );
  });
  const competitionOptions = uniqueLabels(contentRows.map((content) => content.competitionLabel));
  const typeOptions = uniqueLabels(contentRows.map((content) => content.typeLabel));
  const statusOptions = uniqueLabels(contentRows.map((content) => content.statusLabel));
  const stageOptions = uniqueLabels(contentRows.map((content) => content.stageLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.type || filters.status || filters.stage);

  return (
    <main className="portal-content-shell">
      <style>{contentStyles}</style>
      <div className="portal-content-wrap">
        <section className="portal-content-hero" aria-labelledby="portal-content-title">
          <div>
            <p className="portal-content-eyebrow">Portal das Escolas</p>
            <h1 id="portal-content-title">Conteúdos</h1>
            <p className="portal-content-text">Listagem read-only de conteúdos submetidos para os âmbitos autorizados.</p>
          </div>
          <span className="portal-content-tag">{formatCountLabel(data.submissions.length, "conteúdo", "conteúdos")}</span>
        </section>

        <PortalEscolasInternalNav current="conteudos" />

        <nav className="portal-content-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-content-notice" aria-labelledby="portal-content-notice-title">
            <h2 id="portal-content-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-content-section" aria-labelledby="portal-content-scope-title">
          <div className="portal-content-section-header">
            <div>
              <p className="portal-content-eyebrow">Âmbito ativo</p>
              <h2 id="portal-content-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-content-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-content-scope-list">
            {data.scopes.map((scope) => (
              <li key={scope.id}>
                <span>Entidade</span>
                <strong>{scope.entityLabel}</strong>
                <span>Contexto</span>
                <strong>{scope.contextLabel}</strong>
                <span>Competição</span>
                <strong>{scope.competitionLabel}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-content-section" aria-labelledby="portal-content-list-title">
          <div className="portal-content-section-header">
            <div>
              <p className="portal-content-eyebrow">Submissões</p>
              <h2 id="portal-content-list-title">Conteúdos visíveis</h2>
            </div>
            <span className="portal-content-tag">
              {hasFilters ? `${filteredContents.length} de ${data.submissions.length}` : `${data.submissions.length} total`}
            </span>
          </div>

          <form className="portal-content-filters" method="get">
            <label className="portal-content-filter">
              <span>Pesquisar título/resumo</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Título ou resumo" />
            </label>
            <label className="portal-content-filter">
              <span>Competição</span>
              <select name="competicao" defaultValue={filters.competition}>
                <option value="">Todas</option>
                {competitionOptions.map((competition) => (
                  <option key={competition} value={competition}>
                    {competition}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-content-filter">
              <span>Tipo</span>
              <select name="tipo" defaultValue={filters.type}>
                <option value="">Todos</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-content-filter">
              <span>Estado</span>
              <select name="estado" defaultValue={filters.status}>
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-content-filter">
              <span>Jornada/fase</span>
              <select name="jornada" defaultValue={filters.stage}>
                <option value="">Todas</option>
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-content-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-content-link-button" href="/portal-escolas/conteudos">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredContents.length > 0 ? (
            <div className="portal-content-table-wrap">
              <table className="portal-content-table">
                <thead>
                  <tr>
                    <th>Conteúdo</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Submissão</th>
                    <th>Revisão</th>
                    <th>Competição</th>
                    <th>Jornada/fase</th>
                    <th>Relações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContents.map((content) => (
                    <tr key={content.key}>
                      <td>
                        <div className="portal-content-title">
                          <strong>{content.title}</strong>
                          {content.summary ? <span>{content.summary}</span> : null}
                        </div>
                      </td>
                      <td>{content.typeLabel}</td>
                      <td>
                        <span className="portal-content-tag">{content.statusLabel}</span>
                      </td>
                      <td className={content.submittedAt ? undefined : "portal-content-muted"}>{content.submittedAtLabel}</td>
                      <td className={content.reviewedAt ? undefined : "portal-content-muted"}>{content.reviewedAtLabel}</td>
                      <td className={content.competitionLabel === "Competição não disponível" ? "portal-content-muted" : undefined}>
                        {content.competitionLabel}
                      </td>
                      <td className={content.stageLabel === "Jornada/fase não disponível" ? "portal-content-muted" : undefined}>
                        {content.stageLabel}
                      </td>
                      <td>
                        <div className="portal-content-relation">
                          <span>{content.gameLabel}</span>
                          <span>{content.participantLabel}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.submissions.length > 0
                  ? "Não há conteúdos visíveis com os filtros selecionados."
                  : "Ainda não há conteúdos disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
