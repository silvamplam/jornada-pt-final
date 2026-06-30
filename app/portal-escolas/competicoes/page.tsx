import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalCompetitions } from "@/lib/portal-escolas/readPortalCompetitions";

type CompetitionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Competições | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de competições autorizadas no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const competitionsStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-competitions-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-competitions-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-competitions-hero,
  .portal-competitions-section,
  .portal-competitions-warning,
  .portal-competitions-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-competitions-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-competitions-section,
  .portal-competitions-warning,
  .portal-competitions-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-competitions-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-competitions-hero h1,
  .portal-competitions-warning h1,
  .portal-competitions-section h2,
  .portal-competitions-notice h2 {
    margin: 0;
  }

  .portal-competitions-hero h1,
  .portal-competitions-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-competitions-section h2,
  .portal-competitions-notice h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .portal-competitions-text,
  .portal-competitions-warning p,
  .portal-competitions-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-competitions-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-competitions-actions a,
  .portal-competitions-button,
  .portal-competitions-link-button,
  .portal-competitions-primary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 9px 12px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
  }

  .portal-competitions-button,
  .portal-competitions-primary-link {
    border-color: #0f6f8d;
    background: #0f6f8d;
    color: #ffffff;
  }

  .portal-competitions-tag {
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

  .portal-competitions-section-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-competitions-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-competitions-scope-list li {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-competitions-scope-list span,
  .portal-competitions-filter span,
  .portal-competitions-table th {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-competitions-scope-list strong {
    min-width: 0;
    color: #102033;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .portal-competitions-modality-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .portal-competitions-modality-card {
    display: grid;
    gap: 8px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-competitions-modality-card h3 {
    margin: 0;
    color: #102033;
    font-size: 16px;
    line-height: 1.2;
  }

  .portal-competitions-modality-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .portal-competitions-modality-link {
    justify-self: start;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
  }

  .portal-competitions-filters {
    display: grid;
    grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(135px, 1fr)) auto auto;
    gap: 10px;
    align-items: end;
    margin-bottom: 16px;
  }

  .portal-competitions-filter {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .portal-competitions-filter input,
  .portal-competitions-filter select {
    width: 100%;
    min-height: 38px;
    box-sizing: border-box;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
    font-size: 14px;
    padding: 8px 10px;
  }

  .portal-competitions-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
  }

  .portal-competitions-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    background: #ffffff;
  }

  .portal-competitions-table th,
  .portal-competitions-table td {
    padding: 12px;
    border-bottom: 1px solid #dbe7ef;
    text-align: left;
    vertical-align: top;
  }

  .portal-competitions-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .portal-competitions-table td {
    color: #1b2c3d;
    font-size: 14px;
  }

  .portal-competitions-title {
    display: grid;
    gap: 4px;
  }

  .portal-competitions-title strong {
    overflow-wrap: anywhere;
  }

  .portal-competitions-title span,
  .portal-competitions-muted {
    color: #66778a;
  }

  .portal-competitions-empty {
    margin: 0;
    padding: 16px;
    border: 1px dashed #b8c7d3;
    border-radius: 8px;
    background: #f8fbfd;
    color: #526274;
    font-size: 14px;
    line-height: 1.5;
  }

  .portal-competitions-notice {
    background: #fffaf0;
  }

  .portal-competitions-warning {
    background: #fff8ee;
  }

  @media (max-width: 1040px) {
    .portal-competitions-shell {
      padding: 18px;
    }

    .portal-competitions-hero,
    .portal-competitions-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-competitions-hero h1,
    .portal-competitions-warning h1 {
      font-size: 32px;
    }

    .portal-competitions-scope-list,
    .portal-competitions-modality-grid,
    .portal-competitions-filters {
      grid-template-columns: 1fr;
    }

    .portal-competitions-button,
    .portal-competitions-link-button {
      width: 100%;
    }
  }
`;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeFilterValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  draft: "Rascunho",
  scheduled: "Agendado",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  published: "Publicado",
  archived: "Arquivado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  completed: "Concluído",
  finished: "Concluído",
  in_progress: "Em curso",
  live: "Em curso",
  open: "Aberto",
  closed: "Fechado",
  football: "Futebol",
  futsal: "Futsal",
  basketball: "Basquetebol",
  volleyball: "Voleibol",
  handball: "Andebol",
  multi_sport: "Multimodalidade",
  league: "Liga",
  tournament: "Torneio",
  cup: "Taça",
  group_stage: "Fase de grupos",
  knockout: "Eliminatórias",
  school: "Escola",
  local: "Local",
  regional: "Regional"
};

function formatLabel(value: string | null | undefined, fallback = "Por definir") {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return labelMap[trimmed] ?? trimmed.replace(/[_-]/g, " ");
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((first, second) =>
    first.localeCompare(second, "pt")
  );
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competicoes: "competições",
    contextos: "contextos",
    entidades: "entidades"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-competitions-empty">{message}</p>;
}

type CompetitionDisplayRow = {
  key: string;
  modalityLabel: string;
  modalitySourceLabel: string;
  modalityDetailHref: string | null;
  formalModalityCatalogCode: string | null;
};

function makeModalityGroups(competitions: CompetitionDisplayRow[]) {
  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      sourceLabel: string;
      detailHref: string | null;
      catalogCode: string | null;
      competitionCount: number;
    }
  >();

  competitions.forEach((competition) => {
    const key = competition.modalityDetailHref ?? competition.modalityLabel;
    const existing = groups.get(key);

    if (existing) {
      existing.competitionCount += 1;
      return;
    }

    groups.set(key, {
      key,
      name: competition.modalityLabel,
      sourceLabel: competition.modalitySourceLabel,
      detailHref: competition.modalityDetailHref,
      catalogCode: competition.formalModalityCatalogCode,
      competitionCount: 1
    });
  });

  return Array.from(groups.values()).sort((first, second) => first.name.localeCompare(second.name, "pt"));
}

export default async function PortalEscolasCompeticoesPage({ searchParams }: CompetitionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    context: firstParam(params.contexto).trim(),
    status: firstParam(params.estado).trim(),
    modality: firstParam(params.modalidade).trim(),
    format: firstParam(params.formato).trim()
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
      <main className="portal-competitions-shell">
        <style>{competitionsStyles}</style>
        <div className="portal-competitions-wrap">
          <section className="portal-competitions-warning" aria-labelledby="portal-competitions-warning-title">
            <p className="portal-competitions-eyebrow">Portal das Escolas</p>
            <h1 id="portal-competitions-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-competitions-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalCompetitions(supabase, authorization);
  const competitionRows = data.competitions.map((competition) => {
    const hasFormalModality = Boolean(competition.formalModalityName);
    const modalityLabel = formatLabel(competition.formalModalityName ?? competition.modality, "Modalidade por definir");

    return {
      ...competition,
      modalityLabel,
      legacyModalityLabel: formatLabel(competition.modality, "Sem modalidade legacy"),
      modalitySourceLabel: hasFormalModality
        ? "Modalidade formal"
        : competition.modality
          ? "Compatibilidade legacy"
          : "Por definir",
      modalityDetailHref: competition.formalModalitySlug ? `/portal-escolas/modalidades/${competition.formalModalitySlug}` : null,
      modalityMetaLabels: [
        competition.formalModalityCatalogCode ? `catálogo: ${competition.formalModalityCatalogCode}` : null,
        competition.formalModalityLocalCode ? `código local: ${competition.formalModalityLocalCode}` : null,
        !hasFormalModality && competition.modality ? `legacy: ${competition.modality}` : null
      ].filter((value): value is string => Boolean(value)),
      formatLabel: formatLabel(competition.format, "Formato por definir"),
      scopeLabel: formatLabel(competition.scope, "Âmbito por definir"),
      statusLabel: formatLabel(competition.status),
      hasModality: Boolean(competition.formalModalityName || competition.modality)
    };
  });
  const filteredCompetitions = competitionRows.filter((competition) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(
      `${competition.name} ${competition.modalityLabel} ${competition.legacyModalityLabel} ${competition.formalModalityCatalogCode ?? ""} ${competition.formatLabel}`
    );

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.context || competition.contextLabel === filters.context) &&
      (!filters.status || competition.statusLabel === filters.status) &&
      (!filters.modality || competition.modalityLabel === filters.modality) &&
      (!filters.format || competition.formatLabel === filters.format)
    );
  });
  const contextOptions = uniqueLabels(competitionRows.map((competition) => competition.contextLabel));
  const statusOptions = uniqueLabels(competitionRows.map((competition) => competition.statusLabel));
  const modalityOptions = uniqueLabels(competitionRows.map((competition) => competition.modalityLabel));
  const formatOptions = uniqueLabels(competitionRows.map((competition) => competition.formatLabel));
  const modalityGroups = makeModalityGroups(competitionRows);
  const hasFilters = Boolean(filters.search || filters.context || filters.status || filters.modality || filters.format);

  return (
    <main className="portal-competitions-shell">
      <style>{competitionsStyles}</style>
      <div className="portal-competitions-wrap">
        <section className="portal-competitions-hero" aria-labelledby="portal-competitions-title">
          <div>
            <p className="portal-competitions-eyebrow">Portal das Escolas</p>
            <h1 id="portal-competitions-title">Competições</h1>
            <p className="portal-competitions-text">
              Escolhe a competição associada à tua entidade e contexto para abrir eventos, resultados e classificação/ranking num só detalhe.
            </p>
          </div>
          <span className="portal-competitions-tag">{formatCountLabel(data.competitions.length, "competição", "competições")}</span>
        </section>

        <PortalEscolasInternalNav current="competicoes" />

        <nav className="portal-competitions-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-competitions-notice" aria-labelledby="portal-competitions-notice-title">
            <h2 id="portal-competitions-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-competitions-section" aria-labelledby="portal-competitions-scope-title">
          <div className="portal-competitions-section-header">
            <div>
              <p className="portal-competitions-eyebrow">Âmbito ativo</p>
              <h2 id="portal-competitions-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-competitions-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-competitions-scope-list">
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

        <section className="portal-competitions-section" aria-labelledby="portal-competitions-by-modality-title">
          <div className="portal-competitions-section-header">
            <div>
              <p className="portal-competitions-eyebrow">Eixo formal</p>
              <h2 id="portal-competitions-by-modality-title">Competições por modalidade</h2>
              <p className="portal-competitions-text">
                Agrupamento read-only com prioridade à ligação formal da competição à modalidade. O campo legacy mantém-se apenas
                como compatibilidade.
              </p>
            </div>
            <span className="portal-competitions-tag">
              {formatCountLabel(
                data.formalModalityCount > 0 ? data.formalModalityCount : modalityGroups.length,
                data.formalModalityCount > 0 ? "modalidade formal" : "modalidade",
                data.formalModalityCount > 0 ? "modalidades formais" : "modalidades"
              )}
            </span>
          </div>

          {modalityGroups.length > 0 ? (
            <div className="portal-competitions-modality-grid">
              {modalityGroups.map((group) => (
                <article className="portal-competitions-modality-card" key={group.key}>
                  <div>
                    <p className="portal-competitions-eyebrow">{group.sourceLabel}</p>
                    <h3>{group.name}</h3>
                  </div>
                  <div className="portal-competitions-modality-meta">
                    <span className="portal-competitions-tag">
                      {formatCountLabel(group.competitionCount, "competição", "competições")}
                    </span>
                    {group.catalogCode ? <span className="portal-competitions-tag">catálogo: {group.catalogCode}</span> : null}
                  </div>
                  {group.detailHref ? (
                    <a className="portal-competitions-modality-link" href={group.detailHref}>
                      Abrir detalhe da modalidade
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="Ainda não há modalidades associadas às competições visíveis." />
          )}
        </section>

        <section className="portal-competitions-section" aria-labelledby="portal-competitions-list-title">
          <div className="portal-competitions-section-header">
            <div>
              <p className="portal-competitions-eyebrow">Âmbito competitivo</p>
              <h2 id="portal-competitions-list-title">Competições visíveis</h2>
            </div>
            <span className="portal-competitions-tag">
              {hasFilters ? `${filteredCompetitions.length} de ${data.competitions.length}` : `${data.competitions.length} total`}
            </span>
          </div>

          <form className="portal-competitions-filters" method="get">
            <label className="portal-competitions-filter">
              <span>Pesquisar competição</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Nome, modalidade ou formato" />
            </label>
            <label className="portal-competitions-filter">
              <span>Contexto</span>
              <select name="contexto" defaultValue={filters.context}>
                <option value="">Todos</option>
                {contextOptions.map((context) => (
                  <option key={context} value={context}>
                    {context}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-competitions-filter">
              <span>Modalidade</span>
              <select name="modalidade" defaultValue={filters.modality}>
                <option value="">Todas</option>
                {modalityOptions.map((modality) => (
                  <option key={modality} value={modality}>
                    {modality}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-competitions-filter">
              <span>Formato</span>
              <select name="formato" defaultValue={filters.format}>
                <option value="">Todos</option>
                {formatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-competitions-filter">
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
            <button className="portal-competitions-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-competitions-link-button" href="/portal-escolas/competicoes">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredCompetitions.length > 0 ? (
            <div className="portal-competitions-table-wrap">
              <table className="portal-competitions-table">
                <thead>
                  <tr>
                    <th>Competição</th>
                    <th>Contexto</th>
                    <th>Modalidade</th>
                    <th>Formato</th>
                    <th>Âmbito</th>
                    <th>Estado</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompetitions.map((competition) => (
                    <tr key={competition.key}>
                      <td>
                        <div className="portal-competitions-title">
                          <strong>{competition.name}</strong>
                          <span>{competition.entityLabel}</span>
                        </div>
                      </td>
                      <td>{competition.contextLabel}</td>
                      <td className={competition.hasModality ? undefined : "portal-competitions-muted"}>
                        <div className="portal-competitions-title">
                          <strong>{competition.modalityLabel}</strong>
                          <span>{competition.modalitySourceLabel}</span>
                          {competition.modalityMetaLabels.length > 0 ? (
                            <span>{competition.modalityMetaLabels.join(" · ")}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className={competition.format ? undefined : "portal-competitions-muted"}>{competition.formatLabel}</td>
                      <td className={competition.scope ? undefined : "portal-competitions-muted"}>{competition.scopeLabel}</td>
                      <td>
                        <span className="portal-competitions-tag">{competition.statusLabel}</span>
                      </td>
                      <td>
                        {competition.slug ? (
                          <a className="portal-competitions-primary-link" href={`/portal-escolas/competicoes/${competition.slug}`}>
                            Abrir competição
                          </a>
                        ) : (
                          <span className="portal-competitions-muted">Sem detalhe</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.competitions.length > 0
                  ? "Não há competições visíveis com os filtros selecionados."
                  : "Ainda não há competições disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
