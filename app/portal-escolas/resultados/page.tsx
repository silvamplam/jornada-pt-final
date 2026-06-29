import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalResults } from "@/lib/portal-escolas/readPortalResults";

type ResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Resultados | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de resultados por evento e participante no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const resultsStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-results-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-results-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-results-hero,
  .portal-results-section,
  .portal-results-warning,
  .portal-results-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-results-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-results-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-results-hero h1,
  .portal-results-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-results-text,
  .portal-results-warning p,
  .portal-results-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-results-tag {
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

  .portal-results-section,
  .portal-results-warning,
  .portal-results-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-results-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-results-section h2,
  .portal-results-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-results-scope-list,
  .portal-results-model-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-results-scope-list li,
  .portal-results-model-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-results-scope-list span,
  .portal-results-model-list span,
  .portal-results-filter span,
  .portal-results-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-results-scope-list strong,
  .portal-results-model-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-results-model-list p {
    margin: 8px 0 0;
    color: #526274;
    font-size: 13px;
    line-height: 1.45;
  }

  .portal-results-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(4, minmax(135px, 1fr)) auto auto;
    gap: 12px;
    align-items: end;
    margin-top: 16px;
  }

  .portal-results-filter input,
  .portal-results-filter select {
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

  .portal-results-button,
  .portal-results-link-button {
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

  .portal-results-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: #cbdce7;
    background: #ffffff;
    color: #0f6f8d;
  }

  .portal-results-table-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 16px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }

  .portal-results-table {
    width: 100%;
    min-width: 1380px;
    border-collapse: collapse;
  }

  .portal-results-table th,
  .portal-results-table td {
    padding: 12px;
    border-bottom: 1px solid #d7e4ed;
    text-align: left;
    vertical-align: top;
  }

  .portal-results-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .portal-results-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-results-table a {
    color: #0f6f8d;
    font-weight: 900;
    text-decoration: none;
  }

  .portal-results-table .portal-results-tag {
    white-space: nowrap;
  }

  .portal-results-table td:nth-child(5),
  .portal-results-table td:nth-child(6),
  .portal-results-table td:nth-child(7),
  .portal-results-table td:nth-child(8),
  .portal-results-table td:nth-child(9) {
    white-space: nowrap;
  }

  .portal-results-record strong,
  .portal-results-record span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-results-record span {
    margin-top: 4px;
    color: #667789;
    font-size: 12px;
  }

  .portal-results-muted {
    color: #667789;
  }

  .portal-results-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-results-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-results-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-results-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-results-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  @media (max-width: 1020px) {
    .portal-results-filters,
    .portal-results-scope-list,
    .portal-results-model-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-results-shell {
      padding: 16px;
    }

    .portal-results-hero,
    .portal-results-filters,
    .portal-results-scope-list,
    .portal-results-model-list {
      grid-template-columns: 1fr;
    }

    .portal-results-hero {
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
  submitted: "Submetido",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
  completed: "Concluído",
  finished: "Concluído",
  in_progress: "Em curso",
  live: "Em curso",
  no_result: "Sem resultado",
  mixed: "Misto",
  unknown: "Não disponível",
  match: "Jogo",
  game: "Jogo",
  race: "Prova/corrida",
  heat: "Série",
  field_event: "Prova técnica"
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

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Por definir";
  }

  const trimmed = value.trim();
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

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second, "pt"));
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competições: "competições",
    contextos: "contextos",
    entidades: "entidades",
    eventos: "eventos",
    participantes: "participantes",
    "participantes de evento": "participantes de evento",
    "resultados por participante": "resultados por participante",
    "estrutura competitiva": "estrutura competitiva"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-results-empty">{message}</p>;
}

export default async function PortalEscolasResultadosPage({ searchParams }: ResultsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    structure: firstParam(params.estrutura).trim(),
    eventType: firstParam(params.tipo).trim(),
    status: firstParam(params.estado).trim()
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
      <main className="portal-results-shell">
        <style>{resultsStyles}</style>
        <div className="portal-results-wrap">
          <section className="portal-results-warning" aria-labelledby="portal-results-warning-title">
            <p className="portal-results-eyebrow">Portal das Escolas</p>
            <h1 id="portal-results-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-results-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalResults(supabase, authorization);
  const resultRows = data.results.map((result) => ({
    ...result,
    resultStatusLabel: formatLabel(result.resultStatus),
    eventStatusLabel: formatLabel(result.eventStatus)
  }));
  const filteredResults = resultRows.filter((result) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${result.eventLabel} ${result.participantLabel} ${result.scoreLabel} ${result.outcomeLabel}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || result.competitionLabel === filters.competition) &&
      (!filters.structure || result.stageLabel === filters.structure) &&
      (!filters.eventType || result.eventTypeLabel === filters.eventType) &&
      (!filters.status || result.resultStatusLabel === filters.status)
    );
  });
  const competitionOptions = uniqueLabels(resultRows.map((result) => result.competitionLabel));
  const structureOptions = uniqueLabels(resultRows.map((result) => result.stageLabel));
  const eventTypeOptions = uniqueLabels(resultRows.map((result) => result.eventTypeLabel));
  const statusOptions = uniqueLabels(resultRows.map((result) => result.resultStatusLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.structure || filters.eventType || filters.status);

  return (
    <main className="portal-results-shell">
      <style>{resultsStyles}</style>
      <div className="portal-results-wrap">
        <section className="portal-results-hero" aria-labelledby="portal-results-title">
          <div>
            <p className="portal-results-eyebrow">Portal das Escolas · Resultados</p>
            <h1 id="portal-results-title">Resultados</h1>
            <p className="portal-results-text">
              Leitura read-only dos resultados por evento e participante. A rota mantém-se em /portal-escolas/resultados,
              mas a leitura passa a seguir o modelo multidesporto.
            </p>
          </div>
          <span className="portal-results-tag">{formatCountLabel(data.summary.resultEntryCount, "resultado", "resultados")}</span>
        </section>

        <PortalEscolasInternalNav current="resultados" />

        <nav className="portal-results-actions" aria-label="Ações contextuais dos resultados">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-results-notice" aria-labelledby="portal-results-notice-title">
            <h2 id="portal-results-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados: {" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-results-section" aria-labelledby="portal-results-model-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Modelo multidesporto</p>
              <h2 id="portal-results-model-title">Resultado é valor por participante num evento</h2>
              <p className="portal-results-text">
                Um resultado não tem de ser apenas marcador de jogo. Pode ser golo, set, ponto, tempo, marca, distância,
                vitória, empate ou critério específico da modalidade.
              </p>
            </div>
            <span className="portal-results-tag">
              {formatCountLabel(data.summary.eventCount, "evento", "eventos")} · {formatCountLabel(data.summary.eventParticipantCount, "participante", "participantes")}
            </span>
          </div>
          <ul className="portal-results-model-list">
            <li>
              <span>Futebol / Voleibol</span>
              <strong>Marcador, sets ou pontos</strong>
              <p>O evento pode ser um jogo e o resultado pode alimentar classificação por pontos, golos ou sets.</p>
            </li>
            <li>
              <span>Xadrez</span>
              <strong>Pontos e desfecho</strong>
              <p>A partida pode produzir vitória, empate ou derrota, além de critérios de desempate.</p>
            </li>
            <li>
              <span>Atletismo / Natação</span>
              <strong>Tempos, marcas ou distâncias</strong>
              <p>A prova pode gerar resultado individual por participante, série, final, escalão ou escola.</p>
            </li>
          </ul>
        </section>

        <section className="portal-results-section" aria-labelledby="portal-results-scope-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Âmbito ativo</p>
              <h2 id="portal-results-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-results-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-results-scope-list">
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

        <section className="portal-results-section" aria-labelledby="portal-results-list-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Evento → Participante → Resultado</p>
              <h2 id="portal-results-list-title">Resultados visíveis</h2>
            </div>
            <span className="portal-results-tag">
              {hasFilters ? `${filteredResults.length} de ${data.results.length}` : `${data.results.length} linhas`}
            </span>
          </div>

          <form className="portal-results-filters" method="get">
            <label className="portal-results-filter">
              <span>Pesquisar evento/participante</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Evento, participante ou resultado" />
            </label>
            <label className="portal-results-filter">
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
            <label className="portal-results-filter">
              <span>Estrutura</span>
              <select name="estrutura" defaultValue={filters.structure}>
                <option value="">Todas</option>
                {structureOptions.map((structure) => (
                  <option key={structure} value={structure}>
                    {structure}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-results-filter">
              <span>Tipo de evento</span>
              <select name="tipo" defaultValue={filters.eventType}>
                <option value="">Todos</option>
                {eventTypeOptions.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-results-filter">
              <span>Estado do resultado</span>
              <select name="estado" defaultValue={filters.status}>
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-results-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-results-link-button" href="/portal-escolas/resultados">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredResults.length > 0 ? (
            <div className="portal-results-table-wrap">
              <table className="portal-results-table">
                <thead>
                  <tr>
                    <th>Competição</th>
                    <th>Estrutura</th>
                    <th>Evento</th>
                    <th>Participante</th>
                    <th>Resultado</th>
                    <th>Pontos</th>
                    <th>Desfecho</th>
                    <th>Estado do resultado</th>
                    <th>Estado do evento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.key}>
                      <td>
                        {result.competitionHref ? <a href={result.competitionHref}>{result.competitionLabel}</a> : result.competitionLabel}
                      </td>
                      <td>
                        <div className="portal-results-record">
                          <strong>{result.stageLabel}</strong>
                          <span>{result.stageTypeLabel}</span>
                        </div>
                      </td>
                      <td>
                        <div className="portal-results-record">
                          <strong>{result.eventLabel}</strong>
                          <span>{result.eventTypeLabel}</span>
                        </div>
                      </td>
                      <td>
                        <div className="portal-results-record">
                          <strong>{result.participantLabel}</strong>
                          <span>{result.participantRoleLabel}</span>
                        </div>
                      </td>
                      <td className={result.hasResult ? undefined : "portal-results-muted"}>{result.scoreLabel}</td>
                      <td className={result.hasResult ? undefined : "portal-results-muted"}>{result.pointsLabel}</td>
                      <td className={result.hasResult ? undefined : "portal-results-muted"}>{result.outcomeLabel}</td>
                      <td>
                        <span className="portal-results-tag">{result.resultStatusLabel}</span>
                      </td>
                      <td>
                        <span className="portal-results-tag">{result.eventStatusLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.results.length > 0
                  ? "Não há resultados visíveis com os filtros selecionados."
                  : "Ainda não há resultados por evento e participante disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
