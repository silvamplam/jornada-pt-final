import { getAdminSeasons, type SupabaseCompetition, type SupabaseCountry } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const seasonAdminStyles = `
  body { margin: 0; background: #eef2f6; }

  .season-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .season-admin-hero {
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

  .season-admin-hero p,
  .season-admin-hero h1 { margin: 0; }

  .season-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .season-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .season-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .season-admin-hero a {
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

  .season-admin-message,
  .season-admin-create,
  .season-admin-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .season-admin-message { padding: 16px 18px; }

  .season-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .season-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .season-admin-create header,
  .season-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .season-admin-create h2,
  .season-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .season-admin-create small,
  .season-admin-list small {
    color: #687380;
  }

  .season-form {
    display: grid;
    grid-template-columns: minmax(150px, 0.9fr) minmax(190px, 1.2fr) minmax(120px, 0.9fr) 140px 140px 120px auto;
    gap: 10px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .season-form:last-child { border-bottom: 0; }

  .season-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .season-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .season-field input,
  .season-field select {
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

  .season-form button {
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

  .season-form button:disabled,
  .season-field input:disabled,
  .season-field select:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .season-empty {
    padding: 18px;
    color: #687380;
  }

  @media (max-width: 980px) {
    .season-admin-shell { padding: 16px; }
    .season-admin-hero,
    .season-form { display: grid; grid-template-columns: 1fr; }
  }
`;

type SeasonsPageProps = {
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
    return "Escolhe uma competicao e escreve a epoca.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar. Confirma se essa epoca ainda nao existe nessa competicao.";
  }

  return null;
}

function countryOptions(countries: SupabaseCountry[]) {
  return countries.map((country) => (
    <option key={country.id} value={country.id}>
      {country.name}
    </option>
  ));
}

function competitionOptions(competitions: SupabaseCompetition[]) {
  return competitions.map((competition) => (
    <option data-country-id={competition.country_id ?? ""} key={competition.id} value={competition.id}>
      {competition.name}
    </option>
  ));
}

function competitionName(competitions: SupabaseCompetition[], competitionId: string) {
  return competitions.find((competition) => competition.id === competitionId)?.name ?? "Competicao";
}

function competitionCountryId(competitions: SupabaseCompetition[], competitionId: string, countries: SupabaseCountry[]) {
  const competition = competitions.find((item) => item.id === competitionId);

  if (competition?.country_id) {
    return competition.country_id;
  }

  const country = countries.find((item) => item.name.toLowerCase() === (competition?.country ?? "").toLowerCase());
  return country?.id ?? countries[0]?.id ?? "";
}

export default async function AdminSeasonsPage({ searchParams }: SeasonsPageProps) {
  const params = await searchParams;
  const overview = await getAdminSeasons();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error && overview.countries.length > 0 && overview.competitions.length > 0;
  const defaultCountryId = overview.countries[0]?.id ?? "";
  const defaultCompetitionId = overview.competitions[0]?.id ?? "";

  return (
    <main className="season-admin-shell">
      <style>{seasonAdminStyles}</style>
      <header className="season-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Epocas</h1>
          <span>Cada competicao pode ter varias epocas. Os participantes e o calendario nascem daqui.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="season-admin-message warning">Falta configurar a ligacao ao Supabase.</section>
      ) : null}

      {!overview.writeConfigured ? (
        <section className="season-admin-message warning">
          Modo leitura ativo. Para editar, adiciona a variavel SUPABASE_SERVICE_ROLE_KEY na Vercel.
        </section>
      ) : null}

      {overview.countries.length === 0 ? (
        <section className="season-admin-message warning">
          Cria primeiro os paises em /admin/paises. Depois cria as competicoes dentro do pais certo.
        </section>
      ) : null}

      {overview.competitions.length === 0 ? (
        <section className="season-admin-message warning">
          Cria primeiro uma competicao em /admin/competicoes. So depois faz sentido abrir epocas.
        </section>
      ) : null}

      {overview.error ? <section className="season-admin-message warning">{overview.error}</section> : null}
      {message ? <section className="season-admin-message warning">{message}</section> : null}
      {params.created ? <section className="season-admin-message success">Epoca criada.</section> : null}
      {params.updated ? <section className="season-admin-message success">Epoca atualizada.</section> : null}

      <section className="season-admin-create">
        <header>
          <h2>Nova epoca</h2>
          <small>Escolhe a competicao e cria a epoca antes de definir participantes.</small>
        </header>
        <form action="/api/admin/seasons" className="season-form" method="post">
          <div className="season-field">
            <label htmlFor="new-country">Pais</label>
            <select data-country-filter disabled={!canWrite} id="new-country" defaultValue={defaultCountryId}>
              {countryOptions(overview.countries)}
            </select>
          </div>
          <div className="season-field">
            <label htmlFor="new-competition">Competicao</label>
            <select data-competition-filter disabled={!canWrite} id="new-competition" name="competition_id" required defaultValue={defaultCompetitionId}>
              {competitionOptions(overview.competitions)}
            </select>
          </div>
          <div className="season-field">
            <label htmlFor="new-label">Epoca</label>
            <input disabled={!canWrite} id="new-label" name="label" placeholder="2024/25" required />
          </div>
          <div className="season-field">
            <label htmlFor="new-starts">Inicio</label>
            <input disabled={!canWrite} id="new-starts" name="starts_on" type="date" />
          </div>
          <div className="season-field">
            <label htmlFor="new-ends">Fim</label>
            <input disabled={!canWrite} id="new-ends" name="ends_on" type="date" />
          </div>
          <div className="season-field">
            <label htmlFor="new-current">Estado</label>
            <select disabled={!canWrite} id="new-current" name="is_current" defaultValue="true">
              <option value="true">Atual</option>
              <option value="false">Arquivo</option>
            </select>
          </div>
          <button disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="season-admin-list">
        <header>
          <h2>Epocas existentes</h2>
          <small>{overview.seasons.length} epocas na base de dados</small>
        </header>
        {overview.seasons.length === 0 ? (
          <div className="season-empty">Ainda nao ha epocas criadas.</div>
        ) : null}
        {overview.seasons.map((season) => {
          const countryId = competitionCountryId(overview.competitions, season.competition_id, overview.countries);

          return (
            <form action={`/api/admin/seasons/${season.id}`} className="season-form" key={season.id} method="post">
              <div className="season-field">
                <label htmlFor={`country-${season.id}`}>Pais</label>
                <select data-country-filter disabled={!canWrite} id={`country-${season.id}`} defaultValue={countryId}>
                  {countryOptions(overview.countries)}
                </select>
              </div>
              <div className="season-field">
                <label htmlFor={`competition-${season.id}`}>Competicao</label>
                <select data-competition-filter disabled={!canWrite} id={`competition-${season.id}`} name="competition_id" required defaultValue={season.competition_id}>
                  {competitionOptions(overview.competitions)}
                </select>
              </div>
              <div className="season-field">
                <label htmlFor={`label-${season.id}`}>Epoca</label>
                <input disabled={!canWrite} id={`label-${season.id}`} name="label" required defaultValue={season.label} />
              </div>
              <div className="season-field">
                <label htmlFor={`starts-${season.id}`}>Inicio</label>
                <input disabled={!canWrite} id={`starts-${season.id}`} name="starts_on" type="date" defaultValue={season.starts_on ?? ""} />
              </div>
              <div className="season-field">
                <label htmlFor={`ends-${season.id}`}>Fim</label>
                <input disabled={!canWrite} id={`ends-${season.id}`} name="ends_on" type="date" defaultValue={season.ends_on ?? ""} />
              </div>
              <div className="season-field">
                <label htmlFor={`current-${season.id}`}>{competitionName(overview.competitions, season.competition_id)}</label>
                <select disabled={!canWrite} id={`current-${season.id}`} name="is_current" defaultValue={season.is_current ? "true" : "false"}>
                  <option value="true">Atual</option>
                  <option value="false">Arquivo</option>
                </select>
              </div>
              <button disabled={!canWrite} type="submit">Guardar</button>
            </form>
          );
        })}
      </section>
      <script
        dangerouslySetInnerHTML={{
          __html: `
document.querySelectorAll(".season-form").forEach(function(form) {
  var country = form.querySelector("[data-country-filter]");
  var competition = form.querySelector("[data-competition-filter]");

  function syncCompetitionOptions() {
    if (!competition) return;
    var countryId = country ? country.value : "";
    var firstAvailable = null;
    var currentOption = competition.options[competition.selectedIndex];

    Array.prototype.forEach.call(competition.options, function(option) {
      var optionCountryId = option.getAttribute("data-country-id") || "";
      var matches = !countryId || !optionCountryId || optionCountryId === countryId;
      option.hidden = !matches;
      option.disabled = !matches;
      if (matches && !firstAvailable) firstAvailable = option;
    });

    if ((!currentOption || currentOption.disabled) && firstAvailable) {
      competition.value = firstAvailable.value;
    }
  }

  if (country) {
    country.addEventListener("change", syncCompetitionOptions);
  }
  syncCompetitionOptions();
});
          `
        }}
      />
    </main>
  );
}
