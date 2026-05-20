import type { Article, Competition } from "@/lib/jornada";

type LatestListProps = {
  articles: Article[];
  competitions?: Competition[];
};

export function LatestList({ articles, competitions = [] }: LatestListProps) {
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition.name]));

  return (
    <section className="panel latest-panel" aria-label="Ao minuto">
      <header className="panel-heading panel-heading-tabs">
        <h2>Ao minuto</h2>
      </header>
      <ol className="latest-list">
        {articles.slice(0, 4).map((article) => (
          <li key={article.id}>
            <time>{article.publishedAtMoment}</time>
            <div>
              <small>{competitionById.get(article.competitionId) ?? article.category}</small>
              <strong>{article.title}</strong>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
