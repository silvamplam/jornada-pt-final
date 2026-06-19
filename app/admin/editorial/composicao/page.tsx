import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CompetitionOption = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active?: boolean | null;
};

type SeasonOption = {
  id: string;
  competition_id: string | null;
  label: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  is_current?: boolean | null;
};

type MatchdayOption = {
  id: string;
  season_id: string | null;
  number: number | null;
  label: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  status?: string | null;
};

async function loadEntryOptions() {
  try {
    const [competitions, seasons, matchdays] = await Promise.all([
      fetchSupabaseAdminTable<CompetitionOption>("competitions?select=id,name,slug,is_active&order=name.asc"),
      fetchSupabaseAdminTable<SeasonOption>("seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"),
      fetchSupabaseAdminTable<MatchdayOption>("matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc")
    ]);

    return { competitions, seasons, matchdays, error: null as string | null };
  } catch (error) {
    return {
      competitions: [] as CompetitionOption[],
      seasons: [] as SeasonOption[],
      matchdays: [] as MatchdayOption[],
      error: error instanceof Error ? error.message : "Nao foi possivel carregar jornadas."
    };
  }
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleanValue = value?.trim();
    if (cleanValue) {
      return cleanValue;
    }
  }

  return "";
}

function matchdayLabel(matchday: MatchdayOption) {
  const baseLabel = firstText(matchday.label, matchday.number ? `J${String(matchday.number).padStart(2, "0")}` : null, matchday.id);
  return matchday.number ? `${baseLabel} - J${String(matchday.number).padStart(2, "0")}` : baseLabel;
}

const entryStyles = `
  .editorial-entry-shell {
    min-height: 100vh;
    background: #f4f6f8;
    color: #111827;
    padding: 32px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .editorial-entry-container {
    max-width: 1180px;
    margin: 0 auto;
  }

  .editorial-entry-hero,
  .editorial-entry-panel {
    border-radius: 10px;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.12);
  }

  .editorial-entry-hero {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 24px;
    padding: 26px;
    background: #10151b;
    color: #fff;
  }

  .editorial-entry-hero h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.08;
  }

  .editorial-entry-hero p {
    max-width: 720px;
    margin: 8px 0 0;
    color: #cbd5e1;
    line-height: 1.55;
  }

  .editorial-entry-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
  }

  .editorial-entry-actions a,
  .editorial-entry-button {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    padding: 0 14px;
    background: transparent;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .editorial-entry-button {
    border-color: #111827;
    background: #111827;
    color: #fff;
  }

  .editorial-entry-button.is-disabled {
    border-color: #d1d5db;
    background: #f3f4f6;
    color: #6b7280;
    pointer-events: none;
  }

  .editorial-entry-panel {
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 24px;
  }

  .editorial-entry-panel h2 {
    margin: 0;
    font-size: 22px;
  }

  .editorial-entry-panel p {
    margin: 8px 0 0;
    color: #6b7280;
    line-height: 1.55;
  }

  .editorial-entry-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin: 22px 0;
  }

  .editorial-entry-field {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
  }

  .editorial-entry-field span {
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .editorial-entry-field select {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 11px;
    background: #fff;
    color: #111827;
    font: inherit;
    font-weight: 600;
  }

  .editorial-entry-alert {
    margin: 18px 0 0;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    padding: 12px 14px;
    color: #1e3a8a;
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 820px) {
    .editorial-entry-shell {
      padding: 18px;
    }

    .editorial-entry-hero,
    .editorial-entry-grid {
      display: grid;
      grid-template-columns: 1fr;
    }

    .editorial-entry-actions {
      justify-content: flex-start;
    }
  }
`;

const entryScript = `
(function () {
  var root = document.querySelector("[data-editorial-entry]");
  if (!root) return;
  var competition = root.querySelector("[data-entry-competition]");
  var season = root.querySelector("[data-entry-season]");
  var matchday = root.querySelector("[data-entry-matchday]");
  var action = root.querySelector("[data-entry-action]");
  var destination = root.getAttribute("data-destination-base") || "";

  function selectedOption(select) {
    return select && select.options ? select.options[select.selectedIndex] : null;
  }

  function update() {
    var competitionId = competition ? competition.value : "";
    var seasonId = season ? season.value : "";

    if (season) {
      Array.prototype.forEach.call(season.options, function (option) {
        if (!option.value) {
          option.hidden = false;
          option.disabled = false;
          return;
        }
        var keep = !competitionId || option.getAttribute("data-competition-id") === competitionId;
        option.hidden = !keep;
        option.disabled = !keep;
      });

      if (selectedOption(season) && selectedOption(season).disabled) {
        season.value = "";
        seasonId = "";
      }
    }

    if (matchday) {
      Array.prototype.forEach.call(matchday.options, function (option) {
        if (!option.value) {
          option.hidden = false;
          option.disabled = false;
          return;
        }
        var keepBySeason = !seasonId || option.getAttribute("data-season-id") === seasonId;
        var keepByCompetition = !competitionId || option.getAttribute("data-competition-id") === competitionId;
        var keep = keepBySeason && keepByCompetition;
        option.hidden = !keep;
        option.disabled = !keep;
      });

      if (selectedOption(matchday) && selectedOption(matchday).disabled) {
        matchday.value = "";
      }
    }

    if (!action) return;
    if (matchday && matchday.value) {
      action.setAttribute("href", destination + "/" + encodeURIComponent(matchday.value));
      action.classList.remove("is-disabled");
      action.removeAttribute("aria-disabled");
      action.textContent = "Abrir jornada escolhida";
      return;
    }

    action.removeAttribute("href");
    action.classList.add("is-disabled");
    action.setAttribute("aria-disabled", "true");
    action.textContent = "Escolha uma jornada";
  }

  if (competition) competition.addEventListener("change", update);
  if (season) season.addEventListener("change", update);
  if (matchday) matchday.addEventListener("change", update);
  update();
})();
`;

export default async function AdminEditorialComposicaoEntryPage() {
  const { competitions, seasons, matchdays, error } = await loadEntryOptions();
  const competitionBySeasonId = new Map(seasons.map((season) => [season.id, season.competition_id ?? ""]));

  return (
    <main className="editorial-entry-shell">
      <style>{entryStyles}</style>
      <div className="editorial-entry-container">
        <header className="editorial-entry-hero">
          <div>
            <h1>Composicao Editorial</h1>
            <p>Escolha competicao, epoca e jornada para abrir a composicao historica da jornada certa.</p>
          </div>
          <nav className="editorial-entry-actions" aria-label="Navegacao editorial">
            <a href="/admin/editorial/home">Home Editorial</a>
            <a href="/admin/editorial/artigos">Artigos / Noticias</a>
            <a href="/admin/editorial/conteudos">CONTEÚDOS / AUDIOVISUAL</a>
            <a href="/admin/editorial/jornada">Editorial da Jornada</a>
            <a href="/admin/gestor">Centro de Gestao</a>
            <a href="/admin">Backoffice</a>
          </nav>
        </header>

        <section className="editorial-entry-panel" data-destination-base="/admin/editorial/composicao" data-editorial-entry>
          <h2>Escolher jornada</h2>
          <p>As opcoes abaixo usam competicoes, epocas e jornadas reais ja existentes no projeto.</p>
          {error ? <p className="editorial-entry-alert">{error}</p> : null}
          <div className="editorial-entry-grid">
            <label className="editorial-entry-field">
              <span>Competicao</span>
              <select data-entry-competition>
                <option value="">Todas as competicoes</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {firstText(competition.name, competition.slug, competition.id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="editorial-entry-field">
              <span>Epoca</span>
              <select data-entry-season>
                <option value="">Todas as epocas</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id} data-competition-id={season.competition_id ?? ""}>
                    {firstText(season.label, season.id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="editorial-entry-field">
              <span>Jornada</span>
              <select data-entry-matchday>
                <option value="">Escolher jornada</option>
                {matchdays.map((matchday) => (
                  <option
                    key={matchday.id}
                    value={matchday.id}
                    data-season-id={matchday.season_id ?? ""}
                    data-competition-id={matchday.season_id ? competitionBySeasonId.get(matchday.season_id) ?? "" : ""}
                  >
                    {matchdayLabel(matchday)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <a className="editorial-entry-button is-disabled" data-entry-action aria-disabled="true">
            Escolha uma jornada
          </a>
        </section>
      </div>
      <script dangerouslySetInnerHTML={{ __html: entryScript }} />
    </main>
  );
}
