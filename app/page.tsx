import Link from "next/link";
import { PublicEditorialLayout, type PublicEditorialHighlight, type PublicEditorialLatestNews } from "@/components/public/PublicEditorialLayout";
import { publicEditorialStyles } from "@/components/public/publicEditorialStyles";
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
  const publicHighlights: PublicEditorialHighlight[] = visibleHighlights.slice(0, 3).map((item) => ({
    id: item.id,
    label: item.label,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.image_url,
    linkUrl: item.link_url
  }));
  const publicLatestNews: PublicEditorialLatestNews[] = latestNews.map((item) => ({
    id: item.id,
    timeLabel: item.time_label,
    title: item.title || "Noticia",
    imageUrl: item.image_url,
    linkUrl: item.link_url
  }));

  return (
    <main className="public-matchday-shell">
      <style>{publicEditorialStyles}</style>
      <div className="public-top-stack">
      <header className="public-site-topbar" aria-label="Topo do Jornada.pt">
        <Link className="public-site-brand" href="/" aria-label="Jornada.pt">
          Jornada<span>.pt</span>
        </Link>
        <nav className="public-site-menu" aria-label="CompetiÃ§Ãµes principais">
          {competitionLinks.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#jogos">Jogos</Link>
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#classificacao">Classificacao</Link>
        </nav>
        <div className="public-site-actions" aria-label="Acoes">
          <span className="public-site-search" aria-label="Pesquisar">Pesquisar</span>
          <Link href="/admin/login">Entrar</Link>
        </div>
      </header>
      </div>

      <PublicEditorialLayout
        ariaLabel="Capa da jornada"
        sideBlock={{
          isPublished: hasPublishedSideBlock,
          label: sideBlockLabel,
          title: sideBlockTitle,
          titleColor: sideBlockTitleColor,
          author: sideBlockAuthor,
          text: sideBlockText,
          imageUrl: sideBlockImageUrl,
          linkUrl: sideBlockLinkUrl,
          placeholder: "Espaco editorial por definir"
        }}
        headline={{
          title: headlineTitle,
          subtitle: headlineSubtitle,
          imageUrl: headlineImageUrl,
          titleColor: headlineTitleColor,
          fallbackTitle: "Jornada.pt",
          fallbackSubtitle: "A capa editorial do futebol, pronta para acompanhar os grandes temas antes, durante e depois dos jogos."
        }}
        belowHeadline={{
          mode: belowHeadlineMode,
          label: belowHeadlineHeading,
          labelColor: belowHeadlineHeadingColor,
          highlights: publicHighlights,
          roundupItems,
          showRoundupVideo: hasRoundupVideoBlock,
          roundupHeading: editorial?.roundup_video_heading ?? null,
          roundupHeadingColor: editorial?.roundup_video_heading_color ?? null,
          initialRoundupItemId: editorial?.complementary_roundup_item_id ?? null,
          complementary: {
            isPublished: Boolean(hasComplementaryStory && editorial),
            label: editorial?.complementary_label ?? null,
            title: editorial?.complementary_title ?? null,
            text: editorial?.complementary_text ?? null,
            imageUrl: editorial?.complementary_image_url ?? null,
            linkUrl: editorial?.complementary_link_url ?? null,
            fallbackTitle: "Leitura editorial",
            fallbackText: "O complemento da capa fica reservado para a proxima historia publicada."
          }
        }}
        latestNews={publicLatestNews}
        latestNewsTitle="Últimas notícias"
      />
    </main>
  );
}
