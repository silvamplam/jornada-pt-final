import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalStages } from "@/lib/portal-escolas/readPortalStages";

type StagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Estrutura competitiva | Portal das Escolas | Jornada.pt",
  description: "Leitura read-only da estrutura competitiva autorizada no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const stagesStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-stages-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-stages-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-stages-hero,
  .portal-stages-section,
  .portal-stages-warning,
  .portal-stages-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-stages-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-stages-section,
  .portal-stages-warning,
  .portal-stages-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-stages-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-stages-hero h1,
  .portal-stages-warning h1,
  .portal-stages-section h2,
  .portal-stages-notice h2 {
    margin: 0;
  }

  .portal-stages-hero h1,
  .portal-stages-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-stages-section h2,
  .portal-stages-notice h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .portal-stages-text,
  .portal-stages-warning p,
  .portal-stages-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-stages-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-stages-actions a,
  .portal-stages-button,
  .portal-stages-link-button {
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

  .portal-stages-button {
    border-color: #0f6f8d;
    background: #0f6f8d;
    color: #ffffff;
  }

  .portal-stages-tag {
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

  .portal-stages-section-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-stages-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-stages-scope-list li {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-stages-scope-list span,
  .portal-stages-filter span,
  .portal-stages-table th {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-stages-scope-list strong {
    min-width: 0;
    color: #102033;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .portal-stages-concept-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .portal-stages-concept-card {
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-stages-concept-card span {
    display: block;
    margin-bottom: 6px;
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-stages-concept-card strong {
    display: block;
    color: #102033;
    font-size: 15px;
    line-height: 1.3;
  }

  .portal-stages-concept-card p {
    margin: 8px 0 0;
    color: #526274;
    font-size: 13px;
    line-height: 1.45;
  }

  .portal-stages-filters {
    display: grid;
    grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto auto;
    gap: 10px;
    align-items: end;
    margin-bottom: 16px;
  }

  .portal-stages-filter {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .portal-stages-filter input,
  .portal-stages-filter select {
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

  .portal-stages-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
  }

  .portal-stages-table {
    width: 100%;
    min-width: 820px;
    border-collapse: collapse;
    background: #ffffff;
  }

  .portal-stages-table th,
  .portal-stages-table td {
    padding: 12px;
    border-bottom: 1px solid #dbe7ef;
    text-align: left;
    vertical-align: top;
  }

  .portal-stages-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .portal-stages-table td {
    color: #1b2c3d;
    font-size: 14px;
  }

  .portal-stages-title {
    display: grid;
    gap: 4px;
  }

  .portal-stages-title strong {
    overflow-wrap: anywhere;
  }

  .portal-stages-title span,
  .portal-stages-muted {
    color: #66778a;
  }

  .portal-stages-empty {
    margin: 0;
    padding: 16px;
    border: 1px dashed #b8c7d3;
    border-radius: 8px;
    background: #f8fbfd;
    color: #526274;
    font-size: 14px;
    line-height: 1.5;
  }

  .portal-stages-notice {
    background: #fffaf0;
  }

  .portal-stages-warning {
    background: #fff8ee;
  }

  @media (max-width: 940px) {
    .portal-stages-shell {
      padding: 18px;
    }

    .portal-stages-hero,
    .portal-stages-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-stages-hero h1,
    .portal-stages-warning h1 {
      font-size: 32px;
    }

    .portal-stages-scope-list,
    .portal-stages-concept-grid,
    .portal-stages-filters {
      grid-template-columns: 1fr;
    }

    .portal-stages-button,
    .portal-stages-link-button {
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
  matchday: "Jornada",
  demo_matchday: "Jornada",
  phase: "Fase",
  round: "Ronda",
  group_stage: "Fase de grupos",
  knockout: "Eliminatórias",
  playoff: "Play-off",
  quarterfinal: "Quartos de final",
  semifinal: "Meia-final",
  final: "Final",
  league: "Liga",
  series: "Série",
  serie: "Série",
  heat: "Série",
  event: "Prova",
  race: "Corrida",
  trial: "Prova",
  group: "Grupo",
  stage: "Etapa"
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

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data prevista";
  }

  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
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
    entidades: "entidades",
    "jornadas/fases": "estruturas competitivas"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-stages-empty">{message}</p>;
}

export default async function PortalEscolasJornadasPage({ searchParams }: StagesPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    status: firstParam(params.estado).trim(),
    type: firstParam(params.tipo).trim()
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
      <main className="portal-stages-shell">
        <style>{stagesStyles}</style>
        <div className="portal-stages-wrap">
          <section className="portal-stages-warning" aria-labelledby="portal-stages-warning-title">
            <p className="portal-stages-eyebrow">Portal das Escolas</p>
            <h1 id="portal-stages-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-stages-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalStages(supabase, authorization);
  const stageRows = data.stages.map((stage) => ({
    ...stage,
    typeLabel: formatLabel(stage.type, "Tipo por definir"),
    statusLabel: formatLabel(stage.status),
    scheduledDateLabel: formatDate(stage.scheduledDate),
    orderLabel: stage.stageOrder === null ? "Sem ordem" : String(stage.stageOrder)
  }));
  const filteredStages = stageRows.filter((stage) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${stage.name} ${stage.typeLabel} ${stage.competitionLabel}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || stage.competitionLabel === filters.competition) &&
      (!filters.status || stage.statusLabel === filters.status) &&
      (!filters.type || stage.typeLabel === filters.type)
    );
  });
  const competitionOptions = uniqueLabels(stageRows.map((stage) => stage.competitionLabel));
  const statusOptions = uniqueLabels(stageRows.map((stage) => stage.statusLabel));
  const typeOptions = uniqueLabels(stageRows.map((stage) => stage.typeLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.status || filters.type);

  return (
    <main className="portal-stages-shell">
      <style>{stagesStyles}</style>
      <div className="portal-stages-wrap">
        <section className="portal-stages-hero" aria-labelledby="portal-stages-title">
          <div>
            <p className="portal-stages-eyebrow">Portal das Escolas</p>
            <h1 id="portal-stages-title">Estrutura competitiva</h1>
            <p className="portal-stages-text">
              Leitura read-only da camada entre competição/formato e evento. Aqui podem existir jornadas, fases,
              rondas, séries, grupos, provas ou etapas, conforme a modalidade e o formato competitivo.
            </p>
          </div>
          <span className="portal-stages-tag">{formatCountLabel(data.stages.length, "estrutura", "estruturas")}</span>
        </section>

        <PortalEscolasInternalNav current="jornadas" />

        <nav className="portal-stages-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-stages-notice" aria-labelledby="portal-stages-notice-title">
            <h2 id="portal-stages-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-stages-section" aria-labelledby="portal-stages-model-title">
          <div className="portal-stages-section-header">
            <div>
              <p className="portal-stages-eyebrow">Modelo multidesporto</p>
              <h2 id="portal-stages-model-title">Da competição ao evento</h2>
            </div>
            <span className="portal-stages-tag">read-only</span>
          </div>
          <p className="portal-stages-text">
            Esta área mostra a estrutura intermédia que organiza uma competição antes dos eventos concretos.
            No futebol, esta estrutura pode ser uma jornada; no atletismo, pode ser uma prova, série ou final; no xadrez,
            pode ser uma ronda. A rota mantém-se em /portal-escolas/jornadas por compatibilidade, mas o conceito passa a
            ser estrutura competitiva.
          </p>
          <div className="portal-stages-concept-grid">
            <article className="portal-stages-concept-card">
              <span>Futebol</span>
              <strong>Jornadas</strong>
              <p>Campeonato por jornadas → jogos → resultados por golos → classificação por pontos.</p>
            </article>
            <article className="portal-stages-concept-card">
              <span>Atletismo</span>
              <strong>Provas, séries e finais</strong>
              <p>Meeting ou prova por marcas → tempos, distâncias ou pontuações → rankings por prova, escalão ou escola.</p>
            </article>
            <article className="portal-stages-concept-card">
              <span>Xadrez</span>
              <strong>Rondas</strong>
              <p>Torneio suíço ou eliminatória → partidas → pontos, vitórias e critérios de desempate.</p>
            </article>
          </div>
        </section>

        <section className="portal-stages-section" aria-labelledby="portal-stages-scope-title">
          <div className="portal-stages-section-header">
            <div>
              <p className="portal-stages-eyebrow">Âmbito ativo</p>
              <h2 id="portal-stages-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-stages-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-stages-scope-list">
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

        <section className="portal-stages-section" aria-labelledby="portal-stages-list-title">
          <div className="portal-stages-section-header">
            <div>
              <p className="portal-stages-eyebrow">Estrutura competitiva</p>
              <h2 id="portal-stages-list-title">Estruturas visíveis</h2>
            </div>
            <span className="portal-stages-tag">
              {hasFilters ? `${filteredStages.length} de ${data.stages.length}` : `${data.stages.length} total`}
            </span>
          </div>

          <form className="portal-stages-filters" method="get">
            <label className="portal-stages-filter">
              <span>Pesquisar estrutura</span>
              <input
                name="pesquisa"
                type="search"
                defaultValue={filters.search}
                placeholder="Nome da jornada, fase, ronda, série, prova ou etapa"
              />
            </label>
            <label className="portal-stages-filter">
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
            <label className="portal-stages-filter">
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
            <label className="portal-stages-filter">
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
            <button className="portal-stages-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-stages-link-button" href="/portal-escolas/jornadas">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredStages.length > 0 ? (
            <div className="portal-stages-table-wrap">
              <table className="portal-stages-table">
                <thead>
                  <tr>
                    <th>Estrutura</th>
                    <th>Competição</th>
                    <th>Tipo</th>
                    <th>Data prevista</th>
                    <th>Ordem</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStages.map((stage) => (
                    <tr key={stage.key}>
                      <td>
                        <div className="portal-stages-title">
                          <strong>{stage.name}</strong>
                          <span>{stage.contextLabel}</span>
                        </div>
                      </td>
                      <td>{stage.competitionLabel}</td>
                      <td>{stage.typeLabel}</td>
                      <td className={stage.scheduledDate ? undefined : "portal-stages-muted"}>{stage.scheduledDateLabel}</td>
                      <td className={stage.stageOrder === null ? "portal-stages-muted" : undefined}>{stage.orderLabel}</td>
                      <td>
                        <span className="portal-stages-tag">{stage.statusLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.stages.length > 0
                  ? "Não há estruturas visíveis com os filtros selecionados."
                  : "Ainda não há estruturas competitivas disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
