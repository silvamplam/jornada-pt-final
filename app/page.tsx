import Link from "next/link";
import RoundupVideoSwitcher from "@/components/public/RoundupVideoSwitcher";
import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SiteEditorial = {
  id: string;
  slug: string;
  status: "draft" | "published";
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_title_color: string | null;
  below_headline_mode: "highlights" | "roundup" | null;
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
  complementary_mode: "none" | "complementary_story" | "roundup_video" | null;
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

type SiteHighlight = {
  id: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

type SiteRoundupItem = {
  id: string;
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

type SiteLatestNews = {
  id: string;
  time_label: string | null;
  title: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  status: "draft" | "published";
};

const competitionLinks = [
  { label: "Liga Portugal", href: "/competicoes/liga-portugal/2026-27/jornadas/1" },
  { label: "La Liga", href: "/competicoes/la-liga/2026-27/jornadas/1" },
  { label: "Premier League", href: "/competicoes/premier-league/2026-27/jornadas/1" }
];

const fallbackHighlights = [
  {
    id: "fallback-highlight-1",
    label: "Antevisao",
    title: "Os temas fortes antes da bola rolar",
    subtitle: "",
    image_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80",
    link_url: null
  },
  {
    id: "fallback-highlight-2",
    label: "Ambiente",
    title: "A jornada vista pelas bancadas e pelos protagonistas",
    subtitle: "",
    image_url: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=700&q=80",
    link_url: null
  },
  {
    id: "fallback-highlight-3",
    label: "Contexto",
    title: "O futebol contado antes, durante e depois do jogo",
    subtitle: "",
    image_url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=700&q=80",
    link_url: null
  }
];

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sideBlockTypeLabel(type: string | null | undefined) {
  const labels: Record<string, string> = {
    opiniao: "OPINIAO",
    arbitragem: "ARBITRAGEM",
    balanco: "BALANCO",
    analise: "ANALISE",
    cronica: "CRONICA",
    "figura-da-jornada": "FIGURA"
  };

  return type ? labels[type] ?? type.toUpperCase() : null;
}

async function readHomeEditorial() {
  const editorials = await fetchSupabaseAdminTable<SiteEditorial>(
    "site_editorials?select=id,slug,status,headline_title,headline_subtitle,headline_image_url,headline_title_color,below_headline_mode,below_headline_heading,below_headline_heading_color,side_block_status,side_block_type,side_block_label,side_block_title,side_block_title_color,side_block_author,side_block_text,side_block_image_url,side_block_link_url,complementary_mode,complementary_roundup_item_id,complementary_label,complementary_title,complementary_text,complementary_image_url,complementary_link_url,complementary_status,roundup_video_heading,roundup_video_heading_color&slug=eq.home&limit=1"
  ).catch(() => []);

  return editorials[0] ?? null;
}

async function readHomeHighlights(siteEditorialId: string) {
  return fetchSupabaseAdminTable<SiteHighlight>(
    `site_editorial_highlights?select=id,label,title,subtitle,image_url,link_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&status=eq.published&order=sort_order.asc&limit=3`
  ).catch(() => []);
}

async function readHomeRoundupItems(siteEditorialId: string) {
  return fetchSupabaseAdminTable<SiteRoundupItem>(
    `site_editorial_roundup_items?select=id,sort_order,label,title,subtitle,image_url,video_url,duration,type,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&status=eq.published&order=sort_order.asc&limit=20`
  ).catch(() => []);
}

async function readHomeLatestNews(siteEditorialId: string) {
  return fetchSupabaseAdminTable<SiteLatestNews>(
    `site_editorial_latest_news?select=id,time_label,title,link_url,image_url,sort_order,status&site_editorial_id=eq.${encodeURIComponent(siteEditorialId)}&status=eq.published&order=sort_order.asc&limit=8`
  ).catch(() => []);
}

function HighlightCard({
  item
}: {
  item: Pick<SiteHighlight, "id" | "label" | "title" | "subtitle" | "image_url" | "link_url">;
}) {
  const body = (
    <>
      <div className="public-highlight-image">{item.image_url ? <img src={item.image_url} alt="" /> : null}</div>
      {item.label ? <span>{item.label}</span> : null}
      <strong>{item.title}</strong>
      {item.subtitle ? <small>{item.subtitle}</small> : null}
    </>
  );

  return item.link_url ? (
    <a className="public-cover-story" href={item.link_url}>
      {body}
    </a>
  ) : (
    <article className="public-cover-story">{body}</article>
  );
}

export default async function HomePage() {
  const editorial = await readHomeEditorial();
  const [highlights, roundupItems, latestNews] = editorial
    ? await Promise.all([
        readHomeHighlights(editorial.id),
        readHomeRoundupItems(editorial.id),
        readHomeLatestNews(editorial.id)
      ])
    : [[], [], []];
  const headlineIsPublished = editorial?.status === "published";
  const headlineTitle = headlineIsPublished ? cleanText(editorial.headline_title) : null;
  const headlineSubtitle = headlineIsPublished ? cleanText(editorial.headline_subtitle) : null;
  const headlineImageUrl = headlineIsPublished ? cleanText(editorial.headline_image_url) : null;
  const headlineTitleColor = headlineIsPublished ? cleanText(editorial.headline_title_color) : null;
  const belowHeadlineMode = editorial?.below_headline_mode === "roundup" ? "roundup" : "highlights";
  const belowHeadlineHeading =
    cleanText(editorial?.below_headline_heading) || (belowHeadlineMode === "roundup" ? "Resumo da Jornada" : "Destaques");
  const belowHeadlineHeadingColor = cleanText(editorial?.below_headline_heading_color);
  const hasPublishedSideBlock =
    editorial?.side_block_status === "published" &&
    Boolean(cleanText(editorial.side_block_title) || cleanText(editorial.side_block_text));
  const sideBlockLabel = cleanText(editorial?.side_block_label) || sideBlockTypeLabel(editorial?.side_block_type);
  const sideBlockTitle = cleanText(editorial?.side_block_title);
  const sideBlockText = cleanText(editorial?.side_block_text);
  const sideBlockAuthor = cleanText(editorial?.side_block_author);
  const sideBlockImageUrl = cleanText(editorial?.side_block_image_url);
  const sideBlockLinkUrl = cleanText(editorial?.side_block_link_url);
  const sideBlockTitleColor = cleanText(editorial?.side_block_title_color);
  const complementaryMode = editorial?.complementary_mode ?? "none";
  const hasComplementaryStory =
    complementaryMode === "complementary_story" &&
    editorial?.complementary_status === "published" &&
    Boolean(cleanText(editorial.complementary_title) || cleanText(editorial.complementary_text));
  const visibleHighlights = highlights.length > 0 ? highlights : fallbackHighlights;
  const hasRoundupVideoBlock = (belowHeadlineMode === "roundup" || complementaryMode === "roundup_video") && roundupItems.length > 0;

  return (
    <main className="public-matchday-shell">
      <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
          Jornada<span>.pt</span>
        </Link>
        <nav className="public-site-menu" aria-label="Competições principais">
          {competitionLinks.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#jogos">Jogos</Link>
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#classificacao">Classificacao</Link>
        </nav>
        <div className="public-site-actions" aria-label="Acoes">
          <button type="button" aria-label="Pesquisar">⌕</button>
          <Link href="/admin/login">Entrar</Link>
        </div>
      </header>
      </div>

      <section className="public-matchday-panel" aria-label="Capa da jornada">
        <div className="public-matchday-cover">
          <aside className="public-matchday-feature public-side-editorial-block" aria-label="Bloco editorial lateral">
            <div className="public-side-editorial-inner">
              {hasPublishedSideBlock ? (
                <>
                  {sideBlockImageUrl ? (
                    <div className="public-side-editorial-image">
                      <img src={sideBlockImageUrl} alt="" />
                    </div>
                  ) : null}
                  <div className="public-side-editorial-copy">
                    {sideBlockLabel ? <span>{sideBlockLabel}</span> : null}
                    {sideBlockTitle ? (
                      sideBlockLinkUrl ? (
                        <a className="public-side-editorial-title-link" href={sideBlockLinkUrl}>
                          <strong style={sideBlockTitleColor ? { color: sideBlockTitleColor } : undefined}>{sideBlockTitle}</strong>
                        </a>
                      ) : (
                        <strong style={sideBlockTitleColor ? { color: sideBlockTitleColor } : undefined}>{sideBlockTitle}</strong>
                      )
                    ) : null}
                    {sideBlockAuthor ? <small>Por {sideBlockAuthor}</small> : null}
                    {sideBlockText ? <p>{sideBlockText}</p> : null}
                    {sideBlockLinkUrl ? (
                      <a className="public-editorial-more-link" href={sideBlockLinkUrl}>
                        Ler mais <span aria-hidden="true">›</span>
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="public-side-editorial-placeholder">Espaco editorial por definir</div>
              )}
            </div>
          </aside>

          <div className="public-matchday-main-column">
            <article className="public-matchday-editorial">
              <div className="public-cover-headline">
                {headlineImageUrl ? (
                  <div className="public-editorial-main-image">
                    <img src={headlineImageUrl} alt="" />
                  </div>
                ) : null}
                <div>
                  <h1 style={headlineTitleColor ? { color: headlineTitleColor } : undefined}>
                    {headlineTitle || "Jornada.pt"}
                  </h1>
                  <p>
                    {headlineSubtitle ||
                      "A capa editorial do futebol, pronta para acompanhar os grandes temas antes, durante e depois dos jogos."}
                  </p>
                </div>
              </div>
            </article>

            <div className="public-matchday-main-lower">
              {hasRoundupVideoBlock ? (
                <RoundupVideoSwitcher
                  heading={editorial?.roundup_video_heading ?? null}
                  headingColor={editorial?.roundup_video_heading_color ?? null}
                  initialItemId={editorial?.complementary_roundup_item_id ?? null}
                  items={roundupItems}
                />
              ) : (
                <>
                  <section className={`public-matchday-roundup public-below-headline-${belowHeadlineMode} public-editorial-flex-block`} data-editorial-slot="resumo-ou-noticias" aria-label="Zona editorial abaixo da manchete">
                    <div className="public-editorial-block-head">
                      <span style={belowHeadlineHeadingColor ? { color: belowHeadlineHeadingColor } : undefined}>{belowHeadlineHeading}</span>
                    </div>
                    <div className="public-cover-story-strip">
                      {visibleHighlights.slice(0, 3).map((item) => <HighlightCard item={item} key={item.id} />)}
                    </div>
                  </section>

                <aside className="public-matchday-cover-side public-editorial-flex-block public-below-headline-side" data-editorial-slot="video-ou-imagem-noticia" aria-label="Bloco complementar">
                  {hasComplementaryStory && editorial ? (
                    <>
                      {editorial.complementary_image_url ? (
                        <div className="public-complement-media">
                          <img src={editorial.complementary_image_url} alt="" />
                        </div>
                      ) : null}
                      <div className="public-complement-body">
                        {editorial.complementary_label ? <span>{editorial.complementary_label}</span> : null}
                        {editorial.complementary_title ? (
                          editorial.complementary_link_url ? (
                            <a className="public-complement-title-link" href={editorial.complementary_link_url}>
                              <strong>{editorial.complementary_title}</strong>
                            </a>
                          ) : (
                            <strong>{editorial.complementary_title}</strong>
                          )
                        ) : null}
                        {editorial.complementary_text ? <p>{editorial.complementary_text}</p> : null}
                        {editorial.complementary_link_url ? (
                          <a className="public-editorial-more-link" href={editorial.complementary_link_url}>
                            Ver mais <span aria-hidden="true">›</span>
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="public-complement-body">
                      <strong>Leitura editorial</strong>
                      <p>O complemento da capa fica reservado para a proxima historia publicada.</p>
                    </div>
                  )}
                </aside>
                </>
              )}
            </div>
          </div>

          <aside className="public-matchday-news" aria-label="Ultimas noticias">
            <h3>Ultimas noticias</h3>
            <ul className="public-news-list">
              {latestNews.map((item) => (
                <li className="public-news-item" key={item.id}>
                  {item.image_url ? (
                    <div className="public-news-thumb">
                      <img src={item.image_url} alt="" />
                    </div>
                  ) : null}
                  <div className="public-news-copy">
                    {item.time_label ? <time dateTime={item.time_label}>{item.time_label}</time> : null}
                    {item.link_url ? (
                      <a className="public-news-title" href={item.link_url}>{item.title}</a>
                    ) : (
                      <span className="public-news-title">{item.title}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <style>{`
        .public-home {
          min-height: 100vh;
          background: #eef2f6;
          color: #111820;
          font-family: Arial, Helvetica, sans-serif;
        }

        .public-site-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 26px;
          min-height: 72px;
          padding: 0 32px;
          border-bottom: 1px solid #dce3eb;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
        }

        .public-brand {
          color: #111820;
          font-size: 25px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .public-brand span,
        .public-nav a:hover,
        .public-actions a:hover {
          color: #e5252a;
        }

        .public-nav {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
          overflow-x: auto;
          font-size: 13px;
          font-weight: 900;
        }

        .public-nav a,
        .public-actions a {
          color: #2f3843;
          text-decoration: none;
          white-space: nowrap;
        }

        .public-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          font-weight: 900;
        }

        .public-actions button {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid #cbd5df;
          border-radius: 50%;
          background: #ffffff;
          color: #111820;
          font-size: 19px;
          cursor: pointer;
        }

        .public-home-panel {
          max-width: 1360px;
          margin: 0 auto;
          padding: 24px 28px 52px;
        }

        .public-home-cover {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: stretch;
        }

        .public-side-editorial-block,
        .public-home-editorial,
        .public-home-roundup,
        .public-home-cover-side,
        .public-home-news,
        .public-roundup-video-panel {
          overflow: hidden;
          border: 1px solid #dce3eb;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
        }

        .public-side-editorial-inner {
          display: grid;
          min-height: 100%;
        }

        .public-side-editorial-image,
        .public-editorial-main-image,
        .home-highlight-image,
        .public-complement-media,
        .public-news-thumb {
          overflow: hidden;
          background: #dce3eb;
        }

        .public-side-editorial-image img,
        .public-editorial-main-image img,
        .home-highlight-image img,
        .public-complement-media img,
        .public-news-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .public-side-editorial-image {
          height: 210px;
        }

        .public-side-editorial-copy,
        .public-side-placeholder {
          display: grid;
          gap: 12px;
          align-content: start;
          padding: 20px;
        }

        .public-side-editorial-copy span,
        .public-complement-body span,
        .public-editorial-block-head span,
        .home-cover-story > span {
          color: #e5252a;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-side-editorial-copy strong,
        .public-complement-body strong {
          display: block;
          color: #111820;
          font-size: 24px;
          line-height: 1.05;
        }

        .public-side-editorial-copy small,
        .public-side-editorial-copy p,
        .public-complement-body p,
        .home-cover-story small {
          color: #5d6875;
          line-height: 1.45;
        }

        .public-more-link,
        .public-title-link,
        .home-cover-story {
          color: inherit;
          text-decoration: none;
        }

        .public-more-link {
          width: fit-content;
          color: #e5252a;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-side-placeholder {
          min-height: 240px;
          place-items: center;
          color: #687380;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-home-main-column {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .public-cover-headline {
          position: relative;
          display: grid;
          min-height: 440px;
          color: #ffffff;
          background: #10151b;
        }

        .public-editorial-main-image {
          position: absolute;
          inset: 0;
        }

        .public-editorial-main-image::after {
          position: absolute;
          inset: 0;
          content: "";
          background: linear-gradient(90deg, rgba(8, 12, 18, 0.9), rgba(8, 12, 18, 0.58), rgba(8, 12, 18, 0.2));
        }

        .public-cover-headline > div:last-child {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 18px;
          align-content: end;
          max-width: 760px;
          padding: 44px;
        }

        .public-cover-headline h1 {
          margin: 0;
          color: #ffffff;
          font-size: 64px;
          line-height: 0.96;
          letter-spacing: 0;
        }

        .public-cover-headline p {
          max-width: 650px;
          margin: 0;
          color: rgba(255, 255, 255, 0.88);
          font-size: 19px;
          line-height: 1.5;
        }

        .public-home-main-lower {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.58fr);
          gap: 18px;
          align-items: stretch;
        }

        .public-home-main-lower:has(.public-roundup-video-panel) {
          grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
          --public-roundup-video-top-offset: 28px;
          --public-roundup-visible-list-height: 285px;
          --public-roundup-scroll-control-height: 14px;
        }

        .public-roundup-video-layout {
          display: grid;
          grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
          grid-column: 1 / -1;
        }

        .public-matchday-roundup {
          --public-roundup-visible-list-height: 285px;
          --public-roundup-scroll-control-height: 14px;
          overflow: hidden;
          border: 1px solid #dce3eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .public-matchday-roundup .public-editorial-block-head {
          margin-bottom: 0;
        }

        .public-roundup-scroll-frame {
          position: relative;
          overflow: visible;
        }

        .public-roundup-scroll-window {
          display: grid;
          gap: 0;
          max-height: var(--public-roundup-visible-list-height);
          overflow-y: auto;
        }

        .public-roundup-has-scroll .public-roundup-scroll-window {
          height: var(--public-roundup-visible-list-height);
        }

        .public-roundup-scroll-window::-webkit-scrollbar {
          width: 6px;
        }

        .public-roundup-scroll-window::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cbd5df;
        }

        .public-roundup-scroll-button {
          position: absolute;
          z-index: 2;
          left: 0;
          right: 0;
          display: grid;
          place-items: center;
          height: var(--public-roundup-scroll-control-height);
          border: 0;
          background: rgba(255, 255, 255, 0.94);
          color: #526174;
          cursor: pointer;
        }

        .public-roundup-scroll-button-top {
          top: 0;
        }

        .public-roundup-scroll-button-bottom {
          bottom: 0;
        }

        .public-roundup-switch-item {
          display: grid;
          width: 100%;
          min-height: calc(var(--public-roundup-visible-list-height) / 5);
          padding: 12px 0;
          border: 0;
          border-bottom: 1px solid #e6ebf1;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .public-roundup-switch-item:last-child {
          border-bottom: 0;
        }

        .public-roundup-meta {
          display: flex;
          align-items: center;
          color: #e5252a;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-roundup-duration {
          color: #5d6875;
          font-size: 12px;
          font-weight: 900;
        }

        .public-roundup-arrow {
          display: grid;
          place-items: center;
          align-self: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #eef2f6;
          color: #e5252a;
          font-size: 18px;
          font-weight: 900;
        }

        .public-roundup-video-panel {
          padding: 0;
        }

        .public-roundup-video-block {
          display: grid;
          min-height: 100%;
        }

        .public-complement-media {
          position: relative;
          min-height: 190px;
        }

        .public-roundup-video-panel .public-complement-media {
          aspect-ratio: 16 / 9;
          min-height: 0;
        }

        .public-roundup-video-panel iframe {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 260px;
          border: 0;
        }

        .home-media-play {
          position: absolute;
          inset: 50% auto auto 50%;
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(229, 37, 42, 0.92);
          color: #ffffff;
          transform: translate(-50%, -50%);
        }

        .public-media-play-icon-only {
          position: absolute;
          inset: 50% auto auto 50%;
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(229, 37, 42, 0.92);
          transform: translate(-50%, -50%);
        }

        .public-media-play-icon-only::before {
          content: "";
          width: 0;
          height: 0;
          margin-left: 3px;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 13px solid #ffffff;
        }

        .public-roundup-active-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #e5252a;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-complement-body {
          display: grid;
          gap: 12px;
          align-content: start;
          padding: 20px;
        }

        .public-home-roundup {
          padding: 18px;
        }

        .public-editorial-block-head {
          margin-bottom: 14px;
        }

        .public-cover-story-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .home-cover-story {
          position: relative;
          display: grid;
          gap: 9px;
          align-content: start;
          min-width: 0;
        }

        .home-highlight-image {
          position: relative;
          aspect-ratio: 16 / 10;
          border-radius: 6px;
        }

        .home-cover-story strong {
          color: #111820;
          font-size: 18px;
          line-height: 1.16;
        }

        .public-home-cover-side {
          min-height: 100%;
        }

        .public-home-news {
          padding: 20px;
        }

        .public-home-news h2 {
          margin: 0 0 16px;
          font-size: 20px;
          text-transform: uppercase;
        }

        .public-news-list {
          display: grid;
          gap: 0;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .public-news-item {
          display: grid;
          grid-template-columns: 74px minmax(0, 1fr);
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid #e6ebf1;
        }

        .public-news-item:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .public-news-thumb {
          aspect-ratio: 1 / 0.78;
          border-radius: 5px;
        }

        .public-news-copy {
          display: grid;
          gap: 5px;
          align-content: start;
        }

        .public-news-copy time {
          color: #e5252a;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-news-copy a,
        .public-news-copy span {
          color: #111820;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.25;
          text-decoration: none;
        }

        @media (max-width: 1100px) {
          .public-home-cover,
          .public-home-main-lower,
          .public-home-main-lower:has(.public-roundup-video-panel),
          .public-roundup-video-layout {
            grid-template-columns: 1fr;
          }

          .public-side-editorial-block {
            order: 2;
          }

          .public-home-news {
            order: 3;
          }
        }

        @media (max-width: 780px) {
          .public-site-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
            padding: 16px 20px;
          }

          .public-actions {
            position: absolute;
            top: 14px;
            right: 20px;
          }

          .public-home-panel {
            padding: 16px 14px 36px;
          }

          .public-cover-headline {
            min-height: 410px;
          }

          .public-cover-headline > div:last-child {
            padding: 28px;
          }

          .public-cover-headline h1 {
            font-size: 46px;
          }

          .public-cover-story-strip {
            grid-template-columns: 1fr;
          }
        }

        .public-matchday-shell {
          min-height: 100vh;
          padding: 0 24px 28px;
          overflow-x: hidden;
          background: #ffffff;
          color: #10151b;
          font-family: Arial, Helvetica, sans-serif;
        }

        .public-top-stack {
          position: sticky;
          top: 0;
          z-index: 20;
          margin: 0 -24px;
          padding: 0 24px;
          border-bottom: 1px solid #d8dee6;
          background: #ffffff;
        }

        .public-site-topbar {
          display: flex;
          align-items: center;
          gap: 26px;
          min-height: 72px;
        }

        .public-site-brand {
          color: #111820;
          font-size: 25px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .public-site-brand span,
        .public-site-menu a:hover,
        .public-site-actions a:hover {
          color: #e5252a;
        }

        .public-site-menu {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
          overflow-x: auto;
          font-size: 13px;
          font-weight: 900;
        }

        .public-site-menu a,
        .public-site-actions a {
          color: #2f3843;
          text-decoration: none;
          white-space: nowrap;
        }

        .public-site-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          font-weight: 900;
        }

        .public-site-actions button {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid #cbd5df;
          border-radius: 50%;
          background: #ffffff;
          color: #111820;
          font-size: 0;
          cursor: pointer;
        }

        .public-site-actions button::before {
          content: "⌕";
          font-size: 19px;
        }

        .public-matchday-panel {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }

        .public-matchday-cover {
          --public-cover-rule-color: #10151b;
          --public-cover-rule-gap: 8px;
          --public-cover-rule-size: 4px;
          display: grid;
          grid-template-columns: minmax(220px, 240px) minmax(0, 1fr) minmax(240px, 280px);
          grid-template-areas: "feature main news";
          gap: 24px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 20px 0;
          align-items: stretch;
          min-height: 420px;
        }

        .public-matchday-editorial,
        .public-matchday-feature,
        .public-matchday-main-column,
        .public-matchday-roundup,
        .public-matchday-cover-side,
        .public-matchday-news {
          display: grid;
          gap: 10px;
          align-content: start;
          min-width: 0;
          box-sizing: border-box;
          padding: 16px;
          border: 1px solid #dfe5ec;
          background: #ffffff;
        }

        .public-matchday-main-column {
          grid-area: main;
          gap: 8px;
          padding: 0;
          border: 0;
          grid-template-rows: auto 1fr;
        }

        .public-matchday-editorial {
          align-content: start;
          min-height: 0;
          padding: 0;
          border: 0;
        }

        .public-matchday-feature {
          grid-area: feature;
          padding: 0 14px 14px;
        }

        .public-matchday-news {
          grid-area: news;
          min-height: 100%;
          padding-top: 0;
        }

        .public-side-editorial-inner {
          display: grid;
          gap: 12px;
          align-content: start;
          min-width: 0;
        }

        .public-side-editorial-image {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 6px;
          background: #eef2f6;
        }

        .public-side-editorial-image img,
        .public-editorial-main-image img,
        .public-highlight-image img,
        .public-complement-media img,
        .public-news-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .public-side-editorial-copy,
        .public-side-editorial-placeholder,
        .public-complement-body {
          display: grid;
          gap: 10px;
          align-content: start;
          min-width: 0;
        }

        .public-side-editorial-copy span,
        .public-editorial-block-head span,
        .public-cover-story > span,
        .public-complement-label,
        .public-complement-body span {
          color: #c40012;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .public-side-editorial-copy strong,
        .public-complement-body strong {
          color: #10151b;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          line-height: 1.05;
        }

        .public-side-editorial-copy p,
        .public-side-editorial-copy small,
        .public-complement-body p,
        .public-cover-story small {
          margin: 0;
          color: #526174;
          font-size: 13px;
          line-height: 1.45;
        }

        .public-side-editorial-title-link,
        .public-complement-title-link,
        .public-cover-story,
        .public-editorial-more-link {
          color: inherit;
          text-decoration: none;
        }

        .public-editorial-more-link {
          width: fit-content;
          color: #c40012;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-editorial-more-link span {
          font-size: 0;
        }

        .public-editorial-more-link span::before {
          content: "›";
          font-size: 11px;
        }

        .public-side-editorial-placeholder {
          min-height: 180px;
          place-items: center;
          color: #687380;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-cover-headline {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.95fr);
          gap: 18px;
          align-items: start;
          min-height: 0;
          color: #10151b;
          background: #ffffff;
        }

        .public-editorial-main-image {
          position: relative;
          inset: auto;
          width: 100%;
          min-height: 0;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-radius: 6px;
          background: #eef2f6;
        }

        .public-editorial-main-image::after {
          display: none;
        }

        .public-cover-headline > div:last-child {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 14px;
          align-content: start;
          max-width: 100%;
          padding: 0;
        }

        .public-cover-headline h1 {
          margin: 0;
          color: #c40012;
          font-family: Georgia, "Times New Roman", serif;
          max-width: 100%;
          font-size: 44px;
          line-height: 1.02;
          letter-spacing: 0;
        }

        .public-cover-headline p {
          max-width: 100%;
          margin: 0;
          color: #526174;
          font-size: 15px;
          line-height: 1.48;
        }

        .public-matchday-main-lower {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 0.54fr);
          gap: 8px;
          align-items: stretch;
          min-height: 0;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) {
          grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
          --public-roundup-video-top-offset: 28px;
          --public-roundup-visible-list-height: 285px;
          --public-roundup-scroll-control-height: 14px;
        }

        .public-roundup-video-layout {
          display: grid;
          grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
          gap: 8px;
          align-items: start;
          grid-column: 1 / -1;
        }

        .public-editorial-block-head {
          margin-bottom: 0;
        }

        .public-cover-story-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .public-cover-story {
          position: relative;
          display: grid;
          gap: 8px;
          align-content: start;
          min-width: 0;
        }

        .public-highlight-image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-radius: 6px;
          background: #eef2f6;
        }

        .public-cover-story strong {
          color: #10151b;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.16;
        }

        .public-complement-media {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          min-height: 0;
          overflow: hidden;
          border-radius: 6px;
          background: #eef2f6;
        }

        .public-roundup-video-panel {
          padding: 0;
        }

        .public-roundup-video-panel .public-complement-media {
          border-radius: 0;
        }

        .public-matchday-news h3 {
          margin: 0 0 12px;
          color: #10151b;
          font-size: 18px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-news-list {
          display: grid;
          gap: 0;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .public-news-item {
          display: grid;
          grid-template-columns: 68px minmax(0, 1fr);
          gap: 10px;
          padding: 11px 0;
          border-top: 1px solid #e6ebf1;
        }

        .public-news-item:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .public-news-thumb {
          aspect-ratio: 1 / 0.78;
          overflow: hidden;
          border-radius: 5px;
          background: #eef2f6;
        }

        .public-news-copy {
          display: grid;
          gap: 5px;
          align-content: start;
        }

        .public-news-copy time {
          color: #c40012;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .public-news-title {
          color: #10151b;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.25;
          text-decoration: none;
        }

        @media (max-width: 1100px) {
          .public-matchday-cover,
          .public-matchday-main-lower,
          .public-matchday-main-lower:has(.public-roundup-video-panel),
          .public-roundup-video-layout {
            grid-template-columns: 1fr;
            grid-template-areas: none;
          }

          .public-matchday-feature {
            order: 2;
          }

          .public-matchday-news {
            order: 3;
          }
        }

        @media (max-width: 780px) {
          .public-matchday-shell {
            padding: 0 14px 28px;
          }

          .public-top-stack {
            margin: 0 -14px;
            padding: 0 14px;
          }

          .public-site-topbar {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
            padding: 16px 0;
          }

          .public-site-actions {
            position: absolute;
            top: 14px;
            right: 14px;
          }

          .public-cover-headline,
          .public-cover-story-strip {
            grid-template-columns: 1fr;
          }

          .public-cover-headline h1 {
            font-size: 36px;
          }
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) {
          --public-roundup-top-align: 0px;
          --public-roundup-video-top-offset: 28px;
          --public-roundup-scroll-control-height: 14px;
          --public-roundup-visible-list-height: 285px;
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
        }

        .public-roundup-video-layout {
          display: grid;
          grid-column: 1 / -1;
          grid-template-columns: minmax(0, 340px) minmax(0, 372px);
          justify-content: end;
          gap: 14px;
          align-items: stretch;
          width: 100%;
          min-width: 0;
        }

        .public-roundup-video-layout > .public-matchday-roundup {
          justify-self: end;
          width: min(100%, 340px);
          margin-right: 0;
          margin-left: auto;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup,
        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-roundup-video-panel {
          border: 0;
          background: transparent;
          height: 100%;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup {
          --public-roundup-visible-list-height: 285px;
          grid-column: 1;
          grid-row: 1;
          grid-template-rows: auto 1fr;
          align-content: stretch;
          justify-self: end;
          width: min(100%, 340px);
          margin-right: 0;
          margin-left: auto;
          padding: var(--public-roundup-top-align) 6px 0 0;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-roundup-video-panel {
          grid-column: 2;
          grid-row: 1;
        }

        .public-matchday-roundup .public-roundup-scroll-window {
          height: 100%;
          max-height: var(--public-roundup-visible-list-height);
          overflow-y: auto;
          scroll-behavior: smooth;
          scrollbar-color: rgba(96, 112, 134, 0.32) transparent;
          scrollbar-width: thin;
        }

        .public-roundup-has-scroll .public-roundup-scroll-window {
          height: var(--public-roundup-visible-list-height);
          max-height: var(--public-roundup-visible-list-height);
          padding-right: 4px;
          box-sizing: border-box;
          scrollbar-gutter: stable;
        }

        .public-matchday-roundup .public-roundup-scroll-window::-webkit-scrollbar {
          width: 4px;
        }

        .public-matchday-roundup .public-roundup-scroll-window::-webkit-scrollbar-track {
          background: transparent;
        }

        .public-matchday-roundup .public-roundup-scroll-window::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(96, 112, 134, 0.28);
        }

        .public-roundup-scroll-button {
          position: absolute;
          right: 4px;
          left: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          width: auto;
          height: var(--public-roundup-scroll-control-height);
          border: 0;
          border-radius: 0;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), #f5f7fa 18%, #f5f7fa 82%, rgba(255, 255, 255, 0));
          color: #526174;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
          box-shadow: none;
        }

        .public-roundup-scroll-button-top {
          top: 0;
          border-bottom: 1px solid #edf2f7;
        }

        .public-roundup-scroll-button-bottom {
          bottom: 0;
          border-top: 1px solid #edf2f7;
        }

        .public-matchday-roundup .public-cover-story {
          grid-template-columns: 44px minmax(0, 1fr) auto auto;
          gap: 2px 9px;
          align-items: center;
          box-sizing: border-box;
          min-height: 56px;
          padding: 5px 0;
          border-bottom: 1px solid #e6ebf1;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-cover-story {
          min-height: calc(var(--public-roundup-visible-list-height) / 5);
          gap: 3px 14px;
          padding: 7px 6px;
          border-bottom-color: #edf2f7;
        }

        .public-roundup-has-scroll .public-cover-story {
          min-height: calc(var(--public-roundup-visible-list-height) / 5);
        }

        .public-matchday-roundup .public-cover-story span,
        .public-matchday-roundup .public-cover-story strong,
        .public-matchday-roundup .public-cover-story small {
          min-width: 0;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-roundup-switch-play {
          grid-column: 1 / 2;
          grid-row: 1 / 4;
          align-self: center;
          justify-self: start;
        }

        .public-matchday-roundup .public-cover-story .public-roundup-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          grid-column: 2 / 5;
          grid-row: 1 / 2;
          width: 100%;
          min-width: 0;
          line-height: 1;
        }

        .public-matchday-roundup .public-cover-story .public-roundup-meta span {
          grid-column: auto;
          grid-row: auto;
          min-width: 0;
        }

        .public-matchday-roundup .public-cover-story strong {
          grid-column: 2 / 3;
          grid-row: 2 / 3;
          font-size: 13px;
          line-height: 1.1;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-cover-story strong {
          grid-column: 2 / 4;
          font-size: 13.5px;
          line-height: 1.14;
        }

        .public-matchday-roundup .public-cover-story small {
          grid-column: 2 / 5;
          grid-row: 3 / 4;
          color: #607086;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.15;
        }

        .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-cover-story small {
          color: #6b7786;
          line-height: 1.2;
        }

        .public-roundup-duration,
        .public-roundup-arrow {
          color: #263241;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .public-roundup-duration {
          justify-self: end;
        }

        .public-roundup-arrow {
          grid-column: 4 / 5;
          grid-row: 2 / 3;
          text-decoration: none;
        }

        .public-roundup-switch-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .public-roundup-switch-item[aria-pressed="true"] {
          border-radius: 4px;
          background: #f8fafc;
          outline: 1px solid #dde5ed;
          outline-offset: -1px;
          box-shadow: inset 2px 0 0 rgba(96, 112, 134, 0.36), 0 1px 4px rgba(16, 21, 27, 0.03);
        }

        .public-roundup-video-panel {
          align-self: stretch;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          padding: var(--public-roundup-video-top-offset) 0 0;
        }

        .public-roundup-video-block {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 372px;
          margin-left: auto;
          overflow: hidden;
        }

        .public-roundup-video-panel .public-complement-media {
          width: 100%;
          max-height: 210px;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .public-roundup-video-panel .public-roundup-active-body {
          gap: 4px;
          width: 100%;
          box-sizing: border-box;
          padding: 7px 0 0;
        }

        .public-roundup-active-meta {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eef2f6;
          color: #263241;
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
          text-transform: uppercase;
        }

        .public-roundup-active-meta span:last-child {
          color: #607086;
          white-space: nowrap;
        }

        .public-roundup-video-panel .public-complement-body strong {
          margin-top: 2px;
          font-size: 16.5px;
        }

        .public-roundup-video-panel .public-complement-body p {
          max-width: 96%;
          color: #526174;
          line-height: 1.28;
        }

        @media (max-width: 1100px) {
          .public-matchday-main-lower:has(.public-roundup-video-panel),
          .public-roundup-video-layout {
            grid-template-columns: 1fr;
          }

          .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup,
          .public-matchday-main-lower:has(.public-roundup-video-panel) .public-roundup-video-panel {
            grid-column: auto;
            grid-row: auto;
          }

          .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup {
            justify-self: stretch;
            width: 100%;
            margin-left: 0;
          }
        }

        .public-roundup-video-layout {
          position: relative;
        }

        .public-roundup-video-layout .public-roundup-zone-heading {
          position: absolute;
          top: calc(var(--public-roundup-video-top-offset, 28px) + 10px);
          left: 0;
          display: grid;
          gap: 2px;
          color: #0b1f3a;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          pointer-events: none;
        }

        .public-roundup-video-layout .public-roundup-zone-heading span + span {
          opacity: 0.72;
        }

        .public-roundup-video-layout .public-roundup-video-panel {
          padding-top: calc(var(--public-roundup-video-top-offset, 28px) + 3px);
        }

        .public-roundup-video-layout .public-matchday-roundup,
        .public-roundup-video-layout .public-roundup-scroll-frame,
        .public-roundup-video-layout .public-roundup-scroll-window,
        .public-roundup-video-layout .public-cover-story-strip {
          border-color: transparent !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .public-roundup-video-layout .public-matchday-roundup {
          overflow: visible !important;
        }

        .public-roundup-video-layout .public-roundup-scroll-frame {
          border-top: 0 !important;
          border-bottom: 0 !important;
          overflow: visible !important;
        }

        .public-roundup-video-layout .public-roundup-compact-list .public-roundup-scroll-frame {
          height: auto !important;
          min-height: 0 !important;
        }

        .public-roundup-video-layout .public-roundup-compact-list .public-roundup-scroll-window {
          height: auto !important;
          max-height: none !important;
          min-height: 0 !important;
          align-content: start !important;
          grid-auto-rows: auto;
          overflow-y: visible;
        }

        .public-roundup-video-layout .public-roundup-inline-head-spacer {
          visibility: hidden;
          min-height: 22px;
          pointer-events: none;
        }

        .public-roundup-video-layout .public-roundup-scroll-window {
          margin-left: -38px;
          padding-left: 38px;
          overflow-x: visible !important;
        }

        .public-roundup-video-layout .public-roundup-switch-item {
          position: relative;
          border-radius: 0;
          background: #ffffff;
          box-shadow: none;
        }

        .public-roundup-video-layout .public-roundup-switch-item:hover {
          background: #fbfcfd;
        }

        .public-roundup-video-layout .public-roundup-switch-item[aria-pressed="true"] {
          background: #ffffff;
          outline: 0;
          box-shadow: none;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-roundup-switch-item {
          grid-template-columns: 30px minmax(0, 1fr) auto auto;
          gap: 3px 21px;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-roundup-switch-play {
          position: relative;
          display: block;
          grid-column: 1 / 2;
          grid-row: 1 / 4;
          align-self: center;
          justify-self: start;
          width: 26px;
          height: 18px;
          min-width: 26px;
          border-radius: 6px;
          background: #d71920;
          box-shadow: none;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-roundup-switch-play::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          margin-left: 1px;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 8px solid #ffffff;
          transform: translate(-50%, -50%);
        }

        .public-roundup-video-layout .public-roundup-meta {
          gap: 12px !important;
          justify-content: space-between !important;
          width: 100%;
        }

        .public-roundup-video-layout .public-roundup-switch-item[aria-pressed="true"]::before {
          content: "";
          position: absolute;
          top: 50%;
          left: -34px;
          width: 22px;
          height: 1px;
          background: #0b1f3a;
          opacity: 0.66;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-cover-story strong {
          grid-column: 2 / 4;
          grid-row: 2 / 3;
          min-width: 0;
          color: #10151b;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.14;
        }

        .public-roundup-video-layout .public-matchday-roundup .public-cover-story small {
          grid-column: 2 / 5;
          grid-row: 3 / 4;
          min-width: 0;
          color: #6b7786;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.2;
        }

        .public-roundup-video-layout .public-roundup-duration {
          justify-self: end;
          color: #607086;
          white-space: nowrap;
        }

        .public-roundup-video-layout .public-roundup-scroll-button {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.96) 18%, rgba(255, 255, 255, 0.96) 82%, rgba(255, 255, 255, 0));
          color: #526174;
        }

        .public-roundup-video-layout .public-roundup-scroll-button-top,
        .public-roundup-video-layout .public-roundup-scroll-button-bottom {
          border-color: #eef2f6;
        }
      `}</style>
    </main>
  );
}
