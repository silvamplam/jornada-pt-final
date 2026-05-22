import type { ReactNode } from "react";
import {
  getAdminStandingsEditor,
  type SupabaseAdminStanding,
  type SupabaseAdminStandingRow,
  type SupabaseTeam
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const standingsAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .standings-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .standings-admin-hero {
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

  .standings-admin-hero p,
  .standings-admin-hero h1,
  .standings-admin-hero span {
    margin: 0;
  }

  .standings-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .standings-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .standings-admin-hero span {
    display: block;
    margin-top: 10px;
    max-width: 780px;
    color: #cdd5df;
    font-size: 16px;
  }

  .standings-admin-hero a {
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

  .standings-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .standings-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .standings-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .standings-admin-create,
  .standings-admin-list {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .standings-admin-create header,
  .standings-admin-list > header,
  .standing-block > header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .standings-admin-create h2,
  .standings-admin-list h2,
  .standing-block h3 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .standings-admin-create small,
  .standings-admin-list small,
  .standing-block small {
    color: #687380;
  }

  .standing-create-form,
  .standing-meta-form {
    display: grid;
    gap: 12px;
    align-items: end;
    padding: 16px 18px;
  }

  .standing-create-form {
    grid-template-columns: minmax(320px, 1.8fr) minmax(220px, 1fr) 120px;
  }

  .standing-meta-form {
    grid-template-columns: minmax(320px, 1.8fr) minmax(220px, 1fr) 120px;
    border-bottom: 1px solid #eef2f6;
  }

  .standing-seed-form {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
    background: #fbfcfe;
  }

  .standing-seed-copy {
    display: grid;
    gap: 3px;
  }

  .standing-seed-copy strong {
    font-size: 14px;
    text-transform: uppercase;
  }

  .standing-seed-copy small {
    color: #687380;
  }

  .standing-seed-form .standing-admin-button {
    flex: 0 0 210px;
  }

  .standing-block {
    border-bottom: 1px solid #dde5ee;
  }

  .standing-block:last-child {
    border-bottom: 0;
  }

  .standing-heading {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .standing-heading-title {
    display: grid;
    gap: 4px;
  }

  .standing-sync-badge {
    display: inline-flex;
    width: fit-content;
    padding: 6px 8px;
    border: 1px solid #dce3eb;
    border-radius: 999px;
    background: #ffffff;
    color: #44505c;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .standing-sync-badge.api {
    border-color: #b9ddff;
    background: #eef7ff;
    color: #0b5fa5;
  }

  .standing-sync-badge.mixed,
  .standing-sync-badge.override {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .standing-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .standing-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .standing-field input,
  .standing-field select {
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

  .standing-field input:focus,
  .standing-field select:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .standing-admin-button {
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

  .standing-admin-button:disabled,
  .standing-field input:disabled,
  .standing-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .standing-table-scroll {
    overflow-x: auto;
  }

  .standing-row-form {
    display: grid;
    grid-template-columns: minmax(230px, 260px) minmax(920px, 1fr) 112px;
    gap: 12px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .standing-row-form:last-child {
    border-bottom: 0;
  }

  .standing-row-team {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
    align-items: end;
  }

  .standing-row-logo {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 50%;
    background: #f8fafc;
  }

  .standing-row-logo img {
    display: block;
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .standing-stat-grid {
    display: grid;
    grid-template-columns: repeat(17, minmax(48px, 1fr));
    gap: 7px;
  }

  .standing-stat-grid .standing-field input {
    padding-right: 4px;
    padding-left: 7px;
  }

  @media (max-width: 1100px) {
    .standings-admin-shell {
      padding: 16px;
    }

    .standings-admin-hero,
    .standing-create-form,
    .standing-meta-form,
    .standing-seed-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

type StandingsPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    rowUpdated?: string;
    rowsSeeded?: string;
    rowsUpdated?: string;
    error?: string;
  }>;
};

const statFields = [
  { name: "position", label: "Pos" },
  { name: "played", label: "J" },
  { name: "wins", label: "V" },
  { name: "draws", label: "E" },
  { name: "losses", label: "D" },
  { name: "goals_for", label: "GM" },
  { name: "goals_against", label: "GS" },
  { name: "goal_difference", label: "DG" },
  { name: "points", label: "Pts" },
  { name: "home_played", label: "JC" },
  { name: "home_wins", label: "VC" },
  { name: "home_draws", label: "EC" },
  { name: "home_losses", label: "DC" },
  { name: "away_played", label: "JF" },
  { name: "away_wins", label: "VF" },
  { name: "away_draws", label: "EF" },
  { name: "away_losses", label: "DF" }
] as const;

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "missing-fields") {
    return "Escolhe o contexto competitivo da classificacao.";
  }

  if (error === "invalid-context") {
    return "O contexto escolhido nao e valido. Escolhe uma jornada ou epoca coerente.";
  }

  if (error === "missing-row-fields") {
    return "Clube e posicao sao obrigatorios para corrigir uma linha da classificacao.";
  }

  if (error === "save-row") {
    return "Nao foi possivel guardar a linha da classificacao.";
  }

  if (error === "seed-rows") {
    return "Nao foi possivel preparar automaticamente os clubes desta classificacao.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar a classificacao.";
  }

  return null;
}

function sourceLabel(item: { data_source?: string | null; sync_status?: string | null; manual_override?: boolean | null }, syncAvailable: boolean) {
  if (!syncAvailable) {
    return "Preparar sincronizacao";
  }

  if (item.manual_override || item.sync_status === "manual_override") {
    return "Corrigida pelo administrador";
  }

  if (item.data_source === "api") {
    return "Sincronizada por API";
  }

  if (item.data_source === "mixed") {
    return "Dados mistos";
  }

  return "Introduzida manualmente";
}

function sourceClass(item: { data_source?: string | null; sync_status?: string | null; manual_override?: boolean | null }) {
  if (item.manual_override || item.sync_status === "manual_override") {
    return "standing-sync-badge override";
  }

  if (item.data_source === "api") {
    return "standing-sync-badge api";
  }

  if (item.data_source === "mixed") {
    return "standing-sync-badge mixed";
  }

  return "standing-sync-badge";
}

function selectField(
  id: string,
  label: string,
  name: string,
  value: string | null | undefined,
  options: ReactNode,
  disabled: boolean,
  required = false
) {
  return (
    <div className="standing-field">
      <label htmlFor={id}>{label}</label>
      <select disabled={disabled} id={id} name={name} required={required} defaultValue={value ?? ""}>
        {options}
      </select>
    </div>
  );
}

function textField(
  id: string,
  label: string,
  name: string,
  value: string | null | undefined,
  disabled: boolean,
  required = false
) {
  return (
    <div className="standing-field">
      <label htmlFor={id}>{label}</label>
      <input disabled={disabled} id={id} name={name} required={required} type="text" defaultValue={value ?? ""} />
    </div>
  );
}

function numberField(
  id: string,
  label: string,
  name: string,
  value: number | null | undefined,
  disabled: boolean,
  required = false
) {
  return (
    <div className="standing-field">
      <label htmlFor={id}>{label}</label>
      <input disabled={disabled} id={id} name={name} required={required} type="number" defaultValue={value ?? ""} />
    </div>
  );
}

function contextOptions(standings: Awaited<ReturnType<typeof getAdminStandingsEditor>>) {
  return (
    <>
      <optgroup label="Por jornada">
        {standings.matchdays.map((matchday) => {
          const season = standings.seasons.find((item) => item.id === matchday.season_id);
          const competition = season ? standings.competitions.find((item) => item.id === season.competition_id) : null;

          return (
            <option key={matchday.id} value={`matchday:${matchday.id}`}>
              {competition?.name ?? "Competicao"} - {season?.label ?? "Epoca"} - {matchday.label}
            </option>
          );
        })}
      </optgroup>
      <optgroup label="Sem jornada especifica">
        {standings.seasons.map((season) => {
          const competition = standings.competitions.find((item) => item.id === season.competition_id);

          return (
            <option key={season.id} value={`season:${season.id}`}>
              {competition?.name ?? "Competicao"} - {season.label}
            </option>
          );
        })}
      </optgroup>
    </>
  );
}

function teamOptions(teams: SupabaseTeam[]) {
  return teams.map((team) => (
    <option key={team.id} value={team.id}>
      {team.name}
    </option>
  ));
}

function rowTeamLogo(row: SupabaseAdminStandingRow) {
  if (!row.team?.logo_url) {
    return <span>{row.team?.short_name ?? "CL"}</span>;
  }

  return <img src={row.team.logo_url} alt="" />;
}

function standingTitle(standing: SupabaseAdminStanding) {
  const matchday = standing.matchday?.label ? ` - ${standing.matchday.label}` : "";
  const label = standing.moment_label ? ` - ${standing.moment_label}` : "";

  return `${standing.competition?.name ?? "Competicao"}${matchday}${label}`;
}

function standingContextValue(standing: SupabaseAdminStanding) {
  if (standing.matchday_id) {
    return `matchday:${standing.matchday_id}`;
  }

  return `season:${standing.season_id}`;
}

export default async function AdminStandingsPage({ searchParams }: StandingsPageProps) {
  const params = await searchParams;
  const overview = await getAdminStandingsEditor();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;
  const rowsSeeded = params.rowsSeeded ? Number.parseInt(params.rowsSeeded, 10) : null;
  const rowsUpdated = params.rowsUpdated ? Number.parseInt(params.rowsUpdated, 10) : null;
  const rowsSeededCount = rowsSeeded === null || Number.isNaN(rowsSeeded) ? 0 : rowsSeeded;
  const rowsUpdatedCount = rowsUpdated === null || Number.isNaN(rowsUpdated) ? 0 : rowsUpdated;
  const rowsSeededMessage = rowsSeeded === null && rowsUpdated === null
    ? null
    : rowsSeededCount === 0 && rowsUpdatedCount === 0
      ? "A classificacao ja estava alinhada com os participantes e resultados deste contexto."
      : `${rowsSeededCount} clubes preparados e ${rowsUpdatedCount} linhas recalculadas pelos resultados.`;
  const defaultContextRef = overview.matchdays[0]?.id
    ? `matchday:${overview.matchdays[0].id}`
    : overview.seasons[0]?.id
      ? `season:${overview.seasons[0].id}`
      : "";

  return (
    <main className="standings-admin-shell">
      <style>{standingsAdminStyles}</style>
      <header className="standings-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Classificacoes</h1>
          <span>Guardar a tabela de uma competicao num momento concreto: antes, durante ou depois de uma jornada.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="standings-admin-message warning">Supabase ainda nao esta ligado.</section>
      ) : overview.error ? (
        <section className="standings-admin-message warning">{overview.error}</section>
      ) : !overview.syncMetadataAvailable ? (
        <section className="standings-admin-message warning">
          Aplica o passo 09 no Supabase para garantir permissoes e campos de sincronizacao nas classificacoes.
        </section>
      ) : null}

      {message ? <section className="standings-admin-message warning">{message}</section> : null}
      {params.created ? <section className="standings-admin-message success">Classificacao criada.</section> : null}
      {params.updated ? <section className="standings-admin-message success">Classificacao atualizada.</section> : null}
      {params.rowUpdated ? <section className="standings-admin-message success">Linha atualizada.</section> : null}
      {rowsSeededMessage ? <section className="standings-admin-message success">{rowsSeededMessage}</section> : null}

      <section className="standings-admin-create">
        <header>
          <h2>Nova classificacao</h2>
          <small>Cria uma fotografia da tabela para uma jornada ou para uma epoca inteira.</small>
        </header>
        <form action="/api/admin/standings" className="standing-create-form" method="post">
          {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
          {selectField("new-context", "Contexto da classificacao", "context_ref", defaultContextRef, contextOptions(overview), !canWrite, true)}
          {textField("new-moment", "Momento", "moment_label", "Depois da jornada", !canWrite)}
          <button className="standing-admin-button" disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="standings-admin-list">
        <header>
          <h2>Classificacoes existentes</h2>
          <small>{overview.standings.length} fotografias de classificacao na base de dados</small>
        </header>

        {overview.standings.map((standing) => (
          <article className="standing-block" key={standing.id}>
            <header className="standing-heading">
              <div className="standing-heading-title">
                <h3>{standingTitle(standing)}</h3>
                <small>{standing.season?.label ?? "Epoca"} - {standing.rows.length} clubes</small>
              </div>
              <span className={sourceClass(standing)}>{sourceLabel(standing, overview.syncMetadataAvailable)}</span>
            </header>

            <form action={`/api/admin/standings/${standing.id}`} className="standing-meta-form" method="post">
              {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
              <input name="current_data_source" type="hidden" defaultValue={standing.data_source ?? "manual"} />
              {selectField(`context-${standing.id}`, "Contexto da classificacao", "context_ref", standingContextValue(standing), contextOptions(overview), !canWrite, true)}
              {textField(`moment-${standing.id}`, "Momento", "moment_label", standing.moment_label, !canWrite)}
              <button className="standing-admin-button" disabled={!canWrite} type="submit">Guardar</button>
            </form>

            <form action="/api/admin/standing-rows/seed" className="standing-seed-form" method="post">
              {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
              <input name="standing_id" type="hidden" value={standing.id} />
              <div className="standing-seed-copy">
                <strong>Participantes da epoca</strong>
                <small>Usa os clubes inscritos na epoca e calcula a fotografia a partir dos jogos terminados.</small>
              </div>
              <button className="standing-admin-button" disabled={!canWrite} type="submit">Gerar tabela</button>
            </form>

            <div className="standing-table-scroll">
              {standing.rows.map((row) => (
                <form action={`/api/admin/standing-rows/${row.id}`} className="standing-row-form" key={row.id} method="post">
                  {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
                  <input name="current_data_source" type="hidden" defaultValue={row.data_source ?? "manual"} />
                  <div className="standing-row-team">
                    <span className="standing-row-logo">{rowTeamLogo(row)}</span>
                    {selectField(`team-${row.id}`, "Clube", "team_id", row.team_id, teamOptions(overview.teams), !canWrite, true)}
                  </div>
                  <div className="standing-stat-grid">
                    {statFields.map((field) =>
                      numberField(
                        `${field.name}-${row.id}`,
                        field.label,
                        field.name,
                        row[field.name],
                        !canWrite,
                        field.name === "position"
                      )
                    )}
                  </div>
                  <button className="standing-admin-button" disabled={!canWrite} type="submit">Guardar</button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
