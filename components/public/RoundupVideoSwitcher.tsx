"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseMatchdayRoundupItem } from "@/lib/supabase";

type RoundupVideoSwitcherProps = {
  items: SupabaseMatchdayRoundupItem[];
  initialItemId?: string | null;
  matchdayNumber?: number | null;
  heading?: string | null;
  headingColor?: string | null;
};

const roundupVideoListPolishStyles = `
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

  .public-roundup-video-layout .public-roundup-scroll-frame {
    border-top: 0 !important;
    border-bottom: 0 !important;
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
    gap: 3px 21px;
  }

  .public-roundup-video-layout .public-roundup-meta {
    gap: 12px !important;
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

  .public-roundup-video-layout .public-roundup-scroll-button {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.96) 18%, rgba(255, 255, 255, 0.96) 82%, rgba(255, 255, 255, 0));
    color: #526174;
  }

  .public-roundup-video-layout .public-roundup-scroll-button-top,
  .public-roundup-video-layout .public-roundup-scroll-button-bottom {
    border-color: #eef2f6;
  }
`;

function splitHeadingLines(value?: string | null) {
  const cleaned = value?.trim();

  if (!cleaned) {
    return [];
  }

  const parts = cleaned
    .split(/\r?\n|·|Â·|&middot;|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    const jornadaMatch = parts[0].match(/^(jornada\s+\d{1,2})(?:\s+)(.+)$/i);

    if (jornadaMatch) {
      return [jornadaMatch[1], jornadaMatch[2]];
    }
  }

  if (parts.length <= 2) {
    return parts;
  }

  return [parts[0], parts.slice(1).join(" ")];
}

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

export default function RoundupVideoSwitcher({ items, initialItemId, heading, headingColor }: RoundupVideoSwitcherProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const initialItem = useMemo(
    () => items.find((item) => item.id === initialItemId) ?? items[0] ?? null,
    [initialItemId, items]
  );
  const [activeItemId, setActiveItemId] = useState(initialItem?.id ?? null);
  const activeItem = items.find((item) => item.id === activeItemId) ?? initialItem;
  const embedUrl = videoEmbedUrl(activeItem?.video_url);
  const hasScrollControls = items.length > 5;
  const [scrollState, setScrollState] = useState({
    canScrollDown: hasScrollControls,
    canScrollUp: false
  });
  const headingLines = splitHeadingLines(heading);
  const headingStyle = headingColor?.trim() ? { color: headingColor.trim() } : undefined;
  const headingSpacerText = headingLines.length > 0 ? headingLines.join(" ") : "Jornada 00 Jogos Video Resumo";

  const updateScrollState = useCallback(() => {
    const list = listRef.current;

    if (!list || !hasScrollControls) {
      setScrollState({ canScrollDown: false, canScrollUp: false });
      return;
    }

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    const nextState = {
      canScrollDown: list.scrollTop < maxScrollTop - 1,
      canScrollUp: list.scrollTop > 1
    };

    setScrollState((currentState) =>
      currentState.canScrollDown === nextState.canScrollDown && currentState.canScrollUp === nextState.canScrollUp
        ? currentState
        : nextState
    );
  }, [hasScrollControls]);

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

  useEffect(() => {
    updateScrollState();
    const list = listRef.current;

    if (!list) {
      return;
    }

    list.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      list.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items.length, updateScrollState]);

  return (
    <div className="public-roundup-video-layout">
      <style>{roundupVideoListPolishStyles}</style>
      {headingLines.length > 0 ? (
        <div className="public-roundup-zone-heading" style={headingStyle}>
          {headingLines.map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </div>
      ) : null}
      <section
        className={`public-matchday-roundup public-below-headline-roundup public-editorial-flex-block${hasScrollControls ? " public-roundup-has-scroll" : ""}`}
        data-editorial-slot="resumo-ou-noticias"
      >
        <div aria-hidden="true" className="public-editorial-block-head public-roundup-inline-head-spacer">
          <span className="public-roundup-matchday-label">{headingSpacerText}</span>
        </div>
        <div className="public-roundup-scroll-frame">
          {hasScrollControls && scrollState.canScrollUp ? (
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
                const itemLabel = item.label?.trim();
                const itemDuration = item.duration?.trim();

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
                      {showPlay ? <span aria-hidden="true" className="public-media-play public-media-play-icon-only" /> : null}
                    </div>
                    <span className="public-roundup-meta">
                      {itemLabel ? <span>{itemLabel}</span> : <span aria-hidden="true" />}
                      {itemDuration ? <span className="public-roundup-duration">{itemDuration}</span> : null}
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
          {hasScrollControls && scrollState.canScrollDown ? (
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
          <div className="public-roundup-video-block">
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
                <span aria-hidden="true" className="public-media-play public-media-play-icon-only" />
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
          </div>
        ) : (
          <div className="public-roundup-video-block">
            <div className="public-complement-body">
              <strong>Video por definir</strong>
              <p>Publica itens no Resumo da Jornada para ativar este leitor.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
