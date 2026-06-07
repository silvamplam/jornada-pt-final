import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ArticleStatus = "draft" | "published";
type ArticleScope = "home" | "matchday" | "competition" | "general";

type EditorialArticle = {
  id: string;
  slug: string;
  status: ArticleStatus;
  scope: ArticleScope;
  season_id: string | null;
  matchday_id: string | null;
  competition_id: string | null;
  title: string | null;
  subtitle: string | null;
  label: string | null;
  author: string | null;
  image_url: string | null;
  image_caption: string | null;
  body: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type CompetitionRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type SeasonRow = {
  id: string;
  label: string | null;
  competition_id: string | null;
};

type SeasonOption = {
  label: string;
  representative_id: string;
};

type MatchdayRow = {
  id: string;
  number: number | null;
  season_id: string | null;
};

type MatchdayOption = {
  id: string;
  label: string;
  season_id: string | null;
  competition_id: string | null;
};

type ArticlesAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const styles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .articles-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .articles-admin-hero,
  .articles-admin-panel,
  .articles-admin-card {
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .articles-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
  }

  .articles-admin-hero h1,
  .articles-admin-hero p,
  .articles-admin-hero small,
  .articles-admin-panel h2,
  .articles-admin-panel h3,
  .articles-admin-panel p {
    margin: 0;
  }

  .articles-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .articles-admin-hero h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1.05;
  }

  .articles-admin-hero small {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .articles-admin-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .articles-admin-button {
    display: inline-block;
    width: fit-content;
    padding: 12px 16px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .articles-admin-button.secondary {
    border: 1px solid #cfd7e1;
    background: #ffffff;
    color: #10151b;
  }

  .articles-admin-button.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .articles-admin-grid {
    display: grid;
    grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
    gap: 18px;
    margin-top: 18px;
  }

  .articles-admin-panel {
    overflow: hidden;
  }

  .articles-admin-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .articles-admin-panel h2 {
    font-size: 22px;
    text-transform: uppercase;
  }

  .articles-admin-panel p {
    margin-top: 6px;
    color: #607086;
    font-size: 14px;
  }

  .articles-admin-list {
    display: grid;
    gap: 10px;
    padding: 16px;
  }

  .articles-admin-list-item {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #e3e9f0;
    border-radius: 6px;
    color: #10151b;
    text-decoration: none;
  }

  .articles-admin-list-item[aria-current="page"] {
    border-color: #e5252a;
    box-shadow: inset 4px 0 0 #e5252a;
  }

  .articles-admin-list-item strong {
    font-size: 14px;
  }

  .articles-admin-list-item small,
  .articles-admin-muted {
    color: #607086;
    font-size: 12px;
    font-weight: 800;
  }

  .articles-admin-form {
    display: grid;
    gap: 16px;
    padding: 20px;
  }

  .articles-admin-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .articles-admin-field {
    display: grid;
    gap: 6px;
  }

  .articles-admin-field.wide {
    grid-column: 1 / -1;
  }

  .articles-admin-field label {
    color: #3b4654;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .articles-admin-field input,
  .articles-admin-field select,
  .articles-admin-field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cfd7e1;
    border-radius: 6px;
    padding: 10px 11px;
    color: #10151b;
    font: inherit;
  }

  .articles-admin-field textarea {
    min-height: 320px;
    resize: vertical;
    line-height: 1.5;
  }

  .articles-admin-message {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid #b8dfc2;
    border-radius: 6px;
    background: #effaf1;
    color: #174d25;
    font-size: 13px;
    font-weight: 900;
  }

  .articles-admin-message.warning {
    border-color: #f1c0c0;
    background: #fff2f2;
    color: #8a1d1d;
  }

  @media (max-width: 980px) {
    .articles-admin-grid,
    .articles-admin-fields {
      grid-template-columns: 1fr;
    }
  }
`;

function oneParam(query: Record<string, string | string[] | undefined>, key: string) {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function articleTitle(article: EditorialArticle) {
  return article.title?.trim() || article.slug;
}

function seasonLabel(season?: Pick<SeasonRow, "id" | "label"> | null) {
  return season?.label?.trim() || season?.id || "";
}

function uniqueSeasonOptions(seasons: SeasonRow[]) {
  const optionsByLabel = new Map<string, SeasonOption>();

  for (const season of seasons) {
    const label = seasonLabel(season);
    if (!label || optionsByLabel.has(label)) continue;
    optionsByLabel.set(label, {
      label,
      representative_id: season.id
    });
  }

  return Array.from(optionsByLabel.values()).sort((first, second) => second.label.localeCompare(first.label));
}

function feedbackMessage(created?: string, error?: string) {
  if (created === "save_article") {
    return { type: "success" as const, text: "Artigo guardado." };
  }

  if (error) {
    return { type: "warning" as const, text: `Nao foi possivel guardar: ${error}` };
  }

  return null;
}

async function readArticles() {
  return fetchSupabaseAdminTable<EditorialArticle>(
    "editorial_articles?select=id,slug,status,scope,season_id,matchday_id,competition_id,title,subtitle,label,author,image_url,image_caption,body,published_at,created_at,updated_at&order=updated_at.desc&limit=200"
  ).catch(() => []);
}

async function readCompetitions() {
  return fetchSupabaseAdminTable<CompetitionRow>(
    "competitions?select=id,name,slug&order=name.asc&limit=200"
  ).catch(() => []);
}

async function readSeasons() {
  return fetchSupabaseAdminTable<SeasonRow>(
    "seasons?select=id,label,competition_id&order=label.desc&limit=500"
  ).catch(() => []);
}

async function readMatchdays() {
  return fetchSupabaseAdminTable<MatchdayRow>(
    "matchdays?select=id,number,season_id&order=number.asc&limit=1000"
  ).catch(() => []);
}

async function readMatchdayOptions(competitions: CompetitionRow[], seasons: SeasonRow[]) {
  const matchdays = await readMatchdays();
  const competitionsById = new Map(competitions.map((competition) => [competition.id, competition]));
  const seasonsById = new Map(seasons.map((season) => [season.id, season]));

  return matchdays
    .map((matchday): MatchdayOption => {
      const season = matchday.season_id ? seasonsById.get(matchday.season_id) : null;
      const competition = season?.competition_id ? competitionsById.get(season.competition_id) : null;
      const competitionName = competition?.name?.trim() || "Competicao";
      const seasonLabel = season?.label?.trim() || "Epoca";
      const number = matchday.number ? `J${String(matchday.number).padStart(2, "0")}` : "Jornada";

      return {
        id: matchday.id,
        season_id: matchday.season_id,
        competition_id: season?.competition_id ?? null,
        label: `${competitionName} / ${seasonLabel} / ${number}`
      };
    })
    .sort((first, second) => first.label.localeCompare(second.label));
}

function ArticleForm({
  article,
  competitions,
  seasons,
  matchdays
}: {
  article: EditorialArticle | null;
  competitions: CompetitionRow[];
  seasons: SeasonRow[];
  matchdays: MatchdayOption[];
}) {
  const seasonsById = new Map(seasons.map((season) => [season.id, season]));
  const selectedSeasonLabel = article?.season_id ? seasonLabel(seasonsById.get(article.season_id)) : "";
  const seasonOptions = uniqueSeasonOptions(seasons);
  const returnTo = article
    ? `/admin/editorial/artigos?artigo=${encodeURIComponent(article.id)}`
    : "/admin/editorial/artigos";

  return (
    <form action="/api/admin/editorial/artigos" className="articles-admin-form" data-article-form method="post">
      <input type="hidden" name="action_type" value="save_article" />
      <input type="hidden" name="article_id" value={article?.id ?? ""} />
      <input type="hidden" name="return_to" value={returnTo} />
      <div className="articles-admin-fields">
        <div className="articles-admin-field">
          <label htmlFor="article-status">Estado</label>
          <select id="article-status" name="status" defaultValue={article?.status ?? "draft"}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-scope">Scope</label>
          <select id="article-scope" name="scope" defaultValue={article?.scope ?? "general"}>
            <option value="general">Geral</option>
            <option value="home">Home</option>
            <option value="matchday">Jornada</option>
            <option value="competition">Competicao</option>
          </select>
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-slug">Slug</label>
          <input id="article-slug" name="slug" defaultValue={article?.slug ?? ""} placeholder="a-culpa-e-do-var" required />
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-season">Época</label>
          <input id="article-season-id" name="season_id" type="hidden" defaultValue={article?.season_id ?? ""} />
          <select id="article-season" name="season_label" defaultValue={selectedSeasonLabel} required>
            <option value="">Escolher época</option>
            {seasonOptions.map((season) => (
              <option data-representative-season-id={season.representative_id} key={season.label} value={season.label}>
                {season.label}
              </option>
            ))}
          </select>
          <select aria-hidden="true" data-season-registry hidden tabIndex={-1}>
            {seasons.map((season) => (
              <option
                data-competition-id={season.competition_id ?? ""}
                data-season-id={season.id}
                data-season-label={seasonLabel(season)}
                key={season.id}
                value={season.id}
              />
            ))}
          </select>
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-competition">Competicao opcional</label>
          <select id="article-competition" name="competition_id" defaultValue={article?.competition_id ?? ""}>
            <option value="">Sem competicao</option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name || competition.slug || competition.id}
              </option>
            ))}
          </select>
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-matchday">Jornada opcional</label>
          <select id="article-matchday" name="matchday_id" defaultValue={article?.matchday_id ?? ""}>
            <option value="">Sem jornada</option>
            {matchdays.map((matchday) => (
              <option
                data-competition-id={matchday.competition_id ?? ""}
                data-season-id={matchday.season_id ?? ""}
                data-season-label={seasonLabel(matchday.season_id ? seasonsById.get(matchday.season_id) : null)}
                key={matchday.id}
                value={matchday.id}
              >
                {matchday.label}
              </option>
            ))}
          </select>
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-label">Etiqueta</label>
          <input id="article-label" name="label" defaultValue={article?.label ?? ""} placeholder="OPINIAO" />
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-author">Autor</label>
          <input id="article-author" name="author" defaultValue={article?.author ?? ""} placeholder="Jornada.pt" />
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-title">Titulo</label>
          <input id="article-title" name="title" defaultValue={article?.title ?? ""} />
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-subtitle">Subtitulo</label>
          <input id="article-subtitle" name="subtitle" defaultValue={article?.subtitle ?? ""} />
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-image-url">Imagem URL</label>
          <input id="article-image-url" name="image_url" defaultValue={article?.image_url ?? ""} placeholder="https://exemplo.com/imagem.jpg" />
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-image-caption">Legenda da imagem</label>
          <input id="article-image-caption" name="image_caption" defaultValue={article?.image_caption ?? ""} placeholder="Legenda discreta da imagem principal" />
        </div>
        <div className="articles-admin-field">
          <label htmlFor="article-published-at">Data/hora de publicacao</label>
          <input id="article-published-at" name="published_at" type="datetime-local" defaultValue={formatDateTimeLocal(article?.published_at ?? null)} />
        </div>
        <div className="articles-admin-field wide">
          <label htmlFor="article-body">Corpo completo</label>
          <textarea id="article-body" name="body" defaultValue={article?.body ?? ""} placeholder="Texto completo do artigo..." />
        </div>
      </div>
      <button className="articles-admin-button" type="submit">Guardar artigo</button>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var form = document.querySelector('[data-article-form]');
              if (!form) return;
              var seasonIdInput = form.querySelector('#article-season-id');
              var seasonSelect = form.querySelector('#article-season');
              var competitionSelect = form.querySelector('#article-competition');
              var matchdaySelect = form.querySelector('#article-matchday');
              var seasonRegistry = Array.prototype.slice.call(form.querySelectorAll('[data-season-registry] option')).map(function (option) {
                return {
                  id: option.getAttribute('data-season-id') || '',
                  label: option.getAttribute('data-season-label') || '',
                  competitionId: option.getAttribute('data-competition-id') || ''
                };
              });
              if (!seasonIdInput || !seasonSelect || !competitionSelect || !matchdaySelect) return;

              function seasonLabelForId(seasonId) {
                var entry = seasonRegistry.find(function (season) {
                  return season.id === seasonId;
                });
                return entry ? entry.label : '';
              }

              function seasonIdForSelection() {
                var label = seasonSelect.value;
                var competitionId = competitionSelect.value;
                if (!label) return '';
                var exact = competitionId
                  ? seasonRegistry.find(function (season) {
                      return season.label === label && season.competitionId === competitionId;
                    })
                  : null;
                var fallback = seasonRegistry.find(function (season) {
                  return season.label === label;
                });

                return (exact || fallback || {}).id || '';
              }

              function syncSeasonIdFromSelection() {
                seasonIdInput.value = seasonIdForSelection();
                syncMatchdayOptions();
              }

              function syncMatchdayOptions() {
                var selectedSeasonLabel = seasonSelect.value;
                var competitionId = competitionSelect.value;
                var selectedOption = matchdaySelect.selectedOptions && matchdaySelect.selectedOptions[0];
                var selectedStillVisible = true;

                Array.prototype.forEach.call(matchdaySelect.options, function (option) {
                  if (!option.value) {
                    option.hidden = false;
                    return;
                  }
                  var optionSeasonLabel = option.getAttribute('data-season-label') || '';
                  var optionCompetitionId = option.getAttribute('data-competition-id') || '';
                  var visible = (!selectedSeasonLabel || optionSeasonLabel === selectedSeasonLabel) && (!competitionId || optionCompetitionId === competitionId);
                  option.hidden = !visible;
                  if (selectedOption === option && !visible) selectedStillVisible = false;
                });

                if (!selectedStillVisible) matchdaySelect.value = '';
              }

              function syncContextFromMatchday() {
                var option = matchdaySelect.selectedOptions && matchdaySelect.selectedOptions[0];
                if (!option || !option.value) {
                  syncMatchdayOptions();
                  return;
                }
                var seasonId = option.getAttribute('data-season-id') || '';
                var selectedSeasonLabel = option.getAttribute('data-season-label') || '';
                var competitionId = option.getAttribute('data-competition-id') || '';
                if (selectedSeasonLabel) seasonSelect.value = selectedSeasonLabel;
                if (seasonId) seasonIdInput.value = seasonId;
                if (competitionId) competitionSelect.value = competitionId;
                syncMatchdayOptions();
              }

              if (seasonIdInput.value && !seasonSelect.value) {
                seasonSelect.value = seasonLabelForId(seasonIdInput.value);
              }

              seasonSelect.addEventListener('change', syncSeasonIdFromSelection);
              competitionSelect.addEventListener('change', syncSeasonIdFromSelection);
              matchdaySelect.addEventListener('change', syncContextFromMatchday);
              form.addEventListener('submit', function () {
                if (!seasonIdInput.value) syncSeasonIdFromSelection();
              });
              syncContextFromMatchday();
              if (!seasonIdInput.value) syncSeasonIdFromSelection();
              syncMatchdayOptions();
            })();
          `
        }}
      />
    </form>
  );
}

export default async function ArticlesAdminPage({ searchParams }: ArticlesAdminPageProps) {
  const query = searchParams ? await searchParams : {};
  const selectedArticleId = oneParam(query, "artigo");
  const selectedMatchdayId = oneParam(query, "jornada");
  const [articles, competitions, seasons] = await Promise.all([readArticles(), readCompetitions(), readSeasons()]);
  const matchdays = await readMatchdayOptions(competitions, seasons);
  const selectedArticle = selectedArticleId ? articles.find((article) => article.id === selectedArticleId) ?? null : null;
  const fallbackMatchdayId = selectedMatchdayId || matchdays[0]?.id || null;
  const matchdayEditorialHref = fallbackMatchdayId ? `/admin/editorial/jornada/${encodeURIComponent(fallbackMatchdayId)}` : null;
  const message = feedbackMessage(oneParam(query, "created"), oneParam(query, "error"));

  return (
    <main className="articles-admin-shell">
      <style>{styles}</style>
      <section className="articles-admin-hero">
        <div>
          <p>Editorial global</p>
          <h1>Artigos e noticias</h1>
          <small>Cria e edita artigos completos em editorial_articles.</small>
          {message ? (
            <div className={`articles-admin-message ${message.type === "warning" ? "warning" : ""}`}>{message.text}</div>
          ) : null}
        </div>
        <div className="articles-admin-actions">
          <a className="articles-admin-button secondary" href="/admin">Voltar ao backoffice</a>
          <a className="articles-admin-button secondary" href="/admin/gestor">CENTRO DE GESTÃO</a>
          <a className="articles-admin-button secondary" href="/admin/editorial/home">Home editorial</a>
          {matchdayEditorialHref ? (
            <a className="articles-admin-button secondary" href={matchdayEditorialHref}>EDITORIAL DA JORNADA</a>
          ) : (
            <span aria-disabled="true" className="articles-admin-button secondary disabled" title="Sem jornada disponivel">
              SEM JORNADA DISPONIVEL
            </span>
          )}
          <a className="articles-admin-button" href="/admin/editorial/artigos">Novo artigo</a>
        </div>
      </section>

      <div className="articles-admin-grid">
        <section className="articles-admin-panel">
          <header>
            <h2>Artigos existentes</h2>
            <p>{articles.length} artigo(s) encontrados.</p>
          </header>
          <div className="articles-admin-list">
            {articles.length > 0 ? (
              articles.map((article) => (
                <a
                  aria-current={selectedArticle?.id === article.id ? "page" : undefined}
                  className="articles-admin-list-item"
                  href={`/admin/editorial/artigos?artigo=${encodeURIComponent(article.id)}`}
                  key={article.id}
                >
                  <strong>{articleTitle(article)}</strong>
                  <small>{article.status.toUpperCase()} / {article.scope.toUpperCase()}</small>
                  <small>/{article.slug}</small>
                </a>
              ))
            ) : (
              <p className="articles-admin-muted">Ainda nao ha artigos criados.</p>
            )}
          </div>
        </section>

        <section className="articles-admin-panel">
          <header>
            <h2>{selectedArticle ? "Editar artigo" : "Criar artigo"}</h2>
            <p>A epoca e obrigatoria. Competicao e jornada continuam opcionais, mas devem ser coerentes quando escolhidas.</p>
          </header>
          <ArticleForm article={selectedArticle} competitions={competitions} seasons={seasons} matchdays={matchdays} />
        </section>
      </div>
    </main>
  );
}
