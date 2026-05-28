"use client";

import { useMemo, useState } from "react";
import type { SupabaseMatchdayRoundupItem } from "@/lib/supabase";

type RoundupVideoSwitcherProps = {
  items: SupabaseMatchdayRoundupItem[];
  initialItemId?: string | null;
};

function videoEmbedUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export default function RoundupVideoSwitcher({ items, initialItemId }: RoundupVideoSwitcherProps) {
  const initialItem = useMemo(
    () => items.find((item) => item.id === initialItemId) ?? items[0] ?? null,
    [initialItemId, items]
  );
  const [activeItemId, setActiveItemId] = useState(initialItem?.id ?? null);
  const activeItem = items.find((item) => item.id === activeItemId) ?? initialItem;
  const embedUrl = videoEmbedUrl(activeItem?.video_url);

  return (
    <>
      <section
        className="public-matchday-roundup public-below-headline-roundup public-editorial-flex-block"
        data-editorial-slot="resumo-ou-noticias"
      >
        <div className="public-cover-story-strip" aria-label="Resumos e videos da jornada">
          {items.length > 0 ? (
            items.map((item) => {
              const showPlay = Boolean(item.video_url) || item.type === "video" || item.type === "golos" || item.type === "resumo";
              const imageUrl = item.image_url?.trim();
              const isActive = item.id === activeItem?.id;
              return (
                <button
                  className="public-cover-story public-roundup-switch-item"
                  type="button"
                  key={item.id}
                  aria-pressed={isActive}
                  onClick={() => setActiveItemId(item.id)}
                >
                  <div className="public-highlight-image">
                    {imageUrl ? <img src={imageUrl} alt="" /> : null}
                    {showPlay ? <span className="public-media-play" aria-hidden="true">▶</span> : null}
                  </div>
                  {item.label ? <span>{item.label}</span> : null}
                  <strong>{item.title ?? "Video da jornada"}</strong>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                  {item.duration ? <span className="public-roundup-duration">{item.duration}</span> : null}
                  <span className="public-roundup-arrow" aria-hidden="true">›</span>
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
        <a className="public-editorial-more-link" href="#jogos">
          Ver mais vídeos e golos <span aria-hidden="true">›</span>
        </a>
      </section>

      <aside className="public-matchday-cover-side public-editorial-flex-block" data-editorial-slot="video-ou-imagem-noticia" aria-label="Video do Resumo da Jornada">
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
                <img src={activeItem.image_url} alt="" />
              ) : (
                <span className="public-media-play" aria-hidden="true">▶</span>
              )}
            </div>
            <div className="public-complement-body">
              {activeItem.label ? <span className="public-complement-label">{activeItem.label}</span> : null}
              <strong>{activeItem.title ?? "Video da jornada"}</strong>
              {activeItem.subtitle ? <p>{activeItem.subtitle}</p> : null}
              {activeItem.duration ? <p>{activeItem.duration}</p> : null}
              {!embedUrl && activeItem.video_url ? (
                <a className="public-editorial-more-link" href={activeItem.video_url}>
                  Ver video <span aria-hidden="true">›</span>
                </a>
              ) : null}
              {!activeItem.video_url ? <p>Video por definir.</p> : null}
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
