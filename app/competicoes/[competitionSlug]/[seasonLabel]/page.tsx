import { notFound } from "next/navigation";
import { getPublicSeasonContext, seasonLabelToUrlSegment } from "@/lib/public-matchday";

export const dynamic = "force-dynamic";

type PublicSeasonPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
  }>;
};

const publicSeasonStyles = `
  body {
    margin: 0;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-season-shell {
    min-height: 100vh;
    padding: 28px;
  }

  .public-season-hero,
  .public-season-panel {
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-season-hero {
    padding: 28px;
    background: #10151b;
    color: #ffffff;
  }

  .public-season-hero p,
  .public-season-hero h1 {
    margin: 0;
  }

  .public-season-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .public-season-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .public-season-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .public-season-panel {
    margin-top: 18px;
    overflow: hidden;
  }

  .public-season-panel header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
    background: #f8fafc;
  }

  .public-season-panel h2,
  .public-season-panel p {
    margin: 0;
  }

  .public-season-panel h2 {
    font-size: 24px;
    text-transform: uppercase;
  }

  .public-season-panel p {
    margin-top: 6px;
    color: #607086;
  }

  .public-season-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
    padding: 20px;
  }

  .public-season-card {
    display: grid;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.16s ease, transform 0.16s ease;
  }

  .public-season-card:hover {
    border-color: #e5252a;
    transform: translateY(-1px);
  }

  .public-season-card strong {
    display: block;
    font-size: 18px;
  }

  .public-season-card small {
    display: block;
    margin-top: 4px;
    color: #657386;
    font-weight: 800;
  }

  .public-season-card-footer {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: #485568;
    font-size: 13px;
    font-weight: 800;
  }

  .public-season-empty {
    padding: 20px;
    color: #607086;
  }

  @media (max-width: 720px) {
    .public-season-shell {
      padding: 16px;
    }

    .public-season-hero h1 {
      font-size: 32px;
    }
  }
`;

function matchdayLabel(number: number, label: string | null) {
  return label?.trim() || `Jornada ${String(number).padStart(2, "0")}`;
}

export default async function PublicSeasonPage({ params }: PublicSeasonPageProps) {
  const { competitionSlug, seasonLabel } = await params;
  const context = await getPublicSeasonContext({ competitionSlug, seasonLabel });

  if (!context) {
    notFound();
  }

  const seasonUrlLabel = seasonLabelToUrlSegment(context.season.label);

  return (
    <main className="public-season-shell">
      <style>{publicSeasonStyles}</style>
      <section className="public-season-hero">
        <p>{context.competition.name}</p>
        <h1>{context.season.label}</h1>
        <span>{context.matchdays.length} jornadas disponíveis</span>
      </section>

      <section className="public-season-panel">
        <header>
          <h2>Jornadas</h2>
          <p>Escolhe uma jornada para ver jogos, resultados e classificação acumulada.</p>
        </header>
        {context.matchdays.length > 0 ? (
          <div className="public-season-grid">
            {context.matchdays.map((matchday) => (
              <a
                className="public-season-card"
                href={`/competicoes/${context.competition.slug}/${seasonUrlLabel}/jornadas/${matchday.number}`}
                key={matchday.id}
              >
                <div>
                  <strong>Jornada {String(matchday.number).padStart(2, "0")}</strong>
                  <small>{matchdayLabel(matchday.number, matchday.label)}</small>
                </div>
                <div className="public-season-card-footer">
                  <span>{matchday.matchCount} jogos</span>
                  <span>{matchday.finishedMatchCount} finalizados</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="public-season-empty">Ainda não há jornadas disponíveis para esta época.</div>
        )}
      </section>
    </main>
  );
}
