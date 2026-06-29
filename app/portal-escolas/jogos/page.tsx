import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalGames } from "@/lib/portal-escolas/readPortalGames";

type GamesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Eventos | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de eventos autorizados no Portal das Escolas, mantendo a rota de jogos por compatibilidade."
};

export const dynamic = "force-dynamic";

const gamesStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-games-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-games-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-games-hero,
  .portal-games-section,
  .portal-games-warning,
  .portal-games-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-games-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-games-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-games-hero h1,
  .portal-games-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-games-text,
  .portal-games-warning p,
  .portal-games-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-games-tag {
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

  .portal-games-section,
  .portal-games-warning,
  .portal-games-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-games-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-games-section h2,
  .portal-games-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-games-scope-list,
  .portal-games-model-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-games-scope-list li,
  .portal-games-model-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-games-scope-list span,
  .portal-games-model-list span,
  .portal-games-filter span,
  .portal-games-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-games-scope-list strong,
  .portal-games-model-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-games-model-list p {
    margin: 8px 0 0;
    color: #526274;
    font-size: 13px;
    line-height: 1.45;
  }

  .portal-games-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(5, minmax(135px, 1fr)) auto auto;
    gap: 12px;
    align-items: end;
    margin-top: 16px;
  }

  .portal-games-filter input,
  .portal-games-filter select {
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

  .portal-games-button,
  .portal-games-link-button {
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

  .portal-games-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: #cbdce7;
    background: #ffffff;
    color: #0f6f8d;
  }

  .portal-games-table-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 16px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }

  .portal-games-table {
    width: 100%;
    min-width: 1420px;
    border-collapse: collapse;
  }

  .portal-games-table th,
  .portal-games-table td {
    padding: 12px;
    border-bottom: 1px solid #d7e4ed;
    text-align: left;
    vertical-align: top;
  }

  .portal-games-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .portal-games-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-games-table .portal-games-tag {
    white-space: nowrap;
  }

  .portal-games-table td:nth-child(6),
  .portal-games-table td:nth-child(8) {
    white-space: nowrap;
  }

  .portal-games-match strong,
  .portal-games-match span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-games-match span {
    margin-top: 4px;
    color: #667789;
    font-size: 12px;
  }

  .portal-games-muted {
    color: #667789;
  }

  .portal-games-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-games-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-games-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-games-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-games-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  @media (max-width: 1140px) {
    .portal-games-filters {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-games-shell {
      padding: 16px;
    }

    .portal-games-hero,
    .portal-games-filters,
    .portal-games-scope-list,
    .portal-games-model-list {
      grid-template-columns: 1fr;
    }

    .portal-games-hero {
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Data por definir";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data por definir";
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
    eventos: "eventos",
    participantes: "participantes",
    "participantes de evento": "participantes de evento",
    "resultados por participante": "resultados por participante",
    "estrutura competitiva": "estrutura competitiva"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-games-empty">{message}</p>;
}

export default async function PortalEscolasJogosPage({ searchParams }: GamesPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    structure: firstParam(params.estrutura).trim() || firstParam(params.jornada).trim(),
    eventType: firstParam(params.tipo).trim(),
    status: firstParam(params.estado).trim(),
    result: firstParam(params.resultado).trim()
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
      <main className="portal-games-shell">
        <style>{gamesStyles}</style>
        <div className="portal-games-wrap">
          <section className="portal-games-warning" aria-labelledby="portal-games-warning-title">
            <p className="portal-games-eyebrow">Portal das Escolas</p>
            <h1 id="portal-games-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-games-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalGames(supabase, authorization);
  const eventRows = data.games.map((event) => ({
    ...event,
    eventStatusLabel: formatLabel(event.eventStatus),
    resultStatusLabel: formatLabel(event.resultStatus),
    scheduledAtLabel: formatDateTime(event.scheduledAt),
    venueLabel: event.venue?.trim() || "Local por definir",
    resultPresenceLabel: event.hasResult ? "Com resultado" : "Sem resultado"
  }));
  const filteredEvents = eventRows.filter((event) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(
      `${event.eventLabel} ${event.participantLabels.join(" ")} ${event.competitionLabel} ${event.stageLabel}`
    );

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || event.competitionLabel === filters.competition) &&
      (!filters.structure || event.stageLabel === filters.structure) &&
      (!filters.eventType || event.eventTypeLabel === filters.eventType) &&
      (!filters.status || event.eventStatusLabel === filters.status) &&
      (!filters.result || event.resultPresenceLabel === filters.result)
    );
  });
  const competitionOptions = uniqueLabels(eventRows.map((event) => event.competitionLabel));
  const structureOptions = uniqueLabels(eventRows.map((event) => event.stageLabel));
  const eventTypeOptions = uniqueLabels(eventRows.map((event) => event.eventTypeLabel));
  const statusOptions = uniqueLabels(eventRows.map((event) => event.eventStatusLabel));
  const resultOptions = uniqueLabels(eventRows.map((event) => event.resultPresenceLabel));
  const hasFilters = Boolean(
    filters.search || filters.competition || filters.structure || filters.eventType || filters.status || filters.result
  );

  return (
    <main className="portal-games-shell">
      <style>{gamesStyles}</style>
      <div className="portal-games-wrap">
        <section className="portal-games-hero" aria-labelledby="portal-games-title">
          <div>
            <p className="portal-games-eyebrow">Portal das Escolas · Eventos</p>
            <h1 id="portal-games-title">Eventos</h1>
            <p className="portal-games-text">
              Leitura read-only dos eventos autorizados. A rota continua a ser /portal-escolas/jogos por compatibilidade,
              mas a leitura passa a assumir que jogos são apenas um tipo possível de evento.
            </p>
          </div>
          <span className="portal-games-tag">{formatCountLabel(data.summary.eventCount, "evento", "eventos")}</span>
        </section>

        <PortalEscolasInternalNav current="jogos" />

        <nav className="portal-games-actions" aria-label="Ações da página de eventos">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-games-notice" aria-labelledby="portal-games-notice-title">
            <h2 id="portal-games-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados: {" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-games-section" aria-labelledby="portal-games-model-title">
          <div className="portal-games-section-header">
            <div>
              <p className="portal-games-eyebrow">Modelo multidesporto</p>
              <h2 id="portal-games-model-title">Jogos são eventos</h2>
            </div>
            <span className="portal-games-tag">
              {formatCountLabel(data.summary.stageCount, "estrutura", "estruturas")} · {formatCountLabel(data.summary.resultEntryCount, "resultado", "resultados")}
            </span>
          </div>
          <p className="portal-games-text">
            A unidade concreta onde se produz um resultado é o evento. No futebol e no voleibol esse evento pode ser um jogo;
            no xadrez pode ser uma partida; no atletismo ou na natação pode ser uma prova, série ou final.
          </p>
          <ul className="portal-games-model-list">
            <li>
              <span>Futebol / voleibol</span>
              <strong>Jogo</strong>
              <p>Evento com equipas, marcador, pontos e classificação por jornada ou competição.</p>
            </li>
            <li>
              <span>Xadrez</span>
              <strong>Partida</strong>
              <p>Evento de ronda, com pontos e critérios de desempate próprios.</p>
            </li>
            <li>
              <span>Atletismo / natação</span>
              <strong>Prova, série ou final</strong>
              <p>Evento com participantes, tempos, marcas, distâncias ou pontuação.</p>
            </li>
          </ul>
        </section>

        <section className="portal-games-section" aria-labelledby="portal-games-scope-title">
          <div className="portal-games-section-header">
            <div>
              <p className="portal-games-eyebrow">Âmbito ativo</p>
              <h2 id="portal-games-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-games-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-games-scope-list">
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

        <section className="portal-games-section" aria-labelledby="portal-games-list-title">
          <div className="portal-games-section-header">
            <div>
              <p className="portal-games-eyebrow">Estrutura competitiva → eventos</p>
              <h2 id="portal-games-list-title">Eventos visíveis</h2>
            </div>
            <span className="portal-games-tag">
              {hasFilters ? `${filteredEvents.length} de ${data.games.length}` : `${data.games.length} total`}
            </span>
          </div>

          <form className="portal-games-filters" method="get">
            <label className="portal-games-filter">
              <span>Pesquisar evento/participante</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Evento, participante ou competição" />
            </label>
            <label className="portal-games-filter">
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
            <label className="portal-games-filter">
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
            <label className="portal-games-filter">
              <span>Tipo de evento</span>
              <select name="tipo" defaultValue={filters.eventType}>
                <option value="">Todos</option>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-games-filter">
              <span>Estado do evento</span>
              <select name="estado" defaultValue={filters.status}>
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-games-filter">
              <span>Resultado</span>
              <select name="resultado" defaultValue={filters.result}>
                <option value="">Todos</option>
                {resultOptions.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-games-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-games-link-button" href="/portal-escolas/jogos">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredEvents.length > 0 ? (
            <div className="portal-games-table-wrap">
              <table className="portal-games-table">
                <thead>
                  <tr>
                    <th>Competição</th>
                    <th>Estrutura</th>
                    <th>Evento</th>
                    <th>Tipo</th>
                    <th>Participantes</th>
                    <th>Data/hora</th>
                    <th>Local</th>
                    <th>Resultado</th>
                    <th>Estado do evento</th>
                    <th>Estado do resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.key}>
                      <td>
                        {event.competitionHref ? <a href={event.competitionHref}>{event.competitionLabel}</a> : event.competitionLabel}
                      </td>
                      <td>
                        <div className="portal-games-match">
                          <strong>{event.stageLabel}</strong>
                          <span>{event.stageTypeLabel}</span>
                        </div>
                      </td>
                      <td>
                        <div className="portal-games-match">
                          <strong>{event.eventLabel}</strong>
                          <span>{event.contextLabel}</span>
                        </div>
                      </td>
                      <td>{event.eventTypeLabel}</td>
                      <td>
                        <div className="portal-games-match">
                          <strong>{event.participantSummaryLabel}</strong>
                          <span>{formatCountLabel(event.participantLabels.length, "participante", "participantes")}</span>
                        </div>
                      </td>
                      <td className={event.scheduledAt ? undefined : "portal-games-muted"}>{event.scheduledAtLabel}</td>
                      <td className={event.venue ? undefined : "portal-games-muted"}>{event.venueLabel}</td>
                      <td className={event.hasResult ? undefined : "portal-games-muted"}>
                        <div className="portal-games-match">
                          <strong>{event.resultLabel}</strong>
                          <span>{formatCountLabel(event.resultEntryCount, "entrada", "entradas")}</span>
                        </div>
                      </td>
                      <td>
                        <span className="portal-games-tag">{event.eventStatusLabel}</span>
                      </td>
                      <td>
                        <span className="portal-games-tag">{event.resultStatusLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.games.length > 0
                  ? "Não há eventos visíveis com os filtros selecionados."
                  : "Ainda não há eventos disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
