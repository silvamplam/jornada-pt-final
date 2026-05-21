import type { ReactNode } from "react";
import { getAdminMatchesEditor, type SupabaseAdminMatch, type SupabaseBroadcastChannel } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const matchAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .match-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .match-admin-hero {
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

  .match-admin-hero p,
  .match-admin-hero h1,
  .match-admin-hero span {
    margin: 0;
  }

  .match-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .match-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .match-admin-hero a {
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .match-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .match-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .match-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .match-admin-create,
  .match-admin-list {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .match-admin-create header,
  .match-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .match-admin-create h2,
  .match-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .match-admin-create small,
  .match-admin-list small {
    color: #687380;
  }

  .match-create-form {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr)) 118px;
    gap: 10px;
    align-items: end;
    padding: 16px 18px;
  }

  .match-form {
    display: grid;
    grid-template-columns: minmax(220px, 1.1fr) minmax(0, 2.6fr) 112px;
    gap: 14px;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .match-form:last-child {
    border-bottom: 0;
  }

  .match-card {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .match-card strong {
    font-size: 15px;
  }

  .match-card small {
    color: #687380;
  }

  .match-teams {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
    font-weight: 900;
  }

  .match-teams img {
    display: block;
    width: 24px !important;
    max-width: 24px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .match-fields {
    display: grid;
    grid-template-columns: repeat(6, minmax(110px, 1fr));
    gap: 9px;
    align-items: end;
  }

  .match-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .match-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-field input,
  .match-field select {
    width: 100%;
    box-sizing: border-box;
    min-height: 39px;
    padding: 9px 10px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 14px;
  }

  .match-field input:focus,
  .match-field select:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .match-score-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .match-channel-preview {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .match-channel-preview figure {
    display: grid;
    place-items: center;
    width: 42px;
    height: 32px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 6px;
    background: #f8fafc;
    color: #5e6874;
    font-size: 10px;
    font-weight: 900;
  }

  .match-channel-preview img {
    display: block;
    width: 34px !important;
    max-width: 34px !important;
    height: 22px !important;
    max-height: 22px !important;
    object-fit: contain;
  }

  .match-admin-button {
    width: 100%;
    min-height: 39px;
    padding: 10px 12px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .match-admin-button:disabled,
  .match-field input:disabled,
  .match-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 1320px) {
    .match-create-form,
    .match-form {
      grid-template-columns: 1fr;
    }

    .match-fields {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .match-admin-shell {
      padding: 16px;
    }

    .match-admin-hero,
    .match-fields,
    .match-create-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

type AdminMatchesPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

type AdminMatchesOverview = Awaited<ReturnType<typeof getAdminMatchesEditor>>;

const statusOptions = [
  { value: "scheduled", label: "Agendado" },
  { value: "live", label: "Em direto" },
  { value: "halftime", label: "Intervalo" },
  { value: "finished", label: "Finalizado" }
];

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "missing-fields") {
    return "Competicao, epoca, equipas e data sao obrigatorias.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar o jogo. Confirma se todos os campos obrigatorios estao bem preenchidos.";
  }

  return null;
}

function formatDateTimeInput(value: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));

  return parts.replace(" ", "T");
}

function scoreValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function selectField(
  id: string,
  label: string,
  name: string,
  defaultValue: string | null | undefined,
  children: ReactNode,
  disabled: boolean,
  required = false
) {
  return (
    <div className="match-field">
      <label htmlFor={id}>{label}</label>
      <select disabled={disabled} id={id} name={name} defaultValue={defaultValue ?? ""} required={required}>
        {children}
      </select>
    </div>
  );
}

function textField(
  id: string,
  label: string,
  name: string,
  defaultValue: string,
  disabled: boolean,
  type = "text",
  required = false
) {
  return (
    <div className="match-field">
      <label htmlFor={id}>{label}</label>
      <input disabled={disabled} id={id} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}

function channelPreview(channel: SupabaseBroadcastChannel | null) {
  return (
    <div className="match-channel-preview">
      <figure>{channel?.logo_url ? <img alt="" src={channel.logo_url} /> : "TV"}</figure>
      <span>
        <strong>{channel?.name ?? "Sem canal"}</strong>
        <br />
        <small>{channel?.platform ?? "Por definir"}</small>
      </span>
    </div>
  );
}

function renderMatchFields(
  match: SupabaseAdminMatch,
  overview: AdminMatchesOverview,
  canWrite: boolean
) {
  return (
    <>
      <input name="source_key" type="hidden" defaultValue={match.source_key ?? ""} />
      {selectField(
        `competition-${match.id}`,
        "Competicao",
        "competition_id",
        match.competition_id,
        overview.competitions.map((competition) => (
          <option key={competition.id} value={competition.id}>
            {competition.name}
          </option>
        )),
        !canWrite,
        true
      )}
      {selectField(
        `season-${match.id}`,
        "Epoca",
        "season_id",
        match.season_id,
        overview.seasons.map((season) => {
          const competition = overview.competitions.find((item) => item.id === season.competition_id);

          return (
            <option key={season.id} value={season.id}>
              {competition?.name ?? "Competicao"} {season.label}
            </option>
          );
        }),
        !canWrite,
        true
      )}
      {selectField(
        `matchday-${match.id}`,
        "Jornada",
        "matchday_id",
        match.matchday_id,
        <>
          <option value="">Sem jornada</option>
          {overview.matchdays.map((matchday) => {
            const season = overview.seasons.find((item) => item.id === matchday.season_id);
            const competition = season ? overview.competitions.find((item) => item.id === season.competition_id) : null;

            return (
              <option key={matchday.id} value={matchday.id}>
                {competition?.name ?? "Competicao"} J{String(matchday.number).padStart(2, "0")}
              </option>
            );
          })}
        </>,
        !canWrite
      )}
      {textField(`kickoff-${match.id}`, "Data e hora", "kickoff_at", formatDateTimeInput(match.kickoff_at), !canWrite, "datetime-local", true)}
      {selectField(
        `status-${match.id}`,
        "Estado",
        "status",
        match.status,
        statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        )),
        !canWrite,
        true
      )}
      {textField(`minute-${match.id}`, "Minuto", "minute", scoreValue(match.minute), !canWrite, "number")}
      <div className="match-field">
        <label>Resultado</label>
        <div className="match-score-fields">
          <input disabled={!canWrite} name="home_score" type="number" defaultValue={scoreValue(match.home_score)} aria-label="Golos casa" />
          <input disabled={!canWrite} name="away_score" type="number" defaultValue={scoreValue(match.away_score)} aria-label="Golos fora" />
        </div>
      </div>
      {textField(`venue-${match.id}`, "Estadio", "venue", match.venue ?? "", !canWrite)}
      {selectField(
        `broadcast-${match.id}`,
        "Onde se ve",
        "broadcast_channel_id",
        match.broadcast_channel_id,
        <>
          <option value="">Sem canal</option>
          {overview.broadcastChannels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </>,
        !canWrite
      )}
    </>
  );
}

export default async function AdminMatchesPage({ searchParams }: AdminMatchesPageProps) {
  const params = await searchParams;
  const overview = await getAdminMatchesEditor();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;
  const defaultCompetitionId = overview.competitions[0]?.id ?? "";
  const defaultSeason = overview.seasons.find((season) => season.competition_id === defaultCompetitionId) ?? overview.seasons[0];
  const defaultSeasonId = defaultSeason?.id ?? "";
  const defaultMatchday =
    overview.matchdays.find((matchday) => matchday.season_id === defaultSeasonId) ?? overview.matchdays[0];

  return (
    <main className="match-admin-shell">
      <style>{matchAdminStyles}</style>
      <header className="match-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Jogos</h1>
          <span>Criar e corrigir jogos, resultados, estados, jornadas e canais de transmissao.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? <section className="match-admin-message warning">Falta configurar a ligacao ao Supabase.</section> : null}
      {!overview.writeConfigured ? (
        <section className="match-admin-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}
      {overview.error ? <section className="match-admin-message warning">{overview.error}</section> : null}
      {message ? <section className="match-admin-message warning">{message}</section> : null}
      {params.created ? <section className="match-admin-message success">Jogo criado.</section> : null}
      {params.updated ? <section className="match-admin-message success">Jogo atualizado.</section> : null}

      <section className="match-admin-create">
        <header>
          <h2>Novo jogo</h2>
          <small>Cria o jogo uma vez. Depois podes ligar noticias, manchetes, eventos, golos e classificacao.</small>
        </header>
        <form action="/api/admin/matches" className="match-create-form" method="post">
          {selectField(
            "new-competition",
            "Competicao",
            "competition_id",
            defaultCompetitionId,
            overview.competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            )),
            !canWrite,
            true
          )}
          {selectField(
            "new-season",
            "Epoca",
            "season_id",
            defaultSeasonId,
            overview.seasons.map((season) => {
              const competition = overview.competitions.find((item) => item.id === season.competition_id);

              return (
                <option data-competition-id={season.competition_id} key={season.id} value={season.id}>
                  {competition?.name ?? "Competicao"} {season.label}
                </option>
              );
            }),
            !canWrite,
            true
          )}
          {selectField(
            "new-matchday",
            "Jornada",
            "matchday_id",
            defaultMatchday?.id,
            overview.matchdays.map((matchday) => {
              const season = overview.seasons.find((item) => item.id === matchday.season_id);
              const competition = season ? overview.competitions.find((item) => item.id === season.competition_id) : null;

              return (
                <option data-season-id={matchday.season_id} key={matchday.id} value={matchday.id}>
                  {competition?.name ?? "Competicao"} J{String(matchday.number).padStart(2, "0")}
                </option>
              );
            }),
            !canWrite
          )}
          {selectField(
            "new-home",
            "Casa",
            "home_team_id",
            overview.teams[0]?.id,
            overview.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            )),
            !canWrite,
            true
          )}
          {selectField(
            "new-away",
            "Fora",
            "away_team_id",
            overview.teams[1]?.id ?? overview.teams[0]?.id,
            overview.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            )),
            !canWrite,
            true
          )}
          {textField("new-kickoff", "Data e hora", "kickoff_at", "", !canWrite, "datetime-local", true)}
          <button className="match-admin-button" disabled={!canWrite} type="submit">Criar</button>
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const competition = document.getElementById("new-competition");
                const season = document.getElementById("new-season");
                const matchday = document.getElementById("new-matchday");

                if (!competition || !season || !matchday) return;

                function firstVisibleOption(select) {
                  return Array.from(select.options).find((option) => !option.hidden);
                }

                function syncMatchdays() {
                  const seasonId = season.value;
                  Array.from(matchday.options).forEach((option) => {
                    option.hidden = option.dataset.seasonId ? option.dataset.seasonId !== seasonId : false;
                  });

                  if (matchday.selectedOptions[0]?.hidden) {
                    const first = firstVisibleOption(matchday);
                    if (first) matchday.value = first.value;
                  }
                }

                function syncSeasons() {
                  const competitionId = competition.value;
                  Array.from(season.options).forEach((option) => {
                    option.hidden = option.dataset.competitionId ? option.dataset.competitionId !== competitionId : false;
                  });

                  if (season.selectedOptions[0]?.hidden) {
                    const first = firstVisibleOption(season);
                    if (first) season.value = first.value;
                  }

                  syncMatchdays();
                }

                competition.addEventListener("change", syncSeasons);
                season.addEventListener("change", syncMatchdays);
                syncSeasons();
              })();
            `
          }}
        />
      </section>

      <section className="match-admin-list">
        <header>
          <h2>Jogos existentes</h2>
          <small>{overview.matches.length} jogos na base de dados</small>
        </header>

        {overview.matches.map((match) => (
          <form action={`/api/admin/matches/${match.id}`} className="match-form" key={match.id} method="post">
            <div className="match-card">
              <strong>{match.competition?.name ?? "Competicao"}</strong>
              <div className="match-teams">
                {match.homeTeam?.logo_url ? <img alt="" src={match.homeTeam.logo_url} /> : null}
                <span>{match.homeTeam?.name ?? "Casa"}</span>
                <span>x</span>
                {match.awayTeam?.logo_url ? <img alt="" src={match.awayTeam.logo_url} /> : null}
                <span>{match.awayTeam?.name ?? "Fora"}</span>
              </div>
              <small>
                {match.matchday?.label ?? "Sem jornada"} · {match.season?.label ?? "Epoca"}
              </small>
              {channelPreview(match.broadcastChannel)}
            </div>

            <div className="match-fields">
              {selectField(
                `home-${match.id}`,
                "Casa",
                "home_team_id",
                match.home_team_id,
                overview.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                )),
                !canWrite,
                true
              )}
              {selectField(
                `away-${match.id}`,
                "Fora",
                "away_team_id",
                match.away_team_id,
                overview.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                )),
                !canWrite,
                true
              )}
              {renderMatchFields(match, overview, canWrite)}
            </div>

            <button className="match-admin-button" disabled={!canWrite} type="submit">Guardar</button>
          </form>
        ))}
      </section>
    </main>
  );
}
