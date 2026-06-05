import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type HomeEditorial = {
  id: string;
  slug: string;
  status: "draft" | "published";
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_title_color: string | null;
  below_headline_mode: "highlights" | "roundup";
  below_headline_heading: string | null;
  below_headline_heading_color: string | null;
  side_block_status: "draft" | "published";
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_title_color: string | null;
  side_block_author: string | null;
  side_block_text: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
  complementary_mode: "none" | "complementary_story" | "roundup_video";
  complementary_roundup_item_id: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: "draft" | "published";
  roundup_video_heading: string | null;
  roundup_video_heading_color: string | null;
};

type HomeHighlight = {
  id: string;
  site_editorial_id: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

type HomeLatestNews = {
  id: string;
  site_editorial_id: string;
  time_label: string | null;
  title: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

type HomeRoundupItem = {
  id: string;
  site_editorial_id: string;
  sort_order: number;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  duration: string | null;
  type: "video" | "golos" | "resumo" | "noticia";
  status: "draft" | "published";
};

type HomeEditorialPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const HIGHLIGHT_SORT_ORDERS = Array.from({ length: 6 }, (_, index) => index + 1);
const ROUNDUP_SORT_ORDERS = Array.from({ length: 10 }, (_, index) => index + 1);
const LATEST_NEWS_SORT_ORDERS = Array.from({ length: 8 }, (_, index) => index + 1);

const styles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .home-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .home-admin-hero,
  .home-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .home-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
  }

  .home-admin-hero h1,
  .home-admin-hero p,
  .home-admin-hero small,
  .home-admin-panel h2,
  .home-admin-panel h3,
  .home-admin-panel p {
    margin: 0;
  }

  .home-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-hero h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1.05;
  }

  .home-admin-hero small {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .home-admin-hero-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .home-admin-button {
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

  .home-admin-button.secondary {
    border: 1px solid #dce3eb;
    background: #ffffff;
    color: #10151b;
  }

  .home-admin-hero .home-admin-button.secondary {
    border-color: rgba(255, 255, 255, 0.28);
    background: transparent;
    color: #ffffff;
  }

  .home-admin-grid,
  .home-admin-two-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .home-admin-panel {
    padding: 20px;
  }

  .home-admin-panel > header {
    margin-bottom: 16px;
  }

  .home-admin-panel > header p,
  .home-admin-muted {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .home-admin-form,
  .home-admin-stack {
    display: grid;
    gap: 14px;
  }

  .home-admin-stack {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
    align-items: start;
    margin-top: 18px;
  }

  .home-admin-headline-panel {
    grid-column: 1;
    order: 1;
  }

  .home-admin-side-panel {
    grid-column: 2;
    order: 2;
  }

  .home-admin-composition-panel {
    grid-column: 1;
    order: 3;
  }

  .home-admin-complement-panel {
    grid-column: 2;
    order: 4;
  }

  .home-admin-wide-panel {
    grid-column: 1 / -1;
  }

  .home-admin-highlights-panel,
  .home-admin-roundup-panel,
  .home-admin-latest-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-admin-highlights-panel > header,
  .home-admin-roundup-panel > header,
  .home-admin-latest-panel > header,
  .home-admin-highlights-panel > .home-admin-button,
  .home-admin-roundup-panel > .home-admin-button,
  .home-admin-latest-panel > .home-admin-button {
    grid-column: 1 / -1;
  }

  .home-admin-compact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .home-admin-field,
  .home-admin-fieldset {
    display: grid;
    gap: 6px;
  }

  .home-admin-field label,
  .home-admin-fieldset legend {
    color: #425061;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-field input,
  .home-admin-field textarea,
  .home-admin-field select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #c8d2dd;
    border-radius: 6px;
    padding: 11px 12px;
    background: #ffffff;
    color: #10151b;
    font: inherit;
  }

  .home-admin-field textarea {
    min-height: 110px;
    resize: vertical;
  }

  .home-admin-fieldset {
    margin: 0;
    padding: 16px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .home-admin-fieldset legend {
    width: fit-content;
    padding: 0 8px;
    color: #10151b;
  }

  .home-admin-hidden-form {
    display: none;
  }

  .home-admin-preview {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .home-admin-preview img {
    display: block;
    width: 100%;
    max-height: 220px;
    object-fit: cover;
  }

  .home-admin-message {
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid #b7e1c0;
    border-radius: 8px;
    background: #effaf1;
    color: #1f6d31;
    font-size: 14px;
    font-weight: 800;
  }

  .home-admin-message.warning {
    border-color: #ffd0d0;
    background: #fff3f3;
    color: #9d1c1f;
  }

  @media (max-width: 980px) {
    .home-admin-shell {
      padding: 16px;
    }

    .home-admin-hero,
    .home-admin-grid,
    .home-admin-two-grid,
    .home-admin-compact-grid,
    .home-admin-stack,
    .home-admin-highlights-panel,
    .home-admin-roundup-panel,
    .home-admin-latest-panel {
      grid-template-columns: 1fr;
    }

    .home-admin-headline-panel,
    .home-admin-side-panel,
    .home-admin-composition-panel,
    .home-admin-complement-panel,
    .home-admin-wide-panel {
      grid-column: 1;
    }
  }
`;

function oneParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

async function readHomeEditorial() {
  const rows = await fetchSupabaseAdminTable<HomeEditorial>(
    "site_editorials?select=id,slug,status,headline_title,headline_subtitle,headline_image_url,headline_title_color,below_headline_mode,below_headline_heading,below_headline_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color&slug=eq.home&limit=1"
  ).catch(() => []);

  if (rows[0]) {
    return rows[0];
  }

  if (!getSupabaseServiceConfig()) {
    return null;
  }

  await writeSupabaseAdmin("site_editorials?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      slug: "home",
      status: "draft",
      below_headline_mode: "highlights",
      complementary_mode: "none"
    })
  });

  return (
    await fetchSupabaseAdminTable<HomeEditorial>(
      "site_editorials?select=id,slug,status,headline_title,headline_subtitle,headline_image_url,headline_title_color,below_headline_mode,below_headline_heading,below_headline_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color&slug=eq.home&limit=1"
    ).catch(() => [])
  )[0] ?? null;
}

async function readHighlights(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeHighlight>(
    `site_editorial_highlights?select=id,site_editorial_id,label,title,subtitle,image_url,link_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=6`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

async function readRoundupItems(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeRoundupItem>(
    `site_editorial_roundup_items?select=id,site_editorial_id,sort_order,label,title,subtitle,image_url,video_url,duration,type,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=10`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

async function readLatestNews(siteEditorialId: string) {
  const rows = await fetchSupabaseAdminTable<HomeLatestNews>(
    `site_editorial_latest_news?select=id,site_editorial_id,time_label,title,link_url,image_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&order=sort_order.asc&limit=8`
  ).catch(() => []);

  return new Map(rows.map((row) => [row.sort_order, row]));
}

function feedbackMessage(created?: string, error?: string) {
  const createdLabels: Record<string, string> = {
    save_home_editorial: "Capa editorial da home guardada.",
    save_home_highlights: "Destaques da home guardados.",
    save_home_roundup_items: "Resumo da home guardado.",
    save_home_latest_news: "Ultimas noticias da home guardadas.",
    upload_home_headline_image: "Imagem da manchete carregada.",
    upload_home_highlight_image: "Imagem do destaque carregada."
  };

  if (created) {
    return { type: "success" as const, text: createdLabels[created] ?? "Alteracoes guardadas." };
  }

  if (error) {
    return { type: "warning" as const, text: `Nao foi possivel guardar: ${error}` };
  }

  return null;
}

export default async function HomeEditorialAdminPage({ searchParams }: HomeEditorialPageProps) {
  const query = searchParams ? await searchParams : {};
  const editorial = await readHomeEditorial();
  const highlights = editorial ? await readHighlights(editorial.id) : new Map<number, HomeHighlight>();
  const roundupItems = editorial ? await readRoundupItems(editorial.id) : new Map<number, HomeRoundupItem>();
  const latestNews = editorial ? await readLatestNews(editorial.id) : new Map<number, HomeLatestNews>();
  const message = feedbackMessage(oneParam(query, "created"), oneParam(query, "error"));

  if (!editorial) {
    return (
      <main className="home-admin-shell">
        <style>{styles}</style>
        <section className="home-admin-hero">
          <div>
            <p>Capa global</p>
            <h1>Home editorial</h1>
            <small>O registo site_editorials.slug = home ainda nao esta disponivel.</small>
          </div>
          <a className="home-admin-button secondary" href="/admin/gestor">Voltar ao gestor</a>
        </section>
      </main>
    );
  }

  return (
    <main className="home-admin-shell">
      <style>{styles}</style>
      <section className="home-admin-hero">
        <div>
          <p>Capa global do Jornada.pt</p>
          <h1>Home editorial</h1>
          <small>Edita site_editorials.slug = home, sem liga, epoca ou jornada associada.</small>
        </div>
        <div className="home-admin-hero-actions">
          <a className="home-admin-button secondary" href="/admin/gestor">Voltar ao gestor</a>
          <a className="home-admin-button secondary" href="/">Ver site</a>
        </div>
      </section>

      {message ? <div className={`home-admin-message ${message.type === "warning" ? "warning" : ""}`}>{message.text}</div> : null}

      <section className="home-admin-stack">
        <section className="home-admin-panel home-admin-headline-panel">
          <header>
            <h2>Manchete principal</h2>
            <p>A chamada principal da capa geral do Jornada.pt.</p>
          </header>
          <form className="home-admin-form" action="/api/admin/editorial/home" method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <div className="home-admin-field">
              <label htmlFor="home-status">Estado da home</label>
              <select id="home-status" name="status" defaultValue={editorial.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="home-admin-field">
              <label htmlFor="headline-title">Titulo</label>
              <input id="headline-title" name="headline_title" defaultValue={editorial.headline_title ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="headline-subtitle">Subtitulo</label>
              <textarea id="headline-subtitle" name="headline_subtitle" defaultValue={editorial.headline_subtitle ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="headline-image-url">Imagem principal URL</label>
              <input id="headline-image-url" name="headline_image_url" defaultValue={editorial.headline_image_url ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="headline-title-color">Cor do titulo</label>
              <input id="headline-title-color" name="headline_title_color" defaultValue={editorial.headline_title_color ?? ""} placeholder="#10151b" />
            </div>
            <button className="home-admin-button" type="submit">Guardar manchete</button>
          </form>
          <form className="home-admin-fieldset" action="/api/admin/editorial/home/image" encType="multipart/form-data" method="post">
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <input type="hidden" name="target" value="headline" />
            <h3>Upload de imagem da manchete</h3>
            {editorial.headline_image_url ? (
              <div className="home-admin-preview">
                <img alt="" src={editorial.headline_image_url} />
              </div>
            ) : null}
            <div className="home-admin-field">
              <label htmlFor="headline-image-upload">Imagem da manchete</label>
              <input accept="image/jpeg,image/png,image/webp" id="headline-image-upload" name="image" type="file" />
            </div>
            <button className="home-admin-button secondary" type="submit">Carregar imagem</button>
          </form>
        </section>

        <section className="home-admin-panel home-admin-side-panel">
          <header>
            <h2>Bloco lateral</h2>
            <p>Chamada editorial independente da manchete.</p>
          </header>
          <form className="home-admin-form" action="/api/admin/editorial/home" method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <div className="home-admin-compact-grid">
              <div className="home-admin-field">
                <label htmlFor="side-block-status">Estado</label>
                <select id="side-block-status" name="side_block_status" defaultValue={editorial.side_block_status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="home-admin-field">
                <label htmlFor="side-block-type">Tipo</label>
                <input id="side-block-type" name="side_block_type" defaultValue={editorial.side_block_type ?? ""} placeholder="opiniao" />
              </div>
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-label">Etiqueta</label>
              <input id="side-block-label" name="side_block_label" defaultValue={editorial.side_block_label ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-title">Titulo</label>
              <input id="side-block-title" name="side_block_title" defaultValue={editorial.side_block_title ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-title-color">Cor do titulo</label>
              <input id="side-block-title-color" name="side_block_title_color" defaultValue={editorial.side_block_title_color ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-author">Autor</label>
              <input id="side-block-author" name="side_block_author" defaultValue={editorial.side_block_author ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-text">Texto</label>
              <textarea id="side-block-text" name="side_block_text" defaultValue={editorial.side_block_text ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-image-url">Imagem URL</label>
              <input id="side-block-image-url" name="side_block_image_url" defaultValue={editorial.side_block_image_url ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="side-block-link-url">Link</label>
              <input id="side-block-link-url" name="side_block_link_url" defaultValue={editorial.side_block_link_url ?? ""} />
            </div>
            <button className="home-admin-button" type="submit">Guardar bloco lateral</button>
          </form>
        </section>

        <section className="home-admin-panel home-admin-composition-panel">
          <header>
            <h2>Composicao abaixo da manchete</h2>
            <p>A escolha da zona esquerda orienta automaticamente o bloco complementar da direita.</p>
          </header>
          <form className="home-admin-form" action="/api/admin/editorial/home" data-composition-form method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <div className="home-admin-compact-grid">
              <div className="home-admin-field">
                <label htmlFor="below-headline-mode">Zona abaixo da manchete</label>
                <select id="below-headline-mode" name="below_headline_mode" data-below-headline-mode defaultValue={editorial.below_headline_mode ?? "highlights"}>
                  <option value="highlights">Destaques abaixo da manchete</option>
                  <option value="roundup">Resumo da Jornada</option>
                </select>
              </div>
              <div className="home-admin-field">
                <label htmlFor="composition-complementary-mode">Bloco complementar da direita</label>
                <select id="composition-complementary-mode" name="complementary_mode" data-complementary-mode defaultValue={editorial.complementary_mode}>
                  <option value="none">Sem complemento</option>
                  <option value="complementary_story">Complemento editorial</option>
                  <option value="roundup_video">Video do Resumo da Jornada</option>
                </select>
              </div>
            </div>
            <div className="home-admin-field">
              <label htmlFor="below-headline-heading">Texto do topo</label>
              <input id="below-headline-heading" name="below_headline_heading" defaultValue={editorial.below_headline_heading ?? ""} placeholder="Capa Jornada.pt" />
            </div>
            <div className="home-admin-field">
              <label htmlFor="below-headline-heading-color">Cor do texto do topo</label>
              <input id="below-headline-heading-color" name="below_headline_heading_color" defaultValue={editorial.below_headline_heading_color ?? ""} placeholder="#0b1f3a" />
            </div>
            <p className="home-admin-muted">Destaques escolhe automaticamente Complemento da manchete. Resumo da Jornada escolhe automaticamente Video do Resumo da Jornada.</p>
            <button className="home-admin-button" type="submit">Guardar composicao</button>
          </form>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener("DOMContentLoaded", function () {
                  var belowSelect = document.querySelector("[data-below-headline-mode]");
                  var complementarySelects = document.querySelectorAll("[data-complementary-mode]");
                  if (!belowSelect || complementarySelects.length === 0) return;
                  var syncComplement = function () {
                    var nextValue = belowSelect.value === "roundup" ? "roundup_video" : "complementary_story";
                    complementarySelects.forEach(function (select) {
                      select.value = nextValue;
                    });
                  };
                  belowSelect.addEventListener("change", syncComplement);
                });
              `
            }}
          />
        </section>

        <form
          className="home-admin-panel home-admin-form home-admin-wide-panel home-admin-highlights-panel"
          action="/api/admin/editorial/home"
          method="post"
          style={{ order: editorial.below_headline_mode === "roundup" ? 6 : 5 }}
        >
          <input type="hidden" name="action_type" value="save_home_highlights" />
          <input type="hidden" name="return_to" value="/admin/editorial/home" />
          <header>
            <h2>Destaques</h2>
            <p>Itens publicados aparecem abaixo da manchete da home.</p>
          </header>
          {HIGHLIGHT_SORT_ORDERS.map((sortOrder) => {
            const item = highlights.get(sortOrder);
            return (
              <fieldset className="home-admin-fieldset" key={sortOrder}>
                <legend>Destaque {sortOrder}</legend>
                <div className="home-admin-compact-grid">
                  <div className="home-admin-field">
                    <label htmlFor={`highlight-${sortOrder}-status`}>Estado</label>
                    <select id={`highlight-${sortOrder}-status`} name={`highlight_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="home-admin-field">
                    <label htmlFor={`highlight-${sortOrder}-label`}>Etiqueta</label>
                    <input id={`highlight-${sortOrder}-label`} name={`highlight_${sortOrder}_label`} defaultValue={item?.label ?? ""} />
                  </div>
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`highlight-${sortOrder}-title`}>Titulo</label>
                  <input id={`highlight-${sortOrder}-title`} name={`highlight_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`highlight-${sortOrder}-subtitle`}>Subtitulo / texto</label>
                  <textarea id={`highlight-${sortOrder}-subtitle`} name={`highlight_${sortOrder}_subtitle`} defaultValue={item?.subtitle ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`highlight-${sortOrder}-image-url`}>Imagem URL</label>
                  <input id={`highlight-${sortOrder}-image-url`} name={`highlight_${sortOrder}_image_url`} defaultValue={item?.image_url ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`highlight-${sortOrder}-link-url`}>Link</label>
                  <input id={`highlight-${sortOrder}-link-url`} name={`highlight_${sortOrder}_link_url`} defaultValue={item?.link_url ?? ""} />
                </div>
                <div className="home-admin-fieldset">
                  {item?.image_url ? (
                    <div className="home-admin-preview">
                      <img alt="" src={item.image_url} />
                    </div>
                  ) : null}
                  <div className="home-admin-field">
                    <label htmlFor={`highlight-${sortOrder}-image-upload`}>Upload imagem do destaque {sortOrder}</label>
                    <input accept="image/jpeg,image/png,image/webp" form={`highlight-upload-${sortOrder}`} id={`highlight-${sortOrder}-image-upload`} name="image" type="file" />
                  </div>
                  <button className="home-admin-button secondary" form={`highlight-upload-${sortOrder}`} type="submit">Carregar imagem</button>
                </div>
              </fieldset>
            );
          })}
          <button className="home-admin-button" type="submit">Guardar destaques</button>
        </form>
        {HIGHLIGHT_SORT_ORDERS.map((sortOrder) => (
          <form className="home-admin-hidden-form" action="/api/admin/editorial/home/image" encType="multipart/form-data" id={`highlight-upload-${sortOrder}`} key={`upload-${sortOrder}`} method="post">
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <input type="hidden" name="target" value="highlight" />
            <input type="hidden" name="sort_order" value={sortOrder} />
          </form>
        ))}

        <form
          className="home-admin-panel home-admin-form home-admin-wide-panel home-admin-roundup-panel"
          action="/api/admin/editorial/home"
          method="post"
          style={{ order: editorial.below_headline_mode === "roundup" ? 5 : 6 }}
        >
          <input type="hidden" name="action_type" value="save_home_roundup_items" />
          <input type="hidden" name="return_to" value="/admin/editorial/home" />
          <header>
            <h2>Resumo da Jornada</h2>
            <p>Lista de videos/resumos da capa editorial global.</p>
          </header>
          {ROUNDUP_SORT_ORDERS.map((sortOrder) => {
            const item = roundupItems.get(sortOrder);
            return (
              <fieldset className="home-admin-fieldset" key={sortOrder}>
                <legend>Resumo {sortOrder}</legend>
                <div className="home-admin-compact-grid">
                  <div className="home-admin-field">
                    <label htmlFor={`roundup-${sortOrder}-status`}>Estado</label>
                    <select id={`roundup-${sortOrder}-status`} name={`roundup_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="home-admin-field">
                    <label htmlFor={`roundup-${sortOrder}-type`}>Tipo</label>
                    <select id={`roundup-${sortOrder}-type`} name={`roundup_${sortOrder}_type`} defaultValue={item?.type ?? "resumo"}>
                      <option value="resumo">Resumo</option>
                      <option value="video">Video</option>
                      <option value="golos">Golos</option>
                      <option value="noticia">Noticia</option>
                    </select>
                  </div>
                </div>
                <div className="home-admin-compact-grid">
                  <div className="home-admin-field">
                    <label htmlFor={`roundup-${sortOrder}-label`}>Etiqueta</label>
                    <input id={`roundup-${sortOrder}-label`} name={`roundup_${sortOrder}_label`} defaultValue={item?.label ?? ""} placeholder={sortOrder === 1 ? "VIDEO" : sortOrder === 2 ? "GOLOS" : "RESUMO"} />
                  </div>
                  <div className="home-admin-field">
                    <label htmlFor={`roundup-${sortOrder}-duration`}>Duracao</label>
                    <input id={`roundup-${sortOrder}-duration`} name={`roundup_${sortOrder}_duration`} defaultValue={item?.duration ?? ""} placeholder="5:42" />
                  </div>
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`roundup-${sortOrder}-title`}>Titulo</label>
                  <input id={`roundup-${sortOrder}-title`} name={`roundup_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`roundup-${sortOrder}-subtitle`}>Subtitulo</label>
                  <input id={`roundup-${sortOrder}-subtitle`} name={`roundup_${sortOrder}_subtitle`} defaultValue={item?.subtitle ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`roundup-${sortOrder}-image-url`}>Imagem URL</label>
                  <input id={`roundup-${sortOrder}-image-url`} name={`roundup_${sortOrder}_image_url`} defaultValue={item?.image_url ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`roundup-${sortOrder}-video-url`}>Video URL</label>
                  <input id={`roundup-${sortOrder}-video-url`} name={`roundup_${sortOrder}_video_url`} defaultValue={item?.video_url ?? ""} />
                </div>
              </fieldset>
            );
          })}
          <button className="home-admin-button" type="submit">Guardar Resumo da Jornada</button>
        </form>

        <section className="home-admin-panel home-admin-complement-panel">
          <header>
            <h2>Bloco complementar</h2>
            <p>Campos do bloco da direita, coerentes com a composicao escolhida.</p>
          </header>
          <form className="home-admin-form" action="/api/admin/editorial/home" method="post">
            <input type="hidden" name="action_type" value="save_home_editorial" />
            <input type="hidden" name="return_to" value="/admin/editorial/home" />
            <input type="hidden" name="allow_manual_complementary_mode" value="1" />
            <div className="home-admin-compact-grid">
              <div className="home-admin-field">
                <label htmlFor="complementary-status">Estado</label>
                <select id="complementary-status" name="complementary_status" defaultValue={editorial.complementary_status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="home-admin-field">
                <label htmlFor="complementary-mode">Tipo de bloco complementar</label>
                <select id="complementary-mode" name="complementary_mode" data-complementary-mode defaultValue={editorial.complementary_mode}>
                  <option value="none">Sem complemento</option>
                  <option value="complementary_story">Complemento da manchete</option>
                  <option value="roundup_video">Video do Resumo da Jornada</option>
                </select>
              </div>
            </div>
            <div className="home-admin-field">
              <label htmlFor="complementary-roundup-item">Video inicial opcional</label>
              <select id="complementary-roundup-item" name="complementary_roundup_item_id" defaultValue={editorial.complementary_roundup_item_id ?? ""}>
                <option value="">Escolha opcional</option>
                {Array.from(roundupItems.values())
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sort_order}. {item.title || item.label || "Item do resumo"}
                    </option>
                  ))}
              </select>
            </div>
            <div className="home-admin-field">
              <label htmlFor="roundup-video-heading">Titulo da lista / cabecalho do resumo</label>
              <input id="roundup-video-heading" name="roundup_video_heading" defaultValue={editorial.roundup_video_heading ?? ""} placeholder="Jogos Video Resumo" />
            </div>
            <div className="home-admin-field">
              <label htmlFor="roundup-video-heading-color">Cor do cabecalho</label>
              <input id="roundup-video-heading-color" name="roundup_video_heading_color" defaultValue={editorial.roundup_video_heading_color ?? ""} placeholder="#003f8f" />
            </div>
            <p className="home-admin-muted">Quando o modo e Video do Resumo da Jornada, este bloco usa os itens publicados do Resumo da Jornada.</p>
            <div className="home-admin-field">
              <label htmlFor="complementary-label">Etiqueta</label>
              <input id="complementary-label" name="complementary_label" defaultValue={editorial.complementary_label ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="complementary-title">Titulo</label>
              <input id="complementary-title" name="complementary_title" defaultValue={editorial.complementary_title ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="complementary-text">Texto</label>
              <textarea id="complementary-text" name="complementary_text" defaultValue={editorial.complementary_text ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="complementary-image-url">Imagem URL</label>
              <input id="complementary-image-url" name="complementary_image_url" defaultValue={editorial.complementary_image_url ?? ""} />
            </div>
            <div className="home-admin-field">
              <label htmlFor="complementary-link-url">Link</label>
              <input id="complementary-link-url" name="complementary_link_url" defaultValue={editorial.complementary_link_url ?? ""} />
            </div>
            <button className="home-admin-button" type="submit">Guardar bloco complementar</button>
          </form>
        </section>

        <form className="home-admin-panel home-admin-form home-admin-wide-panel home-admin-latest-panel" action="/api/admin/editorial/home" method="post" style={{ order: 7 }}>
          <input type="hidden" name="action_type" value="save_home_latest_news" />
          <input type="hidden" name="return_to" value="/admin/editorial/home" />
          <header>
            <h2>Ultimas noticias</h2>
            <p>Lista editorial da capa, sem ligacao a uma jornada.</p>
          </header>
          {LATEST_NEWS_SORT_ORDERS.map((sortOrder) => {
            const item = latestNews.get(sortOrder);
            return (
              <fieldset className="home-admin-fieldset" key={sortOrder}>
                <legend>Noticia {sortOrder}</legend>
                <div className="home-admin-compact-grid">
                  <div className="home-admin-field">
                    <label htmlFor={`latest-${sortOrder}-status`}>Estado</label>
                    <select id={`latest-${sortOrder}-status`} name={`latest_${sortOrder}_status`} defaultValue={item?.status ?? "draft"}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="home-admin-field">
                    <label htmlFor={`latest-${sortOrder}-time-label`}>Hora / etiqueta</label>
                    <input id={`latest-${sortOrder}-time-label`} name={`latest_${sortOrder}_time_label`} defaultValue={item?.time_label ?? ""} />
                  </div>
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`latest-${sortOrder}-title`}>Titulo</label>
                  <input id={`latest-${sortOrder}-title`} name={`latest_${sortOrder}_title`} defaultValue={item?.title ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`latest-${sortOrder}-link-url`}>Link</label>
                  <input id={`latest-${sortOrder}-link-url`} name={`latest_${sortOrder}_link_url`} defaultValue={item?.link_url ?? ""} />
                </div>
                <div className="home-admin-field">
                  <label htmlFor={`latest-${sortOrder}-image-url`}>Imagem URL</label>
                  <input id={`latest-${sortOrder}-image-url`} name={`latest_${sortOrder}_image_url`} defaultValue={item?.image_url ?? ""} />
                </div>
              </fieldset>
            );
          })}
          <button className="home-admin-button" type="submit">Guardar ultimas noticias</button>
        </form>
      </section>
    </main>
  );
}
