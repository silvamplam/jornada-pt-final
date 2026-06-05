import RoundupVideoSwitcher, { type RoundupVideoItem } from "./RoundupVideoSwitcher";

export type PublicEditorialHighlight = {
  id: string;
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
};

export type PublicEditorialLatestNews = {
  id: string;
  timeLabel?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
};

export type PublicSideBlockData = {
  isPublished: boolean;
  label?: string | null;
  title?: string | null;
  titleColor?: string | null;
  author?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  placeholder?: string;
};

export type PublicHeadlineData = {
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  titleColor?: string | null;
  fallbackTitle: string;
  fallbackSubtitle: string;
  titleTag?: "h1" | "h2";
};

export type PublicComplementaryData = {
  isPublished: boolean;
  label?: string | null;
  title?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  fallbackTitle: string;
  fallbackText: string;
};

export type PublicBelowHeadlineData = {
  mode: "highlights" | "roundup";
  label: string;
  labelColor?: string | null;
  highlights: PublicEditorialHighlight[];
  roundupItems: RoundupVideoItem[];
  showRoundupVideo: boolean;
  roundupHeading?: string | null;
  roundupHeadingColor?: string | null;
  initialRoundupItemId?: string | null;
  matchdayNumber?: number | null;
  complementary: PublicComplementaryData;
};

type PublicEditorialLayoutProps = {
  ariaLabel?: string;
  sideBlock: PublicSideBlockData;
  headline: PublicHeadlineData;
  belowHeadline: PublicBelowHeadlineData;
  latestNews: PublicEditorialLatestNews[];
  latestNewsTitle?: string;
};

const defaultRoundupFallbacks: RoundupVideoItem[] = [
  {
    id: "placeholder-roundup-preview",
    label: "Antevisao",
    title: "Os pontos de atencao antes da bola rolar",
    subtitle: "Resumo completo",
    image_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80",
    video_url: null,
    duration: "5:42",
    type: "video"
  },
  {
    id: "placeholder-roundup-stand",
    label: "Ambiente",
    title: "A jornada vista pelas bancadas e pelos protagonistas",
    subtitle: "Golos e melhores momentos",
    image_url: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=700&q=80",
    video_url: null,
    duration: "4:18",
    type: "video"
  },
  {
    id: "placeholder-roundup-context",
    label: "Contexto",
    title: "O que pode mudar na tabela depois dos resultados",
    subtitle: "Noticia de contexto",
    image_url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=700&q=80",
    video_url: null,
    duration: "6:21",
    type: "noticia"
  }
];

export function PublicSideBlock({ data, ariaLabel = "Bloco editorial lateral da jornada" }: { data: PublicSideBlockData; ariaLabel?: string }) {
  return (
    <aside className="public-matchday-feature public-side-editorial-block" aria-label={ariaLabel}>
      <div className="public-side-editorial-inner">
        {data.isPublished ? (
          <>
            {data.imageUrl ? (
              <div className="public-side-editorial-image">
                <img alt="" src={data.imageUrl} />
              </div>
            ) : null}
            <div className="public-side-editorial-copy">
              {data.label ? <span className="public-side-editorial-label">{data.label}</span> : null}
              {data.title ? (
                data.linkUrl ? (
                  <a className="public-side-editorial-title-link" href={data.linkUrl}>
                    <strong style={data.titleColor ? { color: data.titleColor } : undefined}>{data.title}</strong>
                  </a>
                ) : (
                  <strong style={data.titleColor ? { color: data.titleColor } : undefined}>{data.title}</strong>
                )
              ) : null}
              {data.author ? <small>Por {data.author}</small> : null}
              {data.text ? <p>{data.text}</p> : null}
              {data.linkUrl ? (
                <a className="public-editorial-more-link" href={data.linkUrl}>
                  Ler mais <span aria-hidden="true">›</span>
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <div className="public-side-editorial-placeholder">{data.placeholder ?? "Espaco editorial por definir"}</div>
        )}
      </div>
    </aside>
  );
}

export function PublicHeadlineBlock({ data }: { data: PublicHeadlineData }) {
  const title = data.title || data.fallbackTitle;
  const subtitle = data.subtitle || data.fallbackSubtitle;
  const TitleTag = data.titleTag ?? "h2";

  return (
    <article className="public-matchday-editorial">
      <div className="public-cover-headline">
        {data.imageUrl ? (
          <div className="public-editorial-main-image">
            <img src={data.imageUrl} alt="" />
          </div>
        ) : null}
        <div>
          <TitleTag style={data.titleColor ? { color: data.titleColor } : undefined}>{title}</TitleTag>
          <p>{subtitle}</p>
        </div>
      </div>
    </article>
  );
}

function PublicHighlightCard({ item }: { item: PublicEditorialHighlight }) {
  const body = (
    <>
      <div className="public-highlight-image">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}</div>
      {item.label ? <span>{item.label}</span> : null}
      <strong>{item.title}</strong>
      {item.subtitle ? <small>{item.subtitle}</small> : null}
    </>
  );

  return item.linkUrl ? (
    <a className="public-cover-story" href={item.linkUrl}>
      {body}
    </a>
  ) : (
    <article className="public-cover-story">{body}</article>
  );
}

function PublicRoundupStoryCard({ item }: { item: RoundupVideoItem }) {
  const showPlay = Boolean(item.video_url) || item.type === "video" || item.type === "golos" || item.type === "resumo";
  const imageUrl = item.image_url?.trim();

  return (
    <article className="public-cover-story">
      <div className="public-highlight-image">
        {imageUrl ? <img src={imageUrl} alt="" /> : null}
        {showPlay ? <span className="public-media-play" aria-hidden="true">▶</span> : null}
      </div>
      {item.label ? <span>{item.label}</span> : null}
      <strong>{item.title}</strong>
      {item.subtitle ? <small>{item.subtitle}</small> : null}
      {item.duration ? <span className="public-roundup-duration">{item.duration}</span> : null}
      {item.video_url ? (
        <a className="public-roundup-arrow" href={item.video_url} aria-label="Abrir conteudo do resumo">
          ›
        </a>
      ) : (
        <span className="public-roundup-arrow" aria-hidden="true">›</span>
      )}
    </article>
  );
}

export function PublicHighlightsBlock({ highlights }: { highlights: PublicEditorialHighlight[] }) {
  return (
    <div className="public-cover-story-strip">
      {highlights.map((item) => (
        <PublicHighlightCard item={item} key={item.id} />
      ))}
    </div>
  );
}

export function PublicComplementaryBlock({ data, ariaLabel = "Bloco complementar da jornada" }: { data: PublicComplementaryData; ariaLabel?: string }) {
  return (
    <aside className="public-matchday-cover-side public-editorial-flex-block public-below-headline-side" data-editorial-slot="video-ou-imagem-noticia" aria-label={ariaLabel}>
      {data.isPublished ? (
        <>
          {data.imageUrl ? (
            <div className="public-complement-media">
              <img src={data.imageUrl} alt="" />
            </div>
          ) : null}
          <div className="public-complement-body">
            {data.label ? <span className="public-complement-label">{data.label}</span> : null}
            {data.title ? (
              data.linkUrl ? (
                <a className="public-complement-title-link" href={data.linkUrl}>
                  <strong>{data.title}</strong>
                </a>
              ) : (
                <strong>{data.title}</strong>
              )
            ) : null}
            {data.text ? <p>{data.text}</p> : null}
            {data.linkUrl ? (
              <a className="public-editorial-more-link" href={data.linkUrl}>
                Ver mais <span aria-hidden="true">›</span>
              </a>
            ) : null}
          </div>
        </>
      ) : (
        <div className="public-complement-body">
          <strong>{data.fallbackTitle}</strong>
          <p>{data.fallbackText}</p>
        </div>
      )}
    </aside>
  );
}

export function PublicBelowHeadlineBlock({ data }: { data: PublicBelowHeadlineData }) {
  if (data.showRoundupVideo && data.roundupItems.length > 0) {
    return (
      <RoundupVideoSwitcher
        items={data.roundupItems}
        initialItemId={data.initialRoundupItemId ?? null}
        heading={data.roundupHeading ?? null}
        headingColor={data.roundupHeadingColor ?? null}
        matchdayNumber={data.matchdayNumber ?? null}
      />
    );
  }

  const roundupItems = data.roundupItems.length > 0 ? data.roundupItems : defaultRoundupFallbacks;

  return (
    <>
      <section
        className={`public-matchday-roundup public-below-headline-${data.mode} public-editorial-flex-block`}
        data-editorial-slot="videos-ou-noticias"
        aria-label="Zona editorial abaixo da manchete"
      >
        <div className="public-editorial-block-head">
          <span className="public-roundup-matchday-label" style={data.labelColor ? { color: data.labelColor } : undefined}>
            {data.label}
          </span>
        </div>
        {data.mode === "highlights" ? (
          <PublicHighlightsBlock highlights={data.highlights} />
        ) : (
          <div className="public-cover-story-strip" aria-label="Resumos e destaques da jornada">
            {roundupItems.map((item) => (
              <PublicRoundupStoryCard item={item} key={item.id} />
            ))}
          </div>
        )}
      </section>
      <PublicComplementaryBlock data={data.complementary} />
    </>
  );
}

export function PublicLatestNewsBlock({ items, title = "Últimas notícias" }: { items: PublicEditorialLatestNews[]; title?: string }) {
  return (
    <aside className="public-matchday-news" aria-label={title}>
      <h3>{title}</h3>
      <ul className="public-news-list">
        {items.map((item) => (
          <li className="public-news-item" key={item.id}>
            {item.imageUrl ? (
              <div className="public-news-thumb">
                <img alt="" src={item.imageUrl} />
              </div>
            ) : null}
            <div className="public-news-copy">
              {item.timeLabel ? <time dateTime={item.timeLabel}>{item.timeLabel}</time> : null}
              {item.linkUrl ? (
                <a className="public-news-title" href={item.linkUrl}>{item.title}</a>
              ) : (
                <span className="public-news-title">{item.title}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function PublicEditorialLayout({ ariaLabel = "Capa da jornada", sideBlock, headline, belowHeadline, latestNews, latestNewsTitle }: PublicEditorialLayoutProps) {
  return (
    <section className="public-matchday-panel" aria-label={ariaLabel}>
      <div className="public-matchday-cover">
        <PublicSideBlock data={sideBlock} />
        <div className="public-matchday-main-column">
          <PublicHeadlineBlock data={headline} />
          <div className="public-matchday-main-lower">
            <PublicBelowHeadlineBlock data={belowHeadline} />
          </div>
        </div>
        <PublicLatestNewsBlock items={latestNews} title={latestNewsTitle} />
      </div>
    </section>
  );
}
