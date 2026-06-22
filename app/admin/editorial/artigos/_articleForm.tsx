export type EditorialArticle = {
  id: string;
  slug: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  label: string | null;
  author: string | null;
  status: string | null;
  scope: string | null;
  image_url: string | null;
  image_caption: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
};

export type CompetitionOption = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active?: boolean | null;
};

export type SeasonOption = {
  id: string;
  competition_id: string | null;
  label: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  is_current?: boolean | null;
};

export type MatchdayOption = {
  id: string;
  season_id: string | null;
  number: number | null;
  label: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  status?: string | null;
};

type ArticleEditorFormProps = {
  mode: "create" | "edit";
  article?: EditorialArticle | null;
  competitions: CompetitionOption[];
  seasons: SeasonOption[];
  matchdays: MatchdayOption[];
  message?: string | null;
  returnTo?: string;
};

export function publicArticleHref(slug: string | null | undefined) {
  const cleanSlug = (slug ?? "").trim();
  if (!cleanSlug) {
    return null;
  }

  return `/noticias/${encodeURIComponent(cleanSlug)}`;
}

export function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleanValue = value?.trim();
    if (cleanValue) {
      return cleanValue;
    }
  }

  return "";
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (match) {
    return match[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function seasonLabel(season: SeasonOption) {
  return firstText(season.label, season.id);
}

function matchdayLabel(matchday: MatchdayOption) {
  const baseLabel = firstText(matchday.label, matchday.number ? `J${String(matchday.number).padStart(2, "0")}` : null, matchday.id);
  return matchday.number ? `${baseLabel} · J${String(matchday.number).padStart(2, "0")}` : baseLabel;
}

const articleFormEnhancer = `
(function () {
  function normalizeSlug(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function selectedOption(select) {
    return select.options[select.selectedIndex] || null;
  }

  function init(form) {
    var title = form.querySelector("[data-article-title]");
    var slug = form.querySelector("[data-article-slug]");
    var scope = form.querySelector("[data-article-scope]");
    var competition = form.querySelector("[data-article-competition]");
    var season = form.querySelector("[data-article-season]");
    var matchday = form.querySelector("[data-article-matchday]");

    if (title && slug) {
      slug.addEventListener("blur", function () {
        slug.value = normalizeSlug(slug.value);
      });
      title.addEventListener("blur", function () {
        if (!slug.value.trim()) {
          slug.value = normalizeSlug(title.value);
        }
      });
    }

    function filterOptions() {
      var competitionId = competition ? competition.value : "";
      var seasonId = season ? season.value : "";

      if (!competitionId) {
        if (season) {
          season.value = "";
          seasonId = "";
        }
        if (matchday) {
          matchday.value = "";
        }
      }

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

      if (scope) {
        if (matchday && matchday.value) {
          scope.value = "matchday";
        } else {
          scope.value = "general";
        }
      }
    }

    if (competition) {
      competition.addEventListener("change", filterOptions);
    }
    if (season) {
      season.addEventListener("change", function () {
        if (!season.value && matchday) {
          matchday.value = "";
        }
        filterOptions();
      });
    }
    if (matchday) {
      matchday.addEventListener("change", filterOptions);
    }

    filterOptions();
  }

  document.querySelectorAll("[data-article-admin-form]").forEach(init);
})();
`;

export function ArticleEditorForm({
  mode,
  article,
  competitions,
  seasons,
  matchdays,
  message,
  returnTo,
}: ArticleEditorFormProps) {
  const publicHref = publicArticleHref(article?.slug);
  const isEdit = mode === "edit";
  const currentStatus = firstText(article?.status) || "draft";
  const canOpenPublicArticle = Boolean(publicHref && currentStatus === "published");
  const currentScope = article?.matchday_id
    ? "matchday"
    : "general";
  const competitionBySeasonId = new Map(seasons.map((season) => [season.id, season.competition_id ?? ""]));

  return (
    <form className="editorial-article-form" action="/api/admin/editorial/artigos" method="post" data-article-admin-form>
      <input type="hidden" name="action_type" value={isEdit ? "update_article" : "create_article"} />
      {isEdit ? <input type="hidden" name="article_id" value={article?.id ?? ""} /> : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      {message ? <p className="article-admin-alert">{message}</p> : null}

      <section className="article-admin-section">
        <div className="article-admin-grid">
          <label className="article-admin-full">
            <span>Título</span>
            <input name="title" data-article-title defaultValue={article?.title ?? ""} required />
          </label>

          <label>
            <span>Slug</span>
            <input name="slug" data-article-slug defaultValue={article?.slug ?? ""} placeholder="gerado-a-partir-do-titulo" />
          </label>

          <label>
            <span>Estado</span>
            <select name="status" defaultValue={currentStatus}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>

          <label>
            <span>Âmbito</span>
            <input name="scope" data-article-scope defaultValue={currentScope} readOnly />
          </label>

          <label>
            <span>Etiqueta</span>
            <input name="label" defaultValue={article?.label ?? ""} placeholder="OPINIÃO, ANÁLISE..." />
          </label>

          <label>
            <span>Autor</span>
            <input name="author" defaultValue={article?.author ?? ""} placeholder="Nome do autor" />
          </label>

          <label>
            <span>Publicado em</span>
            <input name="published_at" type="datetime-local" defaultValue={formatDateTimeLocal(article?.published_at)} />
          </label>

          <label className="article-admin-full">
            <span>Subtítulo</span>
            <textarea name="subtitle" rows={3} defaultValue={article?.subtitle ?? ""} />
          </label>

          <label className="article-admin-full">
            <span>Corpo</span>
            <textarea name="body" rows={12} defaultValue={article?.body ?? ""} />
          </label>
        </div>
      </section>

      <section className="article-admin-section article-admin-compact-section">
        <p className="article-admin-section-title">Imagem</p>
        <div className="article-admin-grid">
          <label className="article-admin-full">
            <span>Imagem principal</span>
            <input name="image_url" defaultValue={article?.image_url ?? ""} placeholder="https://..." />
          </label>

          <label className="article-admin-full">
            <span>Legenda da imagem</span>
            <input name="image_caption" defaultValue={article?.image_caption ?? ""} />
          </label>
        </div>
      </section>

      <section className="article-admin-section article-admin-compact-section">
        <p className="article-admin-section-title">Contexto</p>
        <div className="article-admin-grid">
          <label>
            <span>Competição</span>
            <select name="competition_id" data-article-competition defaultValue={article?.competition_id ?? ""}>
              <option value="">Sem competição</option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {firstText(competition.name, competition.slug, competition.id)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Época</span>
            <select name="season_id" data-article-season defaultValue={article?.season_id ?? ""}>
              <option value="">Sem época</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id} data-competition-id={season.competition_id ?? ""}>
                  {seasonLabel(season)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Jornada</span>
            <select name="matchday_id" data-article-matchday defaultValue={article?.matchday_id ?? ""}>
              <option value="">Sem jornada</option>
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
      </section>

      <div className="article-admin-form-actions">
        <a className="article-admin-secondary" href="/admin/editorial/artigos">
          Voltar à lista
        </a>
        {canOpenPublicArticle && publicHref ? (
          <a className="article-admin-secondary" href={publicHref} target="_blank" rel="noreferrer">
            Abrir público
          </a>
        ) : publicHref ? (
          <span className="article-admin-secondary article-admin-disabled" aria-disabled="true">
            Só disponível quando publicado
          </span>
        ) : null}
        <button type="submit">{isEdit ? "Guardar alterações" : "Criar artigo"}</button>
      </div>

      <script dangerouslySetInnerHTML={{ __html: articleFormEnhancer }} />
    </form>
  );
}

export const editorialArticleAdminStyles = `
  .editorial-admin-shell {
    min-height: 100vh;
    background: #f4f6f8;
    color: #111827;
    padding: 32px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .editorial-admin-container {
    max-width: 1360px;
    margin: 0 auto;
  }

  .editorial-admin-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .editorial-admin-hero {
    padding: 26px;
    border-radius: 10px;
    background: #10151b;
    color: #fff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .editorial-admin-header h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.08;
  }

  .editorial-admin-header p {
    max-width: 720px;
    margin: 8px 0 0;
    color: #4b5563;
    line-height: 1.55;
  }

  .editorial-admin-hero p {
    color: #cbd5e1;
  }

  .editorial-admin-actions,
  .article-admin-form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
  }

  .article-admin-form-actions {
    padding: 18px 22px;
    border-top: 1px solid #e5e7eb;
  }

  .editorial-admin-actions a,
  .editorial-admin-actions button,
  .article-admin-form-actions a,
  .article-admin-form-actions span.article-admin-secondary,
  .article-admin-form-actions button,
  .article-card-actions a {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    padding: 0 14px;
    background: #fff;
    color: #111827;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  .article-admin-form-actions span.article-admin-secondary {
    cursor: default;
  }

  .editorial-admin-actions .primary,
  .article-admin-form-actions button {
    border-color: #111827;
    background: #111827;
    color: #fff;
  }

  .editorial-admin-hero .editorial-admin-actions a {
    border-color: rgba(255, 255, 255, 0.28);
    background: transparent;
    color: #fff;
  }

  .editorial-admin-hero .editorial-admin-actions .primary {
    border-color: #fff;
    background: #fff;
    color: #10151b;
  }

  .article-admin-secondary {
    background: #fff;
  }

  .article-admin-disabled {
    border-color: #e5e7eb !important;
    background: #f3f4f6 !important;
    color: #6b7280 !important;
  }

  .article-admin-alert {
    margin: 0 0 18px;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    padding: 12px 14px;
    color: #1e3a8a;
    font-size: 13px;
    font-weight: 700;
  }

  .article-admin-workspace {
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }

  .article-admin-sidebar,
  .article-admin-editor {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  }

  .article-admin-sidebar {
    position: sticky;
    top: 18px;
    max-height: calc(100vh - 36px);
    overflow: auto;
  }

  .article-admin-sidebar-header,
  .article-admin-editor-header {
    padding: 18px;
    border-bottom: 1px solid #e5e7eb;
  }

  .article-admin-sidebar-header h2,
  .article-admin-editor-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .article-admin-sidebar-header p,
  .article-admin-editor-header p {
    margin: 6px 0 0;
    color: #6b7280;
    line-height: 1.45;
  }

  .article-admin-sidebar-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .article-admin-sidebar-item {
    display: grid;
    gap: 5px;
    padding: 13px 16px;
    border-bottom: 1px solid #eef2f7;
    color: inherit;
    text-decoration: none;
  }

  .article-admin-sidebar-item:last-child {
    border-bottom: 0;
  }

  .article-admin-sidebar-item:hover,
  .article-admin-sidebar-item.is-selected {
    background: #f9fafb;
  }

  .article-admin-sidebar-item.is-selected {
    box-shadow: inset 4px 0 0 #b91c1c;
  }

  .article-admin-sidebar-item strong {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    color: #111827;
    font-size: 14px;
    line-height: 1.25;
  }

  .article-admin-sidebar-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .article-admin-section,
  .editorial-admin-panel,
  .article-card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  }

  .editorial-admin-panel {
    padding: 20px;
  }

  .article-admin-section {
    display: block;
    padding: 18px 22px;
    margin: 0;
    border-width: 0 0 1px;
    border-radius: 0;
    box-shadow: none;
  }

  .article-admin-section:last-of-type {
    border-bottom: 0;
  }

  .article-admin-section h2 {
    margin: 4px 0 8px;
    font-size: 20px;
  }

  .article-admin-section p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .article-admin-section-title {
    margin: 0 0 14px !important;
    color: #b91c1c !important;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .article-admin-kicker {
    margin: 0;
    color: #b91c1c !important;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .article-admin-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .article-admin-full {
    grid-column: 1 / -1;
  }

  .article-admin-grid label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .article-admin-grid label > span {
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .article-admin-grid input,
  .article-admin-grid select,
  .article-admin-grid textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 11px;
    background: #fff;
    color: #111827;
    font: inherit;
    font-weight: 500;
  }

  .article-admin-grid textarea {
    resize: vertical;
  }

  .article-list {
    display: grid;
    gap: 14px;
  }

  .article-card {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 16px;
    padding: 14px;
  }

  .article-card img,
  .article-card-image-placeholder {
    width: 132px;
    height: 88px;
    border-radius: 8px;
    object-fit: cover;
    background: #e5e7eb;
  }

  .article-card-image-placeholder {
    display: grid;
    place-items: center;
    color: #6b7280;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .article-card-body {
    min-width: 0;
  }

  .article-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 700;
  }

  .article-card h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.18;
  }

  .article-card h2 a {
    color: inherit;
    text-decoration: none;
  }

  .article-card h2 a:hover {
    text-decoration: underline;
  }

  .article-card p {
    margin: 8px 0 0;
    color: #4b5563;
    line-height: 1.45;
  }

  .article-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .article-card-context {
    display: grid;
    gap: 3px;
    margin-top: 10px;
    color: #6b7280;
    font-size: 12px;
  }

  .article-admin-delete-form {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    padding: 18px 22px;
    border-top: 1px solid #fee2e2;
    background: #fff7f7;
  }

  .article-admin-delete-form strong {
    display: block;
    margin-bottom: 4px;
    color: #991b1b;
  }

  .article-admin-delete-form p {
    margin: 0;
    color: #7f1d1d;
    line-height: 1.45;
  }

  .article-admin-delete-confirm {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
    color: #7f1d1d;
    font-size: 13px;
    font-weight: 800;
  }

  .article-admin-delete-form button {
    flex: 0 0 auto;
    min-height: 38px;
    border: 1px solid #991b1b;
    border-radius: 8px;
    padding: 0 14px;
    background: #991b1b;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  @media (max-width: 820px) {
    .editorial-admin-shell {
      padding: 20px;
    }

    .editorial-admin-header,
    .article-admin-workspace,
    .article-admin-section,
    .article-admin-grid,
    .article-card {
      grid-template-columns: 1fr;
    }

    .article-admin-sidebar {
      position: static;
      max-height: none;
    }

    .editorial-admin-header {
      display: grid;
    }

    .editorial-admin-actions,
    .article-admin-form-actions {
      justify-content: flex-start;
    }

    .article-admin-delete-form {
      display: grid;
    }
  }
`;
