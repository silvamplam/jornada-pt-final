import { getAdminBroadcastChannels } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const channelAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .channel-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .channel-admin-hero {
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

  .channel-admin-hero p,
  .channel-admin-hero h1,
  .channel-admin-hero span {
    margin: 0;
  }

  .channel-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .channel-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .channel-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .channel-admin-hero a {
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

  .channel-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #dce3eb;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .channel-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .channel-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .channel-admin-create,
  .channel-admin-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .channel-admin-create header,
  .channel-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .channel-admin-create h2,
  .channel-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .channel-admin-create small,
  .channel-admin-list small {
    color: #687380;
  }

  .channel-form {
    display: grid;
    grid-template-columns: 54px minmax(180px, 1.1fr) minmax(140px, 0.9fr) minmax(120px, 0.7fr) minmax(260px, 1.5fr) auto;
    gap: 10px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .channel-form:last-child {
    border-bottom: 0;
  }

  .channel-form figure {
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

  .channel-form img {
    display: block;
    width: 36px !important;
    max-width: 36px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .channel-field {
    display: grid;
    gap: 5px;
  }

  .channel-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .channel-field input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
  }

  .channel-field input:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .channel-form button {
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

  .channel-form button:disabled,
  .channel-field input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 1040px) {
    .channel-form {
      grid-template-columns: 54px repeat(2, minmax(0, 1fr));
    }

    .channel-form button {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .channel-admin-shell {
      padding: 16px;
    }

    .channel-admin-hero,
    .channel-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

type ChannelsPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "missing-fields") {
    return "Nome do canal e obrigatorio.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar o canal TV.";
  }

  return null;
}

export default async function AdminChannelsPage({ searchParams }: ChannelsPageProps) {
  const params = await searchParams;
  const overview = await getAdminBroadcastChannels();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;

  return (
    <main className="channel-admin-shell">
      <style>{channelAdminStyles}</style>
      <header className="channel-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Canais TV</h1>
          <span>Gerir onde se ve cada jogo: canal, plataforma, pais e logotipo.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="channel-admin-message warning">
          Falta configurar a ligacao ao Supabase.
        </section>
      ) : null}

      {!overview.writeConfigured ? (
        <section className="channel-admin-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}

      {overview.error ? <section className="channel-admin-message warning">{overview.error}</section> : null}
      {message ? <section className="channel-admin-message warning">{message}</section> : null}
      {params.created ? <section className="channel-admin-message success">Canal criado.</section> : null}
      {params.updated ? <section className="channel-admin-message success">Canal atualizado.</section> : null}

      <section className="channel-admin-create">
        <header>
          <h2>Novo canal TV</h2>
          <small>Cria canais para associar depois aos jogos e agendas.</small>
        </header>
        <form action="/api/admin/broadcast-channels" className="channel-form" method="post">
          <figure>TV</figure>
          <div className="channel-field">
            <label htmlFor="new-name">Nome</label>
            <input disabled={!canWrite} id="new-name" name="name" placeholder="Ex: Sport TV 1" required />
          </div>
          <div className="channel-field">
            <label htmlFor="new-platform">Plataforma</label>
            <input disabled={!canWrite} id="new-platform" name="platform" placeholder="Sport TV" />
          </div>
          <div className="channel-field">
            <label htmlFor="new-country">Pais</label>
            <input disabled={!canWrite} id="new-country" name="country" placeholder="Portugal" />
          </div>
          <div className="channel-field">
            <label htmlFor="new-logo-url">Logotipo URL</label>
            <input disabled={!canWrite} id="new-logo-url" name="logo_url" placeholder="https://..." />
          </div>
          <button disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="channel-admin-list">
        <header>
          <h2>Canais existentes</h2>
          <small>{overview.broadcastChannels.length} canais na base de dados</small>
        </header>
        {overview.broadcastChannels.map((channel) => (
          <form
            action={`/api/admin/broadcast-channels/${channel.id}`}
            className="channel-form"
            key={channel.id}
            method="post"
          >
            <figure>{channel.logo_url ? <img alt="" src={channel.logo_url} /> : "TV"}</figure>
            <div className="channel-field">
              <label htmlFor={`name-${channel.id}`}>Nome</label>
              <input disabled={!canWrite} id={`name-${channel.id}`} name="name" required defaultValue={channel.name} />
            </div>
            <div className="channel-field">
              <label htmlFor={`platform-${channel.id}`}>Plataforma</label>
              <input
                disabled={!canWrite}
                id={`platform-${channel.id}`}
                name="platform"
                defaultValue={channel.platform ?? ""}
              />
            </div>
            <div className="channel-field">
              <label htmlFor={`country-${channel.id}`}>Pais</label>
              <input
                disabled={!canWrite}
                id={`country-${channel.id}`}
                name="country"
                defaultValue={channel.country ?? ""}
              />
            </div>
            <div className="channel-field">
              <label htmlFor={`logo-${channel.id}`}>Logotipo URL</label>
              <input
                disabled={!canWrite}
                id={`logo-${channel.id}`}
                name="logo_url"
                defaultValue={channel.logo_url ?? ""}
              />
            </div>
            <button disabled={!canWrite} type="submit">Guardar</button>
          </form>
        ))}
      </section>
    </main>
  );
}
