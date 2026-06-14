import type { HomeContext } from "@/lib/jornada";
import type { PublicHomeEditorialOverlay } from "@/lib/public-home-editorial";
import { GoalsList } from "@/components/GoalsList";
import { HeroHeadline } from "@/components/HeroHeadline";
import { InstitutionalStrip } from "@/components/InstitutionalStrip";
import { LatestList } from "@/components/LatestList";
import { NewsGrid } from "@/components/NewsGrid";
import { ResultsRail } from "@/components/ResultsRail";
import { StandingsTable } from "@/components/StandingsTable";
import { UpcomingMatches } from "@/components/UpcomingMatches";

type HomeDashboardProps = {
  context: HomeContext;
  editorial?: PublicHomeEditorialOverlay | null;
};

export function HomeDashboard({ context, editorial = null }: HomeDashboardProps) {
  const upcoming = [
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(0, 1)),
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(1))
  ].slice(0, 6);
  const topicArticles = editorial?.sideBlock
    ? [editorial.sideBlock, ...context.topArticles].slice(0, 4)
    : context.topArticles.slice(0, 4);
  const featuredArticles = editorial?.highlights.length ? editorial.highlights : context.topArticles.slice(1, 5);
  const resultsMatches = editorial?.featuredMatches.length ? editorial.featuredMatches : context.mixedMatches.slice(0, 6);
  const headline = editorial?.headline ?? context.featured.headline;
  const headlineMatch = editorial?.headlineMatch ?? context.featured.headlineMatch;
  const latestArticles = editorial?.latestNews.length ? editorial.latestNews : context.topArticles;
  const latestTitle = editorial ? editorial.latestZoneTitle ?? "" : undefined;

  return (
    <div className="home-reference">
      <ResultsRail matches={resultsMatches} title="Resultados principais" />

      <div className="home-reference-grid">
        <aside className="panel home-topic-panel" aria-label="Tema atual">
          <header className="panel-heading">
            <h2>Tema atual</h2>
          </header>
          <div className="home-topic-list">
            {topicArticles.map((article) => (
              <a className="home-topic-item" href={article.sourceUrl ?? "#"} key={article.id}>
                <img src={article.image} alt="" aria-hidden="true" />
                <span>
                  <strong>{article.title}</strong>
                  <small>{article.dek}</small>
                </span>
              </a>
            ))}
          </div>
          <a className="panel-link" href="#">
            Ver mais temas
          </a>
        </aside>

        <main className="main-column home-main-column">
          <HeroHeadline
            competition={context.featured.competition}
            headline={headline}
            label={`${context.featured.matchday.label} · ${context.featured.season.label}`}
            match={headlineMatch}
          />
          <NewsGrid
            articles={featuredArticles}
            competitions={context.competitions}
            title={editorial?.highlightsTitle ?? "Em destaque"}
          />
          {editorial?.complement ? (
            <NewsGrid articles={[editorial.complement]} competitions={context.competitions} compact title="" />
          ) : null}
          {editorial?.roundupItems.length ? (
            <NewsGrid
              articles={editorial.roundupItems}
              competitions={context.competitions}
              compact
              title={editorial.roundupTitle ?? "Resumo"}
            />
          ) : null}
        </main>

        <aside className="home-right-column">
          <LatestList
            articles={latestArticles}
            competitions={context.competitions}
            title={latestTitle}
            titleColor={editorial?.latestZoneTitleColor}
          />
          <GoalsList goals={context.goals} />
        </aside>
      </div>

      <section className="home-lower-grid">
        <StandingsTable standing={context.featured.standing} />
        <UpcomingMatches matches={upcoming} />
      </section>

      <InstitutionalStrip />

      <footer className="site-footer">
        <a className="footer-brand" href="/">
          Jornada<span>.pt</span>
        </a>
        <nav aria-label="Links do Jornada.pt">
          <a href="#">Sobre nós</a>
          <a href="#">Estatísticas</a>
          <a href="#">Competições</a>
          <a href="#">API</a>
          <a href="#">Contactos</a>
          <a href="#">Ajuda</a>
        </nav>
        <small>Privacy Policy</small>
        <small>Termos de uso</small>
      </footer>
    </div>
  );
}
