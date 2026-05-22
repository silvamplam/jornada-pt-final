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
  type SupabaseSeason,
  type SupabaseTeam
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

  .manager-field select,
  .manager-field input,
  .manager-field textarea {
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

  .manager-field textarea {
    min-height: 86px;
    padding-top: 12px;
    resize: vertical;
  }

  .manager-field input[type="checkbox"] {
    width: 18px;
    min-height: 18px;
    padding: 0;
  }

  .manager-button:disabled,
  .manager-link-button[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .manager-create-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 18px 20px;
  }

  .manager-create-card {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  .manager-create-card header {
    padding: 0;
    border: 0;
  }

  .manager-create-card h3,
  .manager-create-card p {
    margin: 0;
  }

  .manager-create-card h3 {
    font-size: 16px;
    text-transform: uppercase;
  }

  .manager-create-card p {
    margin-top: 5px;
    color: #687380;
    font-size: 13px;
    line-height: 1.35;
  }

  .manager-create-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
  }

  .manager-create-form .wide,
  .manager-create-form button {
    grid-column: 1 / -1;
  }

  .manager-check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    color: #5e6874;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .manager-message {
    margin: 18px 20px 0;
    padding: 13px 15px;
    border-radius: 8px;
    color: #174a28;
    background: #e9f8ef;
    font-weight: 700;
  }

  .manager-message.warning {
    color: #6a3d00;
    background: #fff4df;
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
    .manager-create-grid,
    .manager-create-form,
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
    .manager-create-grid,
    .manager-create-form,
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

function matchdayReturn(
  country: SupabaseCountry | null,
  competition: SupabaseCompetition | null,
  season: SupabaseSeason | null,
  matchday: SupabaseAdminMatchday | null
) {
  const params = new URLSearchParams(buildContextQuery(country, competition, season));
  if (matchday) params.set("jornada", matchday.id);
  const query = params.toString();

  return `/admin/gestor${query ? `?${query}` : ""}`;
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
  const created = oneParam(params, "created");
  const actionError = oneParam(params, "error");
  const selectedMatchdayId = oneParam(params, "jornada");
  const selectedMatchday = matchdays.find((matchday) => matchday.id === selectedMatchdayId) ?? matchdays[0] ?? null;
  const returnTo = matchdayReturn(selectedCountry, selectedCompetition, selectedSeason, selectedMatchday);
  const participantTeamIds = new Set(participants.map((participant) => participant.team_id));
  const availableTeams = participantData.teams.filter((team) => !participantTeamIds.has(team.id));
  const participantTeams = participants
    .map((participant) => participant.team)
    .filter((team): team is SupabaseTeam => Boolean(team));
  const firstParticipantTeam = participantTeams[0] ?? null;
  const secondParticipantTeam =
    participantTeams.find((team) => team.id !== firstParticipantTeam?.id) ?? null;
  const nextMatchdayNumber =
    matchdays.reduce((highestNumber, matchday) => Math.max(highestNumber, matchday.number ?? 0), 0) + 1;
  const canCreateCompetition = Boolean(selectedCountry);
  const canCreateSeason = Boolean(selectedCompetition);
  const canCreateParticipant = Boolean(selectedSeason && availableTeams.length > 0);
  const canCreateMatchday = Boolean(selectedSeason);
  const canCreateMatch = Boolean(
    selectedCompetition && selectedSeason && selectedMatchday && firstParticipantTeam && secondParticipantTeam
  );
  const createdLabels: Record<string, string> = {
    country: "Pais criado. Escolhe-o no caminho de trabalho para continuar.",
    competition: "Competicao criada dentro do pais selecionado.",
    season: "Epoca criada dentro da competicao selecionada.",
    participant: "Participante associado a esta epoca.",
    matchday: "Jornada criada como momento competitivo e editorial.",
    match: "Jogo criado dentro da jornada e limitado aos participantes da epoca."
  };
  const errorLabels: Record<string, string> = {
    "missing-service": "Liga primeiro a Supabase na Vercel.",
    "missing-fields": "Preenche os campos obrigatorios antes de guardar.",
    "unknown-action": "A acao enviada pelo formulario nao foi reconhecida.",
    "season-not-in-competition": "A epoca escolhida nao pertence a esta competicao.",
    "matchday-not-in-season": "A jornada escolhida nao pertence a esta epoca.",
    "home-team-not-in-season": "O clube da casa nao esta nos participantes desta epoca.",
    "away-team-not-in-season": "O clube visitante nao esta nos participantes desta epoca.",
    "same-team": "Escolhe dois clubes diferentes para o jogo.",
    save: "Nao foi possivel guardar. Confirma se a base de dados esta atualizada."
  };

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

          <section className="manager-panel" aria-label="Montador guiado da competicao e epoca">
            <header>
              <h2>Montador da competicao/epoca</h2>
              <p>
                Cria e alimenta cada nivel do caminho. Depois de definidos os participantes, jogos e
                classificacoes passam a respeitar esse universo.
              </p>
            </header>

            {created ? (
              <div className="manager-message">{createdLabels[created] ?? "Alteracao guardada."}</div>
            ) : null}
            {actionError ? (
              <div className="manager-message warning">
                {errorLabels[actionError] ?? `Nao foi possivel guardar: ${actionError}`}
              </div>
            ) : null}

            <div className="manager-create-grid">
              <article className="manager-create-card">
                <header>
                  <h3>1. Pais</h3>
                  <p>Cria apenas os paises que queres gerir no projeto.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="country" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <div className="manager-field wide">
                    <label htmlFor="new-country-name">Nome</label>
                    <input id="new-country-name" name="name" placeholder="Ex: Portugal" required />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-country-slug">Slug</label>
                    <input id="new-country-slug" name="slug" placeholder="portugal" />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-country-iso2">ISO2</label>
                    <input id="new-country-iso2" name="iso2" placeholder="PT" maxLength={2} />
                  </div>
                  <button className="manager-button" type="submit">
                    Criar pais
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>2. Competicao</h3>
                  <p>A competicao nasce dentro do pais escolhido.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="competition" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <input type="hidden" name="country" value={selectedCountry?.name ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="new-competition-name">Nome</label>
                    <input
                      id="new-competition-name"
                      name="name"
                      placeholder="Ex: Liga Portugal"
                      disabled={!canCreateCompetition}
                      required={canCreateCompetition}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-competition-slug">Slug</label>
                    <input id="new-competition-slug" name="slug" placeholder="liga-portugal" disabled={!canCreateCompetition} />
                  </div>
                  <div className="manager-field wide">
                    <label htmlFor="new-competition-logo">Logotipo URL</label>
                    <input id="new-competition-logo" name="logo_url" placeholder="https://..." disabled={!canCreateCompetition} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-competition-color">Cor</label>
                    <input id="new-competition-color" name="accent_color" placeholder="#e5252a" disabled={!canCreateCompetition} />
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateCompetition}>
                    Criar competicao
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>3. Epoca</h3>
                  <p>A epoca cria o universo competitivo onde vais trabalhar.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="season" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                  <div className="manager-field wide">
                    <label htmlFor="new-season-label">Nome da epoca</label>
                    <input
                      id="new-season-label"
                      name="label"
                      placeholder="Ex: 2024/25"
                      disabled={!canCreateSeason}
                      required={canCreateSeason}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-season-start">Inicio</label>
                    <input id="new-season-start" name="starts_on" type="date" disabled={!canCreateSeason} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-season-end">Fim</label>
                    <input id="new-season-end" name="ends_on" type="date" disabled={!canCreateSeason} />
                  </div>
                  <label className="manager-check">
                    <input name="is_current" type="checkbox" value="1" disabled={!canCreateSeason} />
                    Epoca atual
                  </label>
                  <button className="manager-button" type="submit" disabled={!canCreateSeason}>
                    Criar epoca
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>4. Participantes</h3>
                  <p>Estes clubes passam a ser a fonte de verdade da epoca.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="participant" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <input
                    type="hidden"
                    name="sync_metadata_available"
                    value={participantData.syncMetadataAvailable ? "1" : "0"}
                  />
                  <div className="manager-field wide">
                    <label htmlFor="new-participant-team">Clube</label>
                    <select
                      id="new-participant-team"
                      name="team_id"
                      defaultValue={availableTeams[0]?.id ?? ""}
                      disabled={!canCreateParticipant}
                    >
                      {availableTeams.length === 0 ? <option value="">Sem clubes livres</option> : null}
                      {availableTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-participant-order">Ordem</label>
                    <input
                      id="new-participant-order"
                      name="display_order"
                      type="number"
                      min="1"
                      defaultValue={participants.length + 1}
                      disabled={!canCreateParticipant}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-participant-status">Estado</label>
                    <select id="new-participant-status" name="status" defaultValue="active" disabled={!canCreateParticipant}>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateParticipant}>
                    Associar participante
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>5. Jornada</h3>
                  <p>A jornada e o momento competitivo onde os dados ganham leitura.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="matchday" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <input type="hidden" name="editorial_fields_available" value={matchdayData.editorialFieldsAvailable ? "1" : "0"} />
                  <input type="hidden" name="sync_metadata_available" value={matchdayData.syncMetadataAvailable ? "1" : "0"} />
                  <div className="manager-field">
                    <label htmlFor="new-matchday-number">Numero</label>
                    <input
                      id="new-matchday-number"
                      name="number"
                      type="number"
                      min="1"
                      defaultValue={nextMatchdayNumber}
                      disabled={!canCreateMatchday}
                      required={canCreateMatchday}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-matchday-label">Titulo tecnico</label>
                    <input
                      id="new-matchday-label"
                      name="label"
                      defaultValue={`Jornada ${String(nextMatchdayNumber).padStart(2, "0")}`}
                      disabled={!canCreateMatchday}
                      required={canCreateMatchday}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-matchday-start">Inicio</label>
                    <input id="new-matchday-start" name="starts_on" type="date" disabled={!canCreateMatchday} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-matchday-end">Fim</label>
                    <input id="new-matchday-end" name="ends_on" type="date" disabled={!canCreateMatchday} />
                  </div>
                  <div className="manager-field wide">
                    <label htmlFor="new-matchday-editorial-title">Titulo editorial</label>
                    <input
                      id="new-matchday-editorial-title"
                      name="editorial_title"
                      placeholder="Ex: Jornada de viragem na lideranca"
                      disabled={!canCreateMatchday}
                    />
                  </div>
                  <div className="manager-field wide">
                    <label htmlFor="new-matchday-summary">Resumo contextual</label>
                    <textarea
                      id="new-matchday-summary"
                      name="context_summary"
                      placeholder="O que esta jornada ajuda o leitor a perceber?"
                      disabled={!canCreateMatchday}
                    />
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateMatchday}>
                    Criar jornada
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>6. Jogo da jornada</h3>
                  <p>Casa e fora aparecem apenas a partir dos participantes desta epoca.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="match" />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <input type="hidden" name="sync_metadata_available" value={matchData.syncMetadataAvailable ? "1" : "0"} />
                  <div className="manager-field wide">
                    <label htmlFor="new-match-matchday">Jornada</label>
                    <select
                      id="new-match-matchday"
                      name="matchday_id"
                      defaultValue={selectedMatchday?.id ?? ""}
                      disabled={!canCreateMatch}
                    >
                      {matchdays.length === 0 ? <option value="">Cria uma jornada primeiro</option> : null}
                      {matchdays.map((matchday) => (
                        <option key={matchday.id} value={matchday.id}>
                          {matchday.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-home">Casa</label>
                    <select
                      id="new-match-home"
                      name="home_team_id"
                      defaultValue={firstParticipantTeam?.id ?? ""}
                      disabled={!canCreateMatch}
                    >
                      {participantTeams.length === 0 ? <option value="">Sem participantes</option> : null}
                      {participantTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-away">Fora</label>
                    <select
                      id="new-match-away"
                      name="away_team_id"
                      defaultValue={secondParticipantTeam?.id ?? ""}
                      disabled={!canCreateMatch}
                    >
                      {participantTeams.length < 2 ? <option value="">Falta outro participante</option> : null}
                      {participantTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-kickoff">Data e hora</label>
                    <input id="new-match-kickoff" name="kickoff_at" type="datetime-local" disabled={!canCreateMatch} required={canCreateMatch} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-status">Estado</label>
                    <select id="new-match-status" name="status" defaultValue="scheduled" disabled={!canCreateMatch}>
                      <option value="scheduled">Agendado</option>
                      <option value="live">Em direto</option>
                      <option value="halftime">Intervalo</option>
                      <option value="finished">Terminado</option>
                      <option value="postponed">Adiado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-venue">Estadio</label>
                    <input id="new-match-venue" name="venue" placeholder="Ex: Estadio da Luz" disabled={!canCreateMatch} />
                  </div>
                  <div className="manager-field wide">
                    <label htmlFor="new-match-tv">Onde se ve</label>
                    <select id="new-match-tv" name="broadcast_channel_id" defaultValue="" disabled={!canCreateMatch}>
                      <option value="">Sem canal definido</option>
                      {matchData.broadcastChannels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateMatch}>
                    Criar jogo
                  </button>
                </form>
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
