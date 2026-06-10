import type { ReactNode } from "react";
import {
  fetchSupabaseAdminTable,
  type SupabaseCompetition,
  type SupabaseCountry,
  type SupabaseMatchday,
  type SupabaseMatchdayEditorial,
  type SupabaseMatchdayHighlight,
  type SupabaseMatchdayLatestNews,
  type SupabaseMatchdayRoundupItem,
  type SupabaseSeason
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CompositionPageProps = {
  params: Promise<{
    matchdayId: string;
  }>;
};

type MatchdayContext = {
  matchday: SupabaseMatchday;
  season: SupabaseSeason;
  competition: SupabaseCompetition;
  country: SupabaseCountry | null;
};

type SupabaseArticle = {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_url: string | null;
  status: string;
  competition_id: string | null;
  season_id: string | null;
  matchday_id: string | null;
  match_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const compositionPageStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .composition-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .composition-admin-hero,
  .composition-admin-panel,
  .composition-admin-card {
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .composition-admin-hero {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-end;
    padding: 24px;
    background: #10151b;
    color: #ffffff;
  }

  .composition-admin-hero p,
  .composition-admin-hero h1,
  .composition-admin-hero span {
    margin: 0;
  }

  .composition-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-hero h1 {
    margin-top: 8px;
    font-size: 38px;
    line-height: 1;
  }

  .composition-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 15px;
  }

  .composition-admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .composition-admin-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.26);
    border-radius: 6px;
    color: inherit;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .composition-admin-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
    align-items: start;
  }

  .composition-admin-panel {
    overflow: hidden;
  }

  .composition-admin-panel > header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .composition-admin-panel h2,
  .composition-admin-panel h3,
  .composition-admin-panel p,
  .composition-admin-card p {
    margin: 0;
  }

  .composition-admin-panel h2 {
    font-size: 22px;
    text-transform: uppercase;
  }

  .composition-admin-panel header p {
    margin-top: 6px;
    color: #607086;
    font-size: 13px;
    line-height: 1.45;
  }

  .composition-admin-stack {
    display: grid;
    gap: 14px;
    padding: 16px;
  }

  .composition-admin-card {
    overflow: hidden;
    box-shadow: none;
  }

  .composition-admin-card header {
    padding: 12px 14px;
    border-bottom: 1px solid #edf1f5;
    background: #ffffff;
  }

  .composition-admin-card h3 {
    font-size: 15px;
    text-transform: uppercase;
  }

  .composition-admin-card-body {
    display: grid;
    gap: 10px;
    padding: 14px;
  }

  .composition-admin-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .composition-admin-item {
    display: grid;
    gap: 8px;
    min-width: 0;
    padding: 12px;
    border: 1px solid #e3e9f0;
    border-radius: 6px;
    background: #ffffff;
  }

  .composition-admin-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
    background: #eef2f6;
  }

  .composition-admin-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .composition-admin-label {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-title {
    color: #10151b;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.2;
  }

  .composition-admin-copy {
    color: #526174;
    font-size: 13px;
    line-height: 1.45;
  }

  .composition-admin-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    color: #607086;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .composition-admin-link {
    color: #10151b;
    font-size: 12px;
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .composition-admin-empty {
    padding: 12px;
    border: 1px dashed #cdd6e0;
    border-radius: 6px;
    color: #6d7b8c;
    font-size: 13px;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .composition-admin-layout,
    .composition-admin-grid {
      grid-template-columns: 1fr;
    }

    .composition-admin-hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .composition-admin-actions {
      justify-content: flex-start;
    }
  }
`;

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
  try {
    return await readFirst<SupabaseMatchdayEditorial>(
      `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,below_headline_mode,below_headline_heading,below_headline_heading_color,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,latest_zone_mode,latest_zone_title,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}`
    );
  } catch {
    return readFirst<SupabaseMatchdayEditorial>(
      `matchday_editorials?select=id,matchday_id,title,summary,title_color,image_url,below_headline_mode,below_headline_heading,below_headline_heading_color,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}`
    ).catch(() => null);
  }
}

function readMatchdayHighlights(matchdayId: string): Promise<SupabaseMatchdayHighlight[]> {
  return fetchSupabaseAdminTable<SupabaseMatchdayHighlight>(
    `matchday_highlights?select=id,matchday_id,label,title,image_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=20`
  ).catch(() => []);
}

function readMatchdayRoundupItems(matchdayId: string): Promise<SupabaseMatchdayRoundupItem[]> {
  return fetchSupabaseAdminTable<SupabaseMatchdayRoundupItem>(
    `matchday_roundup_items?select=id,matchday_id,label,title,subtitle,image_url,video_url,duration,type,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=sort_order.asc&limit=50`
  ).catch(() => []);
}

async function readMatchdayLatestNews(matchdayId: string): Promise<SupabaseMatchdayLatestNews[]> {
  try {
    return await fetchSupabaseAdminTable<SupabaseMatchdayLatestNews>(
      `matchday_latest_news?select=id,matchday_id,time_label,title,subtitle,image_url,link_url,article_id,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&order=sort_order.asc&limit=50`
    );
  } catch {
    return fetchSupabaseAdminTable<SupabaseMatchdayLatestNews>(
      `matchday_latest_news?select=id,matchday_id,time_label,title,image_url,sort_order,status,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
        matchdayId
      )}&order=sort_order.asc&limit=50`
    ).catch(() => []);
  }
}

function readMatchdayArticles(matchdayId: string): Promise<SupabaseArticle[]> {
  return fetchSupabaseAdminTable<SupabaseArticle>(
    `articles?select=id,title,summary,image_url,source_url,status,competition_id,season_id,matchday_id,match_id,published_at,created_at,updated_at&matchday_id=eq.${encodeURIComponent(
      matchdayId
    )}&order=published_at.desc.nullslast&limit=50`
  ).catch(() => []);
}

function statusLabel(status?: string | null) {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  return status || "Sem estado";
}

function textOrEmpty(value?: string | null) {
  return value?.trim() || "";
}

function FieldLink({ href }: { href?: string | null }) {
  const url = textOrEmpty(href);

  if (!url) {
    return null;
  }

  return (
    <a className="composition-admin-link" href={url}>
      Abrir link
    </a>
  );
}

function ImagePreview({ src }: { src?: string | null }) {
  const imageUrl = textOrEmpty(src);

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="composition-admin-image">
      <img alt="" src={imageUrl} />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="composition-admin-empty">{children}</div>;
}

function ItemCard({
  label,
  title,
  subtitle,
  imageUrl,
  linkUrl,
  meta
}: {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  meta?: Array<string | null | undefined>;
}) {
  const visibleMeta = meta?.filter((item): item is string => Boolean(item)) ?? [];

  return (
    <article className="composition-admin-item">
      <ImagePreview src={imageUrl} />
      {textOrEmpty(label) ? <span className="composition-admin-label">{label}</span> : null}
      {textOrEmpty(title) ? <strong className="composition-admin-title">{title}</strong> : null}
      {textOrEmpty(subtitle) ? <p className="composition-admin-copy">{subtitle}</p> : null}
      {visibleMeta.length > 0 ? (
        <div className="composition-admin-meta">
          {visibleMeta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <FieldLink href={linkUrl} />
    </article>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="composition-admin-card">
      <header>
        <h3>{title}</h3>
      </header>
      <div className="composition-admin-card-body">{children}</div>
    </section>
  );
}

function ItemsGrid<T>({
  items,
  empty,
  render
}: {
  items: T[];
  empty: string;
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return <div className="composition-admin-grid">{items.map(render)}</div>;
}

export default async function AdminEditorialCompositionPage({ params }: CompositionPageProps) {
  const { matchdayId } = await params;
  const context = await readMatchdayContext(matchdayId);

  if (!context) {
    return (
      <main className="composition-admin-shell">
        <style>{compositionPageStyles}</style>
        <section className="composition-admin-panel">
          <header>
            <h2>Jornada nao encontrada</h2>
            <p>A composicao editorial so pode ser visualizada a partir de uma jornada existente.</p>
          </header>
        </section>
      </main>
    );
  }

  const { matchday, season, competition, country } = context;
  const [editorial, highlights, roundupItems, latestNews, articles] = await Promise.all([
    readMatchdayEditorial(matchday.id),
    readMatchdayHighlights(matchday.id),
    readMatchdayRoundupItems(matchday.id),
    readMatchdayLatestNews(matchday.id),
    readMatchdayArticles(matchday.id)
  ]);
  const publishedHighlights = highlights.filter((item) => item.status === "published");
  const publishedRoundupItems = roundupItems.filter((item) => item.status === "published");
  const publishedLatestNews = latestNews.filter((item) => item.status === "published");
  const publishedArticles = articles.filter((item) => item.status === "published");
  const latestZoneMode = editorial?.latest_zone_mode === "editorial_line" ? "Linha editorial" : "Ultimas noticias";
  const contextLabel = `${country?.name ?? "Pais"} / ${competition.name} / ${season.label} / ${matchday.label}`;

  return (
    <main className="composition-admin-shell">
      <style>{compositionPageStyles}</style>

      <section className="composition-admin-hero">
        <div>
          <p>Composicao editorial da jornada</p>
          <h1>Jornada {String(matchday.number).padStart(2, "0")}</h1>
          <span>{contextLabel}</span>
        </div>
        <nav className="composition-admin-actions" aria-label="Acoes de navegacao">
          <a className="composition-admin-button" href={`/admin/editorial/jornada/${matchday.id}`}>
            Backoffice editorial
          </a>
          <a className="composition-admin-button" href="/admin/gestor">
            Centro de gestao
          </a>
        </nav>
      </section>

      <div className="composition-admin-layout">
        <section className="composition-admin-panel">
          <header>
            <h2>Atualidade</h2>
            <p>Leitura do estado editorial atual da pagina da jornada. Esta area e apenas de consulta.</p>
          </header>
          <div className="composition-admin-stack">
            <Card title="Manchete atual">
              {editorial ? (
                <ItemCard
                  imageUrl={editorial.image_url}
                  title={editorial.title}
                  subtitle={editorial.summary}
                  meta={[statusLabel(editorial.status)]}
                />
              ) : (
                <EmptyState>Nao existe manchete editorial guardada para esta jornada.</EmptyState>
              )}
            </Card>

            <Card title="Destaques abaixo da manchete">
              <ItemsGrid
                items={highlights}
                empty="Nao existem destaques guardados."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.label}
                    title={item.title}
                    meta={[`Posicao ${item.sort_order}`, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Complemento da manchete">
              {editorial?.complementary_mode !== "none" ? (
                <ItemCard
                  imageUrl={editorial?.complementary_image_url}
                  label={editorial?.complementary_label}
                  title={editorial?.complementary_title}
                  subtitle={editorial?.complementary_text}
                  linkUrl={editorial?.complementary_link_url}
                  meta={[editorial?.complementary_mode, statusLabel(editorial?.complementary_status)]}
                />
              ) : (
                <EmptyState>O complemento da manchete esta sem modo ativo.</EmptyState>
              )}
            </Card>

            <Card title="Bloco lateral">
              {editorial?.side_block_status ? (
                <ItemCard
                  imageUrl={editorial?.side_block_image_url}
                  label={editorial?.side_block_label || editorial?.side_block_type}
                  title={editorial?.side_block_title}
                  subtitle={editorial?.side_block_text}
                  linkUrl={editorial?.side_block_link_url}
                  meta={[editorial?.side_block_author ? `Autor: ${editorial.side_block_author}` : null, statusLabel(editorial?.side_block_status)]}
                />
              ) : (
                <EmptyState>O bloco lateral ainda nao tem conteudo guardado.</EmptyState>
              )}
            </Card>

            <Card title="Resumo da jornada / videos">
              <ItemsGrid
                items={roundupItems}
                empty="Nao existem itens de resumo ou video."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.label || item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.video_url}
                    meta={[`Posicao ${item.sort_order}`, item.duration, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Zona editorial final">
              <div className="composition-admin-meta">
                <span>Modo atual: {latestZoneMode}</span>
                {editorial?.latest_zone_title ? <span>Titulo: {editorial.latest_zone_title}</span> : null}
              </div>
              <ItemsGrid
                items={latestNews}
                empty="Nao existem itens na zona editorial final."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.time_label}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.link_url}
                    meta={[`Posicao ${item.sort_order}`, item.article_id ? `Artigo: ${item.article_id}` : null, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>
          </div>
        </section>

        <section className="composition-admin-panel">
          <header>
            <h2>Arquivo / Memoria historica</h2>
            <p>Candidatos disponiveis para uma futura composicao historica. Ainda nao existem selecao nem gravacao.</p>
          </header>
          <div className="composition-admin-stack">
            <Card title="Manchete candidata">
              {editorial ? (
                <ItemCard
                  imageUrl={editorial.image_url}
                  title={editorial.title}
                  subtitle={editorial.summary}
                  meta={["Fonte: matchday_editorials", statusLabel(editorial.status)]}
                />
              ) : (
                <EmptyState>Nao ha manchete candidata guardada.</EmptyState>
              )}
            </Card>

            <Card title="Bloco lateral candidato">
              {editorial?.side_block_title || editorial?.side_block_text || editorial?.side_block_image_url ? (
                <ItemCard
                  imageUrl={editorial?.side_block_image_url}
                  label={editorial?.side_block_label || editorial?.side_block_type}
                  title={editorial?.side_block_title}
                  subtitle={editorial?.side_block_text}
                  linkUrl={editorial?.side_block_link_url}
                  meta={["Fonte: matchday_editorials", statusLabel(editorial?.side_block_status)]}
                />
              ) : (
                <EmptyState>Nao ha bloco lateral candidato guardado.</EmptyState>
              )}
            </Card>

            <Card title="Complemento candidato">
              {editorial?.complementary_title || editorial?.complementary_text || editorial?.complementary_image_url ? (
                <ItemCard
                  imageUrl={editorial?.complementary_image_url}
                  label={editorial?.complementary_label}
                  title={editorial?.complementary_title}
                  subtitle={editorial?.complementary_text}
                  linkUrl={editorial?.complementary_link_url}
                  meta={["Fonte: matchday_editorials", statusLabel(editorial?.complementary_status)]}
                />
              ) : (
                <EmptyState>Nao ha complemento candidato guardado.</EmptyState>
              )}
            </Card>

            <Card title="Destaques candidatos">
              <ItemsGrid
                items={publishedHighlights.length > 0 ? publishedHighlights : highlights}
                empty="Nao ha destaques candidatos."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.label}
                    title={item.title}
                    meta={["Fonte: matchday_highlights", `Posicao ${item.sort_order}`, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Cartoes disponiveis da Zona editorial final">
              <ItemsGrid
                items={publishedLatestNews.length > 0 ? publishedLatestNews : latestNews}
                empty="Nao ha cartoes disponiveis na zona editorial final."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.time_label}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.link_url}
                    meta={["Fonte: matchday_latest_news", `Posicao ${item.sort_order}`, item.article_id ? `Artigo: ${item.article_id}` : null, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Videos / resumo disponiveis">
              <ItemsGrid
                items={publishedRoundupItems.length > 0 ? publishedRoundupItems : roundupItems}
                empty="Nao ha videos ou resumos disponiveis."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    label={item.label || item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    linkUrl={item.video_url}
                    meta={["Fonte: matchday_roundup_items", `Posicao ${item.sort_order}`, item.duration, statusLabel(item.status)]}
                  />
                )}
              />
            </Card>

            <Card title="Artigos / noticias relacionados">
              <ItemsGrid
                items={publishedArticles.length > 0 ? publishedArticles : articles}
                empty="Nao ha artigos relacionados de forma direta com esta jornada."
                render={(item) => (
                  <ItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    title={item.title}
                    subtitle={item.summary}
                    linkUrl={item.source_url}
                    meta={["Fonte: articles", statusLabel(item.status), item.published_at ? `Publicado: ${new Date(item.published_at).toLocaleDateString("pt-PT")}` : null]}
                  />
                )}
              />
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
