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

type HomeCompetition = {
  id: string;
  name: string;
  slug: string | null;
  country: string | null;
  logo_url: string | null;
  is_active: boolean | null;
};

type HomeSeason = {
  id: string;
  competition_id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean | null;
};

type HomeMatchday = {
  id: string;
  season_id: string;
  number: number;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  status: string | null;
};

type HomeTeam = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
};

type HomeBroadcastChannel = {
  id: string;
  name: string;
  logo_url: string | null;
};

type HomeMatch = {
  id: string;
  competition_id: string;
  season_id: string;
  matchday_id: string | null;
  home_team_id: string;
  away_team_id: string;
  status: string | null;
  minute: number | null;
  kickoff_at: string | null;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  broadcast_channel_id: string | null;
};

type HomeGameSelectionData = {
  competitions: HomeCompetition[];
  seasons: HomeSeason[];
  matchdays: HomeMatchday[];
  matches: HomeMatch[];
  teams: HomeTeam[];
  broadcastChannels: HomeBroadcastChannel[];
  error: string | null;
};

type HomeEditorialData = {
  editorial: SiteEditorial | null;
  highlights: SiteEditorialHighlight[];
  latestNews: SiteEditorialLatestNews[];
  roundupItems: SiteEditorialRoundupItem[];
  featuredMatches: SiteFeaturedMatch[];
  error: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    saved?: string;
    featured_saved?: string;
    error?: string;
    detail?: string;
    home_competition_id?: string;
    home_season_id?: string;
    home_matchday_id?: string;
  }>;
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

  .home-admin-success {
    margin-top: 18px;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    background: #f0fdf4;
    color: #166534;
    padding: 14px 16px;
    font-weight: 800;
    line-height: 1.45;
  }

  .home-admin-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(420px, 0.82fr);
    gap: 18px;
    margin-top: 18px;
  }

  .home-admin-stack {
    display: grid;
    gap: 18px;
    align-content: start;
    min-width: 0;
  }

  .home-admin-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    background: #fff;
    min-width: 0;
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

  .home-admin-edit-form {
    display: grid;
    gap: 18px;
    padding: 20px;
  }

  .home-admin-form-section {
    display: grid;
    gap: 14px;
    border: 1px solid #e6ebf1;
    border-radius: 8px;
    padding: 16px;
    background: #fbfcfe;
  }

  .home-admin-form-section h3 {
    font-size: 17px;
    line-height: 1.15;
    text-transform: uppercase;
  }

  .home-admin-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .home-admin-field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .home-admin-field.is-wide {
    grid-column: 1 / -1;
  }

  .home-admin-field span {
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-field input,
  .home-admin-field select,
  .home-admin-field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cfd8e3;
    border-radius: 7px;
    background: #fff;
    color: #10151b;
    font: inherit;
    padding: 10px 11px;
  }

  .home-admin-field textarea {
    min-height: 88px;
    resize: vertical;
  }

  .home-admin-save-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .home-admin-save-row p {
    max-width: 760px;
    color: #687380;
    font-size: 13px;
    line-height: 1.45;
  }

  .home-admin-save-row button {
    min-height: 42px;
    border: 0;
    border-radius: 7px;
    background: #10151b;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 900;
    padding: 0 18px;
    text-transform: uppercase;
  }

  .home-admin-feature {
    display: grid;
    grid-template-columns: minmax(180px, 0.36fr) minmax(0, 0.64fr);
    gap: 16px;
    padding: 20px;
    min-width: 0;
  }

  .home-admin-media {
    min-height: 180px;
    max-height: 260px;
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

  .home-admin-side-feature {
    grid-template-columns: minmax(118px, 0.32fr) minmax(0, 0.68fr);
    gap: 14px;
  }

  .home-admin-side-feature .home-admin-media {
    min-height: 112px;
    max-height: 148px;
  }

  .home-admin-side-feature h3 {
    font-size: 20px;
    line-height: 1.12;
  }

  .home-admin-side-feature p {
    font-size: 14px;
    line-height: 1.4;
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
    max-height: 150px;
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
    min-width: 0;
  }

  .home-admin-list li:last-child {
    border-bottom: 0;
  }

  .home-admin-list strong {
    font-size: 15px;
    line-height: 1.25;
  }

  .home-admin-list.is-compact li {
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 10px 12px;
    align-items: start;
  }

  .home-admin-list.is-compact .home-admin-row-media {
    grid-row: span 3;
  }

  .home-admin-row-media {
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: 6px;
    background: #e5ebf2;
  }

  .home-admin-row-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .home-admin-row-media .home-admin-placeholder {
    min-height: 100%;
    padding: 8px;
    font-size: 10px;
  }

  .home-admin-muted-card {
    border-left: 3px solid #d7dee8;
    background: #f8fafc;
  }

  .home-admin-muted-card strong {
    color: #64748b;
  }

  .home-admin-empty-group {
    display: grid;
    gap: 6px;
    border-left: 3px solid #d7dee8;
    background: #f8fafc;
    color: #475569;
  }

  .home-admin-empty-group strong {
    color: #334155;
  }

  .home-admin-empty-group small {
    min-width: 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.35;
  }

  .home-admin-detail-list {
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr);
    gap: 8px 12px;
    margin: 14px 0 0;
    min-width: 0;
  }

  .home-admin-list .home-admin-detail-list,
  .home-admin-card .home-admin-detail-list {
    grid-template-columns: 1fr;
    gap: 4px;
    margin-top: 6px;
  }

  .home-admin-detail-list dt {
    color: #7b8591;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-detail-list dd {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-admin-empty {
    padding: 18px 20px;
    color: #687380;
    font-size: 14px;
    line-height: 1.45;
  }

  .home-admin-link-out {
    display: inline-block;
    max-width: min(100%, 44ch);
    color: #10151b;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
    white-space: nowrap;
    text-decoration: none;
  }

  .home-admin-link-out:hover {
    text-decoration: underline;
  }

  .home-admin-code {
    display: inline-block;
    max-width: min(100%, 32ch);
    border-radius: 4px;
    background: #f1f5f9;
    color: #334155;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 11px;
    overflow: hidden;
    padding: 2px 5px;
    text-overflow: ellipsis;
    vertical-align: bottom;
    white-space: nowrap;
  }

  .home-admin-compact-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .home-admin-featured-match-list li {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 8px 12px;
    align-items: center;
    padding: 10px 16px;
  }

  .home-admin-featured-match-list strong {
    font-size: 13px;
  }

  .home-admin-featured-match-list .home-admin-code {
    max-width: 24ch;
  }

  .home-admin-featured-games {
    margin-top: 18px;
  }

  .home-admin-featured-games-form {
    display: grid;
    gap: 18px;
    padding: 20px;
  }

  .home-admin-game-row small {
    color: #64748b;
    font-size: 12px;
    line-height: 1.35;
  }

  .home-admin-game-filter-form {
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #fbfcfe;
    padding: 14px;
  }

  .home-admin-game-selection-form {
    display: grid;
    gap: 14px;
  }

  .home-admin-game-filter-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 12px;
    align-items: end;
  }

  .home-admin-game-filter-grid label {
    display: grid;
    gap: 6px;
    color: #334155;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-game-filter-grid select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #e6ebf1;
    background: #fff;
    border-radius: 7px;
    color: #10151b;
    font-size: 14px;
    padding: 10px 11px;
  }

  .home-admin-game-filter-grid button {
    min-height: 41px;
    border: 0;
    border-radius: 7px;
    background: #10151b;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;
    padding: 0 16px;
    text-transform: uppercase;
  }

  .home-admin-game-context {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #fff;
    padding: 12px 14px;
  }

  .home-admin-game-context strong {
    margin-right: 4px;
  }

  .home-admin-game-context span {
    border-radius: 999px;
    background: #eef2f6;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    padding: 5px 9px;
  }

  .home-admin-game-list {
    display: grid;
    gap: 0;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .home-admin-game-row {
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr) 78px 92px;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #eef2f6;
    background: #fff;
  }

  .home-admin-game-row:last-child {
    border-bottom: 0;
  }

  .home-admin-game-row.is-selected {
    background: #f0fdf4;
  }

  .home-admin-game-check {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    color: #10151b;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .home-admin-game-check input {
    width: 18px;
    height: 18px;
    accent-color: #e5252a;
  }

  .home-admin-game-main {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .home-admin-game-main strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-admin-game-score {
    justify-self: center;
    min-width: 56px;
    border-radius: 6px;
    padding: 6px 8px;
    background: #eef2f6;
    color: #10151b;
    font-size: 13px;
    font-weight: 900;
    text-align: center;
  }

  .home-admin-game-order {
    display: grid;
    gap: 4px;
  }

  .home-admin-game-order span {
    color: #64748b;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .home-admin-game-order input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    padding: 7px 8px;
  }

  .home-admin-zone-shell {
    margin-top: 18px;
  }

  .home-admin-zone-radio {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .home-admin-zone-layout {
    display: grid;
    grid-template-columns: 270px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }

  .home-admin-zone-menu {
    position: sticky;
    top: 18px;
    display: grid;
    gap: 8px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #fff;
    padding: 10px;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.08);
  }

  .home-admin-zone-menu label {
    cursor: pointer;
    display: grid;
    gap: 3px;
    border-radius: 7px;
    padding: 11px 12px;
    color: #10151b;
    font-size: 13px;
  }

  .home-admin-zone-menu strong {
    font-size: 13px;
    line-height: 1.15;
  }

  .home-admin-zone-menu span {
    color: #687380;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .home-admin-zone-panel {
    display: none;
  }

  .home-admin-zone-form {
    display: contents;
  }

  .home-admin-zone-panels {
    min-width: 0;
  }

  #home-zone-games:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="games"],
  #home-zone-headline:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="headline"],
  #home-zone-side:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="side"],
  #home-zone-complement:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="complement"],
  #home-zone-highlights:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="highlights"],
  #home-zone-roundup:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="roundup"],
  #home-zone-latest:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="latest"],
  #home-zone-diagnostic:checked ~ .home-admin-zone-layout .home-admin-zone-panel[data-zone="diagnostic"] {
    display: block;
  }

  #home-zone-games:checked ~ .home-admin-zone-layout label[for="home-zone-games"],
  #home-zone-headline:checked ~ .home-admin-zone-layout label[for="home-zone-headline"],
  #home-zone-side:checked ~ .home-admin-zone-layout label[for="home-zone-side"],
  #home-zone-complement:checked ~ .home-admin-zone-layout label[for="home-zone-complement"],
  #home-zone-highlights:checked ~ .home-admin-zone-layout label[for="home-zone-highlights"],
  #home-zone-roundup:checked ~ .home-admin-zone-layout label[for="home-zone-roundup"],
  #home-zone-latest:checked ~ .home-admin-zone-layout label[for="home-zone-latest"],
  #home-zone-diagnostic:checked ~ .home-admin-zone-layout label[for="home-zone-diagnostic"] {
    background: #10151b;
    color: #fff;
  }

  #home-zone-games:checked ~ .home-admin-zone-layout label[for="home-zone-games"] span,
  #home-zone-headline:checked ~ .home-admin-zone-layout label[for="home-zone-headline"] span,
  #home-zone-side:checked ~ .home-admin-zone-layout label[for="home-zone-side"] span,
  #home-zone-complement:checked ~ .home-admin-zone-layout label[for="home-zone-complement"] span,
  #home-zone-highlights:checked ~ .home-admin-zone-layout label[for="home-zone-highlights"] span,
  #home-zone-roundup:checked ~ .home-admin-zone-layout label[for="home-zone-roundup"] span,
  #home-zone-latest:checked ~ .home-admin-zone-layout label[for="home-zone-latest"] span,
  #home-zone-diagnostic:checked ~ .home-admin-zone-layout label[for="home-zone-diagnostic"] span {
    color: #cbd5e1;
  }

  .home-admin-selected-summary {
    display: grid;
    gap: 10px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #fbfcfe;
    padding: 14px;
  }

  .home-admin-selected-summary strong {
    font-size: 15px;
  }

  .home-admin-selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .home-admin-selected-chip {
    display: inline-flex;
    max-width: 260px;
    min-height: 28px;
    align-items: center;
    border-radius: 999px;
    background: #eef2f6;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    overflow: hidden;
    padding: 0 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1100px) {
    .home-admin-grid,
    .home-admin-feature,
    .home-admin-card-grid,
    .home-admin-form-grid,
    .home-admin-game-filter-grid,
    .home-admin-zone-layout {
      grid-template-columns: 1fr;
    }

    .home-admin-zone-menu {
      position: static;
    }
  }

  @media (max-width: 760px) {
    .home-admin-shell {
      padding: 16px;
    }

    .home-admin-hero,
    .home-admin-panel > header,
    .home-admin-detail-list,
    .home-admin-list.is-compact li,
    .home-admin-game-row {
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
    return <span className="home-admin-meta">Sem link</span>;
  }

  return (
    <a className="home-admin-link-out" href={cleanValue} title={cleanValue}>
      {cleanValue}
    </a>
  );
}

function codeValue(value: string | number | null | undefined, fallback = "Sem valor") {
  const cleanValue = typeof value === "number" ? String(value) : value?.trim();

  if (!cleanValue) {
    return <span className="home-admin-meta">{fallback}</span>;
  }

  return (
    <code className="home-admin-code" title={cleanValue}>
      {cleanValue}
    </code>
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

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function matchStatusLabel(match: HomeMatch) {
  if (match.status === "live") {
    return match.minute ? `Ao vivo ${match.minute}'` : "Ao vivo";
  }

  if (match.status === "halftime") return "Intervalo";
  if (match.status === "finished") return "Finalizado";
  if (match.status === "postponed") return "Adiado";
  if (match.status === "cancelled") return "Cancelado";

  return "Agendado";
}

function matchScoreLabel(match: HomeMatch) {
  if (typeof match.home_score === "number" && typeof match.away_score === "number") {
    return `${match.home_score}-${match.away_score}`;
  }

  return "vs";
}

function teamLabel(team: HomeTeam | undefined, fallback: string) {
  return textValue(team?.short_name, team?.name, fallback);
}

function matchTitle(match: HomeMatch, teamsById: Map<string, HomeTeam>) {
  return `${teamLabel(teamsById.get(match.home_team_id), "Casa")} vs ${teamLabel(teamsById.get(match.away_team_id), "Fora")}`;
}

function selectedSortOrder(featuredMatches: SiteFeaturedMatch[]) {
  return new Map(
    featuredMatches
      .filter((item): item is SiteFeaturedMatch & { match_id: string } => Boolean(item.match_id))
      .map((item) => [item.match_id, item.sort_order])
  );
}

function selectedMatchSet(featuredMatches: SiteFeaturedMatch[]) {
  return new Set(featuredMatches.map((item) => item.match_id).filter((value): value is string => Boolean(value)));
}

function hasContent(...values: Array<string | number | null | undefined>) {
  return values.some((value) => {
    if (typeof value === "number") {
      return true;
    }

    return Boolean(value?.trim());
  });
}

function compactStateLabel(status: string | null | undefined, hasItemContent: boolean) {
  if (hasItemContent) {
    return null;
  }

  return status?.trim().toLowerCase() === "draft" ? "Rascunho vazio" : "Item sem conteudo";
}

function emptyGroupLabel(count: number) {
  return count === 1 ? "1 rascunho vazio" : `${count} rascunhos vazios`;
}

function sortOrderList(items: Array<{ sort_order: number | null }>) {
  const values = items.map((item) => item.sort_order).filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return "sem posicao definida";
  }

  return `posicoes ${values.join(", ")}`;
}

function roundupHasReadableContent(item: SiteEditorialRoundupItem) {
  return hasContent(item.title, item.subtitle, item.label, item.image_url, item.video_url, item.duration);
}

function latestNewsHasReadableContent(item: SiteEditorialLatestNews) {
  return hasContent(item.title, item.image_url, item.link_url, item.time_label);
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

function inputValue(value: string | null | undefined) {
  return value ?? "";
}

function TextField({
  label,
  name,
  value,
  placeholder,
  wide = false
}: {
  label: string;
  name: string;
  value: string | null | undefined;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <label className={`home-admin-field${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      <input name={name} defaultValue={inputValue(value)} placeholder={placeholder} />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  placeholder
}: {
  label: string;
  name: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  return (
    <label className="home-admin-field is-wide">
      <span>{label}</span>
      <textarea name={name} defaultValue={inputValue(value)} placeholder={placeholder} />
    </label>
  );
}

function StatusField({ label, name, value }: { label: string; name: string; value: string | null | undefined }) {
  return (
    <label className="home-admin-field">
      <span>{label}</span>
      <select name={name} defaultValue={value === "published" ? "published" : "draft"}>
        <option value="draft">draft</option>
        <option value="published">published</option>
      </select>
    </label>
  );
}

function pageMessage(params: Awaited<NonNullable<PageProps["searchParams"]>>) {
  if (params.featured_saved) {
    return { type: "success" as const, text: "Selecao de jogos da barra da Home guardada em site_featured_matches." };
  }

  if (params.saved) {
    return { type: "success" as const, text: "Dados principais da Home guardados em site_editorials." };
  }

  const messages: Record<string, string> = {
    "invalid-action": "A acao pedida nao existe.",
    "missing-home-editorial": "Nao foi encontrado o registo site_editorials com slug home.",
    "invalid-status": "Estado invalido. Use draft ou published.",
    "invalid-color": "Cor invalida. Use formato hex, por exemplo #10151b.",
    "missing-selection-set": "Nao foi possivel guardar: a lista de jogos disponiveis nao chegou ao servidor.",
    "invalid-featured-match": "A selecao contem um jogo invalido ou que ja nao existe.",
    "empty-featured-selection": "Por seguranca, esta fase nao guarda uma selecao vazia. Mantem pelo menos um jogo selecionado.",
    "required-field": "O Supabase recusou a gravacao por campo obrigatorio em falta.",
    constraint: "O Supabase recusou a gravacao por constraint da tabela.",
    permission: "O Supabase recusou a gravacao por permissoes.",
    "save-failed": "Nao foi possivel guardar os dados principais da Home."
  };

  if (!params.error) {
    return null;
  }

  const base = messages[params.error] ?? "Nao foi possivel guardar os dados principais da Home.";
  return { type: "error" as const, text: params.detail ? `${base} Detalhe: ${params.detail}` : base };
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

async function readHomeGameSelectionData(): Promise<HomeGameSelectionData> {
  try {
    const [competitions, seasons, matchdays, matches, teams, broadcastChannels] = await Promise.all([
      fetchSupabaseAdminTable<HomeCompetition>(
        "competitions?select=id,name,slug,country,logo_url,is_active&order=name.asc"
      ),
      fetchSupabaseAdminTable<HomeSeason>(
        "seasons?select=id,competition_id,label,starts_on,ends_on,is_current&order=label.desc"
      ),
      fetchSupabaseAdminTable<HomeMatchday>(
        "matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc"
      ),
      fetchSupabaseAdminTable<HomeMatch>(
        "matches?select=id,competition_id,season_id,matchday_id,home_team_id,away_team_id,status,minute,kickoff_at,home_score,away_score,venue,broadcast_channel_id&order=kickoff_at.asc&limit=1000"
      ),
      fetchSupabaseAdminTable<HomeTeam>("teams?select=id,name,short_name,logo_url&order=name.asc"),
      fetchSupabaseAdminTable<HomeBroadcastChannel>("broadcast_channels?select=id,name,logo_url&order=name.asc")
    ]);

    return {
      competitions,
      seasons,
      matchdays,
      matches,
      teams,
      broadcastChannels,
      error: null
    };
  } catch (error) {
    return {
      competitions: [],
      seasons: [],
      matchdays: [],
      matches: [],
      teams: [],
      broadcastChannels: [],
      error: error instanceof Error ? error.message : "Nao foi possivel ler os jogos reais para selecao da Home."
    };
  }
}

export default async function AdminEditorialHomePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { editorial, highlights, latestNews, roundupItems, featuredMatches, error } = await readHomeEditorialData();
  const gameSelection = await readHomeGameSelectionData();
  const visibleRoundupItems = roundupItems.filter(roundupHasReadableContent);
  const emptyRoundupItems = roundupItems.filter((item) => !roundupHasReadableContent(item));
  const visibleLatestNews = latestNews.filter(latestNewsHasReadableContent);
  const emptyLatestNews = latestNews.filter((item) => !latestNewsHasReadableContent(item));
  const message = pageMessage(params);
  const teamsById = new Map(gameSelection.teams.map((team) => [team.id, team]));
  const matchesById = new Map(gameSelection.matches.map((match) => [match.id, match]));
  const selectedIds = selectedMatchSet(featuredMatches);
  const selectedOrderByMatchId = selectedSortOrder(featuredMatches);
  const selectedFeaturedMatches = [...featuredMatches]
    .filter((item): item is SiteFeaturedMatch & { match_id: string } => Boolean(item.match_id))
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const matchdaysBySeason = new Map<string, HomeMatchday[]>();
  const matchesByMatchday = new Map<string, HomeMatch[]>();

  for (const matchday of gameSelection.matchdays) {
    const list = matchdaysBySeason.get(matchday.season_id) ?? [];
    list.push(matchday);
    matchdaysBySeason.set(matchday.season_id, list);
  }

  for (const match of gameSelection.matches) {
    if (!match.matchday_id) {
      continue;
    }

    const list = matchesByMatchday.get(match.matchday_id) ?? [];
    list.push(match);
    matchesByMatchday.set(match.matchday_id, list);
  }

  const selectedMatchForDefault = selectedFeaturedMatches
    .map((item) => matchesById.get(item.match_id))
    .find((match): match is HomeMatch => Boolean(match));
  const competitionIdsWithMatches = new Set(gameSelection.matches.map((match) => match.competition_id));
  const competitionsForFilter = gameSelection.competitions.filter((competition) => competitionIdsWithMatches.has(competition.id));
  const requestedCompetitionId = params.home_competition_id ?? "";
  const selectedCompetitionId = competitionsForFilter.some((competition) => competition.id === requestedCompetitionId)
    ? requestedCompetitionId
    : selectedMatchForDefault && competitionIdsWithMatches.has(selectedMatchForDefault.competition_id)
      ? selectedMatchForDefault.competition_id
      : competitionsForFilter[0]?.id ?? "";
  const seasonIdsWithMatches = new Set(
    gameSelection.matches
      .filter((match) => match.competition_id === selectedCompetitionId)
      .map((match) => match.season_id)
  );
  const seasonsForSelectedCompetition = gameSelection.seasons.filter(
    (season) => season.competition_id === selectedCompetitionId && seasonIdsWithMatches.has(season.id)
  );
  const requestedSeasonId = params.home_season_id ?? "";
  const selectedSeasonId = seasonsForSelectedCompetition.some((season) => season.id === requestedSeasonId)
    ? requestedSeasonId
    : selectedMatchForDefault &&
        selectedMatchForDefault.competition_id === selectedCompetitionId &&
        seasonsForSelectedCompetition.some((season) => season.id === selectedMatchForDefault.season_id)
      ? selectedMatchForDefault.season_id
      : seasonsForSelectedCompetition.find((season) => season.is_current)?.id ?? seasonsForSelectedCompetition[0]?.id ?? "";
  const matchdaysForSelectedSeason = (matchdaysBySeason.get(selectedSeasonId) ?? []).filter(
    (matchday) => (matchesByMatchday.get(matchday.id)?.length ?? 0) > 0
  );
  const requestedMatchdayId = params.home_matchday_id ?? "";
  const selectedMatchdayId = matchdaysForSelectedSeason.some((matchday) => matchday.id === requestedMatchdayId)
    ? requestedMatchdayId
    : selectedMatchForDefault &&
        selectedMatchForDefault.season_id === selectedSeasonId &&
        selectedMatchForDefault.matchday_id &&
        matchdaysForSelectedSeason.some((matchday) => matchday.id === selectedMatchForDefault.matchday_id)
      ? selectedMatchForDefault.matchday_id
      : matchdaysForSelectedSeason[0]?.id ?? "";
  const selectedCompetition = gameSelection.competitions.find((competition) => competition.id === selectedCompetitionId);
  const selectedSeason = gameSelection.seasons.find((season) => season.id === selectedSeasonId);
  const selectedMatchday = gameSelection.matchdays.find((matchday) => matchday.id === selectedMatchdayId);
  const filteredGames = selectedMatchdayId ? matchesByMatchday.get(selectedMatchdayId) ?? [] : [];
  const filteredGameIds = new Set(filteredGames.map((match) => match.id));
  const selectedFeaturedMatchesOutsideFilter = selectedFeaturedMatches.filter(
    (item) => matchesById.has(item.match_id) && !filteredGameIds.has(item.match_id)
  );

  return (
    <main className="home-admin-shell">
      <style>{homeEditorialStyles}</style>
      <div className="home-admin-container">
        <section className="home-admin-hero">
          <div>
            <p className="home-admin-eyebrow">Jornada.pt</p>
            <h1>Home Editorial</h1>
            <span>
              Edicao controlada da Home Editorial nas tabelas site_*. A Home publica / ainda nao foi ligada a site_* e
              continua no modelo antigo/contextual.
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
          Esta pagina edita a Home Editorial, mas a Home publica / ainda nao foi ligada a site_*. Os campos principais
          gravam site_editorials; os jogos gravam apenas site_featured_matches.
        </div>

        {error ? <div className="home-admin-error">Erro ao ler site_*: {error}</div> : null}
        {!error && !editorial ? (
          <div className="home-admin-error">Nao foi encontrado registo em site_editorials com slug=&quot;home&quot;.</div>
        ) : null}
        {message ? (
          <div className={message.type === "success" ? "home-admin-success" : "home-admin-error"}>{message.text}</div>
        ) : null}

        <section className="home-admin-zone-shell">
          <input className="home-admin-zone-radio" defaultChecked id="home-zone-games" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-headline" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-side" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-complement" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-highlights" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-roundup" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-latest" name="home-zone" type="radio" />
          <input className="home-admin-zone-radio" id="home-zone-diagnostic" name="home-zone" type="radio" />

          <div className="home-admin-zone-layout">
            <aside className="home-admin-zone-menu" aria-label="Zonas da Home Editorial">
              <label htmlFor="home-zone-games">
                <strong>Jogos da barra da Home</strong>
                <span>{selectedFeaturedMatches.length} selecionados</span>
              </label>
              <label htmlFor="home-zone-headline">
                <strong>Manchete principal</strong>
                <span>{statusText(editorial?.status)}</span>
              </label>
              <label htmlFor="home-zone-side">
                <strong>Bloco lateral</strong>
                <span>{statusText(editorial?.side_block_status)}</span>
              </label>
              <label htmlFor="home-zone-complement">
                <strong>Complemento</strong>
                <span>{statusText(editorial?.complementary_status)}</span>
              </label>
              <label htmlFor="home-zone-highlights">
                <strong>Destaques abaixo da manchete</strong>
                <span>{highlights.length} itens</span>
              </label>
              <label htmlFor="home-zone-roundup">
                <strong>Videos / Resumo / Roundup</strong>
                <span>{roundupItems.length} itens</span>
              </label>
              <label htmlFor="home-zone-latest">
                <strong>Ultimas noticias / Ao minuto</strong>
                <span>{latestNews.length} itens</span>
              </label>
              <label htmlFor="home-zone-diagnostic">
                <strong>Diagnostico / leitura</strong>
                <span>fontes site_*</span>
              </label>
            </aside>

            <div className="home-admin-zone-panels">
              <section className="home-admin-zone-panel home-admin-panel home-admin-featured-games" data-zone="games">
                <header>
                  <div>
                    <h2>Jogos da barra da Home</h2>
                    <p>
                      Primeira zona operacional da Home Editorial. Grava apenas a selecao em site_featured_matches; a Home
                      publica / ainda nao usa esta selecao.
                    </p>
                  </div>
                  <span className="home-admin-source">site_featured_matches</span>
                </header>
                {gameSelection.error ? (
                  <div className="home-admin-error">Erro ao ler jogos reais: {gameSelection.error}</div>
                ) : gameSelection.matches.length > 0 ? (
                  <div className="home-admin-featured-games-form">
                    <div className="home-admin-selected-summary">
                      <strong>{selectedFeaturedMatches.length} jogos selecionados para a barra da Home</strong>
                      {selectedFeaturedMatches.length > 0 ? (
                        <div className="home-admin-selected-chips" aria-label="Jogos selecionados">
                          {selectedFeaturedMatches.slice(0, 10).map((item) => {
                            const match = matchesById.get(item.match_id);

                            return (
                              <span className="home-admin-selected-chip" key={item.id ?? item.match_id}>
                                {item.sort_order ?? "-"} - {match ? matchTitle(match, teamsById) : item.match_id}
                              </span>
                            );
                          })}
                          {selectedFeaturedMatches.length > 10 ? (
                            <span className="home-admin-selected-chip">+{selectedFeaturedMatches.length - 10} jogos</span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="home-admin-empty" style={{ padding: 0 }}>
                          Ainda nao ha jogos selecionados.
                        </p>
                      )}
                    </div>

                    <form className="home-admin-game-filter-form" action="/admin/editorial/home" method="get">
                      <div className="home-admin-game-filter-grid">
                        <label>
                          Competicao
                          <select name="home_competition_id" defaultValue={selectedCompetitionId}>
                            {competitionsForFilter.length > 0 ? null : <option value="">Sem competicoes com jogos</option>}
                            {competitionsForFilter.map((competition) => (
                              <option key={competition.id} value={competition.id}>
                                {competition.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Epoca
                          <select name="home_season_id" defaultValue={selectedSeasonId}>
                            {seasonsForSelectedCompetition.length > 0 ? null : <option value="">Sem epocas com jogos</option>}
                            {seasonsForSelectedCompetition.map((season) => (
                              <option key={season.id} value={season.id}>
                                {season.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Jornada
                          <select name="home_matchday_id" defaultValue={selectedMatchdayId}>
                            {matchdaysForSelectedSeason.length > 0 ? null : <option value="">Sem jornadas com jogos</option>}
                            {matchdaysForSelectedSeason.map((matchday) => (
                              <option key={matchday.id} value={matchday.id}>
                                J{matchday.number} - {matchday.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button type="submit">Ver jogos</button>
                      </div>
                    </form>

                    <form className="home-admin-game-selection-form" action="/api/admin/editorial/home" method="post">
                      <input type="hidden" name="action_type" value="update_featured_matches" />
                      <div className="home-admin-game-context">
                        <strong>Contexto visivel</strong>
                        <span>{selectedCompetition?.name ?? "Sem competicao"}</span>
                        <span>{selectedSeason?.label ?? "Sem epoca"}</span>
                        <span>
                          {selectedMatchday ? `J${selectedMatchday.number} - ${selectedMatchday.label}` : "Sem jornada"}
                        </span>
                        <span>{filteredGames.length} jogos</span>
                      </div>

                      {gameSelection.matches.map((match) => (
                        <input key={match.id} type="hidden" name="available_match_id" value={match.id} />
                      ))}
                      {selectedFeaturedMatchesOutsideFilter.map((item) => (
                        <input key={`selected-${item.match_id}`} type="hidden" name="featured_match_id" value={item.match_id} />
                      ))}
                      {selectedFeaturedMatchesOutsideFilter.map((item) => (
                        <input
                          key={`order-${item.match_id}`}
                          type="hidden"
                          name={`featured_order_${item.match_id}`}
                          value={typeof item.sort_order === "number" ? item.sort_order : ""}
                        />
                      ))}

                      {filteredGames.length > 0 ? (
                        <div className="home-admin-game-list">
                          {filteredGames.map((match) => {
                            const selected = selectedIds.has(match.id);
                            const orderValue = selectedOrderByMatchId.get(match.id);

                            return (
                              <article className={`home-admin-game-row${selected ? " is-selected" : ""}`} key={match.id}>
                                <label className="home-admin-game-check">
                                  <input
                                    defaultChecked={selected}
                                    name="featured_match_id"
                                    type="checkbox"
                                    value={match.id}
                                  />
                                  <span>Selecionar</span>
                                </label>
                                <div className="home-admin-game-main">
                                  <strong>{matchTitle(match, teamsById)}</strong>
                                  <small>
                                    {formatDateTime(match.kickoff_at)} | {matchStatusLabel(match)}
                                    {match.venue ? ` | ${match.venue}` : ""}
                                  </small>
                                </div>
                                <span className="home-admin-game-score">{matchScoreLabel(match)}</span>
                                <label className="home-admin-game-order">
                                  <span>Ordem</span>
                                  <input
                                    min={1}
                                    name={`featured_order_${match.id}`}
                                    placeholder="auto"
                                    type="number"
                                    defaultValue={typeof orderValue === "number" ? orderValue : ""}
                                  />
                                </label>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="home-admin-empty">
                          Escolhe uma competicao, epoca e jornada com jogos para editar a selecao visivel.
                        </p>
                      )}

                      <div className="home-admin-save-row">
                        <p>
                          Esta acao grava apenas site_featured_matches. Nao altera jogos, competicoes, epocas, jornadas,
                          classificacao, Home publica ou ResultsRail.
                        </p>
                        <button type="submit">Guardar jogos da barra da Home</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <p className="home-admin-empty">Nao ha jogos reais disponiveis para selecao.</p>
                )}
              </section>

              {editorial ? (
                <form className="home-admin-zone-form" action="/api/admin/editorial/home" method="post">
                  <input type="hidden" name="action_type" value="update_site_editorial_home" />
                  <input type="hidden" name="site_editorial_id" value={editorial.id} />

                  <section className="home-admin-zone-panel home-admin-panel" data-zone="headline">
                    <header>
                      <div>
                        <h2>Manchete principal</h2>
                        <p>Atualiza apenas os campos principais da manchete em site_editorials.slug=home.</p>
                      </div>
                      <span className="home-admin-source">site_editorials</span>
                    </header>
                    <div className="home-admin-edit-form">
                      <section className="home-admin-form-section">
                        <h3>Conteudo da manchete</h3>
                        <div className="home-admin-form-grid">
                          <TextField label="Titulo" name="headline_title" value={editorial.headline_title} wide />
                          <TextAreaField label="Subtitulo" name="headline_subtitle" value={editorial.headline_subtitle} />
                          <TextField label="Imagem" name="headline_image_url" value={editorial.headline_image_url} wide />
                          <TextField label="Link" name="headline_link_url" value={editorial.headline_link_url} wide />
                          <TextField label="Cor do titulo" name="headline_title_color" value={editorial.headline_title_color} placeholder="#10151b" />
                          <StatusField label="Estado geral" name="status" value={editorial.status} />
                        </div>
                      </section>
                      <div className="home-admin-save-row">
                        <p>Guarda a tabela-mae site_editorials. Nao altera a Home publica /.</p>
                        <button type="submit">Guardar dados principais</button>
                      </div>
                    </div>
                  </section>

                  <section className="home-admin-zone-panel home-admin-panel" data-zone="side">
                    <header>
                      <div>
                        <h2>Bloco lateral</h2>
                        <p>Edita o snapshot editorial lateral guardado em site_editorials.</p>
                      </div>
                      <span className="home-admin-source">site_editorials</span>
                    </header>
                    <div className="home-admin-edit-form">
                      <section className="home-admin-form-section">
                        <h3>Conteudo do bloco lateral</h3>
                        <div className="home-admin-form-grid">
                          <TextField label="Tipo" name="side_block_type" value={editorial.side_block_type} />
                          <TextField label="Etiqueta" name="side_block_label" value={editorial.side_block_label} />
                          <TextField label="Titulo" name="side_block_title" value={editorial.side_block_title} wide />
                          <TextAreaField label="Texto" name="side_block_text" value={editorial.side_block_text} />
                          <TextField label="Autor" name="side_block_author" value={editorial.side_block_author} />
                          <StatusField label="Estado" name="side_block_status" value={editorial.side_block_status} />
                          <TextField label="Imagem" name="side_block_image_url" value={editorial.side_block_image_url} wide />
                          <TextField label="Link" name="side_block_link_url" value={editorial.side_block_link_url} wide />
                          <TextField label="Cor do titulo" name="side_block_title_color" value={editorial.side_block_title_color} placeholder="#10151b" />
                        </div>
                      </section>
                      <div className="home-admin-save-row">
                        <p>Guarda a tabela-mae site_editorials. Nao edita tabelas filhas.</p>
                        <button type="submit">Guardar bloco lateral</button>
                      </div>
                    </div>
                  </section>

                  <section className="home-admin-zone-panel home-admin-panel" data-zone="complement">
                    <header>
                      <div>
                        <h2>Complemento</h2>
                        <p>Edita o complemento da manchete guardado em site_editorials.</p>
                      </div>
                      <span className="home-admin-source">site_editorials</span>
                    </header>
                    <div className="home-admin-edit-form">
                      <section className="home-admin-form-section">
                        <h3>Conteudo do complemento</h3>
                        <div className="home-admin-form-grid">
                          <TextField label="Modo" name="complementary_mode" value={editorial.complementary_mode} />
                          <TextField label="Etiqueta" name="complementary_label" value={editorial.complementary_label} />
                          <TextField label="Titulo" name="complementary_title" value={editorial.complementary_title} wide />
                          <TextAreaField label="Texto" name="complementary_text" value={editorial.complementary_text} />
                          <TextField label="Imagem" name="complementary_image_url" value={editorial.complementary_image_url} wide />
                          <TextField label="Link" name="complementary_link_url" value={editorial.complementary_link_url} wide />
                          <StatusField label="Estado" name="complementary_status" value={editorial.complementary_status} />
                          <TextField
                            label="Roundup item"
                            name="complementary_roundup_item_id"
                            value={editorial.complementary_roundup_item_id}
                            placeholder="UUID do item de roundup"
                          />
                        </div>
                      </section>
                      <div className="home-admin-save-row">
                        <p>Guarda a tabela-mae site_editorials. Nao edita roundup_items.</p>
                        <button type="submit">Guardar complemento</button>
                      </div>
                    </div>
                  </section>

                  <section className="home-admin-zone-panel home-admin-panel" data-zone="diagnostic">
                    <header>
                      <div>
                        <h2>Diagnostico / leitura</h2>
                        <p>Zona compacta para cabecalhos/modos e leitura tecnica das fontes site_*.</p>
                      </div>
                      <span className="home-admin-source">site_*</span>
                    </header>
                    <div className="home-admin-edit-form">
                      <section className="home-admin-form-section">
                        <h3>Cabecalhos e modos</h3>
                        <div className="home-admin-form-grid">
                          <TextField label="Modo abaixo da manchete" name="below_headline_mode" value={editorial.below_headline_mode} />
                          <TextField label="Titulo abaixo da manchete" name="below_headline_heading" value={editorial.below_headline_heading} />
                          <TextField
                            label="Cor do titulo abaixo da manchete"
                            name="below_headline_heading_color"
                            value={editorial.below_headline_heading_color}
                            placeholder="#10151b"
                          />
                          <TextField label="Titulo roundup/video" name="roundup_video_heading" value={editorial.roundup_video_heading} />
                          <TextField
                            label="Cor titulo roundup/video"
                            name="roundup_video_heading_color"
                            value={editorial.roundup_video_heading_color}
                            placeholder="#10151b"
                          />
                        </div>
                      </section>
                      <section className="home-admin-form-section">
                        <h3>Resumo de leitura</h3>
                        <DetailList
                          rows={[
                            ["site_editorials", editorial.id ? codeValue(editorial.id) : "Sem registo"],
                            ["site_editorial_highlights", `${highlights.length} itens`],
                            ["site_editorial_latest_news", `${latestNews.length} itens`],
                            ["site_editorial_roundup_items", `${roundupItems.length} itens`],
                            ["site_featured_matches", `${featuredMatches.length} jogos`]
                          ]}
                        />
                        {featuredMatches.length > 0 ? (
                          <ul className="home-admin-list home-admin-featured-match-list">
                            {featuredMatches.map((item, index) => (
                              <li key={item.id ?? `${item.match_id}-${index}`}>
                                <span className="home-admin-meta">posicao {item.sort_order ?? "-"}</span>
                                <strong>{codeValue(item.match_id, "Sem match_id")}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                      <div className="home-admin-save-row">
                        <p>Guarda apenas os modos/cabecalhos em site_editorials. A Home publica continua intacta.</p>
                        <button type="submit">Guardar cabecalhos e modos</button>
                      </div>
                    </div>
                  </section>
                </form>
              ) : null}

              <section className="home-admin-zone-panel home-admin-panel" data-zone="highlights">
                <header>
                  <div>
                    <h2>Destaques abaixo da manchete</h2>
                    <p>Leitura apenas de site_editorial_highlights. Esta fase nao cria edicao desta tabela filha.</p>
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

              <section className="home-admin-zone-panel home-admin-panel" data-zone="roundup">
                <header>
                  <div>
                    <h2>Videos / resumo / roundup</h2>
                    <p>Leitura apenas de site_editorial_roundup_items. Rascunhos vazios continuam agrupados.</p>
                  </div>
                  <span className="home-admin-source">{roundupItems.length} itens</span>
                </header>
                {roundupItems.length > 0 ? (
                  <ul className="home-admin-list is-compact">
                    {visibleRoundupItems.map((item) => {
                      const itemHasContent = roundupHasReadableContent(item);
                      const emptyLabel = compactStateLabel(item.status, itemHasContent);

                      return (
                        <li className={itemHasContent ? undefined : "home-admin-muted-card"} key={item.id}>
                          <div className="home-admin-row-media">
                            <MediaPreview label={textValue(item.title, "Roundup")} src={item.image_url} />
                          </div>
                          <div className="home-admin-compact-meta">
                            <span className="home-admin-meta">
                              {item.sort_order ?? "-"} | {textValue(item.type, "sem tipo")}
                            </span>
                            <StatusPill status={item.status} />
                            {item.duration ? <span className="home-admin-pill">{item.duration}</span> : null}
                          </div>
                          <strong>{emptyLabel ?? textValue(item.title, "Item sem conteudo")}</strong>
                          {itemHasContent ? <p>{textValue(item.subtitle, item.label, "Sem texto adicional.")}</p> : null}
                          <DetailList rows={[["Video", fieldLink(item.video_url)]]} />
                        </li>
                      );
                    })}
                    {emptyRoundupItems.length > 0 ? (
                      <li className="home-admin-empty-group">
                        <div className="home-admin-compact-meta">
                          <StatusPill status="draft" />
                          <span className="home-admin-meta">{sortOrderList(emptyRoundupItems)}</span>
                        </div>
                        <strong>{emptyGroupLabel(emptyRoundupItems.length)}</strong>
                        <small>Itens sem titulo, imagem, video ou texto editorial relevante. Mantidos como diagnostico.</small>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="home-admin-empty">Sem itens de video/resumo para apresentar.</p>
                )}
              </section>

              <section className="home-admin-zone-panel home-admin-panel" data-zone="latest">
                <header>
                  <div>
                    <h2>Ultimas noticias / ao minuto</h2>
                    <p>Leitura apenas de site_editorial_latest_news, incluindo draft ou vazios.</p>
                  </div>
                  <span className="home-admin-source">{latestNews.length} itens</span>
                </header>
                {latestNews.length > 0 ? (
                  <ul className="home-admin-list is-compact">
                    {visibleLatestNews.map((item) => {
                      const itemHasContent = latestNewsHasReadableContent(item);
                      const emptyLabel = compactStateLabel(item.status, itemHasContent);

                      return (
                        <li className={itemHasContent ? undefined : "home-admin-muted-card"} key={item.id}>
                          <div className="home-admin-row-media">
                            <MediaPreview label={textValue(item.title, "Ultima noticia")} src={item.image_url} />
                          </div>
                          <div className="home-admin-compact-meta">
                            <span className="home-admin-meta">
                              {item.sort_order ?? "-"} | {textValue(item.time_label, "sem hora")}
                            </span>
                            <StatusPill status={item.status} />
                          </div>
                          <strong>{emptyLabel ?? textValue(item.title, "Item sem conteudo")}</strong>
                          <DetailList rows={[["Link", fieldLink(item.link_url)]]} />
                        </li>
                      );
                    })}
                    {emptyLatestNews.length > 0 ? (
                      <li className="home-admin-empty-group">
                        <div className="home-admin-compact-meta">
                          <StatusPill status="draft" />
                          <span className="home-admin-meta">{sortOrderList(emptyLatestNews)}</span>
                        </div>
                        <strong>{emptyGroupLabel(emptyLatestNews.length)}</strong>
                        <small>Itens sem hora, titulo, imagem ou link. Mantidos como diagnostico.</small>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="home-admin-empty">Sem ultimas noticias para apresentar.</p>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
