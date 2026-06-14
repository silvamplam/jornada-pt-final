import type { Article, Competition } from "@/lib/jornada";

type LatestListProps = {
  articles: Article[];
  competitions?: Competition[];
  title?: string;
  titleColor?: string | null;
};

export function LatestList({ articles, competitions = [], title = "Ao minuto", titleColor = null }: LatestListProps) {
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition.name]));
  const cleanTitle = title.trim();

  return (
    <section className="panel latest-panel" aria-label={cleanTitle || "Zona editorial final"}>
      {cleanTitle ? (
        <header className="panel-heading panel-heading-tabs">
          <h2 style={titleColor ? { color: titleColor } : undefined}>{cleanTitle}</h2>
        </header>
      ) : null}
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
