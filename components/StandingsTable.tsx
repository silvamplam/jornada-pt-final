import type { Standing } from "@/lib/jornada";
import { getTeam } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type StandingsTableProps = {
  standing: Standing;
};

function splitRecord(row: Standing["rows"][number]) {
  const homePlayed = Math.ceil(row.played / 2);
  const awayPlayed = Math.max(row.played - homePlayed, 0);
  const homeWins = Math.min(homePlayed, Math.ceil(row.wins / 2));
  const awayWins = row.wins - homeWins;
  const homeDraws = Math.min(Math.max(homePlayed - homeWins, 0), Math.ceil(row.draws / 2));
  const awayDraws = row.draws - homeDraws;
  const homeLosses = Math.max(homePlayed - homeWins - homeDraws, 0);
  const awayLosses = Math.max(awayPlayed - awayWins - awayDraws, 0);

  return {
    home: `${homeWins}-${homeDraws}-${homeLosses}`,
    away: `${awayWins}-${awayDraws}-${awayLosses}`
  };
}

function formForRow(row: Standing["rows"][number]) {
  const values = [
    ...Array(row.wins).fill("V"),
    ...Array(row.draws).fill("E"),
    ...Array(row.losses).fill("D")
  ].slice(0, 5);

  return values.length ? values : ["-"];
}

function efficiency(row: Standing["rows"][number]) {
  const possible = row.played * 3;

  if (!possible) return "0%";

  return `${Math.round((row.points / possible) * 100)}%`;
}

export function StandingsTable({ standing }: StandingsTableProps) {
  return (
    <section className="panel table-panel" aria-label={`Classificação: ${standing.momentLabel}`}>
      <header className="panel-heading">
        <h2>Classificação</h2>
      </header>
      <div className="table-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipa</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GM</th>
              <th>GS</th>
              <th>DG</th>
              <th>Casa</th>
              <th>Fora</th>
              <th>Forma</th>
              <th>Aprov.</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standing.rows.map((row, index) => {
              const team = getTeam(row.teamId);
              const record = splitRecord(row);
              const form = formForRow(row);

              return (
                <tr key={row.teamId}>
                  <td>{index + 1}</td>
                  <td>
                    <TeamBadge team={team} />
                    {team.name}
                  </td>
                  <td>{row.played}</td>
                  <td>{row.wins}</td>
                  <td>{row.draws}</td>
                  <td>{row.losses}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td>
                    <span className="record-pill">{record.home}</span>
                  </td>
                  <td>
                    <span className="record-pill">{record.away}</span>
                  </td>
                  <td>
                    <span className="form-strip" aria-label={`Forma: ${form.join(", ")}`}>
                      {form.map((item, formIndex) => (
                        <i className={`form-chip form-${item}`} key={`${row.teamId}-${formIndex}`}>
                          {item}
                        </i>
                      ))}
                    </span>
                  </td>
                  <td>{efficiency(row)}</td>
                  <td>
                    <strong>{row.points}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
