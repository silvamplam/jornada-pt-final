import { buildAccumulatedClassification, totalClassificationStats, type ClassificationSplit } from "@/lib/classification";
import { getPublicMatchdayDiagnostic, seasonLabelToUrlSegment, type PublicMatchdayContext, type PublicMatchdayDiagnostic, type PublicReferenceCompositionItem, type PublicSeasonMatch } from "@/lib/public-matchday";
import { getPublicCompetitionMenu } from "@/lib/public-competition-menu";
import { fetchSupabaseAdminTable } from "@/lib/supabase";
import PublicTeamBadge from "@/components/public/PublicTeamBadge";
import RoundupVideoSwitcher from "@/components/public/RoundupVideoSwitcher";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PublicMatchdayPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
  }>;
  searchParams?: Promise<{
    debug_logos?: string;
  }>;
};

async function readBelowHeadlineSubtitle(matchdayId: string) {
  try {
    const rows = await fetchSupabaseAdminTable<{ below_headline_subtitle: string | null }>(
      `matchday_editorials?select=below_headline_subtitle&matchday_id=eq.${encodeURIComponent(matchdayId)}&limit=1`
    );

    return rows[0]?.below_headline_subtitle?.trim() || null;
  } catch {
    return null;
  }
}

const PUBLIC_STAT_COLUMNS: Array<{ key: keyof ClassificationSplit; label: string }> = [
  { key: "played", label: "J" },
  { key: "wins", label: "V" },
  { key: "draws", label: "E" },
  { key: "losses", label: "D" },
  { key: "goalsFor", label: "GM" },
  { key: "goalsAgainst", label: "GS" },
  { key: "goalDifference", label: "DG" },
  { key: "points", label: "PTS" }
];

const publicMatchdayStyles = `
  body {
    margin: 0;
    overflow-x: hidden;
    background: #ffffff;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-matchday-shell {
    min-height: 100vh;
    padding: 0 24px 28px;
  }

  .public-top-stack {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: 0 -24px;
    padding: 0 24px;
    border-bottom: 1px solid #d8dee6;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.08);
  }

  #jogos,
  #classificacao {
    scroll-margin-top: 132px;
  }

  .public-site-topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    min-height: 56px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
    border-bottom: 1px solid #dfe5ec;
  }

  .public-site-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #2f343b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 29px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .public-site-brand span {
    color: #6b7480;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0;
  }

  .public-site-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-menu a,
  .public-site-actions a {
    color: #10151b;
    text-decoration: none;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-menu a[aria-current="page"] {
    color: #c40012;
  }

  .public-site-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
  }

  .public-site-search {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 170px;
    padding: 6px 11px;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #ffffff;
    color: #66717f;
    font-size: 12px;
    font-weight: 900;
  }

  .public-site-search::before {
    content: "⌕";
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ffe04f;
    color: #10151b;
    font-size: 13px;
  }

  .public-season-nav-bar {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .public-hidden-heading {
    display: none;
  }

  .public-season-label {
    color: #10151b;
    font-size: 14px;
    font-weight: 900;
    white-space: nowrap;
  }

  .public-season-select-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px 5px 10px;
    border: 1px solid #cfd7e1;
    background: #f8fafc;
    color: #263241;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .public-season-select {
    min-width: 118px;
    border: 0;
    background: transparent;
    color: #10151b;
    font: inherit;
    outline: none;
    cursor: pointer;
  }

  .public-matchday-hero,
  .public-matchday-panel {
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-matchday-hero {
    display: none;
  }

  .public-matchday-hero p,
  .public-matchday-hero h1 {
    margin: 0;
  }

  .public-matchday-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-hero h1 {
    margin-top: 6px;
    font-size: 34px;
    line-height: 1;
  }

  .public-matchday-hero span {
    display: block;
    margin-top: 8px;
    color: #526174;
    font-size: 15px;
  }

  .public-matchday-panel {
    max-width: 1512px;
    margin-left: auto;
    margin-right: auto;
    margin-top: 12px;
    overflow: hidden;
  }

  .public-matchday-scoreboard-panel {
    margin-top: 1px;
    border-top: 0;
    border-bottom: 0;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    background: #ffffff;
    box-shadow: none;
    min-height: 84px;
  }

  .public-matchday-scoreboard-panel + .public-matchday-panel {
    margin-top: 6px;
  }

  .public-matchday-panel[aria-label="Capa da jornada"] {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: visible;
    max-width: 1512px;
    width: 100%;
  }

  .public-matchday-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .public-matchday-panel h2,
  .public-matchday-panel h3,
  .public-matchday-panel p {
    margin: 0;
  }

  .public-matchday-panel h2 {
    font-size: 24px;
    text-transform: uppercase;
  }

  .public-matchday-panel p {
    margin-top: 6px;
    color: #607086;
  }

  .public-matchday-list {
    display: grid;
    gap: 18px;
    padding: 20px;
  }

  .public-matchday-strip {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-padding: 14px;
    padding: 8px;
    background: #ffffff;
  }

  .public-matchday-strip-shell {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
    min-height: 104px;
    padding: 0 10px;
    background: #ffffff;
  }

  .public-matchday-strip-button {
    align-self: center;
    width: 30px;
    height: 52px;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-size: 22px;
    font-weight: 900;
    cursor: pointer;
  }

  .public-matchday-mini-card {
    position: relative;
    display: grid;
    flex: 0 0 176px;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    align-items: start;
    min-height: 84px;
    padding: 8px 9px;
    border: 1px solid #eef2f6;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 18px rgba(12, 22, 34, 0.05);
    font-size: 13px;
  }

  .public-matchday-mini-card + .public-matchday-mini-card::before {
    content: "";
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: -7px;
    width: 1px;
    background: #dfe5ec;
  }

  .public-matchday-mini-card-live {
    border-color: #dfe6ee;
    background: #ffffff;
  }

  .public-matchday-mini-card-halftime {
    border-color: #dfe6ee;
    background: #ffffff;
  }

  .public-matchday-mini-card-finished {
    border-color: #dfe6ee;
    background: #ffffff;
  }

  .public-matchday-mini-card-scheduled {
    border-color: #dfe6ee;
    background: #ffffff;
  }

  .public-matchday-mini-card-unknown {
    border-color: #d8dee6;
    background: #ffffff;
  }

  .public-matchday-mini-team {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 5px;
    overflow: hidden;
    font-weight: 800;
    text-transform: none;
  }

  .public-matchday-mini-team:first-child {
    justify-content: flex-start;
  }

  .public-matchday-mini-team:last-child {
    justify-content: flex-start;
  }

  .public-matchday-mini-team span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .public-matchday-mini-score {
    min-width: 16px;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    text-align: right;
  }

  .public-matchday-mini-card .public-team-badge {
    width: 24px;
    height: 24px;
    background: #ffffff;
  }

  .public-matchday-mini-card .public-matchday-mini-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    min-width: 0;
    padding: 2px 0 0 29px;
    border-radius: 0;
    background: transparent;
    color: #607086;
    font-size: 10.5px;
    font-weight: 800;
    line-height: 1.15;
    text-transform: none;
  }

  .public-matchday-mini-card-live .public-matchday-mini-status > span,
  .public-matchday-mini-card-halftime .public-matchday-mini-status > span,
  .public-matchday-mini-card-finished .public-matchday-mini-status > span,
  .public-matchday-mini-card-unknown .public-matchday-mini-status > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border-radius: 0;
    background: transparent;
    font-weight: 900;
  }

  .public-matchday-mini-card-live .public-matchday-mini-status > span,
  .public-matchday-mini-card-halftime .public-matchday-mini-status > span {
    color: #286943;
  }

  .public-matchday-mini-card-live .public-matchday-mini-status > span::before,
  .public-matchday-mini-card-halftime .public-matchday-mini-status > span::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #17a34a;
  }

  .public-matchday-mini-card-finished .public-matchday-mini-status > span {
    color: #4e5b69;
  }

  .public-matchday-mini-card-unknown .public-matchday-mini-status > span {
    color: #506075;
  }

  .public-matchday-mini-time {
    color: #263241;
    white-space: nowrap;
  }

  .public-matchday-mini-card-scheduled .public-matchday-mini-time {
    padding: 0;
    border-radius: 0;
    background: transparent;
    color: #6b5a22;
    font-weight: 900;
  }

  .public-matchday-mini-channel {
    min-width: 0;
    overflow: hidden;
    color: #607086;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .public-matchday-mini-separator {
    color: #9aa6b4;
  }

  .public-matchday-cover {
    --public-cover-rule-color: #10151b;
    --public-cover-rule-gap: 8px;
    --public-cover-rule-size: 4px;
    display: grid;
    grid-template-columns:
      minmax(220px, 240px)
      minmax(0, 1fr)
      minmax(240px, 280px);
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

  .public-side-editorial-block {
    color: #263241;
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

  .public-side-editorial-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-side-editorial-copy {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .public-side-editorial-label {
    color: #c40012;
    font-size: 10.5px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .public-side-editorial-copy strong {
    display: block;
    color: #10151b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16.5px;
    font-weight: 700;
    line-height: 1.18;
  }

  .public-side-editorial-copy small {
    color: #607086;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.2;
  }

  .public-side-editorial-copy p {
    margin: 0;
    color: #526174;
    font-size: 13px;
    line-height: 1.48;
  }

  .public-side-editorial-card-link {
    display: grid;
    gap: 12px;
    align-content: start;
    min-width: 0;
    color: inherit;
    text-decoration: none;
    border-radius: 6px;
  }

  .public-side-editorial-card-link:hover .public-side-editorial-copy strong {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-side-editorial-card-link:focus-visible {
    outline: 2px solid #003f8f;
    outline-offset: 4px;
  }

  .public-side-editorial-placeholder {
    padding: 10px 0;
    color: #7a8796;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .public-matchday-cover-side {
    min-height: 100%;
  }

  .public-matchday-news {
    grid-area: news;
    min-height: 100%;
    padding-top: 0;
  }

  .public-matchday-editorial h2,
  .public-cover-support h4,
  .public-matchday-roundup h3,
  .public-matchday-cover-side h3,
  .public-matchday-news h3 {
    margin: 0;
  }

  .public-matchday-editorial h2 {
    color: #c40012;
    font-family: Georgia, "Times New Roman", serif;
    max-width: 100%;
    font-size: 28px;
    line-height: 1.04;
    letter-spacing: 0;
  }

  .public-cover-headline {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.95fr);
    gap: 18px;
    align-items: start;
    min-height: 0;
    overflow: visible;
    padding: 0 0 6px;
    border-bottom: 1px solid #dfe5ec;
    background: #ffffff;
    color: #10151b;
  }

  .public-cover-headline::before {
    content: none;
  }

  .public-cover-headline > div {
    position: relative;
    z-index: 1;
  }

  .public-cover-headline-title-link {
    color: inherit;
    text-decoration: none;
  }

  .public-cover-headline-title-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-editorial-main-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 285px;
    overflow: hidden;
    border-radius: 6px;
    background: #eef2f6;
  }

  .public-editorial-main-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-cover-headline p {
    max-width: 100%;
    color: #526174;
    font-size: 14px;
    line-height: 1.35;
  }

  .public-matchday-main-lower {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.95fr);
    gap: 24px;
    align-items: stretch;
    min-width: 0;
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

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-roundup-scroll-window {
    max-height: var(--public-roundup-visible-list-height);
  }

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-roundup-scroll-frame {
    border-color: #edf2f7;
  }

  .public-editorial-flex-block {
    position: relative;
  }

  .public-cover-support h4,
  .public-editorial-block-head,
  .public-matchday-news h3 {
    padding-top: var(--public-cover-rule-gap);
    border-top: var(--public-cover-rule-size) solid var(--public-cover-rule-color);
  }

  .public-editorial-block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .public-matchday-roundup .public-editorial-block-head {
    justify-content: flex-end;
  }

  .public-below-headline-highlights .public-editorial-block-head {
    justify-content: flex-start;
    padding: 0 0 8px;
    border-top: 0;
  }

  .public-below-headline-heading-copy {
    display: grid;
    gap: 4px;
  }

  .public-below-headline-subtitle {
    margin: 0;
    color: #5d6b7a;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-editorial-block-head {
    padding-top: 0;
    padding-right: 6px;
    padding-bottom: 1px;
    padding-left: 6px;
    border-top: 0;
    justify-content: flex-start;
  }

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-editorial-block-head .public-roundup-matchday-label {
    color: #263241;
    font-size: 10.5px;
  }

  .public-editorial-block-head h3,
  .public-matchday-roundup h3 {
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-editorial-block-head a,
  .public-editorial-block-head .public-roundup-matchday-label,
  .public-editorial-more-link {
    color: #003f8f;
    font-size: 11px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-feature {
    color: #263241;
  }

  .public-matchday-feature p {
    font-size: 13px;
  }

  .public-cover-support {
    display: grid;
    gap: 10px;
    align-content: start;
    height: auto;
    padding: 0;
    border: 0;
    background: #ffffff;
  }

  .public-cover-support h4 {
    margin: 0;
    padding-top: 0;
    border-top: 0;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .public-cover-support p {
    margin: 0;
    color: #607086;
    font-size: 13px;
    line-height: 1.35;
  }

  .public-cover-story-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding-top: 4px;
  }

  .public-matchday-roundup .public-cover-story-strip {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: 0;
  }

  .public-matchday-roundup {
    --public-roundup-scroll-control-height: 14px;
    --public-roundup-visible-list-height: 224px;
  }

  .public-roundup-scroll-frame {
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: visible;
    border-top: 1px solid #eef2f6;
    border-bottom: 1px solid #eef2f6;
  }

  .public-roundup-has-scroll .public-roundup-scroll-frame {
    display: block;
    height: var(--public-roundup-visible-list-height);
    max-height: var(--public-roundup-visible-list-height);
  }

  .public-roundup-has-scroll .public-roundup-scroll-frame::before,
  .public-roundup-has-scroll .public-roundup-scroll-frame::after {
    content: none;
    position: absolute;
    right: 0;
    left: 0;
    z-index: 1;
    height: 30px;
    pointer-events: none;
  }

  .public-roundup-has-scroll .public-roundup-scroll-frame::before {
    top: 0;
    background: linear-gradient(#ffffff, rgba(255, 255, 255, 0));
  }

  .public-roundup-has-scroll .public-roundup-scroll-frame::after {
    bottom: 0;
    background: linear-gradient(rgba(255, 255, 255, 0), #ffffff);
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

  .public-cover-story {
    display: grid;
    gap: 6px;
    align-content: start;
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

  .public-matchday-roundup .public-highlight-image {
    position: relative;
    grid-column: 1 / 2;
    grid-row: 1 / 4;
    width: 44px;
    height: 44px;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #eef2f6;
  }

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-highlight-image {
    width: 48px;
    height: 48px;
    border-radius: 4px;
  }

  .public-matchday-roundup .public-highlight-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-below-headline-highlights .public-cover-story-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    padding-top: 0;
  }

  .public-below-headline-highlights .public-cover-story {
    display: grid;
    grid-template-columns: 1fr;
    gap: 7px;
    align-items: start;
    padding: 0;
    border-bottom: 0;
  }

  .public-below-headline-highlights .public-highlight-image {
    grid-column: auto;
    grid-row: auto;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 4px;
  }

  .public-media-play {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    color: #10151b;
    font-size: 11px;
    font-weight: 900;
    transform: translate(-50%, -50%);
  }

  .public-media-play-icon-only::before {
    content: "";
    width: 0;
    height: 0;
    margin-left: 2px;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 7px solid currentColor;
  }

  .public-matchday-roundup .public-highlight-image .public-media-play {
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.76);
    color: rgba(16, 21, 27, 0.62);
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    box-shadow: 0 1px 2px rgba(16, 21, 27, 0.08);
  }

  .public-matchday-roundup .public-highlight-image .public-media-play-icon-only::before {
    margin-left: 1px;
    border-top-width: 4px;
    border-bottom-width: 4px;
    border-left-width: 6px;
  }

  .public-matchday-roundup .public-cover-story span,
  .public-matchday-roundup .public-cover-story strong,
  .public-matchday-roundup .public-cover-story small {
    min-width: 0;
  }

  .public-matchday-roundup .public-cover-story span {
    grid-column: 2 / 5;
    grid-row: 1 / 2;
  }

  .public-matchday-roundup .public-cover-story .public-roundup-meta {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    grid-column: 2 / 5;
    grid-row: 1 / 2;
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

  .public-matchday-roundup .public-cover-story small {
    grid-column: 2 / 5;
    grid-row: 3 / 4;
    color: #607086;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.15;
  }

  .public-roundup-duration,
  .public-roundup-arrow {
    color: #263241;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
  }

  .public-roundup-duration {
    grid-column: auto;
    grid-row: auto;
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

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-cover-story strong {
    grid-column: 2 / 4;
    font-size: 13.5px;
    line-height: 1.14;
  }

  .public-matchday-main-lower:has(.public-roundup-video-panel) .public-matchday-roundup .public-cover-story small {
    color: #6b7786;
    line-height: 1.2;
  }

  .public-below-headline-highlights .public-cover-story span,
  .public-below-headline-highlights .public-cover-story strong,
  .public-below-headline-highlights .public-cover-story small {
    grid-column: auto;
    grid-row: auto;
  }

  .public-below-headline-highlights .public-cover-story strong {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.15;
  }

  .public-below-headline-highlights .public-cover-story small {
    margin: 0;
    color: #607086;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.35;
  }

  .public-highlight-image-link,
  .public-cover-story-title-link {
    color: inherit;
    text-decoration: none;
  }

  .public-highlight-image-link {
    display: block;
  }

  .public-cover-story-title-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-matchday-main-lower:has(.public-below-headline-highlights) .public-below-headline-side {
    padding-top: 22px;
  }

  .public-editorial-more-link {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }

  .public-complement-media {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
    background:
      linear-gradient(rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.62)),
      url("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=700&q=80") center / cover;
  }

  .public-complement-media img,
  .public-complement-media iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .public-complement-media img {
    object-fit: cover;
    object-position: center;
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

  .public-complement-body {
    display: grid;
    gap: 6px;
  }

  .public-complement-label {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-complement-body strong {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 17px;
    line-height: 1.18;
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

  .public-complement-title-link {
    color: inherit;
    text-decoration: none;
  }

  .public-complement-title-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-complement-body p {
    margin: 0;
    color: #607086;
    font-size: 13px;
    line-height: 1.35;
  }

  .public-highlight-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-highlight-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-cover-story span {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-cover-story strong {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.15;
  }

  .public-matchday-editorial p,
  .public-matchday-feature p,
  .public-matchday-cover-side p {
    margin: 0;
    color: #607086;
  }

  .public-matchday-cover-side h3 {
    padding-top: 8px;
    border-top: 4px solid #10151b;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-news h3 {
    padding-top: 0;
    border-top: 0;
    font-size: 14px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-matchday-news {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
    min-height: 100%;
    padding-right: 0;
    border-right: 0;
  }

  .public-news-list {
    display: grid;
    gap: 0;
    align-content: start;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    scrollbar-color: rgba(96, 112, 134, 0.3) transparent;
    scrollbar-width: thin;
  }

  .public-news-list::-webkit-scrollbar {
    width: 4px;
  }

  .public-news-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .public-news-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(96, 112, 134, 0.28);
  }

  .public-news-item {
    display: grid;
    gap: 7px;
    padding: 0 0 14px;
    border-bottom: 1px solid #e6ebf1;
  }

  .public-news-item + .public-news-item {
    padding-top: 14px;
  }

  .public-news-thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-news-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-news-copy {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .public-news-list time {
    display: block;
    color: #c40012;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
  }

  .public-news-title {
    display: block;
    color: inherit;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.15;
    text-decoration: none;
  }

  .public-news-title:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-news-subtitle {
    margin: 0;
    color: #607086;
    font-size: 12px;
    line-height: 1.35;
  }

  .public-important-news {
    display: grid;
    gap: 16px;
    padding: 18px;
  }

  .public-important-news-head h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-important-news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 14px;
  }

  .public-important-news-card {
    display: grid;
    align-content: start;
    gap: 8px;
    min-width: 0;
  }

  .public-important-news-image,
  .public-important-news-image-link {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 4px;
    background: #eef2f6;
  }

  .public-important-news-image img,
  .public-important-news-image-link img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .public-important-news-label {
    color: #c40012;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
  }

  .public-important-news-title {
    display: block;
    color: inherit;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.15;
    text-decoration: none;
  }

  .public-important-news-title:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .public-important-news-card p {
    margin: 0;
    color: #607086;
    font-size: 13px;
    line-height: 1.35;
  }

  .public-matchday-summary {
    display: grid;
    gap: 0;
  }

  .public-matchday-summary span {
    padding: 8px 0;
    border-bottom: 1px solid #e6ebf1;
    border-radius: 0;
    background: transparent;
    color: #34404d;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.32;
  }

  .public-matchday-feature-game {
    display: grid;
    grid-template-columns: 1fr;
    gap: 9px;
    align-items: center;
    min-height: 210px;
    padding: 14px;
    border: 1px solid #dde4ec;
    border-radius: 0;
    background: #f8fafc;
  }

  .public-matchday-feature-team {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
    font-weight: 900;
  }

  .public-matchday-feature-score {
    min-width: 74px;
    text-align: center;
  }

  .public-matchday-feature-score strong {
    display: block;
    font-size: 24px;
  }

  .public-matchday-future {
    padding: 20px;
    color: #607086;
  }

  .public-matchday-group {
    display: grid;
    gap: 10px;
  }

  .public-matchday-group h3 {
    color: #263241;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-matchday-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    width: min(760px, 100%);
    margin: 0 auto;
    padding: 10px 12px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
  }

  .public-matchday-card-finished {
    border-color: #e3e9f0;
    background: #ffffff;
  }

  .public-matchday-card-live {
    border-color: #e3e9f0;
    background: #ffffff;
  }

  .public-matchday-card-halftime {
    border-color: #e3e9f0;
    background: #ffffff;
  }

  .public-matchday-card-scheduled {
    border-color: #e3e9f0;
    background: #ffffff;
  }

  .public-matchday-card-unknown {
    border-color: #d8dee6;
    background: #ffffff;
  }

  .public-matchday-team:first-child {
    text-align: right;
  }

  .public-matchday-team:last-of-type {
    text-align: left;
  }

  .public-matchday-team {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .public-matchday-team:first-child {
    justify-content: flex-end;
  }

  .public-matchday-team:last-of-type {
    justify-content: flex-start;
  }

  .public-matchday-team-copy {
    min-width: 0;
  }

  .public-matchday-team strong,
  .public-matchday-score strong {
    display: block;
    font-size: 14px;
  }

  .public-matchday-team small,
  .public-matchday-score small {
    display: block;
    margin-top: 3px;
    color: #66717f;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .public-matchday-team-winner strong {
    color: #137a3a;
  }

  .public-team-badge {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 30px;
    height: 30px;
    overflow: hidden;
    border: 1px solid #d8dee6;
    border-radius: 999px;
    background: #f8fafc;
    color: #263241;
    font-size: 11px;
    font-weight: 900;
  }

  .public-team-badge img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .public-matchday-score {
    min-width: 72px;
    text-align: center;
  }

  .public-matchday-score strong {
    font-size: 18px;
    letter-spacing: 0;
  }

  .public-matchday-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 999px;
    background: #eef2f6;
    font-size: 9.5px;
  }

  .public-matchday-status-finished {
    background: #e9edf2;
    color: #4e5b69;
  }

  .public-matchday-status-live {
    background: #edf7f1;
    color: #286943;
  }

  .public-matchday-status-live::before,
  .public-matchday-status-halftime::before {
    content: "";
    width: 6px;
    height: 6px;
    margin-right: 2px;
    border-radius: 999px;
    background: #17a34a;
  }

  .public-matchday-status-halftime {
    background: #edf7f1;
    color: #286943;
  }

  .public-matchday-status-scheduled {
    background: #f4f1e8;
    color: #6b5a22;
  }

  .public-matchday-status-unknown {
    background: #eef2f6;
    color: #506075;
  }

  .public-matchday-meta {
    grid-column: 1 / -1;
    justify-content: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: #607086;
    font-size: 11px;
  }

  .public-matchday-tv {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 7px;
    border: 1px solid #dce3eb;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-weight: 800;
  }

  .public-matchday-tv img {
    width: 28px;
    height: 18px;
    object-fit: contain;
  }

  .public-matchday-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    min-width: 0;
    padding: 0;
    overflow-x: auto;
    border-top: 2px solid #10151b;
    border-bottom: 0;
    background: #ffffff;
  }

  .public-matchday-nav a,
  .public-matchday-nav span {
    display: inline-block;
    flex: 0 0 auto;
    padding: 8px 13px;
    border: 0;
    border-right: 1px solid #dfe5ec;
    border-radius: 0;
    background: #ffffff;
    color: #263241;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-nav a[aria-current="page"] {
    border-color: #c40012;
    background: #c40012;
    color: #ffffff;
  }

  .public-matchday-date-row {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    min-width: 0;
    margin-left: auto;
  }

  .public-matchday-date-context {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    color: #66717f;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    text-align: right;
    white-space: nowrap;
  }

  .public-table-wrap {
    overflow-x: auto;
    padding: 20px;
  }

  .public-table {
    width: 100%;
    min-width: 1080px;
    border-collapse: collapse;
    font-size: 13px;
  }

  .public-table th,
  .public-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #e6ebf1;
    text-align: right;
    white-space: nowrap;
  }

  .public-table th {
    color: #506075;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-table-club {
    min-width: 300px;
    text-align: left;
  }

  .public-club-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .public-club-name {
    min-width: 0;
    overflow: hidden;
    font-weight: 900;
    text-overflow: ellipsis;
  }

  .public-club-form {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-left: auto;
    color: #66717f;
    font-size: 11px;
    font-weight: 800;
    text-align: right;
    white-space: nowrap;
  }

  .public-table-divider {
    border-left: 2px solid #d8dee6;
  }

  .public-points {
    font-weight: 900;
  }

  .public-gd-positive {
    color: #137a3a;
    font-weight: 900;
  }

  .public-gd-negative {
    color: #b4232b;
    font-weight: 900;
  }

  .public-gd-neutral {
    color: #607086;
    font-weight: 900;
  }

  .public-form-list {
    display: inline-flex;
    gap: 4px;
  }

  .public-form-list span {
    padding: 3px 5px;
    border-radius: 999px;
    background: #eef2f6;
    font-size: 11px;
    font-weight: 900;
  }

  .public-form-win {
    color: #137a3a;
  }

  .public-form-draw {
    color: #607086;
  }

  .public-form-loss {
    color: #b4232b;
  }

  .public-diagnostic {
    margin-top: 18px;
    padding: 18px 20px;
    border: 1px solid #ffd3a3;
    border-radius: 8px;
    background: #fff8ee;
    color: #4a2d00;
  }

  .public-diagnostic h2,
  .public-diagnostic p {
    margin: 0;
  }

  .public-diagnostic p {
    margin-top: 8px;
  }

  .public-diagnostic pre {
    overflow-x: auto;
    margin: 14px 0 0;
    padding: 14px;
    border-radius: 6px;
    background: #ffffff;
    color: #10151b;
    font-size: 13px;
    white-space: pre-wrap;
  }

  .public-logo-diagnostic {
    margin-top: 18px;
    padding: 16px;
    border: 1px solid #d8dee6;
    border-radius: 8px;
    background: #f8fafc;
    color: #26313d;
  }

  .public-logo-diagnostic h2,
  .public-logo-diagnostic p {
    margin: 0;
  }

  .public-logo-diagnostic p {
    margin-top: 6px;
    color: #667282;
    font-size: 13px;
  }

  .public-logo-diagnostic table {
    width: 100%;
    margin-top: 12px;
    border-collapse: collapse;
    font-size: 12px;
  }

  .public-logo-diagnostic th,
  .public-logo-diagnostic td {
    padding: 8px;
    border-top: 1px solid #e1e6ed;
    text-align: left;
    vertical-align: top;
  }

  .public-logo-diagnostic code {
    word-break: break-all;
  }

  @media (max-width: 760px) {
    .public-matchday-shell {
      padding: 0 16px 16px;
    }

    .public-top-stack {
      margin: 0 -16px;
      padding: 0 16px;
    }

    #jogos,
    #classificacao {
      scroll-margin-top: 156px;
    }

    .public-matchday-panel[aria-label="Navegacao de jornadas"] {
      margin: 0 -16px;
    }

    .public-season-nav-inner {
      padding: 8px 16px 9px;
    }

    .public-matchday-hero h1 {
      font-size: 32px;
    }

    .public-site-topbar {
      grid-template-columns: 1fr;
    }

    .public-site-menu,
    .public-site-actions {
      display: none;
    }

  .public-season-nav-bar {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .public-matchday-card {
      grid-template-columns: 1fr;
      text-align: left;
    }

    .public-matchday-cover {
      grid-template-columns: 1fr;
      grid-template-areas:
        "feature"
        "main"
        "news";
    }

    .public-cover-headline,
    .public-matchday-main-lower {
      grid-template-columns: 1fr;
    }

    .public-matchday-main-lower:has(.public-roundup-video-panel) {
      grid-template-columns: 1fr;
    }

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

    .public-cover-story-strip {
      grid-template-columns: 1fr;
    }

    .public-matchday-editorial,
    .public-matchday-feature,
    .public-matchday-cover-side,
    .public-matchday-news {
      padding-right: 0;
      border-right: 0;
    }

    .public-matchday-team:first-child,
    .public-matchday-team:last-of-type,
    .public-matchday-score {
      text-align: left;
    }
  }

  .public-matchday-panel[aria-label="Navegacao de jornadas"] {
    max-width: none;
    margin: 0 -24px;
    border: 0;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 18px rgba(12, 22, 34, 0.06);
  }

  .public-matchday-panel[aria-label="Navegacao de jornadas"] header {
    display: none;
  }

  .public-season-nav-inner {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    align-items: center;
    min-height: 52px;
    max-width: 1512px;
    margin: 0 auto;
    padding: 0;
  }

  @media (max-width: 760px) {
    .public-matchday-panel[aria-label="Navegacao de jornadas"] {
      margin: 0 -16px;
    }

    .public-season-nav-inner {
      gap: 8px;
      padding: 8px 16px 9px;
    }

    .public-matchday-date-context {
      text-align: left;
    }

    .public-matchday-date-row {
      margin-left: 0;
      justify-content: flex-start;
    }
  }
`;

function signedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function goalDifferenceClass(value: number) {
  return value > 0 ? "public-gd-positive" : value < 0 ? "public-gd-negative" : "public-gd-neutral";
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatKickoffTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(new Date(value));
}

function formatMiniCardKickoff(value: string) {
  const date = new Date(value);
  const dayMonth = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  }).format(date);
  const time = formatKickoffTime(value);

  return `${dayMonth} · ${time}`;
}

function formatMatchdayDateContext(matches: PublicSeasonMatch[]) {
  const kickoffDates = matches
    .map((match) => new Date(match.kickoff_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime());

  if (kickoffDates.length === 0) return "Data por definir";

  const firstDate = kickoffDates[0];
  const lastDate = kickoffDates[kickoffDates.length - 1];
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const dayFormatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    timeZone: "Europe/Lisbon"
  });
  const monthFormatter = new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    timeZone: "Europe/Lisbon"
  });
  const monthKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Europe/Lisbon"
  });

  const firstLabel = dateFormatter.format(firstDate);
  const lastLabel = dateFormatter.format(lastDate);
  if (firstLabel === lastLabel) return firstLabel;

  const sameMonth = monthKeyFormatter.format(firstDate) === monthKeyFormatter.format(lastDate);
  if (sameMonth) {
    return `${dayFormatter.format(firstDate)}–${dayFormatter.format(lastDate)} ${monthFormatter.format(lastDate)}`;
  }

  return `${firstLabel} – ${lastLabel}`;
}

function statusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "live") return "AO VIVO";
  if (normalized === "halftime") return "AO VIVO";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status;
}

function statusKind(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "finished";
  if (normalized === "live") return "live";
  if (normalized === "halftime") return "halftime";
  if (normalized === "scheduled") return "scheduled";
  return "unknown";
}

function sideBlockTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    opiniao: "OPINIÃO",
    arbitragem: "ARBITRAGEM",
    balanco: "BALANÇO",
    analise: "ANÁLISE",
    cronica: "CRÓNICA",
    "figura-da-jornada": "FIGURA DA JORNADA",
    outro: "EDITORIAL"
  };

  return value ? labels[value] ?? null : null;
}

function cleanPublicSideBlockText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const debugLinePattern = /^(estado|status|side_block_status)\s*:\s*(published|draft)$/i;
  const statusOnlyPattern = /^(published|draft)$/i;
  const cleanLines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !debugLinePattern.test(line) && !statusOnlyPattern.test(line));

  return cleanLines.join("\n").trim() || null;
}

function cleanReferenceSnapshotText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeReferenceLabel(value?: string | null) {
  return cleanReferenceSnapshotText(value)?.toLowerCase() ?? "";
}

function normalizeReferenceSourceType(sourceType?: string | null) {
  const normalized = normalizeReferenceLabel(sourceType);

  if (normalized === "matchday_editorials") return "matchday_editorial";
  if (normalized === "matchday_highlights") return "matchday_highlight";
  if (normalized === "matchday_roundup_items") return "matchday_roundup_item";
  if (normalized === "articles") return "article";

  return normalized;
}

function isArtificialFreeZoneReferenceLabel(item: PublicReferenceCompositionItem) {
  const label = normalizeReferenceLabel(item.label_snapshot);
  const sourceType = normalizeReferenceSourceType(item.source_type);

  if (!label) return false;
  if (label === "zona editorial final" || label === "mais noticias da jornada" || label === "mais notícias da jornada") return true;
  if (sourceType === "matchday_editorial") {
    return label === "manchete" || label === "complemento" || label === "complemento da manchete" || label === "bloco lateral";
  }
  if (sourceType === "article") {
    return label === "artigo / noticia" || label === "artigo / notícia";
  }

  return false;
}

function publicFreeZoneReferenceLabel(item: PublicReferenceCompositionItem) {
  return isArtificialFreeZoneReferenceLabel(item) ? "" : cleanReferenceSnapshotText(item.label_snapshot) || "";
}

function firstReferenceSlotItem(items?: PublicReferenceCompositionItem[]) {
  return items?.[0] ?? null;
}

function hasReferenceSlotContent(item?: PublicReferenceCompositionItem | null) {
  return Boolean(
    cleanReferenceSnapshotText(item?.title_snapshot) ||
      cleanReferenceSnapshotText(item?.subtitle_snapshot) ||
      cleanReferenceSnapshotText(item?.image_url_snapshot) ||
      cleanReferenceSnapshotText(item?.link_url_snapshot) ||
      cleanReferenceSnapshotText(item?.label_snapshot)
  );
}

function matchResult(match: PublicSeasonMatch) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const kind = statusKind(match.status);
  if ((kind !== "finished" && kind !== "live" && kind !== "halftime") || !hasScore) {
    return "vs";
  }

  return `${match.home_score} - ${match.away_score}`;
}

function teamInitials(name?: string | null, shortName?: string | null) {
  const source = shortName || name || "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "FC";
}

function shortTeamLabel(name?: string | null, shortName?: string | null) {
  const editorialName = name?.trim();
  const fallback = shortName?.trim() || editorialName || "Equipa";

  if (!editorialName) {
    return fallback;
  }

  return editorialName.length <= 20 ? editorialName : fallback;
}

function isWinner(match: PublicSeasonMatch, side: "home" | "away") {
  if (match.status !== "finished" || match.home_score === null || match.away_score === null || match.home_score === match.away_score) {
    return false;
  }

  return side === "home" ? match.home_score > match.away_score : match.away_score > match.home_score;
}

function renderStatsCells(stats: ClassificationSplit, options: { divider?: boolean; emphasizePoints?: boolean; group?: string } = {}) {
  return PUBLIC_STAT_COLUMNS.map((column, index) => {
    const value = stats[column.key];
    const className = [
      options.divider && index === 0 ? "public-table-divider" : "",
      column.key === "goalDifference" ? goalDifferenceClass(value) : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <td className={className || undefined} key={`${options.group ?? "stats"}-${column.key}`}>
        {column.key === "points" ? (
          <b className={options.emphasizePoints ? "public-points" : undefined}>{value}</b>
        ) : column.key === "goalDifference" ? (
          signedNumber(value)
        ) : (
          value
        )}
      </td>
    );
  });
}

function renderStatHeaders(group: string) {
  return PUBLIC_STAT_COLUMNS.map((column, index) => (
    <th className={index === 0 ? "public-table-divider" : undefined} key={`${group}-${column.key}`}>
      {column.label}
    </th>
  ));
}

function TeamBadge({ logoUrl, name, shortName }: { logoUrl?: string | null; name?: string | null; shortName?: string | null }) {
  return <PublicTeamBadge fallbackLabel={teamInitials(name, shortName)} logoUrl={logoUrl} />;
}

function BroadcastBadge({ match }: { match: PublicSeasonMatch }) {
  if (!match.broadcastChannel) {
    return null;
  }

  return (
    <span className="public-matchday-tv">
      {match.broadcastChannel.logo_url ? <img alt="" src={match.broadcastChannel.logo_url} /> : null}
      <span>{match.broadcastChannel.name}</span>
    </span>
  );
}

function CompactMatchCard({ match, focus }: { match: PublicSeasonMatch; focus?: boolean }) {
  const kind = statusKind(match.status);
  const broadcastChannelName = match.broadcastChannel?.name?.trim();
  const hasScore = match.home_score !== null && match.away_score !== null;
  const showScore = hasScore && (kind === "finished" || kind === "live" || kind === "halftime");
  const liveStatus = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} · ${match.minute}'` : statusLabel(match.status);

  return (
    <article className={`public-matchday-mini-card public-matchday-mini-card-${kind}`} data-live-focus={focus ? "true" : undefined}>
      <span className="public-matchday-mini-team">
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
        <span>{shortTeamLabel(match.homeTeam?.name, match.homeTeam?.short_name)}</span>
        {showScore ? <b className="public-matchday-mini-score">{match.home_score}</b> : null}
      </span>
      <span className="public-matchday-mini-team">
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <span>{shortTeamLabel(match.awayTeam?.name, match.awayTeam?.short_name)}</span>
        {showScore ? <b className="public-matchday-mini-score">{match.away_score}</b> : null}
      </span>
      <span className="public-matchday-mini-status">
        {kind === "finished" ? (
          <span>Finalizado</span>
        ) : kind === "live" || kind === "halftime" ? (
          <span>{liveStatus}</span>
        ) : kind === "scheduled" ? (
          <>
            <time className="public-matchday-mini-time" dateTime={match.kickoff_at}>{formatMiniCardKickoff(match.kickoff_at)}</time>
            {broadcastChannelName ? (
              <>
                <span className="public-matchday-mini-separator" aria-hidden="true">·</span>
                <span className="public-matchday-mini-channel">{broadcastChannelName}</span>
              </>
            ) : null}
          </>
        ) : (
          <span>{statusLabel(match.status)}</span>
        )}
      </span>
    </article>
  );
}

function MatchCard({ match }: { match: PublicSeasonMatch }) {
  const kind = statusKind(match.status);
  const statusText = match.minute && (kind === "live" || kind === "halftime") ? `${statusLabel(match.status)} · ${match.minute}'` : statusLabel(match.status);
  const homeWinner = isWinner(match, "home");
  const awayWinner = isWinner(match, "away");

  return (
    <article className={`public-matchday-card public-matchday-card-${kind}`} key={match.id}>
      <div className={`public-matchday-team ${homeWinner ? "public-matchday-team-winner" : ""}`}>
        <div className="public-matchday-team-copy">
          <strong>{match.homeTeam?.name ?? "Equipa da casa"}</strong>
          <small>Casa</small>
        </div>
        <TeamBadge logoUrl={match.homeTeam?.logo_url} name={match.homeTeam?.name} shortName={match.homeTeam?.short_name} />
      </div>
      <div className="public-matchday-score">
        <strong>{matchResult(match)}</strong>
        <small className={`public-matchday-status public-matchday-status-${kind}`}>{statusText}</small>
      </div>
      <div className={`public-matchday-team ${awayWinner ? "public-matchday-team-winner" : ""}`}>
        <TeamBadge logoUrl={match.awayTeam?.logo_url} name={match.awayTeam?.name} shortName={match.awayTeam?.short_name} />
        <div className="public-matchday-team-copy">
          <strong>{match.awayTeam?.name ?? "Equipa visitante"}</strong>
          <small>Fora</small>
        </div>
      </div>
      <div className="public-matchday-meta">
        <span>{formatKickoff(match.kickoff_at)}</span>
        {match.venue ? <span>{match.venue}</span> : null}
        <BroadcastBadge match={match} />
      </div>
    </article>
  );
}

function DiagnosticPanel({ diagnostic }: { diagnostic: PublicMatchdayDiagnostic }) {
  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      <section className="public-diagnostic">
        <h2>Diagnóstico temporário da página pública</h2>
        <p>A rota foi carregada, mas os dados necessários não foram encontrados ou ocorreu um erro de leitura.</p>
        <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
      </section>
    </main>
  );
}

function logoDiagnosticStatus(logoUrl?: string | null) {
  const value = logoUrl?.trim();

  if (!value) {
    return "sem logo_url";
  }

  if (!/^https?:\/\//i.test(value)) {
    return "valor nao URL";
  }

  if (/Special:(FilePath|Redirect)/i.test(value)) {
    return "URL Wikimedia Special";
  }

  if (/upload\.wikimedia\.org/i.test(value)) {
    return "URL direta Wikimedia";
  }

  return "URL http/https";
}

function LogoDiagnosticPanel({ context }: { context: PublicMatchdayContext }) {
  const rowsById = new Map<
    string,
    {
      name: string;
      shortName: string;
      slug: string;
      logoUrl: string | null;
      sources: Set<string>;
    }
  >();
  const addTeam = (
    team: PublicSeasonMatch["homeTeam"],
    source: string
  ) => {
    if (!team) {
      return;
    }

    const existing = rowsById.get(team.id);
    if (existing) {
      existing.sources.add(source);
      return;
    }

    rowsById.set(team.id, {
      name: team.name,
      shortName: team.short_name,
      slug: team.slug,
      logoUrl: team.logo_url,
      sources: new Set([source])
    });
  };

  context.participants.forEach((participant, index) => {
    addTeam(participant.team, `participante ${index + 1}`);
  });
  context.matchesForMatchday.forEach((match) => {
    addTeam(match.homeTeam, `J${context.matchday.number} casa`);
    addTeam(match.awayTeam, `J${context.matchday.number} fora`);
  });
  const rows = Array.from(rowsById.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="public-logo-diagnostic" aria-label="Diagnóstico temporário dos emblemas">
      <h2>Diagnóstico temporário dos emblemas</h2>
      <p>
        Esta caixa só aparece com <code>?debug_logos=1</code>. A consola do browser também indica os URLs que falham no carregamento.
      </p>
      <table>
        <thead>
          <tr>
            <th>Clube</th>
            <th>Slug</th>
            <th>Logo recebido</th>
            <th>Estado</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td>{row.name || row.shortName}</td>
              <td>{row.slug}</td>
              <td>{row.logoUrl ? <code>{row.logoUrl}</code> : "—"}</td>
              <td>{logoDiagnosticStatus(row.logoUrl)}</td>
              <td>{Array.from(row.sources).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function PublicMatchdayPage({ params, searchParams }: PublicMatchdayPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;
  const query = searchParams ? await searchParams : {};

  if (competitionSlug === "liga-espanha") {
    redirect(`/competicoes/la-liga/${seasonLabel}/jornadas/${matchdayNumber}`);
  }

  const matchdayNumberValue = Number(matchdayNumber);
  const { context, diagnostic } = await getPublicMatchdayDiagnostic({
    competitionSlug,
    seasonLabel,
    matchdayNumber: matchdayNumberValue
  });

  if (!context) {
    return <DiagnosticPanel diagnostic={diagnostic} />;
  }
  const showLogoDiagnostic = query.debug_logos === "1";

  const seasonSegment = seasonLabelToUrlSegment(context.season.label);
  const seasonOptions = context.seasons.map((season) => ({
    id: season.id,
    label: season.label,
    href: `/competicoes/${context.competition.slug}/${seasonLabelToUrlSegment(season.label)}/jornadas/1`
  }));
  const currentSeasonHref = `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/1`;
  const currentCompetitionMenuItem = {
    label: context.competition.name,
    slug: context.competition.slug,
    href: `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${context.matchday.number}`
  };
  const publicCompetitionMenuBase = await getPublicCompetitionMenu().catch(() => []);
  const publicCompetitionMenu = publicCompetitionMenuBase.map((item) =>
    item.slug === currentCompetitionMenuItem.slug ? currentCompetitionMenuItem : item
  );

  if (!publicCompetitionMenu.some((item) => item.slug === currentCompetitionMenuItem.slug)) {
    publicCompetitionMenu.unshift(currentCompetitionMenuItem);
  }

  const classificationRows = buildAccumulatedClassification({
    participants: context.participants,
    matches: context.matchesForSeason,
    matchdays: context.matchdays,
    selectedMatchday: context.matchday
  });
  const matchdayHref = (number: number) => `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${number}`;
  const gamesPageHref = `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${context.matchday.number}/jogos`;
  const liveMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "live");
  const halftimeMatches = context.matchesForMatchday.filter((match) => statusKind(match.status) === "halftime");
  const selectedMatchdayDateContext = formatMatchdayDateContext(context.matchesForMatchday);
  const editorial = context.editorial;
  const liveBelowHeadlineSubtitle = await readBelowHeadlineSubtitle(context.matchday.id);
  const publishedHeadline = editorial?.status === "published" ? editorial : null;
  const usePublishedReferenceComposition = context.hasPublishedReferenceComposition;
  const referenceHeadline = usePublishedReferenceComposition ? firstReferenceSlotItem(context.referenceSlots.headline) : null;
  const referenceComplement = usePublishedReferenceComposition ? firstReferenceSlotItem(context.referenceSlots.complement) : null;
  const referenceSideBlock = usePublishedReferenceComposition ? firstReferenceSlotItem(context.referenceSlots.side_block) : null;
  const referenceEditorialLineItems = usePublishedReferenceComposition ? context.referenceSlots.editorial_line_item ?? [] : [];
  const useReferenceRoundupItems = usePublishedReferenceComposition && context.hasReferenceRoundupItems;
  const effectiveRoundupItems = useReferenceRoundupItems
    ? context.referenceRoundupItems
    : usePublishedReferenceComposition
      ? []
      : context.roundupItems;
  const headlineTitle = referenceHeadline
    ? cleanReferenceSnapshotText(referenceHeadline.title_snapshot) || "Manchete da jornada"
    : publishedHeadline?.title || "Manchete da jornada";
  const headlineSummary = referenceHeadline
    ? cleanReferenceSnapshotText(referenceHeadline.subtitle_snapshot) || "Espaço reservado para a leitura editorial desta jornada."
    : publishedHeadline?.summary || "Espaço reservado para a leitura editorial desta jornada.";
  const headlineImageUrl = referenceHeadline
    ? cleanReferenceSnapshotText(referenceHeadline.image_url_snapshot)
    : publishedHeadline?.image_url?.trim() || null;
  const headlineLinkUrl = referenceHeadline
    ? cleanReferenceSnapshotText(referenceHeadline.link_url_snapshot)
    : cleanReferenceSnapshotText(publishedHeadline?.headline_link_url);
  const complementaryMode = editorial?.complementary_mode ?? "none";
  const referenceHighlightItems = usePublishedReferenceComposition
    ? [...(context.referenceSlots.highlight ?? [])]
        .filter(hasReferenceSlotContent)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          label: cleanReferenceSnapshotText(item.label_snapshot),
          title: cleanReferenceSnapshotText(item.title_snapshot) || "Destaque da jornada",
          subtitle: cleanReferenceSnapshotText(item.subtitle_snapshot),
          imageUrl: cleanReferenceSnapshotText(item.image_url_snapshot),
          linkUrl: cleanReferenceSnapshotText(item.link_url_snapshot)
        }))
    : [];
  const configuredBelowHeadlineMode = editorial?.below_headline_mode === "roundup" ? "roundup" : "highlights";
  const belowHeadlineMode = referenceHighlightItems.length > 0 ? "highlights" : configuredBelowHeadlineMode;
  const belowHeadlineHeading =
    editorial?.below_headline_heading?.trim() || `Jornada ${String(context.matchday.number).padStart(2, "0")}`;
  const belowHeadlineSubtitle =
    belowHeadlineMode === "highlights"
      ? liveBelowHeadlineSubtitle
      : null;
  const belowHeadlineHeadingColor = editorial?.below_headline_heading_color?.trim();
  const belowHeadlineLabel = belowHeadlineMode === "highlights" ? belowHeadlineHeading : `Jornada ${String(context.matchday.number).padStart(2, "0")}`;
  const belowHeadlineLabelColor = belowHeadlineMode === "highlights" ? belowHeadlineHeadingColor : null;
  const effectiveHighlights =
    referenceHighlightItems.length > 0
      ? referenceHighlightItems
      : context.highlights.map((highlight) => ({
          id: highlight.id,
          label: highlight.label?.trim() || null,
          title: highlight.title?.trim() || "Destaque da jornada",
          subtitle: highlight.subtitle?.trim() || null,
          imageUrl: highlight.image_url?.trim() || null,
          linkUrl: highlight.link_url?.trim() || null
        }));
  const hasPublishedComplementaryStory = usePublishedReferenceComposition
    ? hasReferenceSlotContent(referenceComplement)
    : complementaryMode === "complementary_story" &&
      editorial?.complementary_status === "published" &&
      Boolean(editorial?.complementary_title?.trim());
  const complementaryImageUrl = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceComplement?.image_url_snapshot)
    : editorial?.complementary_image_url?.trim() || null;
  const complementaryLabel = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceComplement?.label_snapshot)
    : editorial?.complementary_label || null;
  const complementaryTitle = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceComplement?.title_snapshot)
    : editorial?.complementary_title || null;
  const complementaryText = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceComplement?.subtitle_snapshot)
    : editorial?.complementary_text || null;
  const complementaryLinkUrl = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceComplement?.link_url_snapshot)
    : editorial?.complementary_link_url?.trim() || null;
  const sideBlockImageUrl = usePublishedReferenceComposition
    ? cleanReferenceSnapshotText(referenceSideBlock?.image_url_snapshot)
    : editorial?.side_block_image_url?.trim() || null;
  const explicitSideBlockLabel = usePublishedReferenceComposition ? cleanReferenceSnapshotText(referenceSideBlock?.label_snapshot) : cleanPublicSideBlockText(editorial?.side_block_label);
  const sideBlockLabel = usePublishedReferenceComposition ? explicitSideBlockLabel : explicitSideBlockLabel || sideBlockTypeLabel(editorial?.side_block_type);
  const sideBlockTitle = usePublishedReferenceComposition ? cleanReferenceSnapshotText(referenceSideBlock?.title_snapshot) : cleanPublicSideBlockText(editorial?.side_block_title);
  const sideBlockTitleColor = usePublishedReferenceComposition ? null : editorial?.side_block_title_color?.trim() || null;
  const sideBlockAuthor = usePublishedReferenceComposition ? null : cleanPublicSideBlockText(editorial?.side_block_author);
  const sideBlockText = usePublishedReferenceComposition ? cleanReferenceSnapshotText(referenceSideBlock?.subtitle_snapshot) : cleanPublicSideBlockText(editorial?.side_block_text);
  const sideBlockLinkUrl = usePublishedReferenceComposition ? cleanReferenceSnapshotText(referenceSideBlock?.link_url_snapshot) : editorial?.side_block_link_url?.trim() || null;
  const hasPublishedSideBlock = usePublishedReferenceComposition
    ? hasReferenceSlotContent(referenceSideBlock)
    : editorial?.side_block_status === "published" &&
      Boolean(sideBlockImageUrl || explicitSideBlockLabel || sideBlockTitle || sideBlockText);
  const focusedStripMatch = liveMatches[0] ?? halftimeMatches[0] ?? null;
  const latestZoneMode = editorial?.latest_zone_mode === "editorial_line" ? "editorial_line" : "latest_news";
  const configuredLatestZoneTitle = editorial?.latest_zone_title?.trim() ?? "";
  const latestZoneTitle = usePublishedReferenceComposition
    ? ""
    : latestZoneMode === "latest_news" ? configuredLatestZoneTitle || "Últimas notícias" : configuredLatestZoneTitle;
  const latestNewsItems = usePublishedReferenceComposition
    ? referenceEditorialLineItems.map((item) => ({
        id: item.id,
        timeLabel: publicFreeZoneReferenceLabel(item),
        title: cleanReferenceSnapshotText(item.title_snapshot) || "Notícia da jornada",
        subtitle: cleanReferenceSnapshotText(item.subtitle_snapshot) || "",
        imageUrl: cleanReferenceSnapshotText(item.image_url_snapshot),
        linkUrl: cleanReferenceSnapshotText(item.link_url_snapshot)
      }))
    : context.latestNews.map((item) => ({
        id: item.id,
        timeLabel: item.time_label || "",
        title: item.title || "Noticia da jornada",
        subtitle: item.subtitle?.trim() || "",
        imageUrl: item.image_url?.trim() || null,
        linkUrl: item.link_url?.trim() || null
      }));
  const showLatestZone = latestNewsItems.length > 0;
  const importantNewsItems = usePublishedReferenceComposition
    ? [...(context.referenceSlots.important_item ?? [])]
        .filter(hasReferenceSlotContent)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          label: publicFreeZoneReferenceLabel(item),
          title: cleanReferenceSnapshotText(item.title_snapshot) || "Notícia da jornada",
          subtitle: cleanReferenceSnapshotText(item.subtitle_snapshot),
          imageUrl: cleanReferenceSnapshotText(item.image_url_snapshot),
          linkUrl: cleanReferenceSnapshotText(item.link_url_snapshot)
        }))
    : [];
  const showImportantNews = importantNewsItems.length > 0;
  const showBelowHeadlineEditorialStrip =
    belowHeadlineMode === "highlights" || effectiveRoundupItems.length > 0 || !usePublishedReferenceComposition;

  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      {showLogoDiagnostic ? <LogoDiagnosticPanel context={context} /> : null}
      <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <a className="public-site-brand" href="/">
          Jornada<span>.pt</span>
        </a>
        <nav className="public-site-menu" aria-label="Competições principais">
          {publicCompetitionMenu.map((item) => (
            <a
              aria-current={item.slug === context.competition.slug ? "page" : undefined}
              href={item.href}
              key={item.slug}
            >
              {item.label}
            </a>
          ))}
          <a href={gamesPageHref}>Jogos</a>
          <a href="#classificacao">Classificação</a>
        </nav>
        <div className="public-site-actions" aria-label="Ações">
          <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
          <a href="/admin/gestor">Entrar</a>
        </div>
      </header>
      <section className="public-season-nav-bar" aria-label="Navegacao de jornadas">
        <div className="public-hidden-heading">
          <h2>Jornadas</h2>
          <p>Navegação principal da época {context.season.label}.</p>
        </div>
        <div className="public-season-nav-inner">
        <label className="public-season-select-wrap">
          <span>Época</span>
          <select className="public-season-select" data-season-select defaultValue={currentSeasonHref}>
            {seasonOptions.map((season) => (
              <option key={season.id} value={season.href}>
                {season.label}
              </option>
            ))}
          </select>
        </label>
        <nav className="public-matchday-nav">
          {context.matchdays.map((matchday) => (
            <a
              aria-current={matchday.id === context.matchday.id ? "page" : undefined}
              href={matchdayHref(matchday.number)}
              key={matchday.id}
            >
              J{String(matchday.number).padStart(2, "0")}
            </a>
          ))}
        </nav>
        <div className="public-matchday-date-row" aria-label="Data da jornada selecionada">
          <span className="public-matchday-date-context">
            {selectedMatchdayDateContext}
          </span>
        </div>
        </div>
      </section>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("DOMContentLoaded", function () {
              var select = document.querySelector("[data-season-select]");
              if (!select) return;
              select.addEventListener("change", function () {
                if (select.value) window.location.href = select.value;
              });
            });
          `
        }}
      />
      <section className="public-matchday-panel public-matchday-scoreboard-panel" aria-label="Visao rapida dos jogos">
        <div className="public-matchday-strip-shell">
          <button className="public-matchday-strip-button" data-strip-scroll="left" type="button" aria-label="Ver jogos anteriores">
            ‹
          </button>
          <div className="public-matchday-strip" data-matchday-strip>
            {context.matchesForMatchday.length > 0 ? (
              context.matchesForMatchday.map((match) => (
                <CompactMatchCard focus={focusedStripMatch?.id === match.id} key={match.id} match={match} />
              ))
            ) : (
              <p>Ainda nao ha jogos nesta jornada.</p>
            )}
          </div>
          <button className="public-matchday-strip-button" data-strip-scroll="right" type="button" aria-label="Ver jogos seguintes">
            ›
          </button>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener("DOMContentLoaded", function () {
                var strip = document.querySelector("[data-matchday-strip]");
                if (!strip) return;
                var focused = strip.querySelector("[data-live-focus='true']");
                if (focused && "scrollIntoView" in focused) {
                  focused.scrollIntoView({ block: "nearest", inline: "center" });
                }
                document.querySelectorAll("[data-strip-scroll]").forEach(function (button) {
                  button.addEventListener("click", function () {
                    var direction = button.getAttribute("data-strip-scroll") === "left" ? -1 : 1;
                    strip.scrollBy({ left: direction * Math.max(260, Math.round(strip.clientWidth * 0.85)), behavior: "smooth" });
                  });
                });
              });
            `
          }}
        />
      </section>

      <section className="public-matchday-panel" aria-label="Capa da jornada">
        <div className="public-matchday-cover">
          <aside className="public-matchday-feature public-side-editorial-block" aria-label="Bloco editorial lateral da jornada">
            <div className="public-side-editorial-inner">
              {hasPublishedSideBlock ? (
                sideBlockLinkUrl ? (
                  <a className="public-side-editorial-card-link" href={sideBlockLinkUrl} aria-label={sideBlockTitle ? `Abrir ${sideBlockTitle}` : "Abrir artigo"}>
                    {sideBlockImageUrl ? (
                      <div className="public-side-editorial-image">
                        <img alt="" src={sideBlockImageUrl} />
                      </div>
                    ) : null}
                    <div className="public-side-editorial-copy">
                      {sideBlockLabel ? <span className="public-side-editorial-label">{sideBlockLabel}</span> : null}
                      {sideBlockTitle ? <strong style={sideBlockTitleColor ? { color: sideBlockTitleColor } : undefined}>{sideBlockTitle}</strong> : null}
                      {sideBlockAuthor ? <small>Por {sideBlockAuthor}</small> : null}
                      {sideBlockText ? <p>{sideBlockText}</p> : null}
                    </div>
                  </a>
                ) : (
                <>
                  {sideBlockImageUrl ? (
                    <div className="public-side-editorial-image">
                      <img alt="" src={sideBlockImageUrl} />
                    </div>
                  ) : null}
                  <div className="public-side-editorial-copy">
                    {sideBlockLabel ? <span className="public-side-editorial-label">{sideBlockLabel}</span> : null}
                    {sideBlockTitle ? <strong style={sideBlockTitleColor ? { color: sideBlockTitleColor } : undefined}>{sideBlockTitle}</strong> : null}
                    {sideBlockAuthor ? <small>Por {sideBlockAuthor}</small> : null}
                    {sideBlockText ? <p>{sideBlockText}</p> : null}
                  </div>
                </>
                )
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
                  {headlineLinkUrl ? (
                    <a className="public-cover-headline-title-link" href={headlineLinkUrl}>
                      <h2 style={!referenceHeadline && publishedHeadline?.title_color ? { color: publishedHeadline.title_color } : undefined}>
                        {headlineTitle}
                      </h2>
                    </a>
                  ) : (
                    <h2 style={!referenceHeadline && publishedHeadline?.title_color ? { color: publishedHeadline.title_color } : undefined}>
                      {headlineTitle}
                    </h2>
                  )}
                  <p>{headlineSummary}</p>
                </div>
              </div>
            </article>
            <div className="public-matchday-main-lower">
              {belowHeadlineMode === "roundup" ? (
                <RoundupVideoSwitcher
                  items={effectiveRoundupItems}
                  heading={editorial?.roundup_video_heading ?? belowHeadlineHeading}
                  headingColor={editorial?.roundup_video_heading_color ?? belowHeadlineHeadingColor ?? null}
                  matchdayNumber={context.matchday.number}
                />
              ) : (
                <>
              {showBelowHeadlineEditorialStrip ? (
              <section
                className={`public-matchday-roundup public-below-headline-${belowHeadlineMode} public-editorial-flex-block`}
                data-editorial-slot="videos-ou-noticias"
                aria-label="Zona editorial abaixo da manchete"
              >
                <div className="public-editorial-block-head">
                  <div className="public-below-headline-heading-copy">
                    <span className="public-roundup-matchday-label" style={belowHeadlineLabelColor ? { color: belowHeadlineLabelColor } : undefined}>
                      {belowHeadlineLabel}
                    </span>
                    {belowHeadlineSubtitle ? <p className="public-below-headline-subtitle">{belowHeadlineSubtitle}</p> : null}
                  </div>
                </div>
                <div className="public-cover-story-strip" aria-label="Resumos e destaques da jornada">
              {belowHeadlineMode === "highlights" ? (
                effectiveHighlights.length > 0 ? (
                  effectiveHighlights.map((highlight) => {
                    const imageUrl = highlight.imageUrl;
                    const highlightLinkUrl = highlight.linkUrl;
                    return (
                      <article className="public-cover-story" key={highlight.id}>
                        {highlightLinkUrl ? (
                          <a className="public-highlight-image-link" href={highlightLinkUrl}>
                            <div className="public-highlight-image">
                              {imageUrl ? <img src={imageUrl} alt="" /> : null}
                            </div>
                          </a>
                        ) : (
                          <div className="public-highlight-image">
                            {imageUrl ? <img src={imageUrl} alt="" /> : null}
                          </div>
                        )}
                        {highlight.label ? <span>{highlight.label}</span> : null}
                        {highlightLinkUrl ? (
                          <a className="public-cover-story-title-link" href={highlightLinkUrl}>
                            <strong>{highlight.title}</strong>
                          </a>
                        ) : (
                          <strong>{highlight.title}</strong>
                        )}
                        {highlight.subtitle ? <small>{highlight.subtitle}</small> : null}
                      </article>
                    );
                  })
                ) : (
                  <>
                    <article className="public-cover-story">
                      <div className="public-highlight-image">
                        <img
                          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80"
                          alt=""
                        />
                      </div>
                      <span>Antevisão</span>
                      <strong>Os pontos de atenção antes da bola rolar</strong>
                    </article>
                    <article className="public-cover-story">
                      <div className="public-highlight-image">
                        <img
                          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=700&q=80"
                          alt=""
                        />
                      </div>
                      <span>Ambiente</span>
                      <strong>A jornada vista pelas bancadas e pelos protagonistas</strong>
                    </article>
                    <article className="public-cover-story">
                      <div className="public-highlight-image">
                        <img
                          src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=700&q=80"
                          alt=""
                        />
                      </div>
                      <span>Contexto</span>
                      <strong>O que pode mudar na tabela depois dos resultados</strong>
                    </article>
                  </>
                )
              ) : effectiveRoundupItems.length > 0 ? (
                effectiveRoundupItems.map((item) => {
                  const showPlay = Boolean(item.video_url) || item.type === "video" || item.type === "golos" || item.type === "resumo";
                  const imageUrl = item.image_url?.trim();
                  return (
                    <article className="public-cover-story" key={item.id}>
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
                })
              ) : (
                <>
                  <article className="public-cover-story">
                    <div className="public-highlight-image">
                      <img
                        src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80"
                        alt=""
                      />
                      <span className="public-media-play" aria-hidden="true">▶</span>
                    </div>
                    <span>Antevisão</span>
                    <strong>Os pontos de atenção antes da bola rolar</strong>
                    <small>Resumo completo</small>
                    <span className="public-roundup-duration">5:42</span>
                    <span className="public-roundup-arrow" aria-hidden="true">›</span>
                  </article>
                  <article className="public-cover-story">
                    <div className="public-highlight-image">
                      <img
                        src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=700&q=80"
                        alt=""
                      />
                      <span className="public-media-play" aria-hidden="true">▶</span>
                    </div>
                    <span>Ambiente</span>
                    <strong>A jornada vista pelas bancadas e pelos protagonistas</strong>
                    <small>Golos e melhores momentos</small>
                    <span className="public-roundup-duration">4:18</span>
                    <span className="public-roundup-arrow" aria-hidden="true">›</span>
                  </article>
                  <article className="public-cover-story">
                    <div className="public-highlight-image">
                      <img
                        src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=700&q=80"
                        alt=""
                      />
                      <span className="public-media-play" aria-hidden="true">▶</span>
                    </div>
                    <span>Contexto</span>
                    <strong>O que pode mudar na tabela depois dos resultados</strong>
                    <small>Notícia de contexto</small>
                    <span className="public-roundup-duration">6:21</span>
                    <span className="public-roundup-arrow" aria-hidden="true">›</span>
                  </article>
                </>
              )}
                </div>
              </section>
              ) : null}
              <aside className="public-matchday-cover-side public-editorial-flex-block public-below-headline-side" data-editorial-slot="video-ou-imagem-noticia" aria-label="Bloco complementar da jornada">
                {hasPublishedComplementaryStory ? (
                  <>
                    {complementaryImageUrl ? (
                      <div className="public-complement-media">
                        <img src={complementaryImageUrl} alt="" />
                      </div>
                    ) : null}
                    <div className="public-complement-body">
                      {complementaryLabel ? (
                        <span className="public-complement-label">{complementaryLabel}</span>
                      ) : null}
                      {complementaryTitle ? (
                        complementaryLinkUrl ? (
                          <a className="public-complement-title-link" href={complementaryLinkUrl}>
                            <strong>{complementaryTitle}</strong>
                          </a>
                        ) : (
                          <strong>{complementaryTitle}</strong>
                        )
                      ) : null}
                      {complementaryText ? <p>{complementaryText}</p> : null}
                      {complementaryLinkUrl ? (
                        <a className="public-editorial-more-link" href={complementaryLinkUrl}>
                          Ver mais <span aria-hidden="true">›</span>
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="public-complement-body">
                    <strong>Espaço editorial preparado</strong>
                    <p>Bloco complementar por definir.</p>
                  </div>
                )}
              </aside>
                </>
              )}
            </div>
          </div>
          {showLatestZone ? (
          <aside className="public-matchday-news" aria-label={latestZoneTitle || "Linha editorial"}>
            {latestZoneTitle ? <h3>{latestZoneTitle}</h3> : null}
            <ul className="public-news-list">
              {latestNewsItems.map((item) => (
                <li className="public-news-item" key={item.id}>
                  {item.imageUrl ? (
                    <div className="public-news-thumb">
                      <img alt="" src={item.imageUrl} />
                    </div>
                  ) : null}
                  <div className="public-news-copy">
                    {item.timeLabel ? <time dateTime={item.timeLabel}>{item.timeLabel}</time> : null}
                    {item.linkUrl ? (
                      <a className="public-news-title" href={item.linkUrl}>
                        {item.title}
                      </a>
                    ) : (
                      <span className="public-news-title">{item.title}</span>
                    )}
                    {item.subtitle ? <p className="public-news-subtitle">{item.subtitle}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
          ) : null}
        </div>
      </section>

      {showImportantNews ? (
        <section className="public-matchday-panel public-important-news" aria-label="Mais notícias da jornada">
          <div className="public-important-news-grid">
            {importantNewsItems.map((item) => (
                <article className="public-important-news-card" key={item.id}>
                  {item.imageUrl && item.linkUrl ? (
                    <a className="public-important-news-image-link" href={item.linkUrl}>
                      <img src={item.imageUrl} alt="" />
                    </a>
                  ) : item.imageUrl ? (
                    <span className="public-important-news-image">
                      <img src={item.imageUrl} alt="" />
                    </span>
                  ) : null}
                  {item.label ? <span className="public-important-news-label">{item.label}</span> : null}
                  {item.linkUrl ? (
                    <a className="public-important-news-title" href={item.linkUrl}>
                      {item.title}
                    </a>
                  ) : (
                    <strong className="public-important-news-title">{item.title}</strong>
                  )}
                  {item.subtitle ? <p>{item.subtitle}</p> : null}
                </article>
              ))}
          </div>
        </section>
      ) : null}

      <section className="public-matchday-panel" id="classificacao" aria-label="Classificacao acumulada">
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th rowSpan={2}>Pos</th>
                <th className="public-table-club" rowSpan={2}>Clube</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Total</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Casa</th>
                <th className="public-table-divider" colSpan={PUBLIC_STAT_COLUMNS.length}>Fora</th>
              </tr>
              <tr>
                {renderStatHeaders("total")}
                {renderStatHeaders("home")}
                {renderStatHeaders("away")}
              </tr>
            </thead>
            <tbody>
              {classificationRows.map((row, index) => (
                <tr key={row.teamId}>
                  <td>{index + 1}</td>
                  <td className="public-table-club">
                    <span className="public-club-cell">
                    <span className="public-club-name">{row.name}</span>
                    <span className="public-club-form">
                      <span>Últimos:</span>
                      {row.recentForm.length > 0 ? (
                        <span className="public-form-list">
                          {row.recentForm.map((result, resultIndex) => (
                            <span
                              className={
                                result.label.startsWith("V")
                                  ? "public-form-win"
                                  : result.label.startsWith("D")
                                    ? "public-form-loss"
                                    : "public-form-draw"
                              }
                              key={`${row.teamId}-${resultIndex}-${result.label}`}
                              title={result.title}
                            >
                              {result.label}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </span>
                    </span>
                  </td>
                  {renderStatsCells(totalClassificationStats(row), { divider: true, emphasizePoints: true, group: "total" })}
                  {renderStatsCells(row.home, { divider: true, group: "home" })}
                  {renderStatsCells(row.away, { divider: true, group: "away" })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


