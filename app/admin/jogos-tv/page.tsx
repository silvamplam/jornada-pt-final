import { getAdminMatchesTv } from "@/lib/supabase";
import { BulkBroadcastTool } from "./BulkBroadcastTool";

export const dynamic = "force-dynamic";

const matchTvAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .match-tv-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .match-tv-hero {
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

  .match-tv-hero p,
  .match-tv-hero h1,
  .match-tv-hero span {
    margin: 0;
  }

  .match-tv-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-tv-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .match-tv-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .match-tv-hero a {
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

  .match-tv-message {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .match-tv-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .match-tv-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .match-tv-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .match-tv-bulk {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .match-tv-bulk header,
  .match-tv-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .match-tv-bulk h2,
  .match-tv-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .match-tv-bulk small,
  .match-tv-list small {
    color: #687380;
  }

  .match-tv-bulk-body {
    display: grid;
    gap: 14px;
    padding: 18px 20px 20px;
  }

  .match-tv-bulk-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: end;
    justify-content: space-between;
  }

  .match-tv-bulk-controls label {
    display: grid;
    flex: 1 1 280px;
    gap: 5px;
  }

  .match-tv-bulk-controls span {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-tv-bulk select,
  .match-tv-bulk textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 14px;
  }

  .match-tv-bulk textarea {
    min-height: 150px;
    resize: vertical;
  }

  .match-tv-bulk-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .match-tv-bulk button {
    min-height: 39px;
    padding: 10px 13px;
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

  .match-tv-bulk button.match-tv-secondary {
    background: #25303c;
  }

  .match-tv-bulk button:disabled,
  .match-tv-bulk select:disabled,
  .match-tv-bulk textarea:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .match-tv-bulk-message,
  .match-tv-bulk-help {
    margin: 0;
    color: #607086;
    font-size: 13px;
  }

  .match-tv-preview {
    display: grid;
    gap: 12px;
  }

  .match-tv-preview-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .match-tv-preview-summary span {
    padding: 6px 9px;
    border-radius: 999px;
    background: #eef2f6;
    color: #34404d;
    font-size: 12px;
    font-weight: 800;
  }

  .match-tv-preview-table-wrap {
    overflow-x: auto;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
  }

  .match-tv-preview table {
    width: 100%;
    min-width: 920px;
    border-collapse: collapse;
    font-size: 13px;
  }

  .match-tv-preview th,
  .match-tv-preview td {
    padding: 10px;
    border-bottom: 1px solid #e9eef4;
    text-align: left;
    vertical-align: top;
  }

  .match-tv-preview th {
    background: #f8fafc;
    color: #536173;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-tv-form {
    display: grid;
    grid-template-columns: 150px minmax(260px, 1.6fr) 42px minmax(190px, 1fr) minmax(170px, 0.9fr) 112px;
    gap: 10px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eef2f6;
  }

  .match-tv-form:last-child {
    border-bottom: 0;
  }

  .match-tv-meta {
    display: grid;
    gap: 2px;
  }

  .match-tv-meta strong,
  .match-tv-game strong {
    font-size: 14px;
  }

  .match-tv-meta small,
  .match-tv-game small,
  .match-tv-channel small {
    color: #687380;
  }

  .match-tv-game {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .match-tv-score {
    text-align: center;
    font-size: 17px;
    font-weight: 900;
  }

  .match-tv-channel {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 9px;
    align-items: center;
    min-width: 0;
  }

  .match-tv-channel figure {
    display: grid;
    place-items: center;
    width: 42px;
    height: 34px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 6px;
    background: #f8fafc;
    color: #5e6874;
    font-size: 11px;
    font-weight: 900;
  }

  .match-tv-channel img {
    display: block;
    width: 36px !important;
    max-width: 36px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .match-tv-channel strong,
  .match-tv-channel small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .match-tv-select {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .match-tv-select label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .match-tv-select select {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 14px;
  }

  .match-tv-select select:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .match-tv-form button {
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

  .match-tv-form button:disabled,
  .match-tv-select select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 860px) {
    .match-tv-form {
      grid-template-columns: 1fr 1fr;
    }

    .match-tv-form button {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .match-tv-shell {
      padding: 16px;
    }

    .match-tv-hero,
    .match-tv-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

type MatchesTvPageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

function formatKickoff(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  })
    .format(new Date(value))
    .replace(".", "");
}

function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) {
    return "x";
  }

  return `${home}-${away}`;
}

function statusLabel(status: string): string {
  if (status === "live") return "Em direto";
  if (status === "halftime") return "Intervalo";
  if (status === "finished") return "Finalizado";
  return "Agendado";
}

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar o canal do jogo.";
  }

  return null;
}

export default async function AdminMatchesTvPage({ searchParams }: MatchesTvPageProps) {
  const params = await searchParams;
  const overview = await getAdminMatchesTv();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;

  return (
    <main className="match-tv-shell">
      <style>{matchTvAdminStyles}</style>
      <header className="match-tv-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Jogos e TV</h1>
          <span>Ligar cada jogo ao canal certo para a agenda mostrar onde se ve com logotipo.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? <section className="match-tv-message warning">Falta configurar a ligacao ao Supabase.</section> : null}
      {!overview.writeConfigured ? (
        <section className="match-tv-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}
      {overview.error ? <section className="match-tv-message warning">{overview.error}</section> : null}
      {message ? <section className="match-tv-message warning">{message}</section> : null}
      {params.updated ? <section className="match-tv-message success">Canal do jogo atualizado.</section> : null}

      <BulkBroadcastTool
        broadcastChannels={overview.broadcastChannels}
        canWrite={canWrite}
        competitions={overview.competitions}
        seasons={overview.seasons}
      />

      <section className="match-tv-list">
        <header>
          <h2>Agenda e transmissao</h2>
          <small>{overview.matches.length} jogos na base de dados</small>
        </header>

        {overview.matches.length === 0 ? (
          <section className="match-tv-message">
            Ainda nao ha jogos na tabela da base de dados. Corre primeiro o SQL de preparacao dos jogos.
          </section>
        ) : null}

        {overview.matches.map((match) => (
          <form action={`/api/admin/matches/${match.id}/broadcast`} className="match-tv-form" key={match.id} method="post">
            <div className="match-tv-meta">
              <strong>{match.competition?.name ?? "Competicao"}</strong>
              <small>{formatKickoff(match.kickoff_at)}</small>
              <small>{statusLabel(match.status)}</small>
            </div>

            <div className="match-tv-game">
              <strong>
                {match.homeTeam?.name ?? "Equipa casa"} vs {match.awayTeam?.name ?? "Equipa fora"}
              </strong>
              <small>{match.venue ?? "Estadio a confirmar"}</small>
            </div>

            <div className="match-tv-score">{formatScore(match.home_score, match.away_score)}</div>

            <div className="match-tv-channel">
              <figure>
                {match.broadcastChannel?.logo_url ? <img alt="" src={match.broadcastChannel.logo_url} /> : "TV"}
              </figure>
              <div>
                <strong>{match.broadcastChannel?.name ?? "Sem canal"}</strong>
                <small>{match.broadcastChannel?.platform ?? "Por definir"}</small>
              </div>
            </div>

            <div className="match-tv-select">
              <label htmlFor={`broadcast-${match.id}`}>Onde se ve</label>
              <select
                disabled={!canWrite}
                id={`broadcast-${match.id}`}
                name="broadcast_channel_id"
                defaultValue={match.broadcast_channel_id ?? ""}
              >
                <option value="">Sem canal definido</option>
                {overview.broadcastChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <button disabled={!canWrite} type="submit">Guardar</button>
          </form>
        ))}
      </section>
    </main>
  );
}
