import {
  applyBroadcastOverridesToHomeContext,
  formatKickoff,
  getHomeContext,
  getScoreLabel,
  type Article,
  type ResolvedMatch
} from "@/lib/jornada";
import { getPublicBroadcastOverrides } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const editorialHomeStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .editorial-home-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .editorial-home-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .editorial-home-hero p,
  .editorial-home-hero h1,
  .editorial-home-panel h2,
  .editorial-home-panel h3,
  .editorial-home-panel p,
  .editorial-home-card h3,
  .editorial-home-card p {
    margin: 0;
  }

  .editorial-home-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-home-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .editorial-home-hero span {
    display: block;
    margin-top: 10px;
    max-width: 720px;
    color: #cdd5df;
    font-size: 16px;
  }

  .editorial-home-actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }

  .editorial-home-actions a,
  .editorial-home-link {
    display: inline-block;
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
  }

  .editorial-home-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin-top: 18px;
  }

  .editorial-home-stack {
    display: grid;
    gap: 18px;
  }

  .editorial-home-panel {
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .editorial-home-panel > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .editorial-home-panel h2 {
    font-size: 21px;
    text-transform: uppercase;
  }

  .editorial-home-panel header p {
    margin-top: 6px;
    color: #687380;
    font-size: 14px;
    line-height: 1.4;
  }

  .editorial-home-source {
    flex: 0 0 auto;
    color: #e5252a;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .editorial-home-featured {
    display: grid;
    grid-template-columns: minmax(220px, 0.42fr) minmax(0, 0.58fr);
    gap: 18px;
    padding: 20px;
  }

  .editorial-home-featured img,
  .editorial-home-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .editorial-home-media {
    min-height: 230px;
    overflow: hidden;
    border-radius: 8px;
    background: #dce3eb;
  }

  .editorial-home-kicker,
  .editorial-home-meta {
    color: #e5252a;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-home-featured h2 {
    margin-top: 8px;
    font-size: 30px;
    line-height: 1.04;
    text-transform: none;
  }

  .editorial-home-featured p {
    margin-top: 10px;
    color: #4d5763;
    line-height: 1.45;
  }

  .editorial-home-featured .editorial-home-link,
  .editorial-home-card .editorial-home-link {
    margin-top: 14px;
    border-color: #10151b;
    background: #10151b;
    color: #ffffff;
  }

  .editorial-home-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 20px;
  }

  .editorial-home-card {
    overflow: hidden;
    border: 1px solid #e6ebf1;
    border-radius: 8px;
    background: #ffffff;
  }

  .editorial-home-card-media {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #dce3eb;
  }

  .editorial-home-card-body {
    padding: 14px;
  }

  .editorial-home-card h3 {
    margin-top: 6px;
    font-size: 17px;
    line-height: 1.16;
  }

  .editorial-home-card h3 a,
  .editorial-home-list a {
    color: inherit;
    text-decoration: none;
  }

  .editorial-home-card h3 a:hover,
  .editorial-home-list a:hover {
    text-decoration: underline;
  }

  .editorial-home-card p {
    margin-top: 8px;
    color: #5b6571;
    font-size: 14px;
    line-height: 1.35;
  }

  .editorial-home-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .editorial-home-list li {
    display: grid;
    gap: 6px;
    padding: 14px 20px;
    border-bottom: 1px solid #eef2f6;
  }

  .editorial-home-list li:last-child {
    border-bottom: 0;
  }

  .editorial-home-list strong {
    font-size: 15px;
    line-height: 1.2;
  }

  .editorial-home-list small {
    color: #7b8591;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-home-match-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }

  .editorial-home-match-row span:first-child {
    text-align: right;
  }

  .editorial-home-match-row b {
    color: #e5252a;
    font-size: 13px;
  }

  .editorial-home-note {
    padding: 18px 20px;
    background: #fff8ee;
    color: #6f4d1d;
    line-height: 1.45;
  }

  @media (max-width: 1040px) {
    .editorial-home-grid,
    .editorial-home-featured,
    .editorial-home-card-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 920px) {
    .editorial-home-shell {
      padding: 16px;
    }

    .editorial-home-hero,
    .editorial-home-panel > header {
      display: grid;
      grid-template-columns: 1fr;
    }

    .editorial-home-actions {
      justify-content: flex-start;
    }
  }
`;

function articleHref(article: Article) {
  return article.sourceUrl ?? "#";
}

function matchLabel(match: ResolvedMatch) {
  return `${match.competition.name} · ${match.matchday.label}`;
}

function matchStatusLabel(match: ResolvedMatch) {
  if (match.status === "live") return match.minute ? `Ao vivo · ${match.minute}'` : "Ao vivo";
  if (match.status === "halftime") return "Intervalo";
  if (match.status === "finished") return "Finalizado";
  return formatKickoff(match.kickoff);
}

export default async function AdminEditorialHomePage() {
  const context = applyBroadcastOverridesToHomeContext(getHomeContext(), await getPublicBroadcastOverrides());
  const topicArticles = context.topArticles.slice(0, 4);
  const featuredArticles = context.topArticles.slice(1, 5);
  const latestArticles = context.topArticles.slice(0, 4);
  const upcoming = [
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(0, 1)),
    ...context.contexts.flatMap((item) => item.upcomingMatches.slice(1))
  ].slice(0, 6);

  return (
    <main className="editorial-home-shell">
      <style>{editorialHomeStyles}</style>
      <section className="editorial-home-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Home Editorial</h1>
          <span>Leitura interna do estado editorial que alimenta a Home pública do Jornada.pt.</span>
        </div>
        <nav className="editorial-home-actions" aria-label="Navegação editorial">
          <a href="/admin">Backoffice</a>
          <a href="/admin/gestor">Centro de Gestão</a>
          <a href="/admin/editorial/artigos">Artigos / Notícias</a>
          <a href="/">Ver Home pública</a>
        </nav>
      </section>

      <div className="editorial-home-grid">
        <div className="editorial-home-stack">
          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Manchete da Home pública</h2>
                <p>Conteúdo actualmente usado por app/page.tsx através de HomeDashboard.</p>
              </div>
              <span className="editorial-home-source">getHomeContext</span>
            </header>
            <div className="editorial-home-featured">
              <div className="editorial-home-media">
                <img alt="" src={context.featured.headline.image} />
              </div>
              <div>
                <span className="editorial-home-kicker">
                  {context.featured.competition.name} · {context.featured.matchday.label} · {context.featured.season.label}
                </span>
                <h2>{context.featured.headline.title}</h2>
                <p>{context.featured.headline.dek}</p>
                {context.featured.headlineMatch ? (
                  <p>
                    Jogo associado: {context.featured.headlineMatch.homeTeam.name} {getScoreLabel(context.featured.headlineMatch)}{" "}
                    {context.featured.headlineMatch.awayTeam.name}
                  </p>
                ) : null}
                <a className="editorial-home-link" href={context.featured.headline.sourceUrl ?? "#"}>
                  Abrir fonte
                </a>
              </div>
            </div>
          </section>

          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Em destaque</h2>
                <p>Mesma selecção editorial usada na grelha de notícias da Home pública.</p>
              </div>
              <span className="editorial-home-source">{featuredArticles.length} itens</span>
            </header>
            <div className="editorial-home-card-grid">
              {featuredArticles.map((article) => (
                <article className="editorial-home-card" key={article.id}>
                  <div className="editorial-home-card-media">
                    <img alt="" src={article.image} />
                  </div>
                  <div className="editorial-home-card-body">
                    <span className="editorial-home-meta">{article.category} · {article.publishedAtMoment}</span>
                    <h3>
                      <a href={articleHref(article)}>{article.title}</a>
                    </h3>
                    <p>{article.dek}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Jogos / resultados principais</h2>
                <p>Resumo competitivo que aparece no topo da Home pública.</p>
              </div>
              <span className="editorial-home-source">{context.mixedMatches.slice(0, 6).length} jogos</span>
            </header>
            <ul className="editorial-home-list">
              {context.mixedMatches.slice(0, 6).map((match) => (
                <li key={match.id}>
                  <small>{matchLabel(match)} · {matchStatusLabel(match)}</small>
                  <div className="editorial-home-match-row">
                    <span>{match.homeTeam.name}</span>
                    <b>{getScoreLabel(match)}</b>
                    <span>{match.awayTeam.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="editorial-home-stack">
          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Tema atual</h2>
                <p>Primeiros artigos usados no painel lateral esquerdo da Home pública.</p>
              </div>
              <span className="editorial-home-source">{topicArticles.length} itens</span>
            </header>
            <ul className="editorial-home-list">
              {topicArticles.map((article) => (
                <li key={article.id}>
                  <small>{article.category} · {article.publishedAtMoment}</small>
                  <strong>
                    <a href={articleHref(article)}>{article.title}</a>
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Últimas notícias / Ao minuto</h2>
                <p>Lista curta usada na coluna direita da Home pública.</p>
              </div>
              <span className="editorial-home-source">{latestArticles.length} itens</span>
            </header>
            <ul className="editorial-home-list">
              {latestArticles.map((article) => (
                <li key={article.id}>
                  <small>{article.publishedAtMoment} · {article.category}</small>
                  <strong>
                    <a href={articleHref(article)}>{article.title}</a>
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="editorial-home-panel">
            <header>
              <div>
                <h2>Próximos jogos</h2>
                <p>Entrada competitiva complementar usada na Home pública.</p>
              </div>
              <span className="editorial-home-source">{upcoming.length} jogos</span>
            </header>
            <ul className="editorial-home-list">
              {upcoming.map((match) => (
                <li key={match.id}>
                  <small>{matchLabel(match)} · {formatKickoff(match.kickoff)}</small>
                  <div className="editorial-home-match-row">
                    <span>{match.homeTeam.name}</span>
                    <b>vs</b>
                    <span>{match.awayTeam.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="editorial-home-panel">
            <div className="editorial-home-note">
              A Home pública não usa uma tabela site_editorials nem um editor autónomo encontrado no código vivo. Esta área mostra os conteúdos reais actualmente publicados pela Home através de getHomeContext.
              A barra de jogos da Home é calculada a partir do modelo contextual antigo, em data/jornada-data.json; a zona operacional viva de jogos fica no <a href="/admin/gestor?section=jogos#jogos">Centro de Gestão</a>, mas não existe ainda um seletor específico para escolher manualmente os jogos da barra da Home.
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
