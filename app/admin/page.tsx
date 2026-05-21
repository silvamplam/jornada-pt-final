import { getAdminOverview } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const adminPageStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .admin-hero {
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

  .admin-hero p,
  .admin-hero h1 {
    margin: 0;
  }

  .admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .admin-hero span {
    display: block;
    margin-top: 10px;
    max-width: 680px;
    color: #cdd5df;
    font-size: 16px;
  }

  .admin-hero-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 10px;
    align-items: center;
  }

  .admin-hero-actions form {
    margin: 0;
  }

  .admin-hero a,
  .admin-hero button {
    display: inline-block;
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .admin-hero button {
    background: rgba(229, 37, 42, 0.92);
    border-color: rgba(229, 37, 42, 0.92);
  }

  .admin-warning {
    margin-top: 18px;
    padding: 22px;
    border: 1px solid #ffd3a3;
    border-radius: 8px;
    background: #fff8ee;
  }

  .admin-warning h2,
  .admin-warning p {
    margin: 0;
  }

  .admin-warning p {
    margin-top: 8px;
    color: #5b6571;
  }

  .admin-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .admin-stats article {
    padding: 20px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .admin-stats strong {
    display: block;
    color: #e5252a;
    font-size: 38px;
    line-height: 1;
  }

  .admin-stats span {
    display: block;
    margin-top: 7px;
    color: #5e6874;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 14px;
  }

  .admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .admin-panel header {
    padding: 16px 18px;
    border-bottom: 1px solid #e6ebf1;
  }

  .admin-panel h2 {
    margin: 0;
    font-size: 19px;
    text-transform: uppercase;
  }

  .admin-panel small {
    color: #687380;
  }

  .admin-panel ul {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .admin-panel li {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-height: 52px;
    padding: 9px 14px;
    border-bottom: 1px solid #eef2f6;
  }

  .admin-panel li:last-child {
    border-bottom: 0;
  }

  .admin-panel li span:first-child {
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

  .admin-panel img,
  .admin-panel li span:first-child img {
    display: block;
    width: 24px !important;
    max-width: 24px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .admin-panel b {
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 920px) {
    .admin-shell {
      padding: 16px;
    }

    .admin-hero,
    .admin-stats,
    .admin-grid {
      display: grid;
      grid-template-columns: 1fr;
    }

    .admin-hero-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .admin-hero-actions a,
    .admin-hero-actions button {
      width: 100%;
      text-align: center;
    }
  }
`;

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <main className="admin-shell">
      <style>{adminPageStyles}</style>
      <header className="admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Backoffice inicial</h1>
          <span>A primeira ligação entre o site, a base de dados e a futura máquina editorial.</span>
        </div>
        <div className="admin-hero-actions">
          <a href="/">Voltar ao site</a>
          <form action="/api/admin/logout" method="post">
            <button type="submit">Sair</button>
          </form>
        </div>
      </header>

      {!overview.configured ? (
        <section className="admin-warning">
          <h2>Supabase ainda não ligado</h2>
          <p>
            Falta configurar as variáveis <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e{" "}
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> na Vercel.
          </p>
        </section>
      ) : overview.error ? (
        <section className="admin-warning">
          <h2>Ligação encontrada, mas a leitura falhou</h2>
          <p>{overview.error}</p>
          <p>Se a base tiver RLS ativo, aplica primeiro as políticas públicas de leitura segura.</p>
        </section>
      ) : (
        <>
          <section className="admin-stats" aria-label="Resumo da base de dados">
            <article>
              <strong>{overview.competitions.length}</strong>
              <span>Competições</span>
            </article>
            <article>
              <strong>{overview.teams.length}</strong>
              <span>Clubes</span>
            </article>
            <article>
              <strong>{overview.broadcastChannels.length}</strong>
              <span>Canais TV</span>
            </article>
          </section>

          <section className="admin-grid">
            <article className="admin-panel">
              <header>
                <h2>Competições</h2>
                <small>Base competitiva do site</small>
              </header>
              <ul>
                {overview.competitions.map((competition) => (
                  <li key={competition.id}>
                    <span>{competition.logo_url ? <img src={competition.logo_url} alt="" /> : null}</span>
                    <b>{competition.name}</b>
                    <small>{competition.country ?? competition.slug}</small>
                  </li>
                ))}
              </ul>
            </article>

            <article className="admin-panel">
              <header>
                <h2>Clubes</h2>
                <small>Primeiros emblemas e nomes curtos</small>
              </header>
              <ul>
                {overview.teams.slice(0, 12).map((team) => (
                  <li key={team.id}>
                    <span>{team.logo_url ? <img src={team.logo_url} alt="" /> : team.short_name}</span>
                    <b>{team.name}</b>
                    <small>{team.short_name}</small>
                  </li>
                ))}
              </ul>
            </article>

            <article className="admin-panel">
              <header>
                <h2>Canais TV</h2>
                <small>Onde se vê cada jogo</small>
              </header>
              <ul>
                {overview.broadcastChannels.map((channel) => (
                  <li key={channel.id}>
                    <span>TV</span>
                    <b>{channel.name}</b>
                    <small>{channel.platform ?? channel.country ?? "Canal"}</small>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
