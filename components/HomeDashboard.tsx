import type { HomeContext } from "@/lib/jornada";
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
};

export function HomeDashboard({ context }: HomeDashboardProps) {
  const upcoming = [
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(0, 1)),
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(1))
  ].slice(0, 6);
  const topicArticles = context.topArticles.slice(0, 4);
  const featuredArticles = context.topArticles.slice(1, 5);

  return (
    <div className="home-reference">
      <ResultsRail matches={context.mixedMatches.slice(0, 6)} title="Resultados principais" />

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
            headline={context.featured.headline}
            label={`${context.featured.matchday.label} · ${context.featured.season.label}`}
            match={context.featured.headlineMatch}
          />
          <NewsGrid articles={featuredArticles} competitions={context.competitions} title="Em destaque" />
        </main>

        <aside className="home-right-column">
          <LatestList articles={context.topArticles} competitions={context.competitions} />
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
