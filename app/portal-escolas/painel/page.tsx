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

  .portal-panel-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
              A sessão existe, mas o utilizador precisa de `portal_users.status = active` e de uma permissão
              `portal_permissions.status = active` com `can_view = true`.
            </p>
            <nav className="portal-panel-actions" aria-label="Navegacao do Portal das Escolas">
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
          <span className="portal-panel-tag">Read-only</span>
        </section>

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

        <section className="portal-panel-section" aria-labelledby="portal-panel-session-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Acesso autorizado</p>
              <h2 id="portal-panel-session-title">Utilizador</h2>
            </div>
            <span className="portal-panel-tag">can_view</span>
          </div>
          <div className="portal-panel-grid">
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
              <strong>{authorization.portalUser.status}</strong>
            </div>
            <div className="portal-panel-item">
              <span>Perfil de acesso</span>
              <strong>Leitura autorizada</strong>
            </div>
          </div>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-scope-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Escopo autorizado</p>
              <h2 id="portal-panel-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-panel-tag">{dashboard.scopes.length} escopo(s)</span>
          </div>
          <ul className="portal-panel-list">
            {dashboard.scopes.map((scope) => (
              <li key={scope.id}>
                <div>
                  <strong>{scope.entityLabel}</strong>
                  <span>Contexto: {scope.contextLabel}</span>
                  <span>Competicao: {scope.competitionLabel}</span>
                </div>
                <span className="portal-panel-tag">Leitura</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-summary-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Resumo real</p>
              <h2 id="portal-panel-summary-title">Contagens carregadas</h2>
            </div>
            <span className="portal-panel-tag">Servidor</span>
          </div>
          <div className="portal-panel-metrics" aria-label="Resumo de dados reais carregados">
            <div className="portal-panel-metric">
              <strong>{dashboard.counts.competitions}</strong>
              <span>Competições</span>
            </div>
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
            <div className="portal-panel-metric">
              <strong>{dashboard.counts.contexts}</strong>
              <span>Contextos</span>
            </div>
            <div className="portal-panel-metric">
              <strong>{dashboard.counts.entities}</strong>
              <span>Entidades</span>
            </div>
          </div>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-participants-title">
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
                    <span>{participant.groupLabel ?? participant.type}</span>
                    <span>Competição: {participant.competitionLabel}</span>
                  </div>
                  <span className="portal-panel-tag">{participant.registrationStatus}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Sem participantes disponíveis para os escopos autorizados." />
          )}
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-calendar-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Calendario</p>
              <h2 id="portal-panel-calendar-title">Jornadas/fases e jogos</h2>
            </div>
            <span className="portal-panel-tag">Read-only</span>
          </div>
          <div className="portal-panel-columns">
            <div className="portal-panel-subsection">
              <h3>Jornadas/fases</h3>
              {dashboard.stages.length > 0 ? (
                <ul className="portal-panel-list">
                  {dashboard.stages.slice(0, 6).map((stage) => (
                    <li key={stage.id}>
                      <div>
                        <strong>{stage.name}</strong>
                        <span>{stage.type}</span>
                        <span>Data: {formatDate(stage.scheduled_date)}</span>
                      </div>
                      <span className="portal-panel-tag">{stage.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Sem jornadas ou fases disponíveis." />
              )}
            </div>
            <div className="portal-panel-subsection">
              <h3>Jogos</h3>
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
                        <span>Resultado: {game.resultLabel}</span>
                      </div>
                      <span className="portal-panel-tag">{game.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Sem jogos disponíveis." />
              )}
            </div>
          </div>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-results-content-title">
          <div className="portal-panel-section-header">
            <div>
              <p className="portal-panel-eyebrow">Validação e conteúdos</p>
              <h2 id="portal-panel-results-content-title">Resultados e conteúdos</h2>
            </div>
            <span className="portal-panel-tag">Consulta</span>
          </div>
          <div className="portal-panel-columns">
            <div className="portal-panel-subsection">
              <h3>Resultados</h3>
              {dashboard.results.length > 0 ? (
                <ul className="portal-panel-list">
                  {dashboard.results.slice(0, 6).map((result) => (
                    <li key={result.id}>
                      <div>
                        <strong>
                          {result.home_score ?? "-"} - {result.away_score ?? "-"}
                        </strong>
                        <span>Jogo: {result.portal_game_id}</span>
                        <span>Submetido: {formatDateTime(result.submitted_at)}</span>
                      </div>
                      <span className="portal-panel-tag">{result.result_status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Sem resultados disponíveis." />
              )}
            </div>
            <div className="portal-panel-subsection">
              <h3>Conteudos</h3>
              {dashboard.contentSubmissions.length > 0 ? (
                <ul className="portal-panel-list">
                  {dashboard.contentSubmissions.slice(0, 6).map((content) => (
                    <li key={content.id}>
                      <div>
                        <strong>{content.title}</strong>
                        <span>{content.type}</span>
                        <span>Submetido: {formatDateTime(content.submitted_at)}</span>
                      </div>
                      <span className="portal-panel-tag">{content.submission_status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Sem conteúdos disponíveis." />
              )}
            </div>
          </div>
        </section>

        <nav className="portal-panel-actions" aria-label="Navegacao do Portal das Escolas">
          <a href="/portal-escolas">Voltar ao portal</a>
          <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Login</a>
        </nav>
      </div>
    </main>
  );
}
