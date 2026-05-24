import { buildAccumulatedClassification, STAT_COLUMNS, totalClassificationStats, type ClassificationSplit } from "@/lib/classification";
import { getPublicMatchdayDiagnostic, seasonLabelToUrlSegment, type PublicMatchdayDiagnostic, type PublicSeasonMatch } from "@/lib/public-matchday";

export const dynamic = "force-dynamic";

type PublicMatchdayPageProps = {
  params: Promise<{
    competitionSlug: string;
    seasonLabel: string;
    matchdayNumber: string;
  }>;
};

const publicMatchdayStyles = `
  body {
    margin: 0;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .public-matchday-shell {
    min-height: 100vh;
    padding: 28px;
  }

  .public-matchday-hero,
  .public-matchday-panel {
    border: 1px solid #dde4ec;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 28px rgba(12, 22, 34, 0.08);
  }

  .public-matchday-hero {
    padding: 28px;
    background: #10151b;
    color: #ffffff;
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
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .public-matchday-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .public-matchday-panel {
    margin-top: 18px;
    overflow: hidden;
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
    gap: 12px;
    padding: 20px;
  }

  .public-matchday-card {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 14px;
    align-items: center;
    padding: 16px;
    border: 1px solid #e3e9f0;
    border-radius: 8px;
    background: #ffffff;
  }

  .public-matchday-team:last-child {
    text-align: right;
  }

  .public-matchday-team strong,
  .public-matchday-score strong {
    display: block;
    font-size: 18px;
  }

  .public-matchday-team small,
  .public-matchday-score small {
    display: block;
    margin-top: 4px;
    color: #66717f;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .public-matchday-score {
    min-width: 120px;
    text-align: center;
  }

  .public-matchday-score strong {
    font-size: 22px;
  }

  .public-matchday-meta {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: #607086;
    font-size: 13px;
  }

  .public-matchday-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 18px 20px;
  }

  .public-matchday-nav a,
  .public-matchday-nav span {
    display: inline-block;
    padding: 9px 12px;
    border: 1px solid #cfd8e3;
    border-radius: 999px;
    background: #ffffff;
    color: #263241;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .public-matchday-nav a[aria-current="page"] {
    border-color: #e5252a;
    background: #e5252a;
    color: #ffffff;
  }

  .public-table-wrap {
    overflow-x: auto;
    padding: 20px;
  }

  .public-table {
    width: 100%;
    min-width: 1200px;
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
    min-width: 180px;
    text-align: left;
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

  @media (max-width: 760px) {
    .public-matchday-shell {
      padding: 16px;
    }

    .public-matchday-hero h1 {
      font-size: 32px;
    }

    .public-matchday-card {
      grid-template-columns: 1fr;
      text-align: left;
    }

    .public-matchday-team:last-child,
    .public-matchday-score {
      text-align: left;
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

function statusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "finished") return "Finalizado";
  if (normalized === "scheduled") return "Agendado";
  if (normalized === "postponed") return "Adiado";
  if (normalized === "cancelled") return "Cancelado";
  return status;
}

function matchResult(match: PublicSeasonMatch) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  if (match.status !== "finished" || !hasScore) {
    return "vs";
  }

  return `${match.home_score}-${match.away_score}`;
}

function renderStatsCells(stats: ClassificationSplit, options: { divider?: boolean; emphasizePoints?: boolean; group?: string } = {}) {
  return STAT_COLUMNS.map((column, index) => {
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
  return STAT_COLUMNS.map((column, index) => (
    <th className={index === 0 ? "public-table-divider" : undefined} key={`${group}-${column.key}`}>
      {column.label}
    </th>
  ));
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

export default async function PublicMatchdayPage({ params }: PublicMatchdayPageProps) {
  const { competitionSlug, seasonLabel, matchdayNumber } = await params;
  const matchdayNumberValue = Number(matchdayNumber);
  const { context, diagnostic } = await getPublicMatchdayDiagnostic({
    competitionSlug,
    seasonLabel,
    matchdayNumber: matchdayNumberValue
  });

  if (!context) {
    return <DiagnosticPanel diagnostic={diagnostic} />;
  }

  const seasonSegment = seasonLabelToUrlSegment(context.season.label);
  const previousMatchday = context.matchdays.filter((item) => item.number < context.matchday.number).at(-1) ?? null;
  const nextMatchday = context.matchdays.find((item) => item.number > context.matchday.number) ?? null;
  const classificationRows = buildAccumulatedClassification({
    participants: context.participants,
    matches: context.matchesForSeason,
    matchdays: context.matchdays,
    selectedMatchday: context.matchday
  });
  const matchdayHref = (number: number) => `/competicoes/${context.competition.slug}/${seasonSegment}/jornadas/${number}`;

  return (
    <main className="public-matchday-shell">
      <style>{publicMatchdayStyles}</style>
      <section className="public-matchday-hero">
        <p>{context.competition.name}</p>
        <h1>{context.matchday.label}</h1>
        <span>
          {context.season.label} / Jornada {context.matchday.number}
        </span>
      </section>

      <section className="public-matchday-panel" aria-label="Navegacao de jornadas">
        <header>
          <h2>Jornadas da época</h2>
          <p>Escolhe outra jornada desta competição.</p>
        </header>
        <nav className="public-matchday-nav">
          {previousMatchday ? <a href={matchdayHref(previousMatchday.number)}>Jornada anterior</a> : <span>Sem anterior</span>}
          {nextMatchday ? <a href={matchdayHref(nextMatchday.number)}>Jornada seguinte</a> : <span>Sem seguinte</span>}
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
      </section>

      <section className="public-matchday-panel" aria-label="Jogos da jornada">
        <header>
          <h2>Jogos da jornada</h2>
          <p>{context.matchesForMatchday.length} jogos nesta jornada.</p>
        </header>
        <div className="public-matchday-list">
          {context.matchesForMatchday.length === 0 ? (
            <p>Ainda não há jogos nesta jornada.</p>
          ) : (
            context.matchesForMatchday.map((match) => (
              <article className="public-matchday-card" key={match.id}>
                <div className="public-matchday-team">
                  <strong>{match.homeTeam?.name ?? "Equipa da casa"}</strong>
                  <small>Casa</small>
                </div>
                <div className="public-matchday-score">
                  <strong>{matchResult(match)}</strong>
                  <small>{statusLabel(match.status)}</small>
                </div>
                <div className="public-matchday-team">
                  <strong>{match.awayTeam?.name ?? "Equipa visitante"}</strong>
                  <small>Fora</small>
                </div>
                <div className="public-matchday-meta">
                  <span>{formatKickoff(match.kickoff_at)}</span>
                  {match.venue ? <span>{match.venue}</span> : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="public-matchday-panel" aria-label="Classificacao acumulada">
        <header>
          <h2>Classificação da jornada</h2>
          <p>Tabela acumulada até à Jornada {context.matchday.number}, usando apenas jogos finalizados.</p>
        </header>
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th rowSpan={2}>Pos</th>
                <th className="public-table-club" rowSpan={2}>Clube</th>
                <th className="public-table-divider" colSpan={STAT_COLUMNS.length}>Total</th>
                <th className="public-table-divider" colSpan={STAT_COLUMNS.length}>Casa</th>
                <th className="public-table-divider" colSpan={STAT_COLUMNS.length}>Fora</th>
                <th rowSpan={2}>Últ. 4</th>
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
                  <td className="public-table-club">{row.name}</td>
                  {renderStatsCells(totalClassificationStats(row), { divider: true, emphasizePoints: true, group: "total" })}
                  {renderStatsCells(row.home, { divider: true, group: "home" })}
                  {renderStatsCells(row.away, { divider: true, group: "away" })}
                  <td>
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
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
