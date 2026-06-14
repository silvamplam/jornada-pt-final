import type { ReactNode } from "react";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SiteEditorial = {
  id: string;
  slug: string | null;
  status: string | null;
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_link_url: string | null;
  headline_title_color: string | null;
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_text: string | null;
  side_block_author: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
  side_block_status: string | null;
  side_block_title_color: string | null;
  complementary_mode: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: string | null;
  complementary_roundup_item_id: string | null;
  below_headline_mode: string | null;
  below_headline_heading: string | null;
  below_headline_heading_color: string | null;
  roundup_video_heading: string | null;
  roundup_video_heading_color: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
};

type SiteEditorialHighlight = {
  id: string;
  site_editorial_id: string | null;
  sort_order: number | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SiteEditorialLatestNews = {
  id: string;
  site_editorial_id: string | null;
  sort_order: number | null;
  time_label: string | null;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SiteEditorialRoundupItem = {
  id: string;
  site_editorial_id: string | null;
  sort_order: number | null;
  type: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  duration: string | null;
  image_url: string | null;
  video_url: string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SiteFeaturedMatch = {
  id?: string | null;
  match_id: string | null;
  sort_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HomeEditorialData = {
  editorial: SiteEditorial | null;
  highlights: SiteEditorialHighlight[];
  latestNews: SiteEditorialLatestNews[];
  roundupItems: SiteEditorialRoundupItem[];
  featuredMatches: SiteFeaturedMatch[];
  error: string | null;
};

const homeEditorialStyles = `
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

  .home-admin-container {
    max-width: 1440px;
    margin: 0 auto;
  }

  .home-admin-hero,
  .home-admin-panel {
    border-radius: 8px;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.12);
  }

  .home-admin-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    background: #10151b;
    color: #fff;
  }

  .home-admin-hero p,
  .home-admin-hero h1,
  .home-admin-panel h2,
  .home-admin-panel h3,
  .home-admin-panel p {
    margin: 0;
  }

  .home-admin-eyebrow,
  .home-admin-source,
  .home-admin-meta {
    color: #e5252a;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-hero h1 {
    margin-top: 8px;
    font-size: 40px;
    line-height: 1;
  }

  .home-admin-hero span {
    display: block;
    margin-top: 10px;
    max-width: 820px;
    color: #cbd5e1;
    font-size: 15px;
    line-height: 1.45;
  }

  .home-admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .home-admin-actions a,
  .home-admin-link {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    padding: 0 14px;
    background: transparent;
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .home-admin-link {
    border-color: #10151b;
    background: #10151b;
  }

  .home-admin-notice,
  .home-admin-error {
    margin-top: 18px;
    border-radius: 8px;
    padding: 14px 16px;
    line-height: 1.45;
  }

  .home-admin-notice {
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e3a8a;
  }

  .home-admin-error {
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #991b1b;
  }

  .home-admin-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .home-admin-stack {
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .home-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    background: #fff;
  }

  .home-admin-panel > header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .home-admin-panel h2 {
    font-size: 21px;
    text-transform: uppercase;
  }

  .home-admin-panel header p {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.4;
  }

  .home-admin-feature {
    display: grid;
    grid-template-columns: minmax(220px, 0.42fr) minmax(0, 0.58fr);
    gap: 18px;
    padding: 20px;
  }

  .home-admin-media {
    min-height: 230px;
    overflow: hidden;
    border-radius: 8px;
    background: #dce3eb;
  }

  .home-admin-media img,
  .home-admin-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .home-admin-placeholder {
    display: grid;
    min-height: 120px;
    place-items: center;
    padding: 18px;
    color: #7b8591;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
    text-transform: uppercase;
  }

  .home-admin-feature h3 {
    margin-top: 8px;
    font-size: 30px;
    line-height: 1.05;
  }

  .home-admin-feature p,
  .home-admin-card p,
  .home-admin-detail-list dd {
    color: #4d5763;
    line-height: 1.45;
  }

  .home-admin-status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .home-admin-pill {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    border-radius: 999px;
    padding: 0 9px;
    background: #eef2f6;
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-pill.is-published {
    background: #e8f5ed;
    color: #17633b;
  }

  .home-admin-pill.is-draft {
    background: #fff4d6;
    color: #7a5200;
  }

  .home-admin-card-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    padding: 20px;
  }

  .home-admin-card {
    overflow: hidden;
    border: 1px solid #e6ebf1;
    border-radius: 8px;
    background: #fff;
  }

  .home-admin-card-media {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #dce3eb;
  }

  .home-admin-card-body {
    display: grid;
    gap: 8px;
    padding: 14px;
  }

  .home-admin-card h3 {
    font-size: 17px;
    line-height: 1.16;
  }

  .home-admin-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .home-admin-list li {
    display: grid;
    gap: 7px;
    padding: 14px 20px;
    border-bottom: 1px solid #eef2f6;
  }

  .home-admin-list li:last-child {
    border-bottom: 0;
  }

  .home-admin-list strong {
    font-size: 15px;
    line-height: 1.25;
  }

  .home-admin-detail-list {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    gap: 8px 12px;
    margin: 14px 0 0;
  }

  .home-admin-detail-list dt {
    color: #7b8591;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-detail-list dd {
    margin: 0;
    word-break: break-word;
  }

  .home-admin-empty {
    padding: 18px 20px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .home-admin-link-out {
    color: #10151b;
    font-weight: 800;
    text-decoration: none;
  }

  .home-admin-link-out:hover {
    text-decoration: underline;
  }

  @media (max-width: 1100px) {
    .home-admin-grid,
    .home-admin-feature,
    .home-admin-card-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .home-admin-shell {
      padding: 16px;
    }

    .home-admin-hero,
    .home-admin-panel > header,
    .home-admin-detail-list {
      display: grid;
      grid-template-columns: 1fr;
    }

    .home-admin-actions {
      justify-content: flex-start;
    }
  }
`;

function textValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleanValue = value?.trim();
    if (cleanValue) {
      return cleanValue;
    }
  }

  return "";
}

function statusText(value: string | null | undefined) {
  return textValue(value, "sem estado");
}

function statusClass(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "published") return " is-published";
  if (normalized === "draft") return " is-draft";
  return "";
}

function fieldLink(value: string | null | undefined) {
  const cleanValue = value?.trim();
  if (!cleanValue) {
    return <span>Sem link</span>;
  }

  return (
    <a className="home-admin-link-out" href={cleanValue}>
      {cleanValue}
    </a>
  );
}

function MediaPreview({ src, label }: { src: string | null | undefined; label: string }) {
  const cleanSrc = src?.trim();

  if (!cleanSrc) {
    return <div className="home-admin-placeholder">Sem imagem</div>;
  }

  return <img alt={label} src={cleanSrc} />;
}

function StatusPill({ status }: { status: string | null | undefined }) {
  return <span className={`home-admin-pill${statusClass(status)}`}>{statusText(status)}</span>;
}

function DetailList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="home-admin-detail-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || <span>Sem valor</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

async function readHomeEditorialData(): Promise<HomeEditorialData> {
  try {
    const editorials = await fetchSupabaseAdminTable<SiteEditorial>(
      "site_editorials?select=*&slug=eq.home&limit=1"
    );
    const editorial = editorials[0] ?? null;

    if (!editorial?.id) {
      return {
        editorial: null,
        highlights: [],
        latestNews: [],
        roundupItems: [],
        featuredMatches: [],
        error: null
      };
    }

    const encodedId = encodeURIComponent(editorial.id);
    const [highlights, latestNews, roundupItems, featuredMatches] = await Promise.all([
      fetchSupabaseAdminTable<SiteEditorialHighlight>(
        `site_editorial_highlights?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialLatestNews>(
        `site_editorial_latest_news?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialRoundupItem>(
        `site_editorial_roundup_items?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteFeaturedMatch>("site_featured_matches?select=*&order=sort_order.asc")
    ]);

    return {
      editorial,
      highlights,
      latestNews,
      roundupItems,
      featuredMatches,
      error: null
    };
  } catch (error) {
    return {
      editorial: null,
      highlights: [],
      latestNews: [],
      roundupItems: [],
      featuredMatches: [],
      error: error instanceof Error ? error.message : "Nao foi possivel ler as tabelas site_*."
    };
  }
}

export default async function AdminEditorialHomePage() {
  const { editorial, highlights, latestNews, roundupItems, featuredMatches, error } = await readHomeEditorialData();

  return (
    <main className="home-admin-shell">
      <style>{homeEditorialStyles}</style>
      <div className="home-admin-container">
        <section className="home-admin-hero">
          <div>
            <p className="home-admin-eyebrow">Jornada.pt</p>
            <h1>Home Editorial</h1>
            <span>
              Leitura real das tabelas site_* da Home. A Home publica / ainda nao foi alterada e continua no modelo
              antigo/contextual.
            </span>
          </div>
          <nav className="home-admin-actions" aria-label="Navegacao editorial">
            <a href="/admin/editorial/artigos">Artigos / Noticias</a>
            <a href="/admin/editorial/composicao">Composicao Editorial</a>
            <a href="/admin/editorial/jornada">Editorial da Jornada</a>
            <a href="/admin/gestor">Centro de Gestao</a>
            <a href="/admin">Backoffice</a>
          </nav>
        </section>

        <div className="home-admin-notice">
          Esta pagina e apenas diagnostico/leitura: nao cria formularios, nao grava dados e nao muda a Home publica.
          Fonte esperada: public.site_editorials e tabelas public.site_editorial_* ligadas ao slug home.
        </div>

        {error ? <div className="home-admin-error">Erro ao ler site_*: {error}</div> : null}
        {!error && !editorial ? (
          <div className="home-admin-error">Nao foi encontrado registo em site_editorials com slug=&quot;home&quot;.</div>
        ) : null}

        <div className="home-admin-grid">
          <div className="home-admin-stack">
            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Manchete da Home</h2>
                  <p>Dados lidos de site_editorials.slug=home.</p>
                </div>
                <span className="home-admin-source">site_editorials</span>
              </header>
              {editorial ? (
                <div className="home-admin-feature">
                  <div className="home-admin-media">
                    <MediaPreview label="Imagem da manchete da Home" src={editorial.headline_image_url} />
                  </div>
                  <div>
                    <span className="home-admin-meta">{statusText(editorial.status)}</span>
                    <h3 style={editorial.headline_title_color ? { color: editorial.headline_title_color } : undefined}>
                      {textValue(editorial.headline_title, "Sem titulo de manchete")}
                    </h3>
                    <p>{textValue(editorial.headline_subtitle, "Sem subtitulo de manchete.")}</p>
                    <div className="home-admin-status-row">
                      <StatusPill status={editorial.status} />
                      {editorial.headline_title_color ? (
                        <span className="home-admin-pill">cor {editorial.headline_title_color}</span>
                      ) : null}
                    </div>
                    <DetailList
                      rows={[
                        ["Link", fieldLink(editorial.headline_link_url)],
                        ["Imagem", editorial.headline_image_url || "Sem imagem"],
                        ["Atualizado", editorial.updated_at || "Sem data"]
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <p className="home-admin-empty">Sem registo principal da Home.</p>
              )}
            </section>

            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Destaques abaixo da manchete</h2>
                  <p>Ordenados por sort_order e ligados ao site_editorial_id da Home.</p>
                </div>
                <span className="home-admin-source">{highlights.length} itens</span>
              </header>
              {highlights.length > 0 ? (
                <div className="home-admin-card-grid">
                  {highlights.map((item) => (
                    <article className="home-admin-card" key={item.id}>
                      <div className="home-admin-card-media">
                        <MediaPreview label={textValue(item.title, "Destaque")} src={item.image_url} />
                      </div>
                      <div className="home-admin-card-body">
                        <span className="home-admin-meta">
                          {item.sort_order ?? "-"} | {textValue(item.label, "sem etiqueta")}
                        </span>
                        <h3>{textValue(item.title, "Sem titulo")}</h3>
                        <p>{textValue(item.subtitle, "Sem subtitulo.")}</p>
                        <StatusPill status={item.status} />
                        <DetailList rows={[["Link", fieldLink(item.link_url)]]} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="home-admin-empty">Sem destaques para apresentar.</p>
              )}
            </section>

            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Videos / resumo / roundup</h2>
                  <p>Itens editoriais da zona de resumo da Home.</p>
                </div>
                <span className="home-admin-source">{roundupItems.length} itens</span>
              </header>
              {roundupItems.length > 0 ? (
                <div className="home-admin-card-grid">
                  {roundupItems.map((item) => (
                    <article className="home-admin-card" key={item.id}>
                      <div className="home-admin-card-media">
                        <MediaPreview label={textValue(item.title, "Roundup")} src={item.image_url} />
                      </div>
                      <div className="home-admin-card-body">
                        <span className="home-admin-meta">
                          {item.sort_order ?? "-"} | {textValue(item.type, "sem tipo")}
                        </span>
                        <h3>{textValue(item.title, "Sem titulo")}</h3>
                        <p>{textValue(item.subtitle, "Sem subtitulo.")}</p>
                        <StatusPill status={item.status} />
                        <DetailList
                          rows={[
                            ["Etiqueta", item.label || "Sem etiqueta"],
                            ["Duracao", item.duration || "Sem duracao"],
                            ["Video", fieldLink(item.video_url)]
                          ]}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="home-admin-empty">Sem itens de video/resumo para apresentar.</p>
              )}
            </section>
          </div>

          <aside className="home-admin-stack">
            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Bloco lateral</h2>
                  <p>Snapshot editorial guardado em site_editorials.</p>
                </div>
                <span className="home-admin-source">site_editorials</span>
              </header>
              {editorial ? (
                <div className="home-admin-feature">
                  <div className="home-admin-media">
                    <MediaPreview label="Imagem do bloco lateral" src={editorial.side_block_image_url} />
                  </div>
                  <div>
                    <span className="home-admin-meta">{textValue(editorial.side_block_label, "sem etiqueta")}</span>
                    <h3 style={editorial.side_block_title_color ? { color: editorial.side_block_title_color } : undefined}>
                      {textValue(editorial.side_block_title, "Sem titulo")}
                    </h3>
                    <p>{textValue(editorial.side_block_text, "Sem texto.")}</p>
                    <div className="home-admin-status-row">
                      <StatusPill status={editorial.side_block_status} />
                      {editorial.side_block_type ? <span className="home-admin-pill">{editorial.side_block_type}</span> : null}
                    </div>
                    <DetailList
                      rows={[
                        ["Autor", editorial.side_block_author || "Sem autor"],
                        ["Link", fieldLink(editorial.side_block_link_url)],
                        ["Imagem", editorial.side_block_image_url || "Sem imagem"]
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <p className="home-admin-empty">Sem bloco lateral.</p>
              )}
            </section>

            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Complemento</h2>
                  <p>Complemento abaixo/ao lado da manchete.</p>
                </div>
                <span className="home-admin-source">site_editorials</span>
              </header>
              {editorial ? (
                <div className="home-admin-feature">
                  <div className="home-admin-media">
                    <MediaPreview label="Imagem do complemento" src={editorial.complementary_image_url} />
                  </div>
                  <div>
                    <span className="home-admin-meta">{textValue(editorial.complementary_label, "sem etiqueta")}</span>
                    <h3>{textValue(editorial.complementary_title, "Sem titulo")}</h3>
                    <p>{textValue(editorial.complementary_text, "Sem texto.")}</p>
                    <div className="home-admin-status-row">
                      <StatusPill status={editorial.complementary_status} />
                      {editorial.complementary_mode ? <span className="home-admin-pill">{editorial.complementary_mode}</span> : null}
                    </div>
                    <DetailList
                      rows={[
                        ["Link", fieldLink(editorial.complementary_link_url)],
                        ["Roundup item", editorial.complementary_roundup_item_id || "Sem relacao"],
                        ["Imagem", editorial.complementary_image_url || "Sem imagem"]
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <p className="home-admin-empty">Sem complemento.</p>
              )}
            </section>

            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Ultimas noticias / ao minuto</h2>
                  <p>Itens de diagnostico, incluindo draft ou vazios.</p>
                </div>
                <span className="home-admin-source">{latestNews.length} itens</span>
              </header>
              {latestNews.length > 0 ? (
                <ul className="home-admin-list">
                  {latestNews.map((item) => (
                    <li key={item.id}>
                      <span className="home-admin-meta">
                        {item.sort_order ?? "-"} | {textValue(item.time_label, "sem hora")}
                      </span>
                      <strong>{textValue(item.title, "Sem titulo")}</strong>
                      <StatusPill status={item.status} />
                      <DetailList
                        rows={[
                          ["Imagem", item.image_url || "Sem imagem"],
                          ["Link", fieldLink(item.link_url)]
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-admin-empty">Sem ultimas noticias para apresentar.</p>
              )}
            </section>

            <section className="home-admin-panel">
              <header>
                <div>
                  <h2>Jogos em destaque</h2>
                  <p>Leitura simples de site_featured_matches.</p>
                </div>
                <span className="home-admin-source">{featuredMatches.length} jogos</span>
              </header>
              {featuredMatches.length > 0 ? (
                <ul className="home-admin-list">
                  {featuredMatches.map((item, index) => (
                    <li key={item.id ?? `${item.match_id}-${index}`}>
                      <span className="home-admin-meta">posicao {item.sort_order ?? "-"}</span>
                      <strong>{item.match_id || "Sem match_id"}</strong>
                      <DetailList
                        rows={[
                          ["match_id", item.match_id || "Sem match_id"],
                          ["sort_order", item.sort_order ?? "Sem ordem"]
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-admin-empty">Sem jogos em destaque para apresentar.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
