import {
  fetchSupabaseAdminTable,
  getAdminSeasonParticipants,
  getAdminSeasons,
  type SupabaseCompetition,
  type SupabaseCountry,
  type SupabaseSeason,
  type SupabaseTeam
} from "@/lib/supabase";
import { ContextSelector } from "./ContextSelector";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type CountryTeam = SupabaseTeam & {
  country_id: string | null;
};
type UnassignedTeam = Pick<CountryTeam, "id" | "name" | "short_name" | "slug" | "country_id">;
type SeasonMatchday = {
  id: string;
  season_id: string;
  number: number;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  status: string;
};
type SeasonAgendaMatch = {
  id: string;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  venue: string | null;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  broadcast_channel_id: string | null;
};

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
    max-width: 780px;
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

  .manager-button:disabled,
  .manager-link-button[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
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
    padding: 18px 20px;
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #6a3d00;
  }

  .manager-warning h2,
  .manager-warning p,
  .manager-message p {
    margin: 0;
  }

  .manager-warning p {
    margin-top: 8px;
    color: #6a3d00;
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
  .manager-field input {
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

  .manager-field input[type="checkbox"] {
    width: 18px;
    min-height: 18px;
    padding: 0;
  }

  .manager-message {
    margin: 18px 0 0;
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

  .manager-path article,
  .manager-stat {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  .manager-path small,
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

  .manager-create-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .manager-wide-card {
    grid-column: 1 / -1;
  }

  .manager-create-form {
    display: grid;
    gap: 10px;
    align-items: end;
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

  .manager-stat-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .manager-stat strong {
    display: block;
    color: #e5252a;
    font-size: 34px;
    line-height: 1;
  }

  .manager-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    padding: 18px 20px;
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
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-height: 48px;
    padding: 10px 0;
    border-bottom: 1px solid #e6ebf1;
  }

  .manager-list li:last-child {
    border-bottom: 0;
  }

  .manager-list b {
    display: block;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .manager-list small,
  .manager-list em {
    color: #687380;
    font-style: normal;
    font-size: 12px;
  }

  .manager-empty {
    padding: 10px 0;
    color: #687380;
  }

  .manager-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0 20px 20px;
  }

  .manager-list .manager-actions {
    justify-content: flex-end;
    padding: 0;
  }

  @media (max-width: 1180px) {
    .manager-form,
    .manager-path,
    .manager-create-grid,
    .manager-stat-row,
    .manager-summary-grid {
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
    .manager-create-grid,
    .manager-stat-row,
    .manager-summary-grid {
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

function competitionCountryId(competition: SupabaseCompetition) {
  return competition.country_id ?? "";
}

function buildContextQuery(country: SupabaseCountry | null, competition: SupabaseCompetition | null, season: SupabaseSeason | null) {
  const params = new URLSearchParams();

  if (country) params.set("pais", country.id);
  if (competition) params.set("competicao", competition.id);
  if (season) params.set("epoca", season.id);

  return params.toString();
}

function returnTo(country: SupabaseCountry | null, competition: SupabaseCompetition | null, season: SupabaseSeason | null) {
  const query = buildContextQuery(country, competition, season);
  return `/admin/gestor${query ? `?${query}` : ""}`;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

async function readTeamsForCountry(countryId?: string): Promise<CountryTeam[]> {
  if (!countryId) {
    return [];
  }

  try {
    return await fetchSupabaseAdminTable<CountryTeam>(
      `teams?select=id,name,short_name,slug,country_id,logo_url,primary_color&country_id=eq.${encodeURIComponent(
        countryId
      )}&order=name.asc`
    );
  } catch {
    return [];
  }
}

async function readUnassignedTeams(): Promise<UnassignedTeam[]> {
  try {
    return await fetchSupabaseAdminTable<UnassignedTeam>(
      "teams?select=id,name,short_name,slug,country_id&country_id=is.null&order=name.asc&limit=200"
    );
  } catch {
    return [];
  }
}

async function readMatchdaysForSeason(seasonId?: string): Promise<SeasonMatchday[]> {
  if (!seasonId) {
    return [];
  }

  try {
    return await fetchSupabaseAdminTable<SeasonMatchday>(
      `matchdays?select=id,season_id,number,label,starts_on,ends_on,status&season_id=eq.${encodeURIComponent(
        seasonId
      )}&manual_override=is.true&order=number.asc`
    );
  } catch {
    return [];
  }
}

async function readMatchesForMatchday(matchdayId?: string): Promise<SeasonAgendaMatch[]> {
  if (!matchdayId) {
    return [];
  }

  try {
    return await fetchSupabaseAdminTable<SeasonAgendaMatch>(
      `matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,kickoff_at,venue,status,minute,home_score,away_score,broadcast_channel_id&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&manual_override=is.true&order=kickoff_at.asc`
    );
  } catch {
    return [];
  }
}

function resolveSelectedContext({
  countries,
  competitions,
  seasons,
  requestedCountryId,
  requestedCompetitionId,
  requestedSeasonId
}: {
  countries: SupabaseCountry[];
  competitions: SupabaseCompetition[];
  seasons: SupabaseSeason[];
  requestedCountryId?: string;
  requestedCompetitionId?: string;
  requestedSeasonId?: string;
}) {
  const linkedCompetitions = competitions.filter((competition) => Boolean(competitionCountryId(competition)));
  const requestedSeason = seasons.find((season) => season.id === requestedSeasonId) ?? null;
  const requestedCompetition =
    linkedCompetitions.find((competition) => competition.id === requestedCompetitionId) ??
    linkedCompetitions.find((competition) => competition.id === requestedSeason?.competition_id) ??
    null;
  const firstCountryWithCompetition =
    countries.find((country) => linkedCompetitions.some((competition) => competitionCountryId(competition) === country.id)) ??
    countries[0] ??
    null;
  const selectedCountry =
    countries.find((country) => country.id === requestedCountryId) ??
    (requestedCompetition
      ? countries.find((country) => country.id === competitionCountryId(requestedCompetition)) ?? null
      : null) ??
    firstCountryWithCompetition;
  const competitionsForCountry = selectedCountry
    ? linkedCompetitions.filter((competition) => competitionCountryId(competition) === selectedCountry.id)
    : [];
  const selectedCompetition =
    competitionsForCountry.find((competition) => competition.id === requestedCompetition?.id) ??
    competitionsForCountry[0] ??
    null;
  const seasonsForCompetition = selectedCompetition
    ? seasons.filter((season) => season.competition_id === selectedCompetition.id)
    : [];
  const selectedSeason =
    seasonsForCompetition.find((season) => season.id === requestedSeasonId) ??
    seasonsForCompetition.find((season) => season.is_current) ??
    seasonsForCompetition[0] ??
    null;

  return {
    linkedCompetitions,
    selectedCountry,
    competitionsForCountry,
    selectedCompetition,
    seasonsForCompetition,
    selectedSeason
  };
}

export default async function AdminSeasonManagerPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = searchParams ? await searchParams : {};
  const seasonData = await getAdminSeasons();
  const configured = seasonData.configured;
  const error = seasonData.error;
  const countries = seasonData.countries.filter((country) => country.is_active !== false);
  const competitions = seasonData.competitions.filter((competition) => competition.is_active !== false);
  const seasons = seasonData.seasons;
  const requestedCountryId = oneParam(params, "pais");
  const requestedCompetitionId = oneParam(params, "competicao");
  const requestedSeasonId = oneParam(params, "epoca");
  const requestedMatchdayId = oneParam(params, "jornada");
  const requestedEditMatchId = oneParam(params, "editar_jogo");
  const {
    linkedCompetitions,
    selectedCountry,
    competitionsForCountry,
    selectedCompetition,
    seasonsForCompetition,
    selectedSeason
  } = resolveSelectedContext({
    countries,
    competitions,
    seasons,
    requestedCountryId,
    requestedCompetitionId,
    requestedSeasonId
  });
  const participantData = configured ? await getAdminSeasonParticipants() : null;
  const participantsForSeason = selectedSeason
    ? (participantData?.participants ?? []).filter(
        (participant) =>
          participant.season_id === selectedSeason.id &&
          participant.data_source === "manual" &&
          participant.sync_status === "manual" &&
          participant.manual_override === true
      )
    : [];
  const teamsForCountry = await readTeamsForCountry(selectedCountry?.id);
  const unassignedTeams = await readUnassignedTeams();
  const matchdaysForSeason = await readMatchdaysForSeason(selectedSeason?.id);
  const selectedMatchday =
    matchdaysForSeason.find((matchday) => matchday.id === requestedMatchdayId) ?? matchdaysForSeason[0] ?? null;
  const matchesForMatchday = await readMatchesForMatchday(selectedMatchday?.id);
  const editingMatch = matchesForMatchday.find((match) => match.id === requestedEditMatchId) ?? null;
  const countryTeamIds = new Set(teamsForCountry.map((team) => team.id));
  const oldInvisibleParticipants = participantData?.syncMetadataAvailable
    ? (participantData.participants ?? []).filter(
        (participant) => countryTeamIds.has(participant.team_id) && participant.manual_override !== true
      )
    : [];
  const participantTeamIds = new Set(participantsForSeason.map((participant) => participant.team_id));
  const teamsAvailableForSeason = teamsForCountry.filter((team) => !participantTeamIds.has(team.id));
  const participantTeamOptions = participantsForSeason
    .map((participant) => participant.team)
    .filter((team): team is SupabaseTeam => Boolean(team));
  const participantTeamsById = new Map(participantTeamOptions.map((team) => [team.id, team]));
  const unavailableTeamMessage =
    teamsForCountry.length === 0
      ? "Ainda nao ha clubes associados a este pais"
      : "Todos os clubes disponiveis deste pais ja foram adicionados a esta epoca";
  const selectorCountries = countries.map((country) => ({
    id: country.id,
    name: country.name
  }));
  const selectorCompetitions = linkedCompetitions.map((competition) => ({
    id: competition.id,
    name: competition.name,
    countryId: competitionCountryId(competition)
  }));
  const selectorSeasons = seasons.map((season) => ({
    id: season.id,
    label: season.label,
    competitionId: season.competition_id,
    isCurrent: season.is_current
  }));
  const currentReturnTo = returnTo(selectedCountry, selectedCompetition, selectedSeason);
  const matchdayReturnTo =
    selectedMatchday && currentReturnTo.includes("?")
      ? `${currentReturnTo}&jornada=${selectedMatchday.id}`
      : selectedMatchday
        ? `${currentReturnTo}?jornada=${selectedMatchday.id}`
        : currentReturnTo;
  const unlinkedCompetitions = competitions.filter((competition) => !competitionCountryId(competition));
  const created = oneParam(params, "created");
  const actionError = oneParam(params, "error");
  const canCreateCompetition = Boolean(selectedCountry);
  const canCreateSeason = Boolean(selectedCompetition);
  const canCreateTeam = Boolean(selectedCountry && participantData?.writeConfigured);
  const canAttachTeam = Boolean(selectedCountry && participantData?.writeConfigured && unassignedTeams.length > 0);
  const canAddParticipant = Boolean(
    selectedCountry && selectedSeason && participantData?.writeConfigured && !participantData.error && teamsAvailableForSeason.length > 0
  );
  const nextMatchdayNumber = matchdaysForSeason.reduce((max, matchday) => Math.max(max, matchday.number), 0) + 1;
  const canCreateMatchday = Boolean(selectedSeason && participantData?.writeConfigured && participantsForSeason.length > 0);
  const canCreateMatch = Boolean(
    selectedCompetition &&
      selectedSeason &&
      selectedMatchday &&
      participantData?.writeConfigured &&
      participantTeamOptions.length >= 2
  );
  const createdLabels: Record<string, string> = {
    country: "Pais criado. Agora podes escolher esse pais no caminho de trabalho.",
    competition: "Competicao criada e ligada ao pais escolhido.",
    season: "Epoca criada dentro da competicao escolhida.",
    team: "Clube criado e associado ao pais selecionado.",
    attach_team_to_country: "Clube existente associado ao pais selecionado.",
    participant: "Participante associado a epoca selecionada.",
    remove_participant: "Participante removido da epoca selecionada.",
    remove_old_participant: "Associacao antiga invisivel removida de season_teams.",
    remove_team: "Clube removido do pais selecionado.",
    matchday: "Jornada criada dentro da epoca selecionada.",
    remove_matchday: "Jornada removida da epoca selecionada.",
    match: "Jogo criado dentro da jornada selecionada.",
    update_match: "Jogo atualizado na jornada selecionada.",
    remove_match: "Jogo removido da jornada selecionada.",
    remove_country: "Pais removido.",
    remove_competition: "Competicao removida.",
    remove_season: "Epoca removida."
  };
  const errorLabels: Record<string, string> = {
    "missing-service": "Liga primeiro a Supabase na Vercel.",
    "missing-fields": "Preenche os campos obrigatorios antes de guardar.",
    "unknown-action": "A acao enviada pelo formulario nao foi reconhecida.",
    "invalid-team-country": "O clube escolhido nao esta associado ao pais selecionado.",
    "team-slug-exists": "Este clube ja existe. Associe-o ao pais em vez de criar outro.",
    "team-not-found": "Nao foi possivel encontrar o clube escolhido.",
    "team-already-linked": "Este clube ja esta associado a outro pais.",
    "country-has-competitions": "Nao e possivel remover este pais porque ainda existem competicoes associadas.",
    "country-has-teams": "Nao e possivel remover este pais porque ainda existem clubes associados.",
    "competition-has-seasons": "Nao e possivel remover esta competicao porque ainda existem epocas associadas.",
    "season-has-participants": "Nao e possivel remover esta epoca porque ainda existem participantes associados.",
    "season-has-matchdays": "Nao e possivel remover esta epoca porque ainda existem jornadas associadas.",
    "season-has-matches": "Nao e possivel remover esta epoca porque ainda existem jogos associados.",
    "team-has-participants": "Este clube ainda esta associado a uma epoca. Remove primeiro o participante da epoca.",
    "team-has-old-participants": "Este clube tem associacoes antigas fora do novo fluxo. Reve esses dados antes de remover o clube.",
    "team-has-matches": "Este clube nao pode ser removido porque ainda existem jogos associados a ele.",
    "old-participant-manual": "Esta associacao pertence ao novo fluxo manual e nao pode ser limpa nesta area.",
    "old-participant-not-found": "Nao foi possivel encontrar uma associacao antiga invisivel para remover.",
    "matchday-needs-participants": "Antes de criar jornadas, define os participantes desta epoca.",
    "matchday-duplicate": "Ja existe uma jornada com esse numero nesta epoca.",
    "matchday-has-matches": "Nao e possivel remover esta jornada porque ainda existem jogos associados.",
    "match-missing-context": "Escolhe uma competicao, epoca e jornada antes de criar o jogo.",
    "matchday-invalid": "A jornada escolhida nao pertence a epoca selecionada.",
    "match-team-same": "A equipa da casa e a equipa visitante nao podem ser o mesmo clube.",
    "match-team-not-participant": "As equipas do jogo tem de ser participantes manuais desta epoca.",
    "match-not-found": "Nao foi possivel encontrar este jogo na jornada selecionada.",
    "match-not-simple": "Este jogo ja tem dados competitivos associados e nao pode ser alterado nesta fase.",
    "match-has-dependencies": "Este jogo ja tem eventos, noticias ou atualizacoes associadas e nao pode ser removido nesta fase.",
    save: "Nao foi possivel guardar. Confirma se a base de dados esta atualizada."
  };

  return (
    <main className="manager-shell">
      <style>{managerStyles}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("submit", function (event) {
              var form = event.target;
              if (!(form instanceof HTMLFormElement)) return;
              var message = form.getAttribute("data-confirm");
              if (message && !window.confirm(message)) {
                event.preventDefault();
              }
            });

            function syncMatchTeamSelectors(form) {
              var home = form.querySelector('select[name="home_team_id"]');
              var away = form.querySelector('select[name="away_team_id"]');
              var submit = form.querySelector('[data-match-submit="true"]');
              var warning = form.querySelector('[data-match-warning="true"]');
              if (!home || !away || !submit) return;

              var homeValue = home.value;
              Array.prototype.forEach.call(away.options, function (option) {
                option.disabled = Boolean(option.value && option.value === homeValue);
              });

              if (away.value === homeValue) {
                var next = Array.prototype.find.call(away.options, function (option) {
                  return option.value && option.value !== homeValue && !option.disabled;
                });
                if (next) away.value = next.value;
              }

              var sameTeam = Boolean(home.value && away.value && home.value === away.value);
              var canCreate = form.getAttribute("data-can-create-match") === "true";
              submit.disabled = !canCreate || sameTeam;
              if (warning) {
                warning.hidden = !sameTeam;
              }
            }

            document.addEventListener("change", function (event) {
              var field = event.target;
              if (!(field instanceof HTMLSelectElement)) return;
              var form = field.closest('[data-match-form="true"]');
              if (form) syncMatchTeamSelectors(form);
            });

            document.addEventListener("DOMContentLoaded", function () {
              document.querySelectorAll('[data-match-form="true"]').forEach(syncMatchTeamSelectors);
            });
          `
        }}
      />
      <header className="manager-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Centro de gestao</h1>
          <span>
            Fase 1: cria o pais, liga manualmente cada competicao ao pais certo e cria as epocas
            dentro dessa competicao. O gestor so mostra o que ja foi criado e relacionado por ti.
          </span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {created && createdLabels[created] ? <div className="manager-message">{createdLabels[created]}</div> : null}
      {actionError ? (
        <div className="manager-message warning">{errorLabels[actionError] ?? errorLabels.save}</div>
      ) : null}

      {!configured ? (
        <section className="manager-warning">
          <h2>Supabase ainda nao ligada</h2>
          <p>Adiciona as variaveis da Supabase na Vercel antes de testar esta fase.</p>
        </section>
      ) : null}

      {configured && error ? (
        <section className="manager-warning">
          <h2>Leitura incompleta</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {configured && unlinkedCompetitions.length > 0 ? (
        <section className="manager-warning">
          <h2>Competicoes sem pais associado</h2>
          <p>
            Ha {unlinkedCompetitions.length} competicoes fora do gestor porque ainda nao foram ligadas
            manualmente a um pais. Liga-as em /admin/competicoes para aparecerem no caminho certo.
          </p>
        </section>
      ) : null}

      {configured ? (
        <>
          <section className="manager-context" aria-label="Caminho de trabalho">
            <header>
              <h2>Caminho de trabalho</h2>
              <p>
                Primeiro escolhes o pais. Depois so aparecem as competicoes desse pais. Depois so aparecem
                as epocas dessa competicao.
              </p>
            </header>
            <ContextSelector
              countries={selectorCountries}
              competitions={selectorCompetitions}
              seasons={selectorSeasons}
              selectedCountryId={selectedCountry?.id ?? ""}
              selectedCompetitionId={selectedCompetition?.id ?? ""}
              selectedSeasonId={selectedSeason?.id ?? ""}
            />
            <div className="manager-path">
              <article>
                <small>Pais</small>
                <strong>{selectedCountry?.name ?? "Cria um pais"}</strong>
              </article>
              <article>
                <small>Competicao</small>
                <strong>{selectedCompetition?.name ?? "Cria ou liga uma competicao"}</strong>
              </article>
              <article>
                <small>Epoca</small>
                <strong>{selectedSeason?.label ?? "Cria uma epoca"}</strong>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Montador da fase 1">
            <header>
              <h2>Fase 1 - base principal</h2>
              <p>
                Nesta fase fechamos apenas a estrutura Pais / Competicao / Epoca. As fases seguintes
                ficam fora deste ecra por agora.
              </p>
            </header>
            <div className="manager-create-grid">
              <article className="manager-create-card">
                <header>
                  <h3>1. Pais</h3>
                  <p>Cria apenas os paises que queres gerir no projeto.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="country" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <div className="manager-field">
                    <label htmlFor="new-country-name">Nome</label>
                    <input id="new-country-name" name="name" placeholder="Ex: Portugal" required />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-country-slug">Slug</label>
                    <input id="new-country-slug" name="slug" placeholder="portugal" />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-country-iso">ISO2</label>
                    <input id="new-country-iso" name="iso2" placeholder="PT" maxLength={2} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-country-flag">Flag</label>
                    <input id="new-country-flag" name="flag_emoji" placeholder="PT" />
                  </div>
                  <button className="manager-button" type="submit">
                    Criar pais
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>2. Competicao</h3>
                  <p>A competicao nasce dentro do pais escolhido no caminho de trabalho.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="competition" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="new-competition-country">Pais</label>
                    <input
                      id="new-competition-country"
                      value={selectedCountry?.name ?? "Cria um pais primeiro"}
                      readOnly
                    />
                  </div>
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
                    <input
                      id="new-competition-slug"
                      name="slug"
                      placeholder="liga-portugal"
                      disabled={!canCreateCompetition}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-competition-color">Cor</label>
                    <input
                      id="new-competition-color"
                      name="accent_color"
                      placeholder="#e5252a"
                      disabled={!canCreateCompetition}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-competition-logo">Logotipo URL</label>
                    <input
                      id="new-competition-logo"
                      name="logo_url"
                      placeholder="https://..."
                      disabled={!canCreateCompetition}
                    />
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateCompetition}>
                    Criar competicao
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>3. Epoca</h3>
                  <p>A epoca fica sempre subordinada a competicao escolhida.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="season" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="new-season-competition">Competicao</label>
                    <input
                      id="new-season-competition"
                      value={selectedCompetition?.name ?? "Cria uma competicao primeiro"}
                      readOnly
                    />
                  </div>
                  <div className="manager-field">
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
                    <input type="checkbox" name="is_current" value="1" disabled={!canCreateSeason} />
                    Epoca atual
                  </label>
                  <button className="manager-button" type="submit" disabled={!canCreateSeason}>
                    Criar epoca
                  </button>
                </form>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Teste da fase 1">
            <header>
              <h2>Teste da Fase 1</h2>
              <p>Usa este bloco para confirmar que nao ha misturas entre pais, competicao e epoca.</p>
            </header>
            <div className="manager-stat-row">
              <article className="manager-stat">
                <strong>{countries.length}</strong>
                <small>Paises criados</small>
              </article>
              <article className="manager-stat">
                <strong>{linkedCompetitions.length}</strong>
                <small>Competicoes ligadas a pais</small>
              </article>
              <article className="manager-stat">
                <strong>{seasons.length}</strong>
                <small>Epocas criadas</small>
              </article>
            </div>
            <div className="manager-summary-grid">
              <article className="manager-create-card">
                <header>
                  <h3>Competicoes neste pais</h3>
                  <p>{selectedCountry?.name ?? "Sem pais selecionado"}</p>
                </header>
                {competitionsForCountry.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha competicoes ligadas a este pais.</div>
                ) : (
                  <ul className="manager-list">
                    {competitionsForCountry.map((competition) => (
                      <li key={competition.id}>
                        <div>
                          <b>{competition.name}</b>
                          <small>{competition.slug}</small>
                        </div>
                        <em>{selectedCountry?.name}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>Epocas nesta competicao</h3>
                  <p>{selectedCompetition?.name ?? "Sem competicao selecionada"}</p>
                </header>
                {seasonsForCompetition.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha epocas nesta competicao.</div>
                ) : (
                  <ul className="manager-list">
                    {seasonsForCompetition.map((season) => (
                      <li key={season.id}>
                        <div>
                          <b>{season.label}</b>
                          <small>{season.is_current ? "Epoca atual" : "Epoca guardada"}</small>
                        </div>
                        <em>{selectedCompetition?.name}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>Atalhos auxiliares</h3>
                  <p>As paginas antigas continuam disponiveis para corrigir dados pontuais.</p>
                </header>
                <div className="manager-actions">
                  <a className="manager-link-button" href="/admin/paises">
                    Paises
                  </a>
                  <a className="manager-link-button" href="/admin/competicoes">
                    Competicoes
                  </a>
                  <a className="manager-link-button" href="/admin/epocas">
                    Epocas
                  </a>
                </div>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Remocao segura">
            <header>
              <h2>Remocao segura</h2>
              <p>
                Remove apenas itens sem dados associados. Se existirem dependencias, o gestor bloqueia a acao.
              </p>
            </header>
            <div className="manager-summary-grid">
              <article className="manager-create-card">
                <header>
                  <h3>Pais</h3>
                  <p>{selectedCountry?.name ?? "Sem pais selecionado"}</p>
                </header>
                <form
                  action="/api/admin/gestor"
                  data-confirm="Tem a certeza que quer remover este pais? Esta acao so avanca se nao houver competicoes nem clubes associados."
                  method="post"
                >
                  <input type="hidden" name="action_type" value="remove_country" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <button className="manager-link-button" type="submit" disabled={!selectedCountry}>
                    Remover pais
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>Competicao</h3>
                  <p>{selectedCompetition?.name ?? "Sem competicao selecionada"}</p>
                </header>
                <form
                  action="/api/admin/gestor"
                  data-confirm="Tem a certeza que quer remover esta competicao? Esta acao so avanca se nao houver epocas associadas."
                  method="post"
                >
                  <input type="hidden" name="action_type" value="remove_competition" />
                  <input type="hidden" name="return_to" value={selectedCountry ? returnTo(selectedCountry, null, null) : "/admin/gestor"} />
                  <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                  <button className="manager-link-button" type="submit" disabled={!selectedCompetition}>
                    Remover competicao
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>Epoca</h3>
                  <p>{selectedSeason?.label ?? "Sem epoca selecionada"}</p>
                </header>
                <form
                  action="/api/admin/gestor"
                  data-confirm="Tem a certeza que quer remover esta epoca? Esta acao so avanca se nao houver dados associados."
                  method="post"
                >
                  <input type="hidden" name="action_type" value="remove_season" />
                  <input type="hidden" name="return_to" value={returnTo(selectedCountry, selectedCompetition, null)} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <button className="manager-link-button" type="submit" disabled={!selectedSeason}>
                    Remover epoca
                  </button>
                </form>
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Clubes do pais">
            <header>
              <h2>Clubes do pais</h2>
              <p>Cria clubes ligados manualmente ao pais selecionado. So estes clubes entram no seletor da epoca.</p>
            </header>
            <div className="manager-create-grid">
              <article className="manager-create-card">
                <header>
                  <h3>Novo clube</h3>
                  <p>{selectedCountry ? `Associado a ${selectedCountry.name}.` : "Escolhe um pais primeiro."}</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="team" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="new-team-name">Nome</label>
                    <input id="new-team-name" name="name" placeholder="Ex: F91 Dudelange" disabled={!canCreateTeam} required={canCreateTeam} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-team-short">Sigla</label>
                    <input id="new-team-short" name="short_name" maxLength={6} placeholder="F91" disabled={!canCreateTeam} required={canCreateTeam} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-team-slug">Slug</label>
                    <input id="new-team-slug" name="slug" placeholder="f91-dudelange" disabled={!canCreateTeam} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-team-logo">Emblema URL</label>
                    <input id="new-team-logo" name="logo_url" placeholder="https://..." disabled={!canCreateTeam} />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-team-color">Cor</label>
                    <input id="new-team-color" name="primary_color" placeholder="#e5252a" disabled={!canCreateTeam} />
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateTeam}>
                    Criar clube
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>Associar clube existente</h3>
                  <p>Liga manualmente ao pais selecionado um clube ja existente que ainda nao tem pais associado.</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="attach_team_to_country" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="attach-team-id">Clube existente</label>
                    <select id="attach-team-id" name="team_id" disabled={!canAttachTeam} required={canAttachTeam}>
                      {unassignedTeams.length === 0 ? <option value="">Nao ha clubes sem pais associado</option> : null}
                      {unassignedTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={!canAttachTeam}>
                    Associar clube
                  </button>
                </form>
              </article>

              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>{selectedCountry?.name ?? "Sem pais selecionado"}</h3>
                  <p>{teamsForCountry.length} clubes associados manualmente a este pais.</p>
                </header>
                {teamsForCountry.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha clubes associados a este pais.</div>
                ) : (
                  <ul className="manager-list">
                    {teamsForCountry.map((team) => (
                      <li key={team.id}>
                        <div>
                          <b>{team.name}</b>
                          <small>{team.short_name ?? team.slug}</small>
                        </div>
                        <form
                          action="/api/admin/gestor"
                          data-confirm="Tem a certeza que quer remover este clube deste pais? Esta acao so avanca se o clube nao estiver associado a nenhuma epoca."
                          method="post"
                        >
                          <input type="hidden" name="action_type" value="remove_team" />
                          <input type="hidden" name="return_to" value={currentReturnTo} />
                          <input type="hidden" name="team_id" value={team.id} />
                          <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                          <button className="manager-link-button" type="submit">
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Associacoes antigas invisiveis">
            <header>
              <h2>Associacoes antigas invisiveis</h2>
              <p>
                Remove apenas ligacoes antigas em season_teams que estao fora do novo fluxo manual. Clubes, epocas,
                jornadas e jogos nao sao apagados.
              </p>
            </header>
            <div className="manager-summary-grid">
              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>{selectedCountry?.name ?? "Sem pais selecionado"}</h3>
                  <p>{oldInvisibleParticipants.length} associacoes antigas invisiveis encontradas neste pais.</p>
                </header>
                {oldInvisibleParticipants.length === 0 ? (
                  <div className="manager-empty">Nao ha associacoes antigas invisiveis para os clubes deste pais.</div>
                ) : (
                  <ul className="manager-list">
                    {oldInvisibleParticipants.map((participant) => (
                      <li key={participant.id}>
                        <div>
                          <b>{participant.team?.name ?? "Clube sem nome"}</b>
                          <small>
                            {participant.competition?.name ?? "Competicao desconhecida"} /{" "}
                            {participant.season?.label ?? "Epoca desconhecida"} - estado {participant.status} - origem{" "}
                            {participant.data_source ?? "sem origem"} / {participant.sync_status ?? "sem sync"}
                          </small>
                        </div>
                        <form
                          action="/api/admin/gestor"
                          data-confirm="Tem a certeza que quer remover apenas esta associacao antiga invisivel de season_teams? O clube, a epoca, as jornadas e os jogos nao serao apagados."
                          method="post"
                        >
                          <input type="hidden" name="action_type" value="remove_old_participant" />
                          <input type="hidden" name="return_to" value={currentReturnTo} />
                          <input type="hidden" name="participant_id" value={participant.id} />
                          <button className="manager-link-button" type="submit">
                            Remover associacao
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Calendario da epoca">
            <header>
              <h2>Calendario da epoca</h2>
              <p>Cria e organiza jornadas simples dentro da epoca selecionada.</p>
            </header>
            <div className="manager-create-grid">
              <article className="manager-create-card">
                <header>
                  <h3>Nova jornada</h3>
                  <p>
                    {!selectedSeason
                      ? "Escolhe uma epoca primeiro."
                      : participantsForSeason.length === 0
                        ? "Antes de criar jornadas, define os participantes desta epoca."
                        : `Dentro de ${selectedSeason.label}.`}
                  </p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="matchday" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="new-matchday-number">Numero</label>
                    <input
                      id="new-matchday-number"
                      name="number"
                      type="number"
                      min={1}
                      defaultValue={nextMatchdayNumber}
                      disabled={!canCreateMatchday}
                      required={canCreateMatchday}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-matchday-label">Nome</label>
                    <input
                      id="new-matchday-label"
                      name="label"
                      placeholder="Ex: Jornada 01"
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
                  <div className="manager-field">
                    <label htmlFor="new-matchday-status">Estado</label>
                    <select id="new-matchday-status" name="status" disabled={!canCreateMatchday}>
                      <option value="scheduled">Planeada</option>
                      <option value="live">Em curso</option>
                      <option value="finished">Terminada</option>
                      <option value="archived">Arquivada</option>
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={!canCreateMatchday}>
                    Criar jornada
                  </button>
                </form>
              </article>

              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>{selectedSeason?.label ?? "Sem epoca selecionada"}</h3>
                  <p>{matchdaysForSeason.length} jornadas no calendario desta epoca.</p>
                </header>
                {matchdaysForSeason.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha jornadas nesta epoca.</div>
                ) : (
                  <ul className="manager-list">
                    {matchdaysForSeason.map((matchday) => (
                      <li key={matchday.id}>
                        <div>
                          <b>
                            {matchday.number}. {matchday.label}
                          </b>
                          <small>
                            {matchday.starts_on ?? "Sem inicio"} / {matchday.ends_on ?? "Sem fim"} - {matchday.status}
                          </small>
                        </div>
                        <form
                          action="/api/admin/gestor"
                          data-confirm="Tem a certeza que quer remover esta jornada? Esta acao so avanca se nao houver jogos associados."
                          method="post"
                        >
                          <input type="hidden" name="action_type" value="remove_matchday" />
                          <input type="hidden" name="return_to" value={currentReturnTo} />
                          <input type="hidden" name="matchday_id" value={matchday.id} />
                          <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                          <button className="manager-link-button" type="submit">
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Jogos da jornada">
            <header>
              <h2>Jogos da jornada</h2>
              <p>Cria e lista apenas jogos de agenda dentro da jornada selecionada.</p>
            </header>
            <div className="manager-create-grid">
              <article className="manager-create-card">
                <header>
                  <h3>Jornada</h3>
                  <p>
                    {!selectedSeason
                      ? "Escolhe uma epoca primeiro."
                      : matchdaysForSeason.length === 0
                        ? "Cria uma jornada antes de adicionar jogos."
                        : selectedMatchday
                          ? `${selectedMatchday.number}. ${selectedMatchday.label}`
                          : "Escolhe uma jornada."}
                  </p>
                </header>
                <form className="manager-create-form" action="/admin/gestor" method="get">
                  <input type="hidden" name="pais" value={selectedCountry?.id ?? ""} />
                  <input type="hidden" name="competicao" value={selectedCompetition?.id ?? ""} />
                  <input type="hidden" name="epoca" value={selectedSeason?.id ?? ""} />
                  <div className="manager-field">
                    <label htmlFor="selected-matchday">Jornada</label>
                    <select
                      id="selected-matchday"
                      name="jornada"
                      disabled={matchdaysForSeason.length === 0}
                      defaultValue={selectedMatchday?.id ?? ""}
                    >
                      {matchdaysForSeason.length === 0 ? <option value="">Sem jornadas manuais</option> : null}
                      {matchdaysForSeason.map((matchday) => (
                        <option key={matchday.id} value={matchday.id}>
                          {matchday.number}. {matchday.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={matchdaysForSeason.length === 0}>
                    Abrir jornada
                  </button>
                </form>
              </article>

              <article className="manager-create-card">
                <header>
                  <h3>{editingMatch ? "Editar jogo" : "Novo jogo"}</h3>
                  <p>
                    {!selectedMatchday
                      ? "Escolhe ou cria uma jornada primeiro."
                      : participantTeamOptions.length < 2
                        ? "E preciso ter pelo menos dois participantes para criar um jogo."
                        : editingMatch
                          ? "Corrige apenas a agenda deste jogo."
                          : "Agenda simples, sem resultados nem TV."}
                  </p>
                </header>
                <form
                  className="manager-create-form"
                  action="/api/admin/gestor"
                  data-can-create-match={canCreateMatch ? "true" : "false"}
                  data-match-form="true"
                  method="post"
                >
                  {editingMatch ? (
                    <input type="hidden" name="action_type" value="update_match" />
                  ) : (
                    <input type="hidden" name="action_type" value="match" />
                  )}
                  <input type="hidden" name="return_to" value={matchdayReturnTo} />
                  <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <input type="hidden" name="matchday_id" value={selectedMatchday?.id ?? ""} />
                  {editingMatch ? <input type="hidden" name="match_id" value={editingMatch.id} /> : null}
                  <div className="manager-field">
                    <label htmlFor="new-match-home">Casa</label>
                    <select
                      id="new-match-home"
                      name="home_team_id"
                      defaultValue={editingMatch?.home_team_id ?? participantTeamOptions[0]?.id ?? ""}
                      disabled={!canCreateMatch}
                      required={canCreateMatch}
                    >
                      {participantTeamOptions.length < 2 ? <option value="">Sem participantes suficientes</option> : null}
                      {participantTeamOptions.map((team) => (
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
                      defaultValue={editingMatch?.away_team_id ?? participantTeamOptions[1]?.id ?? ""}
                      disabled={!canCreateMatch}
                      required={canCreateMatch}
                    >
                      {participantTeamOptions.length < 2 ? <option value="">Sem participantes suficientes</option> : null}
                      {participantTeamOptions.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="manager-empty" data-match-warning="true" hidden>
                    Casa e Fora nao podem ser o mesmo clube.
                  </p>
                  <div className="manager-field">
                    <label htmlFor="new-match-kickoff">Data e hora</label>
                    <input
                      id="new-match-kickoff"
                      name="kickoff_at"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(editingMatch?.kickoff_at)}
                      disabled={!canCreateMatch}
                      required={canCreateMatch}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-venue">Estadio</label>
                    <input
                      id="new-match-venue"
                      name="venue"
                      placeholder="Opcional"
                      defaultValue={editingMatch?.venue ?? ""}
                      disabled={!canCreateMatch}
                    />
                  </div>
                  <div className="manager-field">
                    <label htmlFor="new-match-status">Estado</label>
                    <select id="new-match-status" name="status" defaultValue="scheduled" disabled={!canCreateMatch}>
                      <option value="scheduled">Agendado</option>
                    </select>
                  </div>
                  <button className="manager-button" type="submit" data-match-submit="true" disabled={!canCreateMatch}>
                    {editingMatch ? "Guardar alteracoes" : "Criar jogo"}
                  </button>
                  {editingMatch ? (
                    <a className="manager-link-button" href={matchdayReturnTo}>
                      Cancelar edicao
                    </a>
                  ) : null}
                </form>
              </article>

              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>{selectedMatchday ? `${selectedMatchday.number}. ${selectedMatchday.label}` : "Sem jornada selecionada"}</h3>
                  <p>{matchesForMatchday.length} jogos agendados nesta jornada.</p>
                </header>
                {!selectedMatchday ? (
                  <div className="manager-empty">Escolhe uma jornada para ver os jogos.</div>
                ) : matchesForMatchday.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha jogos nesta jornada.</div>
                ) : (
                  <ul className="manager-list">
                    {matchesForMatchday.map((match) => {
                      const homeTeam = participantTeamsById.get(match.home_team_id);
                      const awayTeam = participantTeamsById.get(match.away_team_id);

                      return (
                        <li key={match.id}>
                          <div>
                            <b>
                              {homeTeam?.name ?? "Casa"} vs {awayTeam?.name ?? "Fora"}
                            </b>
                            <small>
                              {new Date(match.kickoff_at).toLocaleString("pt-PT")} - {match.venue ?? "Sem estadio"} - Agendado
                            </small>
                          </div>
                          <div className="manager-actions">
                            <a
                              className="manager-link-button"
                              href={`${matchdayReturnTo}&editar_jogo=${match.id}`}
                            >
                              Editar
                            </a>
                            <form
                              action="/api/admin/gestor"
                              data-confirm="Tem a certeza que quer remover este jogo agendado? Esta acao so avanca se o jogo ainda nao tiver resultados, eventos ou outros dados competitivos."
                              method="post"
                            >
                              <input type="hidden" name="action_type" value="remove_match" />
                              <input type="hidden" name="return_to" value={matchdayReturnTo} />
                              <input type="hidden" name="competition_id" value={selectedCompetition?.id ?? ""} />
                              <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                              <input type="hidden" name="matchday_id" value={selectedMatchday?.id ?? ""} />
                              <input type="hidden" name="match_id" value={match.id} />
                              <button className="manager-link-button" type="submit">
                                Remover
                              </button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            </div>
          </section>

          <section className="manager-panel" aria-label="Participantes da epoca">
            <header>
              <h2>Participantes da epoca</h2>
              <p>Adiciona manualmente clubes a epoca selecionada e confirma a lista desse contexto.</p>
            </header>
            <div className="manager-stat-row">
              <article className="manager-stat">
                <strong>{participantsForSeason.length}</strong>
                <small>Participantes nesta epoca</small>
              </article>
              <article className="manager-stat">
                <strong>{selectedCompetition ? 1 : 0}</strong>
                <small>Competicao selecionada</small>
              </article>
              <article className="manager-stat">
                <strong>{selectedSeason ? 1 : 0}</strong>
                <small>Epoca selecionada</small>
              </article>
            </div>
            <div className="manager-summary-grid">
              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>Adicionar participante</h3>
                  <p>{selectedSeason ? "Escolhe um clube associado ao pais selecionado." : "Escolhe uma epoca primeiro."}</p>
                </header>
                <form className="manager-create-form" action="/api/admin/gestor" method="post">
                  <input type="hidden" name="action_type" value="participant" />
                  <input type="hidden" name="return_to" value={currentReturnTo} />
                  <input type="hidden" name="country_id" value={selectedCountry?.id ?? ""} />
                  <input type="hidden" name="season_id" value={selectedSeason?.id ?? ""} />
                  <input type="hidden" name="display_order" value={participantsForSeason.length + 1} />
                  <div className="manager-field">
                    <label htmlFor="new-participant-team">Clube</label>
                    <select id="new-participant-team" name="team_id" disabled={!canAddParticipant} required={canAddParticipant}>
                      {teamsAvailableForSeason.length === 0 ? (
                        <option value="">{unavailableTeamMessage}</option>
                      ) : null}
                      {teamsAvailableForSeason.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="manager-button" type="submit" disabled={!canAddParticipant}>
                    Adicionar participante
                  </button>
                </form>
              </article>

              <article className="manager-create-card manager-wide-card">
                <header>
                  <h3>{selectedSeason?.label ?? "Sem epoca selecionada"}</h3>
                  <p>{selectedCompetition?.name ?? "Escolhe uma competicao e uma epoca"}</p>
                </header>
                {participantData?.error ? (
                  <div className="manager-empty">Nao foi possivel ler os participantes: {participantData.error}</div>
                ) : !selectedSeason ? (
                  <div className="manager-empty">Escolhe ou cria uma epoca para ver os participantes.</div>
                ) : participantsForSeason.length === 0 ? (
                  <div className="manager-empty">Ainda nao ha participantes associados a esta epoca.</div>
                ) : (
                  <ul className="manager-list">
                    {participantsForSeason.map((participant) => (
                      <li key={participant.id}>
                        <div>
                          <b>{participant.team?.name ?? "Clube sem nome"}</b>
                          <small>{participant.team?.short_name ?? participant.team?.slug ?? "Sem sigla"}</small>
                        </div>
                        <form
                          action="/api/admin/gestor"
                          data-confirm="Tem a certeza que quer remover este participante desta epoca?"
                          method="post"
                        >
                          <input type="hidden" name="action_type" value="remove_participant" />
                          <input type="hidden" name="return_to" value={currentReturnTo} />
                          <input type="hidden" name="participant_id" value={participant.id} />
                          <input type="hidden" name="season_id" value={selectedSeason.id} />
                          <button className="manager-link-button" type="submit">
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
