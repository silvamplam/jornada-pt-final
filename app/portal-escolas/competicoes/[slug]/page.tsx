import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalCompetitionDetail } from "@/lib/portal-escolas/readPortalCompetitionDetail";
import { PortalEscolasInternalNav } from "../../_components/PortalEscolasInternalNav";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata = {
  title: "Detalhe da competição | Portal das Escolas | Jornada.pt",
  description: "Leitura read-only detalhada por competição formal no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const competitionDetailStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-competition-detail-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-competition-detail-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-competition-detail-hero,
  .portal-competition-detail-section,
  .portal-competition-detail-warning,
  .portal-competition-detail-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-competition-detail-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-competition-detail-section,
  .portal-competition-detail-warning,
  .portal-competition-detail-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-competition-detail-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-competition-detail-hero h1,
  .portal-competition-detail-warning h1,
  .portal-competition-detail-section h2,
  .portal-competition-detail-section h3,
  .portal-competition-detail-notice h2 {
    margin: 0;
  }

  .portal-competition-detail-hero h1,
  .portal-competition-detail-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-competition-detail-section h2,
  .portal-competition-detail-notice h2 {
    font-size: 24px;
    line-height: 1.2;
  }

  .portal-competition-detail-section h3 {
    font-size: 18px;
    line-height: 1.25;
  }

  .portal-competition-detail-text,
  .portal-competition-detail-warning p,
  .portal-competition-detail-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.55;
  }

  .portal-competition-detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
  }

  .portal-competition-detail-actions a,
  .portal-competition-detail-link {
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

  .portal-competition-detail-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    min-height: 30px;
    padding: 6px 10px;
    border: 1px solid #bcd7df;
    border-radius: 999px;
    background: #e7f4f8;
    color: #0f6478;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .portal-competition-detail-section-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-competition-detail-summary-grid,
  .portal-competition-detail-tree,
  .portal-competition-detail-format-list,
  .portal-competition-detail-event-list,
  .portal-competition-detail-ranking-list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-competition-detail-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-competition-detail-tree {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .portal-competition-detail-summary-card,
  .portal-competition-detail-tree-card,
  .portal-competition-detail-format,
  .portal-competition-detail-event,
  .portal-competition-detail-ranking {
    min-width: 0;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
    padding: 14px;
  }

  .portal-competition-detail-summary-card,
  .portal-competition-detail-tree-card,
  .portal-competition-detail-format,
  .portal-competition-detail-event,
  .portal-competition-detail-ranking {
    display: grid;
    gap: 6px;
  }

  .portal-competition-detail-summary-card span,
  .portal-competition-detail-tree-card span,
  .portal-competition-detail-format span,
  .portal-competition-detail-event span,
  .portal-competition-detail-ranking span,
  .portal-competition-detail-label,
  .portal-competition-detail-table th {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-competition-detail-summary-card strong,
  .portal-competition-detail-tree-card strong,
  .portal-competition-detail-format strong,
  .portal-competition-detail-event strong,
  .portal-competition-detail-ranking strong {
    color: #102033;
    overflow-wrap: anywhere;
  }


  .portal-competition-detail-format-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-competition-detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .portal-competition-detail-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #ffffff;
  }

  .portal-competition-detail-table {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;
  }

  .portal-competition-detail-table th,
  .portal-competition-detail-table td {
    padding: 10px;
    border-bottom: 1px solid #dbe7ef;
    text-align: left;
    vertical-align: top;
  }

  .portal-competition-detail-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .portal-competition-detail-table td {
    color: #1b2c3d;
    font-size: 14px;
  }

  .portal-competition-detail-empty {
    margin: 0;
    padding: 14px;
    border: 1px dashed #bcd7df;
    border-radius: 8px;
    color: #526274;
    background: #f8fbfd;
    font-size: 14px;
    line-height: 1.5;
  }

  @media (max-width: 980px) {
    .portal-competition-detail-shell {
      padding: 18px;
    }

    .portal-competition-detail-hero,
    .portal-competition-detail-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-competition-detail-hero h1,
    .portal-competition-detail-warning h1 {
      font-size: 32px;
    }

    .portal-competition-detail-summary-grid,
    .portal-competition-detail-tree,
    .portal-competition-detail-format-list {
      grid-template-columns: 1fr;
    }
  }
`;

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
    timeZone: "Atlantic/Madeira"
  }).format(date);
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    entidades: "Entidades",
    contextos: "Contextos",
    competições: "Competições",
    "modalidades formais": "Modalidades formais",
    "catálogo de modalidades": "Catálogo de modalidades",
    "formatos multidesporto": "Formatos multidesporto",
    "catálogo de formatos": "Catálogo de formatos",
    "eventos multidesporto": "Eventos multidesporto",
    "participantes de evento": "Participantes de evento",
    "entradas de resultado multidesporto": "Entradas de resultado multidesporto",
    "rankings multidesporto": "Rankings multidesporto",
    "linhas de ranking multidesporto": "Linhas de ranking multidesporto",
    "fases/jornadas": "Fases/jornadas",
    participantes: "Participantes"
  };

  return labels[section] ?? section;
}

export default async function PortalCompetitionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const safeSlug = decodeURIComponent(slug ?? "").trim();
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
      <main className="portal-competition-detail-shell">
        <style>{competitionDetailStyles}</style>
        <div className="portal-competition-detail-wrap">
          <section className="portal-competition-detail-warning" aria-labelledby="portal-competition-detail-warning-title">
            <p className="portal-competition-detail-eyebrow">Portal das Escolas</p>
            <h1 id="portal-competition-detail-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-competition-detail-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalCompetitionDetail(supabase, authorization, safeSlug);
  const mainCompetition = data.competitions[0] ?? null;
  const formatCount = data.competitions.reduce((total, competition) => total + competition.summary.formatCount, 0);
  const eventCount = data.competitions.reduce((total, competition) => total + competition.summary.eventCount, 0);
  const rankingCount = data.competitions.reduce((total, competition) => total + competition.summary.rankingCount, 0);

  return (
    <main className="portal-competition-detail-shell">
      <style>{competitionDetailStyles}</style>
      <div className="portal-competition-detail-wrap">
        <section className="portal-competition-detail-hero" aria-labelledby="portal-competition-detail-title">
          <div>
            <p className="portal-competition-detail-eyebrow">Portal das Escolas · detalhe da competição</p>
            <h1 id="portal-competition-detail-title">{mainCompetition?.name ?? "Competição não encontrada"}</h1>
            <p className="portal-competition-detail-text">
              Leitura read-only da competição como ponte entre modalidade, formato, eventos, participantes, resultados e ranking.
            </p>
          </div>
          <span className="portal-competition-detail-tag">
            {mainCompetition ? `${formatCount} formatos · ${eventCount} eventos · ${rankingCount} rankings` : "sem dados"}
          </span>
        </section>

        <PortalEscolasInternalNav current="competicoes" />

        <nav className="portal-competition-detail-actions" aria-label="Navegação do detalhe da competição">
          <a href="/portal-escolas/competicoes">Voltar a competições</a>
          <a href="/portal-escolas/modalidades">Modalidades</a>
          <a href="/portal-escolas/multidesporto-demo">Multidesporto demo</a>
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-competition-detail-notice" aria-labelledby="portal-competition-detail-notice-title">
            <h2 id="portal-competition-detail-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas da competição ainda não estão disponíveis para leitura nesta base de dados: {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        {!mainCompetition ? (
          <section className="portal-competition-detail-section" aria-labelledby="portal-competition-detail-empty-title">
            <h2 id="portal-competition-detail-empty-title">Sem competição visível neste âmbito</h2>
            <p className="portal-competition-detail-text">
              Não foi encontrada uma competição com o identificador <strong>{safeSlug || "sem slug"}</strong> dentro das permissões ativas deste utilizador.
            </p>
          </section>
        ) : (
          data.competitions.map((competition) => (
            <section className="portal-competition-detail-section" key={competition.key} aria-labelledby={`portal-competition-${competition.key}`}>
              <div className="portal-competition-detail-section-header">
                <div>
                  <p className="portal-competition-detail-eyebrow">Eixo formal</p>
                  <h2 id={`portal-competition-${competition.key}`}>{competition.name}</h2>
                  <p className="portal-competition-detail-text">
                    Esta leitura não substitui jogos, resultados ou páginas legacy. Apenas mostra a competição como nó intermédio da árvore multidesporto.
                  </p>
                </div>
                <span className="portal-competition-detail-tag">{competition.statusLabel}</span>
              </div>

              <div className="portal-competition-detail-tree" aria-label="Árvore multidesporto da competição">
                <article className="portal-competition-detail-tree-card">
                  <span>Entidade</span>
                  <strong>{competition.entityLabel}</strong>
                </article>
                <article className="portal-competition-detail-tree-card">
                  <span>Contexto</span>
                  <strong>{competition.contextLabel}</strong>
                </article>
                <article className="portal-competition-detail-tree-card">
                  <span>Modalidade</span>
                  <strong>{competition.formalModalityLabel}</strong>
                  {competition.formalModalityHref ? (
                    <a className="portal-competition-detail-link" href={competition.formalModalityHref}>
                      Abrir modalidade
                    </a>
                  ) : null}
                </article>
                <article className="portal-competition-detail-tree-card">
                  <span>Competição</span>
                  <strong>{competition.name}</strong>
                </article>
                <article className="portal-competition-detail-tree-card">
                  <span>Formato</span>
                  <strong>{competition.formats[0]?.name ?? competition.legacyFormatLabel}</strong>
                </article>
              </div>

              <section className="portal-competition-detail-section" aria-labelledby={`portal-competition-summary-${competition.key}`}>
                <div className="portal-competition-detail-section-header">
                  <div>
                    <p className="portal-competition-detail-eyebrow">Resumo</p>
                    <h3 id={`portal-competition-summary-${competition.key}`}>Competição formal</h3>
                  </div>
                  <span className="portal-competition-detail-tag">{competition.scopeLabel}</span>
                </div>

                <div className="portal-competition-detail-summary-grid">
                  <article className="portal-competition-detail-summary-card">
                    <span>Modalidade formal</span>
                    <strong>{competition.formalModalityLabel}</strong>
                    <span>Estado da modalidade</span>
                    <strong>{competition.formalModalityStatusLabel}</strong>
                  </article>
                  <article className="portal-competition-detail-summary-card">
                    <span>Catálogo da modalidade</span>
                    <strong>{competition.modalityCatalogLabel}</strong>
                    <span>Código canónico</span>
                    <strong>{competition.modalityCatalogCode ?? "Sem código associado"}</strong>
                  </article>
                  <article className="portal-competition-detail-summary-card">
                    <span>Formato legacy</span>
                    <strong>{competition.legacyFormatLabel}</strong>
                    <span>Modalidade legacy</span>
                    <strong>{competition.legacyModalityLabel}</strong>
                  </article>
                  <article className="portal-competition-detail-summary-card">
                    <span>Slug</span>
                    <strong>{competition.slug ?? "Sem slug"}</strong>
                    <span>Código local da modalidade</span>
                    <strong>{competition.formalModalityLocalCode ?? "Sem código local"}</strong>
                  </article>
                  <article className="portal-competition-detail-summary-card">
                    <span>Eventos</span>
                    <strong>{formatCountLabel(competition.summary.eventCount, "evento", "eventos")}</strong>
                    <span>Participantes em eventos</span>
                    <strong>{competition.summary.eventParticipantCount}</strong>
                  </article>
                  <article className="portal-competition-detail-summary-card">
                    <span>Resultados e rankings</span>
                    <strong>{competition.summary.resultEntryCount} entradas de resultado</strong>
                    <span>Rankings</span>
                    <strong>{competition.summary.rankingCount} rankings · {competition.summary.rankingEntryCount} linhas</strong>
                  </article>
                </div>
              </section>

              <section className="portal-competition-detail-section" aria-labelledby={`portal-competition-formats-${competition.key}`}>
                <div className="portal-competition-detail-section-header">
                  <div>
                    <p className="portal-competition-detail-eyebrow">Competição → formato</p>
                    <h3 id={`portal-competition-formats-${competition.key}`}>Formatos competitivos</h3>
                    <p className="portal-competition-detail-text">
                      O formato define a mecânica competitiva: tipo de evento, modelo de resultado e modelo de ranking/classificação.
                    </p>
                  </div>
                  <span className="portal-competition-detail-tag">{formatCountLabel(competition.summary.formatCount, "formato", "formatos")}</span>
                </div>

                {competition.formats.length > 0 ? (
                  <div className="portal-competition-detail-format-list">
                    {competition.formats.map((format) => (
                      <article className="portal-competition-detail-format" key={format.key}>
                        <span>{format.formatScopeLabel}</span>
                        <strong>{format.name}</strong>
                        <div className="portal-competition-detail-meta">
                          <span className="portal-competition-detail-tag">{format.statusLabel}</span>
                          {format.catalogCode ? <span className="portal-competition-detail-tag">catálogo: {format.catalogCode}</span> : null}
                          <span className="portal-competition-detail-tag">código: {format.codeLabel}</span>
                        </div>
                        <span>Catálogo</span>
                        <strong>{format.catalogLabel}</strong>
                        <span>Família</span>
                        <strong>{format.formatFamilyLabel}</strong>
                        <span>Evento · resultado · ranking</span>
                        <strong>{format.eventModelLabel} · {format.resultModelLabel} · {format.rankingModelLabel}</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="portal-competition-detail-empty">Ainda não existe formato formal disponível para esta competição neste âmbito autorizado.</p>
                )}
              </section>

              <section className="portal-competition-detail-section" aria-labelledby={`portal-competition-events-${competition.key}`}>
                <div className="portal-competition-detail-section-header">
                  <div>
                    <p className="portal-competition-detail-eyebrow">Formato → eventos</p>
                    <h3 id={`portal-competition-events-${competition.key}`}>Eventos, participantes e resultados</h3>
                    <p className="portal-competition-detail-text">
                      Leitura do modelo novo por competição. Nos campeonatos por jornadas, estes eventos equivalem aos jogos materializados a partir da ponte legacy.
                    </p>
                  </div>
                  <span className="portal-competition-detail-tag">{formatCountLabel(competition.summary.eventCount, "evento", "eventos")}</span>
                </div>

                {competition.events.length > 0 ? (
                  <div className="portal-competition-detail-event-list">
                    {competition.events.map((event) => (
                      <article className="portal-competition-detail-event" key={event.key}>
                        <div className="portal-competition-detail-section-header">
                          <div>
                            <span>{event.stageLabel}</span>
                            <h3>{event.name}</h3>
                          </div>
                          <span className="portal-competition-detail-tag">{event.statusLabel}</span>
                        </div>
                        <div className="portal-competition-detail-meta">
                          <span className="portal-competition-detail-tag">{event.typeLabel}</span>
                          <span className="portal-competition-detail-tag">{formatDateTime(event.scheduledAt)}</span>
                          <span className="portal-competition-detail-tag">{event.venue ?? "Sem local"}</span>
                        </div>
                        <span>Participantes</span>
                        <strong>{event.participantLabels.length > 0 ? event.participantLabels.join(" · ") : "Sem participantes associados"}</strong>
                        {event.resultEntries.length > 0 ? (
                          <div className="portal-competition-detail-table-wrap">
                            <table className="portal-competition-detail-table">
                              <thead>
                                <tr>
                                  <th>Participante</th>
                                  <th>Resultado</th>
                                  <th>Pontos</th>
                                  <th>Desfecho</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.resultEntries.map((entry) => (
                                  <tr key={entry.key}>
                                    <td>{entry.participantLabel}</td>
                                    <td>{entry.scoreLabel}</td>
                                    <td>{entry.pointsLabel}</td>
                                    <td>{entry.isWinner ? `${entry.outcomeLabel} · vencedor` : entry.outcomeLabel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="portal-competition-detail-empty">Este evento ainda não tem entradas de resultado no modelo novo.</p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="portal-competition-detail-empty">Ainda não existem eventos formais disponíveis para esta competição neste âmbito autorizado.</p>
                )}
              </section>

              <section className="portal-competition-detail-section" aria-labelledby={`portal-competition-rankings-${competition.key}`}>
                <div className="portal-competition-detail-section-header">
                  <div>
                    <p className="portal-competition-detail-eyebrow">Resultados → ranking</p>
                    <h3 id={`portal-competition-rankings-${competition.key}`}>Classificação / ranking</h3>
                    <p className="portal-competition-detail-text">
                      O ranking continua read-only e não substitui as páginas atuais de resultados ou classificações.
                    </p>
                  </div>
                  <span className="portal-competition-detail-tag">{formatCountLabel(competition.summary.rankingCount, "ranking", "rankings")}</span>
                </div>

                {competition.rankings.length > 0 ? (
                  <div className="portal-competition-detail-ranking-list">
                    {competition.rankings.map((ranking) => (
                      <article className="portal-competition-detail-ranking" key={ranking.key}>
                        <div className="portal-competition-detail-section-header">
                          <div>
                            <span>{ranking.rankingScopeLabel}</span>
                            <h3>{ranking.name}</h3>
                          </div>
                          <span className="portal-competition-detail-tag">{ranking.statusLabel}</span>
                        </div>
                        <div className="portal-competition-detail-meta">
                          <span className="portal-competition-detail-tag">{ranking.rankingTypeLabel}</span>
                          <span className="portal-competition-detail-tag">{formatCountLabel(ranking.rows.length, "linha", "linhas")}</span>
                        </div>
                        {ranking.rows.length > 0 ? (
                          <div className="portal-competition-detail-table-wrap">
                            <table className="portal-competition-detail-table">
                              <thead>
                                <tr>
                                  <th>Posição</th>
                                  <th>Participante</th>
                                  <th>Pontos</th>
                                  <th>Jogos/provas</th>
                                  <th>Registo</th>
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
                        ) : (
                          <p className="portal-competition-detail-empty">Este ranking ainda não tem linhas disponíveis.</p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="portal-competition-detail-empty">Ainda não existe ranking formal disponível para esta competição neste âmbito autorizado.</p>
                )}
              </section>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
