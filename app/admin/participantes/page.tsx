import {
  getAdminSeasonParticipants,
  type SupabaseAdminSeasonTeam,
  type SupabaseSeason,
  type SupabaseTeam
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const participantsAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .participants-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .participants-admin-hero {
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

  .participants-admin-hero p,
  .participants-admin-hero h1 {
    margin: 0;
  }

  .participants-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .participants-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .participants-admin-hero span {
    display: block;
    margin-top: 10px;
    max-width: 760px;
    color: #cdd5df;
    font-size: 16px;
  }

  .participants-admin-hero a {
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

  .participants-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .participants-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .participants-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .participants-admin-create,
  .participants-admin-list {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .participants-admin-create header,
  .participants-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .participants-admin-create h2,
  .participants-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .participants-admin-create small,
  .participants-admin-list small {
    color: #687380;
  }

  .participant-create-form,
  .participant-row-form {
    display: grid;
    gap: 12px;
    align-items: end;
    padding: 16px 18px;
  }

  .participant-create-form {
    grid-template-columns: minmax(260px, 1.5fr) minmax(220px, 1.2fr) 110px 150px 120px;
  }

  .participant-row-form {
    grid-template-columns: 48px minmax(220px, 1.4fr) minmax(220px, 1.4fr) 105px 145px 180px 120px 120px;
    border-bottom: 1px solid #eef2f6;
  }

  .participant-row-form:last-child {
    border-bottom: 0;
  }

  .participant-logo {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 50%;
    background: #f8fafc;
    color: #5e6874;
    font-size: 11px;
    font-weight: 900;
  }

  .participant-logo img {
    display: block;
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .participant-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .participant-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .participant-field input,
  .participant-field select {
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

  .participant-button {
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

  .participant-button.secondary {
    border: 1px solid #dce3eb;
    background: #ffffff;
    color: #44505c;
  }

  .participant-button:disabled,
  .participant-field input:disabled,
  .participant-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .participant-sync-badge {
    align-self: center;
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

  .participant-sync-badge.api {
    border-color: #b9ddff;
    background: #eef7ff;
    color: #0b5fa5;
  }

  .participant-sync-badge.mixed,
  .participant-sync-badge.override {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  @media (max-width: 1100px) {
    .participants-admin-shell {
      padding: 16px;
    }

    .participants-admin-hero,
    .participant-create-form,
    .participant-row-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

type ParticipantsPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "missing-fields") {
    return "Escolhe uma epoca e um clube.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar o participante.";
  }

  return null;
}

function sourceLabel(item: { data_source?: string | null; sync_status?: string | null; manual_override?: boolean | null }, syncAvailable: boolean) {
  if (!syncAvailable) {
    return "Preparar sincronizacao";
  }

  if (item.manual_override || item.sync_status === "manual_override") {
    return "Corrigido pelo administrador";
  }

  if (item.data_source === "api") {
    return "Sincronizado por API";
  }

  if (item.data_source === "mixed") {
    return "Dados mistos";
  }

  return "Introduzido manualmente";
}

function sourceClass(item: { data_source?: string | null; sync_status?: string | null; manual_override?: boolean | null }) {
  if (item.manual_override || item.sync_status === "manual_override") {
    return "participant-sync-badge override";
  }

  if (item.data_source === "api") {
    return "participant-sync-badge api";
  }

  if (item.data_source === "mixed") {
    return "participant-sync-badge mixed";
  }

  return "participant-sync-badge";
}

function seasonOptions(seasons: SupabaseSeason[], competitions: { id: string; name: string }[]) {
  return seasons.map((season) => {
    const competition = competitions.find((item) => item.id === season.competition_id);

    return (
      <option key={season.id} value={season.id}>
        {competition?.name ?? "Competicao"} - {season.label}
      </option>
    );
  });
}

function teamOptions(teams: SupabaseTeam[]) {
  return teams.map((team) => (
    <option key={team.id} value={team.id}>
      {team.name}
    </option>
  ));
}

function logo(participant: SupabaseAdminSeasonTeam) {
  if (!participant.team?.logo_url) {
    return participant.team?.short_name ?? "CL";
  }

  return <img src={participant.team.logo_url} alt="" />;
}

export default async function AdminParticipantsPage({ searchParams }: ParticipantsPageProps) {
  const params = await searchParams;
  const overview = await getAdminSeasonParticipants();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;
  const defaultSeasonId = overview.seasons[0]?.id ?? "";
  const defaultTeamId = overview.teams[0]?.id ?? "";

  return (
    <main className="participants-admin-shell">
      <style>{participantsAdminStyles}</style>
      <header className="participants-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Participantes</h1>
          <span>Define que clubes pertencem a cada epoca. A classificacao nasce daqui e depois e calculada pelos resultados.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="participants-admin-message warning">Supabase ainda nao esta ligado.</section>
      ) : overview.error ? (
        <section className="participants-admin-message warning">
          {overview.error}
          <br />
          Aplica primeiro o passo 10 no Supabase para criar os participantes da epoca.
        </section>
      ) : !overview.syncMetadataAvailable ? (
        <section className="participants-admin-message warning">
          Aplica o passo 10 no Supabase para preparar os campos de sincronizacao dos participantes.
        </section>
      ) : null}

      {message ? <section className="participants-admin-message warning">{message}</section> : null}
      {params.created ? <section className="participants-admin-message success">Participante criado.</section> : null}
      {params.updated ? <section className="participants-admin-message success">Participante atualizado.</section> : null}
      {params.deleted ? <section className="participants-admin-message success">Participante removido.</section> : null}

      <section className="participants-admin-create">
        <header>
          <h2>Novo participante</h2>
          <small>Associa um clube a uma epoca antes de criar ou recalcular classificacoes.</small>
        </header>
        <form action="/api/admin/season-teams" className="participant-create-form" method="post">
          {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
          <div className="participant-field">
            <label htmlFor="new-season">Epoca</label>
            <select disabled={!canWrite} id="new-season" name="season_id" required defaultValue={defaultSeasonId}>
              {seasonOptions(overview.seasons, overview.competitions)}
            </select>
          </div>
          <div className="participant-field">
            <label htmlFor="new-team">Clube</label>
            <select disabled={!canWrite} id="new-team" name="team_id" required defaultValue={defaultTeamId}>
              {teamOptions(overview.teams)}
            </select>
          </div>
          <div className="participant-field">
            <label htmlFor="new-order">Ordem</label>
            <input disabled={!canWrite} id="new-order" name="display_order" type="number" defaultValue={overview.participants.length + 1} />
          </div>
          <div className="participant-field">
            <label htmlFor="new-status">Estado</label>
            <select disabled={!canWrite} id="new-status" name="status" defaultValue="active">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <button className="participant-button" disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="participants-admin-list">
        <header>
          <h2>Participantes existentes</h2>
          <small>{overview.participants.length} clubes associados a epocas</small>
        </header>

        {overview.participants.map((participant) => (
          <form action={`/api/admin/season-teams/${participant.id}`} className="participant-row-form" key={participant.id} method="post">
            {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
            <input name="current_data_source" type="hidden" defaultValue={participant.data_source ?? "manual"} />
            <span className="participant-logo">{logo(participant)}</span>
            <div className="participant-field">
              <label htmlFor={`season-${participant.id}`}>Epoca</label>
              <select disabled={!canWrite} id={`season-${participant.id}`} name="season_id" required defaultValue={participant.season_id}>
                {seasonOptions(overview.seasons, overview.competitions)}
              </select>
            </div>
            <div className="participant-field">
              <label htmlFor={`team-${participant.id}`}>Clube</label>
              <select disabled={!canWrite} id={`team-${participant.id}`} name="team_id" required defaultValue={participant.team_id}>
                {teamOptions(overview.teams)}
              </select>
            </div>
            <div className="participant-field">
              <label htmlFor={`order-${participant.id}`}>Ordem</label>
              <input disabled={!canWrite} id={`order-${participant.id}`} name="display_order" type="number" defaultValue={participant.display_order ?? 0} />
            </div>
            <div className="participant-field">
              <label htmlFor={`status-${participant.id}`}>Estado</label>
              <select disabled={!canWrite} id={`status-${participant.id}`} name="status" defaultValue={participant.status ?? "active"}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <span className={sourceClass(participant)}>{sourceLabel(participant, overview.syncMetadataAvailable)}</span>
            <button className="participant-button" disabled={!canWrite} type="submit">Guardar</button>
            <button className="participant-button secondary" disabled={!canWrite} name="action" type="submit" value="delete">Remover</button>
          </form>
        ))}
      </section>
    </main>
  );
}
