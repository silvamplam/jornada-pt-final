import type { Article, Competition } from "@/lib/jornada";

type NewsGridProps = {
  articles: Article[];
  competitions?: Competition[];
  compact?: boolean;
  title?: string;
};

export function NewsGrid({ articles, competitions = [], compact = false, title = "Notícias" }: NewsGridProps) {
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition.name]));
  const hasTitle = title.trim().length > 0;

  return (
    <section className="panel news-panel" aria-label={hasTitle ? title : "Notícias"}>
      {hasTitle ? (
        <header className="panel-heading">
          <h2>{title}</h2>
        </header>
      ) : null}
      <div className="news-line">
        <button className="news-arrow" type="button" aria-label="Notícias anteriores">
          ‹
        </button>
        <div className={compact ? "news-list news-list-compact" : "news-list"}>
          {articles.map((article) => (
            <article className="news-card" key={article.id}>
              <div className="news-media">
                <img src={article.image} alt="" aria-hidden="true" />
              </div>
              <div>
                <p className="article-meta">
                  <span>{competitionById.get(article.competitionId) ?? article.category}</span>
                  {article.publishedAtMoment}
                </p>
                <h3>
                  <a href={article.sourceUrl ?? "#"}>{article.title}</a>
                </h3>
                <p>{article.dek}</p>
              </div>
            </article>
          ))}
        </div>
        <button className="news-arrow" type="button" aria-label="Notícias seguintes">
          ›
        </button>
      </div>
    </section>
  );
}
