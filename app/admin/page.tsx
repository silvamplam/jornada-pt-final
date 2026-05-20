import { getAdminOverview } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <main className="admin-shell">
      <header className="admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Backoffice inicial</h1>
          <span>A primeira ligação entre o site, a base de dados e a futura máquina editorial.</span>
        </div>
        <a href="/">Voltar ao site</a>
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
