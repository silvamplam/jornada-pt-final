import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalMultisportDemo } from "@/lib/portal-escolas/readPortalMultisportDemo";

export const metadata = {
  title: "Multidesporto demo | Portal das Escolas | Jornada.pt",
  description: "Leitura read-only dos dados multidesporto demo materializados no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const multisportDemoStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-multisport-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-multisport-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-multisport-hero,
  .portal-multisport-section,
  .portal-multisport-warning,
  .portal-multisport-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-multisport-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-multisport-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-multisport-hero h1,
  .portal-multisport-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-multisport-text,
  .portal-multisport-warning p,
  .portal-multisport-notice p {
    margin: 12px 0 0;
    color: #516273;
    font-size: 15px;
    line-height: 1.6;
  }

  .portal-multisport-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 6px 10px;
    border-radius: 999px;
    background: #e7f4f8;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .portal-multisport-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
  }

  .portal-multisport-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-multisport-section,
  .portal-multisport-warning,
  .portal-multisport-notice {
    margin-top: 16px;
    padding: 22px;
  }

  .portal-multisport-section-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .portal-multisport-section h2,
  .portal-multisport-notice h2 {
    margin: 0;
    font-size: 24px;
  }

  .portal-multisport-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  .portal-multisport-card,
  .portal-multisport-event,
  .portal-multisport-ranking {
    border: 1px solid #dbe8ef;
    border-radius: 8px;
    background: #f8fbfd;
    padding: 14px;
  }

  .portal-multisport-card span,
  .portal-multisport-event span,
  .portal-multisport-ranking span {
    display: block;
    color: #6a7b8c;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .portal-multisport-card strong,
  .portal-multisport-event strong,
  .portal-multisport-ranking strong {
    display: block;
    margin-top: 4px;
    color: #102033;
    font-size: 15px;
  }

  .portal-multisport-event-list,
  .portal-multisport-ranking-list,
  .portal-multisport-scope-list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-multisport-event-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
  }

  .portal-multisport-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .portal-multisport-meta span {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    border-radius: 999px;
    background: #edf4f8;
    color: #40576c;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 800;
    text-transform: none;
  }

  .portal-multisport-mini-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .portal-multisport-mini-card {
    border: 1px solid #e1edf3;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .portal-multisport-table-wrap {
    overflow-x: auto;
  }

  .portal-multisport-table {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;
    font-size: 13px;
  }

  .portal-multisport-table th,
  .portal-multisport-table td {
    border-bottom: 1px solid #dbe8ef;
    padding: 10px;
    text-align: left;
    vertical-align: top;
  }

  .portal-multisport-table th {
    color: #40576c;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .portal-multisport-empty {
    border: 1px dashed #cbdce7;
    border-radius: 8px;
    color: #516273;
    padding: 16px;
  }

  @media (max-width: 760px) {
    .portal-multisport-shell {
      padding: 16px;
    }

    .portal-multisport-hero,
    .portal-multisport-section-header,
    .portal-multisport-event-head {
      grid-template-columns: 1fr;
    }
  }
`;

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Data por definir";
  }

  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Lisbon"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatUnavailableSection(section: string) {
  return section.charAt(0).toUpperCase() + section.slice(1);
}

export default async function PortalEscolasMultisportDemoPage() {
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
      <main className="portal-multisport-shell">
        <style>{multisportDemoStyles}</style>
        <div className="portal-multisport-wrap">
          <section className="portal-multisport-warning" aria-labelledby="portal-multisport-warning-title">
            <p className="portal-multisport-eyebrow">Portal das Escolas</p>
            <h1 id="portal-multisport-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-multisport-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalMultisportDemo(supabase, authorization);
  const totalRows = data.formats.length + data.events.length + data.rankings.reduce((total, ranking) => total + ranking.rows.length, 0);

  return (
    <main className="portal-multisport-shell">
      <style>{multisportDemoStyles}</style>
      <div className="portal-multisport-wrap">
        <section className="portal-multisport-hero" aria-labelledby="portal-multisport-title">
          <div>
            <p className="portal-multisport-eyebrow">Portal das Escolas · leitura demo</p>
            <h1 id="portal-multisport-title">Multidesporto demo</h1>
            <p className="portal-multisport-text">
              Leitura read-only dos dados demo materializados no modelo multidesporto novo. Esta página é isolada e não substitui as páginas atuais de jogos ou resultados.
            </p>
          </div>
          <span className="portal-multisport-tag">{formatCountLabel(totalRows, "registo lido", "registos lidos")}</span>
        </section>

        <nav className="portal-multisport-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas/jogos">Jogos atuais</a>
          <a href="/portal-escolas/resultados">Resultados atuais</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-multisport-notice" aria-labelledby="portal-multisport-notice-title">
            <h2 id="portal-multisport-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas multidesporto ainda não estão disponíveis para leitura nesta base de dados: {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-multisport-section" aria-labelledby="portal-multisport-scope-title">
          <div className="portal-multisport-section-header">
            <div>
              <p className="portal-multisport-eyebrow">Âmbito ativo</p>
              <h2 id="portal-multisport-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-multisport-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-multisport-scope-list">
            {data.scopes.map((scope) => (
              <li key={scope.id} className="portal-multisport-card">
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

        <section className="portal-multisport-section" aria-labelledby="portal-multisport-formats-title">
          <div className="portal-multisport-section-header">
            <div>
              <p className="portal-multisport-eyebrow">Formato</p>
              <h2 id="portal-multisport-formats-title">Formatos de competição lidos</h2>
            </div>
            <span className="portal-multisport-tag">{formatCountLabel(data.formats.length, "formato", "formatos")}</span>
          </div>

          {data.formats.length > 0 ? (
            <div className="portal-multisport-grid">
              {data.formats.map((format) => (
                <article key={format.key} className="portal-multisport-card">
                  <span>Nome</span>
                  <strong>{format.name}</strong>
                  <span>Código</span>
                  <strong>{format.code}</strong>
                  <span>Competição</span>
                  <strong>{format.competitionLabel}</strong>
                  <div className="portal-multisport-meta">
                    <span>{format.status}</span>
                    <span>Evento: {format.eventModel}</span>
                    <span>Resultado: {format.resultModel}</span>
                    <span>Ranking: {format.rankingModel}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="portal-multisport-empty">Ainda não existem formatos multidesporto visíveis para o âmbito autorizado.</p>
          )}
        </section>

        <section className="portal-multisport-section" aria-labelledby="portal-multisport-events-title">
          <div className="portal-multisport-section-header">
            <div>
              <p className="portal-multisport-eyebrow">Eventos</p>
              <h2 id="portal-multisport-events-title">Eventos demo materializados</h2>
            </div>
            <span className="portal-multisport-tag">{formatCountLabel(data.events.length, "evento", "eventos")}</span>
          </div>

          {data.events.length > 0 ? (
            <ul className="portal-multisport-event-list">
              {data.events.map((event) => (
                <li key={event.key} className="portal-multisport-event">
                  <div className="portal-multisport-event-head">
                    <div>
                      <span>{event.competitionLabel}</span>
                      <strong>{event.name}</strong>
                    </div>
                    <span className="portal-multisport-tag">{event.type}</span>
                  </div>
                  <div className="portal-multisport-meta">
                    <span>{event.stageLabel}</span>
                    <span>{formatDateTime(event.scheduledAt)}</span>
                    <span>{event.venue?.trim() || "Local por definir"}</span>
                    <span>{event.status}</span>
                  </div>
                  <div className="portal-multisport-mini-grid">
                    <div className="portal-multisport-mini-card">
                      <span>Participantes</span>
                      <strong>{event.participantLabels.length > 0 ? event.participantLabels.join(" · ") : "Sem participantes"}</strong>
                    </div>
                    <div className="portal-multisport-mini-card">
                      <span>Resultado por participante</span>
                      <strong>
                        {event.resultEntries.length > 0
                          ? event.resultEntries.map((entry) => `${entry.participantLabel}: ${entry.scoreLabel} (${entry.pointsLabel} pts)`).join(" · ")
                          : "Sem resultado materializado"}
                      </strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="portal-multisport-empty">Ainda não existem eventos multidesporto visíveis para o âmbito autorizado.</p>
          )}
        </section>

        <section className="portal-multisport-section" aria-labelledby="portal-multisport-rankings-title">
          <div className="portal-multisport-section-header">
            <div>
              <p className="portal-multisport-eyebrow">Classificações</p>
              <h2 id="portal-multisport-rankings-title">Rankings demo</h2>
            </div>
            <span className="portal-multisport-tag">{formatCountLabel(data.rankings.length, "ranking", "rankings")}</span>
          </div>

          {data.rankings.length > 0 ? (
            <div className="portal-multisport-ranking-list">
              {data.rankings.map((ranking) => (
                <article key={ranking.key} className="portal-multisport-ranking">
                  <span>{ranking.competitionLabel}</span>
                  <strong>{ranking.name}</strong>
                  <div className="portal-multisport-meta">
                    <span>{ranking.rankingType}</span>
                    <span>{ranking.status}</span>
                    <span>{ranking.slug}</span>
                  </div>
                  <div className="portal-multisport-table-wrap">
                    <table className="portal-multisport-table">
                      <thead>
                        <tr>
                          <th>Pos.</th>
                          <th>Participante</th>
                          <th>Pts</th>
                          <th>J</th>
                          <th>V-E-D</th>
                          <th>Marcador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.rows.map((row) => (
                          <tr key={row.key}>
                            <td>{row.rankLabel}</td>
                            <td>{row.participantLabel}</td>
                            <td>{row.pointsLabel}</td>
                            <td>{row.playedLabel}</td>
                            <td>{row.recordLabel}</td>
                            <td>{row.scoreLabel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="portal-multisport-empty">Ainda não existem rankings multidesporto visíveis para o âmbito autorizado.</p>
          )}
        </section>
      </div>
    </main>
  );
}
