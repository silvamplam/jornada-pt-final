import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalGames } from "@/lib/portal-escolas/readPortalGames";

type GamesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Jogos | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de jogos autorizados no Portal das Escolas."
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

  .portal-games-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-games-scope-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-games-scope-list span,
  .portal-games-filter span,
  .portal-games-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-games-scope-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-games-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(4, minmax(145px, 1fr)) auto auto;
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
    margin-top: 16px;
    overflow-x: auto;
  }

  .portal-games-table {
    width: 100%;
    min-width: 1060px;
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
  }

  .portal-games-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
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
    .portal-games-scope-list {
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
    jogos: "jogos",
    participantes: "participantes",
    resultados: "resultados",
    "jornadas/fases": "jornadas/fases"
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
    stage: firstParam(params.jornada).trim(),
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
  const gameRows = data.games.map((game) => ({
    ...game,
    gameStatusLabel: formatLabel(game.gameStatus),
    resultStatusLabel: formatLabel(game.resultStatus),
    scheduledAtLabel: formatDateTime(game.scheduledAt),
    venueLabel: game.venue?.trim() || "Local por definir",
    resultPresenceLabel: game.hasResult ? "Com resultado" : "Sem resultado"
  }));
  const filteredGames = gameRows.filter((game) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${game.gameLabel} ${game.homeName} ${game.awayName}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || game.competitionLabel === filters.competition) &&
      (!filters.stage || game.stageLabel === filters.stage) &&
      (!filters.status || game.gameStatusLabel === filters.status) &&
      (!filters.result || game.resultPresenceLabel === filters.result)
    );
  });
  const competitionOptions = uniqueLabels(gameRows.map((game) => game.competitionLabel));
  const stageOptions = uniqueLabels(gameRows.map((game) => game.stageLabel));
  const statusOptions = uniqueLabels(gameRows.map((game) => game.gameStatusLabel));
  const resultOptions = uniqueLabels(gameRows.map((game) => game.resultPresenceLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.stage || filters.status || filters.result);

  return (
    <main className="portal-games-shell">
      <style>{gamesStyles}</style>
      <div className="portal-games-wrap">
        <section className="portal-games-hero" aria-labelledby="portal-games-title">
          <div>
            <p className="portal-games-eyebrow">Portal das Escolas</p>
            <h1 id="portal-games-title">Jogos</h1>
            <p className="portal-games-text">Listagem read-only de jogos e calendário disponível para os âmbitos autorizados.</p>
          </div>
          <span className="portal-games-tag">{formatCountLabel(data.games.length, "jogo", "jogos")}</span>
        </section>

        <nav className="portal-games-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-games-notice" aria-labelledby="portal-games-notice-title">
            <h2 id="portal-games-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

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
              <p className="portal-games-eyebrow">Jogos / calendário</p>
              <h2 id="portal-games-list-title">Jogos visíveis</h2>
            </div>
            <span className="portal-games-tag">
              {hasFilters ? `${filteredGames.length} de ${data.games.length}` : `${data.games.length} total`}
            </span>
          </div>

          <form className="portal-games-filters" method="get">
            <label className="portal-games-filter">
              <span>Pesquisar jogo/participante</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Equipa, participante ou jogo" />
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
            <label className="portal-games-filter">
              <span>Estado do jogo</span>
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

          {filteredGames.length > 0 ? (
            <div className="portal-games-table-wrap">
              <table className="portal-games-table">
                <thead>
                  <tr>
                    <th>Competição</th>
                    <th>Jornada/fase</th>
                    <th>Jogo</th>
                    <th>Data/hora</th>
                    <th>Local</th>
                    <th>Resultado</th>
                    <th>Estado do jogo</th>
                    <th>Estado do resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr key={game.key}>
                      <td>{game.competitionLabel}</td>
                      <td>{game.stageLabel}</td>
                      <td>
                        <div className="portal-games-match">
                          <strong>{game.gameLabel}</strong>
                          <span>{game.homeName}</span>
                          <span>{game.awayName}</span>
                        </div>
                      </td>
                      <td className={game.scheduledAt ? undefined : "portal-games-muted"}>{game.scheduledAtLabel}</td>
                      <td className={game.venue ? undefined : "portal-games-muted"}>{game.venueLabel}</td>
                      <td className={game.hasResult ? undefined : "portal-games-muted"}>{game.resultLabel}</td>
                      <td>
                        <span className="portal-games-tag">{game.gameStatusLabel}</span>
                      </td>
                      <td>
                        <span className="portal-games-tag">{game.resultStatusLabel}</span>
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
                  ? "Não há jogos visíveis com os filtros selecionados."
                  : "Ainda não há jogos disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
