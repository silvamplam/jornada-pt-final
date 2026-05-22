import { getAdminCompetitions } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const competitionAdminStyles = `
  body { margin: 0; background: #eef2f6; }

  .competition-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .competition-admin-hero {
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

  .competition-admin-hero p,
  .competition-admin-hero h1 { margin: 0; }

  .competition-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .competition-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .competition-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .competition-admin-hero a {
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

  .competition-admin-message,
  .competition-admin-create,
  .competition-admin-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .competition-admin-message {
    padding: 16px 18px;
  }

  .competition-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .competition-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .competition-admin-create header,
  .competition-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .competition-admin-create h2,
  .competition-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .competition-admin-create small,
  .competition-admin-list small {
    color: #687380;
  }

  .competition-form {
    display: grid;
    grid-template-columns: 48px minmax(150px, 1.25fr) minmax(120px, 1fr) minmax(120px, 0.9fr) minmax(240px, 1.5fr) 120px 120px auto;
    gap: 10px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .competition-form:last-child { border-bottom: 0; }

  .competition-logo {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 50%;
    background: #f8fafc;
    color: #5e6874;
    font-size: 11px;
    font-weight: 900;
  }

  .competition-logo img {
    display: block;
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .competition-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .competition-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .competition-field input,
  .competition-field select {
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

  .competition-form button {
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

  .competition-form button:disabled,
  .competition-field input:disabled,
  .competition-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 1180px) {
    .competition-form { grid-template-columns: 48px repeat(2, minmax(0, 1fr)); }
    .competition-form button { grid-column: 1 / -1; }
  }

  @media (max-width: 720px) {
    .competition-admin-shell { padding: 16px; }
    .competition-admin-hero,
    .competition-form { display: grid; grid-template-columns: 1fr; }
  }
`;

type CompetitionsPageProps = {
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
    return "Nome e slug sao obrigatorios.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar. Confirma se o slug nao esta repetido.";
  }

  return null;
}

export default async function AdminCompetitionsPage({ searchParams }: CompetitionsPageProps) {
  const params = await searchParams;
  const overview = await getAdminCompetitions();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;

  return (
    <main className="competition-admin-shell">
      <style>{competitionAdminStyles}</style>
      <header className="competition-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Competicoes</h1>
          <span>Cria a base competitiva: nome, pais, logotipo e identidade visual.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="competition-admin-message warning">Falta configurar a ligacao ao Supabase.</section>
      ) : null}

      {!overview.writeConfigured ? (
        <section className="competition-admin-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}

      {overview.error ? <section className="competition-admin-message warning">{overview.error}</section> : null}
      {message ? <section className="competition-admin-message warning">{message}</section> : null}
      {params.created ? <section className="competition-admin-message success">Competicao criada.</section> : null}
      {params.updated ? <section className="competition-admin-message success">Competicao atualizada.</section> : null}

      <section className="competition-admin-create">
        <header>
          <h2>Nova competicao</h2>
          <small>Depois de criada, podes abrir epocas e participantes dessa competicao.</small>
        </header>
        <form action="/api/admin/competitions" className="competition-form" method="post">
          <span className="competition-logo">+</span>
          <div className="competition-field">
            <label htmlFor="new-name">Nome</label>
            <input disabled={!canWrite} id="new-name" name="name" placeholder="Ex: Liga Portugal" required />
          </div>
          <div className="competition-field">
            <label htmlFor="new-slug">Slug</label>
            <input disabled={!canWrite} id="new-slug" name="slug" placeholder="liga-portugal" />
          </div>
          <div className="competition-field">
            <label htmlFor="new-country">Pais</label>
            <input disabled={!canWrite} id="new-country" name="country" placeholder="Portugal" />
          </div>
          <div className="competition-field">
            <label htmlFor="new-logo-url">Logotipo URL</label>
            <input disabled={!canWrite} id="new-logo-url" name="logo_url" placeholder="https://..." />
          </div>
          <div className="competition-field">
            <label htmlFor="new-color">Cor</label>
            <input disabled={!canWrite} id="new-color" name="accent_color" placeholder="#e5252a" />
          </div>
          <div className="competition-field">
            <label htmlFor="new-active">Estado</label>
            <select disabled={!canWrite} id="new-active" name="is_active" defaultValue="true">
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </select>
          </div>
          <button disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="competition-admin-list">
        <header>
          <h2>Competicoes existentes</h2>
          <small>{overview.competitions.length} competicoes na base de dados</small>
        </header>
        {overview.competitions.map((competition) => (
          <form action={`/api/admin/competitions/${competition.id}`} className="competition-form" key={competition.id} method="post">
            <span className="competition-logo">
              {competition.logo_url ? <img alt="" src={competition.logo_url} /> : competition.slug.slice(0, 3).toUpperCase()}
            </span>
            <div className="competition-field">
              <label htmlFor={`name-${competition.id}`}>Nome</label>
              <input disabled={!canWrite} id={`name-${competition.id}`} name="name" required defaultValue={competition.name} />
            </div>
            <div className="competition-field">
              <label htmlFor={`slug-${competition.id}`}>Slug</label>
              <input disabled={!canWrite} id={`slug-${competition.id}`} name="slug" required defaultValue={competition.slug} />
            </div>
            <div className="competition-field">
              <label htmlFor={`country-${competition.id}`}>Pais</label>
              <input disabled={!canWrite} id={`country-${competition.id}`} name="country" defaultValue={competition.country ?? ""} />
            </div>
            <div className="competition-field">
              <label htmlFor={`logo-${competition.id}`}>Logotipo URL</label>
              <input disabled={!canWrite} id={`logo-${competition.id}`} name="logo_url" defaultValue={competition.logo_url ?? ""} />
            </div>
            <div className="competition-field">
              <label htmlFor={`color-${competition.id}`}>Cor</label>
              <input disabled={!canWrite} id={`color-${competition.id}`} name="accent_color" defaultValue={competition.accent_color ?? ""} />
            </div>
            <div className="competition-field">
              <label htmlFor={`active-${competition.id}`}>Estado</label>
              <select disabled={!canWrite} id={`active-${competition.id}`} name="is_active" defaultValue={competition.is_active ? "true" : "false"}>
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
            <button disabled={!canWrite} type="submit">Guardar</button>
          </form>
        ))}
      </section>
    </main>
  );
}
