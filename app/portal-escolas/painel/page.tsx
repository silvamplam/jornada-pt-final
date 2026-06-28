import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalDashboard } from "@/lib/portal-escolas/readPortalDashboard";

export const metadata = {
  title: "Painel | Portal das Escolas | Jornada.pt",
  description: "Dashboard autenticada e apenas de leitura do Portal das Escolas."
};

export const dynamic = "force-dynamic";

const panelStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-panel-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-panel-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-panel-hero,
  .portal-panel-section,
  .portal-panel-warning,
  .portal-panel-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-panel-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-panel-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-panel-nav a {
    padding: 8px 10px;
    border: 1px solid #cbdce7;
    border-radius: 999px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-panel-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-panel-hero h1 {
    margin: 0;
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-panel-text {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-panel-tag {
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

  .portal-panel-section,
  .portal-panel-warning,
  .portal-panel-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-panel-section h2,
  .portal-panel-warning h1,
  .portal-panel-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-panel-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-panel-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  .portal-panel-warning p,
  .portal-panel-notice p {
    margin: 10px 0 0;
    color: #5b6571;
    line-height: 1.45;
  }

  .portal-panel-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-panel-grid,
  .portal-panel-metrics {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }

  .portal-panel-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-panel-grid.is-compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-panel-scope-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 0;
  }

  .portal-panel-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .portal-panel-metric-group {
    margin-top: 18px;
  }

  .portal-panel-metric-group h3 {
    margin: 0;
    color: #526274;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-panel-item,
  .portal-panel-metric {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-panel-item span,
  .portal-panel-metric span,
  .portal-panel-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-panel-item strong,
  .portal-panel-metric strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-panel-metric strong {
    color: #0f6f8d;
    font-size: 28px;
    line-height: 1;
  }

  .portal-panel-list {
    display: grid;
    gap: 10px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-panel-list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-panel-list strong,
  .portal-panel-list span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-panel-list strong {
    color: #102033;
    font-size: 14px;
  }

  .portal-panel-list span {
    margin-top: 4px;
    color: #667789;
    font-size: 13px;
  }

  .portal-panel-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }

  .portal-panel-subsection h3 {
    margin: 0;
    color: #102033;
    font-size: 17px;
  }

  .portal-panel-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-panel-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .portal-panel-grid,
    .portal-panel-scope-grid,
    .portal-panel-metrics,
    .portal-panel-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-panel-shell {
      padding: 16px;
    }

    .portal-panel-hero,
    .portal-panel-grid,
    .portal-panel-scope-grid,
    .portal-panel-metrics,
    .portal-panel-columns,
    .portal-panel-list li {
      grid-template-columns: 1fr;
    }

    .portal-panel-hero {
      padding: 22px;
    }
  }
`;

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competicoes: "competições",
    conteudos: "conteúdos",
    contextos: "contextos",
    entidades: "entidades",
    inscricoes: "inscrições",
    jogos: "jogos",
    participantes: "participantes",
    resultados: "resultados",
    "jornadas/fases": "jornadas/fases"
  };

  return labels[section] ?? section;
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

const panelLabelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  can_view: "Leitura autorizada",
  validated: "Validado",
  pending_validation: "Pendente de validação",
  draft: "Rascunho",
  scheduled: "Agendado",
  under_review: "Em revisão",
  submitted: "Submetido",
  demo_matchday: "Jornada",
  matchday: "Jornada",
  demo_gallery: "Galeria",
  gallery: "Galeria",
  demo_article: "Artigo",
  article: "Artigo",
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
  confirmed: "Confirmado",
  team: "Equipa",
  player: "Jogador",
  student: "Aluno",
  school: "Escola"
};

function formatPanelLabel(value: string | null | undefined) {
  if (!value) {
    return "Por definir";
  }

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
  const mappedLabel = panelLabelMap[normalized];

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

function formatResultLabel(value: string) {
  const [score, ...statusParts] = value.split(" | ");

  if (statusParts.length === 0) {
    return formatPanelLabel(value);
  }

  return `${score} | ${formatPanelLabel(statusParts.join(" | "))}`;
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-panel-empty">{message}</p>;
}

export default async function PortalEscolasPainelPage() {
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
      <main className="portal-panel-shell">
        <style>{panelStyles}</style>
        <div className="portal-panel-wrap">
          <section className="portal-panel-warning" aria-labelledby="portal-panel-warning-title">
            <p className="portal-panel-eyebrow">Portal das Escolas</p>
            <h1 id="portal-panel-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>
              A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura
              autorizada.
            </p>
            <nav className="portal-panel-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const dashboard = await readPortalDashboard(supabase, authorization);
  const portalUserLabel = authorization.portalUser.display_name ?? authorization.portalUser.invite_email ?? authorization.portalUser.id;
  const gamesById = new Map(dashboard.games.map((game) => [game.id, game]));

  return (
    <main className="portal-panel-shell">
      <style>{panelStyles}</style>
      <div className="portal-panel-wrap">
        <section className="portal-panel-hero" aria-labelledby="portal-panel-title">
          <div>
            <p className="portal-panel-eyebrow">Jornada.pt</p>
            <h1 id="portal-panel-title">Painel do Portal das Escolas</h1>
            <p className="portal-panel-text">
              Dashboard autenticada e validada no servidor. Esta versão é apenas de leitura.
            </p>
          </div>
          <span className="portal-panel-tag">Apenas leitura</span>
        </section>

        <nav className="portal-panel-nav" aria-label="Navegação interna do painel">
          <a href="#portal-panel-scope">Âmbito</a>
          <a href="#portal-panel-summary">Resumo</a>
          <a href="#portal-panel-participants">Participantes</a>
          <a href="#portal-panel-stages">Jornadas</a>
          <a href="#portal-panel-games">Jogos</a>
          <a href="#portal-panel-results">Resultados</a>
          <a href="#portal-panel-content">Conteúdos</a>
        </nav>

        {dashboard.unavailableSections.length > 0 ? (
          <section className="portal-panel-notice" aria-labelledby="portal-panel-data-notice-title">
            <h2 id="portal-panel-data-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {dashboard.unavailableSections.map(formatUnavailableSection).join(", ")}. O painel continua ativo com a sessão e as permissões já
              validadas.
            </p>
          </section>
        ) : null}

        <section id="portal-panel-scope" className="portal-panel-section" aria-labelledby="portal-panel-scope-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Âmbito ativo</p>
              <h2 id="portal-panel-scope-title">Entidade, contexto, competição e perfil</h2>
            </div>
            <span className="portal-panel-tag">{formatCountLabel(dashboard.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-panel-list">
            {dashboard.scopes.map((scope) => (
              <li key={scope.id}>
                <div className="portal-panel-scope-grid">
                  <div className="portal-panel-item">
                    <span>Entidade</span>
                    <strong>{scope.entityLabel}</strong>
                  </div>
                  <div className="portal-panel-item">
                    <span>Contexto</span>
                    <strong>{scope.contextLabel}</strong>
                  </div>
                  <div className="portal-panel-item">
                    <span>Competição</span>
                    <strong>{scope.competitionLabel}</strong>
                  </div>
                  <div className="portal-panel-item">
                    <span>Perfil</span>
                    <strong>Leitura autorizada</strong>
                  </div>
                </div>
                <span className="portal-panel-tag">Leitura</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="portal-panel-session" className="portal-panel-section" aria-labelledby="portal-panel-session-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Sessão</p>
              <h2 id="portal-panel-session-title">Utilizador autorizado</h2>
            </div>
            <span className="portal-panel-tag">{formatPanelLabel("can_view")}</span>
          </div>
          <div className="portal-panel-grid is-compact">
            <div className="portal-panel-item">
              <span>Email</span>
              <strong>{user.email ?? "Sem email"}</strong>
            </div>
            <div className="portal-panel-item">
              <span>Utilizador portal</span>
              <strong>{portalUserLabel}</strong>
            </div>
            <div className="portal-panel-item">
              <span>Estado</span>
              <strong>{formatPanelLabel(authorization.portalUser.status)}</strong>
            </div>
          </div>
        </section>

        <section id="portal-panel-summary" className="portal-panel-section" aria-labelledby="portal-panel-summary-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Resumo operacional</p>
              <h2 id="portal-panel-summary-title">Dados carregados</h2>
            </div>
            <span className="portal-panel-tag">Servidor</span>
          </div>
          <div className="portal-panel-metric-group">
            <h3>Âmbito</h3>
            <div className="portal-panel-metrics" aria-label="Dados estruturais carregados">
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.entities}</strong>
                <span>Entidades</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.contexts}</strong>
                <span>Contextos</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.competitions}</strong>
                <span>Competições</span>
              </div>
            </div>
          </div>
          <nav className="portal-panel-actions" aria-label="Navegação de âmbito">
            <a href="/portal-escolas/contextos">Ver todos os contextos</a>
            <a href="/portal-escolas/competicoes">Ver todas as competições</a>
          </nav>
          <div className="portal-panel-metric-group">
            <h3>Atividade carregada</h3>
            <div className="portal-panel-metrics" aria-label="Dados operacionais carregados">
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.participants}</strong>
                <span>Participantes</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.stages}</strong>
                <span>Jornadas/fases</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.games}</strong>
                <span>Jogos</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.results}</strong>
                <span>Resultados</span>
              </div>
              <div className="portal-panel-metric">
                <strong>{dashboard.counts.contentSubmissions}</strong>
                <span>Conteúdos</span>
              </div>
            </div>
          </div>
        </section>

        <section id="portal-panel-participants" className="portal-panel-section" aria-labelledby="portal-panel-participants-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Inscrições</p>
              <h2 id="portal-panel-participants-title">Participantes</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.counts.participants}</span>
          </div>
          {dashboard.participants.length > 0 ? (
            <ul className="portal-panel-list">
              {dashboard.participants.slice(0, 8).map((participant) => (
                <li key={participant.key}>
                  <div>
                    <strong>{participant.name}</strong>
                    <span>{participant.groupLabel ?? formatPanelLabel(participant.type)}</span>
                    <span>Competição: {participant.competitionLabel}</span>
                  </div>
                  <span className="portal-panel-tag">{formatPanelLabel(participant.registrationStatus)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Ainda não há participantes disponíveis para os âmbitos autorizados." />
          )}
          <nav className="portal-panel-actions" aria-label="Navegação de participantes">
            <a href="/portal-escolas/participantes">Ver todos os participantes</a>
          </nav>
        </section>

        <section id="portal-panel-stages" className="portal-panel-section" aria-labelledby="portal-panel-stages-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Calendário</p>
              <h2 id="portal-panel-stages-title">Jornadas/fases</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.counts.stages}</span>
          </div>
          {dashboard.stages.length > 0 ? (
            <ul className="portal-panel-list">
              {dashboard.stages.slice(0, 6).map((stage) => (
                <li key={stage.id}>
                  <div>
                    <strong>{stage.name}</strong>
                    <span>{formatPanelLabel(stage.type)}</span>
                    <span>Data: {formatDate(stage.scheduled_date)}</span>
                  </div>
                  <span className="portal-panel-tag">{formatPanelLabel(stage.status)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Ainda não há jornadas ou fases disponíveis." />
          )}
          <nav className="portal-panel-actions" aria-label="Navegação de jornadas/fases">
            <a href="/portal-escolas/jornadas">Ver todas as jornadas/fases</a>
          </nav>
        </section>

        <section id="portal-panel-games" className="portal-panel-section" aria-labelledby="portal-panel-games-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Calendário</p>
              <h2 id="portal-panel-games-title">Jogos</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.counts.games}</span>
          </div>
          {dashboard.games.length > 0 ? (
            <ul className="portal-panel-list">
              {dashboard.games.slice(0, 6).map((game) => (
                <li key={game.id}>
                  <div>
                    <strong>
                      {game.homeName} vs {game.awayName}
                    </strong>
                    <span>{game.stageName}</span>
                    <span>
                      {formatDateTime(game.scheduledAt)} | {game.venue ?? "Local por definir"}
                    </span>
                    <span>Resultado: {formatResultLabel(game.resultLabel)}</span>
                  </div>
                  <span className="portal-panel-tag">{formatPanelLabel(game.status)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Ainda não há jogos disponíveis." />
          )}
          <nav className="portal-panel-actions" aria-label="Navegação de jogos">
            <a href="/portal-escolas/jogos">Ver todos os jogos</a>
          </nav>
        </section>

        <section id="portal-panel-results" className="portal-panel-section" aria-labelledby="portal-panel-results-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Validação</p>
              <h2 id="portal-panel-results-title">Resultados</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.counts.results}</span>
          </div>
          {dashboard.results.length > 0 ? (
            <ul className="portal-panel-list">
              {dashboard.results.slice(0, 6).map((result) => {
                const game = gamesById.get(result.portal_game_id);

                return (
                  <li key={result.id}>
                    <div>
                      <strong>
                        {result.home_score ?? "-"} - {result.away_score ?? "-"}
                      </strong>
                      <span>Jogo: {game ? `${game.homeName} vs ${game.awayName}` : result.portal_game_id}</span>
                      <span>Submetido: {formatDateTime(result.submitted_at)}</span>
                    </div>
                    <span className="portal-panel-tag">{formatPanelLabel(result.result_status)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="Ainda não há resultados disponíveis." />
          )}
          <nav className="portal-panel-actions" aria-label="Navegação de resultados">
            <a href="/portal-escolas/resultados">Ver todos os resultados</a>
          </nav>
        </section>

        <section id="portal-panel-content" className="portal-panel-section" aria-labelledby="portal-panel-content-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Conteúdos</p>
              <h2 id="portal-panel-content-title">Conteúdos</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.counts.contentSubmissions}</span>
          </div>
          {dashboard.contentSubmissions.length > 0 ? (
            <ul className="portal-panel-list">
              {dashboard.contentSubmissions.slice(0, 6).map((content) => (
                <li key={content.id}>
                  <div>
                    <strong>{content.title}</strong>
                    <span>{formatPanelLabel(content.type)}</span>
                    <span>Submetido: {formatDateTime(content.submitted_at)}</span>
                  </div>
                  <span className="portal-panel-tag">{formatPanelLabel(content.submission_status)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Ainda não há conteúdos disponíveis." />
          )}
          <nav className="portal-panel-actions" aria-label="Navegação de conteúdos">
            <a href="/portal-escolas/conteudos">Ver todos os conteúdos</a>
          </nav>
        </section>

        <nav className="portal-panel-actions" aria-label="Navegação do Portal das Escolas">
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>
      </div>
    </main>
  );
}
