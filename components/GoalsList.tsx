import type { PlayerGoalTotal } from "@/lib/jornada";
import { TeamBadge } from "@/components/TeamBadge";

type GoalsListProps = {
  goals: PlayerGoalTotal[];
};

export function GoalsList({ goals }: GoalsListProps) {
  return (
    <section className="panel scorers-panel" aria-label="Golos da jornada">
      <header className="panel-heading">
        <h2>Golos da jornada</h2>
      </header>
      <ol className="scorers-list">
        {goals.map((item) => (
          <li key={item.player.id}>
            <b>{item.goals}</b>
            <span>
              <TeamBadge team={item.team} />
              <strong>{item.player.name}</strong>
              <small>{item.team.name}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
