import {
  fetchSupabaseAdminTable,
  type SupabaseCompetition,
  type SupabaseCountry,
  type SupabaseMatchday,
  type SupabaseMatchdayEditorial,
  type SupabaseMatchdayHighlight,
  type SupabaseMatchdayRoundupItem,
  type SupabaseSeason
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type EditorialPageProps = {
  params: Promise<{
    matchdayId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MatchdayContext = {
  matchday: SupabaseMatchday;
  season: SupabaseSeason;
  competition: SupabaseCompetition;
  country: SupabaseCountry | null;
};

const ROUNDUP_EDITOR_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);

const editorialPageStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .editorial-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .editorial-admin-hero,
  .editorial-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .editorial-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
  }

  .editorial-admin-hero h1,
  .editorial-admin-hero p,
  .editorial-admin-hero small {
    margin: 0;
  }

  .editorial-admin-hero h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1.05;
  }

  .editorial-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-admin-hero small {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .editorial-admin-button {
    display: inline-block;
    width: fit-content;
    padding: 12px 16px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .editorial-admin-button.secondary {
    border: 1px solid #dce3eb;
    background: #ffffff;
    color: #10151b;
  }

  .editorial-admin-hero .editorial-admin-button.secondary {
    border-color: rgba(255, 255, 255, 0.28);
    background: transparent;
    color: #ffffff;
  }

  .editorial-admin-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .editorial-admin-composition {
    margin-top: 18px;
  }

  .editorial-admin-composition-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .editorial-admin-composition-card {
    display: grid;
    gap: 14px;
    align-content: start;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .editorial-admin-composition-card h3 {
    margin: 0;
    font-size: 17px;
  }

  .editorial-admin-composition-card > p {
    margin: -6px 0 0;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .editorial-admin-panel {
    padding: 20px;
  }

  .editorial-admin-panel h2,
  .editorial-admin-panel h3,
  .editorial-admin-panel h4,
  .editorial-admin-panel p {
    margin: 0;
  }

  .editorial-admin-panel > header {
    margin-bottom: 16px;
  }

  .editorial-admin-panel > header p,
  .editorial-admin-muted {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .editorial-admin-form,
  .editorial-admin-stack {
    display: grid;
    gap: 14px;
  }

  .editorial-admin-compact-stack {
    display: grid;
    gap: 10px;
  }

  .editorial-admin-field {
    display: grid;
    gap: 6px;
  }

  .editorial-admin-field label,
  .editorial-admin-fieldset legend {
    color: #425061;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .editorial-admin-field input,
  .editorial-admin-field textarea,
  .editorial-admin-field select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #c8d2dd;
    border-radius: 6px;
    padding: 11px 12px;
    background: #ffffff;
    color: #10151b;
    font: inherit;
  }

  .editorial-admin-compact-stack .editorial-admin-field {
    gap: 4px;
  }

  .editorial-admin-compact-stack .editorial-admin-field input,
  .editorial-admin-compact-stack .editorial-admin-field select {
    padding: 9px 10px;
  }

  .editorial-admin-field textarea {
    min-height: 110px;
    resize: vertical;
  }

  .editorial-admin-preview {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .editorial-admin-preview img {
    display: block;
    width: 100%;
    max-height: 220px;
    object-fit: cover;
  }

  .editorial-admin-fieldset {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
  }

  .editorial-admin-compact-card {
    gap: 10px;
    padding: 12px;
  }

  .editorial-admin-compact-card legend {
    padding: 0 4px;
  }

  .editorial-admin-compact-card .editorial-admin-preview img {
    max-height: 120px;
  }

  .editorial-admin-upload-inline {
    display: grid;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #dce3eb;
  }

  .editorial-admin-upload-inline .editorial-admin-button {
    padding: 10px 12px;
  }

  .editorial-admin-hidden-form {
    display: none;
  }

  .editorial-admin-highlight-1 {
    background: #f9fafb;
  }

  .editorial-admin-highlight-2 {
    background: #f4f6f8;
  }

  .editorial-admin-highlight-3 {
    background: #eef2f6;
  }

  .editorial-admin-message {
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid #b7e1c0;
    border-radius: 8px;
    background: #effaf1;
    color: #1f6d31;
    font-size: 14px;
    font-weight: 800;
  }

  .editorial-admin-message.warning {
    border-color: #ffd0d0;
    background: #fff3f3;
    color: #9d1c1f;
  }

  #manchete,
  #composicao,
  #destaques,
  #resumo-jornada,
  #bloco-complementar,
  #ultimas-noticias {
    scroll-margin-top: 18px;
  }

  .editorial-admin-note-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding-left: 18px;
    color: #5d6875;
    line-height: 1.45;
  }

  .editorial-complement-mode-section[hidden],
  .editorial-below-mode-section[hidden] {
    display: none;
  }

  .editorial-admin-news-placeholder {
    margin-top: 18px;
    padding: 14px 16px;
    border: 1px dashed #dce3eb;
    border-radius: 8px;
    background: #ffffff;
  }

  @media (max-width: 980px) {
    .editorial-admin-shell {
      padding: 16px;
    }

    .editorial-admin-hero,
    .editorial-admin-grid,
    .editorial-admin-composition-grid {
      grid-template-columns: 1fr;
    }

    .editorial-admin-hero {
      display: grid;
    }
  }
`;

function oneParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

async function readFirst<T>(path: string): Promise<T | null> {
  const rows = await fetchSupabaseAdminTable<T>(`${path}&limit=1`);
  return rows[0] ?? null;
}

async function readMatchdayContext(matchdayId: string): Promise<MatchdayContext | null> {
  const matchday = await readFirst<SupabaseMatchday>(
    `matchdays?select=id,season_id,number,label,starts_on,ends_on,status,context_summary&id=eq.${encodeURIComponent(matchdayId)}`
  ).catch(() => null);

  if (!matchday) {
    return null;
  }

  const season = await readFirst<SupabaseSeason>(
    `seasons?select=id,competition_id,label,starts_on,ends_on,is_current&id=eq.${encodeURIComponent(matchday.season_id)}`
  ).catch(() => null);

  if (!season) {
    return null;
  }

  const competition = await readFirst<SupabaseCompetition>(
    `competitions?select=id,name,slug,country_id,country,logo_url,accent_color,is_active&id=eq.${encodeURIComponent(
      season.competition_id
    )}`
  ).catch(() => null);

  if (!competition) {
    return null;
  }

  const country = competition.country_id
    ? await readFirst<SupabaseCountry>(
        `countries?select=id,name,slug,iso2,flag_emoji,is_active&id=eq.${encodeURIComponent(competition.country_id)}`
      ).catch(() => null)
    : null;

  return { matchday, season, competition, country };
}

async function readMatchdayEditorial(matchdayId: string): Promise<SupabaseMatchdayEditorial | null> {
  return readFirst<SupabaseMatchdayEditorial>(
    `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,below_headline_mode,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}`
  ).catch(() => null);
}

async function readMatchdayHighlights(matchdayId: string): Promise<SupabaseMatchdayHighlight[]> {
  return fetchSupabaseAdminTable<SupabaseMatchdayHighlight>(
    `matchday_highlights?select=id,matchday_id,label,title,image_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=3`
  ).catch(() => []);
}

async function readMatchdayRoundupItems(matchdayId: string): Promise<SupabaseMatchdayRoundupItem[]> {
  return fetchSupabaseAdminTable<SupabaseMatchdayRoundupItem>(
    `matchday_roundup_items?select=id,matchday_id,label,title,subtitle,image_url,video_url,duration,type,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=10`
  ).catch(() => []);
}

type FeedbackScope = "manchete" | "composicao" | "destaques" | "resumo-jornada" | "bloco-complementar" | "ultimas-noticias";

function messageFor(created?: string, error?: string, scope?: FeedbackScope) {
  const createdLabels: Record<string, string> = {
    save_matchday_editorial: "Linha editorial da jornada guardada.",
    save_matchday_highlights: "Destaques guardados e definidos como zona ativa abaixo da manchete.",
    save_matchday_roundup_items: "Resumo da Jornada guardado e definido como zona ativa abaixo da manchete.",
    upload_matchday_editorial_image: "Imagem da manchete carregada.",
    upload_matchday_highlight_image: "Imagem do destaque carregada."
  };
  const scopedCreatedLabels: Partial<Record<FeedbackScope, Record<string, string>>> = {
    manchete: {
      save_matchday_editorial: "Manchete guardada.",
      upload_matchday_editorial_image: "Imagem da manchete carregada."
    },
    composicao: {
      save_matchday_editorial: "Composicao guardada."
    },
    destaques: {
      save_matchday_highlights: "Destaques guardados.",
      upload_matchday_highlight_image: "Imagem do destaque carregada."
    },
    "resumo-jornada": {
      save_matchday_roundup_items: "Resumo da Jornada guardado."
    },
    "bloco-complementar": {
      save_matchday_editorial: "Bloco complementar guardado."
    }
  };
  const errorLabels: Record<string, string> = {
    "missing-service": "Liga primeiro a Supabase na Vercel.",
    "missing-fields": "Preenche os campos obrigatorios antes de guardar.",
    "matchday-invalid": "A jornada escolhida ja nao existe.",
    "roundup-item-invalid": "O item escolhido do Resumo da Jornada nao pertence a esta jornada.",
    "editorial-title-required": "Para publicar, indica uma manchete da jornada.",
    "highlight-title-required": "Para publicar um destaque, indica o titulo.",
    "editorial-image-type": "O ficheiro tem de ser uma imagem JPG, PNG ou WebP.",
    "editorial-image-size": "A imagem nao pode ter mais de 5MB.",
    "editorial-image-upload": "Nao foi possivel carregar a imagem. Confirma o bucket de Storage.",
    save: "Nao foi possivel guardar. Confirma se a base de dados esta atualizada."
  };

  if (created && createdLabels[created]) {
    return <div className="editorial-admin-message">{(scope ? scopedCreatedLabels[scope]?.[created] : undefined) ?? createdLabels[created]}</div>;
  }

  if (error) {
    return <div className="editorial-admin-message warning">{errorLabels[error] ?? errorLabels.save}</div>;
  }

  return null;
}

function scopedMessageFor(created: string | undefined, error: string | undefined, currentScope: string | undefined, scope: FeedbackScope) {
  if (currentScope !== scope) {
    return null;
  }

  return messageFor(created, error, scope);
}

function gestorReturnUrl(context: MatchdayContext) {
  const params = new URLSearchParams({
    competicao: context.competition.id,
    epoca: context.season.id,
    jornada: context.matchday.id,
    section: "linha-editorial"
  });

  if (context.country) {
    params.set("pais", context.country.id);
  }

  return `/admin/gestor?${params.toString()}#linha-editorial`;
}

export default async function AdminMatchdayEditorialPage({ params, searchParams }: EditorialPageProps) {
  const { matchdayId } = await params;
  const query = (await searchParams) ?? {};
  const created = oneParam(query, "created");
  const error = oneParam(query, "error");
  const feedbackScope = oneParam(query, "feedback_scope");
  const context = await readMatchdayContext(matchdayId);

  if (!context) {
    return (
      <main className="editorial-admin-shell">
        <style>{editorialPageStyles}</style>
        <section className="editorial-admin-panel" id="manchete">
          <header>
            <h1>Jornada nao encontrada</h1>
            <p className="editorial-admin-muted">A pagina editorial so pode abrir a partir de uma jornada existente.</p>
          </header>
          <a className="editorial-admin-button secondary" href="/admin/gestor">
            Voltar ao gestor
          </a>
        </section>
      </main>
    );
  }

  const { matchday, season, competition, country } = context;
  const editorial = await readMatchdayEditorial(matchday.id);
  const highlights = await readMatchdayHighlights(matchday.id);
  const roundupItems = await readMatchdayRoundupItems(matchday.id);
  const belowHeadlineMode = editorial?.below_headline_mode === "roundup" ? "roundup" : "highlights";
  const complementaryMode = editorial?.complementary_mode ?? "none";
  const returnTo = `/admin/editorial/jornada/${matchday.id}`;
  const scopedReturnTo = (scope: FeedbackScope, anchor = scope) => `${returnTo}?feedback_scope=${scope}#${anchor}`;
  const returnToManchete = scopedReturnTo("manchete");
  const returnToComposicao = scopedReturnTo("composicao");
  const returnToDestaques = scopedReturnTo("destaques");
  const returnToResumo = scopedReturnTo("resumo-jornada");
  const returnToComplementar = scopedReturnTo("bloco-complementar");
  const backToGestor = gestorReturnUrl(context);
  const contextLabel = `${country?.name ?? "Pais"} · ${competition.name} · ${season.label} · ${matchday.label}`;
  const highlightsFormId = "matchday-highlights-form";

  const highlightsEditor = (
    <>
      <form className="editorial-admin-hidden-form" action="/api/admin/gestor" id={highlightsFormId} method="post">
        <input type="hidden" name="action_type" value="save_matchday_highlights" />
        <input type="hidden" name="return_to" value={returnToDestaques} />
        <input type="hidden" name="matchday_id" value={matchday.id} />
      </form>
      <div className="editorial-admin-compact-stack">
        {[1, 2, 3].map((order) => {
          const highlight = highlights.find((item) => item.sort_order === order);
          return (
            <fieldset className={`editorial-admin-fieldset editorial-admin-compact-card editorial-admin-highlight-${order}`} key={order}>
              <legend>Destaque {order}</legend>
              <input form={highlightsFormId} type="hidden" name={`highlight_${order}_id`} value={highlight?.id ?? ""} />
              <input form={highlightsFormId} type="hidden" name={`highlight_${order}_sort_order`} value={order} />
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${order}-label`}>Etiqueta</label>
                <input form={highlightsFormId} id={`highlight-${order}-label`} name={`highlight_${order}_label`} defaultValue={highlight?.label ?? ""} placeholder={order === 1 ? "ANTEVISAO" : order === 2 ? "AMBIENTE" : "CONTEXTO"} />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${order}-title`}>Titulo</label>
                <input
                  form={highlightsFormId}
                  id={`highlight-${order}-title`}
                  name={`highlight_${order}_title`}
                  defaultValue={highlight?.title ?? ""}
                  placeholder={order === 1 ? "Os pontos de atencao antes da bola rolar" : order === 2 ? "A jornada vista pelas bancadas e pelos protagonistas" : "O que pode mudar na tabela depois dos resultados"}
                />
              </div>
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${order}-image-url`}>Imagem URL</label>
                <input form={highlightsFormId} id={`highlight-${order}-image-url`} name={`highlight_${order}_image_url`} defaultValue={highlight?.image_url ?? ""} placeholder="https://exemplo.com/imagem.jpg" />
              </div>
              {highlight?.image_url ? (
                <div className="editorial-admin-preview">
                  <img alt="" src={highlight.image_url} />
                </div>
              ) : null}
              <div className="editorial-admin-field">
                <label htmlFor={`highlight-${order}-status`}>Estado</label>
                <select form={highlightsFormId} id={`highlight-${order}-status`} name={`highlight_${order}_status`} defaultValue={highlight?.status ?? "draft"}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <form action="/api/admin/gestor/editorial-image" className="editorial-admin-upload-inline" encType="multipart/form-data" method="post">
                <input type="hidden" name="return_to" value={returnToDestaques} />
                <input type="hidden" name="matchday_id" value={matchday.id} />
                <input type="hidden" name="target" value="highlight" />
                <input type="hidden" name="sort_order" value={order} />
                <div className="editorial-admin-field">
                  <label htmlFor={`highlight-${order}-image-upload`}>Carregar imagem do destaque {order}</label>
                  <input accept="image/jpeg,image/png,image/webp" id={`highlight-${order}-image-upload`} name="image" type="file" />
                </div>
                <button className="editorial-admin-button secondary" type="submit">
                  Carregar imagem
                </button>
              </form>
            </fieldset>
          );
        })}
        <button className="editorial-admin-button" form={highlightsFormId} type="submit">
          Guardar destaques
        </button>
      </div>
    </>
  );

  const roundupEditor = (
    <form className="editorial-admin-form" action="/api/admin/gestor" method="post">
      <input type="hidden" name="action_type" value="save_matchday_roundup_items" />
      <input type="hidden" name="return_to" value={returnToResumo} />
      <input type="hidden" name="matchday_id" value={matchday.id} />
      {ROUNDUP_EDITOR_SORT_ORDERS.map((order) => {
        const item = roundupItems.find((roundupItem) => roundupItem.sort_order === order);
        return (
          <fieldset className={`editorial-admin-fieldset editorial-admin-highlight-${order}`} key={order}>
            <legend>Item {order}</legend>
            <input type="hidden" name={`roundup_${order}_id`} value={item?.id ?? ""} />
            <input type="hidden" name={`roundup_${order}_sort_order`} value={order} />
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-sort-order`}>Ordem</label>
              <input id={`roundup-${order}-sort-order`} readOnly value={order} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-label`}>Etiqueta</label>
              <input id={`roundup-${order}-label`} name={`roundup_${order}_label`} defaultValue={item?.label ?? ""} placeholder={order === 1 ? "VIDEO" : order === 2 ? "GOLOS" : order === 3 ? "NOTICIA" : "RESUMO"} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-title`}>Titulo</label>
              <input
                id={`roundup-${order}-title`}
                name={`roundup_${order}_title`}
                defaultValue={item?.title ?? ""}
                placeholder={order === 1 ? "Girona 0 - 1 Rayo Vallecano" : order === 2 ? "Villarreal 2 - 3 Real Oviedo" : order === 3 ? "Mallorca 0 - 1 FC Barcelona" : "Titulo do item da jornada"}
              />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-subtitle`}>Subtitulo</label>
              <input id={`roundup-${order}-subtitle`} name={`roundup_${order}_subtitle`} defaultValue={item?.subtitle ?? ""} placeholder={order === 1 ? "Resumo completo" : order === 2 ? "Golos e melhores momentos" : order === 3 ? "Noticia de contexto" : "Descricao curta"} />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-image-url`}>Imagem URL</label>
              <input id={`roundup-${order}-image-url`} name={`roundup_${order}_image_url`} defaultValue={item?.image_url ?? ""} placeholder="https://exemplo.com/imagem.jpg" />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-video-url`}>Video URL</label>
              <input id={`roundup-${order}-video-url`} name={`roundup_${order}_video_url`} defaultValue={item?.video_url ?? ""} placeholder="https://exemplo.com/video" />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-duration`}>Duracao</label>
              <input id={`roundup-${order}-duration`} name={`roundup_${order}_duration`} defaultValue={item?.duration ?? ""} placeholder="5:42" />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-type`}>Tipo</label>
              <select id={`roundup-${order}-type`} name={`roundup_${order}_type`} defaultValue={item?.type ?? "resumo"}>
                <option value="video">Video</option>
                <option value="golos">Golos</option>
                <option value="resumo">Resumo</option>
                <option value="noticia">Noticia</option>
              </select>
            </div>
            <div className="editorial-admin-field">
              <label htmlFor={`roundup-${order}-status`}>Estado</label>
              <select id={`roundup-${order}-status`} name={`roundup_${order}_status`} defaultValue={item?.status ?? "draft"}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </fieldset>
        );
      })}
      <button className="editorial-admin-button" type="submit">
        Guardar Resumo da Jornada
      </button>
    </form>
  );

  return (
    <main className="editorial-admin-shell">
      <style>{editorialPageStyles}</style>

      <section className="editorial-admin-hero">
        <div>
          <p>1.ª página da jornada</p>
          <h1>Editar editorial</h1>
          <small>{contextLabel}</small>
        </div>
        <a className="editorial-admin-button secondary" href={backToGestor}>
          Voltar ao gestor
        </a>
      </section>

      {feedbackScope ? null : messageFor(created, error)}

      <div className="editorial-admin-grid">
        <section className="editorial-admin-panel" id="manchete">
          <header>
            <h2>Manchete principal</h2>
            <p>Campos existentes de matchday_editorials ligados a esta jornada.</p>
          </header>
          {scopedMessageFor(created, error, feedbackScope, "manchete")}
          <form className="editorial-admin-form" action="/api/admin/gestor" method="post">
            <input type="hidden" name="action_type" value="save_matchday_editorial" />
            <input type="hidden" name="return_to" value={returnToManchete} />
            <input type="hidden" name="matchday_id" value={matchday.id} />
            <input type="hidden" name="complementary_mode" value={editorial?.complementary_mode ?? "none"} />
            <input type="hidden" name="complementary_roundup_item_id" value={editorial?.complementary_roundup_item_id ?? ""} />
            <input type="hidden" name="complementary_label" value={editorial?.complementary_label ?? ""} />
            <input type="hidden" name="complementary_title" value={editorial?.complementary_title ?? ""} />
            <input type="hidden" name="complementary_text" value={editorial?.complementary_text ?? ""} />
            <input type="hidden" name="complementary_image_url" value={editorial?.complementary_image_url ?? ""} />
            <input type="hidden" name="complementary_link_url" value={editorial?.complementary_link_url ?? ""} />
            <input type="hidden" name="complementary_status" value={editorial?.complementary_status ?? "draft"} />
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-title">Manchete</label>
              <input
                id="matchday-editorial-title"
                name="title"
                defaultValue={editorial?.title ?? ""}
                placeholder="Ex: Girona abre a jornada com autoridade"
              />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-summary">Resumo curto</label>
              <textarea
                id="matchday-editorial-summary"
                name="summary"
                defaultValue={editorial?.summary ?? ""}
                placeholder="Resumo editorial curto da jornada."
              />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-title-color">Cor do titulo</label>
              <input
                id="matchday-editorial-title-color"
                name="title_color"
                defaultValue={editorial?.title_color ?? ""}
                placeholder="#e5252a"
              />
            </div>
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-image-url">Imagem da manchete URL</label>
              <input
                id="matchday-editorial-image-url"
                name="image_url"
                defaultValue={editorial?.image_url ?? ""}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <input type="hidden" name="below_headline_mode" value={belowHeadlineMode} />
            {editorial?.image_url ? (
              <div className="editorial-admin-preview">
                <img alt="" src={editorial.image_url} />
              </div>
            ) : null}
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-status">Estado</label>
              <select id="matchday-editorial-status" name="status" defaultValue={editorial?.status ?? "draft"}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <button className="editorial-admin-button" type="submit">
              Guardar manchete
            </button>
          </form>
          <form
            className="editorial-admin-form"
            action="/api/admin/gestor/editorial-image"
            encType="multipart/form-data"
            method="post"
            style={{ marginTop: 16 }}
          >
            <input type="hidden" name="return_to" value={returnToManchete} />
            <input type="hidden" name="matchday_id" value={matchday.id} />
            <div className="editorial-admin-field">
              <label htmlFor="matchday-editorial-image-upload">Carregar imagem da manchete</label>
              <input accept="image/jpeg,image/png,image/webp" id="matchday-editorial-image-upload" name="image" type="file" />
            </div>
            <button className="editorial-admin-button secondary" type="submit">
              Carregar imagem da manchete
            </button>
          </form>
        </section>

        <aside className="editorial-admin-panel">
          <header>
            <h2>Blocos automaticos</h2>
            <p>Visiveis na pagina publica, mas nao editados aqui.</p>
          </header>
          <ul className="editorial-admin-note-list">
            <li>Onde ver: jogos agendados e canais TV.</li>
            <li>Placard dos jogos: jogos desta jornada.</li>
            <li>Classificacao: calculada automaticamente.</li>
            <li>Data da jornada: matches.kickoff_at.</li>
          </ul>
        </aside>
      </div>

      <section className="editorial-admin-panel editorial-admin-composition" id="composicao">
        <header>
          <h2>Composicao abaixo da manchete</h2>
          <p>Controla os dois espacos editoriais que aparecem por baixo da manchete na primeira pagina.</p>
        </header>
        {scopedMessageFor(created, error, feedbackScope, "composicao")}
        <div data-composition-form>
          <div className="editorial-admin-composition-grid">
            <div className="editorial-admin-composition-card">
              <h3>Zona abaixo da manchete</h3>
              <p>Escolhe que conjunto ocupa a area inferior esquerda da composicao.</p>
              <form className="editorial-admin-form" action="/api/admin/gestor" data-below-mode-form method="post">
                <input type="hidden" name="action_type" value="save_matchday_editorial" />
                <input type="hidden" name="return_to" value={returnToComposicao} />
                <input type="hidden" name="matchday_id" value={matchday.id} />
                <input type="hidden" name="title" value={editorial?.title ?? ""} />
                <input type="hidden" name="summary" value={editorial?.summary ?? ""} />
                <input type="hidden" name="title_color" value={editorial?.title_color ?? ""} />
                <input type="hidden" name="image_url" value={editorial?.image_url ?? ""} />
                <input type="hidden" name="status" value={editorial?.status ?? "draft"} />
                <input type="hidden" name="complementary_mode" value={complementaryMode} data-suggested-complement />
                <input type="hidden" name="complementary_roundup_item_id" value={editorial?.complementary_roundup_item_id ?? ""} />
                <input type="hidden" name="complementary_label" value={editorial?.complementary_label ?? ""} />
                <input type="hidden" name="complementary_title" value={editorial?.complementary_title ?? ""} />
                <input type="hidden" name="complementary_text" value={editorial?.complementary_text ?? ""} />
                <input type="hidden" name="complementary_image_url" value={editorial?.complementary_image_url ?? ""} />
                <input type="hidden" name="complementary_link_url" value={editorial?.complementary_link_url ?? ""} />
                <input type="hidden" name="complementary_status" value={editorial?.complementary_status ?? "draft"} />
                <div className="editorial-admin-field">
                  <label htmlFor="composition-below-headline-mode">Tipo de conteudo abaixo da manchete</label>
                  <select id="composition-below-headline-mode" name="below_headline_mode" defaultValue={belowHeadlineMode}>
                    <option value="highlights">Destaques abaixo da manchete</option>
                    <option value="roundup">Resumo da Jornada</option>
                  </select>
                </div>
                <button className="editorial-admin-button secondary" type="submit">
                  Guardar escolha
                </button>
              </form>
              <div className="editorial-below-mode-section" data-below-section="highlights" hidden={belowHeadlineMode !== "highlights"} id="destaques">
                <h4>Destaques abaixo da manchete</h4>
                <p className="editorial-admin-muted">Edita os tres destaques editoriais desta zona.</p>
                {scopedMessageFor(created, error, feedbackScope, "destaques")}
                {highlightsEditor}
              </div>
              <div className="editorial-below-mode-section" data-below-section="roundup" hidden={belowHeadlineMode !== "roundup"} id="resumo-jornada">
                <h4>Resumo da Jornada</h4>
                <p className="editorial-admin-muted">Edita ate dez entradas para videos, golos, resumos ou noticias da jornada.</p>
                {scopedMessageFor(created, error, feedbackScope, "resumo-jornada")}
                {roundupEditor}
              </div>
            </div>

            <div className="editorial-admin-composition-card">
              <h3>Bloco complementar</h3>
              <p>Escolhe o conteudo do espaco editorial da direita.</p>
              <form className="editorial-admin-form" action="/api/admin/gestor" data-complementary-form method="post" id="bloco-complementar">
                {scopedMessageFor(created, error, feedbackScope, "bloco-complementar")}
                <input type="hidden" name="action_type" value="save_matchday_editorial" />
                <input type="hidden" name="return_to" value={returnToComplementar} />
                <input type="hidden" name="matchday_id" value={matchday.id} />
                <input type="hidden" name="title" value={editorial?.title ?? ""} />
                <input type="hidden" name="summary" value={editorial?.summary ?? ""} />
                <input type="hidden" name="title_color" value={editorial?.title_color ?? ""} />
                <input type="hidden" name="image_url" value={editorial?.image_url ?? ""} />
                <input type="hidden" name="below_headline_mode" value={belowHeadlineMode} />
                <input type="hidden" name="status" value={editorial?.status ?? "draft"} />
                <div className="editorial-admin-field">
                  <label htmlFor="complementary-mode">Tipo de bloco complementar</label>
                  <select id="complementary-mode" name="complementary_mode" defaultValue={complementaryMode}>
                    <option value="none">Nenhum</option>
                    <option value="complementary_story">Complemento da manchete</option>
                    <option value="roundup_video">Video do Resumo da Jornada</option>
                  </select>
                </div>
                <div className="editorial-complement-mode-section" data-complementary-section="none" hidden={complementaryMode !== "none"}>
                  <p className="editorial-admin-muted">O Bloco complementar fica desativado na pagina publica.</p>
                </div>
                <div className="editorial-complement-mode-section" data-complementary-section="roundup_video" hidden={complementaryMode !== "roundup_video"}>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-roundup-item">Video inicial opcional</label>
                    <select id="complementary-roundup-item" name="complementary_roundup_item_id" defaultValue={editorial?.complementary_roundup_item_id ?? ""}>
                      <option value="">Usar primeiro item publicado</option>
                      {roundupItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.sort_order}. {item.title || item.label || "Item sem titulo"}
                        </option>
                      ))}
                    </select>
                    <p className="editorial-admin-muted">Este modo usa a lista publicada do Resumo da Jornada. O visitante escolhe o video na pagina publica; este campo apenas define o primeiro item, se precisares.</p>
                  </div>
                </div>
                <div className="editorial-complement-mode-section" data-complementary-section="complementary_story" hidden={complementaryMode !== "complementary_story"}>
                  <input type="hidden" name="complementary_roundup_item_id" value={editorial?.complementary_roundup_item_id ?? ""} />
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-label">Antetitulo / etiqueta</label>
                    <input id="complementary-label" name="complementary_label" defaultValue={editorial?.complementary_label ?? ""} placeholder="DESTAQUE" />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-title">Titulo</label>
                    <input id="complementary-title" name="complementary_title" defaultValue={editorial?.complementary_title ?? ""} placeholder="Um detalhe editorial para acompanhar a manchete" />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-text">Texto curto / conteudo breve</label>
                    <textarea id="complementary-text" name="complementary_text" defaultValue={editorial?.complementary_text ?? ""} placeholder="Texto curto do complemento da manchete." />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-image-url">Imagem URL</label>
                    <input id="complementary-image-url" name="complementary_image_url" defaultValue={editorial?.complementary_image_url ?? ""} placeholder="https://exemplo.com/imagem.jpg" />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-link-url">Link da noticia completa</label>
                    <input id="complementary-link-url" name="complementary_link_url" defaultValue={editorial?.complementary_link_url ?? ""} placeholder="/competicoes/liga/2026-27/jornadas/1/noticias/slug" />
                  </div>
                  <div className="editorial-admin-field">
                    <label htmlFor="complementary-status">Estado</label>
                    <select id="complementary-status" name="complementary_status" defaultValue={editorial?.complementary_status ?? "draft"}>
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                </div>
                <button className="editorial-admin-button" type="submit">
                  Guardar bloco complementar
                </button>
              </form>
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var form = document.querySelector('[data-composition-form]');
                if (!form) return;
                var belowSelect = form.querySelector('[name="below_headline_mode"]');
                var complementSelect = form.querySelector('[data-complementary-form] [name="complementary_mode"]');
                var suggestedComplement = form.querySelector('[data-suggested-complement]');
                var belowSections = Array.prototype.slice.call(form.querySelectorAll('[data-below-section]'));
                var sections = Array.prototype.slice.call(form.querySelectorAll('[data-complementary-section]'));
                function syncBelowSections() {
                  var mode = belowSelect ? belowSelect.value : 'highlights';
                  belowSections.forEach(function (section) {
                    section.hidden = section.getAttribute('data-below-section') !== mode;
                  });
                }
                function syncComplementSections() {
                  var mode = complementSelect ? complementSelect.value : 'none';
                  if (suggestedComplement) suggestedComplement.value = mode;
                  sections.forEach(function (section) {
                    section.hidden = section.getAttribute('data-complementary-section') !== mode;
                  });
                }
                function suggestComplement() {
                  if (!belowSelect || !complementSelect) return;
                  complementSelect.value = belowSelect.value === 'roundup' ? 'roundup_video' : 'complementary_story';
                  if (suggestedComplement) suggestedComplement.value = complementSelect.value;
                  syncBelowSections();
                  syncComplementSections();
                }
                if (belowSelect) belowSelect.addEventListener('change', suggestComplement);
                if (complementSelect) complementSelect.addEventListener('change', syncComplementSections);
                syncBelowSections();
                syncComplementSections();
              })();
            `
          }}
        />
      </section>

      <section className="editorial-admin-news-placeholder" id="ultimas-noticias">
        <h2>Ultimas noticias</h2>
        <p className="editorial-admin-muted">Bloco preparado para fase posterior: futura lista de noticias ligada a esta jornada, com hora, titulo e estado.</p>
      </section>
    </main>
  );
}
