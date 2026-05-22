import {
  getAdminMatchesEditor,
  getAdminMatchdaysEditor,
  getAdminSeasonParticipants,
  getAdminSeasons,
  getAdminStandingsEditor,
  type SupabaseAdminMatch,
  type SupabaseAdminMatchday,
  type SupabaseAdminSeasonTeam,
  type SupabaseAdminStanding,
  type SupabaseCompetition,
  type SupabaseCountry,
  type SupabaseSeason
} from "@/lib/supabase";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const managerStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .manager-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .manager-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .manager-hero p,
  .manager-hero h1,
  .manager-hero span {
    margin: 0;
  }

  .manager-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .manager-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .manager-hero span {
    display: block;
    margin-top: 10px;
    max-width: 760px;
    color: #cdd5df;
    font-size: 16px;
  }

  .manager-hero a,
  .manager-button,
  .manager-link-button {
    display: inline-block;
    flex: 0 0 auto;
    padding: 12px 16px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .manager-hero a {
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: transparent;
  }

  .manager-context,
  .manager-panel,
  .manager-warning {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .manager-warning {
    padding: 20px;
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .manager-warning h2,
  .manager-warning p {
    margin: 0;
  }

  .manager-warning p {
    margin-top: 8px;
    color: #5e6874;
  }

  .manager-context header,
  .manager-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .manager-context h2,
  .manager-panel h2,
  .manager-context p,
  .manager-panel p {
    margin: 0;
  }

  .manager-context h2,
  .manager-panel h2 {
    font-size: 21px;
    text-transform: uppercase;
  }

  .manager-context p,
  .manager-panel p {
    margin-top: 6px;
    color: #687380;
  }

  .manager-form {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 12px;
    align-items: end;
    padding: 18px 20px;
  }

  .manager-field {
    display: grid;
    gap: 6px;
  }

  .manager-field label {
    color: #5e6874;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .manager-field select {
    width: 100%;
    min-height: 46px;
    padding: 0 12px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    background: #ffffff;
    color: #10151b;
    font: inherit;
    font-size: 16px;
  }

  .manager-path {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 0 20px 20px;
  }

  .manager-path article {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  .manager-path small,
  .manager-step small,
  .manager-stat small {
    display: block;
    color: #687380;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .manager-path strong {
    display: block;
    margin-top: 8px;
    min-width: 0;
    overflow: hidden;
    font-size: 21px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .manager-steps {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0;
  }

  .manager-step {
    min-height: 164px;
    padding: 18px;
    border-right: 1px solid #eef2f6;
  }

  .manager-step:last-child {
    border-right: 0;
  }

  .manager-step span {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: #10151b;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
  }

  .manager-step b {
    display: block;
    margin-top: 14px;
    font-size: 16px;
    text-transform: uppercase;
  }

  .manager-step small {
    margin-top: 7px;
    min-height: 48px;
    text-transform: none;
    line-height: 1.35;
  }

  .manager-step a {
    display: inline-block;
    margin-top: 14px;
    color: #e5252a;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .manager-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 14px;
  }

  .manager-stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .manager-stat {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  .manager-stat strong {
    display: block;
    color: #e5252a;
    font-size: 34px;
    line-height: 1;
  }

  .manager-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .manager-list li {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-height: 54px;
    padding: 10px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .manager-list li:last-child {
    border-bottom: 0;
  }

  .manager-list .manager-logo {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 50%;
    background: #f8fafc;
    color: #5e6874;
    font-size: 11px;
    font-weight: 900;
  }

  .manager-list img {
    display: block;
    width: 24px !important;
    max-width: 24px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .manager-list b {
    display: block;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .manager-list small {
    display: block;
    margin-top: 3px;
    color: #687380;
  }

  .manager-list em {
    color: #687380;
    font-style: normal;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .manager-panel footer {
    padding: 14px 18px 18px;
    border-top: 1px solid #eef2f6;
  }

  .manager-empty {
    padding: 18px;
    color: #687380;
  }

  @media (max-width: 1180px) {
    .manager-form,
    .manager-path,
    .manager-steps,
    .manager-grid,
    .manager-stat-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 760px) {
    .manager-shell {
      padding: 16px;
    }

    .manager-hero,
    .manager-form,
    .manager-path,
    .manager-steps,
    .manager-grid,
    .manager-stat-row {
      display: grid;
      grid-template-columns: 1fr;
    }

    .manager-hero a,
    .manager-button {
      width: 100%;
      text-align: center;
    }
  }
`;

function oneParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalise(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function competitionCountryId(competition: SupabaseCompetition, countries: SupabaseCountry[]) {
  if (competition.country_id) {
    return competition.country_id;
  }

  return countries.find((country) => normalise(country.name) === normalise(competition.country))?.id ?? "";
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  try {
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function sourceLabel(value: string | null | undefined, manualOverride?: boolean | null) {
  if (manualOverride) {
    return "Corrigido pelo administrador";
  }

  if (value === "api") {
    return "Sincronizado por API";
  }

  if (value === "mixed") {
    return "Misto";
  }

  return "Introduzido manualmente";
}

function statusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    live: "Em direto",
    halftime: "Intervalo",
    finished: "Terminado",
    postponed: "Adiado",
    cancelled: "Cancelado"
  };

  return labels[status ?? ""] ?? status ?? "Sem estado";
}

function teamLogo(team: { logo_url: string | null; short_name?: string | null; name?: string | null } | null) {
  if (!team) {
    return <span className="manager-logo">CL</span>;
  }

  return (
    <span className="manager-logo">
      {team.logo_url ? <img src={team.logo_url} alt="" /> : team.short_name ?? team.name?.slice(0, 2) ?? "CL"}
    </span>
  );
}

function selectDefault<T extends { id: string }>(items: T[], selectedId: string | undefined) {
  return items.find((item) => item.id === selectedId) ?? items[0] ?? null;
}

function buildContextQuery(country: SupabaseCountry | null, competition: SupabaseCompetition | null, season: SupabaseSeason | null) {
  const params = new URLSearchParams();
  if (country) params.set("pais", country.id);
  if (competition) params.set("competicao", competition.id);
  if (season) params.set("epoca", season.id);
  return params.toString();
}

function latestStanding(standings: SupabaseAdminStanding[]) {
  return standings[0] ?? null;
}

function ContextList({
  items,
  emptyText,
  renderItem
}: {
  items: unknown[];
  emptyText: string;
  renderItem: (item: unknown) => ReactNode;
}) {
  if (items.length === 0) {
    return <div className="manager-empty">{emptyText}</div>;
  }

  return <ul className="manager-list">{items.map(renderItem)}</ul>;
}

export default async function AdminSeasonManagerPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = searchParams ? await searchParams : {};
  const [seasonData, participantData, matchData, matchdayData, standingData] = await Promise.all([
    getAdminSeasons(),
    getAdminSeasonParticipants(),
    getAdminMatchesEditor(),
    getAdminMatchdaysEditor(),
    getAdminStandingsEditor()
  ]);

  const configured =
    seasonData.configured &&
    participantData.configured &&
    matchData.configured &&
    matchdayData.configured &&
    standingData.configured;
  const error = seasonData.error ?? participantData.error ?? matchData.error ?? matchdayData.error ?? standingData.error;

  const countries = seasonData.countries.filter((country) => country.is_active !== false);
  const competitions = seasonData.competitions.filter((competition) => competition.is_active !== false);
  const seasons = seasonData.seasons;

  const selectedCountry = selectDefault(countries, oneParam(params, "pais"));
  const competitionsForCountry = selectedCountry
    ? competitions.filter((competition) => competitionCountryId(competition, countries) === selectedCountry.id)
    : competitions;
  const selectedCompetition = selectDefault(competitionsForCountry, oneParam(params, "competicao"));
  const seasonsForCompetition = selectedCompetition
    ? seasons.filter((season) => season.competition_id === selectedCompetition.id)
    : [];
  const selectedSeason =
    seasonsForCompetition.find((season) => season.id === oneParam(params, "epoca")) ??
    seasonsForCompetition.find((season) => season.is_current) ??
    seasonsForCompetition[0] ??
    null;
  const contextQuery = buildContextQuery(selectedCountry, selectedCompetition, selectedSeason);
  const scopedQuery = selectedSeason ? `?epoca=${encodeURIComponent(selectedSeason.id)}` : "";

  const participants = selectedSeason
    ? participantData.participants
        .filter((participant) => participant.season_id === selectedSeason.id && participant.status !== "removed")
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : [];
  const matchdays = selectedSeason
    ? matchdayData.matchdays
        .filter((matchday) => matchday.season_id === selectedSeason.id)
        .sort((a, b) => (a.display_order ?? a.number ?? 0) - (b.display_order ?? b.number ?? 0))
    : [];
  const matches = selectedSeason
    ? matchData.matches.filter((match) => match.season_id === selectedSeason.id)
    : [];
  const standings = selectedSeason ? standingData.standings.filter((standing) => standing.season_id === selectedSeason.id) : [];
  const finishedMatches = matches.filter((match) => match.status === "finished");
  const liveMatches = matches.filter((match) => match.status === "live" || match.status === "halftime");
  const scheduledMatches = matches.filter((match) => match.status === "scheduled" || !match.status);
  const editorialMatchdays = matchdays.filter(
    (matchday) =>
      Boolean(matchday.editorial_title) ||
      Boolean(matchday.editorial_summary) ||
      Boolean(matchday.context_summary) ||
      Boolean(matchday.hero_image_url) ||
      Boolean(matchday.video_url) ||
      Boolean(matchday.memory_note)
  );
  const standing = latestStanding(standings);

  return (
    <main className="manager-shell">
      <style>{managerStyles}</style>
      <header className="manager-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Centro de gestao</h1>
          <span>
            Escolhe pais, competicao e epoca. A partir desse caminho, participantes, jornadas, jogos,
            classificacao e contexto editorial ficam subordinados ao mesmo momento competitivo.
          </span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!configured ? (
        <section className="manager-warning">
          <h2>Supabase ainda nao ligado</h2>
          <p>Configura primeiro as variaveis da Supabase na Vercel.</p>
        </section>
      ) : error ? (
        <section className="manager-warning">
          <h2>Ligacao encontrada, mas a leitura falhou</h2>
          <p>{error}</p>
        </section>
      ) : (
        <>
          <section className="manager-context" aria-label="Contexto principal de gestao">
            <header>
              <h2>Caminho de trabalho</h2>
              <p>Os menus mostram apenas o que ja foi criado no backoffice. Cada escolha limita a seguinte.</p>
            </header>

            <form className="manager-form" action="/admin/gestor" method="get">
              <div className="manager-field">
                <label htmlFor="pais">Pais</label>
                <select id="pais" name="pais" defaultValue={selectedCountry?.id ?? ""}>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="manager-field">
                <label htmlFor="competicao">Competicao</label>
                <select id="competicao" name="competicao" defaultValue={selectedCompetition?.id ?? ""}>
                  {competitionsForCountry.map((competition) => (
                    <option key={competition.id} value={competition.id}>
                      {competition.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="manager-field">
                <label htmlFor="epoca">Epoca</label>
                <select id="epoca" name="epoca" defaultValue={selectedSeason?.id ?? ""}>
                  {seasonsForCompetition.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="manager-button" type="submit">
                Abrir contexto
              </button>
            </form>

            <div className="manager-path" aria-label="Contexto selecionado">
              <article>
                <small>Pais</small>
                <strong>{selectedCountry?.name ?? "Cria um pais"}</strong>
              </article>
              <article>
                <small>Competicao</small>
                <strong>{selectedCompetition?.name ?? "Cria uma competicao"}</strong>
              </article>
              <article>
                <small>Epoca</small>
                <strong>{selectedSeason?.label ?? "Cria uma epoca"}</strong>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Etapas do contexto escolhido">
            <header>
              <h2>Gestao desta epoca</h2>
              <p>Primeiro defines a base objetiva. Depois fechas a leitura editorial da jornada.</p>
            </header>
            <div className="manager-steps">
              <article className="manager-step">
                <span>01</span>
                <b>Participantes</b>
                <small>{participants.length} clubes definidos como fonte de verdade desta epoca.</small>
                <a href={`/admin/participantes${scopedQuery}`}>Gerir</a>
              </article>
              <article className="manager-step">
                <span>02</span>
                <b>Jornadas</b>
                <small>{matchdays.length} momentos competitivos para organizar calendario e memoria.</small>
                <a href={`/admin/jornadas${scopedQuery}`}>Gerir</a>
              </article>
              <article className="manager-step">
                <span>03</span>
                <b>Jogos</b>
                <small>{matches.length} jogos dentro desta epoca, sempre a partir dos participantes.</small>
                <a href={`/admin/jogos${scopedQuery}`}>Gerir</a>
              </article>
              <article className="manager-step">
                <span>04</span>
                <b>Resultados</b>
                <small>{finishedMatches.length} terminados, {liveMatches.length} em direto, {scheduledMatches.length} agendados.</small>
                <a href={`/admin/jogos${scopedQuery}`}>Atualizar</a>
              </article>
              <article className="manager-step">
                <span>05</span>
                <b>Classificacao</b>
                <small>{standings.length} fotografias competitivas guardadas para esta epoca.</small>
                <a href={`/admin/classificacoes${scopedQuery}`}>Gerir</a>
              </article>
              <article className="manager-step">
                <span>06</span>
                <b>Contexto editorial</b>
                <small>{editorialMatchdays.length} jornadas ja com resumo, destaque, imagem ou memoria.</small>
                <a href={`/admin/jornadas${scopedQuery}`}>Fechar leitura</a>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Resumo do contexto">
            <header>
              <h2>Fotografia do contexto</h2>
              <p>
                {contextQuery
                  ? "Este e o estado atual do caminho selecionado."
                  : "Cria pais, competicao e epoca para comecar."}
              </p>
            </header>
            <div className="manager-stat-row">
              <article className="manager-stat">
                <strong>{participants.length}</strong>
                <small>Participantes</small>
              </article>
              <article className="manager-stat">
                <strong>{matchdays.length}</strong>
                <small>Jornadas</small>
              </article>
              <article className="manager-stat">
                <strong>{matches.length}</strong>
                <small>Jogos</small>
              </article>
              <article className="manager-stat">
                <strong>{standings.length}</strong>
                <small>Classificacoes</small>
              </article>
            </div>
          </section>

          <section className="manager-grid" aria-label="Listas do contexto selecionado">
            <article className="manager-panel">
              <header>
                <h2>Participantes</h2>
                <p>Clubes disponiveis para criar jogos nesta epoca.</p>
              </header>
              <ContextList
                items={participants.slice(0, 12)}
                emptyText="Ainda nao ha participantes neste contexto."
                renderItem={(item) => {
                  const participant = item as SupabaseAdminSeasonTeam;

                  return (
                    <li key={participant.id}>
                      {teamLogo(participant.team)}
                      <div>
                        <b>{participant.team?.name ?? "Clube"}</b>
                        <small>{sourceLabel(participant.data_source, participant.manual_override)}</small>
                      </div>
                      <em>{participant.team?.short_name ?? participant.display_order}</em>
                    </li>
                  );
                }}
              />
              <footer>
                <a className="manager-link-button" href={`/admin/participantes${scopedQuery}`}>
                  Gerir participantes
                </a>
              </footer>
            </article>

            <article className="manager-panel">
              <header>
                <h2>Jornadas</h2>
                <p>A unidade central onde a epoca ganha contexto.</p>
              </header>
              <ContextList
                items={matchdays.slice(0, 12)}
                emptyText="Ainda nao ha jornadas nesta epoca."
                renderItem={(item) => {
                  const matchday = item as SupabaseAdminMatchday;

                  return (
                    <li key={matchday.id}>
                      <span className="manager-logo">{matchday.number}</span>
                      <div>
                        <b>{matchday.editorial_title || matchday.label}</b>
                        <small>
                          {matchday.matchCount} jogos - {matchday.articleCount} noticias - {matchday.headlineCount} manchetes
                        </small>
                      </div>
                      <em>{statusLabel(matchday.status)}</em>
                    </li>
                  );
                }}
              />
              <footer>
                <a className="manager-link-button" href={`/admin/jornadas${scopedQuery}`}>
                  Gerir jornadas
                </a>
              </footer>
            </article>

            <article className="manager-panel">
              <header>
                <h2>Jogos</h2>
                <p>Calendario, resultados, estado e transmissao desta epoca.</p>
              </header>
              <ContextList
                items={matches.slice(0, 12)}
                emptyText="Ainda nao ha jogos neste contexto."
                renderItem={(item) => {
                  const match = item as SupabaseAdminMatch;
                  const score =
                    match.home_score === null || match.away_score === null
                      ? "x"
                      : `${match.home_score}-${match.away_score}`;

                  return (
                    <li key={match.id}>
                      {teamLogo(match.homeTeam)}
                      <div>
                        <b>
                          {match.homeTeam?.name ?? "Casa"} {score} {match.awayTeam?.name ?? "Fora"}
                        </b>
                        <small>
                          {formatShortDate(match.kickoff_at)} - {match.broadcastChannel?.name ?? "Sem TV"}
                        </small>
                      </div>
                      <em>{statusLabel(match.status)}</em>
                    </li>
                  );
                }}
              />
              <footer>
                <a className="manager-link-button" href={`/admin/jogos${scopedQuery}`}>
                  Gerir jogos
                </a>
              </footer>
            </article>

            <article className="manager-panel">
              <header>
                <h2>Classificacao</h2>
                <p>Fotografia competitiva guardada para este contexto.</p>
              </header>
              {standing ? (
                <ul className="manager-list">
                  {standing.rows.slice(0, 10).map((row) => (
                    <li key={row.id}>
                      {teamLogo(row.team)}
                      <div>
                        <b>{row.position}. {row.team?.name ?? "Clube"}</b>
                        <small>{row.played} jogos - DG {row.goal_difference}</small>
                      </div>
                      <em>{row.points} pts</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="manager-empty">Ainda nao ha fotografia de classificacao para esta epoca.</div>
              )}
              <footer>
                <a className="manager-link-button" href={`/admin/classificacoes${scopedQuery}`}>
                  Gerir classificacao
                </a>
              </footer>
            </article>

            <article className="manager-panel">
              <header>
                <h2>Transmissoes</h2>
                <p>Onde se ve cada jogo, sempre ligado ao calendario.</p>
              </header>
              <ContextList
                items={matches.filter((match) => Boolean(match.broadcastChannel)).slice(0, 10)}
                emptyText="Ainda nao ha transmissoes associadas aos jogos deste contexto."
                renderItem={(item) => {
                  const match = item as SupabaseAdminMatch;
                  const channel = match.broadcastChannel;

                  return (
                    <li key={match.id}>
                      <span className="manager-logo">
                        {channel?.logo_url ? <img src={channel.logo_url} alt="" /> : "TV"}
                      </span>
                      <div>
                        <b>{channel?.name ?? "Sem canal"}</b>
                        <small>
                          {match.homeTeam?.name ?? "Casa"} x {match.awayTeam?.name ?? "Fora"}
                        </small>
                      </div>
                      <em>{channel?.platform ?? "TV"}</em>
                    </li>
                  );
                }}
              />
              <footer>
                <a className="manager-link-button" href={`/admin/jogos-tv${scopedQuery}`}>
                  Ligar TV
                </a>
              </footer>
            </article>

            <article className="manager-panel">
              <header>
                <h2>Linha editorial</h2>
                <p>Manchete, resumo, destaque, imagem, video e memoria historica.</p>
              </header>
              <ContextList
                items={editorialMatchdays.slice(0, 10)}
                emptyText="Ainda nao ha contexto editorial preenchido nesta epoca."
                renderItem={(item) => {
                  const matchday = item as SupabaseAdminMatchday;

                  return (
                    <li key={matchday.id}>
                      <span className="manager-logo">{matchday.number}</span>
                      <div>
                        <b>{matchday.editorial_title || matchday.label}</b>
                        <small>{matchday.context_summary || matchday.editorial_summary || "Contexto por fechar"}</small>
                      </div>
                      <em>{matchday.is_featured ? "Destaque" : "Jornada"}</em>
                    </li>
                  );
                }}
              />
              <footer>
                <a className="manager-link-button" href={`/admin/jornadas${scopedQuery}`}>
                  Fechar contexto
                </a>
              </footer>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
