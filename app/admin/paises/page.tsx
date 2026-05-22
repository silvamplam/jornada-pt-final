import { getAdminCountries } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const countryAdminStyles = `
  body { margin: 0; background: #eef2f6; }

  .country-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .country-admin-hero {
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

  .country-admin-hero p,
  .country-admin-hero h1 { margin: 0; }

  .country-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .country-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .country-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .country-admin-hero a {
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

  .country-admin-message,
  .country-admin-create,
  .country-admin-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .country-admin-message { padding: 16px 18px; }

  .country-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .country-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .country-admin-create header,
  .country-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .country-admin-create h2,
  .country-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .country-admin-create small,
  .country-admin-list small {
    color: #687380;
  }

  .country-form {
    display: grid;
    grid-template-columns: 48px minmax(180px, 1.4fr) minmax(140px, 1fr) 90px 90px 120px auto;
    gap: 10px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .country-form:last-child { border-bottom: 0; }

  .country-badge {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 50%;
    background: #f8fafc;
    color: #10151b;
    font-size: 18px;
    font-weight: 900;
  }

  .country-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .country-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .country-field input,
  .country-field select {
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

  .country-form button {
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

  .country-form button:disabled,
  .country-field input:disabled,
  .country-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .country-empty {
    padding: 18px;
    color: #687380;
  }

  @media (max-width: 980px) {
    .country-admin-shell { padding: 16px; }
    .country-admin-hero,
    .country-form { display: grid; grid-template-columns: 1fr; }
  }
`;

type CountriesPageProps = {
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

export default async function AdminCountriesPage({ searchParams }: CountriesPageProps) {
  const params = await searchParams;
  const overview = await getAdminCountries();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;

  return (
    <main className="country-admin-shell">
      <style>{countryAdminStyles}</style>
      <header className="country-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Paises</h1>
          <span>Cria apenas os paises que queres gerir. As competicoes passam a nascer dentro deste contexto.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="country-admin-message warning">Falta configurar a ligacao ao Supabase.</section>
      ) : null}

      {!overview.writeConfigured ? (
        <section className="country-admin-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}

      {overview.error ? <section className="country-admin-message warning">{overview.error}</section> : null}
      {message ? <section className="country-admin-message warning">{message}</section> : null}
      {params.created ? <section className="country-admin-message success">Pais criado.</section> : null}
      {params.updated ? <section className="country-admin-message success">Pais atualizado.</section> : null}

      <section className="country-admin-create">
        <header>
          <h2>Novo pais</h2>
          <small>Depois de criado, podes associar competicoes a este pais.</small>
        </header>
        <form action="/api/admin/countries" className="country-form" method="post">
          <span className="country-badge">+</span>
          <div className="country-field">
            <label htmlFor="new-name">Nome</label>
            <input disabled={!canWrite} id="new-name" name="name" placeholder="Ex: Portugal" required />
          </div>
          <div className="country-field">
            <label htmlFor="new-slug">Slug</label>
            <input disabled={!canWrite} id="new-slug" name="slug" placeholder="portugal" />
          </div>
          <div className="country-field">
            <label htmlFor="new-iso2">ISO2</label>
            <input disabled={!canWrite} id="new-iso2" maxLength={2} name="iso2" placeholder="PT" />
          </div>
          <div className="country-field">
            <label htmlFor="new-flag">Flag</label>
            <input disabled={!canWrite} id="new-flag" name="flag_emoji" placeholder="PT" />
          </div>
          <div className="country-field">
            <label htmlFor="new-active">Estado</label>
            <select disabled={!canWrite} id="new-active" name="is_active" defaultValue="true">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <button disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="country-admin-list">
        <header>
          <h2>Paises existentes</h2>
          <small>{overview.countries.length} paises na base de dados</small>
        </header>
        {overview.countries.length === 0 ? (
          <div className="country-empty">Ainda nao ha paises criados.</div>
        ) : null}
        {overview.countries.map((country) => (
          <form action={`/api/admin/countries/${country.id}`} className="country-form" key={country.id} method="post">
            <span className="country-badge">{country.flag_emoji || country.iso2 || country.slug.slice(0, 2).toUpperCase()}</span>
            <div className="country-field">
              <label htmlFor={`name-${country.id}`}>Nome</label>
              <input disabled={!canWrite} id={`name-${country.id}`} name="name" required defaultValue={country.name} />
            </div>
            <div className="country-field">
              <label htmlFor={`slug-${country.id}`}>Slug</label>
              <input disabled={!canWrite} id={`slug-${country.id}`} name="slug" required defaultValue={country.slug} />
            </div>
            <div className="country-field">
              <label htmlFor={`iso2-${country.id}`}>ISO2</label>
              <input disabled={!canWrite} id={`iso2-${country.id}`} maxLength={2} name="iso2" defaultValue={country.iso2 ?? ""} />
            </div>
            <div className="country-field">
              <label htmlFor={`flag-${country.id}`}>Flag</label>
              <input disabled={!canWrite} id={`flag-${country.id}`} name="flag_emoji" defaultValue={country.flag_emoji ?? ""} />
            </div>
            <div className="country-field">
              <label htmlFor={`active-${country.id}`}>Estado</label>
              <select disabled={!canWrite} id={`active-${country.id}`} name="is_active" defaultValue={country.is_active ? "true" : "false"}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <button disabled={!canWrite} type="submit">Guardar</button>
          </form>
        ))}
      </section>
    </main>
  );
}
