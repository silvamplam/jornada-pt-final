import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalResults } from "@/lib/portal-escolas/readPortalResults";

type ResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Resultados | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de resultados autorizados no Portal das Escolas."
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

  .portal-results-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-results-scope-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-results-scope-list span,
  .portal-results-filter span,
  .portal-results-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-results-scope-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-results-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(3, minmax(150px, 1fr)) auto auto;
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
    margin-top: 16px;
    overflow-x: auto;
  }

  .portal-results-table {
    width: 100%;
    min-width: 0;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .portal-results-table th,
  .portal-results-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #d7e4ed;
    overflow-wrap: anywhere;
    text-align: left;
    vertical-align: top;
  }

  .portal-results-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-results-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-results-table .portal-results-tag {
    display: block;
    box-sizing: border-box;
    width: 100%;
    text-align: center;
    white-space: normal;
  }

  .portal-results-match strong,
  .portal-results-match span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-results-match span {
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

  @media (max-width: 1140px) {
    .portal-results-table {
      min-width: 1040px;
    }
  }

  @media (max-width: 1020px) {
    .portal-results-filters,
    .portal-results-scope-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-results-shell {
      padding: 16px;
    }

    .portal-results-hero,
    .portal-results-filters,
    .portal-results-scope-list {
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
  unknown: "Não disponível"
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
    contextos: "contextos",
    entidades: "entidades",
    jogos: "jogos",
    participantes: "participantes",
    resultados: "resultados",
    "jornadas/fases": "jornadas/fases"
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
    stage: firstParam(params.jornada).trim(),
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
    gameStatusLabel: formatLabel(result.gameStatus),
    submittedAtLabel: formatDateTime(result.submittedAt, "Sem submissão registada"),
    validatedAtLabel: formatDateTime(result.validatedAt, "Ainda não validado")
  }));
  const filteredResults = resultRows.filter((result) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${result.gameLabel} ${result.homeName} ${result.awayName}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || result.competitionLabel === filters.competition) &&
      (!filters.stage || result.stageLabel === filters.stage) &&
      (!filters.status || result.resultStatusLabel === filters.status)
    );
  });
  const competitionOptions = uniqueLabels(resultRows.map((result) => result.competitionLabel));
  const stageOptions = uniqueLabels(resultRows.map((result) => result.stageLabel));
  const statusOptions = uniqueLabels(resultRows.map((result) => result.resultStatusLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.stage || filters.status);

  return (
    <main className="portal-results-shell">
      <style>{resultsStyles}</style>
      <div className="portal-results-wrap">
        <section className="portal-results-hero" aria-labelledby="portal-results-title">
          <div>
            <p className="portal-results-eyebrow">Portal das Escolas</p>
            <h1 id="portal-results-title">Resultados</h1>
            <p className="portal-results-text">Listagem read-only dos jogos e resultados disponíveis para os âmbitos autorizados.</p>
          </div>
          <span className="portal-results-tag">{formatCountLabel(data.results.length, "registo", "registos")}</span>
        </section>

        <nav className="portal-results-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-results-notice" aria-labelledby="portal-results-notice-title">
            <h2 id="portal-results-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

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
              <p className="portal-results-eyebrow">Validação</p>
              <h2 id="portal-results-list-title">Resultados visíveis</h2>
            </div>
            <span className="portal-results-tag">
              {hasFilters ? `${filteredResults.length} de ${data.results.length}` : `${data.results.length} total`}
            </span>
          </div>

          <form className="portal-results-filters" method="get">
            <label className="portal-results-filter">
              <span>Pesquisar jogo/participante</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Equipa, participante ou jogo" />
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
                    <th>Jornada/fase</th>
                    <th>Jogo</th>
                    <th>Resultado</th>
                    <th>Estado do resultado</th>
                    <th>Submissão</th>
                    <th>Validação</th>
                    <th>Estado do jogo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.key}>
                      <td>{result.competitionLabel}</td>
                      <td>{result.stageLabel}</td>
                      <td>
                        <div className="portal-results-match">
                          <strong>{result.gameLabel}</strong>
                          <span>{result.homeName}</span>
                          <span>{result.awayName}</span>
                        </div>
                      </td>
                      <td className={result.hasResult ? undefined : "portal-results-muted"}>{result.resultLabel}</td>
                      <td>
                        <span className="portal-results-tag">{result.resultStatusLabel}</span>
                      </td>
                      <td className={result.submittedAt ? undefined : "portal-results-muted"}>{result.submittedAtLabel}</td>
                      <td className={result.validatedAt ? undefined : "portal-results-muted"}>{result.validatedAtLabel}</td>
                      <td>
                        <span className="portal-results-tag">{result.gameStatusLabel}</span>
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
                  : "Ainda não há jogos ou resultados disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
