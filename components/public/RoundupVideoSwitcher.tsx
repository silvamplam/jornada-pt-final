"use client";

import { useMemo, useRef, useState } from "react";
import type { SupabaseMatchdayRoundupItem } from "@/lib/supabase";

type RoundupVideoSwitcherProps = {
  items: SupabaseMatchdayRoundupItem[];
  initialItemId?: string | null;
  matchdayNumber: number;
};

function videoEmbedUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
      const videoId = parsed.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export default function RoundupVideoSwitcher({ items, initialItemId, matchdayNumber }: RoundupVideoSwitcherProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const initialItem = useMemo(
    () => items.find((item) => item.id === initialItemId) ?? items[0] ?? null,
    [initialItemId, items]
  );
  const [activeItemId, setActiveItemId] = useState(initialItem?.id ?? null);
  const activeItem = items.find((item) => item.id === activeItemId) ?? initialItem;
  const embedUrl = videoEmbedUrl(activeItem?.video_url);
  const hasScrollControls = items.length > 3;
  const matchdayLabel = `Jornada ${String(matchdayNumber).padStart(2, "0")}`;

  function scrollRoundupList(direction: -1 | 1) {
    const list = listRef.current;

    if (!list) {
      return;
    }

    list.scrollBy({
      top: direction * Math.max(72, Math.round(list.clientHeight * 0.82)),
      behavior: "smooth"
    });
  }

  return (
    <>
      <section
        className={`public-matchday-roundup public-below-headline-roundup public-editorial-flex-block${hasScrollControls ? " public-roundup-has-scroll" : ""}`}
        data-editorial-slot="resumo-ou-noticias"
      >
        <div className="public-editorial-block-head">
          <span className="public-roundup-matchday-label">{matchdayLabel}</span>
        </div>
        <div className="public-roundup-scroll-frame">
          {hasScrollControls ? (
            <button className="public-roundup-scroll-button public-roundup-scroll-button-top" onClick={() => scrollRoundupList(-1)} type="button" aria-label="Ver itens anteriores">
              &uarr;
            </button>
          ) : null}
          <div className="public-cover-story-strip public-roundup-scroll-window" ref={listRef} aria-label="Resumos e videos da jornada">
            {items.length > 0 ? (
              items.map((item) => {
                const showPlay = Boolean(item.video_url) || item.type === "video" || item.type === "golos" || item.type === "resumo";
                const imageUrl = item.image_url?.trim();
                const isActive = item.id === activeItem?.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className="public-cover-story public-roundup-switch-item"
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    type="button"
                  >
                    <div className="public-highlight-image">
                      {imageUrl ? <img alt="" src={imageUrl} /> : null}
                      {showPlay ? (
                        <span aria-hidden="true" className="public-media-play">
                          play
                        </span>
                      ) : null}
                    </div>
                    <span className="public-roundup-meta">
                      {item.label ? <span>{item.label}</span> : <span aria-hidden="true" />}
                      {item.duration ? <span className="public-roundup-duration">{item.duration}</span> : null}
                    </span>
                    <strong>{item.title ?? "Video da jornada"}</strong>
                    {item.subtitle ? <small>{item.subtitle}</small> : null}
                    <span aria-hidden="true" className="public-roundup-arrow">
                      &rsaquo;
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="public-complement-body">
                <strong>Resumo da Jornada por definir</strong>
                <p>Prepara itens publicados no backoffice editorial desta jornada.</p>
              </div>
            )}
          </div>
          {hasScrollControls ? (
            <button className="public-roundup-scroll-button public-roundup-scroll-button-bottom" onClick={() => scrollRoundupList(1)} type="button" aria-label="Ver itens seguintes">
              &darr;
            </button>
          ) : null}
        </div>
      </section>

      <aside
        aria-label="Video do Resumo da Jornada"
        className="public-matchday-cover-side public-editorial-flex-block public-roundup-video-panel"
        data-editorial-slot="video-ou-imagem-noticia"
      >
        {activeItem ? (
          <>
            <div className="public-complement-media">
              {embedUrl ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  src={embedUrl}
                  title={activeItem.title ?? "Video da jornada"}
                />
              ) : activeItem.image_url ? (
                <img alt="" src={activeItem.image_url} />
              ) : (
                <span aria-hidden="true" className="public-media-play">
                  play
                </span>
              )}
            </div>
            <div className="public-complement-body public-roundup-active-body">
              <span className="public-roundup-active-meta">
                {activeItem.label ? <span className="public-complement-label">{activeItem.label}</span> : <span aria-hidden="true" />}
                {activeItem.duration ? <span>{activeItem.duration}</span> : null}
              </span>
              <strong>{activeItem.title ?? "Video da jornada"}</strong>
              {activeItem.subtitle ? <p>{activeItem.subtitle}</p> : null}
            </div>
          </>
        ) : (
          <div className="public-complement-body">
            <strong>Video por definir</strong>
            <p>Publica itens no Resumo da Jornada para ativar este leitor.</p>
          </div>
        )}
      </aside>
    </>
  );
}
